
-- XP Log table for tracking all XP events
CREATE TABLE public.xp_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  xp_amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  source_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.xp_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own xp logs" ON public.xp_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own xp logs" ON public.xp_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Leaderboard Snapshots table
CREATE TABLE public.leaderboard_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  xp_total INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  weekly_study_minutes INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  score NUMERIC DEFAULT 0,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view leaderboard snapshots" ON public.leaderboard_snapshots
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own snapshots" ON public.leaderboard_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own snapshots" ON public.leaderboard_snapshots
  FOR UPDATE USING (auth.uid() = user_id);

-- Add session_type column to study_sessions
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'focus';

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard_snapshots;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_xp_log_user ON public.xp_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user_time ON public.study_sessions(user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_date ON public.leaderboard_snapshots(snapshot_date, score DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON public.tasks(user_id, completed);
