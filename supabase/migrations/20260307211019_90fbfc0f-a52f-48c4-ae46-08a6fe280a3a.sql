
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'organizer', 'delegate', 'eb');
CREATE TYPE public.account_type AS ENUM ('personal', 'organisation');
CREATE TYPE public.organizer_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');
CREATE TYPE public.registration_status AS ENUM ('pending', 'approved', 'rejected', 'waitlisted');
CREATE TYPE public.transaction_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- HELPER
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  account_type public.account_type DEFAULT 'personal',
  avatar_url TEXT, bio TEXT, institution TEXT, phone TEXT,
  muns_attended INTEGER DEFAULT 0, awards_won INTEGER DEFAULT 0,
  committees_served INTEGER DEFAULT 0, rank_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_profiles_ts BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service insert roles" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- ORGANIZERS
CREATE TABLE public.organizers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, logo_url TEXT, description TEXT, website TEXT, contact_email TEXT,
  status public.organizer_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.organizers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Organizers viewable by all" ON public.organizers FOR SELECT USING (true);
CREATE POLICY "Users manage own organizer" ON public.organizers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own organizer" ON public.organizers FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_organizers_ts BEFORE UPDATE ON public.organizers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- EVENTS
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  title TEXT NOT NULL, slug TEXT UNIQUE, description TEXT, banner_url TEXT,
  location TEXT, start_date TIMESTAMPTZ, end_date TIMESTAMPTZ,
  registration_fee NUMERIC DEFAULT 0, platform_fee NUMERIC DEFAULT 0,
  status public.event_status DEFAULT 'draft', max_delegates INTEGER,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events viewable by all" ON public.events FOR SELECT USING (true);
CREATE POLICY "Organizers manage events" ON public.events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.organizers WHERE id = organizer_id AND user_id = auth.uid())
);
CREATE POLICY "Organizers update events" ON public.events FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.organizers WHERE id = organizer_id AND user_id = auth.uid())
);
CREATE POLICY "Organizers delete events" ON public.events FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.organizers WHERE id = organizer_id AND user_id = auth.uid())
);
CREATE TRIGGER update_events_ts BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- COMMITTEES
CREATE TABLE public.committees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL, agenda TEXT, capacity INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.committees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Committees viewable by all" ON public.committees FOR SELECT USING (true);
CREATE POLICY "Organizers manage committees" ON public.committees FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.events e JOIN public.organizers o ON e.organizer_id = o.id WHERE e.id = event_id AND o.user_id = auth.uid())
);
CREATE POLICY "Organizers update committees" ON public.committees FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.events e JOIN public.organizers o ON e.organizer_id = o.id WHERE e.id = event_id AND o.user_id = auth.uid())
);
CREATE POLICY "Organizers delete committees" ON public.committees FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.events e JOIN public.organizers o ON e.organizer_id = o.id WHERE e.id = event_id AND o.user_id = auth.uid())
);

-- REGISTRATIONS
CREATE TABLE public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  committee_id UUID REFERENCES public.committees(id),
  country_preference TEXT, experience TEXT, portfolio_url TEXT,
  status public.registration_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, event_id)
);
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own registrations" ON public.registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Organizers view event registrations" ON public.registrations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.events e JOIN public.organizers o ON e.organizer_id = o.id WHERE e.id = event_id AND o.user_id = auth.uid())
);
CREATE POLICY "Users create registrations" ON public.registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Organizers update registrations" ON public.registrations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.events e JOIN public.organizers o ON e.organizer_id = o.id WHERE e.id = event_id AND o.user_id = auth.uid())
);
CREATE TRIGGER update_registrations_ts BEFORE UPDATE ON public.registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- TRANSACTIONS
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES public.registrations(id),
  amount NUMERIC NOT NULL, status public.transaction_status DEFAULT 'pending',
  payment_method TEXT, created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- VIDEOS
CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL, description TEXT, video_url TEXT NOT NULL,
  thumbnail_url TEXT, category TEXT, views INTEGER DEFAULT 0,
  flagged BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Videos viewable by all" ON public.videos FOR SELECT USING (true);
CREATE POLICY "Users upload own videos" ON public.videos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own videos" ON public.videos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own videos" ON public.videos FOR DELETE USING (auth.uid() = user_id);

-- VIDEO COMMENTS
CREATE TABLE public.video_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments viewable by all" ON public.video_comments FOR SELECT USING (true);
CREATE POLICY "Users create comments" ON public.video_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own comments" ON public.video_comments FOR DELETE USING (auth.uid() = user_id);

-- VIDEO BOOKMARKS
CREATE TABLE public.video_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(), UNIQUE (user_id, video_id)
);
ALTER TABLE public.video_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own bookmarks" ON public.video_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage bookmarks" ON public.video_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete bookmarks" ON public.video_bookmarks FOR DELETE USING (auth.uid() = user_id);

-- VOTES
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(), UNIQUE (user_id, video_id)
);
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Votes viewable by all" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Users manage votes" ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete votes" ON public.votes FOR DELETE USING (auth.uid() = user_id);

-- RESEARCH LOGS
CREATE TABLE public.research_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id),
  url TEXT, action TEXT, exit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.research_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own logs" ON public.research_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create logs" ON public.research_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all logs" ON public.research_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL, message TEXT, read BOOLEAN DEFAULT false,
  link TEXT, created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- USER TASKS
CREATE TABLE public.user_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, description TEXT, points INTEGER DEFAULT 10,
  category TEXT, active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tasks viewable by all" ON public.user_tasks FOR SELECT USING (true);

-- TASK COMPLETIONS
CREATE TABLE public.task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.user_tasks(id) ON DELETE CASCADE,
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(), UNIQUE (user_id, task_id)
);
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own completions" ON public.task_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create completions" ON public.task_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- EB ACCESS
CREATE TABLE public.eb_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, event_id)
);
ALTER TABLE public.eb_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own eb access" ON public.eb_access FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Organizers manage eb access" ON public.eb_access FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.events e JOIN public.organizers o ON e.organizer_id = o.id WHERE e.id = event_id AND o.user_id = auth.uid())
);
CREATE POLICY "Organizers delete eb access" ON public.eb_access FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.events e JOIN public.organizers o ON e.organizer_id = o.id WHERE e.id = event_id AND o.user_id = auth.uid())
);

-- ENSURE PROFILE AND ROLE RPC
CREATE OR REPLACE FUNCTION public.ensure_profile_and_role(_full_name TEXT, _account_type TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, account_type)
  VALUES (auth.uid(), _full_name, _account_type::public.account_type)
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = COALESCE(NULLIF(_full_name, ''), profiles.full_name),
    account_type = _account_type::public.account_type, updated_at = now();
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'delegate')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- STORAGE
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true);
CREATE POLICY "Anyone can view uploads" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');
CREATE POLICY "Authenticated users upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'authenticated');
CREATE POLICY "Users update own uploads" ON storage.objects FOR UPDATE USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own uploads" ON storage.objects FOR DELETE USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- SEED TASKS
INSERT INTO public.user_tasks (title, description, points, category) VALUES
  ('Upload a Buzz Video', 'Share your MUN moments with the community', 25, 'buzz'),
  ('Complete Profile', 'Fill out all profile fields', 10, 'profile'),
  ('Register for Event', 'Register for your first MUN event', 15, 'event'),
  ('First Committee Session', 'Attend your first committee session', 20, 'event'),
  ('Win an Award', 'Receive an award at a MUN conference', 50, 'achievement');
