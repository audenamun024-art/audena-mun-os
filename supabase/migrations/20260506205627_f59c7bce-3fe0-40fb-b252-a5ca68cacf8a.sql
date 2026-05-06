DROP POLICY IF EXISTS "Authenticated create events" ON public.events;
DROP POLICY IF EXISTS "Authenticated update events" ON public.events;
DROP POLICY IF EXISTS "Public admin manage events delete" ON public.events;
DROP POLICY IF EXISTS "Public admin manage events insert" ON public.events;
DROP POLICY IF EXISTS "Public admin manage events update" ON public.events;

CREATE POLICY "Admins manage events"
ON public.events
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Organizers create own events"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  OR organizer_id = auth.uid()
);

CREATE POLICY "Organizers update own events"
ON public.events
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  OR organizer_id = auth.uid()
)
WITH CHECK (
  created_by = auth.uid()
  OR organizer_id = auth.uid()
);

CREATE POLICY "Organizers delete own events"
ON public.events
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid()
  OR organizer_id = auth.uid()
);

DROP POLICY IF EXISTS "Authenticated manage committees delete" ON public.committees;
DROP POLICY IF EXISTS "Authenticated manage committees insert" ON public.committees;
DROP POLICY IF EXISTS "Authenticated manage committees update" ON public.committees;

CREATE POLICY "Admins manage committees"
ON public.committees
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Event owners create committees"
ON public.committees
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = committees.event_id
      AND (e.created_by = auth.uid() OR e.organizer_id = auth.uid())
  )
);

CREATE POLICY "Event owners update committees"
ON public.committees
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = committees.event_id
      AND (e.created_by = auth.uid() OR e.organizer_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = committees.event_id
      AND (e.created_by = auth.uid() OR e.organizer_id = auth.uid())
  )
);

CREATE POLICY "Event owners delete committees"
ON public.committees
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = committees.event_id
      AND (e.created_by = auth.uid() OR e.organizer_id = auth.uid())
  )
);
