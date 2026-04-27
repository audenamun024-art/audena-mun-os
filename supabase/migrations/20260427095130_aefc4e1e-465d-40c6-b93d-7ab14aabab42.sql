
-- VIDEOS: allow public update + delete (in addition to existing owner policies)
CREATE POLICY "Public admin manage videos update" ON public.videos FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public admin manage videos delete" ON public.videos FOR DELETE TO anon, authenticated USING (true);

-- POSTS: allow public update + delete
CREATE POLICY "Public admin manage posts update" ON public.posts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public admin manage posts delete" ON public.posts FOR DELETE TO anon, authenticated USING (true);

-- STORIES: public read all + public delete
CREATE POLICY "Public read all stories" ON public.stories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public admin manage stories delete" ON public.stories FOR DELETE TO anon, authenticated USING (true);

-- PROFILES: allow public update + delete from admin
CREATE POLICY "Public admin manage profiles update" ON public.profiles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public admin manage profiles delete" ON public.profiles FOR DELETE TO anon, authenticated USING (true);

-- Enable realtime
ALTER TABLE public.videos REPLICA IDENTITY FULL;
ALTER TABLE public.posts REPLICA IDENTITY FULL;
ALTER TABLE public.stories REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.videos; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.posts; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.stories; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
