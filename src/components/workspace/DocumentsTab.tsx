import { useMemo, useState } from 'react';
import { Plus, FileText, Ticket, Receipt, ShieldCheck, CreditCard, Plane, Hotel, Check, Sparkles, Trash2, Brain } from 'lucide-react';
import type { WorkspaceTabProps } from '@/pages/TripWorkspace';
import { Badge, Modal } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/lib/toast';
import { cn, relativeTime } from '@/lib/utils';
import { mockBookingOcr } from '@/lib/ai';
import type { TripDocument } from '@/lib/types';

const DOC_TYPES = [
  { key: 'ticket', label: 'Ticket', icon: Ticket, color: 'text-glow-cyan' },
  { key: 'receipt', label: 'Receipt', icon: Receipt, color: 'text-glow-amber' },
  { key: 'invoice', label: 'Invoice', icon: FileText, color: 'text-ai-300' },
  { key: 'visa', label: 'Visa', icon: CreditCard, color: 'text-glow-teal' },
  { key: 'insurance', label: 'Insurance', icon: ShieldCheck, color: 'text-glow-emerald' },
  { key: 'passport', label: 'Passport', icon: FileText, color: 'text-glow-rose' },
  { key: 'hotel', label: 'Hotel', icon: Hotel, color: 'text-glow-teal' },
  { key: 'booking', label: 'Booking', icon: Plane, color: 'text-glow-cyan' },
  { key: 'other', label: 'Other', icon: FileText, color: 'text-slate-400' },
];

export function DocumentsTab({ trip, userId, refresh }: WorkspaceTabProps) {
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanResult, setScanResult] = useState<ReturnType<typeof mockBookingOcr> | null>(null);
  const [docs, setDocs] = useState<TripDocument[]>([]);
  const [form, setForm] = useState({ name: '', docType: 'ticket' });

  // Load documents (we didn't pass them in props, fetch here)
  useMemo(() => {
    supabase.from('documents').select('*').eq('trip_id', trip.id).order('created_at', { ascending: false }).then(({ data }) => {
      setDocs((data as TripDocument[]) ?? []);
    });
  }, [trip.id]);

  const addDoc = async () => {
    if (!form.name) {
      toast('Enter a document name', 'error');
      return;
    }
    const { data, error } = await supabase
      .from('documents')
      .insert({
        trip_id: trip.id,
        name: form.name,
        doc_type: form.docType,
        uploaded_by: userId,
      })
      .select()
      .single();
    if (error || !data) {
      toast(error?.message ?? 'Failed to add', 'error');
      return;
    }
    setDocs((prev) => [data as TripDocument, ...prev]);
    toast('Document added', 'success');
    setForm({ name: '', docType: 'ticket' });
    setAddOpen(false);
    refresh();
  };

  const scanBooking = () => {
    const result = mockBookingOcr();
    setScanResult(result);
    toast('Document scanned — review extracted details', 'info');
  };

  const confirmScan = async () => {
    if (!scanResult) return;
    const name = scanResult.type === 'hotel' ? `${scanResult.hotelName} confirmation` : `${scanResult.type} ticket`;
    const { data } = await supabase
      .from('documents')
      .insert({
        trip_id: trip.id,
        name,
        doc_type: scanResult.type === 'hotel' ? 'hotel' : 'ticket',
        ai_category: scanResult.type === 'hotel' ? 'hotel' : 'ticket',
        extracted_data: scanResult,
        uploaded_by: userId,
        confirmed: true,
      })
      .select()
      .single();
    if (data) {
      setDocs((prev) => [data as TripDocument, ...prev]);
      toast('Document saved and categorized by AI', 'success');
      setScanResult(null);
      setScanOpen(false);
      refresh();
    }
  };

  const removeDoc = async (id: string) => {
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    setDocs((prev) => prev.filter((d) => d.id !== id));
    toast('Document removed', 'success');
  };

  const confirmCategory = async (doc: TripDocument) => {
    await supabase.from('documents').update({ confirmed: true, ai_category: doc.doc_type }).eq('id', doc.id);
    setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, confirmed: true } : d)));
    toast('Category confirmed', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Documents</h2>
          <p className="text-sm text-slate-400 mt-0.5">Store tickets, receipts, visas, and confirmations. AI organizes them after you confirm.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setScanOpen(true)} className="btn-ai text-sm">
            <Sparkles className="w-4 h-4" /> Scan
          </button>
          <button onClick={() => setAddOpen(true)} className="btn-primary text-sm">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Doc type grid */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
        {DOC_TYPES.map((t) => {
          const count = docs.filter((d) => d.doc_type === t.key).length;
          return (
            <div key={t.key} className="glass-card p-3 text-center">
              <t.icon className={cn('w-5 h-5 mx-auto mb-1.5', t.color)} />
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">{t.label}</div>
              <div className="text-sm font-bold text-white mt-0.5">{count}</div>
            </div>
          );
        })}
      </div>

      {/* Documents list */}
      <div>
        <h3 className="section-title mb-3">All Documents ({docs.length})</h3>
        {docs.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <FileText className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No documents yet. Upload tickets, confirmations, or scan a booking.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {docs.map((doc) => {
              const type = DOC_TYPES.find((t) => t.key === doc.doc_type) ?? DOC_TYPES[DOC_TYPES.length - 1];
              return (
                <div key={doc.id} className="glass-card p-4 flex items-center gap-4 group">
                  <div className={cn('w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center flex-shrink-0', type.color)}>
                    <type.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white truncate">{doc.name}</span>
                      {doc.confirmed ? (
                        <Badge variant="success"><Check className="w-3 h-3" /> confirmed</Badge>
                      ) : (
                        <Badge variant="warn">needs review</Badge>
                      )}
                      {doc.ai_category && <Badge variant="ai">AI: {doc.ai_category}</Badge>}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{type.label} · {relativeTime(doc.created_at)}</p>
                    {doc.extracted_data && (
                      <div className="mt-2 p-2 rounded-lg bg-ai-500/5 border border-ai-500/20">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Brain className="w-3 h-3 text-ai-300" />
                          <span className="text-[10px] uppercase tracking-wider text-ai-300 font-semibold">Extracted</span>
                        </div>
                        <div className="text-xs text-slate-300 space-y-0.5">
                          {Object.entries(doc.extracted_data).slice(0, 4).map(([k, v]) => (
                            <div key={k} className="flex justify-between gap-2">
                              <span className="text-slate-500 capitalize">{k.replace(/_/g, ' ')}</span>
                              <span className="text-white truncate max-w-[60%]">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!doc.confirmed && (
                      <button onClick={() => confirmCategory(doc)} className="p-1.5 rounded-lg text-glow-teal hover:bg-glow-teal/10" title="Confirm category">
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => removeDoc(doc.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-glow-rose hover:bg-glow-rose/10" title="Remove">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Document">
        <div className="space-y-4">
          <div>
            <label className="label-text mb-1.5 block">Document name</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Goa Flight Tickets" className="input-field" />
          </div>
          <div>
            <label className="label-text mb-2 block">Type</label>
            <div className="flex flex-wrap gap-2">
              {DOC_TYPES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setForm((f) => ({ ...f, docType: t.key }))}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm border transition-all flex items-center gap-1.5',
                    form.docType === t.key ? 'ai-gradient text-white border-transparent' : 'border-white/10 text-slate-400 hover:text-white',
                  )}
                >
                  <t.icon className="w-3.5 h-3.5" /> {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setAddOpen(false)} className="btn-ghost flex-1">Cancel</button>
            <button onClick={addDoc} className="btn-primary flex-1"><Plus className="w-4 h-4" /> Add</button>
          </div>
        </div>
      </Modal>

      {/* Scan modal */}
      <Modal open={scanOpen} onClose={() => setScanOpen(false)} title="Scan Booking / Ticket">
        <div className="space-y-4">
          <div className="glass-card p-8 text-center border-dashed border-2 border-white/10">
            <Plane className="w-10 h-10 text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-slate-400 mb-3">Upload a flight ticket, train ticket, hotel bill, or booking PDF</p>
            <button onClick={scanBooking} className="btn-ai"><Sparkles className="w-4 h-4" /> Scan Demo Booking</button>
          </div>
          {scanResult && (
            <div className="glass-card p-4 border-ai-500/30 animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-ai-300" />
                <span className="text-xs uppercase tracking-wider text-ai-300 font-semibold">AI extracted</span>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Type</span><span className="text-white capitalize">{scanResult.type}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Destination</span><span className="text-white">{scanResult.destination}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Date</span><span className="text-white">{scanResult.travelDate}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Passenger</span><span className="text-white">{scanResult.passengerName}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Booking ID</span><span className="text-white font-mono">{scanResult.bookingId}</span></div>
                {scanResult.hotelName && <div className="flex justify-between"><span className="text-slate-400">Hotel</span><span className="text-white">{scanResult.hotelName}</span></div>}
              </div>
              <button onClick={confirmScan} className="btn-primary w-full mt-3"><Check className="w-4 h-4" /> Confirm & Save</button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
