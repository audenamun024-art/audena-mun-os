
CREATE TABLE public.connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  UNIQUE (requester_id, receiver_id)
);

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own connections" ON public.connections
  FOR SELECT TO public
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

CREATE POLICY "Users create connections" ON public.connections
  FOR INSERT TO public
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users update received connections" ON public.connections
  FOR UPDATE TO public
  USING (auth.uid() = receiver_id OR auth.uid() = requester_id);

CREATE POLICY "Users delete own connections" ON public.connections
  FOR DELETE TO public
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;

CREATE POLICY "Users insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);
