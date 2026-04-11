ALTER PUBLICATION supabase_realtime ADD TABLE public.buzz_interactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_comments;

-- Add unique constraint on buzz_interactions for upsert
ALTER TABLE public.buzz_interactions ADD CONSTRAINT buzz_interactions_user_video_unique UNIQUE (user_id, video_id);