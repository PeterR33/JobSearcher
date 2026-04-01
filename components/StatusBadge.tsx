import { JobStatus } from '@/lib/types';

const STATUS_CONFIG: Record<
  JobStatus,
  { label: string; classes: string; dot?: boolean }
> = {
  applied: {
    label: 'Applied',
    classes: 'bg-blue-100 text-blue-700',
  },
  under_review: {
    label: 'Under Review',
    classes: 'bg-yellow-100 text-yellow-700',
  },
  action_required: {
    label: 'Action Required',
    classes: 'bg-orange-100 text-orange-700',
    dot: true,
  },
  interview_scheduled: {
    label: 'Interview',
    classes: 'bg-emerald-100 text-emerald-700',
    dot: true,
  },
  rejected: {
    label: 'Rejected',
    classes: 'bg-red-100 text-red-500',
  },
  offer: {
    label: '🎉 Offer!',
    classes: 'bg-purple-100 text-purple-700 font-bold',
    dot: true,
  },
};

export default function StatusBadge({ status }: { status: JobStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${config.classes}`}
    >
      {config.dot && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      {config.label}
    </span>
  );
}
