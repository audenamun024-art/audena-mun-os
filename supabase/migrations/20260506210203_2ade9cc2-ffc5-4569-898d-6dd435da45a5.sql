DROP POLICY IF EXISTS "Admin delete registrations" ON public.event_registrations;

CREATE POLICY "Admins delete registrations"
ON public.event_registrations
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Event owners delete registrations"
ON public.event_registrations
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_registrations.event_id
      AND (e.created_by = auth.uid() OR e.organizer_id = auth.uid())
  )
);
