CREATE OR REPLACE FUNCTION public.is_admin_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = _user_id
      AND lower(email) IN (
        'wn7corporation@gmail.com',
        'suporte@direitoprime.com.br',
        'wn7juridico@gmail.com',
        'wn7wjridico@gmail.com'
      )
  );
$function$;
