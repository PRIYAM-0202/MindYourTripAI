import { useState } from 'react';
import { Settings as SettingsIcon, Bell, Shield, Brain, Globe, Palette, LogOut, User } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/lib/auth';
import { useRouter } from '@/lib/router';
import { useToast } from '@/lib/toast';
import { cn } from '@/lib/utils';

export function SettingsPage() {
  const { user, profile, signOut } = useAuth();
  const { navigate } = useRouter();
  const { toast } = useToast();
  const [prefs, setPrefs] = useState({
    emailNotifs: true,
    pushNotifs: true,
    weeklyDigest: false,
    aiSuggestions: true,
    autoSummarize: false,
    darkMode: true,
  });

  const toggle = (key: keyof typeof prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your account, notifications, and AI preferences.</p>
        </div>

        {/* Account */}
        <Section icon={User} title="Account">
          <Row label="Email" value={user?.email ?? '—'} />
          <Row label="Name" value={profile?.full_name ?? '—'} />
          <Row label="User ID" value={user ? user.id.slice(0, 8) + '...' : '—'} mono />
        </Section>

        {/* Notifications */}
        <Section icon={Bell} title="Notifications">
          <ToggleRow label="Email notifications" desc="Receive trip updates by email" enabled={prefs.emailNotifs} onToggle={() => toggle('emailNotifs')} />
          <ToggleRow label="Push notifications" desc="Real-time alerts in your browser" enabled={prefs.pushNotifs} onToggle={() => toggle('pushNotifs')} />
          <ToggleRow label="Weekly digest" desc="Summary of your trips every Monday" enabled={prefs.weeklyDigest} onToggle={() => toggle('weeklyDigest')} />
        </Section>

        {/* AI preferences */}
        <Section icon={Brain} title="AI Preferences">
          <ToggleRow label="AI suggestions" desc="Show contextual recommendation cards" enabled={prefs.aiSuggestions} onToggle={() => toggle('aiSuggestions')} />
          <ToggleRow label="Auto-summarize discussions" desc="AI generates chat summaries periodically" enabled={prefs.autoSummarize} onToggle={() => toggle('autoSummarize')} />
          <div className="p-3 rounded-xl bg-ai-500/5 border border-ai-500/20 flex items-start gap-2">
            <Brain className="w-4 h-4 text-ai-300 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-400">
              The AI never makes decisions for you. Every recommendation can be accepted, modified, or ignored.
              You always have the final word.
            </p>
          </div>
        </Section>

        {/* Privacy */}
        <Section icon={Shield} title="Privacy & Security">
          <Row label="Two-factor authentication" value="Not enabled" action={<button onClick={() => toast('2FA setup coming soon', 'info')} className="text-xs text-ai-300 hover:text-ai-200">Enable</button>} />
          <Row label="Data encryption" value="Active" />
          <Row label="Row-level security" value="Enabled" />
        </Section>

        {/* Appearance */}
        <Section icon={Palette} title="Appearance">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/10">
            <div>
              <div className="text-sm font-medium text-white">Dark theme</div>
              <div className="text-xs text-slate-400">Premium dark UI with AI glow effects</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Always on</span>
              <div className="w-11 h-6 rounded-full ai-gradient relative">
                <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white" style={{ left: '22px' }} />
              </div>
            </div>
          </div>
        </Section>

        {/* Danger */}
        <Section icon={LogOut} title="Session">
          <button
            onClick={() => signOut().then(() => navigate('/'))}
            className="btn-ghost text-glow-rose border-glow-rose/30 hover:bg-glow-rose/10 w-full"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </Section>
      </div>
    </AppShell>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card p-5">
      <h3 className="section-title mb-4 flex items-center gap-2">
        <Icon className="w-4 h-4 text-ai-300" /> {title}
      </h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function Row({ label, value, mono, action }: { label: string; value: string; mono?: boolean; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/10">
      <span className="text-sm text-slate-400">{label}</span>
      <div className="flex items-center gap-3">
        <span className={cn('text-sm text-white', mono && 'font-mono text-xs')}>{value}</span>
        {action}
      </div>
    </div>
  );
}

function ToggleRow({ label, desc, enabled, onToggle }: { label: string; desc: string; enabled: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/10">
      <div>
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="text-xs text-slate-400">{desc}</div>
      </div>
      <button
        onClick={onToggle}
        className={cn('w-11 h-6 rounded-full transition-all relative flex-shrink-0', enabled ? 'ai-gradient' : 'bg-white/10')}
      >
        <span
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
          style={{ left: enabled ? '22px' : '2px' }}
        />
      </button>
    </div>
  );
}
