'use client';

import { JobStatus } from '@/lib/types';

export type FilterStatus = JobStatus | 'all';
export type SortKey = 'last_activity' | 'applied_date' | 'company';

interface FilterBarProps {
  activeFilter: FilterStatus;
  onFilterChange: (f: FilterStatus) => void;
  sortKey: SortKey;
  onSortChange: (s: SortKey) => void;
  total: number;
}

const FILTERS: { label: string; value: FilterStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'applied' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Action Needed', value: 'action_required' },
  { label: 'Interview', value: 'interview_scheduled' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Offer', value: 'offer' },
];

export default function FilterBar({
  activeFilter,
  onFilterChange,
  sortKey,
  onSortChange,
  total,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => onFilterChange(value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeFilter === value
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span>Sort by</span>
        <select
          value={sortKey}
          onChange={(e) => onSortChange(e.target.value as SortKey)}
          className="border border-slate-200 rounded-lg px-2 py-1 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          <option value="last_activity">Last Activity</option>
          <option value="applied_date">Date Applied</option>
          <option value="company">Company</option>
        </select>
      </div>
    </div>
  );
}
