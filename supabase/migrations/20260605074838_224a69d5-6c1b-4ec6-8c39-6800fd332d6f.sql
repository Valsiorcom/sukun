
-- =========================================================
-- Roles
-- =========================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users see own roles" ON public.user_roles;
CREATE POLICY "users see own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin'::public.app_role)
$$;

-- =========================================================
-- Profiles: moderation fields
-- =========================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS suspended_until timestamptz,
  ADD COLUMN IF NOT EXISTS admin_notes text;

-- Admin can view & update all profiles
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
CREATE POLICY "Admins view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins update all profiles" ON public.profiles;
CREATE POLICY "Admins update all profiles" ON public.profiles
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =========================================================
-- Reports
-- =========================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter uuid NOT NULL,
  target uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending',
  resolution text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insert own report" ON public.reports;
CREATE POLICY "insert own report" ON public.reports
  FOR INSERT TO authenticated WITH CHECK (reporter = auth.uid());

DROP POLICY IF EXISTS "view own report" ON public.reports;
CREATE POLICY "view own report" ON public.reports
  FOR SELECT TO authenticated USING (reporter = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "admin update reports" ON public.reports;
CREATE POLICY "admin update reports" ON public.reports
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =========================================================
-- Payments
-- =========================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL, -- 'intro_fee' | 'subscription_monthly' | 'subscription_yearly'
  amount_idr integer NOT NULL,
  status text NOT NULL DEFAULT 'success', -- success|failed|refunded
  ref text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "view own payments" ON public.payments;
CREATE POLICY "view own payments" ON public.payments
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "insert own payments" ON public.payments;
CREATE POLICY "insert own payments" ON public.payments
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admin update payments" ON public.payments;
CREATE POLICY "admin update payments" ON public.payments
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Wire intro fee to log payment
CREATE OR REPLACE FUNCTION public.pay_intro_fee(peer uuid)
RETURNS TABLE(user_low uuid, user_high uuid, intro_fee_paid boolean, intro_fee_paid_by uuid, chat_opened_at timestamptz)
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
  INSERT INTO public.payments (user_id, kind, amount_idr, status, meta)
    VALUES (uid, 'intro_fee', 49000, 'success', jsonb_build_object('peer', peer));
  RETURN QUERY SELECT m.user_low, m.user_high, m.intro_fee_paid, m.intro_fee_paid_by, m.chat_opened_at
    FROM public.matches m WHERE m.user_low = lo AND m.user_high = hi;
END $$;

-- =========================================================
-- Admin RPCs
-- =========================================================
CREATE OR REPLACE FUNCTION public.admin_kpi_overview()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT jsonb_build_object(
    'dau', (SELECT COUNT(DISTINCT sender) FROM public.messages WHERE created_at > now() - interval '24 hours'),
    'new_today', (SELECT COUNT(*) FROM public.profiles WHERE created_at::date = (now() AT TIME ZONE 'Asia/Jakarta')::date),
    'onboarding_completion_rate', (
      SELECT CASE WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND(100.0 * COUNT(*) FILTER (WHERE profile_complete) / COUNT(*), 1) END
      FROM public.profiles),
    'match_rate', (
      SELECT CASE WHEN (SELECT COUNT(*) FROM public.likes) = 0 THEN 0
        ELSE ROUND(100.0 * (SELECT COUNT(*) FROM public.matches) * 2 / (SELECT COUNT(*) FROM public.likes), 1) END),
    'intro_fee_conversion', (
      SELECT CASE WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND(100.0 * COUNT(*) FILTER (WHERE intro_fee_paid) / COUNT(*), 1) END
      FROM public.matches),
    'gender_male', (SELECT COUNT(*) FROM public.profiles WHERE gender = 'male'),
    'gender_female', (SELECT COUNT(*) FROM public.profiles WHERE gender = 'female')
  ) INTO result;
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.admin_kyc_queue()
RETURNS TABLE(id uuid, display_name text, email text, kyc_submitted_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY SELECT p.id, p.display_name, p.email, p.kyc_submitted_at
    FROM public.profiles p WHERE p.kyc_status = 'pending'
    ORDER BY p.kyc_submitted_at NULLS LAST;
END $$;

CREATE OR REPLACE FUNCTION public.admin_decide_kyc(target uuid, decision text, reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF decision NOT IN ('approved','rejected') THEN RAISE EXCEPTION 'invalid decision'; END IF;
  UPDATE public.profiles SET
    kyc_status = decision,
    kyc_rejection_reason = CASE WHEN decision = 'rejected' THEN reason ELSE NULL END
  WHERE id = target;
END $$;

CREATE OR REPLACE FUNCTION public.admin_reports_queue()
RETURNS TABLE(id uuid, reporter uuid, target uuid, reason text, details text,
              target_name text, target_email text, created_at timestamptz, hours_open numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY
    SELECT r.id, r.reporter, r.target, r.reason, r.details,
           p.display_name, p.email, r.created_at,
           ROUND(EXTRACT(EPOCH FROM (now() - r.created_at))/3600.0, 2)
    FROM public.reports r
    LEFT JOIN public.profiles p ON p.id = r.target
    WHERE r.status = 'pending'
    ORDER BY r.created_at ASC;
END $$;

CREATE OR REPLACE FUNCTION public.admin_decide_report(report_id uuid, action text, note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF action NOT IN ('warn','suspend','ban','dismiss') THEN RAISE EXCEPTION 'invalid action'; END IF;
  SELECT * INTO r FROM public.reports WHERE id = report_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'not found'; END IF;
  UPDATE public.reports SET status = 'resolved', resolution = action, resolved_by = auth.uid(),
    resolved_at = now() WHERE id = report_id;
  IF action = 'warn' THEN
    UPDATE public.profiles SET account_status = 'warned', admin_notes = COALESCE(note, admin_notes)
      WHERE id = r.target;
  ELSIF action = 'suspend' THEN
    UPDATE public.profiles SET account_status = 'suspended',
      suspended_until = now() + interval '7 days',
      admin_notes = COALESCE(note, admin_notes) WHERE id = r.target;
  ELSIF action = 'ban' THEN
    UPDATE public.profiles SET account_status = 'banned',
      admin_notes = COALESCE(note, admin_notes) WHERE id = r.target;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.admin_search_users(q text)
RETURNS TABLE(id uuid, display_name text, email text, phone text,
              account_status text, kyc_status text, gender text, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY SELECT p.id, p.display_name, p.email, p.phone, p.account_status,
                      p.kyc_status, p.gender, p.created_at
    FROM public.profiles p
    WHERE q IS NULL OR q = '' OR p.email ILIKE '%'||q||'%' OR p.phone ILIKE '%'||q||'%'
      OR p.display_name ILIKE '%'||q||'%'
    ORDER BY p.created_at DESC LIMIT 50;
END $$;

CREATE OR REPLACE FUNCTION public.admin_user_action(target uuid, action text, note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF action = 'force_verify' THEN
    UPDATE public.profiles SET kyc_status = 'approved', kyc_rejection_reason = NULL WHERE id = target;
  ELSIF action = 'suspend' THEN
    UPDATE public.profiles SET account_status = 'suspended',
      suspended_until = now() + interval '7 days', admin_notes = COALESCE(note, admin_notes) WHERE id = target;
  ELSIF action = 'ban' THEN
    UPDATE public.profiles SET account_status = 'banned', admin_notes = COALESCE(note, admin_notes) WHERE id = target;
  ELSIF action = 'unban' THEN
    UPDATE public.profiles SET account_status = 'active', suspended_until = NULL WHERE id = target;
  ELSE RAISE EXCEPTION 'invalid action';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.admin_recent_payments()
RETURNS TABLE(id uuid, user_id uuid, user_email text, kind text, amount_idr integer,
              status text, ref text, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY SELECT pm.id, pm.user_id, p.email, pm.kind, pm.amount_idr,
                      pm.status, pm.ref, pm.created_at
    FROM public.payments pm
    LEFT JOIN public.profiles p ON p.id = pm.user_id
    ORDER BY pm.created_at DESC LIMIT 100;
END $$;

CREATE OR REPLACE FUNCTION public.admin_refund_payment(payment_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.payments SET status = 'refunded' WHERE id = payment_id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_signed_url(bucket text, path text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN path; -- signed URL handled client-side via storage.from(bucket).createSignedUrl
END $$;

-- Allow admins to read all storage objects in kyc & photos via storage policies
DO $$ BEGIN
  CREATE POLICY "Admins read kyc" ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'kyc' AND public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins read photos" ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'photos' AND public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
