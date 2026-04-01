import Anthropic from '@anthropic-ai/sdk';
import { GmailThread } from './gmail';
import { JobStatus } from './types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface Classification {
  company: string;
  role: string;
  status: JobStatus;
  appliedDate: string | null;
}

const VALID_STATUSES: JobStatus[] = [
  'applied',
  'under_review',
  'action_required',
  'interview_scheduled',
  'rejected',
  'offer',
];

export async function classifyThread(thread: GmailThread): Promise<Classification | null> {
  const snippetText = thread.snippets
    .slice(0, 5) // max 5 snippets to keep tokens low
    .map((s, i) => `[Email ${i + 1} snippet]: ${s}`)
    .join('\n');

  const prompt = `You are classifying a job application email thread. Based on the email subject and snippets below, extract:
1. company: The company name (not the ATS system like "Workday" or "Lever")
2. role: The job title/role
3. status: One of exactly: applied, under_review, action_required, interview_scheduled, rejected, offer
   - applied: received a confirmation, no further update
   - under_review: explicitly told they are reviewing
   - action_required: asked to complete an assessment, provide documents, schedule something
   - interview_scheduled: invited to or confirmed an interview
   - rejected: explicitly rejected or told not moving forward
   - offer: received a job offer
4. appliedDate: The date the application was submitted (YYYY-MM-DD format, or null if unknown)

Subject: ${thread.subject}
From: ${thread.from}
Date: ${thread.date}
${snippetText}

Respond ONLY with valid JSON matching this shape exactly:
{"company":"...","role":"...","status":"...","appliedDate":"...or null"}

If this does not appear to be a real job application email (e.g. it's a newsletter, alert, or unrelated email), respond with: {"skip":true}`;

  console.log('[classify] subject:', thread.subject, '| from:', thread.from);
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    // Strip markdown code fences if Claude wraps the response
    const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(text);

    if (parsed.skip) {
      console.log('[classify] SKIPPED:', thread.subject);
      return null;
    }

    // Validate status
    const status: JobStatus = VALID_STATUSES.includes(parsed.status)
      ? parsed.status
      : 'applied';

    return {
      company: parsed.company ?? 'Unknown',
      role: parsed.role ?? 'Unknown Role',
      status,
      appliedDate: parsed.appliedDate === 'null' ? null : parsed.appliedDate ?? null,
    };
  } catch (err) {
    console.error('[classify] ERROR for:', thread.subject, err);
    return null;
  }
}
