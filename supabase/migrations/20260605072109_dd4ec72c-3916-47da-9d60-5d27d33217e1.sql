
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS education text,
  ADD COLUMN IF NOT EXISTS occupation text,
  ADD COLUMN IF NOT EXISTS photos text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS kyc_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS kyc_submitted_at timestamptz;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_age_range') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_age_range CHECK (age IS NULL OR (age BETWEEN 18 AND 60));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_kyc_status_check') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_kyc_status_check CHECK (kyc_status IN ('none','pending','approved','rejected'));
  END IF;
END $$;
