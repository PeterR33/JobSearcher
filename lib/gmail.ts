import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

export function getOAuthClient(): OAuth2Client {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/api/auth/callback'
  );
  client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
  return client;
}

export interface GmailThread {
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippets: string[];
  latestDate: string;
}

// Targeted query to find real application emails, filtering out job alert noise
const JOB_QUERY = [
  '(',
  // Confirmation / receipt phrases
  '"thank you for applying"',
  'OR "thank you for your application"',
  'OR "application has been received"',
  'OR "application received"',
  'OR "submitted your application"',
  'OR "we received your application"',
  'OR "reviewing your application"',
  'OR "your application for"',
  'OR "application for"',
  'OR "we have received your application"',
  // Status update phrases
  'OR "not moving forward"',
  'OR "not selected"',
  'OR "decided to move"',
  'OR "unable to move forward"',
  'OR "position has been filled"',
  'OR "no longer being considered"',
  // Positive phrases
  'OR "interview"',
  'OR "next steps"',
  'OR "job offer"',
  'OR "offer of employment"',
  'OR "excited to offer"',
  // Broad catch-alls for ATS systems
  'OR "your application"',
  'OR "we reviewed your"',
  ')',
  '-from:glassdoor.com',
  '-from:linkedin.com',
  '-from:ziprecruiter.com',
  '-from:jobs2careers.com',
  '-from:jobcafes.com',
  '-from:jobscave.com',
  '-from:thehustle.co',
  '-from:theneurondaily.com',
  '-from:join1440.com',
  '-from:theflipside.io',
  '-from:neighborhoodalerts.com',
  '-from:indeed.com',
  'after:2025/1/1',
].join(' ');

export async function fetchJobThreads(maxResults = 200): Promise<GmailThread[]> {
  const auth = getOAuthClient();
  const gmail = google.gmail({ version: 'v1', auth });

  // Fetch matching message IDs
  console.log('[gmail] query:', JOB_QUERY);
  const listRes = await gmail.users.messages.list({
    userId: 'me',
    q: JOB_QUERY,
    maxResults,
  });

  const messages = listRes.data.messages ?? [];
  console.log('[gmail] messages returned:', messages.length);
  if (messages.length === 0) return [];

  // Fetch each message's metadata
  const messageDetails = await Promise.all(
    messages.map((m) =>
      gmail.users.messages.get({
        userId: 'me',
        id: m.id!,
        format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'Date'],
      })
    )
  );

  // Group by threadId
  const threadMap = new Map<string, GmailThread>();

  for (const res of messageDetails) {
    const msg = res.data;
    const threadId = msg.threadId!;
    const headers = msg.payload?.headers ?? [];
    const getHeader = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? '';

    const subject = getHeader('Subject');
    const from = getHeader('From');
    const date = getHeader('Date');
    const snippet = msg.snippet ?? '';

    if (!threadMap.has(threadId)) {
      threadMap.set(threadId, {
        threadId,
        subject,
        from,
        date,
        snippets: [snippet],
        latestDate: date,
      });
    } else {
      const existing = threadMap.get(threadId)!;
      existing.snippets.push(snippet);
      // Keep the most recent date as latestDate
      if (new Date(date) > new Date(existing.latestDate)) {
        existing.latestDate = date;
        existing.subject = subject; // Most recent subject
      }
    }
  }

  return Array.from(threadMap.values());
}
