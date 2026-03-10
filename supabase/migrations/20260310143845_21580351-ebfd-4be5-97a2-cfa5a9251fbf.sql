ALTER TABLE public.organizers
ADD COLUMN IF NOT EXISTS place text;

ALTER TABLE public.secretaries
ADD COLUMN IF NOT EXISTS photo_url text;

CREATE INDEX IF NOT EXISTS idx_organizers_user_id ON public.organizers(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_secretaries_organizer_id ON public.secretaries(organizer_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event_status ON public.registrations(event_id, status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_one ON public.conversations(participant_one);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_two ON public.conversations(participant_two);
CREATE INDEX IF NOT EXISTS idx_marksheet_scores_event_delegate ON public.marksheet_scores(event_id, delegate_user_id);

CREATE OR REPLACE FUNCTION public.set_marksheet_total()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.total := COALESCE(NEW.diplomacy, 0) + COALESCE(NEW.research, 0) + COALESCE(NEW.speaking, 0);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_marksheet_total_trigger ON public.marksheet_scores;
CREATE TRIGGER set_marksheet_total_trigger
BEFORE INSERT OR UPDATE ON public.marksheet_scores
FOR EACH ROW
EXECUTE FUNCTION public.set_marksheet_total();

DROP TRIGGER IF EXISTS update_organizers_updated_at ON public.organizers;
CREATE TRIGGER update_organizers_updated_at
BEFORE UPDATE ON public.organizers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY event_id, delegate_user_id
           ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
         ) AS rn
  FROM public.marksheet_scores
)
DELETE FROM public.marksheet_scores m
USING ranked r
WHERE m.id = r.id
  AND r.rn > 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'marksheet_scores_event_delegate_unique'
  ) THEN
    ALTER TABLE public.marksheet_scores
    ADD CONSTRAINT marksheet_scores_event_delegate_unique UNIQUE (event_id, delegate_user_id);
  END IF;
END $$;

DROP POLICY IF EXISTS "EB insert scores" ON public.marksheet_scores;
DROP POLICY IF EXISTS "EB update scores" ON public.marksheet_scores;
DROP POLICY IF EXISTS "EB delete scores" ON public.marksheet_scores;

CREATE POLICY "EB insert scores"
ON public.marksheet_scores
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = scored_by
  AND (
    public.has_role(auth.uid(), 'eb'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);

CREATE POLICY "EB update scores"
ON public.marksheet_scores
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'eb'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'eb'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "EB delete scores"
ON public.marksheet_scores
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'eb'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);