
-- Drop wildcard "Public admin manage" policies that allow anon/authenticated full write access
DROP POLICY IF EXISTS "Public admin manage videos update" ON public.videos;
DROP POLICY IF EXISTS "Public admin manage videos delete" ON public.videos;
DROP POLICY IF EXISTS "Public admin manage posts update" ON public.posts;
DROP POLICY IF EXISTS "Public admin manage posts delete" ON public.posts;
DROP POLICY IF EXISTS "Public admin manage profiles update" ON public.profiles;
DROP POLICY IF EXISTS "Public admin manage profiles delete" ON public.profiles;
DROP POLICY IF EXISTS "Public admin manage stories delete" ON public.stories;
DROP POLICY IF EXISTS "Public admin manage orgs insert" ON public.organizations;
DROP POLICY IF EXISTS "Public admin manage orgs update" ON public.organizations;
DROP POLICY IF EXISTS "Public admin manage orgs delete" ON public.organizations;

-- Replace with admin-role-scoped policies via has_role()
CREATE POLICY "Admins manage videos" ON public.videos
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage posts" ON public.posts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage stories" ON public.stories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage organizations" ON public.organizations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Drop the phone column from profiles (already removed from UI) to prevent
-- public exposure of phone numbers via the open SELECT policy on profiles.
ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone;
