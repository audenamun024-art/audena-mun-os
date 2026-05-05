
CREATE TABLE IF NOT EXISTS public.email_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_otps_email_idx ON public.email_otps (email, created_at DESC);

ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;
-- No policies: only the service role (used by edge functions) can access this table.
