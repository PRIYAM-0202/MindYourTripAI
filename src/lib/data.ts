import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { Trip, TripMember, Activity, Expense, Approval, AIRecommendation, AIInsights, Notification, Message, Profile, BoardColumn, BoardCard } from './types';

// ---------- Trips ----------

export function useTrips(userId: string | null) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setTrips([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false });
    setTrips((data as Trip[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { trips, loading, refresh };
}

// ---------- Single trip data ----------

export function useTripData(tripId: string | null) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [cards, setCards] = useState<BoardCard[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!tripId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [
      tripRes,
      memberRes,
      actRes,
      expRes,
      apprRes,
      recRes,
      insightsRes,
      msgRes,
      colRes,
      cardRes,
    ] = await Promise.all([
      supabase.from('trips').select('*').eq('id', tripId).maybeSingle(),
      supabase.from('trip_members').select('*, profile:profiles(id, full_name, email, avatar_url)').eq('trip_id', tripId),
      supabase.from('activities').select('*').eq('trip_id', tripId).order('day', { ascending: true }),
      supabase.from('expenses').select('*').eq('trip_id', tripId).order('created_at', { ascending: false }),
      supabase.from('approvals').select('*').eq('trip_id', tripId).order('created_at', { ascending: false }),
      supabase.from('ai_recommendations').select('*').eq('trip_id', tripId).order('created_at', { ascending: false }),
      supabase.from('ai_insights').select('*').eq('trip_id', tripId).order('computed_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('messages').select('*').eq('trip_id', tripId).order('created_at', { ascending: true }).limit(200),
      supabase.from('board_columns').select('*').eq('trip_id', tripId).order('position', { ascending: true }),
      supabase.from('board_cards').select('*').eq('trip_id', tripId).order('position', { ascending: true }),
    ]);

    setTrip((tripRes.data as Trip) ?? null);
    setMembers((memberRes.data as TripMember[]) ?? []);
    setActivities((actRes.data as Activity[]) ?? []);
    setExpenses((expRes.data as Expense[]) ?? []);
    setApprovals((apprRes.data as Approval[]) ?? []);
    setRecommendations((recRes.data as AIRecommendation[]) ?? []);
    setInsights((insightsRes.data as AIInsights) ?? null);
    setMessages((msgRes.data as Message[]) ?? []);
    setColumns((colRes.data as BoardColumn[]) ?? []);
    setCards((cardRes.data as BoardCard[]) ?? []);
    setLoading(false);
  }, [tripId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    trip,
    members,
    activities,
    expenses,
    approvals,
    recommendations,
    insights,
    messages,
    columns,
    cards,
    loading,
    refresh,
    setMessages,
    setCards,
    setRecommendations,
    setActivities,
    setExpenses,
    setApprovals,
  };
}

// ---------- Notifications ----------

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setNotifications((data as Notification[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { notifications, loading, refresh };
}

// ---------- Profile ----------

export function useProfile(userId: string | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setProfile((data as Profile) ?? null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { profile, loading, refresh, setProfile };
}

// ---------- Default board columns seed ----------

const DEFAULT_COLUMNS = [
  { title: 'Ideas', status_key: 'ideas', position: 0, color: 'slate' },
  { title: 'Suggested', status_key: 'suggested', position: 1, color: 'ai' },
  { title: 'Discussing', status_key: 'discussing', position: 2, color: 'amber' },
  { title: 'Approved', status_key: 'approved', position: 3, color: 'teal' },
  { title: 'Booked', status_key: 'booked', position: 4, color: 'cyan' },
  { title: 'Completed', status_key: 'completed', position: 5, color: 'emerald' },
];

export async function seedBoardColumns(tripId: string): Promise<void> {
  const { data: existing } = await supabase
    .from('board_columns')
    .select('id')
    .eq('trip_id', tripId);
  if (existing && existing.length > 0) return;
  await supabase
    .from('board_columns')
    .insert(DEFAULT_COLUMNS.map((c) => ({ ...c, trip_id: tripId })));
}

// ---------- Mark notification read ----------

export async function markNotificationRead(id: string): Promise<void> {
  await supabase.from('notifications').update({ is_read: true }).eq('id', id);
}
