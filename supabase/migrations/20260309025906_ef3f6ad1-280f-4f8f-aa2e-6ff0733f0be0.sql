
CREATE TABLE public.skill_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  skill_name text NOT NULL,
  specific_topic text,
  experience_level text DEFAULT 'beginner',
  daily_hours numeric NOT NULL DEFAULT 2,
  target_days integer NOT NULL DEFAULT 7,
  total_estimated_hours numeric DEFAULT 0,
  progress_percentage integer DEFAULT 0,
  status text DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.skill_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_plan_id uuid NOT NULL REFERENCES public.skill_plans(id) ON DELETE CASCADE,
  topic_name text NOT NULL,
  description text,
  estimated_minutes integer NOT NULL DEFAULT 30,
  sort_order integer NOT NULL DEFAULT 0,
  completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  scheduled_date date,
  time_spent_minutes integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.skill_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_topic_id uuid NOT NULL REFERENCES public.skill_topics(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  resource_type text DEFAULT 'article',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.skill_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own skill plans" ON public.skill_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own skill plans" ON public.skill_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own skill plans" ON public.skill_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own skill plans" ON public.skill_plans FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own skill topics" ON public.skill_topics FOR SELECT USING (EXISTS (SELECT 1 FROM public.skill_plans WHERE skill_plans.id = skill_topics.skill_plan_id AND skill_plans.user_id = auth.uid()));
CREATE POLICY "Users can insert own skill topics" ON public.skill_topics FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.skill_plans WHERE skill_plans.id = skill_topics.skill_plan_id AND skill_plans.user_id = auth.uid()));
CREATE POLICY "Users can update own skill topics" ON public.skill_topics FOR UPDATE USING (EXISTS (SELECT 1 FROM public.skill_plans WHERE skill_plans.id = skill_topics.skill_plan_id AND skill_plans.user_id = auth.uid()));
CREATE POLICY "Users can delete own skill topics" ON public.skill_topics FOR DELETE USING (EXISTS (SELECT 1 FROM public.skill_plans WHERE skill_plans.id = skill_topics.skill_plan_id AND skill_plans.user_id = auth.uid()));

CREATE POLICY "Users can view own skill resources" ON public.skill_resources FOR SELECT USING (EXISTS (SELECT 1 FROM public.skill_topics JOIN public.skill_plans ON skill_plans.id = skill_topics.skill_plan_id WHERE skill_topics.id = skill_resources.skill_topic_id AND skill_plans.user_id = auth.uid()));
CREATE POLICY "Users can insert own skill resources" ON public.skill_resources FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.skill_topics JOIN public.skill_plans ON skill_plans.id = skill_topics.skill_plan_id WHERE skill_topics.id = skill_resources.skill_topic_id AND skill_plans.user_id = auth.uid()));
CREATE POLICY "Users can delete own skill resources" ON public.skill_resources FOR DELETE USING (EXISTS (SELECT 1 FROM public.skill_topics JOIN public.skill_plans ON skill_plans.id = skill_topics.skill_plan_id WHERE skill_topics.id = skill_resources.skill_topic_id AND skill_plans.user_id = auth.uid()));
