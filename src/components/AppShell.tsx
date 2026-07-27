import { useState, type ReactNode } from 'react';
import {
  Home,
  Plane,
  LayoutGrid,
  MessageSquare,
  Sparkles,
  Wallet,
  FileText,
  Bell,
  User,
  Settings,
  Compass,
  Menu,
  X,
  LogOut,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { Link, useRouter } from '@/lib/router';
import { Avatar } from './ui';
import { AIAssistant } from './AIAssistant';
import type { Activity, Approval, Expense, Trip, TripMember } from '@/lib/types';

const NAV_ITEMS = [
  { label: 'Home', icon: Home, path: '/dashboard' },
  { label: 'Trips', icon: Plane, path: '/trips' },
  { label: 'Trip Board', icon: LayoutGrid, path: '/trips' },
  { label: 'Chat', icon: MessageSquare, path: '/trips' },
  { label: 'AI Assistant', icon: Sparkles, path: '/trips', ai: true },
  { label: 'Budget', icon: Wallet, path: '/trips' },
  { label: 'Documents', icon: FileText, path: '/trips' },
  { label: 'Notifications', icon: Bell, path: '/notifications' },
  { label: 'Profile', icon: User, path: '/profile' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

export function AppShell({
  children,
  assistantContext = null,
  tripId = null,
}: {
  children: ReactNode;
  assistantContext?: { trip: Trip; members: TripMember[]; activities: Activity[]; expenses: Expense[]; approvals: Approval[] } | null;
  tripId?: string | null;
}) {
  const { profile, signOut } = useAuth();
  const { path, navigate } = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (itemPath: string) => {
    if (itemPath === '/dashboard') return path === '/dashboard' || path === '/';
    if (itemPath === '/trips') return path.startsWith('/trips') && !tripId;
    return path.startsWith(itemPath);
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 h-screen w-64 z-50 flex-shrink-0 transition-transform duration-300 ease-smooth',
          'glass-strong border-r border-white/10 flex flex-col',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Logo */}
        <div className="px-5 py-5 flex items-center justify-between border-b border-white/10">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl ai-gradient flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-sm font-bold text-white">MindYourTrip</div>
              <div className="text-[10px] text-ai-300 font-medium tracking-wide">AI ASSISTED TRAVEL</div>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn('nav-link', active && 'nav-link-active')}
              >
                <Icon className={cn('w-4.5 h-4.5', item.ai && 'text-ai-300')} />
                <span>{item.label}</span>
                {item.ai && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-ai-400 animate-pulse-glow" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Profile */}
        <div className="p-3 border-t border-white/10">
          <Link
            to="/profile"
            className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-white/[0.04] transition-all"
          >
            <Avatar name={profile?.full_name} src={profile?.avatar_url} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {profile?.full_name ?? 'Traveler'}
              </div>
              <div className="text-[11px] text-slate-400 truncate">{profile?.email}</div>
            </div>
          </Link>
          <button
            onClick={() => signOut().then(() => navigate('/'))}
            className="w-full mt-1 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-400 hover:bg-glow-rose/10 hover:text-glow-rose transition-all"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 glass-strong border-b border-white/10">
          <div className="flex items-center gap-3 px-4 lg:px-8 py-3.5">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/5"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                placeholder="Search trips, places, expenses..."
                className="w-full rounded-xl bg-white/[0.04] border border-white/10 pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-ai-500/40 transition-all"
              />
            </div>

            <Link
              to="/notifications"
              className="relative p-2 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-all"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-glow-rose animate-pulse" />
            </Link>

            <Link to="/trips/new" className="btn-primary text-sm hidden sm:inline-flex">
              <Plane className="w-4 h-4" /> New Trip
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>

      <AIAssistant context={assistantContext} />
    </div>
  );
}
