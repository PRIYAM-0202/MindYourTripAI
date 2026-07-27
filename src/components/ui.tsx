import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn, initials } from '@/lib/utils';

export function Avatar({
  name,
  src,
  size = 'md',
  className,
}: {
  name?: string | null;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
  };
  const gradient = name ? stringToGradient(name) : 'from-ai-500 to-glow-cyan';
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold text-white overflow-hidden flex-shrink-0',
        sizes[size],
        !src && `bg-gradient-to-br ${gradient}`,
        className,
      )}
    >
      {src ? (
        <img src={src} alt={name ?? ''} className="w-full h-full object-cover" />
      ) : (
        initials(name ?? undefined)
      )}
    </div>
  );
}

function stringToGradient(str: string): string {
  const gradients = [
    'from-ai-500 to-glow-cyan',
    'from-glow-teal to-ai-400',
    'from-glow-amber to-glow-rose',
    'from-glow-rose to-ai-500',
    'from-glow-cyan to-glow-teal',
    'from-ai-400 to-glow-teal',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
}

export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: ReactNode;
  variant?: 'default' | 'ai' | 'success' | 'warn' | 'danger' | 'info';
  className?: string;
}) {
  const variants = {
    default: 'border-white/10 bg-white/[0.04] text-slate-300',
    ai: 'border-ai-500/30 bg-ai-500/10 text-ai-200',
    success: 'border-glow-teal/30 bg-glow-teal/10 text-glow-teal',
    warn: 'border-glow-amber/30 bg-glow-amber/10 text-glow-amber',
    danger: 'border-glow-rose/30 bg-glow-rose/10 text-glow-rose',
    info: 'border-glow-cyan/30 bg-glow-cyan/10 text-glow-cyan',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Modal({
  open,
  onClose,
  children,
  title,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'glass-strong rounded-3xl w-full animate-scale-in max-h-[90vh] overflow-y-auto',
          sizes[size],
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-ink-800/80 backdrop-blur-xl z-10 rounded-t-3xl">
            <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function ProgressBar({
  value,
  className,
  variant = 'ai',
}: {
  value: number;
  className?: string;
  variant?: 'ai' | 'success' | 'warn' | 'danger';
}) {
  const variants = {
    ai: 'from-ai-500 to-glow-cyan',
    success: 'from-glow-teal to-glow-emerald',
    warn: 'from-glow-amber to-glow-rose',
    danger: 'from-glow-rose to-red-500',
  };
  return (
    <div className={cn('h-2 rounded-full bg-white/[0.06] overflow-hidden', className)}>
      <div
        className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-smooth', variants[variant])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center text-ai-300 mb-4">
        {icon}
      </div>
      <h3 className="font-display text-lg font-semibold text-white mb-1">{title}</h3>
      {subtitle && <p className="text-sm text-slate-400 max-w-sm mb-4">{subtitle}</p>}
      {action}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'w-5 h-5 border-2 border-white/20 border-t-ai-400 rounded-full animate-spin',
        className,
      )}
    />
  );
}
