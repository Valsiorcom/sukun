
CREATE OR REPLACE FUNCTION public.get_discovery_feed()
 RETURNS TABLE(id uuid, display_name text, age integer, city text, occupation text, bio_summary text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
          AND pr.account_status = 'active'
          AND pr.kyc_status = 'approved'
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
          AND NOT EXISTS (
            SELECT 1 FROM public.matches m
            WHERE m.user_low = LEAST(uid, pr.id) AND m.user_high = GREATEST(uid, pr.id)
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
           LEFT(COALESCE(p.essay_vision, ''), 300) AS bio_summary
    FROM unnest(existing) WITH ORDINALITY AS u(id, ord)
    JOIN public.profiles p ON p.id = u.id
    ORDER BY u.ord;
END
$function$;

CREATE OR REPLACE FUNCTION public.get_discovery_status()
 RETURNS TABLE(viewed_today int, daily_cap int)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  today date := public.wib_today();
  existing uuid[];
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  SELECT profile_ids INTO existing FROM public.daily_views
    WHERE user_id = uid AND view_date = today;
  IF existing IS NULL THEN existing := ARRAY[]::uuid[]; END IF;
  RETURN QUERY SELECT cardinality(existing)::int, 3::int;
END
$function$;

GRANT EXECUTE ON FUNCTION public.get_discovery_status() TO authenticated;
