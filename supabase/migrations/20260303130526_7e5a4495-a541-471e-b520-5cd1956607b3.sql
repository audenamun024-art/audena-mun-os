CREATE OR REPLACE FUNCTION public.ensure_profile_and_role(_full_name text DEFAULT ''::text, _account_type text DEFAULT 'personal'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, account_type)
  VALUES (auth.uid(), COALESCE(_full_name, ''), COALESCE(_account_type, 'personal'))
  ON CONFLICT (user_id) DO UPDATE SET
    account_type = COALESCE(EXCLUDED.account_type, profiles.account_type),
    full_name = CASE WHEN profiles.full_name = '' THEN COALESCE(EXCLUDED.full_name, '') ELSE profiles.full_name END;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'delegate'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$function$