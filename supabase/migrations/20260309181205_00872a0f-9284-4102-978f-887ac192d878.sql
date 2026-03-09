
ALTER TABLE public.organizers ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.organizers ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.organizers ADD COLUMN IF NOT EXISTS country text;

CREATE TABLE public.secretaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  name text NOT NULL,
  designation text NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.secretaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Secretaries viewable by all" ON public.secretaries FOR SELECT TO public USING (true);
CREATE POLICY "Organizer manages own secretaries" ON public.secretaries FOR INSERT TO public
  WITH CHECK (EXISTS (SELECT 1 FROM public.organizers WHERE id = secretaries.organizer_id AND user_id = auth.uid()));
CREATE POLICY "Organizer updates own secretaries" ON public.secretaries FOR UPDATE TO public
  USING (EXISTS (SELECT 1 FROM public.organizers WHERE id = secretaries.organizer_id AND user_id = auth.uid()));
CREATE POLICY "Organizer deletes own secretaries" ON public.secretaries FOR DELETE TO public
  USING (EXISTS (SELECT 1 FROM public.organizers WHERE id = secretaries.organizer_id AND user_id = auth.uid()));

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_one uuid NOT NULL,
  participant_two uuid NOT NULL,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(participant_one, participant_two)
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own conversations" ON public.conversations FOR SELECT TO public
  USING (auth.uid() = participant_one OR auth.uid() = participant_two);
CREATE POLICY "Users create conversations" ON public.conversations FOR INSERT TO public
  WITH CHECK (auth.uid() = participant_one OR auth.uid() = participant_two);
CREATE POLICY "Users update own conversations" ON public.conversations FOR UPDATE TO public
  USING (auth.uid() = participant_one OR auth.uid() = participant_two);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view messages in own conversations" ON public.messages FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND (c.participant_one = auth.uid() OR c.participant_two = auth.uid())));
CREATE POLICY "Users send messages in own conversations" ON public.messages FOR INSERT TO public
  WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND (c.participant_one = auth.uid() OR c.participant_two = auth.uid())));
CREATE POLICY "Users update own messages" ON public.messages FOR UPDATE TO public
  USING (auth.uid() = sender_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

CREATE TABLE public.marksheet_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  delegate_user_id uuid NOT NULL,
  committee_id uuid REFERENCES public.committees(id),
  diplomacy integer DEFAULT 0,
  research integer DEFAULT 0,
  speaking integer DEFAULT 0,
  total integer GENERATED ALWAYS AS (diplomacy + research + speaking) STORED,
  scored_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(event_id, delegate_user_id)
);
ALTER TABLE public.marksheet_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "EB and admins view scores" ON public.marksheet_scores FOR SELECT TO public
  USING (has_role(auth.uid(), 'eb') OR has_role(auth.uid(), 'admin') OR auth.uid() = delegate_user_id);
CREATE POLICY "EB insert scores" ON public.marksheet_scores FOR INSERT TO public
  WITH CHECK (auth.uid() = scored_by AND (has_role(auth.uid(), 'eb') OR has_role(auth.uid(), 'admin')));
CREATE POLICY "EB update scores" ON public.marksheet_scores FOR UPDATE TO public
  USING (auth.uid() = scored_by AND (has_role(auth.uid(), 'eb') OR has_role(auth.uid(), 'admin')));
CREATE POLICY "EB delete scores" ON public.marksheet_scores FOR DELETE TO public
  USING (has_role(auth.uid(), 'eb') OR has_role(auth.uid(), 'admin'));
