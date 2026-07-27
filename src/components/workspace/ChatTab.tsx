import { useEffect, useRef, useState } from 'react';
import { Send, Pin, Reply, Smile, Paperclip, Mic, Search, Sparkles, Brain, Check, CheckCheck } from 'lucide-react';
import type { WorkspaceTabProps } from '@/pages/TripWorkspace';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/lib/toast';
import { cn, relativeTime } from '@/lib/utils';
import { buildTripSummary } from '@/lib/ai';
import type { Message } from '@/lib/types';

export function ChatTab({ trip, messages, setMessages, userId, userName, activities, expenses, approvals, refresh }: WorkspaceTabProps) {
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [search, setSearch] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const payload = {
      trip_id: trip.id,
      user_id: userId,
      author_name: userName,
      content: input,
      message_type: replyTo ? 'reply' : 'text',
      reply_to: replyTo?.id ?? null,
    };
    const { data, error } = await supabase.from('messages').insert(payload).select().single();
    if (error || !data) {
      toast(error?.message ?? 'Failed to send', 'error');
      return;
    }
    setMessages((prev) => [...prev, data as Message]);
    setInput('');
    setReplyTo(null);
  };

  const sendSystem = async (content: string) => {
    const { data } = await supabase
      .from('messages')
      .insert({ trip_id: trip.id, content, message_type: 'system', is_system: true, author_name: 'System' })
      .select()
      .single();
    if (data) {
      setMessages((prev) => [...prev, data as Message]);
      refresh();
    }
  };

  const togglePin = async (msg: Message) => {
    await supabase.from('messages').update({ is_pinned: !msg.is_pinned }).eq('id', msg.id);
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_pinned: !m.is_pinned } : m)));
  };

  const react = async (msg: Message, emoji: string) => {
    const reactions = { ...msg.reactions };
    const users = reactions[emoji] ?? [];
    const newUsers = users.includes(userName) ? users.filter((u) => u !== userName) : [...users, userName];
    if (newUsers.length === 0) delete reactions[emoji];
    else reactions[emoji] = newUsers;
    await supabase.from('messages').update({ reactions }).eq('id', msg.id);
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, reactions } : m)));
  };

  const summary = buildTripSummary({ trip, activities, expenses, approvals });
  const filtered = search ? messages.filter((m) => m.content?.toLowerCase().includes(search.toLowerCase())) : messages;
  const pinned = filtered.filter((m) => m.is_pinned);
  const regular = filtered.filter((m) => !m.is_pinned);

  return (
    <div className="flex flex-col h-[calc(100vh-320px)] min-h-[500px]">
      {/* Header bar */}
      <div className="glass-card p-3 mb-3 flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages..."
            className="input-field pl-9 py-2 text-sm"
          />
        </div>
        <button
          onClick={() => setShowSummary((s) => !s)}
          className="btn-ai text-sm py-2"
        >
          <Brain className="w-4 h-4" /> AI Summary
        </button>
      </div>

      {showSummary && (
        <div className="glass-card p-4 mb-3 border-ai-500/30 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-ai-300" />
            <span className="text-xs uppercase tracking-wider text-ai-300 font-semibold">AI Discussion Summary</span>
          </div>
          <p className="text-sm text-slate-200">{summary}</p>
          <p className="text-xs text-slate-500 mt-2">The AI only summarizes when requested — it never interrupts conversations.</p>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto glass-card p-4 space-y-3">
        {pinned.length > 0 && (
          <div className="space-y-2 pb-3 border-b border-white/10 mb-1">
            {pinned.map((m) => (
              <MessageBubble key={m.id} msg={m} onPin={() => togglePin(m)} onReact={react} onReply={() => setReplyTo(m)} own={m.user_id === userId} pinned />
            ))}
          </div>
        )}
        {regular.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-8">
            <Send className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-sm text-slate-400">No messages yet. Start the conversation.</p>
          </div>
        ) : (
          regular.map((m) => (
            <MessageBubble key={m.id} msg={m} onPin={() => togglePin(m)} onReact={react} onReply={() => setReplyTo(m)} own={m.user_id === userId} replyToMsg={m.reply_to ? messages.find((x) => x.id === m.reply_to) : undefined} />
          ))
        )}
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="glass-card p-2.5 mb-2 flex items-center gap-2 animate-fade-in">
          <Reply className="w-3.5 h-3.5 text-ai-300" />
          <span className="text-xs text-slate-400 flex-1 truncate">Replying to: {replyTo.content}</span>
          <button onClick={() => setReplyTo(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Input */}
      <div className="glass-card p-2.5 mt-3 flex items-center gap-2">
        <button onClick={() => toast('Attachments coming soon', 'info')} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5">
          <Paperclip className="w-4 h-4" />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Type a message..."
          className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 py-2 focus:outline-none"
        />
        <button onClick={() => toast('Voice notes coming soon', 'info')} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5">
          <Mic className="w-4 h-4" />
        </button>
        <button onClick={send} disabled={!input.trim()} className="w-9 h-9 rounded-lg ai-gradient text-white flex items-center justify-center disabled:opacity-30 hover:scale-105 active:scale-95 transition-all">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function MessageBubble({
  msg,
  own,
  onPin,
  onReact,
  onReply,
  replyToMsg,
  pinned,
}: {
  msg: Message;
  own: boolean;
  onPin: () => void;
  onReact: (msg: Message, emoji: string) => void;
  onReply: () => void;
  replyToMsg?: Message;
  pinned?: boolean;
}) {
  const [showActions, setShowActions] = useState(false);
  const EMOJIS = ['👍', '❤️', '😂', '🎉'];

  if (msg.is_system) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-slate-500 bg-white/5 px-3 py-1 rounded-full border border-white/10">
          {msg.content}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn('flex gap-2.5 group', own && 'flex-row-reverse')}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-semibold', own ? 'ai-gradient text-white' : 'bg-white/5 text-slate-300 border border-white/10')}>
        {(msg.author_name ?? '?')[0]?.toUpperCase()}
      </div>
      <div className={cn('max-w-[75%]', own && 'items-end flex flex-col')}>
        <div className={cn('flex items-center gap-2 mb-0.5', own && 'flex-row-reverse')}>
          <span className="text-xs font-medium text-white">{msg.author_name}</span>
          <span className="text-[10px] text-slate-500">{relativeTime(msg.created_at)}</span>
          {own && <CheckCheck className="w-3 h-3 text-ai-300" />}
        </div>
        {replyToMsg && (
          <div className={cn('text-xs text-slate-500 mb-1 px-2 py-1 rounded bg-white/[0.03] border-l-2 border-ai-500/40', own && 'text-right')}>
            Replying to: {replyToMsg.content?.slice(0, 50)}
          </div>
        )}
        <div className={cn('rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed', own ? 'ai-gradient text-white rounded-tr-sm' : 'bg-white/[0.04] border border-white/10 text-slate-200 rounded-tl-sm')}>
          {msg.content}
        </div>
        {/* Reactions */}
        {Object.keys(msg.reactions ?? {}).length > 0 && (
          <div className={cn('flex gap-1 mt-1', own && 'flex-row-reverse')}>
            {Object.entries(msg.reactions).map(([emoji, users]) => (
              <button key={emoji} onClick={() => onReact(msg, emoji)} className="text-xs bg-white/5 border border-white/10 rounded-full px-1.5 py-0.5 hover:bg-white/10">
                {emoji} {users.length}
              </button>
            ))}
          </div>
        )}
        {/* Actions */}
        {showActions && (
          <div className={cn('flex items-center gap-1 mt-1 animate-fade-in', own && 'flex-row-reverse')}>
            {EMOJIS.map((e) => (
              <button key={e} onClick={() => onReact(msg, e)} className="text-sm p-1 rounded hover:bg-white/10">{e}</button>
            ))}
            <button onClick={onReply} className="p-1 rounded hover:bg-white/10 text-slate-400"><Reply className="w-3.5 h-3.5" /></button>
            <button onClick={onPin} className="p-1 rounded hover:bg-white/10 text-slate-400"><Pin className={cn('w-3.5 h-3.5', pinned && 'text-glow-amber fill-current')} /></button>
          </div>
        )}
      </div>
    </div>
  );
}
