/*
# MindYourTrip AI — Tables only (part 1)

Creates all tables and indexes with RLS enabled but NO policies yet.
Policies referencing trip_members can't be created in the same pass as trips
because trip_members doesn't exist yet. Policies come in part 2.
*/

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  phone text,
  avatar_url text,
  bio text,
  travel_style text DEFAULT 'Explorer',
  budget_range text DEFAULT 'Mid-range',
  completed_trips integer DEFAULT 0,
  upcoming_trips integer DEFAULT 0,
  achievements jsonb DEFAULT '[]'::jsonb,
  ai_preferences jsonb DEFAULT '{"suggestions":true,"insights":true,"predictions":true,"voiceInput":true}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- trips
CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  destination text NOT NULL,
  country text,
  cover_image text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  estimated_budget numeric(12,2) NOT NULL DEFAULT 0,
  actual_spent numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'draft',
  travel_style text DEFAULT 'Explorer',
  accommodation text,
  transportation text,
  max_members integer DEFAULT 6,
  preferences jsonb DEFAULT '{}'::jsonb,
  activity_interests jsonb DEFAULT '[]'::jsonb,
  trip_category text DEFAULT 'Leisure',
  notes text,
  progress integer DEFAULT 0,
  weather_summary text,
  safety_info text,
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- trip_members
CREATE TABLE IF NOT EXISTS trip_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  phone text,
  role text NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'pending',
  invited_by uuid REFERENCES auth.users(id),
  joined_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT trip_member_identity CHECK (user_id IS NOT NULL OR email IS NOT NULL OR phone IS NOT NULL)
);
ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;

-- activities
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text DEFAULT 'activity',
  day integer,
  start_time time,
  end_time time,
  location text,
  estimated_cost numeric(12,2) DEFAULT 0,
  currency text DEFAULT 'INR',
  status text DEFAULT 'suggested',
  priority text DEFAULT 'medium',
  labels jsonb DEFAULT '[]'::jsonb,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- itinerary_days
CREATE TABLE IF NOT EXISTS itinerary_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  date date,
  title text,
  summary text,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (trip_id, day_number)
);
ALTER TABLE itinerary_days ENABLE ROW LEVEL SECURITY;

-- board_columns
CREATE TABLE IF NOT EXISTS board_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  title text NOT NULL,
  status_key text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  color text DEFAULT 'blue',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE board_columns ENABLE ROW LEVEL SECURITY;

-- board_cards
CREATE TABLE IF NOT EXISTS board_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id uuid NOT NULL REFERENCES board_columns(id) ON DELETE CASCADE,
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  card_type text NOT NULL DEFAULT 'place',
  location text,
  estimated_cost numeric(12,2) DEFAULT 0,
  priority text DEFAULT 'medium',
  labels jsonb DEFAULT '[]'::jsonb,
  attachments jsonb DEFAULT '[]'::jsonb,
  image_url text,
  link_url text,
  vote_count integer DEFAULT 0,
  comment_count integer DEFAULT 0,
  position integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE board_cards ENABLE ROW LEVEL SECURITY;

-- card_comments
CREATE TABLE IF NOT EXISTS card_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES board_cards(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text,
  content text NOT NULL,
  mentions jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE card_comments ENABLE ROW LEVEL SECURITY;

-- card_votes
CREATE TABLE IF NOT EXISTS card_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES board_cards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (card_id, user_id)
);
ALTER TABLE card_votes ENABLE ROW LEVEL SECURITY;

-- messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text,
  author_avatar text,
  content text,
  message_type text NOT NULL DEFAULT 'text',
  reply_to uuid REFERENCES messages(id) ON DELETE SET NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  reactions jsonb DEFAULT '{}'::jsonb,
  is_pinned boolean DEFAULT false,
  is_system boolean DEFAULT false,
  mentions jsonb DEFAULT '[]'::jsonb,
  poll_data jsonb,
  voice_duration integer,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- expenses
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text DEFAULT 'general',
  amount numeric(12,2) NOT NULL,
  currency text DEFAULT 'INR',
  paid_by uuid REFERENCES auth.users(id),
  paid_by_name text,
  paid_at timestamptz DEFAULT now(),
  ai_split_recommendation jsonb,
  confirmed_split jsonb DEFAULT '{}'::jsonb,
  participants jsonb DEFAULT '[]'::jsonb,
  receipt_url text,
  receipt_data jsonb,
  source text DEFAULT 'manual',
  notes text,
  confirmed boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- expense_splits
CREATE TABLE IF NOT EXISTS expense_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  trip_member_id uuid REFERENCES trip_members(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  member_label text,
  share numeric(12,2) DEFAULT 0,
  is_ai_recommended boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

-- documents
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name text NOT NULL,
  doc_type text DEFAULT 'other',
  ai_category text,
  file_url text,
  file_size integer,
  mime_type text,
  extracted_data jsonb,
  tags jsonb DEFAULT '[]'::jsonb,
  uploaded_by uuid REFERENCES auth.users(id),
  confirmed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- approvals
CREATE TABLE IF NOT EXISTS approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  approval_type text DEFAULT 'activity',
  ref_id uuid,
  requested_by uuid REFERENCES auth.users(id),
  requested_by_name text,
  amount numeric(12,2),
  status text DEFAULT 'pending',
  voter_yes jsonb DEFAULT '[]'::jsonb,
  voter_no jsonb DEFAULT '[]'::jsonb,
  required_voters integer DEFAULT 1,
  due_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

-- ai_recommendations
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category text DEFAULT 'general',
  priority text DEFAULT 'medium',
  action_type text DEFAULT 'suggestion',
  context_ref uuid,
  context_type text,
  rationale text,
  metadata jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'active',
  user_feedback text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

-- notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  notif_type text DEFAULT 'general',
  icon text,
  priority text DEFAULT 'medium',
  action_url text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ai_insights
CREATE TABLE IF NOT EXISTS ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  trip_health_score integer DEFAULT 0,
  budget_health integer DEFAULT 0,
  approval_progress integer DEFAULT 0,
  planning_completion integer DEFAULT 0,
  group_activity integer DEFAULT 0,
  most_active_member text,
  estimated_readiness integer DEFAULT 0,
  potential_risks jsonb DEFAULT '[]'::jsonb,
  upcoming_deadlines jsonb DEFAULT '[]'::jsonb,
  summary text,
  computed_at timestamptz DEFAULT now()
);
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- user_preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  favorite_destinations jsonb DEFAULT '[]'::jsonb,
  travel_styles jsonb DEFAULT '[]'::jsonb,
  food_preferences jsonb DEFAULT '[]'::jsonb,
  hotel_preferences jsonb DEFAULT '[]'::jsonb,
  transport_preferences jsonb DEFAULT '[]'::jsonb,
  activity_preferences jsonb DEFAULT '[]'::jsonb,
  avg_budget numeric(12,2) DEFAULT 0,
  preferred_season text,
  typical_group_size integer DEFAULT 2,
  avoid_list jsonb DEFAULT '[]'::jsonb,
  trip_history_summary jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trips_owner ON trips(owner_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trip_members_trip ON trip_members(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_members_user ON trip_members(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_trip ON activities(trip_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_trip ON itinerary_days(trip_id);
CREATE INDEX IF NOT EXISTS idx_board_columns_trip ON board_columns(trip_id);
CREATE INDEX IF NOT EXISTS idx_board_cards_column ON board_cards(column_id);
CREATE INDEX IF NOT EXISTS idx_board_cards_trip ON board_cards(trip_id);
CREATE INDEX IF NOT EXISTS idx_card_comments_card ON card_comments(card_id);
CREATE INDEX IF NOT EXISTS idx_card_votes_card ON card_votes(card_id);
CREATE INDEX IF NOT EXISTS idx_messages_trip ON messages(trip_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_trip ON expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense ON expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_documents_trip ON documents(trip_id);
CREATE INDEX IF NOT EXISTS idx_approvals_trip ON approvals(trip_id);
CREATE INDEX IF NOT EXISTS idx_ai_recs_trip ON ai_recommendations(trip_id);
CREATE INDEX IF NOT EXISTS idx_ai_recs_status ON ai_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_ai_insights_trip ON ai_insights(trip_id);

-- updated_at
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated ON profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_trips_updated ON trips;
CREATE TRIGGER trg_trips_updated BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- auto profile on signup
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_preferences (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();