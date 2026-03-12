
CREATE TABLE public.question_bank (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  skill TEXT NOT NULL,
  topic TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  question_type TEXT NOT NULL DEFAULT 'mcq',
  question_text TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  validated BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read questions
CREATE POLICY "Authenticated users can read questions"
  ON public.question_bank FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for fast retrieval
CREATE INDEX idx_question_bank_skill_topic ON public.question_bank (skill, topic);
CREATE INDEX idx_question_bank_difficulty ON public.question_bank (difficulty);
CREATE INDEX idx_question_bank_type ON public.question_bank (question_type);
