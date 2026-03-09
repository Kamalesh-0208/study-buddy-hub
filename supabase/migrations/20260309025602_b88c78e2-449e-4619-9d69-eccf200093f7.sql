
CREATE TABLE public.learning_progress_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
  current_readiness integer NOT NULL DEFAULT 0,
  predicted_readiness integer NOT NULL DEFAULT 0,
  predicted_study_hours numeric NOT NULL DEFAULT 0,
  learning_speed numeric NOT NULL DEFAULT 0,
  days_remaining integer,
  exam_date date,
  probability_ready numeric DEFAULT 0,
  recommended_additional_hours numeric DEFAULT 0,
  alert_message text,
  calculated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.learning_progress_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own predictions" ON public.learning_progress_predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own predictions" ON public.learning_progress_predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own predictions" ON public.learning_progress_predictions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own predictions" ON public.learning_progress_predictions FOR DELETE USING (auth.uid() = user_id);
