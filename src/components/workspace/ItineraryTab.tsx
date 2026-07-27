import { useState } from 'react';
import { Plus, Calendar, Clock, MapPin, Wallet, Trash2, Sparkles, GripVertical } from 'lucide-react';
import type { WorkspaceTabProps } from '@/pages/TripWorkspace';
import { Badge, Modal } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/lib/toast';
import { cn, formatCurrency, formatDateShort, tripDurationDays } from '@/lib/utils';
import type { Activity, ActivityCategory, ActivityStatus } from '@/lib/types';

const STATUS_BADGE: Record<ActivityStatus, { variant: 'default' | 'ai' | 'success' | 'warn' | 'danger' | 'info'; label: string }> = {
  suggested: { variant: 'default', label: 'Suggested' },
  discussing: { variant: 'warn', label: 'Discussing' },
  approved: { variant: 'success', label: 'Approved' },
  booked: { variant: 'info', label: 'Booked' },
  completed: { variant: 'success', label: 'Completed' },
  rejected: { variant: 'danger', label: 'Rejected' },
};

const CATEGORY_COLORS: Record<ActivityCategory, string> = {
  activity: 'text-glow-cyan',
  restaurant: 'text-glow-amber',
  hotel: 'text-glow-teal',
  transport: 'text-ai-300',
  sightseeing: 'text-glow-rose',
};

export function ItineraryTab({ trip, activities, setActivities, userId, refresh }: WorkspaceTabProps) {
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: '',
    category: 'activity' as ActivityCategory,
    day: '1',
    startTime: '',
    endTime: '',
    location: '',
    cost: '0',
    priority: 'medium',
  });

  const duration = tripDurationDays(trip.start_date, trip.end_date);
  const days = Array.from({ length: duration }, (_, i) => i + 1);

  const activitiesByDay = (day: number) => activities.filter((a) => a.day === day).sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? ''));

  const addActivity = async () => {
    if (!form.title) {
      toast('Enter an activity title', 'error');
      return;
    }
    const { data, error } = await supabase
      .from('activities')
      .insert({
        trip_id: trip.id,
        title: form.title,
        category: form.category,
        day: Number(form.day),
        start_time: form.startTime || null,
        end_time: form.endTime || null,
        location: form.location || null,
        estimated_cost: Number(form.cost),
        priority: form.priority,
        status: 'suggested',
        created_by: userId,
      })
      .select()
      .single();

    if (error || !data) {
      toast(error?.message ?? 'Failed to add activity', 'error');
      return;
    }
    setActivities((prev) => [...prev, data as Activity]);
    toast('Activity added', 'success');
    setForm({ title: '', category: 'activity', day: String(editingDay ?? 1), startTime: '', endTime: '', location: '', cost: '0', priority: 'medium' });
    setAddOpen(false);
    refresh();
  };

  const updateStatus = async (activity: Activity, status: ActivityStatus) => {
    const { error } = await supabase.from('activities').update({ status }).eq('id', activity.id);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    setActivities((prev) => prev.map((a) => (a.id === activity.id ? { ...a, status } : a)));
    toast(`Activity ${status}`, 'success');
  };

  const removeActivity = async (id: string) => {
    const { error } = await supabase.from('activities').delete().eq('id', id);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    setActivities((prev) => prev.filter((a) => a.id !== id));
    toast('Activity removed', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Itinerary</h2>
          <p className="text-sm text-slate-400 mt-0.5">{duration} days · {activities.length} activities planned</p>
        </div>
        <button onClick={() => { setEditingDay(null); setAddOpen(true); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Activity
        </button>
      </div>

      {/* AI suggestion banner */}
      <div className="glass-card p-4 border-l-2 border-ai-500 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-ai-300 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-white">AI scheduling tip</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Group sightseeing in the mornings, food in the afternoons, and leave evenings flexible.
            The AI can suggest moving an activity to a better day — just ask via the assistant.
          </p>
        </div>
      </div>

      {/* Day columns */}
      <div className="space-y-4">
        {days.map((day) => {
          const date = new Date(trip.start_date);
          date.setDate(date.getDate() + day - 1);
          const dayActivities = activitiesByDay(day);
          return (
            <div key={day} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl ai-gradient-soft border border-ai-500/30 flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase text-ai-300 font-semibold">Day</span>
                    <span className="font-display text-lg font-bold text-white leading-none">{day}</span>
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold text-white">{formatDateShort(date)}</h3>
                    <p className="text-xs text-slate-400">{dayActivities.length} activit{dayActivities.length === 1 ? 'y' : 'ies'}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setEditingDay(day); setForm((f) => ({ ...f, day: String(day) })); setAddOpen(true); }}
                  className="text-sm text-ai-300 hover:text-ai-200 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>

              {dayActivities.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center border border-dashed border-white/10 rounded-xl">
                  No activities planned for this day yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {dayActivities.map((a) => {
                    const badge = STATUS_BADGE[a.status];
                    return (
                      <div key={a.id} className="rounded-xl bg-white/[0.02] border border-white/10 p-3 group hover:border-ai-500/30 transition-all">
                        <div className="flex items-start gap-3">
                          <GripVertical className="w-4 h-4 text-slate-600 mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn('text-xs font-medium uppercase', CATEGORY_COLORS[a.category])}>{a.category}</span>
                              <Badge variant={badge.variant}>{badge.label}</Badge>
                            </div>
                            <h4 className="text-sm font-semibold text-white">{a.title}</h4>
                            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
                              {a.start_time && (
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {a.start_time}{a.end_time ? `–${a.end_time}` : ''}</span>
                              )}
                              {a.location && (
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {a.location}</span>
                              )}
                              {a.estimated_cost > 0 && (
                                <span className="flex items-center gap-1"><Wallet className="w-3 h-3" /> {formatCurrency(a.estimated_cost, a.currency)}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {a.status !== 'approved' && (
                              <button onClick={() => updateStatus(a, 'approved')} className="p-1 rounded text-glow-teal hover:bg-glow-teal/10" title="Approve">
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button onClick={() => removeActivity(a.id)} className="p-1 rounded text-slate-400 hover:text-glow-rose hover:bg-glow-rose/10" title="Remove">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Activity">
        <div className="space-y-4">
          <div>
            <label className="label-text mb-1.5 block">Title</label>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Visit Old Goa Churches" className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-text mb-1.5 block">Category</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ActivityCategory }))} className="input-field">
                <option value="activity">Activity</option>
                <option value="restaurant">Restaurant</option>
                <option value="hotel">Hotel</option>
                <option value="transport">Transport</option>
                <option value="sightseeing">Sightseeing</option>
              </select>
            </div>
            <div>
              <label className="label-text mb-1.5 block">Day</label>
              <select value={form.day} onChange={(e) => setForm((f) => ({ ...f, day: e.target.value }))} className="input-field">
                {days.map((d) => <option key={d} value={d}>Day {d}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-text mb-1.5 block">Start time</label>
              <input type="time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="label-text mb-1.5 block">End time</label>
              <input type="time" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-text mb-1.5 block">Location</label>
              <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="e.g. Baga Beach" className="input-field" />
            </div>
            <div>
              <label className="label-text mb-1.5 block">Cost (₹)</label>
              <input type="number" value={form.cost} onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))} className="input-field" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setAddOpen(false)} className="btn-ghost flex-1">Cancel</button>
            <button onClick={addActivity} className="btn-primary flex-1"><Plus className="w-4 h-4" /> Add</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
