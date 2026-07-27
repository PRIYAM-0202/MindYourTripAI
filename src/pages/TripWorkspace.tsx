import { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  LayoutGrid,
  Wallet,
  MessageSquare,
  FileText,
  CheckSquare,
  Brain,
  Settings,
  ArrowLeft,
  Plane,
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { useRouter } from '@/lib/router';
import { useTripData } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui';
import { OverviewTab } from '@/components/workspace/OverviewTab';
import { MembersTab } from '@/components/workspace/MembersTab';
import { ItineraryTab } from '@/components/workspace/ItineraryTab';
import { BoardTab } from '@/components/workspace/BoardTab';
import { BudgetTab } from '@/components/workspace/BudgetTab';
import { ChatTab } from '@/components/workspace/ChatTab';
import { DocumentsTab } from '@/components/workspace/DocumentsTab';
import { ApprovalsTab } from '@/components/workspace/ApprovalsTab';
import { InsightsTab } from '@/components/workspace/InsightsTab';
import { SettingsTab } from '@/components/workspace/SettingsTab';
import { useAuth } from '@/lib/auth';

const TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'members', label: 'Members', icon: Users },
  { key: 'itinerary', label: 'Itinerary', icon: Calendar },
  { key: 'board', label: 'Trip Board', icon: LayoutGrid },
  { key: 'budget', label: 'Budget', icon: Wallet },
  { key: 'chat', label: 'Chat', icon: MessageSquare },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'approvals', label: 'Approvals', icon: CheckSquare },
  { key: 'insights', label: 'AI Insights', icon: Brain },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export function TripWorkspace() {
  const { path, params, navigate } = useRouter();
  const { user } = useAuth();
  const tripId = path.split('/')[2] ?? null;
  const [tab, setTab] = useState(params.tab ?? 'overview');

  const data = useTripData(tripId);

  useEffect(() => {
    if (params.tab && params.tab !== tab) setTab(params.tab);
  }, [params.tab]);

  const setTabAndUrl = (t: string) => {
    setTab(t);
    navigate(`/trips/${tripId}?tab=${t}`);
  };

  const assistantContext = useMemo(() => {
    if (!data.trip) return null;
    return {
      trip: data.trip,
      members: data.members,
      activities: data.activities,
      expenses: data.expenses,
      approvals: data.approvals,
    };
  }, [data.trip, data.members, data.activities, data.expenses, data.approvals]);

  if (data.loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-32">
          <Spinner className="w-8 h-8" />
        </div>
      </AppShell>
    );
  }

  if (!data.trip) {
    return (
      <AppShell>
        <div className="text-center py-32">
          <Plane className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h2 className="font-display text-xl font-semibold text-white">Trip not found</h2>
          <p className="text-sm text-slate-400 mt-1 mb-4">This trip may have been deleted or you don't have access.</p>
          <button onClick={() => navigate('/trips')} className="btn-primary">
            <ArrowLeft className="w-4 h-4" /> Back to trips
          </button>
        </div>
      </AppShell>
    );
  }

  const tabProps = {
    trip: data.trip,
    members: data.members,
    activities: data.activities,
    expenses: data.expenses,
    approvals: data.approvals,
    recommendations: data.recommendations,
    insights: data.insights,
    messages: data.messages,
    columns: data.columns,
    cards: data.cards,
    refresh: data.refresh,
    setMessages: data.setMessages,
    setCards: data.setCards,
    setRecommendations: data.setRecommendations,
    setActivities: data.setActivities,
    setExpenses: data.setExpenses,
    setApprovals: data.setApprovals,
    userId: user?.id ?? null,
    userName: user?.email?.split('@')[0] ?? 'You',
  };

  return (
    <AppShell assistantContext={assistantContext} tripId={tripId}>
      {/* Trip header */}
      <div className="glass-strong rounded-3xl overflow-hidden mb-6 relative">
        <div className="h-40 relative overflow-hidden">
          {data.trip.cover_image ? (
            <img src={data.trip.cover_image} alt={data.trip.destination} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full ai-gradient-soft" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/50 to-transparent" />
          <button
            onClick={() => navigate('/trips')}
            className="absolute top-4 left-4 flex items-center gap-1.5 text-sm text-white/90 bg-ink-900/50 backdrop-blur px-3 py-1.5 rounded-lg hover:bg-ink-900/70 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Trips
          </button>
        </div>
        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl lg:text-2xl font-bold text-white">{data.trip.name}</h1>
            <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Plane className="w-3.5 h-3.5" /> {data.trip.destination}
              {data.trip.country && <span className="text-slate-500">· {data.trip.country}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {data.members.filter((m) => m.status === 'accepted').slice(0, 4).map((m) => (
              <div key={m.id} className="w-8 h-8 rounded-full bg-ai-500/30 border-2 border-ink-800 flex items-center justify-center text-xs font-semibold text-white">
                {(m.profile?.full_name ?? m.email ?? '?')[0]?.toUpperCase()}
              </div>
            ))}
            {data.members.length > 4 && (
              <span className="text-xs text-slate-400 ml-1">+{data.members.length - 4}</span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          const badge = t.key === 'approvals' && data.approvals.filter((a) => a.status === 'pending').length > 0
            ? data.approvals.filter((a) => a.status === 'pending').length
            : null;
          return (
            <button
              key={t.key}
              onClick={() => setTabAndUrl(t.key)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                active
                  ? 'ai-gradient text-white shadow-glow-soft'
                  : 'text-slate-400 hover:text-white hover:bg-white/5',
              )}
            >
              <Icon className={cn('w-4 h-4', t.key === 'insights' && !active && 'text-ai-300')} />
              {t.label}
              {badge && (
                <span className="ml-0.5 bg-glow-rose/20 text-glow-rose text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="animate-fade-in" key={tab}>
        {tab === 'overview' && <OverviewTab {...tabProps} />}
        {tab === 'members' && <MembersTab {...tabProps} />}
        {tab === 'itinerary' && <ItineraryTab {...tabProps} />}
        {tab === 'board' && <BoardTab {...tabProps} />}
        {tab === 'budget' && <BudgetTab {...tabProps} />}
        {tab === 'chat' && <ChatTab {...tabProps} />}
        {tab === 'documents' && <DocumentsTab {...tabProps} />}
        {tab === 'approvals' && <ApprovalsTab {...tabProps} />}
        {tab === 'insights' && <InsightsTab {...tabProps} />}
        {tab === 'settings' && <SettingsTab {...tabProps} />}
      </div>
    </AppShell>
  );
}

export interface WorkspaceTabProps {
  trip: import('@/lib/types').Trip;
  members: import('@/lib/types').TripMember[];
  activities: import('@/lib/types').Activity[];
  expenses: import('@/lib/types').Expense[];
  approvals: import('@/lib/types').Approval[];
  recommendations: import('@/lib/types').AIRecommendation[];
  insights: import('@/lib/types').AIInsights | null;
  messages: import('@/lib/types').Message[];
  columns: import('@/lib/types').BoardColumn[];
  cards: import('@/lib/types').BoardCard[];
  refresh: () => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<import('@/lib/types').Message[]>>;
  setCards: React.Dispatch<React.SetStateAction<import('@/lib/types').BoardCard[]>>;
  setRecommendations: React.Dispatch<React.SetStateAction<import('@/lib/types').AIRecommendation[]>>;
  setActivities: React.Dispatch<React.SetStateAction<import('@/lib/types').Activity[]>>;
  setExpenses: React.Dispatch<React.SetStateAction<import('@/lib/types').Expense[]>>;
  setApprovals: React.Dispatch<React.SetStateAction<import('@/lib/types').Approval[]>>;
  userId: string | null;
  userName: string;
}
