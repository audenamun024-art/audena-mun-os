
DROP POLICY "Users insert notifications" ON public.notifications;
CREATE POLICY "Authenticated insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (user_id != auth.uid());
