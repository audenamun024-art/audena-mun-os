-- Organizations table for admin-managed organizer accounts
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  description TEXT,
  website TEXT,
  logo_url TEXT,
  contact_person TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  owner_user_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Public read so the app can list organizations
CREATE POLICY "Organizations viewable by all"
  ON public.organizations FOR SELECT
  USING (true);

-- Admins (and the public admin panel) manage organizations
CREATE POLICY "Public admin manage orgs insert"
  ON public.organizations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public admin manage orgs update"
  ON public.organizations FOR UPDATE
  TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Public admin manage orgs delete"
  ON public.organizations FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add 'organization' to app_role enum if not present
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'organization';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.organizations;