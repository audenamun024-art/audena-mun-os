-- Buzz comments table
CREATE TABLE IF NOT EXISTS public.video_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'video_comments' AND policyname = 'Comments viewable by everyone'
  ) THEN
    CREATE POLICY "Comments viewable by everyone"
    ON public.video_comments
    FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'video_comments' AND policyname = 'Users insert own comments'
  ) THEN
    CREATE POLICY "Users insert own comments"
    ON public.video_comments
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'video_comments' AND policyname = 'Users update own comments'
  ) THEN
    CREATE POLICY "Users update own comments"
    ON public.video_comments
    FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'video_comments' AND policyname = 'Users delete own comments'
  ) THEN
    CREATE POLICY "Users delete own comments"
    ON public.video_comments
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_video_comments_video_id_created_at ON public.video_comments(video_id, created_at DESC);

-- Buzz bookmarks table
CREATE TABLE IF NOT EXISTS public.video_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);

ALTER TABLE public.video_bookmarks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'video_bookmarks' AND policyname = 'Users manage own bookmarks'
  ) THEN
    CREATE POLICY "Users manage own bookmarks"
    ON public.video_bookmarks
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_video_bookmarks_user_id ON public.video_bookmarks(user_id);

-- Ensure every authenticated user can create their own delegate role once
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Users insert own delegate role'
  ) THEN
    CREATE POLICY "Users insert own delegate role"
    ON public.user_roles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id AND role = 'delegate'::public.app_role);
  END IF;
END $$;

-- Allow admin moderation actions from Admin dashboard
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'organizers' AND policyname = 'Admins update organizers'
  ) THEN
    CREATE POLICY "Admins update organizers"
    ON public.organizers
    FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'videos' AND policyname = 'Admins update videos'
  ) THEN
    CREATE POLICY "Admins update videos"
    ON public.videos
    FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;
END $$;

-- Helper RPC to guarantee profile + default delegate role after auth
CREATE OR REPLACE FUNCTION public.ensure_profile_and_role(
  _full_name TEXT DEFAULT '',
  _account_type TEXT DEFAULT 'personal'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, account_type)
  VALUES (auth.uid(), COALESCE(_full_name, ''), COALESCE(_account_type, 'personal'))
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'delegate'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_profile_and_role(TEXT, TEXT) TO authenticated;