-- Helper function for updated_at (needed if notes migration wasn't run)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the sprints table
-- This stores study sprint sessions
CREATE TABLE sprints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  class_name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create the sprint_participants table
-- This tracks who joins which sprint
CREATE TABLE sprint_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sprint_id UUID REFERENCES sprints(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(sprint_id, user_id)
);

-- Create the user_streaks table
-- This tracks daily study streaks
CREATE TABLE user_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0 NOT NULL,
  longest_streak INTEGER DEFAULT 0 NOT NULL,
  last_study_date DATE,
  total_sprints INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create the friendships table
-- This tracks friend relationships
CREATE TABLE friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprint_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Sprints policies: Users can see their own sprints and friends' active sprints
CREATE POLICY "Users can view own sprints" ON sprints
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view friends active sprints" ON sprints
  FOR SELECT USING (
    status = 'active' AND
    user_id IN (
      SELECT friend_id FROM friendships 
      WHERE user_id = auth.uid() AND status = 'accepted'
      UNION
      SELECT user_id FROM friendships 
      WHERE friend_id = auth.uid() AND status = 'accepted'
    )
  );

CREATE POLICY "Users can create own sprints" ON sprints
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sprints" ON sprints
  FOR UPDATE USING (auth.uid() = user_id);

-- Sprint participants policies
CREATE POLICY "Users can view sprint participants" ON sprint_participants
  FOR SELECT USING (
    user_id = auth.uid() OR
    sprint_id IN (SELECT id FROM sprints WHERE user_id = auth.uid()) OR
    sprint_id IN (
      SELECT s.id FROM sprints s
      INNER JOIN friendships f ON (
        (f.user_id = auth.uid() AND f.friend_id = s.user_id) OR
        (f.friend_id = auth.uid() AND f.user_id = s.user_id)
      )
      WHERE f.status = 'accepted' AND s.status = 'active'
    )
  );

CREATE POLICY "Users can join sprints" ON sprint_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User streaks policies
CREATE POLICY "Users can view own streaks" ON user_streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view friends streaks" ON user_streaks
  FOR SELECT USING (
    user_id IN (
      SELECT friend_id FROM friendships 
      WHERE user_id = auth.uid() AND status = 'accepted'
      UNION
      SELECT user_id FROM friendships 
      WHERE friend_id = auth.uid() AND status = 'accepted'
    )
  );

CREATE POLICY "Users can update own streaks" ON user_streaks
  FOR ALL USING (auth.uid() = user_id);

-- Friendships policies
CREATE POLICY "Users can view own friendships" ON friendships
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendships" ON friendships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friendships" ON friendships
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Create indexes for better query performance
CREATE INDEX sprints_user_id_idx ON sprints(user_id);
CREATE INDEX sprints_status_idx ON sprints(status);
CREATE INDEX sprints_ends_at_idx ON sprints(ends_at);
CREATE INDEX sprint_participants_sprint_id_idx ON sprint_participants(sprint_id);
CREATE INDEX sprint_participants_user_id_idx ON sprint_participants(user_id);
CREATE INDEX user_streaks_user_id_idx ON user_streaks(user_id);
CREATE INDEX friendships_user_id_idx ON friendships(user_id);
CREATE INDEX friendships_friend_id_idx ON friendships(friend_id);
CREATE INDEX friendships_status_idx ON friendships(status);

-- Trigger to update user_streaks updated_at
CREATE TRIGGER update_user_streaks_updated_at
  BEFORE UPDATE ON user_streaks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
