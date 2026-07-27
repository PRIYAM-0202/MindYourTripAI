import { useState } from 'react';
import {
  Check,
  Pencil,
  X,
  HelpCircle,
  Sparkles,
  AlertTriangle,
  Info,
  Zap,
  Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AIRecommendation } from '@/lib/types';

const CATEGORY_ICON = {
  budget: Info,
  weather: AlertTriangle,
  activity: Sparkles,
  hotel: Sparkles,
  transport: Zap,
  approval: Check,
  document: Info,
  scheduling: Sparkles,
  safety: AlertTriangle,
  general: Sparkles,
} as const;

const PRIORITY_STYLES = {
  low: { ring: 'border-white/10', chip: 'text-slate-400', glow: '' },
  medium: { ring: 'border-ai-500/30', chip: 'text-ai-300', glow: 'shadow-glow-soft' },
  high: { ring: 'border-glow-amber/40', chip: 'text-glow-amber', glow: 'shadow-[0_0_20px_rgba(251,191,36,0.2)]' },
  critical: { ring: 'border-glow-rose/50', chip: 'text-glow-rose', glow: 'shadow-[0_0_24px_rgba(251,113,133,0.3)]' },
} as const;

const ACTION_ICON = {
  suggestion: Sparkles,
  warning: AlertTriangle,
  alert: Zap,
  insight: Brain,
  reminder: Check,
} as const;

export function AIRecCard({
  rec,
  onAccept,
  onModify,
  onIgnore,
  compact = false,
}: {
  rec: AIRecommendation;
  onAccept?: (id: string) => void;
  onModify?: (id: string) => void;
  onIgnore?: (id: string) => void;
  compact?: boolean;
}) {
  const [showWhy, setShowWhy] = useState(false);
  const Icon = CATEGORY_ICON[rec.category] ?? Sparkles;
  const ActionIcon = ACTION_ICON[rec.action_type] ?? Sparkles;
  const style = PRIORITY_STYLES[rec.priority] ?? PRIORITY_STYLES.medium;
  const dismissed = rec.status !== 'active';

  return (
    <div
      className={cn(
        'glass-card relative overflow-hidden p-4 transition-all duration-300',
        style.ring,
        style.glow,
        dismissed && 'opacity-50',
        compact && 'p-3',
      )}
    >
      <div className="absolute top-0 left-0 w-1 h-full ai-gradient opacity-70" />

      <div className="flex items-start gap-3 pl-2">
        <div className="w-9 h-9 rounded-xl ai-gradient-soft border border-ai-500/30 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-ai-300" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <ActionIcon className="w-3.5 h-3.5 text-ai-300 flex-shrink-0" />
            <span className={cn('text-[10px] font-semibold uppercase tracking-wider', style.chip)}>
              {rec.action_type}
            </span>
            {rec.priority !== 'low' && (
              <span className={cn('text-[10px] font-semibold uppercase tracking-wider', style.chip)}>
                · {rec.priority}
              </span>
            )}
          </div>
          <h4 className="text-sm font-semibold text-white leading-snug">{rec.title}</h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{rec.description}</p>

          {showWhy && rec.rationale && (
            <div className="mt-3 p-3 rounded-lg bg-ai-500/[0.06] border border-ai-500/20 animate-fade-in">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Brain className="w-3.5 h-3.5 text-ai-300" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-ai-300">Why AI suggests this</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{rec.rationale}</p>
            </div>
          )}

          {!dismissed && (
            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              {onAccept && (
                <button
                  onClick={() => onAccept(rec.id)}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-glow-teal bg-glow-teal/10 border border-glow-teal/30 hover:bg-glow-teal/20 transition-all"
                >
                  <Check className="w-3 h-3" /> Accept
                </button>
              )}
              {onModify && (
                <button
                  onClick={() => onModify(rec.id)}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ai-200 bg-ai-500/10 border border-ai-500/30 hover:bg-ai-500/20 transition-all"
                >
                  <Pencil className="w-3 h-3" /> Modify
                </button>
              )}
              {onIgnore && (
                <button
                  onClick={() => onIgnore(rec.id)}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 bg-white/[0.03] border border-white/10 hover:bg-white/[0.07] transition-all"
                >
                  <X className="w-3 h-3" /> Ignore
                </button>
              )}
              <button
                onClick={() => setShowWhy((s) => !s)}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ai-300 bg-ai-500/[0.06] border border-ai-500/20 hover:bg-ai-500/15 transition-all"
              >
                <HelpCircle className="w-3 h-3" /> Ask AI Why
              </button>
            </div>
          )}

          {dismissed && (
            <div className="mt-2.5">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">
                {rec.status === 'accepted' && 'Accepted'}
                {rec.status === 'modified' && 'Modified'}
                {rec.status === 'ignored' && 'Ignored'}
                {rec.status === 'dismissed' && 'Dismissed'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
