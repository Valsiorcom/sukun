
CREATE OR REPLACE FUNCTION public.wib_today()
RETURNS date LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT (now() AT TIME ZONE 'Asia/Jakarta')::date
$$;

CREATE OR REPLACE FUNCTION public.next_wib_midnight()
RETURNS timestamptz LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT (((now() AT TIME ZONE 'Asia/Jakarta')::date + 1)::timestamp AT TIME ZONE 'Asia/Jakarta')
$$;
