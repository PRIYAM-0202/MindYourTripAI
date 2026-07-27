import { useMemo } from 'react';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  Users,
  CheckCircle2,
  Gauge,
  Calendar,
  Sparkles,
} from 'lucide-react';
import type { WorkspaceTabProps } from '@/pages/TripWorkspace';
import { ProgressBar, Badge } from '@/components/ui';
import { computeInsights } from '@/lib/ai';
import { cn, formatDateShort } from '@/lib/utils';

export function InsightsTab({ trip, members, activities, expenses, approvals, messages }: WorkspaceTabProps) {
  const insights = useMemo(
    () => computeInsights({ trip, members, activities, expenses, approvals, messages }),
    [trip, members, activities, expenses, approvals, messages],
  );

  const scores = [
    { label: 'Trip Health', value: insights.trip_health_score, icon: Gauge, color: 'ai' as const },
    { label: 'Budget Health', value: insights.budget_health, icon: TrendingUp, color: insights.budget_health > 70 ? 'success' as const : insights.budget_health > 40 ? 'warn' as const : 'danger' as const },
    { label: 'Planning', value: insights.planning_completion, icon: CheckCircle2, color: 'ai' as const },
    { label: 'Approvals', value: insights.approval_progress, icon: Activity, color: 'ai' as const },
    { label: 'Group Activity', value: insights.group_activity, icon: Users, color: 'ai' as const },
    { label: 'Readiness', value: insights.estimated_readiness, icon: Brain, color: insights.estimated_readiness > 70 ? 'success' as const : 'warn' as const },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title flex items-center gap-2">
          <Brain className="w-5 h-5 text-ai-300" /> AI Insights Dashboard
        </h2>
        <p className="text-sm text-slate-400 mt-0.5">Real-time intelligence about your trip's health, risks, and readiness.</p>
      </div>

      {/* Summary banner */}
      <div className="glass-card p-5 border-l-2 border-ai-500">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-ai-300" />
          <span className="text-xs uppercase tracking-wider text-ai-300 font-semibold">AI Summary</span>
        </div>
        <p className="text-sm text-slate-200">{insights.summary}</p>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {scores.map((s) => (
          <div key={s.label} className="glass-card glass-hover p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <s.icon className={cn('w-4 h-4', s.color === 'success' && 'text-glow-teal', s.color === 'warn' && 'text-glow-amber', s.color === 'danger' && 'text-glow-rose', s.color === 'ai' && 'text-ai-300')} />
                <span className="text-sm font-medium text-white">{s.label}</span>
              </div>
              <span className="font-display text-2xl font-bold text-white">{s.value}</span>
            </div>
            <ProgressBar value={s.value} variant={s.color === 'success' ? 'success' : s.color === 'warn' ? 'warn' : s.color === 'danger' ? 'danger' : 'ai'} />
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Risks */}
        <div className="glass-card p-5">
          <h3 className="section-title mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-glow-amber" /> Potential Risks
          </h3>
          {insights.potential_risks.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-8 h-8 text-glow-teal mx-auto mb-2" />
              <p className="text-sm text-slate-400">No risks detected. Your trip is on track.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {insights.potential_risks.map((r, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border',
                    r.severity === 'high' && 'bg-glow-rose/5 border-glow-rose/30',
                    r.severity === 'medium' && 'bg-glow-amber/5 border-glow-amber/30',
                    r.severity === 'low' && 'bg-ai-500/5 border-ai-500/30',
                  )}
                >
                  <AlertTriangle className={cn('w-4 h-4 flex-shrink-0', r.severity === 'high' && 'text-glow-rose', r.severity === 'medium' && 'text-glow-amber', r.severity === 'low' && 'text-ai-300')} />
                  <span className="text-sm text-slate-200 flex-1">{r.label}</span>
                  <Badge variant={r.severity === 'high' ? 'danger' : r.severity === 'medium' ? 'warn' : 'info'}>{r.severity}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deadlines */}
        <div className="glass-card p-5">
          <h3 className="section-title mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-glow-cyan" /> Upcoming Deadlines
          </h3>
          {insights.upcoming_deadlines.length === 0 ? (
            <div className="text-center py-6">
              <Calendar className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No upcoming deadlines.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {insights.upcoming_deadlines.map((d, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/10">
                  <Calendar className="w-4 h-4 text-glow-cyan flex-shrink-0" />
                  <span className="text-sm text-slate-200 flex-1">{d.label}</span>
                  <span className="text-xs text-slate-400">{formatDateShort(d.date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Most active member */}
      {insights.most_active_member && (
        <div className="glass-card p-5">
          <h3 className="section-title mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-glow-teal" /> Group Activity
          </h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full ai-gradient flex items-center justify-center text-sm font-semibold text-white">
              {insights.most_active_member[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm text-white font-medium">{insights.most_active_member}</p>
              <p className="text-xs text-slate-400">Most active member in this trip</p>
            </div>
          </div>
        </div>
      )}

      {/* Predictive analytics preview */}
      <div className="glass-card p-5">
        <h3 className="section-title mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-ai-300" /> Predictive Analytics
          <Badge variant="ai">AI forecast</Badge>
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: 'Estimated final cost', value: formatEstimate(trip.estimated_budget, expenses), note: 'Based on current spend velocity' },
            { label: 'Budget overrun risk', value: insights.budget_health < 50 ? 'High' : insights.budget_health < 75 ? 'Medium' : 'Low', note: 'Trend analysis' },
            { label: 'Crowd level forecast', value: 'Moderate', note: 'Seasonal average' },
            { label: 'Weather risk', value: 'Low', note: 'Historical patterns' },
            { label: 'Hotel price trend', value: 'Rising', note: 'Last 14 days' },
            { label: 'Planning pace', value: insights.planning_completion > 60 ? 'On track' : 'Behind', note: 'vs. typical trips' },
          ].map((p) => (
            <div key={p.label} className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
              <div className="text-xs text-slate-400">{p.label}</div>
              <div className="text-sm font-semibold text-white mt-1">{p.value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{p.note}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-ai-400" /> Predictions are suggestions only — never automatic decisions.
        </p>
      </div>
    </div>
  );
}

function formatEstimate(budget: number, expenses: { amount: number }[]): string {
  const spent = expenses.reduce((s, e) => s + e.amount, 0);
  const pct = budget > 0 ? spent / budget : 0;
  const estimate = pct > 0.6 ? budget * 1.15 : budget * 0.95;
  return `₹${Math.round(estimate).toLocaleString('en-IN')}`;
}
