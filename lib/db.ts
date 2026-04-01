import Database from 'better-sqlite3';
import path from 'path';
import { Job, JobStatus, STATUS_PRIORITY } from './types';

const DB_PATH = path.join(process.cwd(), 'jobs.db');

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      company TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL,
      applied_date TEXT,
      last_activity TEXT,
      gmail_thread_url TEXT NOT NULL,
      raw_snippet TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

export function getAllJobs(): Job[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM jobs ORDER BY
        CASE status
          WHEN 'offer' THEN 1
          WHEN 'interview_scheduled' THEN 2
          WHEN 'action_required' THEN 3
          WHEN 'under_review' THEN 4
          WHEN 'applied' THEN 5
          WHEN 'rejected' THEN 6
        END ASC,
        last_activity DESC`
    )
    .all() as Job[];
}

export function upsertJob(job: Omit<Job, 'updated_at'>) {
  const db = getDb();
  const existing = db.prepare('SELECT status FROM jobs WHERE id = ?').get(job.id) as
    | { status: JobStatus }
    | undefined;

  if (existing) {
    // Never downgrade status
    if (STATUS_PRIORITY[job.status] <= STATUS_PRIORITY[existing.status]) {
      // Still update activity date and snippet
      db.prepare(
        `UPDATE jobs SET last_activity = ?, raw_snippet = ?, updated_at = datetime('now') WHERE id = ?`
      ).run(job.last_activity, job.raw_snippet, job.id);
      return false;
    }
  }

  db.prepare(
    `INSERT INTO jobs (id, company, role, status, applied_date, last_activity, gmail_thread_url, raw_snippet, updated_at)
     VALUES (@id, @company, @role, @status, @applied_date, @last_activity, @gmail_thread_url, @raw_snippet, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET
       company = @company,
       role = @role,
       status = @status,
       applied_date = @applied_date,
       last_activity = @last_activity,
       gmail_thread_url = @gmail_thread_url,
       raw_snippet = @raw_snippet,
       updated_at = datetime('now')`
  ).run(job);

  return true;
}

export function getJobCount(): number {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM jobs').get() as { count: number };
  return row.count;
}
