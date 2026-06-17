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
      AND NOT EXISTS (
        SELECT 1 FROM public.blocks b
        WHERE (b.from_user = uid AND b.to_user = p.id)
           OR (b.from_user = p.id AND b.to_user = uid)
      )
    ORDER BY m.created_at DESC;
END $$;