-- 1) Restrict essays SELECT to own + matched users
DROP POLICY IF EXISTS "authenticated read essays" ON public.essays;
CREATE POLICY "read own or matched essays"
  ON public.essays FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.user_low  = LEAST(auth.uid(), essays.user_id)
        AND m.user_high = GREATEST(auth.uid(), essays.user_id)
    )
  );

-- 2) Restrict photos SELECT to own + matched users
DROP POLICY IF EXISTS "authenticated read photos" ON public.photos;
CREATE POLICY "read own or matched photos"
  ON public.photos FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.user_low  = LEAST(auth.uid(), photos.user_id)
        AND m.user_high = GREATEST(auth.uid(), photos.user_id)
    )
  );

-- 3) Prevent privilege escalation on profiles via BEFORE UPDATE trigger
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Hard-locked admin-only fields
  NEW.is_verified            := OLD.is_verified;
  NEW.is_banned              := OLD.is_banned;
  NEW.suspended_until        := OLD.suspended_until;
  NEW.admin_notes            := OLD.admin_notes;
  NEW.kyc_rejection_reason   := OLD.kyc_rejection_reason;

  -- account_status: users may only self-soft-delete
  IF NEW.account_status IS DISTINCT FROM OLD.account_status
     AND NEW.account_status <> 'deleted' THEN
    NEW.account_status := OLD.account_status;
  END IF;

  -- kyc_status: users may only move to 'pending' from a non-approved state
  IF NEW.kyc_status IS DISTINCT FROM OLD.kyc_status THEN
    IF NEW.kyc_status = 'pending'
       AND COALESCE(OLD.kyc_status, 'none') IN ('none', 'rejected') THEN
      -- allowed
      NULL;
    ELSE
      NEW.kyc_status := OLD.kyc_status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_no_privilege_escalation ON public.profiles;
CREATE TRIGGER profiles_no_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- 4) Remove user-side payment writes (backend/admin only)
DROP POLICY IF EXISTS "insert own payments" ON public.payments;

-- 5) Remove user-side subscription writes (backend/admin only)
DROP POLICY IF EXISTS "insert own sub" ON public.subscriptions;
DROP POLICY IF EXISTS "update own sub" ON public.subscriptions;