
-- 1. question_bank: remove broad SELECT; server-side (edge functions w/ service role) will serve questions
DROP POLICY IF EXISTS "Authenticated users can read questions" ON public.question_bank;

-- 2. profiles: restrict SELECT to authenticated users only (no anonymous enumeration)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- 3. user_achievements: scope SELECT to owner
DROP POLICY IF EXISTS "Users can view all achievements" ON public.user_achievements;
CREATE POLICY "Users can view own achievements"
  ON public.user_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. leaderboard_snapshots: restrict INSERT/UPDATE to authenticated role; SELECT to authenticated
DROP POLICY IF EXISTS "Users can insert own snapshots" ON public.leaderboard_snapshots;
DROP POLICY IF EXISTS "Users can update own snapshots" ON public.leaderboard_snapshots;
DROP POLICY IF EXISTS "Anyone can view leaderboard snapshots" ON public.leaderboard_snapshots;
CREATE POLICY "Authenticated can view leaderboard snapshots"
  ON public.leaderboard_snapshots FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "Users can insert own snapshots"
  ON public.leaderboard_snapshots FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own snapshots"
  ON public.leaderboard_snapshots FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

-- 5. Realtime: restrict subscriptions on realtime.messages to authenticated users.
-- We add a permissive policy on realtime.messages so RLS is enforced (default deny otherwise).
-- This requires authentication; per-topic scoping handled by application channel naming.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='realtime' AND tablename='messages') THEN
    EXECUTE 'ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated can receive broadcasts" ON realtime.messages';
    EXECUTE 'CREATE POLICY "Authenticated can receive broadcasts" ON realtime.messages FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;

-- 6. SECURITY DEFINER functions should not be callable directly by anon/authenticated.
-- handle_new_user runs from an auth trigger; update_updated_at_column runs from table triggers.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
