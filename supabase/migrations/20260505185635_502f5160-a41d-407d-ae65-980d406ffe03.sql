
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  assigned_to uuid,
  created_by uuid NOT NULL,
  deadline timestamptz,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tasks_assigned_to_idx ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON public.tasks(status);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all tasks" ON public.tasks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Assignees view their tasks" ON public.tasks
  FOR SELECT TO authenticated
  USING (assigned_to = auth.uid());

CREATE POLICY "Assignees update their task status" ON public.tasks
  FOR UPDATE TO authenticated
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
