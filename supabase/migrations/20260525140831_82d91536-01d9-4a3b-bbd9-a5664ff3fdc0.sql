
ALTER TABLE public.question_bank
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS verification_metadata JSONB;

UPDATE public.question_bank
  SET verification_status = CASE WHEN validated = true THEN 'Verified' ELSE 'Pending' END
  WHERE verification_status = 'Pending';

ALTER TABLE public.question_bank
  ADD CONSTRAINT question_bank_verification_status_check
  CHECK (verification_status IN ('Verified', 'Rejected', 'Pending'));

CREATE INDEX IF NOT EXISTS idx_question_bank_verified
  ON public.question_bank (skill, topic, verification_status);
