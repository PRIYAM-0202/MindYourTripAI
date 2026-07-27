import { useState } from 'react';
import { UserPlus, Mail, Phone, Link as LinkIcon, QrCode, Crown, Shield, Pencil, Eye, Check, X, Copy } from 'lucide-react';
import type { WorkspaceTabProps } from '@/pages/TripWorkspace';
import { Avatar, Badge, Modal } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import type { MemberRole } from '@/lib/types';

const ROLE_ICONS = { owner: Crown, admin: Shield, editor: Pencil, member: Check, viewer: Eye };
const ROLE_COLORS: Record<MemberRole, 'ai' | 'success' | 'warn' | 'info' | 'default'> = {
  owner: 'warn',
  admin: 'ai',
  editor: 'info',
  member: 'success',
  viewer: 'default',
};

export function MembersTab({ trip, members, userId, refresh }: WorkspaceTabProps) {
  const { toast } = useToast();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState<MemberRole>('member');
  const [copied, setCopied] = useState(false);

  const isOwner = trip.owner_id === userId;

  const sendInvite = async () => {
    if (!inviteEmail && !invitePhone) {
      toast('Enter an email or phone number', 'error');
      return;
    }
    const { error } = await supabase.from('trip_members').insert({
      trip_id: trip.id,
      email: inviteEmail || null,
      phone: invitePhone || null,
      role: inviteRole,
      status: 'pending',
      invited_by: userId,
    });
    if (error) {
      toast(error.message, 'error');
      return;
    }
    toast(`Invite sent to ${inviteEmail || invitePhone}`, 'success');
    setInviteEmail('');
    setInvitePhone('');
    setInviteOpen(false);
    refresh();
  };

  const updateRole = async (memberId: string, role: MemberRole) => {
    const { error } = await supabase.from('trip_members').update({ role }).eq('id', memberId);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    toast('Role updated', 'success');
    refresh();
  };

  const removeMember = async (memberId: string) => {
    const { error } = await supabase.from('trip_members').delete().eq('id', memberId);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    toast('Member removed', 'success');
    refresh();
  };

  const copyInviteLink = () => {
    const url = `${window.location.origin}/#/trips/${trip.id}?invite=1`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast('Invite link copied', 'success');
  };

  const accepted = members.filter((m) => m.status === 'accepted');
  const pending = members.filter((m) => m.status === 'pending');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Members ({accepted.length} joined)</h2>
          <p className="text-sm text-slate-400 mt-0.5">Invite travelers and manage roles for {trip.name}.</p>
        </div>
        <button onClick={() => setInviteOpen(true)} className="btn-primary">
          <UserPlus className="w-4 h-4" /> Invite
        </button>
      </div>

      {/* Invite methods */}
      <div className="grid sm:grid-cols-3 gap-3">
        <button onClick={copyInviteLink} className="glass-card glass-hover p-4 text-left">
          <LinkIcon className="w-5 h-5 text-ai-300 mb-2" />
          <h3 className="text-sm font-semibold text-white">Invite Link</h3>
          <p className="text-xs text-slate-400 mt-0.5">{copied ? 'Copied!' : 'Copy a shareable link'}</p>
        </button>
        <button onClick={() => setInviteOpen(true)} className="glass-card glass-hover p-4 text-left">
          <Mail className="w-5 h-5 text-glow-cyan mb-2" />
          <h3 className="text-sm font-semibold text-white">Email Invite</h3>
          <p className="text-xs text-slate-400 mt-0.5">Send by email</p>
        </button>
        <button onClick={() => toast('QR code — open invite link on another device', 'info')} className="glass-card glass-hover p-4 text-left">
          <QrCode className="w-5 h-5 text-glow-teal mb-2" />
          <h3 className="text-sm font-semibold text-white">QR Code</h3>
          <p className="text-xs text-slate-400 mt-0.5">Scan to join</p>
        </button>
      </div>

      {/* Accepted members */}
      <div>
        <h3 className="section-title mb-3">Joined ({accepted.length})</h3>
        <div className="space-y-2.5">
          {accepted.map((m) => {
            const RoleIcon = ROLE_ICONS[m.role];
            return (
              <div key={m.id} className="glass-card p-4 flex items-center gap-4">
                <Avatar name={m.profile?.full_name ?? m.email ?? m.phone} src={m.profile?.avatar_url} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white truncate">
                      {m.profile?.full_name ?? m.email ?? m.phone}
                    </span>
                    <Badge variant={ROLE_COLORS[m.role]}>
                      <RoleIcon className="w-3 h-3" /> {m.role}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{m.profile?.email ?? m.email ?? m.phone}</p>
                </div>
                {isOwner && m.role !== 'owner' && (
                  <div className="flex items-center gap-2">
                    <select
                      value={m.role}
                      onChange={(e) => updateRole(m.id, e.target.value as MemberRole)}
                      className="text-xs bg-ink-900/60 border border-white/10 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:border-ai-500/40"
                    >
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button onClick={() => removeMember(m.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-glow-rose hover:bg-glow-rose/10 transition-all">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {accepted.length === 0 && (
            <p className="text-sm text-slate-400 py-4 text-center glass-card">No members have joined yet.</p>
          )}
        </div>
      </div>

      {/* Pending invites */}
      {pending.length > 0 && (
        <div>
          <h3 className="section-title mb-3">Pending Invites ({pending.length})</h3>
          <div className="space-y-2.5">
            {pending.map((m) => (
              <div key={m.id} className="glass-card p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-white truncate block">{m.email ?? m.phone}</span>
                  <p className="text-xs text-slate-400">Invited as {m.role}</p>
                </div>
                <Badge variant="warn">Pending</Badge>
                {isOwner && (
                  <button onClick={() => removeMember(m.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-glow-rose hover:bg-glow-rose/10 transition-all">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Roles legend */}
      <div className="glass-card p-5">
        <h3 className="section-title mb-3">Role Permissions</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {[
            { role: 'Owner', desc: 'Full control — delete trip, manage all' },
            { role: 'Admin', desc: 'Manage members, edit all trip data' },
            { role: 'Editor', desc: 'Add and edit activities, board, budget' },
            { role: 'Member', desc: 'Participate in chats, votes, approvals' },
            { role: 'Viewer', desc: 'Read-only access to trip data' },
          ].map((r) => (
            <div key={r.role} className="flex items-start gap-2 p-2.5 rounded-lg bg-white/[0.02]">
              <span className="text-ai-300 font-semibold min-w-[60px]">{r.role}</span>
              <span className="text-slate-400">{r.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite a member">
        <div className="space-y-4">
          <div>
            <label className="label-text mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="friend@example.com" className="input-field pl-11" type="email" />
            </div>
          </div>
          <div className="text-center text-xs text-slate-500">— or —</div>
          <div>
            <label className="label-text mb-1.5 block">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input value={invitePhone} onChange={(e) => setInvitePhone(e.target.value)} placeholder="+91 98765 43210" className="input-field pl-11" type="tel" />
            </div>
          </div>
          <div>
            <label className="label-text mb-2 block">Role</label>
            <div className="flex flex-wrap gap-2">
              {(['admin', 'editor', 'member', 'viewer'] as MemberRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setInviteRole(r)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm border capitalize transition-all',
                    inviteRole === r ? 'ai-gradient text-white border-transparent' : 'border-white/10 text-slate-400 hover:text-white',
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setInviteOpen(false)} className="btn-ghost flex-1">Cancel</button>
            <button onClick={sendInvite} className="btn-primary flex-1">
              <UserPlus className="w-4 h-4" /> Send Invite
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
