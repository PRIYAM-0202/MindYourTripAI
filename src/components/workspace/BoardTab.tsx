import { useState } from 'react';
import { Plus, ThumbsUp, MessageSquare, Trash2, MapPin, Wallet, Send, X, GripVertical, Sparkles } from 'lucide-react';
import type { WorkspaceTabProps } from '@/pages/TripWorkspace';
import { Badge, Modal } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/lib/toast';
import { cn, formatCurrency, relativeTime } from '@/lib/utils';
import type { BoardCard, CardType, BoardColumn } from '@/lib/types';

const CARD_TYPE_COLORS: Record<CardType, string> = {
  place: 'text-glow-cyan',
  restaurant: 'text-glow-amber',
  hotel: 'text-glow-teal',
  activity: 'text-ai-300',
  packing: 'text-glow-rose',
  document: 'text-slate-400',
  shopping: 'text-glow-emerald',
  emergency: 'text-glow-red',
  note: 'text-slate-300',
  link: 'text-ai-300',
  image: 'text-glow-cyan',
};

export function BoardTab({ trip, columns, cards, setCards, userId, userName, refresh }: WorkspaceTabProps) {
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState<string | null>(null); // column id
  const [commentCard, setCommentCard] = useState<BoardCard | null>(null);
  const [comments, setComments] = useState<{ id: string; author_name: string; content: string; created_at: string }[]>([]);
  const [newComment, setNewComment] = useState('');
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', cardType: 'place' as CardType, location: '', cost: '0', description: '' });

  const addCard = async (columnId: string) => {
    if (!form.title) {
      toast('Enter a card title', 'error');
      return;
    }
    const { data, error } = await supabase
      .from('board_cards')
      .insert({
        column_id: columnId,
        trip_id: trip.id,
        title: form.title,
        description: form.description || null,
        card_type: form.cardType,
        location: form.location || null,
        estimated_cost: Number(form.cost),
        position: cards.filter((c) => c.column_id === columnId).length,
        created_by: userId,
      })
      .select()
      .single();
    if (error || !data) {
      toast(error?.message ?? 'Failed to add card', 'error');
      return;
    }
    setCards((prev) => [...prev, data as BoardCard]);
    toast('Card added to board', 'success');
    setForm({ title: '', cardType: 'place', location: '', cost: '0', description: '' });
    setAddOpen(null);
    refresh();
  };

  const moveCard = async (cardId: string, targetColumnId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.column_id === targetColumnId) return;
    const { error } = await supabase
      .from('board_cards')
      .update({ column_id: targetColumnId, position: cards.filter((c) => c.column_id === targetColumnId).length })
      .eq('id', cardId);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, column_id: targetColumnId } : c)));
    toast('Card moved', 'success');
  };

  const vote = async (card: BoardCard) => {
    // Optimistic vote toggle
    const { error } = await supabase.from('card_votes').insert({ card_id: card.id, user_id: userId }).select().single();
    if (error) {
      // Try remove (already voted)
      await supabase.from('card_votes').delete().eq('card_id', card.id).eq('user_id', userId);
      setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, vote_count: Math.max(0, c.vote_count - 1) } : c)));
      return;
    }
    setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, vote_count: c.vote_count + 1 } : c)));
  };

  const removeCard = async (id: string) => {
    const { error } = await supabase.from('board_cards').delete().eq('id', id);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    setCards((prev) => prev.filter((c) => c.id !== id));
    toast('Card removed', 'success');
  };

  const loadComments = async (card: BoardCard) => {
    setCommentCard(card);
    const { data } = await supabase
      .from('card_comments')
      .select('*')
      .eq('card_id', card.id)
      .order('created_at', { ascending: true });
    setComments((data as { id: string; author_name: string; content: string; created_at: string }[]) ?? []);
  };

  const addComment = async () => {
    if (!newComment.trim() || !commentCard) return;
    const { data } = await supabase
      .from('card_comments')
      .insert({ card_id: commentCard.id, user_id: userId, author_name: userName, content: newComment })
      .select()
      .single();
    if (data) {
      setComments((prev) => [...prev, data as { id: string; author_name: string; content: string; created_at: string }]);
      setNewComment('');
      await supabase.from('board_cards').update({ comment_count: (commentCard.comment_count ?? 0) + 1 }).eq('id', commentCard.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Trip Board</h2>
          <p className="text-sm text-slate-400 mt-0.5">Collaborate on places, hotels, activities. Vote, comment, and move cards across stages.</p>
        </div>
      </div>

      <div className="glass-card p-4 border-l-2 border-ai-500 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-ai-300 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-white">AI board assist</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Drag cards between columns to update their status. The AI watches the board and will suggest promotions
            (e.g. move a popular card to "Approved") and flag conflicts — but you make every move.
          </p>
        </div>
      </div>

      {/* Columns */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto">
        {columns.map((col: BoardColumn) => {
          const colCards = cards.filter((c) => c.column_id === col.id);
          return (
            <div
              key={col.id}
              onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id); }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={() => { if (draggedCard) moveCard(draggedCard, col.id); setDraggedCard(null); setDragOverCol(null); }}
              className={cn(
                'glass rounded-2xl p-3 min-h-[200px] flex flex-col transition-all',
                dragOverCol === col.id && 'border-ai-500/50 shadow-glow-soft',
              )}
            >
              <div className="flex items-center justify-between mb-2.5 px-1">
                <span className="text-xs font-semibold text-white uppercase tracking-wider">{col.title}</span>
                <span className="text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded-full">{colCards.length}</span>
              </div>

              <div className="flex-1 space-y-2">
                {colCards.map((card) => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={() => setDraggedCard(card.id)}
                    onDragEnd={() => setDraggedCard(null)}
                    className="rounded-xl bg-white/[0.04] border border-white/10 p-2.5 cursor-grab active:cursor-grabbing hover:border-ai-500/30 transition-all group"
                  >
                    <div className="flex items-start gap-1.5">
                      <GripVertical className="w-3 h-3 text-slate-600 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className={cn('text-[10px] font-medium uppercase', CARD_TYPE_COLORS[card.card_type])}>{card.card_type}</span>
                        <h4 className="text-sm font-medium text-white leading-snug mt-0.5">{card.title}</h4>
                        {card.location && <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" /> {card.location}</p>}
                        {card.estimated_cost > 0 && <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-0.5"><Wallet className="w-2.5 h-2.5" /> {formatCurrency(card.estimated_cost)}</p>}
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => vote(card)} className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-glow-teal transition-colors">
                            <ThumbsUp className="w-3 h-3" /> {card.vote_count}
                          </button>
                          <button onClick={() => loadComments(card)} className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-ai-300 transition-colors">
                            <MessageSquare className="w-3 h-3" /> {card.comment_count}
                          </button>
                          <button onClick={() => removeCard(card.id)} className="ml-auto text-slate-600 hover:text-glow-rose opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {colCards.length === 0 && (
                  <p className="text-[10px] text-slate-600 py-3 text-center">Drop cards here</p>
                )}
              </div>

              <button
                onClick={() => setAddOpen(col.id)}
                className="mt-2 flex items-center gap-1 text-xs text-slate-400 hover:text-white py-1.5 rounded-lg hover:bg-white/5 transition-all"
              >
                <Plus className="w-3 h-3" /> Add card
              </button>
            </div>
          );
        })}
      </div>

      {/* Add card modal */}
      <Modal open={addOpen !== null} onClose={() => setAddOpen(null)} title="Add Card">
        <div className="space-y-4">
          <div>
            <label className="label-text mb-1.5 block">Title</label>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Sunset at Fort Aguada" className="input-field" />
          </div>
          <div>
            <label className="label-text mb-2 block">Type</label>
            <div className="flex flex-wrap gap-1.5">
              {(['place', 'restaurant', 'hotel', 'activity', 'packing', 'note', 'link'] as CardType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm((f) => ({ ...f, cardType: t }))}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs border capitalize transition-all',
                    form.cardType === t ? 'ai-gradient text-white border-transparent' : 'border-white/10 text-slate-400',
                  )}
                >
                  {t}
                </button>
              ))}
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
          <div>
            <label className="label-text mb-1.5 block">Description (optional)</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="input-field resize-none" />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setAddOpen(null)} className="btn-ghost flex-1">Cancel</button>
            <button onClick={() => addOpen && addCard(addOpen)} className="btn-primary flex-1"><Plus className="w-4 h-4" /> Add Card</button>
          </div>
        </div>
      </Modal>

      {/* Comments modal */}
      <Modal open={commentCard !== null} onClose={() => setCommentCard(null)} title={commentCard?.title}>
        <div className="space-y-3">
          {comments.length === 0 && <p className="text-sm text-slate-400 py-3 text-center">No comments yet. Start the discussion.</p>}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full ai-gradient flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
                {(c.author_name ?? '?')[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{c.author_name}</span>
                  <span className="text-xs text-slate-500">{relativeTime(c.created_at)}</span>
                </div>
                <p className="text-sm text-slate-300 mt-0.5">{c.content}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-2 pt-2 border-t border-white/10">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addComment()}
              placeholder="Add a comment..."
              className="input-field flex-1"
            />
            <button onClick={addComment} className="btn-primary px-3">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
