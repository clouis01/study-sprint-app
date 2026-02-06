-- =============================================================================
-- Run this in the SAME Supabase project your Vercel app uses (check projectRef).
-- Step 1: Verify tables exist. Step 2: Force PostgREST to reload schema.
-- =============================================================================

-- 1) Check that tables exist (you should see 4 rows: sprints, sprint_participants, user_streaks, friendships)
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('sprints', 'sprint_participants', 'user_streaks', 'friendships')
ORDER BY table_name;

-- 2) Clear stats snapshot (sometimes helps schema cache pick up new objects)
SELECT pg_stat_clear_snapshot();

-- 3) Force PostgREST to reload the schema cache (wait ~10–30 seconds, then try the app again)
NOTIFY pgrst, 'reload schema';
