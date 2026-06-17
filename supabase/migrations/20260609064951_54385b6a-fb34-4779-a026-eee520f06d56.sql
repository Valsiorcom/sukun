DROP POLICY IF EXISTS "insert own events" ON public.events;
CREATE POLICY "insert own events" ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());