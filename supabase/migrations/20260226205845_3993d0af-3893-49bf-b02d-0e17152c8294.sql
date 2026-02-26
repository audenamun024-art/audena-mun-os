
-- Add account_type to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'personal';

-- Create user_tasks table for Buzz engagement system
CREATE TABLE public.user_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  points integer NOT NULL DEFAULT 10,
  category text NOT NULL DEFAULT 'buzz',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Track which users completed which tasks
CREATE TABLE public.task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.user_tasks(id) ON DELETE CASCADE,
  video_id uuid REFERENCES public.videos(id) ON DELETE SET NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  points_awarded integer NOT NULL DEFAULT 0,
  UNIQUE(user_id, task_id)
);

-- EB temporary access table
CREATE TABLE public.eb_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  granted_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  UNIQUE(user_id, event_id)
);

-- RLS for user_tasks (public read)
ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tasks viewable by everyone" ON public.user_tasks FOR SELECT USING (true);
CREATE POLICY "Admins manage tasks" ON public.user_tasks FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS for task_completions
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own completions" ON public.task_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own completions" ON public.task_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS for eb_access
ALTER TABLE public.eb_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own eb access" ON public.eb_access FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Organizers manage eb access" ON public.eb_access FOR ALL USING (
  EXISTS (
    SELECT 1 FROM events e JOIN organizers o ON e.organizer_id = o.id
    WHERE e.id = eb_access.event_id AND o.user_id = auth.uid()
  )
);

-- Seed default tasks
INSERT INTO public.user_tasks (title, description, points, category) VALUES
  ('Record Your Best Speech', 'Upload a 30-60 second clip of your best MUN speech', 20, 'buzz'),
  ('Crisis Reaction Video', 'Film your reaction to a crisis scenario', 15, 'buzz'),
  ('Debate Highlight', 'Share a memorable debate moment from a conference', 15, 'buzz'),
  ('Introduction Reel', 'Create a short intro about yourself as a delegate', 10, 'buzz'),
  ('Award Acceptance', 'Record your award acceptance or celebration moment', 25, 'buzz');
