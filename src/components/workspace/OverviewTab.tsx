import { useMemo } from 'react';
import {
  Calendar,
  MapPin,
  Wallet,
  Users,
  Sparkles,
  Brain,
  CheckCircle2,
  Clock,
  TrendingUp,
  Cloud,
  ShieldCheck,
} from 'lucide-react';
import type { WorkspaceTabProps } from '@/pages/TripWorkspace';
import { AIRecCard } from '@/components/AIRecCard';
import { Badge, ProgressBar } from '@/components/ui';
import { cn, daysUntil, formatCurrency, formatDate, formatDateShort, relativeTime, tripDurationDays } from '@/lib/utils';
import { generateRecommendations } from '@/lib/ai';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/lib/toast';

export function OverviewTab({ trip, members, activities, expenses, approvals, recommendations, refresh }: WorkspaceTabProps) {
  const { toast } = useToast();
  const totalSpend = expenses.reduce((s, e) => s + e.amount, 0);
  const budgetPct = trip.estimated_budget > 0 ? Math.round((totalSpend / trip.estimated_budget) * 100) : 0;
  const days = daysUntil(trip.start_date);
  const duration = tripDurationDays(trip.start_date, trip.end_date);
  const acceptedMembers = members.filter((m) => m.status === 'accepted');
  const pendingApprovals = approvals.filter((a) => a.status === 'pending');
  const approvedActs = activities.filter((a) => a.status === 'approved' || a.status === 'booked').length;

  const liveRecs = useMemo(() => {
    const generated = generateRecommendations({ trip, members, activities, expenses, approvals });
    return generated.slice(0, 4);
  }, [trip, members, activities, expenses, approvals]);

  const updateRec = async (id: string, status: 'accepted' | 'modified' | 'ignored') => {
    if (id.startsWith('live-')) {
      toast(`Recommendation ${status}`, 'success');
      return;
    }
    await supabase.from('ai_recommendations').update({ status }).eq('id', id);
    toast(`Recommendation ${status}`, 'success');
    refresh();
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Key facts */}
        <div className="grid sm:grid-cols-2 gap-4">
          <InfoCard icon={Calendar} label="Dates" value={`${formatDateShort(trip.start_date)} – ${formatDateShort(trip.end_date)}`} sub={`${duration} days · ${days > 0 ? `${days}d to go` : 'in progress'}`} />
          <InfoCard icon={Wallet} label="Budget" value={formatCurrency(trip.estimated_budget, trip.currency)} sub={`${formatCurrency(totalSpend, trip.currency)} spent · ${budgetPct}%`} progress={budgetPct} />
          <InfoCard icon={Users} label="Members" value={`${acceptedMembers.length} / ${trip.max_members}`} sub={`${members.length - acceptedMembers.length} pending invites`} />
          <InfoCard icon={CheckCircle2} label="Activities" value={`${approvedActs} / ${activities.length}`} sub={`${activities.length - approvedActs} still undecided`} progress={activities.length > 0 ? (approvedActs / activities.length) * 100 : 0} />
        </div>

        {/* AI summary */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg ai-gradient flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <h3 className="section-title">AI Trip Summary</h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {pendingApprovals.length > 0 && `${pendingApprovals.length} approval${pendingApprovals.length > 1 ? 's' : ''} pending. `}
            {approvedActs} of {activities.length} activities approved. Budget at {budgetPct}%
            {budgetPct > 80 ? ' — approaching the limit.' : budgetPct < 40 && days < 14 ? ' — consider booking accommodation soon.' : '.'}
            {days > 0 && days <= 7 && ` Trip starts in ${days} day${days === 1 ? '' : 's'} — finalize logistics.`}
          </p>

          {trip.weather_summary && (
            <div className="mt-3 flex items-start gap-2 text-xs text-slate-400">
              <Cloud className="w-3.5 h-3.5 text-glow-cyan mt-0.5 flex-shrink-0" />
              <span>Weather: {trip.weather_summary}</span>
            </div>
          )}
          {trip.safety_info && (
            <div className="mt-2 flex items-start gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-glow-teal mt-0.5 flex-shrink-0" />
              <span>Safety: {trip.safety_info}</span>
            </div>
          )}
        </div>

        {/* AI Recommendations */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-ai-300" />
            <h3 className="section-title">AI Recommendations</h3>
            <Badge variant="ai">{liveRecs.length + recommendations.filter((r) => r.status === 'active').length}</Badge>
          </div>
          <div className="space-y-3">
            {recommendations.filter((r) => r.status === 'active').slice(0, 2).map((r) => (
              <AIRecCard key={r.id} rec={r} onAccept={(id) => updateRec(id, 'accepted')} onModify={(id) => updateRec(id, 'modified')} onIgnore={(id) => updateRec(id, 'ignored')} />
            ))}
            {liveRecs.map((r, i) => {
              const rec = { ...r, id: `live-${i}`, trip_id: trip.id, context_ref: null, context_type: null, rationale: r.rationale, metadata: {}, status: 'active' as const, user_feedback: null, created_at: new Date().toISOString() };
              return <AIRecCard key={rec.id} rec={rec} onAccept={(id) => updateRec(id, 'accepted')} onModify={(id) => updateRec(id, 'modified')} onIgnore={(id) => updateRec(id, 'ignored')} />;
            })}
            {liveRecs.length === 0 && recommendations.filter((r) => r.status === 'active').length === 0 && (
              <div className="glass-card p-6 text-center">
                <Sparkles className="w-6 h-6 text-ai-400/50 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No active recommendations. Your trip looks healthy!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <div className="glass-card p-5">
          <h3 className="section-title mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" /> Trip Timeline
          </h3>
          <div className="space-y-3">
            <TimelineItem label="Created" date={trip.created_at} done />
            <TimelineItem label="Planning" date={trip.start_date} active={trip.status === 'draft'} />
            <TimelineItem label="Departure" date={trip.start_date} upcoming={days > 0} />
            <TimelineItem label="Return" date={trip.end_date} />
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="section-title mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-glow-teal" /> Budget Snapshot
          </h3>
          <div className="space-y-2.5">
            <BudgetRow label="Estimated" value={formatCurrency(trip.estimated_budget, trip.currency)} />
            <BudgetRow label="Spent" value={formatCurrency(totalSpend, trip.currency)} />
            <BudgetRow label="Remaining" value={formatCurrency(Math.max(trip.estimated_budget - totalSpend, 0), trip.currency)} highlight />
          </div>
          <ProgressBar value={budgetPct} variant={budgetPct > 85 ? 'danger' : budgetPct > 60 ? 'warn' : 'ai'} className="mt-3" />
        </div>

        <div className="glass-card p-5">
          <h3 className="section-title mb-3">Quick Info</h3>
          <div className="space-y-2 text-xs">
            <InfoRow label="Status" value={<Badge variant={trip.status === 'upcoming' ? 'ai' : trip.status === 'draft' ? 'default' : 'success'}>{trip.status}</Badge>} />
            <InfoRow label="Style" value={trip.travel_style ?? '—'} />
            <InfoRow label="Category" value={trip.trip_category ?? '—'} />
            <InfoRow label="Accommodation" value={trip.accommodation ?? '—'} />
            <InfoRow label="Transport" value={trip.transportation ?? '—'} />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, sub, progress }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub?: string; progress?: number }) {
  return (
    <div className="glass-card glass-hover p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-ai-300" />
        <span className="label-text">{label}</span>
      </div>
      <div className="font-display text-lg font-bold text-white">{value}</div>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      {progress !== undefined && <ProgressBar value={progress} className="mt-2" />}
    </div>
  );
}

function TimelineItem({ label, date, done, active, upcoming }: { label: string; date: string; done?: boolean; active?: boolean; upcoming?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', done ? 'bg-glow-teal' : active ? 'bg-ai-400 animate-pulse' : upcoming ? 'bg-glow-amber' : 'bg-white/20')} />
      <span className="text-sm text-slate-300 flex-1">{label}</span>
      <span className="text-xs text-slate-500">{formatDateShort(date)}</span>
    </div>
  );
}

function BudgetRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={cn('text-sm font-medium', highlight ? 'text-glow-teal' : 'text-white')}>{value}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400">{label}</span>
      <span className="text-white">{value}</span>
    </div>
  );
}
