
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS essay_vision text,
  ADD COLUMN IF NOT EXISTS essay_values text,
  ADD COLUMN IF NOT EXISTS essay_conflict text,
  ADD COLUMN IF NOT EXISTS essay_taaruf text,
  ADD COLUMN IF NOT EXISTS essay_expectations text,
  ADD COLUMN IF NOT EXISTS essay_variant text;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_essay_variant_check') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_essay_variant_check
      CHECK (essay_variant IS NULL OR essay_variant IN ('A','B'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.feature_flags (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.feature_flags TO authenticated, anon;
GRANT ALL ON public.feature_flags TO service_role;

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='feature_flags' AND policyname='Anyone can read flags') THEN
    CREATE POLICY "Anyone can read flags" ON public.feature_flags FOR SELECT USING (true);
  END IF;
END $$;

INSERT INTO public.feature_flags (key, value)
VALUES ('essay_test', '{"enabled": true, "variant_b_percent": 50}'::jsonb)
ON CONFLICT (key) DO NOTHING;
