-- EVENTS
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  cover_url text,
  location text,
  start_date timestamptz,
  end_date timestamptz,
  fee numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  organizer_id uuid,
  organization_id uuid,
  status text NOT NULL DEFAULT 'published',
  capacity integer,
  category text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events viewable by all" ON public.events FOR SELECT USING (true);
CREATE POLICY "Authenticated create events" ON public.events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update events" ON public.events FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public admin manage events delete" ON public.events FOR DELETE TO anon, authenticated USING (true);
CREATE POLICY "Public admin manage events update" ON public.events FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Public admin manage events insert" ON public.events FOR INSERT TO anon WITH CHECK (true);

CREATE TRIGGER events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS events_start_date_idx ON public.events (start_date DESC);

-- EVENT REGISTRATIONS
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending',
  payment_id uuid,
  amount numeric(10,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own registrations" ON public.event_registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public read registrations admin" ON public.event_registrations FOR SELECT TO anon USING (true);
CREATE POLICY "Users create own registrations" ON public.event_registrations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service update registrations" ON public.event_registrations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin delete registrations" ON public.event_registrations FOR DELETE TO anon, authenticated USING (true);

-- PAYMENTS / TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  provider text NOT NULL DEFAULT 'cashfree',
  order_id text NOT NULL,
  payment_session_id text,
  cf_payment_id text,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'created',
  purpose text,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public read payments admin" ON public.payments FOR SELECT TO anon USING (true);
CREATE POLICY "Service insert payments" ON public.payments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Service update payments" ON public.payments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin delete payments" ON public.payments FOR DELETE TO anon, authenticated USING (true);

CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS payments_user_idx ON public.payments (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payments_order_idx ON public.payments (order_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;