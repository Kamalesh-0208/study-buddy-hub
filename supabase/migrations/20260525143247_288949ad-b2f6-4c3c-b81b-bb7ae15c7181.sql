CREATE OR REPLACE FUNCTION public.enforce_profile_xp_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  computed_xp INTEGER;
BEGIN
  SELECT COALESCE(SUM(xp_amount), 0)::INTEGER INTO computed_xp
  FROM public.xp_log
  WHERE user_id = NEW.user_id;

  NEW.total_xp := computed_xp;
  NEW.level := GREATEST(1, FLOOR(SQRT(computed_xp::numeric / 50))::INTEGER);
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_profile_xp_integrity() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_profile_xp_integrity_trg ON public.profiles;
CREATE TRIGGER enforce_profile_xp_integrity_trg
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_profile_xp_integrity();