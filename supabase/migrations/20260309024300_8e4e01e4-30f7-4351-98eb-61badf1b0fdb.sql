
-- Exam Schedule table
CREATE TABLE public.exam_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  exam_date DATE NOT NULL,
  exam_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.exam_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own exams" ON public.exam_schedule FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own exams" ON public.exam_schedule FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exams" ON public.exam_schedule FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own exams" ON public.exam_schedule FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Readiness Scores table
CREATE TABLE public.readiness_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  readiness_score INTEGER NOT NULL DEFAULT 0,
  study_hours_component NUMERIC DEFAULT 0,
  revision_component NUMERIC DEFAULT 0,
  task_component NUMERIC DEFAULT 0,
  focus_component NUMERIC DEFAULT 0,
  consistency_component NUMERIC DEFAULT 0,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.readiness_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own readiness" ON public.readiness_scores FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own readiness" ON public.readiness_scores FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own readiness" ON public.readiness_scores FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own readiness" ON public.readiness_scores FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Weak Topics table
CREATE TABLE public.weak_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  topic_name TEXT NOT NULL,
  weakness_score INTEGER NOT NULL DEFAULT 50,
  reason TEXT,
  recommendation TEXT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.weak_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own weak topics" ON public.weak_topics FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own weak topics" ON public.weak_topics FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own weak topics" ON public.weak_topics FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own weak topics" ON public.weak_topics FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_exam_schedule_user ON public.exam_schedule(user_id);
CREATE INDEX idx_readiness_scores_user ON public.readiness_scores(user_id);
CREATE INDEX idx_weak_topics_user ON public.weak_topics(user_id);
