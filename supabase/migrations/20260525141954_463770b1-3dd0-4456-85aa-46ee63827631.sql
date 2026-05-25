
-- Cap xp_amount server-side so client cannot inflate XP arbitrarily
ALTER TABLE public.xp_log
  ADD CONSTRAINT xp_log_amount_bounds CHECK (xp_amount > 0 AND xp_amount <= 200);

-- Explicit no-direct-access policy on question_bank (RLS already on; service role bypasses).
-- This silences the "RLS enabled, no policy" linter and documents intent.
CREATE POLICY "No direct client access to question_bank"
  ON public.question_bank
  FOR SELECT
  TO authenticated
  USING (false);
