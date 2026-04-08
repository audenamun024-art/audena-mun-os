CREATE TABLE public.buzz_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  accurate boolean NOT NULL DEFAULT false,
  checked boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);

ALTER TABLE public.buzz_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view interactions"
ON public.buzz_interactions FOR SELECT
USING (true);

CREATE POLICY "Users create own interactions"
ON public.buzz_interactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own interactions"
ON public.buzz_interactions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users delete own interactions"
ON public.buzz_interactions FOR DELETE
USING (auth.uid() = user_id);