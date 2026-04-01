import { Job } from '@/lib/types';
import StatusBadge from './StatusBadge';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function JobCard({ job }: { job: Job }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-3 hover:shadow-md hover:border-slate-300 transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">{job.company}</h3>
          <p className="text-sm text-slate-500 mt-0.5 truncate">{job.role}</p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-400">
        {job.applied_date && (
          <span>
            <span className="font-medium text-slate-500">Applied</span>{' '}
            {formatDate(job.applied_date)}
          </span>
        )}
        {job.last_activity && (
          <span>
            <span className="font-medium text-slate-500">Last update</span>{' '}
            {formatDate(job.last_activity)}
          </span>
        )}
      </div>

      {job.raw_snippet && (
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {job.raw_snippet.replace(/&#39;/g, "'").replace(/&amp;/g, '&')}
        </p>
      )}

      <a
        href={job.gmail_thread_url}
        target="_blank"
        rel="noopener noreferrer"
        className="self-start text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
      >
        View in Gmail →
      </a>
    </div>
  );
}
