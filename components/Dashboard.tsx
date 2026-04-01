'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Job, JobStatus } from '@/lib/types';
import StatBar from './StatBar';
import FilterBar, { FilterStatus, SortKey } from './FilterBar';
import JobCard from './JobCard';

const REFRESH_OPTIONS = [
  { label: '5 min', value: 5 * 60 * 1000 },
  { label: '15 min', value: 15 * 60 * 1000 },
  { label: '30 min', value: 30 * 60 * 1000 },
  { label: '1 hr', value: 60 * 60 * 1000 },
  { label: 'Off', value: 0 },
];

function formatLastSynced(date: Date | null): string {
  if (!date) return 'Never';
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  return `${Math.floor(diff / 3600)} hr ago`;
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [sortKey, setSortKey] = useState<SortKey>('last_activity');
  const [refreshInterval, setRefreshInterval] = useState(15 * 60 * 1000);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ['jobs'],
    queryFn: () => fetch('/api/jobs').then((r) => r.json()),
    refetchInterval: refreshInterval || false,
  });

  const syncMutation = useMutation({
    mutationFn: () =>
      fetch('/api/jobs/sync', { method: 'POST' }).then((r) => r.json()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setLastSynced(new Date());
      setSyncMessage(`Synced ${data.synced} emails · ${data.updated} updated · ${data.total} total`);
      setTimeout(() => setSyncMessage(null), 5000);
    },
    onError: () => {
      setSyncMessage('Sync failed. Check console for details.');
      setTimeout(() => setSyncMessage(null), 5000);
    },
  });

  const filteredJobs = jobs
    .filter((j) => filter === 'all' || j.status === filter)
    .sort((a, b) => {
      if (sortKey === 'company') return a.company.localeCompare(b.company);
      const aVal = a[sortKey] ?? '';
      const bVal = b[sortKey] ?? '';
      return bVal.localeCompare(aVal); // newest first
    });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Job Applications</h1>
            <p className="text-sm text-slate-400 mt-1">
              Last synced: {formatLastSynced(lastSynced)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Auto-refresh:</span>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                {REFRESH_OPTIONS.map((o) => (
                  <option key={o.label} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-60 transition-colors"
            >
              {syncMutation.isPending ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Syncing…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync Now
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sync message toast */}
        {syncMessage && (
          <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
            {syncMessage}
          </div>
        )}

        {/* Stats */}
        <StatBar jobs={jobs} />

        {/* Filters */}
        <FilterBar
          activeFilter={filter}
          onFilterChange={setFilter}
          sortKey={sortKey}
          onSortChange={setSortKey}
          total={filteredJobs.length}
        />

        {/* Job Grid */}
        {isLoading ? (
          <div className="text-center py-20 text-slate-400">Loading…</div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 text-sm">
              {jobs.length === 0
                ? 'No applications yet. Click "Sync Now" to load your Gmail data.'
                : 'No applications match this filter.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
