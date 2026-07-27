import { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Plane,
  CheckCircle2,
  Calendar,
  Wallet,
  Compass,
  Award,
  Sparkles,
  Save,
  Brain,
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Avatar, Badge, ProgressBar } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useProfile, useTrips } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/lib/toast';
import { cn, formatCurrency } from '@/lib/utils';

export function ProfilePage() {
  const { user } = useAuth();
  const { profile, refresh } = useProfile(user?.id ?? null);
  const { trips } = useTrips(user?.id ?? null);
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    bio: profile?.bio ?? '',
    travel_style: profile?.travel_style ?? 'Explorer',
    budget_range: profile?.budget_range ?? 'Mid-range',
  });

  const save = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
        phone: form.phone,
        bio: form.bio,
        travel_style: form.travel_style,
        budget_range: form.budget_range,
      })
      .eq('id', user?.id);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    toast('Profile updated', 'success');
    setEditing(false);
    refresh();
  };

  const completed = trips.filter((t) => t.status === 'completed').length;
  const upcoming = trips.filter((t) => t.status !== 'completed').length;
  const totalBudget = trips.reduce((s, t) => s + t.estimated_budget, 0);
  const destinations = Array.from(new Set(trips.map((t) => t.destination)));

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header card */}
        <div className="glass-strong rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-hero-aurora opacity-30" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <Avatar name={profile?.full_name} src={profile?.avatar_url} size="lg" className="w-20 h-20 text-2xl" />
            <div className="flex-1">
              <h1 className="font-display text-2xl font-bold text-white">{profile?.full_name ?? 'Traveler'}</h1>
              <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-1">
                <Mail className="w-3.5 h-3.5" /> {profile?.email}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="ai"><Compass className="w-3 h-3" /> {profile?.travel_style ?? 'Explorer'}</Badge>
                <Badge variant="success"><Wallet className="w-3 h-3" /> {profile?.budget_range ?? 'Mid-range'}</Badge>
                <Badge variant="info"><Plane className="w-3 h-3" /> {trips.length} trips</Badge>
              </div>
            </div>
            <button onClick={() => setEditing((e) => !e)} className="btn-ghost text-sm">
              <Save className="w-4 h-4" /> {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {editing && (
          <div className="glass-card p-6 space-y-4 animate-fade-in">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label-text mb-1.5 block">Full Name</label>
                <input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="label-text mb-1.5 block">Phone</label>
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="input-field" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label-text mb-1.5 block">Travel Style</label>
                <select value={form.travel_style} onChange={(e) => setForm((f) => ({ ...f, travel_style: e.target.value }))} className="input-field">
                  {['Explorer', 'Relaxed', 'Adventure', 'Luxury', 'Backpacker', 'Cultural', 'Foodie'].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label-text mb-1.5 block">Budget Range</label>
                <select value={form.budget_range} onChange={(e) => setForm((f) => ({ ...f, budget_range: e.target.value }))} className="input-field">
                  {['Budget', 'Mid-range', 'Premium', 'Luxury'].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label-text mb-1.5 block">Bio</label>
              <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} rows={3} className="input-field resize-none" placeholder="Tell us about your travel style..." />
            </div>
            <button onClick={save} className="btn-primary"><Save className="w-4 h-4" /> Save Changes</button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBox icon={CheckCircle2} label="Completed Trips" value={completed.toString()} color="text-glow-teal" />
          <StatBox icon={Calendar} label="Upcoming" value={upcoming.toString()} color="text-ai-300" />
          <StatBox icon={MapPin} label="Destinations" value={destinations.length.toString()} color="text-glow-cyan" />
          <StatBox icon={Wallet} label="Total Budget" value={formatCurrency(totalBudget)} color="text-glow-amber" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Achievements */}
          <div className="glass-card p-5">
            <h3 className="section-title mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-glow-amber" /> Achievements
            </h3>
            <div className="space-y-2.5">
              {[
                { label: 'First Trip', desc: 'Created your first trip', unlocked: trips.length >= 1 },
                { label: 'Group Planner', desc: 'Invited 3+ members to a trip', unlocked: false },
                { label: 'Budget Master', desc: 'Stayed under budget on a trip', unlocked: completed > 0 },
                { label: 'Globetrotter', desc: 'Visited 5+ destinations', unlocked: destinations.length >= 5 },
                { label: 'AI Collaborator', desc: 'Accepted 10 AI suggestions', unlocked: false },
              ].map((a) => (
                <div key={a.label} className={cn('flex items-center gap-3 p-3 rounded-xl border', a.unlocked ? 'bg-glow-amber/5 border-glow-amber/30' : 'bg-white/[0.02] border-white/10 opacity-60')}>
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', a.unlocked ? 'bg-glow-amber/20' : 'bg-white/5')}>
                    <Award className={cn('w-4 h-4', a.unlocked ? 'text-glow-amber' : 'text-slate-500')} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{a.label}</div>
                    <div className="text-xs text-slate-400">{a.desc}</div>
                  </div>
                  {a.unlocked && <CheckCircle2 className="w-4 h-4 text-glow-teal" />}
                </div>
              ))}
            </div>
          </div>

          {/* AI preferences */}
          <div className="glass-card p-5">
            <h3 className="section-title mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4 text-ai-300" /> AI Preference Settings
            </h3>
            <div className="space-y-3">
              {[
                { key: 'suggestions', label: 'Show AI suggestions', desc: 'Contextual recommendation cards' },
                { key: 'insights', label: 'AI insights dashboard', desc: 'Trip health & risk analysis' },
                { key: 'predictions', label: 'Predictive analytics', desc: 'Forecast spending & trends' },
                { key: 'voiceInput', label: 'Voice expense input', desc: 'Speak to record expenses' },
              ].map((p) => (
                <AIPrefToggle key={p.key} pref={p} profile={profile} userId={user?.id ?? null} onRefresh={refresh} />
              ))}
            </div>
          </div>
        </div>

        {/* Favorite destinations */}
        {destinations.length > 0 && (
          <div className="glass-card p-5">
            <h3 className="section-title mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-glow-cyan" /> Favorite Destinations
            </h3>
            <div className="flex flex-wrap gap-2">
              {destinations.map((d) => (
                <span key={d} className="chip-ai"><MapPin className="w-3 h-3" /> {d}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function StatBox({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; color: string }) {
  return (
    <div className="glass-card p-4">
      <Icon className={cn('w-5 h-5 mb-2', color)} />
      <div className="font-display text-xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-400 mt-0.5">{label}</div>
    </div>
  );
}

function AIPrefToggle({ pref, profile, userId, onRefresh }: { pref: { key: string; label: string; desc: string }; profile: import('@/lib/types').Profile | null; userId: string | null; onRefresh: () => Promise<void> }) {
  const { toast } = useToast();
  const enabled = profile?.ai_preferences?.[pref.key as keyof typeof profile.ai_preferences] ?? true;
  const toggle = async () => {
    const newPrefs = { ...profile?.ai_preferences, [pref.key]: !enabled };
    await supabase.from('profiles').update({ ai_preferences: newPrefs }).eq('id', userId);
    toast(`${pref.label} ${!enabled ? 'enabled' : 'disabled'}`, 'success');
    onRefresh();
  };
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/10">
      <div className="flex-1">
        <div className="text-sm font-medium text-white">{pref.label}</div>
        <div className="text-xs text-slate-400">{pref.desc}</div>
      </div>
      <button
        onClick={toggle}
        className={cn('w-11 h-6 rounded-full transition-all relative', enabled ? 'ai-gradient' : 'bg-white/10')}
      >
        <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all', enabled ? 'left-5.5' : 'left-0.5')} style={{ left: enabled ? '22px' : '2px' }} />
      </button>
    </div>
  );
}
