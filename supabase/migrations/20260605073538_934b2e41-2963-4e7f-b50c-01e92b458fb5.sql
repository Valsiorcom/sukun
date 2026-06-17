ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS intro_fee_paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS intro_fee_paid_by uuid,
  ADD COLUMN IF NOT EXISTS chat_opened_at timestamptz;

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_low uuid NOT NULL,
  match_high uuid NOT NULL,
  sender uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "view own messages" ON public.messages;
CREATE POLICY "view own messages" ON public.messages FOR SELECT TO authenticated
  USING (auth.uid() = match_low OR auth.uid() = match_high);

DROP POLICY IF EXISTS "send messages in own matches" ON public.messages;
CREATE POLICY "send messages in own matches" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender = auth.uid()
    AND (auth.uid() = match_low OR auth.uid() = match_high)
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.user_low = match_low AND m.user_high = match_high
        AND m.intro_fee_paid = true
    )
  );

-- list matches for current user with peer info
CREATE OR REPLACE FUNCTION public.get_my_matches()
RETURNS TABLE (
  peer_id uuid,
  user_low uuid,
  user_high uuid,
  display_name text,
  age int,
  city text,
  essay_summary text,
  intro_fee_paid boolean,
  chat_opened_at timestamptz,
  matched_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  RETURN QUERY
    SELECT
      CASE WHEN m.user_low = uid THEN m.user_high ELSE m.user_low END AS peer_id,
      m.user_low, m.user_high,
      p.display_name, p.age, p.city,
      LEFT(COALESCE(p.essay_vision, ''), 150) AS essay_summary,
      m.intro_fee_paid, m.chat_opened_at, m.created_at
    FROM public.matches m
    JOIN public.profiles p
      ON p.id = CASE WHEN m.user_low = uid THEN m.user_high ELSE m.user_low END
    WHERE uid IN (m.user_low, m.user_high)
    ORDER BY m.created_at DESC;
END $$;

-- pay intro fee (stub). Either party can call; first call wins.
CREATE OR REPLACE FUNCTION public.pay_intro_fee(peer uuid)
RETURNS TABLE (
  user_low uuid, user_high uuid,
  intro_fee_paid boolean, intro_fee_paid_by uuid, chat_opened_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); lo uuid; hi uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF peer = uid THEN RAISE EXCEPTION 'invalid peer'; END IF;
  lo := LEAST(uid, peer); hi := GREATEST(uid, peer);

  IF NOT EXISTS (SELECT 1 FROM public.matches WHERE user_low = lo AND user_high = hi) THEN
    RAISE EXCEPTION 'no match';
  END IF;

  UPDATE public.matches SET
    intro_fee_paid = true,
    intro_fee_paid_by = COALESCE(intro_fee_paid_by, uid),
    chat_opened_at = COALESCE(chat_opened_at, now())
  WHERE user_low = lo AND user_high = hi;

  RETURN QUERY SELECT m.user_low, m.user_high, m.intro_fee_paid, m.intro_fee_paid_by, m.chat_opened_at
    FROM public.matches m WHERE m.user_low = lo AND m.user_high = hi;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;