export type SprintStatus = 'active' | 'completed' | 'cancelled';

export type Sprint = {
  id: string;
  user_id: string;
  class_name: string;
  duration_minutes: number;
  started_at: string;
  ends_at: string;
  status: SprintStatus;
  created_at: string;
};

export type SprintParticipant = {
  id: string;
  sprint_id: string;
  user_id: string;
  joined_at: string;
};

export type UserStreak = {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_study_date: string | null;
  total_sprints: number;
  created_at: string;
  updated_at: string;
};

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected';

export type Friendship = {
  id: string;
  user_id: string;
  friend_id: string;
  status: FriendshipStatus;
  created_at: string;
};

export type SprintWithParticipants = Sprint & {
  participants?: SprintParticipant[];
  participant_count?: number;
};
