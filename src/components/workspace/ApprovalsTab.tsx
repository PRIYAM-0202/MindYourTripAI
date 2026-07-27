import { useState } from 'react';
import { Check, X, ThumbsUp, ThumbsDown, Clock, Plus, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import type { WorkspaceTabProps } from '@/pages/TripWorkspace';
import { Badge, Modal } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/lib/toast';
import { cn, formatCurrency, relativeTime } from '@/lib/utils';
import type { Approval, ApprovalStatus } from '@/lib/types';

export function ApprovalsTab({ trip, approvals, setApprovals, userId, userName, refresh }: WorkspaceTabProps) {
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'activity', amount: '' });

  const pending = approvals.filter((a) => a.status === 'pending');
  const resolved = approvals.filter((a) => a.status !== 'pending');

  const vote = async (approval: Approval, voteYes: boolean) => {
    const yes = approval.voter_yes ?? [];
    const no = approval.voter_no ?? [];
    const voter = userName;
    const newYes = voteYes ? [...new Set([...yes, voter])] : yes.filter((v) => v !== voter);
    const newNo = !voteYes ? [...new Set([...no, voter])] : no.filter((v) => v !== voter);
    const totalVotes = newYes.length + newNo.length;
    const status: ApprovalStatus = totalVotes >= approval.required_voters ? (newYes.length > newNo.length ? 'approved' : 'rejected') : 'pending';
    const { error } = await supabase.from('approvals').update({ voter_yes: newYes, voter_no: newNo, status }).eq('id', approval.id);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    setApprovals((prev) => prev.map((a) => (a.id === approval.id ? { ...a, voter_yes: newYes, voter_no: newNo, status } : a)));
    toast(status === 'pending' ? 'Vote recorded' : `Approval ${status}`, 'success');
    refresh();
  };

  const createApproval = async () => {
    if (!form.title) {
      toast('Enter a title', 'error');
      return;
    }
    const { data, error } = await supabase
      .from('approvals')
      .insert({
        trip_id: trip.id,
        title: form.title,
        description: form.description || null,
        approval_type: form.type,
        amount: form.amount ? Number(form.amount) : null,
        requested_by: userId,
        requested_by_name: userName,
        status: 'pending',
        required_voters: 2,
      })
      .select()
      .single();
    if (error || !data) {
      toast(error?.message ?? 'Failed to create', 'error');
      return;
    }
    setApprovals((prev) => [data as Approval, ...prev]);
    toast('Approval request created', 'success');
    setForm({ title: '', description: '', type: 'activity', amount: '' });
    setAddOpen(false);
    refresh();
  };

  const removeApproval = async (id: string) => {
    const { error } = await supabase.from('approvals').delete().eq('id', id);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    setApprovals((prev) => prev.filter((a) => a.id !== id));
    toast('Approval removed', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Approvals</h2>
          <p className="text-sm text-slate-400 mt-0.5">{pending.length} pending · {resolved.length} resolved. Every decision needs group consensus.</p>
        </div>
        <button onClick={() => setAddOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Request Approval
        </button>
      </div>

      {/* Pending */}
      <div>
        <h3 className="section-title mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-glow-amber" /> Pending ({pending.length})
        </h3>
        {pending.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-glow-teal mx-auto mb-2" />
            <p className="text-sm text-slate-400">No pending approvals. Everything is resolved.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {pending.map((a) => (
              <div key={a.id} className="glass-card p-4 group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-glow-amber/10 border border-glow-amber/30 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-glow-amber" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-white">{a.title}</span>
                      <Badge variant="warn">{a.approval_type}</Badge>
                      {a.amount && <span className="text-sm text-glow-amber font-medium">{formatCurrency(a.amount, trip.currency)}</span>}
                    </div>
                    {a.description && <p className="text-xs text-slate-400 mb-2">{a.description}</p>}
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                      <span>Requested by {a.requested_by_name}</span>
                      <span>·</span>
                      <span>{relativeTime(a.created_at)}</span>
                      <span>·</span>
                      <span>Needs {a.required_voters} votes</span>
                    </div>
                    {/* Vote bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-xs">
                        <ThumbsUp className="w-3.5 h-3.5 text-glow-teal" />
                        <span className="text-glow-teal font-medium">{a.voter_yes?.length ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <ThumbsDown className="w-3.5 h-3.5 text-glow-rose" />
                        <span className="text-glow-rose font-medium">{a.voter_no?.length ?? 0}</span>
                      </div>
                      <div className="flex-1" />
                      <button onClick={() => vote(a, true)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-glow-teal bg-glow-teal/10 border border-glow-teal/30 hover:bg-glow-teal/20 transition-all flex items-center gap-1">
                        <Check className="w-3 h-3" /> Approve
                      </button>
                      <button onClick={() => vote(a, false)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-glow-rose bg-glow-rose/10 border border-glow-rose/30 hover:bg-glow-rose/20 transition-all flex items-center gap-1">
                        <X className="w-3 h-3" /> Reject
                      </button>
                    </div>
                  </div>
                  <button onClick={() => removeApproval(a.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-glow-rose opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolved */}
      {resolved.length > 0 && (
        <div>
          <h3 className="section-title mb-3">Resolved ({resolved.length})</h3>
          <div className="space-y-2.5">
            {resolved.map((a) => (
              <div key={a.id} className="glass-card p-4 flex items-center gap-3 opacity-75">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', a.status === 'approved' ? 'bg-glow-teal/10 border border-glow-teal/30' : 'bg-glow-rose/10 border border-glow-rose/30')}>
                  {a.status === 'approved' ? <CheckCircle2 className="w-5 h-5 text-glow-teal" /> : <XCircle className="w-5 h-5 text-glow-rose" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{a.title}</span>
                    <Badge variant={a.status === 'approved' ? 'success' : 'danger'}>{a.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{a.voter_yes?.length ?? 0} approved · {a.voter_no?.length ?? 0} rejected · {relativeTime(a.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Request Approval">
        <div className="space-y-4">
          <div>
            <label className="label-text mb-1.5 block">Title</label>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Approve budget increase to ₹60,000" className="input-field" />
          </div>
          <div>
            <label className="label-text mb-1.5 block">Type</label>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="input-field">
              <option value="activity">Activity</option>
              <option value="budget">Budget Change</option>
              <option value="member">Member</option>
              <option value="itinerary">Itinerary</option>
              <option value="document">Document</option>
            </select>
          </div>
          <div>
            <label className="label-text mb-1.5 block">Amount (optional)</label>
            <input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="label-text mb-1.5 block">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="input-field resize-none" />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setAddOpen(false)} className="btn-ghost flex-1">Cancel</button>
            <button onClick={createApproval} className="btn-primary flex-1"><Plus className="w-4 h-4" /> Create Request</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
