ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- allow receiver to update read_at on messages addressed to them
DROP POLICY IF EXISTS "receiver can mark read" ON public.messages;
CREATE POLICY "receiver can mark read" ON public.messages
  FOR UPDATE TO authenticated
  USING (
    sender <> auth.uid()
    AND (auth.uid() = match_low OR auth.uid() = match_high)
  )
  WITH CHECK (
    sender <> auth.uid()
    AND (auth.uid() = match_low OR auth.uid() = match_high)
  );

CREATE OR REPLACE FUNCTION public.mark_chat_read(peer uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); lo uuid; hi uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  lo := LEAST(uid, peer); hi := GREATEST(uid, peer);
  UPDATE public.messages
    SET read_at = now()
    WHERE match_low = lo AND match_high = hi
      AND sender = peer AND read_at IS NULL;
END $$;