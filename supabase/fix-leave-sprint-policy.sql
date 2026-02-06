-- Run this once in Supabase → SQL Editor if "Leave sprint" doesn't work.
-- It adds the missing RLS policy so users can remove themselves from sprint_participants.

DROP POLICY IF EXISTS "Users can leave sprints" ON sprint_participants;
CREATE POLICY "Users can leave sprints" ON sprint_participants
  FOR DELETE USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
