
-- Settings additions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS kyc_rejection_reason text,
  ADD COLUMN IF NOT EXISTS profile_visible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS visibility_mode text NOT NULL DEFAULT 'verified',
  ADD COLUMN IF NOT EXISTS notify_match boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_message boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_interest boolean NOT NULL DEFAULT true;

-- Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  user_id uuid PRIMARY KEY,
  plan text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view own sub" ON public.subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "insert own sub" ON public.subscriptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own sub" ON public.subscriptions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Premium: who liked me (returns users who liked me and not yet matched/blocked)
CREATE OR REPLACE FUNCTION public.get_likers()
RETURNS TABLE(user_id uuid, display_name text, age int, city text, occupation text, liked_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  RETURN QUERY
    SELECT p.id, p.display_name, p.age, p.city, p.occupation, l.created_at
    FROM public.likes l
    JOIN public.profiles p ON p.id = l.from_user
    WHERE l.to_user = uid
      AND NOT EXISTS (
        SELECT 1 FROM public.blocks b
        WHERE (b.from_user = uid AND b.to_user = p.id)
           OR (b.from_user = p.id AND b.to_user = uid)
      )
    ORDER BY l.created_at DESC;
END $$;

-- Subscribe / cancel RPCs (stubbed payment success)
CREATE OR REPLACE FUNCTION public.activate_subscription(plan_code text)
RETURNS public.subscriptions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); period_end timestamptz; row public.subscriptions;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF plan_code NOT IN ('monthly','yearly') THEN RAISE EXCEPTION 'invalid plan'; END IF;
  period_end := CASE WHEN plan_code = 'monthly' THEN now() + INTERVAL '30 days'
                     ELSE now() + INTERVAL '365 days' END;
  INSERT INTO public.subscriptions (user_id, plan, status, started_at, current_period_end)
    VALUES (uid, plan_code, 'active', now(), period_end)
    ON CONFLICT (user_id) DO UPDATE
      SET plan = EXCLUDED.plan,
          status = 'active',
          started_at = now(),
          current_period_end = EXCLUDED.current_period_end,
          cancelled_at = NULL
    RETURNING * INTO row;
  RETURN row;
END $$;

CREATE OR REPLACE FUNCTION public.cancel_subscription()
RETURNS public.subscriptions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); row public.subscriptions;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  UPDATE public.subscriptions
    SET status = 'cancelled', cancelled_at = now()
    WHERE user_id = uid
    RETURNING * INTO row;
  RETURN row;
END $$;
