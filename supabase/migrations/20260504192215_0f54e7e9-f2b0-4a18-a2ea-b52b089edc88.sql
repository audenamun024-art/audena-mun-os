
-- Committees per event
CREATE TABLE IF NOT EXISTS public.committees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  capacity integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_committees_event_id ON public.committees(event_id);

ALTER TABLE public.committees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Committees viewable by all" ON public.committees FOR SELECT USING (true);
CREATE POLICY "Authenticated manage committees insert" ON public.committees FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated manage committees update" ON public.committees FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated manage committees delete" ON public.committees FOR DELETE TO authenticated USING (true);

-- Payment split tracking
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS platform_fee numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS org_amount numeric NOT NULL DEFAULT 0;
