
CREATE TABLE public.assessment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  skill_category TEXT NOT NULL,
  skill TEXT NOT NULL,
  topic TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  mode TEXT NOT NULL,
  assessment_type TEXT NOT NULL,
  total_questions INTEGER NOT NULL DEFAULT 0,
  attempted INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0,
  wrong INTEGER NOT NULL DEFAULT 0,
  unanswered INTEGER NOT NULL DEFAULT 0,
  score_percentage NUMERIC NOT NULL DEFAULT 0,
  final_score NUMERIC NOT NULL DEFAULT 0,
  negative_marks NUMERIC DEFAULT 0,
  time_taken_seconds INTEGER DEFAULT 0,
  passed BOOLEAN DEFAULT false,
  similarity_score NUMERIC DEFAULT NULL,
  requirements_met BOOLEAN DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.assessment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assessment history"
  ON public.assessment_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessment history"
  ON public.assessment_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own assessment history"
  ON public.assessment_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
