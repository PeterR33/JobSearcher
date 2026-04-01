import { Job, JobStatus } from '@/lib/types';

interface StatBarProps {
  jobs: Job[];
}

interface StatConfig {
  label: string;
  status: JobStatus | 'all';
  color: string;
  bg: string;
}

const STATS: StatConfig[] = [
  { label: 'Total', status: 'all', color: 'text-slate-700', bg: 'bg-slate-100' },
  { label: 'Interviews', status: 'interview_scheduled', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  { label: 'Action Needed', status: 'action_required', color: 'text-orange-700', bg: 'bg-orange-50' },
  { label: 'Pending', status: 'applied', color: 'text-blue-700', bg: 'bg-blue-50' },
  { label: 'Rejected', status: 'rejected', color: 'text-red-700', bg: 'bg-red-50' },
  { label: 'Offers', status: 'offer', color: 'text-purple-700', bg: 'bg-purple-50' },
];

export default function StatBar({ jobs }: StatBarProps) {
  const count = (status: JobStatus | 'all') =>
    status === 'all' ? jobs.length : jobs.filter((j) => j.status === status).length;

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
      {STATS.map(({ label, status, color, bg }) => (
        <div key={label} className={`${bg} rounded-xl p-4 text-center`}>
          <div className={`text-2xl font-bold ${color}`}>{count(status)}</div>
          <div className={`text-xs font-medium mt-1 ${color} opacity-80`}>{label}</div>
        </div>
      ))}
    </div>
  );
}
