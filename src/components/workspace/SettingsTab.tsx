import { useState } from 'react';
import { Save, Trash2, AlertTriangle, Plane } from 'lucide-react';
import type { WorkspaceTabProps } from '@/pages/TripWorkspace';
import { Badge, Modal } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/lib/toast';
import { useRouter } from '@/lib/router';
import { cn } from '@/lib/utils';

export function SettingsTab({ trip, userId, refresh }: WorkspaceTabProps) {
  const { toast } = useToast();
  const { navigate } = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState({
    name: trip.name,
    destination: trip.destination,
    budget: String(trip.estimated_budget),
    status: trip.status,
    notes: trip.notes ?? '',
  });
  const [saving, setSaving] = useState(false);

  const isOwner = trip.owner_id === userId;

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('trips')
      .update({
        name: form.name,
        destination: form.destination,
        estimated_budget: Number(form.budget),
        status: form.status,
        notes: form.notes || null,
      })
      .eq('id', trip.id);
    if (error) {
      toast(error.message, 'error');
      setSaving(false);
      return;
    }
    toast('Trip updated', 'success');
    setSaving(false);
    refresh();
  };

  const remove = async () => {
    const { error } = await supabase.from('trips').delete().eq('id', trip.id);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    toast('Trip deleted', 'success');
    navigate('/trips');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="section-title">Trip Settings</h2>
        <p className="text-sm text-slate-400 mt-0.5">Edit trip details, status, and manage the trip.</p>
      </div>

      {!isOwner && (
        <div className="glass-card p-4 border-glow-amber/30 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-glow-amber" />
          <p className="text-sm text-slate-300">Only the trip owner can change these settings.</p>
        </div>
      )}

      <div className="glass-card p-6 space-y-4">
        <div>
          <label className="label-text mb-1.5 block">Trip Name</label>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} disabled={!isOwner} className="input-field disabled:opacity-50" />
        </div>
        <div>
          <label className="label-text mb-1.5 block">Destination</label>
          <input value={form.destination} onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))} disabled={!isOwner} className="input-field disabled:opacity-50" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label-text mb-1.5 block">Budget (₹)</label>
            <input type="number" value={form.budget} onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))} disabled={!isOwner} className="input-field disabled:opacity-50" />
          </div>
          <div>
            <label className="label-text mb-1.5 block">Status</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as typeof form.status }))} disabled={!isOwner} className="input-field disabled:opacity-50">
              <option value="draft">Draft</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label-text mb-1.5 block">Notes</label>
          <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} disabled={!isOwner} rows={3} className="input-field resize-none disabled:opacity-50" />
        </div>
        {isOwner && (
          <button onClick={save} disabled={saving} className="btn-primary">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      {/* Danger zone */}
      {isOwner && (
        <div className="glass-card p-6 border-glow-rose/30">
          <h3 className="font-display text-base font-semibold text-white mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-glow-rose" /> Danger Zone
          </h3>
          <p className="text-sm text-slate-400 mb-4">Deleting a trip removes all its data — activities, board, chat, expenses, and documents. This cannot be undone.</p>
          <button onClick={() => setDeleteOpen(true)} className="btn-ghost text-glow-rose border-glow-rose/30 hover:bg-glow-rose/10">
            <Trash2 className="w-4 h-4" /> Delete Trip
          </button>
        </div>
      )}

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete this trip?">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-glow-rose/5 border border-glow-rose/30">
            <Plane className="w-8 h-8 text-glow-rose" />
            <div>
              <p className="text-sm font-semibold text-white">Delete "{trip.name}"?</p>
              <p className="text-xs text-slate-400">All {trip.destination} trip data will be permanently removed.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setDeleteOpen(false)} className="btn-ghost flex-1">Cancel</button>
            <button onClick={remove} className="btn-ghost flex-1 text-glow-rose border-glow-rose/30 hover:bg-glow-rose/10">
              <Trash2 className="w-4 h-4" /> Delete permanently
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
