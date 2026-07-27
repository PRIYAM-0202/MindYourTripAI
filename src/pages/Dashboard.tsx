import { useEffect, useMemo, useState } from 'react';
import {
  Plane,
  Plus,
  Wallet,
  Users,
  Bell,
  Sparkles,
  Calendar,
  MapPin,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  LayoutGrid,
  MessageSquare,
  FileText,
  Brain,
  Compass,
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Avatar, Badge, EmptyState, ProgressBar } from '@/components/ui';
import { AIRecCard } from '@/components/AIRecCard';
import { useAuth } from '@/lib/auth';
import { useTrips, useNotifications } from '@/lib/data';
import { generateRecommendations } from '@/lib/ai';
import { Link, useRouter } from '@/lib/router';
import { cn, daysUntil, formatCurrency, formatDateShort, relativeTime, tripDurationDays } from '@/lib/utils';
import type { AIRecommendation, Trip } from '@/lib/types';

export function Dashboard() {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const { trips, loading } = useTrips(user?.id ?? null);

  const grouped = useMemo(() => {
    const now = new Date();
    return {
      upcoming: trips.filter((t) => t.status === 'upcoming' || (t.status === 'draft' && daysUntil(t.start_date) > 0)),
      draft: trips.filter((t) => t.status === 'draft'),
      past: trips.filter((t) => t.status === 'completed' || new Date(t.end_date) < now),
      invited: [] as Trip[],
    };
  }, [trips]);

  const totalBudget = trips.reduce((s, t) => s + t.estimated_budget, 0);
  const totalSpent = trips.reduce((s, t) => s + t.actual_spent, 0);
  const pendingApprovals = trips.length;

  return (
    <AppShell>
      {/* Hero greeting */}
      <div className="glass-strong rounded-3xl p-6 lg:p-8 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-aurora opacity-40" />
        <div className="absolute -top-20 -right-10 w-72 h-72 rounded-full bg-ai-500/15 blur-[100px]" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-ai-300" />
              <span className="text-xs uppercase tracking-wider text-ai-300 font-medium">
                {greeting()}
              </span>
            </div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-white">
              Welcome back, {profile?.full_name?.split(' ')[0] ?? 'Traveler'}
            </h1>
            <p className="text-slate-400 mt-1.5 text-sm">
              You have {grouped.upcoming.length} upcoming trip{grouped.upcoming.length === 1 ? '' : 's'}{' '}
              {pendingApprovals > 0 && `· ${pendingApprovals} need attention`}
            </p>
          </div>
          <Link to="/trips/new" className="btn-primary">
            <Plus className="w-4 h-4" /> Create New Trip
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Plane} label="Total Trips" value={trips.length.toString()} accent="ai" />
        <StatCard icon={Calendar} label="Upcoming" value={grouped.upcoming.length.toString()} accent="cyan" />
        <StatCard icon={Wallet} label="Total Budget" value={formatCurrency(totalBudget)} accent="teal" />
        <StatCard icon={TrendingUp} label="Budget Used" value={formatCurrency(totalSpent)} accent="amber" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Trips column */}
        <div className="lg:col-span-2 space-y-6">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title flex items-center gap-2">
                <Plane className="w-5 h-5 text-ai-300" /> Upcoming Trips
              </h2>
              <Link to="/trips" className="text-sm text-ai-300 hover:text-ai-200 flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="skeleton h-64 rounded-2xl" />
                ))}
              </div>
            ) : grouped.upcoming.length === 0 ? (
              <EmptyState
                icon={<Plane className="w-7 h-7" />}
                title="No upcoming trips yet"
                subtitle="Create your first trip and let the AI help your group plan every detail."
                action={
                  <Link to="/trips/new" className="btn-primary">
                    <Plus className="w-4 h-4" /> Create Trip
                  </Link>
                }
              />
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {grouped.upcoming.slice(0, 4).map((t) => (
                  <TripCard key={t.id} trip={t} onClick={() => navigate(`/trips/${t.id}`)} />
                ))}
              </div>
            )}
          </section>

          {grouped.draft.length > 0 && (
            <section>
              <h2 className="section-title flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-slate-400" /> Draft Trips
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {grouped.draft.map((t) => (
                  <TripCard key={t.id} trip={t} onClick={() => navigate(`/trips/${t.id}`)} />
                ))}
              </div>
            </section>
          )}

          {grouped.past.length > 0 && (
            <section>
              <h2 className="section-title flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-glow-teal" /> Past Trips
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {grouped.past.slice(0, 2).map((t) => (
                  <TripCard key={t.id} trip={t} onClick={() => navigate(`/trips/${t.id}`)} past />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right column: AI + activity */}
        <div className="space-y-6">
          <DashboardAISuggestions trips={trips} />

          <QuickActions />

          <RecentActivity trips={trips} />
        </div>
      </div>
    </AppShell>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent: 'ai' | 'cyan' | 'teal' | 'amber';
}) {
  const accents = {
    ai: 'text-ai-300 border-ai-500/20 bg-ai-500/5',
    cyan: 'text-glow-cyan border-glow-cyan/20 bg-glow-cyan/5',
    teal: 'text-glow-teal border-glow-teal/20 bg-glow-teal/5',
    amber: 'text-glow-amber border-glow-amber/20 bg-glow-amber/5',
  };
  return (
    <div className="glass-card glass-hover p-4">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border', accents[accent])}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div className="mt-3 font-display text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-400 mt-0.5">{label}</div>
    </div>
  );
}

export function TripCard({ trip, onClick, past = false }: { trip: Trip; onClick: () => void; past?: boolean }) {
  const days = daysUntil(trip.start_date);
  const duration = tripDurationDays(trip.start_date, trip.end_date);
  const budgetPct = trip.estimated_budget > 0 ? Math.round((trip.actual_spent / trip.estimated_budget) * 100) : 0;

  return (
    <button
      onClick={onClick}
      className="glass-card glass-hover overflow-hidden text-left group w-full"
    >
      <div className="relative h-32 overflow-hidden">
        {trip.cover_image ? (
          <img
            src={trip.cover_image}
            alt={trip.destination}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full ai-gradient-soft" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/40 to-transparent" />
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <Badge variant={past ? 'success' : trip.status === 'draft' ? 'default' : 'ai'}>
            {past ? 'Completed' : trip.status === 'draft' ? 'Draft' : days > 0 ? `${days}d left` : 'Ongoing'}
          </Badge>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 mb-1">
            <MapPin className="w-3 h-3" /> {trip.destination}
          </div>
          <h3 className="font-display text-lg font-semibold text-white truncate">{trip.name}</h3>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" /> {formatDateShort(trip.start_date)} – {formatDateShort(trip.end_date)}
          </span>
          <span>{duration}d</span>
        </div>

        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-400">Budget</span>
          <span className="text-white font-medium">{formatCurrency(trip.estimated_budget, trip.currency)}</span>
        </div>
        <ProgressBar value={budgetPct} variant={budgetPct > 85 ? 'danger' : budgetPct > 60 ? 'warn' : 'ai'} />

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
          <div className="flex items-center -space-x-2">
            {[0, 1, 2].map((i) => (
              <Avatar key={i} name={`M${i + 1}`} size="xs" className="border-2 border-ink-800" />
            ))}
            <span className="text-xs text-slate-400 ml-3">{trip.max_members} members</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            {past ? (
              <span className="text-glow-teal flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Done
              </span>
            ) : (
              <span className="text-ai-300 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {trip.progress}% planned
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function DashboardAISuggestions({ trips }: { trips: Trip[] }) {
  const recs = useMemo(() => {
    if (trips.length === 0) return [];
    const first = trips[0];
    const generated = generateRecommendations({
      trip: first,
      members: [],
      activities: [],
      expenses: [],
      approvals: [],
    });
    return generated.slice(0, 3).map((g, i) => ({
      id: `demo-${i}`,
      trip_id: first.id,
      title: g.title,
      description: g.description,
      category: g.category,
      priority: g.priority,
      action_type: g.action_type,
      context_ref: null,
      context_type: null,
      rationale: g.rationale,
      metadata: {},
      status: 'active' as const,
      user_feedback: null,
      created_at: new Date().toISOString(),
    })) as AIRecommendation[];
  }, [trips]);

  return (
    <section className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg ai-gradient flex items-center justify-center">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <h2 className="section-title">AI Suggestions</h2>
      </div>
      {recs.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">
          Create a trip to start receiving AI recommendations.
        </p>
      ) : (
        <div className="space-y-3">
          {recs.map((r) => (
            <AIRecCard key={r.id} rec={r} compact />
          ))}
        </div>
      )}
    </section>
  );
}

function QuickActions() {
  const actions = [
    { icon: Plus, label: 'New Trip', path: '/trips/new', accent: 'ai' },
    { icon: LayoutGrid, label: 'Trip Board', path: '/trips', accent: 'cyan' },
    { icon: MessageSquare, label: 'Chat', path: '/trips', accent: 'teal' },
    { icon: Wallet, label: 'Budget', path: '/trips', accent: 'amber' },
  ];
  const accents: Record<string, string> = {
    ai: 'text-ai-300 border-ai-500/20 hover:border-ai-500/40',
    cyan: 'text-glow-cyan border-glow-cyan/20 hover:border-glow-cyan/40',
    teal: 'text-glow-teal border-glow-teal/20 hover:border-glow-teal/40',
    amber: 'text-glow-amber border-glow-amber/20 hover:border-glow-amber/40',
  };
  return (
    <section className="glass-card p-5">
      <h2 className="section-title mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-2.5">
        {actions.map((a) => (
          <Link
            key={a.label}
            to={a.path}
            className={cn(
              'flex flex-col items-start gap-2 p-3 rounded-xl border bg-white/[0.02] transition-all hover:bg-white/[0.05]',
              accents[a.accent],
            )}
          >
            <a.icon className="w-5 h-5" />
            <span className="text-sm font-medium text-white">{a.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function RecentActivity({ trips }: { trips: Trip[] }) {
  const activity = useMemo(() => {
    return trips
      .map((t) => ({
        id: t.id,
        name: t.name,
        destination: t.destination,
        created: t.created_at,
        status: t.status,
      }))
      .slice(0, 5);
  }, [trips]);

  return (
    <section className="glass-card p-5">
      <h2 className="section-title mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4 text-slate-400" /> Recent Activity
      </h2>
      {activity.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">No recent activity.</p>
      ) : (
        <div className="space-y-2.5">
          {activity.map((a) => (
            <Link
              key={a.id}
              to={`/trips/${a.id}`}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.04] transition-all"
            >
              <div className="w-8 h-8 rounded-lg ai-gradient-soft border border-ai-500/30 flex items-center justify-center flex-shrink-0">
                <Compass className="w-4 h-4 text-ai-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{a.name}</div>
                <div className="text-xs text-slate-400">{a.destination} · {relativeTime(a.created)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
