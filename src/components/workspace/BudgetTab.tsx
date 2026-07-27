import { useMemo, useState } from 'react';
import {
  Plus,
  Mic,
  Receipt,
  FileText,
  Wallet,
  Trash2,
  Sparkles,
  Brain,
  Check,
  Edit3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import type { WorkspaceTabProps } from '@/pages/TripWorkspace';
import { Badge, Modal, ProgressBar } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/lib/toast';
import { cn, formatCurrency, relativeTime } from '@/lib/utils';
import { mockReceiptOcr, parseVoiceExpense, recommendExpenseSplit, type ParsedVoiceExpense } from '@/lib/ai';
import type { Expense, ExpenseCategory, ExpenseSource } from '@/lib/types';

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  food: 'text-glow-amber',
  transport: 'text-ai-300',
  accommodation: 'text-glow-teal',
  activity: 'text-glow-cyan',
  shopping: 'text-glow-emerald',
  general: 'text-slate-300',
};

const CATEGORY_BG: Record<ExpenseCategory, string> = {
  food: 'bg-glow-amber/10 border-glow-amber/30',
  transport: 'bg-ai-500/10 border-ai-500/30',
  accommodation: 'bg-glow-teal/10 border-glow-teal/30',
  activity: 'bg-glow-cyan/10 border-glow-cyan/30',
  shopping: 'bg-glow-emerald/10 border-glow-emerald/30',
  general: 'bg-white/5 border-white/10',
};

export function BudgetTab({ trip, members, expenses, setExpenses, userId, userName, refresh }: WorkspaceTabProps) {
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [splitModal, setSplitModal] = useState<Expense | null>(null);
  const [voiceText, setVoiceText] = useState('');
  const [parsedVoice, setParsedVoice] = useState<ParsedVoiceExpense | null>(null);
  const [listening, setListening] = useState(false);
  const [receiptData, setReceiptData] = useState<ReturnType<typeof mockReceiptOcr> | null>(null);
  const [form, setForm] = useState({
    title: '',
    category: 'food' as ExpenseCategory,
    amount: '',
    paidBy: userName,
    source: 'manual' as ExpenseSource,
  });

  const totalSpend = expenses.reduce((s, e) => s + e.amount, 0);
  const budgetPct = trip.estimated_budget > 0 ? Math.round((totalSpend / trip.estimated_budget) * 100) : 0;
  const remaining = trip.estimated_budget - totalSpend;

  const categorySpend = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => { map[e.category] = (map[e.category] ?? 0) + e.amount; });
    return map;
  }, [expenses]);

  const memberList = members
    .filter((m) => m.status === 'accepted')
    .map((m) => ({ id: m.id, label: m.profile?.full_name ?? m.email ?? m.phone ?? 'Member' }));

  const aiInsights = useMemo(() => {
    const out: { text: string; type: 'warning' | 'info' | 'success' }[] = [];
    if (budgetPct >= 80) out.push({ text: `You've already spent ${budgetPct}% of your budget.`, type: 'warning' });
    const transportPct = trip.estimated_budget > 0 ? ((categorySpend['transport'] ?? 0) / trip.estimated_budget) * 100 : 0;
    if (transportPct > 40) out.push({ text: 'Transportation is costing more than expected.', type: 'warning' });
    const foodPct = trip.estimated_budget > 0 ? ((categorySpend['food'] ?? 0) / trip.estimated_budget) * 100 : 0;
    if (foodPct < 10 && expenses.length > 3) out.push({ text: 'Food expenses are lower than similar trips.', type: 'info' });
    if (budgetPct < 50 && expenses.length > 2) out.push({ text: `You can save approximately ${formatCurrency(Math.round(trip.estimated_budget * 0.12), trip.currency)} by changing the hotel.`, type: 'info' });
    if (budgetPct > 0 && budgetPct < 70) out.push({ text: 'Budget is on track for this stage of planning.', type: 'success' });
    return out;
  }, [budgetPct, categorySpend, expenses.length, trip]);

  const addExpense = async (override?: Partial<Expense>) => {
    const payload = {
      trip_id: trip.id,
      title: override?.title ?? form.title,
      category: override?.category ?? form.category,
      amount: Number(override?.amount ?? form.amount),
      currency: trip.currency,
      paid_by_name: override?.paid_by_name ?? form.paidBy,
      source: override?.source ?? form.source,
      confirmed: false,
      created_by: userId,
    };
    if (!payload.title || !payload.amount) {
      toast('Enter a title and amount', 'error');
      return;
    }
    const { data, error } = await supabase.from('expenses').insert(payload).select().single();
    if (error || !data) {
      toast(error?.message ?? 'Failed to add expense', 'error');
      return;
    }
    // Compute AI split recommendation
    const split = recommendExpenseSplit(payload.amount, memberList, []);
    await supabase.from('expenses').update({ ai_split_recommendation: Object.fromEntries(split.splits.map((s) => [s.memberKey, s.share])) }).eq('id', data.id);
    setExpenses((prev) => [{ ...(data as Expense), ai_split_recommendation: Object.fromEntries(split.splits.map((s) => [s.memberKey, s.share])) }, ...prev]);
    toast('Expense added — review the AI split suggestion', 'success');
    setForm({ title: '', category: 'food', amount: '', paidBy: userName, source: 'manual' });
    setAddOpen(false);
    setVoiceOpen(false);
    setReceiptOpen(false);
    refresh();
  };

  const parseVoice = () => {
    const parsed = parseVoiceExpense(voiceText);
    setParsedVoice(parsed);
    toast(`Parsed: ${parsed.title}, ${formatCurrency(parsed.amount)}`, parsed.amount > 0 ? 'success' : 'info');
  };

  const submitVoice = () => {
    if (!parsedVoice || parsedVoice.amount === 0) {
      toast('Could not parse the expense. Try rephrasing.', 'error');
      return;
    }
    addExpense({
      title: parsedVoice.title,
      category: parsedVoice.category as ExpenseCategory,
      amount: parsedVoice.amount,
      paid_by_name: parsedVoice.paidByName ?? userName,
      source: 'voice',
    });
    setVoiceText('');
    setParsedVoice(null);
  };

  const scanReceipt = () => {
    setListening(false);
    const data = mockReceiptOcr();
    setReceiptData(data);
    toast('Receipt scanned — review extracted details', 'info');
  };

  const submitReceipt = () => {
    if (!receiptData) return;
    addExpense({
      title: receiptData.merchant,
      category: receiptData.suggestedCategory as ExpenseCategory,
      amount: receiptData.total,
      paid_by_name: userName,
      source: 'receipt',
    });
    setReceiptData(null);
  };

  const removeExpense = async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    toast('Expense removed', 'success');
  };

  const confirmSplit = async (expense: Expense, split: Record<string, number>) => {
    await supabase.from('expenses').update({ confirmed_split: split, confirmed: true }).eq('id', expense.id);
    setExpenses((prev) => prev.map((e) => (e.id === expense.id ? { ...e, confirmed_split: split, confirmed: true } : e)));
    toast('Expense split confirmed', 'success');
    setSplitModal(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Smart Budget</h2>
          <p className="text-sm text-slate-400 mt-0.5">Track expenses with AI-assisted fair splitting. You confirm every split.</p>
        </div>
      </div>

      {/* Budget overview */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="glass-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title">Budget Health</h3>
            <Badge variant={budgetPct > 85 ? 'danger' : budgetPct > 60 ? 'warn' : 'success'}>{budgetPct}% used</Badge>
          </div>
          <div className="flex items-end justify-between mb-2">
            <div>
              <div className="text-xs text-slate-400">Total spent</div>
              <div className="font-display text-2xl font-bold text-white">{formatCurrency(totalSpend, trip.currency)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">of {formatCurrency(trip.estimated_budget, trip.currency)}</div>
              <div className="text-sm text-glow-teal font-medium">{formatCurrency(Math.max(remaining, 0), trip.currency)} left</div>
            </div>
          </div>
          <ProgressBar value={budgetPct} variant={budgetPct > 85 ? 'danger' : budgetPct > 60 ? 'warn' : 'ai'} />
        </div>

        <div className="glass-card p-5">
          <h3 className="section-title mb-3">By Category</h3>
          <div className="space-y-2">
            {(['food', 'transport', 'accommodation', 'activity', 'shopping'] as ExpenseCategory[]).map((cat) => {
              const amt = categorySpend[cat] ?? 0;
              const pct = totalSpend > 0 ? (amt / totalSpend) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={cn('capitalize', CATEGORY_COLORS[cat])}>{cat}</span>
                    <span className="text-slate-400">{formatCurrency(amt, trip.currency)}</span>
                  </div>
                  <ProgressBar value={pct} variant="ai" className="h-1.5" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI insights */}
      {aiInsights.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg ai-gradient flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <h3 className="section-title">AI Budget Intelligence</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {aiInsights.map((ins, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-start gap-2.5 p-3 rounded-xl border text-sm',
                  ins.type === 'warning' && 'bg-glow-amber/5 border-glow-amber/30',
                  ins.type === 'info' && 'bg-ai-500/5 border-ai-500/30',
                  ins.type === 'success' && 'bg-glow-teal/5 border-glow-teal/30',
                )}
              >
                {ins.type === 'warning' && <AlertTriangle className="w-4 h-4 text-glow-amber flex-shrink-0 mt-0.5" />}
                {ins.type === 'info' && <Sparkles className="w-4 h-4 text-ai-300 flex-shrink-0 mt-0.5" />}
                {ins.type === 'success' && <CheckCircle2 className="w-4 h-4 text-glow-teal flex-shrink-0 mt-0.5" />}
                <span className="text-slate-200">{ins.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add expense methods */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button onClick={() => setAddOpen(true)} className="glass-card glass-hover p-4 text-left">
          <div className="w-9 h-9 rounded-xl ai-gradient-soft border border-ai-500/30 flex items-center justify-center mb-2">
            <Plus className="w-4 h-4 text-ai-300" />
          </div>
          <h3 className="text-sm font-semibold text-white">Manual Entry</h3>
          <p className="text-xs text-slate-400 mt-0.5">Add by hand</p>
        </button>
        <button onClick={() => setVoiceOpen(true)} className="glass-card glass-hover p-4 text-left">
          <div className="w-9 h-9 rounded-xl bg-glow-cyan/10 border border-glow-cyan/30 flex items-center justify-center mb-2">
            <Mic className="w-4 h-4 text-glow-cyan" />
          </div>
          <h3 className="text-sm font-semibold text-white">Voice Input</h3>
          <p className="text-xs text-slate-400 mt-0.5">Speak to add</p>
        </button>
        <button onClick={() => setReceiptOpen(true)} className="glass-card glass-hover p-4 text-left">
          <div className="w-9 h-9 rounded-xl bg-glow-amber/10 border border-glow-amber/30 flex items-center justify-center mb-2">
            <Receipt className="w-4 h-4 text-glow-amber" />
          </div>
          <h3 className="text-sm font-semibold text-white">Receipt Scan</h3>
          <p className="text-xs text-slate-400 mt-0.5">Upload receipt</p>
        </button>
        <button onClick={() => toast('Upload tickets and booking PDFs in the Documents tab', 'info')} className="glass-card glass-hover p-4 text-left">
          <div className="w-9 h-9 rounded-xl bg-glow-teal/10 border border-glow-teal/30 flex items-center justify-center mb-2">
            <FileText className="w-4 h-4 text-glow-teal" />
          </div>
          <h3 className="text-sm font-semibold text-white">Booking Scan</h3>
          <p className="text-xs text-slate-400 mt-0.5">Tickets & hotels</p>
        </button>
      </div>

      {/* Expenses list */}
      <div>
        <h3 className="section-title mb-3">Expenses ({expenses.length})</h3>
        {expenses.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Wallet className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No expenses recorded yet. Add your first one above.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {expenses.map((e) => (
              <div key={e.id} className="glass-card p-4 flex items-center gap-4 group">
                <div className={cn('w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0', CATEGORY_BG[e.category])}>
                  <Wallet className={cn('w-4 h-4', CATEGORY_COLORS[e.category])} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white truncate">{e.title}</span>
                    {e.source !== 'manual' && (
                      <Badge variant="info">{e.source}</Badge>
                    )}
                    {e.confirmed ? (
                      <Badge variant="success"><Check className="w-3 h-3" /> confirmed</Badge>
                    ) : (
                      <Badge variant="warn">pending split</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Paid by {e.paid_by_name} · {relativeTime(e.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-display text-base font-bold text-white">{formatCurrency(e.amount, e.currency)}</div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setSplitModal(e)} className="p-1.5 rounded-lg text-ai-300 hover:bg-ai-500/10" title="Review split">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => removeExpense(e.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-glow-rose hover:bg-glow-rose/10" title="Remove">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Expense">
        <div className="space-y-4">
          <div>
            <label className="label-text mb-1.5 block">Title</label>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Dinner at Beach Shack" className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-text mb-1.5 block">Amount (₹)</label>
              <input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="label-text mb-1.5 block">Category</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ExpenseCategory }))} className="input-field">
                <option value="food">Food</option>
                <option value="transport">Transport</option>
                <option value="accommodation">Accommodation</option>
                <option value="activity">Activity</option>
                <option value="shopping">Shopping</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label-text mb-1.5 block">Paid by</label>
            <input value={form.paidBy} onChange={(e) => setForm((f) => ({ ...f, paidBy: e.target.value }))} className="input-field" />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setAddOpen(false)} className="btn-ghost flex-1">Cancel</button>
            <button onClick={() => addExpense()} className="btn-primary flex-1"><Plus className="w-4 h-4" /> Add</button>
          </div>
        </div>
      </Modal>

      {/* Voice modal */}
      <Modal open={voiceOpen} onClose={() => setVoiceOpen(false)} title="Voice Expense Entry">
        <div className="space-y-4">
          <div className="glass-card p-4 border-ai-500/30 text-center">
            <button
              onClick={() => { setListening(!listening); if (!listening) toast('Listening... (demo mode — type or use the example)', 'info'); }}
              className={cn('w-16 h-16 rounded-full flex items-center justify-center mx-auto transition-all', listening ? 'ai-gradient shadow-glow-lg scale-110' : 'bg-white/5 border border-white/10')}
            >
              <Mic className={cn('w-7 h-7', listening ? 'text-white' : 'text-ai-300')} />
            </button>
            <p className="text-xs text-slate-400 mt-2">{listening ? 'Listening... tap to stop' : 'Tap to speak'}</p>
          </div>
          <div>
            <label className="label-text mb-1.5 block">Or type what you'd say</label>
            <textarea
              value={voiceText}
              onChange={(e) => setVoiceText(e.target.value)}
              placeholder="e.g. I paid ₹2,400 for dinner for Priyam, Aman and Rahul"
              rows={3}
              className="input-field resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={parseVoice} disabled={!voiceText} className="btn-ghost flex-1"><Brain className="w-4 h-4" /> Parse</button>
            <button onClick={submitVoice} disabled={!parsedVoice} className="btn-primary flex-1"><Check className="w-4 h-4" /> Confirm</button>
          </div>
          {parsedVoice && (
            <div className="glass-card p-4 border-ai-500/30 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-ai-300" />
                <span className="text-xs uppercase tracking-wider text-ai-300 font-semibold">AI parsed</span>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Title</span><span className="text-white">{parsedVoice.title}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Amount</span><span className="text-white font-semibold">{formatCurrency(parsedVoice.amount)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Category</span><span className="text-white capitalize">{parsedVoice.category}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Paid by</span><span className="text-white">{parsedVoice.paidByName ?? 'You'}</span></div>
                {parsedVoice.participants.length > 0 && (
                  <div className="flex justify-between"><span className="text-slate-400">Participants</span><span className="text-white">{parsedVoice.participants.join(', ')}</span></div>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Receipt modal */}
      <Modal open={receiptOpen} onClose={() => setReceiptOpen(false)} title="Receipt Scanner">
        <div className="space-y-4">
          <div className="glass-card p-8 text-center border-dashed border-2 border-white/10">
            <Receipt className="w-10 h-10 text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-slate-400 mb-3">Upload a restaurant or shop receipt</p>
            <button onClick={scanReceipt} className="btn-ai"><Sparkles className="w-4 h-4" /> Scan Demo Receipt</button>
          </div>
          {receiptData && (
            <div className="glass-card p-4 border-ai-500/30 animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-ai-300" />
                <span className="text-xs uppercase tracking-wider text-ai-300 font-semibold">AI extracted</span>
              </div>
              <div className="font-display text-lg font-bold text-white mb-2">{receiptData.merchant}</div>
              <div className="space-y-1 text-sm border-t border-white/10 pt-2">
                {receiptData.items.map((it, i) => (
                  <div key={i} className="flex justify-between text-slate-300">
                    <span>{it.name}</span><span>{formatCurrency(it.price)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1 text-sm border-t border-white/10 pt-2 mt-2">
                <div className="flex justify-between text-slate-400"><span>Taxes</span><span>{formatCurrency(receiptData.taxes)}</span></div>
                <div className="flex justify-between text-white font-semibold"><span>Total</span><span>{formatCurrency(receiptData.total)}</span></div>
              </div>
              <button onClick={submitReceipt} className="btn-primary w-full mt-3"><Check className="w-4 h-4" /> Confirm & Add Expense</button>
            </div>
          )}
        </div>
      </Modal>

      {/* Split review modal */}
      {splitModal && (
        <SplitModal
          expense={splitModal}
          members={memberList}
          onConfirm={(id, split) => {
            const exp = expenses.find((e) => e.id === id);
            if (exp) confirmSplit(exp, split);
          }}
          onClose={() => setSplitModal(null)}
        />
      )}
    </div>
  );
}

function SplitModal({
  expense,
  members,
  onConfirm,
  onClose,
}: {
  expense: Expense;
  members: { id: string; label: string }[];
  onConfirm: (id: string, split: Record<string, number>) => void;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const participants = expense.participants ?? [];
  const { splits, rationale } = recommendExpenseSplit(expense.amount, members, participants);
  const [selected, setSelected] = useState<string[]>(splits.filter((s) => s.isParticipant).map((s) => s.memberKey));
  const [amounts, setAmounts] = useState<Record<string, number>>(Object.fromEntries(splits.map((s) => [s.memberKey, s.share])));

  const recalc = (newSelected: string[]) => {
    setSelected(newSelected);
    const perHead = expense.amount / Math.max(newSelected.length, 1);
    const newAmounts: Record<string, number> = {};
    members.forEach((m) => { newAmounts[m.id] = newSelected.includes(m.id) ? perHead : 0; });
    setAmounts(newAmounts);
  };

  const toggle = (id: string) => {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    recalc(next);
  };

  const total = Object.values(amounts).reduce((s, n) => s + n, 0);

  return (
    <Modal open onClose={onClose} title={`Split: ${expense.title}`}>
      <div className="space-y-4">
        <div className="glass-card p-3 border-ai-500/30 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-ai-300 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-ai-300 uppercase tracking-wider mb-0.5">AI Recommendation</p>
            <p className="text-sm text-slate-300">{rationale}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-slate-400 mb-2">Select who participated — the AI splits only among them. You can adjust amounts manually.</p>
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className={cn('flex items-center gap-3 p-3 rounded-xl border transition-all', selected.includes(m.id) ? 'border-ai-500/30 bg-ai-500/5' : 'border-white/10 bg-white/[0.02]')}>
                <button
                  onClick={() => toggle(m.id)}
                  className={cn('w-5 h-5 rounded-md border flex items-center justify-center transition-all', selected.includes(m.id) ? 'ai-gradient border-transparent' : 'border-white/20')}
                >
                  {selected.includes(m.id) && <Check className="w-3 h-3 text-white" />}
                </button>
                <span className="text-sm text-white flex-1">{m.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500">₹</span>
                  <input
                    type="number"
                    value={amounts[m.id] ?? 0}
                    disabled={!selected.includes(m.id)}
                    onChange={(e) => setAmounts((prev) => ({ ...prev, [m.id]: Number(e.target.value) }))}
                    className="w-20 bg-ink-900/60 border border-white/10 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-ai-500/40 disabled:opacity-40"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10">
          <span className="text-sm text-slate-400">Total split</span>
          <span className={cn('font-display text-lg font-bold', Math.abs(total - expense.amount) < 1 ? 'text-glow-teal' : 'text-glow-amber')}>
            {formatCurrency(total, expense.currency)}
            {Math.abs(total - expense.amount) >= 1 && (
              <span className="text-xs text-glow-amber ml-2">≠ {formatCurrency(expense.amount, expense.currency)}</span>
            )}
          </span>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button
            onClick={() => {
              if (Math.abs(total - expense.amount) >= 1) {
                toast('Split total does not match the expense amount', 'error');
                return;
              }
              onConfirm(expense.id, amounts);
            }}
            className="btn-primary flex-1"
          >
            <Check className="w-4 h-4" /> Confirm Split
          </button>
        </div>
      </div>
    </Modal>
  );
}
