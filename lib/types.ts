export type JobStatus =
  | 'applied'
  | 'under_review'
  | 'action_required'
  | 'interview_scheduled'
  | 'rejected'
  | 'offer';

export interface Job {
  id: string;
  company: string;
  role: string;
  status: JobStatus;
  applied_date: string | null;
  last_activity: string | null;
  gmail_thread_url: string;
  raw_snippet: string | null;
  updated_at: string;
}

export interface SyncResult {
  synced: number;
  updated: number;
  total: number;
}

export const STATUS_PRIORITY: Record<JobStatus, number> = {
  offer: 6,
  interview_scheduled: 5,
  action_required: 4,
  under_review: 3,
  applied: 2,
  rejected: 1,
};
