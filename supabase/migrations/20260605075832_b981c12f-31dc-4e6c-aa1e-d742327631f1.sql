
-- Rate limits
CREATE TABLE IF NOT EXISTS public.rate_limits (
  user_id uuid NOT NULL,
  action text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.rate_limits TO authenticated;
GRANT ALL ON public.rate_limits TO service_role;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own rate_limits read" ON public.rate_limits;
CREATE POLICY "own rate_limits read" ON public.rate_limits FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS rate_limits_user_action_time_idx
  ON public.rate_limits (user_id, action, occurred_at DESC);

CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  props jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "insert own events" ON public.events;
CREATE POLICY "insert own events" ON public.events
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
DROP POLICY IF EXISTS "admin reads events" ON public.events;
CREATE POLICY "admin reads events" ON public.events
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE INDEX IF NOT EXISTS events_name_time_idx ON public.events (name, created_at DESC);

CREATE OR REPLACE FUNCTION public.check_and_record_rate_limit(
  _action text, _max integer, _window_seconds integer
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); cnt int;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  DELETE FROM public.rate_limits
    WHERE user_id = uid AND action = _action
      AND occurred_at < now() - make_interval(secs => _window_seconds * 2);
  SELECT COUNT(*) INTO cnt FROM public.rate_limits
    WHERE user_id = uid AND action = _action
      AND occurred_at > now() - make_interval(secs => _window_seconds);
  IF cnt >= _max THEN
    RAISE EXCEPTION 'rate_limited' USING HINT = _action;
  END IF;
  INSERT INTO public.rate_limits (user_id, action) VALUES (uid, _action);
END $$;

CREATE OR REPLACE FUNCTION public.send_interest(target uuid)
RETURNS TABLE(matched boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); other_liked boolean;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF target = uid THEN RAISE EXCEPTION 'cannot like self'; END IF;
  PERFORM public.check_and_record_rate_limit('like', 10, 60);
  INSERT INTO public.likes (from_user, to_user) VALUES (uid, target)
  ON CONFLICT DO NOTHING;
  SELECT EXISTS (SELECT 1 FROM public.likes WHERE from_user = target AND to_user = uid)
    INTO other_liked;
  IF other_liked THEN
    INSERT INTO public.matches (user_low, user_high)
      VALUES (LEAST(uid, target), GREATEST(uid, target))
      ON CONFLICT DO NOTHING;
    RETURN QUERY SELECT true;
  ELSE
    RETURN QUERY SELECT false;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.send_message(peer uuid, msg text)
RETURNS TABLE(id uuid, sender uuid, body text, created_at timestamptz, read_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); lo uuid; hi uuid; clean text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF peer = uid THEN RAISE EXCEPTION 'invalid peer'; END IF;
  clean := btrim(COALESCE(msg, ''));
  IF length(clean) = 0 THEN RAISE EXCEPTION 'empty message'; END IF;
  IF length(clean) > 2000 THEN clean := left(clean, 2000); END IF;
  lo := LEAST(uid, peer); hi := GREATEST(uid, peer);
  IF NOT EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.user_low = lo AND m.user_high = hi AND m.intro_fee_paid = true
  ) THEN RAISE EXCEPTION 'chat not open'; END IF;
  PERFORM public.check_and_record_rate_limit('message', 10, 60);
  RETURN QUERY
    INSERT INTO public.messages (match_low, match_high, sender, body)
    VALUES (lo, hi, uid, clean)
    RETURNING messages.id, messages.sender, messages.body, messages.created_at, messages.read_at;
END $$;
