import { useEffect, useRef, useState } from 'react';
import { Sparkles, Send, X, Brain, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { assistantRespond } from '@/lib/ai';
import type { Activity, Approval, Expense, Trip, TripMember } from '@/lib/types';

interface AssistantMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

interface AssistantContext {
  trip: Trip;
  members: TripMember[];
  activities: Activity[];
  expenses: Expense[];
  approvals: Approval[];
}

const SUGGESTED_QUESTIONS = [
  'What are we missing?',
  'Summarize today\'s progress',
  'How much budget remains?',
  'Suggest cheaper hotels',
  'Generate packing suggestions',
  'What activities are pending approval?',
];

export function AIAssistant({
  context,
  buttonClassName,
}: {
  context: AssistantContext | null;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  const send = (text: string) => {
    if (!text.trim() || !context) return;
    const userMsg: AssistantMessage = { id: Math.random().toString(36).slice(2), role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      const reply = assistantRespond(text, context);
      setMessages((prev) => [
        ...prev,
        { id: Math.random().toString(36).slice(2), role: 'ai', text: reply.text },
      ]);
      setTyping(false);
    }, 700 + Math.random() * 500);
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'fixed bottom-6 right-6 z-[70] w-14 h-14 rounded-full ai-gradient text-white shadow-glow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95',
          open && 'rotate-90',
          buttonClassName,
        )}
        aria-label="Open AI Assistant"
      >
        {open ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
        {!open && (
          <span className="absolute inset-0 rounded-full ai-gradient animate-ping opacity-30" />
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-[70] w-[calc(100vw-3rem)] sm:w-[400px] h-[560px] max-h-[75vh] glass-strong rounded-3xl flex flex-col overflow-hidden animate-scale-in origin-bottom-right">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-white/10 bg-gradient-to-r from-ai-500/10 to-transparent flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl ai-gradient flex items-center justify-center shadow-glow">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-sm font-semibold text-white">AI Assistant</h3>
              <p className="text-[11px] text-ai-300">
                {context ? `Context: ${context.trip.name}` : 'Ask me anything'}
              </p>
            </div>
            <span className="flex items-center gap-1 text-[10px] text-glow-teal">
              <span className="w-1.5 h-1.5 rounded-full bg-glow-teal animate-pulse" /> online
            </span>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center px-2">
                <div className="w-12 h-12 rounded-2xl ai-gradient-soft border border-ai-500/30 flex items-center justify-center mb-3">
                  <MessageSquare className="w-6 h-6 text-ai-300" />
                </div>
                <h4 className="font-display text-sm font-semibold text-white mb-1">Ask the AI Assistant</h4>
                <p className="text-xs text-slate-400 mb-4">
                  I can summarize progress, check budget, suggest savings, and flag pending approvals.
                </p>
                <div className="space-y-1.5 w-full">
                  {SUGGESTED_QUESTIONS.slice(0, 4).map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      disabled={!context}
                      className="w-full text-left text-xs text-slate-300 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 hover:border-ai-500/30 hover:bg-ai-500/[0.06] transition-all disabled:opacity-40"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={cn('flex gap-2.5 animate-fade-up', m.role === 'user' && 'flex-row-reverse')}
              >
                <div
                  className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                    m.role === 'ai'
                      ? 'ai-gradient text-white'
                      : 'bg-white/[0.06] text-slate-300 border border-white/10',
                  )}
                >
                  {m.role === 'ai' ? <Sparkles className="w-3.5 h-3.5" /> : 'You'}
                </div>
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                    m.role === 'ai'
                      ? 'bg-white/[0.04] border border-white/10 text-slate-200 rounded-tl-sm'
                      : 'ai-gradient text-white rounded-tr-sm',
                  )}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-lg ai-gradient flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-white/[0.04] border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-ai-300 animate-typing-dot"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/10 bg-ink-900/50">
            <div className="flex items-center gap-2 rounded-xl bg-ink-900/60 border border-white/10 focus-within:border-ai-500/40 transition-all px-3 py-1">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send(input)}
                placeholder={context ? 'Ask about this trip...' : 'Select a trip to ask about'}
                disabled={!context}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 py-2 focus:outline-none disabled:opacity-50"
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || !context || typing}
                className="w-8 h-8 rounded-lg ai-gradient text-white flex items-center justify-center disabled:opacity-30 transition-all hover:scale-105 active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 text-center">
              AI assists. You decide. Always confirm suggestions before acting.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
