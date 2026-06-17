
-- 1. Profiles: new columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS marital_status text,
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false;

-- Backfill from existing columns
UPDATE public.profiles SET is_verified = (kyc_status = 'approved') WHERE is_verified <> (kyc_status = 'approved');
UPDATE public.profiles SET is_banned = (account_status = 'banned') WHERE is_banned <> (account_status = 'banned');

-- Trigger to keep flags in sync
CREATE OR REPLACE FUNCTION public.sync_profile_flags()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.is_verified := (NEW.kyc_status = 'approved');
  NEW.is_banned := (NEW.account_status = 'banned');
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS sync_profile_flags_trg ON public.profiles;
CREATE TRIGGER sync_profile_flags_trg
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_flags();

-- 2. Matches: chat status (free, no payment)
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS opened_by uuid,
  ADD COLUMN IF NOT EXISTS opened_at timestamptz;

-- Backfill: matches that already paid intro_fee are considered chat_opened
UPDATE public.matches SET status = 'chat_opened', opened_at = COALESCE(opened_at, chat_opened_at, created_at), opened_by = COALESCE(opened_by, intro_fee_paid_by)
  WHERE intro_fee_paid = true AND status = 'pending';

-- 3. photos table
CREATE TABLE IF NOT EXISTS public.photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  photo_url text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.photos TO authenticated;
GRANT ALL ON public.photos TO service_role;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own photos manage" ON public.photos FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "authenticated read photos" ON public.photos FOR SELECT TO authenticated
  USING (true);
CREATE INDEX IF NOT EXISTS photos_user_idx ON public.photos(user_id);

-- 4. essays table
CREATE TABLE IF NOT EXISTS public.essays (
  user_id uuid PRIMARY KEY,
  essay_1 text,
  essay_2 text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.essays TO authenticated;
GRANT ALL ON public.essays TO service_role;
ALTER TABLE public.essays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own essays manage" ON public.essays FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "authenticated read essays" ON public.essays FOR SELECT TO authenticated
  USING (true);

-- 5. kyc_requests
CREATE TABLE IF NOT EXISTS public.kyc_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  doc_type text NOT NULL,
  id_document_url text NOT NULL,
  selfie_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kyc_requests TO authenticated;
GRANT ALL ON public.kyc_requests TO service_role;
ALTER TABLE public.kyc_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own kyc insert" ON public.kyc_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "own kyc select" ON public.kyc_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "admin kyc update" ON public.kyc_requests FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE INDEX IF NOT EXISTS kyc_requests_user_idx ON public.kyc_requests(user_id);
CREATE INDEX IF NOT EXISTS kyc_requests_status_idx ON public.kyc_requests(status);

-- 6. daily_discovery_log
CREATE TABLE IF NOT EXISTS public.daily_discovery_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  seen_user uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('passed','liked')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.daily_discovery_log TO authenticated;
GRANT ALL ON public.daily_discovery_log TO service_role;
ALTER TABLE public.daily_discovery_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own daily log read" ON public.daily_discovery_log FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "own daily log insert" ON public.daily_discovery_log FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS daily_log_user_date_idx ON public.daily_discovery_log(user_id, created_at);

-- 7. audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  target_id uuid,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin audit read" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_admin());
CREATE POLICY "admin audit insert" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() AND admin_id = auth.uid());

-- 8. RPC: open_chat (max 5 active)
CREATE OR REPLACE FUNCTION public.open_chat(match_id_low uuid, match_id_high uuid)
RETURNS public.matches
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); active_count int; row public.matches;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF uid NOT IN (match_id_low, match_id_high) THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT COUNT(*) INTO active_count FROM public.matches
    WHERE status = 'chat_opened' AND (user_low = uid OR user_high = uid);
  IF active_count >= 5 THEN RAISE EXCEPTION 'max_chats_reached'; END IF;
  UPDATE public.matches
    SET status = 'chat_opened',
        opened_by = COALESCE(opened_by, uid),
        opened_at = COALESCE(opened_at, now()),
        intro_fee_paid = true,
        chat_opened_at = COALESCE(chat_opened_at, now())
    WHERE user_low = match_id_low AND user_high = match_id_high
    RETURNING * INTO row;
  IF NOT FOUND THEN RAISE EXCEPTION 'match not found'; END IF;
  RETURN row;
END $$;

-- 9. RPC: send_interest_v2 (logs discovery + likes + mutual match)
CREATE OR REPLACE FUNCTION public.send_interest_v2(target uuid, action text)
RETURNS TABLE(matched boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); other_liked boolean;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF target = uid THEN RAISE EXCEPTION 'cannot act on self'; END IF;
  IF action NOT IN ('passed','liked') THEN RAISE EXCEPTION 'invalid action'; END IF;

  INSERT INTO public.daily_discovery_log (user_id, seen_user, action) VALUES (uid, target, action);

  IF action = 'liked' THEN
    INSERT INTO public.likes (from_user, to_user) VALUES (uid, target) ON CONFLICT DO NOTHING;
    SELECT EXISTS (SELECT 1 FROM public.likes WHERE from_user = target AND to_user = uid) INTO other_liked;
    IF other_liked THEN
      INSERT INTO public.matches (user_low, user_high, status)
        VALUES (LEAST(uid, target), GREATEST(uid, target), 'pending')
        ON CONFLICT DO NOTHING;
      RETURN QUERY SELECT true;
      RETURN;
    END IF;
  END IF;
  RETURN QUERY SELECT false;
END $$;

-- 10. RPC: get_discovery_v2 (max 3/day opposite gender verified)
CREATE OR REPLACE FUNCTION public.get_discovery_v2()
RETURNS TABLE(id uuid, full_name text, birth_date date, city text, country text, marital_status text, gender text, primary_photo text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); my_gender text; seen_today int; remaining int;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT p.gender INTO my_gender FROM public.profiles p WHERE p.id = uid;
  SELECT COUNT(*) INTO seen_today FROM public.daily_discovery_log
    WHERE user_id = uid AND created_at::date = (now() AT TIME ZONE 'UTC')::date;
  remaining := GREATEST(0, 3 - seen_today);
  IF remaining = 0 THEN RETURN; END IF;

  RETURN QUERY
    SELECT p.id, p.full_name, p.birth_date, p.city, p.country, p.marital_status, p.gender,
      (SELECT photo_url FROM public.photos ph WHERE ph.user_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1)
    FROM public.profiles p
    WHERE p.id <> uid
      AND p.is_verified = true
      AND p.is_banned = false
      AND p.gender IS NOT NULL
      AND (my_gender IS NULL OR p.gender <> my_gender)
      AND NOT EXISTS (
        SELECT 1 FROM public.daily_discovery_log d
        WHERE d.user_id = uid AND d.seen_user = p.id
          AND d.created_at::date = (now() AT TIME ZONE 'UTC')::date
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.blocks b
        WHERE (b.from_user = uid AND b.to_user = p.id) OR (b.from_user = p.id AND b.to_user = uid)
      )
    ORDER BY random()
    LIMIT remaining;
END $$;

-- 11. RPC: admin moderation
CREATE OR REPLACE FUNCTION public.admin_approve_kyc(req_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.kyc_requests;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.kyc_requests SET status='approved', reviewed_by=auth.uid(), reviewed_at=now()
    WHERE id = req_id RETURNING * INTO r;
  IF NOT FOUND THEN RAISE EXCEPTION 'not found'; END IF;
  UPDATE public.profiles SET kyc_status='approved', kyc_rejection_reason=NULL WHERE id = r.user_id;
  INSERT INTO public.audit_logs(admin_id, action, target_id, meta)
    VALUES (auth.uid(), 'kyc_approved', r.user_id, jsonb_build_object('request_id', req_id));
END $$;

CREATE OR REPLACE FUNCTION public.admin_reject_kyc(req_id uuid, reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.kyc_requests;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.kyc_requests SET status='rejected', rejection_reason=reason, reviewed_by=auth.uid(), reviewed_at=now()
    WHERE id = req_id RETURNING * INTO r;
  IF NOT FOUND THEN RAISE EXCEPTION 'not found'; END IF;
  UPDATE public.profiles SET kyc_status='rejected', kyc_rejection_reason=reason WHERE id = r.user_id;
  INSERT INTO public.audit_logs(admin_id, action, target_id, meta)
    VALUES (auth.uid(), 'kyc_rejected', r.user_id, jsonb_build_object('request_id', req_id, 'reason', reason));
END $$;

-- 12. send_message: allow when status='chat_opened' instead of intro_fee_paid
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
    WHERE m.user_low = lo AND m.user_high = hi AND m.status = 'chat_opened'
  ) THEN RAISE EXCEPTION 'chat not open'; END IF;
  PERFORM public.check_and_record_rate_limit('message', 10, 60);
  RETURN QUERY
    INSERT INTO public.messages (match_low, match_high, sender, body)
    VALUES (lo, hi, uid, clean)
    RETURNING messages.id, messages.sender, messages.body, messages.created_at, messages.read_at;
END $$;
