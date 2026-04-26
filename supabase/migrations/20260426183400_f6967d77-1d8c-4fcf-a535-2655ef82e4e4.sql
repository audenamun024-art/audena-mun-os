
-- ============================================
-- DESTRUCTIVE: Drop legacy MUN tables
-- ============================================
DROP TABLE IF EXISTS public.marksheet_scores CASCADE;
DROP TABLE IF EXISTS public.eb_access CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.registrations CASCADE;
DROP TABLE IF EXISTS public.committees CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.secretaries CASCADE;
DROP TABLE IF EXISTS public.organizers CASCADE;
DROP TABLE IF EXISTS public.research_logs CASCADE;
DROP TABLE IF EXISTS public.task_completions CASCADE;
DROP TABLE IF EXISTS public.user_tasks CASCADE;

-- Drop legacy enums
DROP TYPE IF EXISTS public.event_status CASCADE;
DROP TYPE IF EXISTS public.organizer_status CASCADE;
DROP TYPE IF EXISTS public.registration_status CASCADE;
DROP TYPE IF EXISTS public.transaction_status CASCADE;
DROP TYPE IF EXISTS public.account_type CASCADE;

-- ============================================
-- Simplify roles: keep only admin + user
-- ============================================
-- Remove all non-admin roles, then re-create the enum
DELETE FROM public.user_roles WHERE role NOT IN ('admin');

-- Recreate app_role enum with only admin + user
ALTER TABLE public.user_roles ALTER COLUMN role TYPE text USING role::text;
DROP TYPE IF EXISTS public.app_role CASCADE;
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
ALTER TABLE public.user_roles ALTER COLUMN role TYPE public.app_role USING role::public.app_role;

-- Update has_role to use new enum
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- Update ensure_profile_and_role: drops account_type param, defaults role to 'user'
DROP FUNCTION IF EXISTS public.ensure_profile_and_role(text, text);
CREATE OR REPLACE FUNCTION public.ensure_profile_and_role(_full_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (auth.uid(), _full_name)
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = COALESCE(NULLIF(_full_name, ''), profiles.full_name),
    updated_at = now();
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Drop account_type column from profiles (no longer needed)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS account_type CASCADE;

-- ============================================
-- NEW: Stories table
-- ============================================
CREATE TABLE public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image',
  caption text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stories viewable by all authenticated"
  ON public.stories FOR SELECT
  TO authenticated
  USING (expires_at > now());

CREATE POLICY "Users create own stories"
  ON public.stories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own stories"
  ON public.stories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_stories_user_active ON public.stories(user_id, expires_at);

-- Story views tracking
CREATE TABLE public.story_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (story_id, user_id)
);

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Story owners view their views"
  ON public.story_views FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_views.story_id AND s.user_id = auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Users record own views"
  ON public.story_views FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- NEW: Posts (Explore feed)
-- ============================================
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  image_url text NOT NULL,
  caption text,
  category text DEFAULT 'general',
  likes_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts viewable by all"
  ON public.posts FOR SELECT
  USING (true);

CREATE POLICY "Users create own posts"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own posts"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own posts"
  ON public.posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_posts_category_created ON public.posts(category, created_at DESC);

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Post likes
CREATE TABLE public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post likes viewable by all"
  ON public.post_likes FOR SELECT USING (true);

CREATE POLICY "Users like posts"
  ON public.post_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users unlike posts"
  ON public.post_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger to maintain likes_count
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_post_likes_count
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();
