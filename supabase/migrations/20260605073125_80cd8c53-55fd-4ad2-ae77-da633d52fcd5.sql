
-- ============ TABLES ============

CREATE TABLE IF NOT EXISTS public.likes (
  from_user uuid NOT NULL,
  to_user uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (from_user, to_user),
  CHECK (from_user <> to_user)
);
GRANT SELECT, INSERT ON public.likes TO authenticated;
GRANT ALL ON public.likes TO service_role;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own likes (sent or received)" ON public.likes FOR SELECT TO authenticated
  USING (auth.uid() = from_user OR auth.uid() = to_user);
CREATE POLICY "insert own likes" ON public.likes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = from_user);

CREATE TABLE IF NOT EXISTS public.matches (
  user_low uuid NOT NULL,
  user_high uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_low, user_high),
  CHECK (user_low < user_high)
);
GRANT SELECT ON public.matches TO authenticated;
GRANT ALL ON public.matches TO service_role;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own matches" ON public.matches FOR SELECT TO authenticated
  USING (auth.uid() = user_low OR auth.uid() = user_high);

CREATE TABLE IF NOT EXISTS public.skips (
  from_user uuid NOT NULL,
  to_user uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (from_user, to_user),
  CHECK (from_user <> to_user)
);
GRANT SELECT, INSERT, DELETE ON public.skips TO authenticated;
GRANT ALL ON public.skips TO service_role;
ALTER TABLE public.skips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own skips" ON public.skips FOR SELECT TO authenticated
  USING (auth.uid() = from_user);
CREATE POLICY "insert own skips" ON public.skips FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = from_user);

CREATE TABLE IF NOT EXISTS public.blocks (
  from_user uuid NOT NULL,
  to_user uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (from_user, to_user),
  CHECK (from_user <> to_user)
);
GRANT SELECT, INSERT, DELETE ON public.blocks TO authenticated;
GRANT ALL ON public.blocks TO service_role;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own blocks" ON public.blocks FOR SELECT TO authenticated
  USING (auth.uid() = from_user);
CREATE POLICY "insert own blocks" ON public.blocks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = from_user);

CREATE TABLE IF NOT EXISTS public.preferences (
  user_id uuid PRIMARY KEY,
  cities text[] NOT NULL DEFAULT '{}',
  min_age integer NOT NULL DEFAULT 18,
  max_age integer NOT NULL DEFAULT 60,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (min_age >= 18 AND max_age <= 60 AND min_age <= max_age)
);
GRANT SELECT, INSERT, UPDATE ON public.preferences TO authenticated;
GRANT ALL ON public.preferences TO service_role;
ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own prefs" ON public.preferences FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "insert own prefs" ON public.preferences FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own prefs" ON public.preferences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.daily_views (
  user_id uuid NOT NULL,
  view_date date NOT NULL,
  profile_ids uuid[] NOT NULL DEFAULT '{}',
  PRIMARY KEY (user_id, view_date)
);
GRANT SELECT ON public.daily_views TO authenticated;
GRANT ALL ON public.daily_views TO service_role;
ALTER TABLE public.daily_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own daily_views" ON public.daily_views FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ============ FUNCTIONS ============

CREATE OR REPLACE FUNCTION public.wib_today()
RETURNS date LANGUAGE sql STABLE AS $$
  SELECT (now() AT TIME ZONE 'Asia/Jakarta')::date
$$;

CREATE OR REPLACE FUNCTION public.next_wib_midnight()
RETURNS timestamptz LANGUAGE sql STABLE AS $$
  SELECT (((now() AT TIME ZONE 'Asia/Jakarta')::date + 1)::timestamp AT TIME ZONE 'Asia/Jakarta')
$$;

CREATE OR REPLACE FUNCTION public.get_discovery_feed()
RETURNS TABLE (
  id uuid,
  display_name text,
  age integer,
  city text,
  occupation text,
  bio_summary text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  today date := public.wib_today();
  existing uuid[];
  remaining int;
  prefs RECORD;
  picks uuid[];
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT profile_ids INTO existing FROM public.daily_views
    WHERE user_id = uid AND view_date = today;
  IF existing IS NULL THEN existing := ARRAY[]::uuid[]; END IF;
  remaining := GREATEST(0, 3 - cardinality(existing));

  SELECT COALESCE(p.cities, '{}'::text[]) AS cities,
         COALESCE(p.min_age, 18) AS min_age,
         COALESCE(p.max_age, 60) AS max_age
    INTO prefs
    FROM (SELECT NULL::text[] AS cities, NULL::int AS min_age, NULL::int AS max_age) base
    LEFT JOIN public.preferences p ON p.user_id = uid;

  IF remaining > 0 THEN
    SELECT COALESCE(array_agg(c.id), '{}'::uuid[])
      INTO picks
      FROM (
        SELECT pr.id
        FROM public.profiles pr
        WHERE pr.id <> uid
          AND pr.profile_complete = true
          AND pr.id <> ALL(existing)
          AND (cardinality(prefs.cities) = 0 OR pr.city = ANY(prefs.cities))
          AND pr.age BETWEEN prefs.min_age AND prefs.max_age
          AND NOT EXISTS (SELECT 1 FROM public.likes l WHERE l.from_user = uid AND l.to_user = pr.id)
          AND NOT EXISTS (
            SELECT 1 FROM public.skips s
            WHERE s.from_user = uid AND s.to_user = pr.id
              AND s.created_at > now() - INTERVAL '7 days'
          )
          AND NOT EXISTS (
            SELECT 1 FROM public.blocks b
            WHERE (b.from_user = uid AND b.to_user = pr.id)
               OR (b.from_user = pr.id AND b.to_user = uid)
          )
        ORDER BY random()
        LIMIT remaining
      ) c;

    IF cardinality(picks) > 0 THEN
      INSERT INTO public.daily_views (user_id, view_date, profile_ids)
      VALUES (uid, today, existing || picks)
      ON CONFLICT (user_id, view_date)
      DO UPDATE SET profile_ids = public.daily_views.profile_ids || EXCLUDED.profile_ids;
      existing := existing || picks;
    END IF;
  END IF;

  RETURN QUERY
    SELECT p.id,
           p.display_name,
           p.age,
           p.city,
           p.occupation,
           LEFT(COALESCE(p.essay_vision, ''), 140) AS bio_summary
    FROM unnest(existing) WITH ORDINALITY AS u(id, ord)
    JOIN public.profiles p ON p.id = u.id
    ORDER BY u.ord;
END
$$;

REVOKE EXECUTE ON FUNCTION public.get_discovery_feed() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_discovery_feed() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_profile_detail(target uuid)
RETURNS TABLE (
  id uuid,
  display_name text,
  age integer,
  city text,
  education text,
  occupation text,
  essay_vision text,
  essay_values text,
  essay_conflict text,
  is_matched boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  matched boolean;
  shown boolean;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF target = uid THEN RAISE EXCEPTION 'cannot view self via detail'; END IF;

  -- must be in today's shown set OR already a match
  SELECT EXISTS (
    SELECT 1 FROM public.matches m
    WHERE (m.user_low = LEAST(uid,target) AND m.user_high = GREATEST(uid,target))
  ) INTO matched;

  SELECT EXISTS (
    SELECT 1 FROM public.daily_views d
    WHERE d.user_id = uid
      AND d.view_date = public.wib_today()
      AND target = ANY(d.profile_ids)
  ) INTO shown;

  IF NOT matched AND NOT shown THEN
    RAISE EXCEPTION 'profile not accessible';
  END IF;

  RETURN QUERY
    SELECT p.id, p.display_name, p.age, p.city, p.education, p.occupation,
           p.essay_vision, p.essay_values, p.essay_conflict, matched
    FROM public.profiles p WHERE p.id = target;
END
$$;
REVOKE EXECUTE ON FUNCTION public.get_profile_detail(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_profile_detail(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.send_interest(target uuid)
RETURNS TABLE (matched boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  other_liked boolean;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF target = uid THEN RAISE EXCEPTION 'cannot like self'; END IF;

  INSERT INTO public.likes (from_user, to_user) VALUES (uid, target)
  ON CONFLICT DO NOTHING;

  SELECT EXISTS (
    SELECT 1 FROM public.likes WHERE from_user = target AND to_user = uid
  ) INTO other_liked;

  IF other_liked THEN
    INSERT INTO public.matches (user_low, user_high)
    VALUES (LEAST(uid, target), GREATEST(uid, target))
    ON CONFLICT DO NOTHING;
    RETURN QUERY SELECT true;
  ELSE
    RETURN QUERY SELECT false;
  END IF;
END
$$;
REVOKE EXECUTE ON FUNCTION public.send_interest(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_interest(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.skip_profile(target uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF target = uid THEN RAISE EXCEPTION 'cannot skip self'; END IF;
  INSERT INTO public.skips (from_user, to_user) VALUES (uid, target)
  ON CONFLICT (from_user, to_user)
  DO UPDATE SET created_at = now();
END
$$;
REVOKE EXECUTE ON FUNCTION public.skip_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.skip_profile(uuid) TO authenticated;
