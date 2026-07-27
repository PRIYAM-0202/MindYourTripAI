export type TripStatus = 'draft' | 'upcoming' | 'ongoing' | 'completed';
export type MemberRole = 'owner' | 'admin' | 'editor' | 'member' | 'viewer';
export type MemberStatus = 'pending' | 'accepted' | 'declined';
export type ActivityStatus =
  | 'suggested'
  | 'discussing'
  | 'approved'
  | 'booked'
  | 'completed'
  | 'rejected';
export type ActivityCategory =
  | 'activity'
  | 'restaurant'
  | 'hotel'
  | 'transport'
  | 'sightseeing';
export type CardType =
  | 'place'
  | 'restaurant'
  | 'hotel'
  | 'activity'
  | 'packing'
  | 'document'
  | 'shopping'
  | 'emergency'
  | 'note'
  | 'link'
  | 'image';
export type BoardStatusKey =
  | 'ideas'
  | 'suggested'
  | 'discussing'
  | 'approved'
  | 'booked'
  | 'completed';
export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'accommodation'
  | 'activity'
  | 'shopping'
  | 'general';
export type ExpenseSource = 'manual' | 'voice' | 'receipt' | 'booking';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type AIActionType = 'suggestion' | 'warning' | 'alert' | 'insight' | 'reminder';
export type AIPriority = 'low' | 'medium' | 'high' | 'critical';
export type AICategory =
  | 'budget'
  | 'weather'
  | 'activity'
  | 'hotel'
  | 'transport'
  | 'approval'
  | 'document'
  | 'scheduling'
  | 'safety'
  | 'general';
export type NotifType =
  | 'weather'
  | 'budget'
  | 'price'
  | 'reminder'
  | 'approval'
  | 'suggestion'
  | 'trip'
  | 'document'
  | 'countdown'
  | 'general';
export type MessageType =
  | 'text'
  | 'voice'
  | 'image'
  | 'document'
  | 'poll'
  | 'system'
  | 'reply';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  travel_style: string | null;
  budget_range: string | null;
  completed_trips: number;
  upcoming_trips: number;
  achievements: string[];
  ai_preferences: {
    suggestions: boolean;
    insights: boolean;
    predictions: boolean;
    voiceInput: boolean;
  };
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  country: string | null;
  cover_image: string | null;
  start_date: string;
  end_date: string;
  estimated_budget: number;
  actual_spent: number;
  currency: string;
  status: TripStatus;
  travel_style: string | null;
  accommodation: string | null;
  transportation: string | null;
  max_members: number;
  preferences: Record<string, unknown>;
  activity_interests: string[];
  trip_category: string | null;
  notes: string | null;
  progress: number;
  weather_summary: string | null;
  safety_info: string | null;
  owner_id: string;
  created_at: string;
}

export interface TripMember {
  id: string;
  trip_id: string;
  user_id: string | null;
  email: string | null;
  phone: string | null;
  role: MemberRole;
  status: MemberStatus;
  invited_by: string | null;
  joined_at: string | null;
  created_at: string;
  profile?: Profile | null;
}

export interface Activity {
  id: string;
  trip_id: string;
  title: string;
  description: string | null;
  category: ActivityCategory;
  day: number | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  estimated_cost: number;
  currency: string;
  status: ActivityStatus;
  priority: 'low' | 'medium' | 'high';
  labels: string[];
  created_by: string | null;
  created_at: string;
}

export interface BoardColumn {
  id: string;
  trip_id: string;
  title: string;
  status_key: BoardStatusKey;
  position: number;
  color: string;
}

export interface BoardCard {
  id: string;
  column_id: string;
  trip_id: string;
  title: string;
  description: string | null;
  card_type: CardType;
  location: string | null;
  estimated_cost: number;
  priority: 'low' | 'medium' | 'high';
  labels: string[];
  attachments: unknown[];
  image_url: string | null;
  link_url: string | null;
  vote_count: number;
  comment_count: number;
  position: number;
  created_by: string | null;
  created_at: string;
  voted?: boolean;
}

export interface CardComment {
  id: string;
  card_id: string;
  user_id: string | null;
  author_name: string | null;
  content: string;
  created_at: string;
}

export interface Message {
  id: string;
  trip_id: string;
  user_id: string | null;
  author_name: string | null;
  author_avatar: string | null;
  content: string | null;
  message_type: MessageType;
  reply_to: string | null;
  attachments: unknown[];
  reactions: Record<string, string[]>;
  is_pinned: boolean;
  is_system: boolean;
  mentions: string[];
  poll_data: { question: string; options: { text: string; votes: string[] }[] } | null;
  voice_duration: number | null;
  created_at: string;
}

export interface Expense {
  id: string;
  trip_id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  paid_by: string | null;
  paid_by_name: string | null;
  paid_at: string;
  ai_split_recommendation: Record<string, number> | null;
  confirmed_split: Record<string, number>;
  participants: string[];
  receipt_url: string | null;
  receipt_data: {
    merchant?: string;
    items?: string[];
    date?: string;
    taxes?: number;
    total?: number;
  } | null;
  source: ExpenseSource;
  notes: string | null;
  confirmed: boolean;
  created_by: string | null;
  created_at: string;
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  trip_member_id: string | null;
  user_id: string | null;
  member_label: string | null;
  share: number;
  is_ai_recommended: boolean;
}

export interface TripDocument {
  id: string;
  trip_id: string;
  name: string;
  doc_type: string;
  ai_category: string | null;
  file_url: string | null;
  file_size: number | null;
  mime_type: string | null;
  extracted_data: Record<string, unknown> | null;
  tags: string[];
  uploaded_by: string | null;
  confirmed: boolean;
  created_at: string;
}

export interface Approval {
  id: string;
  trip_id: string;
  title: string;
  description: string | null;
  approval_type: string;
  ref_id: string | null;
  requested_by: string | null;
  requested_by_name: string | null;
  amount: number | null;
  status: ApprovalStatus;
  voter_yes: string[];
  voter_no: string[];
  required_voters: number;
  due_at: string | null;
  created_at: string;
}

export interface AIRecommendation {
  id: string;
  trip_id: string;
  title: string;
  description: string;
  category: AICategory;
  priority: AIPriority;
  action_type: AIActionType;
  context_ref: string | null;
  context_type: string | null;
  rationale: string | null;
  metadata: Record<string, unknown>;
  status: 'active' | 'accepted' | 'modified' | 'ignored' | 'dismissed';
  user_feedback: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  trip_id: string | null;
  title: string;
  body: string | null;
  notif_type: NotifType;
  icon: string | null;
  priority: string;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}

export interface AIInsights {
  id: string;
  trip_id: string;
  trip_health_score: number;
  budget_health: number;
  approval_progress: number;
  planning_completion: number;
  group_activity: number;
  most_active_member: string | null;
  estimated_readiness: number;
  potential_risks: { label: string; severity: 'low' | 'medium' | 'high' }[];
  upcoming_deadlines: { label: string; date: string }[];
  summary: string | null;
  computed_at: string;
}

export interface UserPreferences {
  user_id: string;
  favorite_destinations: string[];
  travel_styles: string[];
  food_preferences: string[];
  hotel_preferences: string[];
  transport_preferences: string[];
  activity_preferences: string[];
  avg_budget: number;
  preferred_season: string | null;
  typical_group_size: number;
  avoid_list: string[];
  trip_history_summary: Record<string, unknown>;
}

export interface AIRecInput {
  title: string;
  description: string;
  category: AICategory;
  priority: AIPriority;
  action_type: AIActionType;
  rationale: string;
  context_ref?: string;
  context_type?: string;
  metadata?: Record<string, unknown>;
}
