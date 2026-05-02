
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mun_experience text,
  ADD COLUMN IF NOT EXISTS secretary_names text[] DEFAULT ARRAY[]::text[];
