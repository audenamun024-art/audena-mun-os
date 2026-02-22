
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'organizer', 'delegate', 'eb');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  institution TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  total_muns INTEGER DEFAULT 0,
  awards_won INTEGER DEFAULT 0,
  rank_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'delegate');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Organizers
CREATE TABLE public.organizers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  institution_name TEXT NOT NULL,
  location TEXT DEFAULT '',
  contact_person TEXT DEFAULT '',
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.organizers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Organizers viewable by everyone" ON public.organizers FOR SELECT USING (true);
CREATE POLICY "Users insert own organizer" ON public.organizers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own organizer" ON public.organizers FOR UPDATE USING (auth.uid() = user_id);

-- Events
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID REFERENCES public.organizers(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT DEFAULT '',
  location TEXT DEFAULT '',
  banner_url TEXT DEFAULT '',
  start_date DATE,
  end_date DATE,
  registration_fee INTEGER DEFAULT 0,
  platform_fee INTEGER DEFAULT 25,
  registration_deadline DATE,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events viewable by everyone" ON public.events FOR SELECT USING (true);
CREATE POLICY "Organizers insert events" ON public.events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.organizers WHERE id = organizer_id AND user_id = auth.uid())
);
CREATE POLICY "Organizers update own events" ON public.events FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.organizers WHERE id = organizer_id AND user_id = auth.uid())
);
CREATE POLICY "Organizers delete own events" ON public.events FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.organizers WHERE id = organizer_id AND user_id = auth.uid())
);

-- Committees
CREATE TABLE public.committees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  agenda TEXT DEFAULT '',
  capacity INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.committees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Committees viewable by everyone" ON public.committees FOR SELECT USING (true);
CREATE POLICY "Organizers manage committees" ON public.committees FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.events e JOIN public.organizers o ON e.organizer_id = o.id WHERE e.id = event_id AND o.user_id = auth.uid())
);
CREATE POLICY "Organizers update committees" ON public.committees FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.events e JOIN public.organizers o ON e.organizer_id = o.id WHERE e.id = event_id AND o.user_id = auth.uid())
);
CREATE POLICY "Organizers delete committees" ON public.committees FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.events e JOIN public.organizers o ON e.organizer_id = o.id WHERE e.id = event_id AND o.user_id = auth.uid())
);

-- Registrations
CREATE TABLE public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  committee_id UUID REFERENCES public.committees(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  institution TEXT DEFAULT '',
  experience TEXT DEFAULT '',
  country_preference TEXT DEFAULT '',
  portfolio_url TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own registrations" ON public.registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Organizers view event registrations" ON public.registrations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.events e JOIN public.organizers o ON e.organizer_id = o.id WHERE e.id = event_id AND o.user_id = auth.uid())
);
CREATE POLICY "Users insert own registration" ON public.registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Organizers update registrations" ON public.registrations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.events e JOIN public.organizers o ON e.organizer_id = o.id WHERE e.id = event_id AND o.user_id = auth.uid())
);

-- Transactions
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  platform_fee INTEGER NOT NULL DEFAULT 25,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  transaction_ref TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Videos (Buzz)
CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Best Speech',
  video_url TEXT NOT NULL,
  thumbnail_url TEXT DEFAULT '',
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Videos viewable by everyone" ON public.videos FOR SELECT USING (true);
CREATE POLICY "Users insert own videos" ON public.videos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own videos" ON public.videos FOR UPDATE USING (auth.uid() = user_id);

-- Votes
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, target_type, target_id)
);
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Votes viewable by everyone" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Users insert own votes" ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own votes" ON public.votes FOR DELETE USING (auth.uid() = user_id);

-- Rank Points
CREATE TABLE public.rank_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.rank_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rank points viewable by everyone" ON public.rank_points FOR SELECT USING (true);
CREATE POLICY "System inserts rank points" ON public.rank_points FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Research Logs
CREATE TABLE public.research_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  url TEXT DEFAULT '',
  blocked BOOLEAN DEFAULT false,
  exit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.research_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own research logs" ON public.research_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own logs" ON public.research_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT DEFAULT '',
  read BOOLEAN DEFAULT false,
  type TEXT DEFAULT 'info',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System inserts notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS for user_roles
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true);
CREATE POLICY "Anyone can view uploads" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');
CREATE POLICY "Auth users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own uploads" ON storage.objects FOR UPDATE USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
