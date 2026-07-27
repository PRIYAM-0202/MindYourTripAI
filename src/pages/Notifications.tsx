import { useEffect, useMemo } from 'react';
import {
  Bell,
  CloudRain,
  Wallet,
  TrendingDown,
  Clock,
  CheckSquare,
  Sparkles,
  Plane,
  FileText,
  Calendar,
  CheckCheck,
  Trash2,
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { EmptyState, Badge } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useNotifications, markNotificationRead } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/lib/toast';
import { cn, relativeTime } from '@/lib/utils';
import type { NotifType } from '@/lib/types';

const NOTIF_ICONS: Record<NotifType, React.ComponentType<{ className?: string }>> = {
  weather: CloudRain,
  budget: Wallet,
  price: TrendingDown,
  reminder: Clock,
  approval: CheckSquare,
  suggestion: Sparkles,
  trip: Plane,
  document: FileText,
  countdown: Calendar,
  general: Bell,
};

const NOTIF_COLORS: Record<NotifType, string> = {
  weather: 'text-glow-cyan bg-glow-cyan/10 border-glow-cyan/30',
  budget: 'text-glow-amber bg-glow-amber/10 border-glow-amber/30',
  price: 'text-glow-teal bg-glow-teal/10 border-glow-teal/30',
  reminder: 'text-ai-300 bg-ai-500/10 border-ai-500/30',
  approval: 'text-glow-rose bg-glow-rose/10 border-glow-rose/30',
  suggestion: 'text-ai-300 bg-ai-500/10 border-ai-500/30',
  trip: 'text-glow-cyan bg-glow-cyan/10 border-glow-cyan/30',
  document: 'text-glow-emerald bg-glow-emerald/10 border-glow-emerald/30',
  countdown: 'text-glow-amber bg-glow-amber/10 border-glow-amber/30',
  general: 'text-slate-300 bg-white/5 border-white/10',
};

export function NotificationsPage() {
  const { user } = useAuth();
  const { notifications, loading, refresh } = useNotifications(user?.id ?? null);
  const { toast } = useToast();

  const unread = notifications.filter((n) => !n.is_read);
  const read = notifications.filter((n) => n.is_read);

  // Seed a few demo notifications if empty
  useEffect(() => {
    if (!user || loading || notifications.length > 0) return;
    const seed = [
      { title: 'Weather alert', body: 'Light rain expected on Day 2 in Goa — consider indoor activities.', notif_type: 'weather', icon: 'cloud' },
      { title: 'Budget warning', body: 'You\'ve used 68% of your trip budget. Monitor non-essential spend.', notif_type: 'budget', icon: 'wallet' },
      { title: 'Price drop', body: 'Goa flights dropped 12% since you started planning.', notif_type: 'price', icon: 'trending' },
      { title: 'Pending approval', body: '2 activities are awaiting group approval.', notif_type: 'approval', icon: 'check' },
      { title: 'New AI suggestion', body: 'A cheaper train option is available for your return journey.', notif_type: 'suggestion', icon: 'sparkles' },
      { title: 'Trip countdown', body: 'Your Goa trip starts in 12 days. Finalize your bookings.', notif_type: 'countdown', icon: 'calendar' },
    ];
    seed.forEach((s) => {
      supabase.from('notifications').insert({ user_id: user.id, ...s, priority: 'medium' });
    });
    setTimeout(refresh, 500);
  }, [user, loading, notifications.length, refresh]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    toast('All notifications marked as read', 'success');
    refresh();
  };

  const remove = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    refresh();
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Notifications</h1>
            <p className="text-sm text-slate-400 mt-1">{unread.length} unread · {notifications.length} total</p>
          </div>
          {unread.length > 0 && (
            <button onClick={markAllRead} className="btn-ghost text-sm">
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<Bell className="w-7 h-7" />}
            title="No notifications yet"
            subtitle="AI alerts about weather, budget, approvals, and trip updates will appear here."
          />
        ) : (
          <>
            {unread.length > 0 && (
              <div>
                <h3 className="section-title mb-3">Unread ({unread.length})</h3>
                <div className="space-y-2.5">
                  {unread.map((n) => {
                    const Icon = NOTIF_ICONS[n.notif_type as NotifType] ?? Bell;
                    return (
                      <div key={n.id} className="glass-card p-4 flex items-start gap-3 group border-ai-500/20">
                        <div className={cn('w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0', NOTIF_COLORS[n.notif_type as NotifType] ?? NOTIF_COLORS.general)}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">{n.title}</span>
                            <span className="w-2 h-2 rounded-full bg-ai-400 animate-pulse" />
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{n.body}</p>
                          <span className="text-[10px] text-slate-500 mt-1 block">{relativeTime(n.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => markNotificationRead(n.id).then(refresh)} className="p-1.5 rounded-lg text-ai-300 hover:bg-ai-500/10" title="Mark read">
                            <CheckCheck className="w-4 h-4" />
                          </button>
                          <button onClick={() => remove(n.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-glow-rose hover:bg-glow-rose/10" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {read.length > 0 && (
              <div>
                <h3 className="section-title mb-3 text-slate-400">Read ({read.length})</h3>
                <div className="space-y-2.5 opacity-60">
                  {read.map((n) => {
                    const Icon = NOTIF_ICONS[n.notif_type as NotifType] ?? Bell;
                    return (
                      <div key={n.id} className="glass-card p-4 flex items-start gap-3 group">
                        <div className={cn('w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0', NOTIF_COLORS[n.notif_type as NotifType] ?? NOTIF_COLORS.general)}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-white">{n.title}</span>
                          <p className="text-xs text-slate-400 mt-0.5">{n.body}</p>
                          <span className="text-[10px] text-slate-500 mt-1 block">{relativeTime(n.created_at)}</span>
                        </div>
                        <button onClick={() => remove(n.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-glow-rose opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
