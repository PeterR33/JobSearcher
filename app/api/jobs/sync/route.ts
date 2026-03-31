import { NextResponse } from 'next/server';
import { fetchJobThreads } from '@/lib/gmail';
import { classifyThread } from '@/lib/classify';
import { upsertJob, getJobCount } from '@/lib/db';

export const maxDuration = 120; // seconds

export async function POST() {
  try {
    const threads = await fetchJobThreads(50);

    // Classify sequentially to stay under Anthropic's 50 req/min rate limit
    const results: { thread: typeof threads[0]; classification: Awaited<ReturnType<typeof classifyThread>> }[] = [];
    for (const thread of threads) {
      const classification = await classifyThread(thread);
      results.push({ thread, classification });
    }

    let synced = 0;
    let updated = 0;

    for (const { thread, classification } of results) {
      if (!classification) continue;

      synced++;
      const wasUpdated = upsertJob({
        id: thread.threadId,
        company: classification.company,
        role: classification.role,
        status: classification.status,
        applied_date: classification.appliedDate,
        last_activity: thread.latestDate
          ? new Date(thread.latestDate).toISOString().split('T')[0]
          : null,
        gmail_thread_url: `https://mail.google.com/mail/u/0/#inbox/${thread.threadId}`,
        raw_snippet: thread.snippets[thread.snippets.length - 1] ?? null,
      });

      if (wasUpdated) updated++;
    }

    const total = getJobCount();
    return NextResponse.json({ synced, updated, total });
  } catch (error) {
    console.error('Sync failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}
