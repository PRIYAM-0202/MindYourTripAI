import { useMemo, useState } from 'react';
import { Plane, Plus, Search, Filter, LayoutGrid, List } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { TripCard } from './Dashboard';
import { EmptyState } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useTrips } from '@/lib/data';
import { Link, useRouter } from '@/lib/router';
import { cn, daysUntil } from '@/lib/utils';
import type { Trip } from '@/lib/types';

type FilterKey = 'all' | 'upcoming' | 'draft' | 'past';

export function TripsList() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const { trips, loading } = useTrips(user?.id ?? null);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');
  const [grid, setGrid] = useState(true);

  const filtered = useMemo(() => {
    let list = trips;
    if (filter === 'upcoming') list = trips.filter((t) => daysUntil(t.start_date) > 0 && t.status !== 'completed');
    if (filter === 'draft') list = trips.filter((t) => t.status === 'draft');
    if (filter === 'past') list = trips.filter((t) => t.status === 'completed' || new Date(t.end_date) < new Date());
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q) || t.destination.toLowerCase().includes(q));
    }
    return list;
  }, [trips, filter, query]);

  const filters: { key: FilterKey; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: trips.length },
    { key: 'upcoming', label: 'Upcoming', count: trips.filter((t) => daysUntil(t.start_date) > 0 && t.status !== 'completed').length },
    { key: 'draft', label: 'Drafts', count: trips.filter((t) => t.status === 'draft').length },
    { key: 'past', label: 'Past', count: trips.filter((t) => t.status === 'completed' || new Date(t.end_date) < new Date()).length },
  ];

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Your Trips</h1>
          <p className="text-sm text-slate-400 mt-1">Plan, collaborate, and manage all your journeys in one place.</p>
        </div>
        <Link to="/trips/new" className="btn-primary">
          <Plus className="w-4 h-4" /> New Trip
        </Link>
      </div>

      {/* Filters + search */}
      <div className="glass-card p-3 mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="flex gap-1 flex-1 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5',
                filter === f.key
                  ? 'ai-gradient text-white shadow-glow-soft'
                  : 'text-slate-400 hover:text-white hover:bg-white/5',
              )}
            >
              {f.label}
              <span className={cn('text-xs', filter === f.key ? 'text-white/70' : 'text-slate-500')}>{f.count}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search trips..."
              className="input-field pl-9 py-2 text-sm"
            />
          </div>
          <div className="flex gap-1 p-1 rounded-xl bg-ink-900/60">
            <button
              onClick={() => setGrid(true)}
              className={cn('p-1.5 rounded-lg', grid ? 'bg-ai-500/20 text-ai-300' : 'text-slate-400')}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setGrid(false)}
              className={cn('p-1.5 rounded-lg', !grid ? 'bg-ai-500/20 text-ai-300' : 'text-slate-400')}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={cn('grid gap-4', grid ? 'sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1')}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Plane className="w-7 h-7" />}
          title={query ? 'No trips match your search' : 'No trips here yet'}
          subtitle={query ? 'Try a different search term.' : 'Create your first trip and let the AI help plan it.'}
          action={
            <Link to="/trips/new" className="btn-primary">
              <Plus className="w-4 h-4" /> Create Trip
            </Link>
          }
        />
      ) : (
        <div className={cn('grid gap-4', grid ? 'sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1')}>
          {filtered.map((t: Trip) => (
            <TripCard key={t.id} trip={t} onClick={() => navigate(`/trips/${t.id}`)} past={t.status === 'completed' || new Date(t.end_date) < new Date()} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
