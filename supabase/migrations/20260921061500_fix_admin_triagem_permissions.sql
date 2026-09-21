-- 1. Grant SELECT on profiles so PostgREST never throws 42501
GRANT SELECT ON public.profiles TO anon, authenticated;

-- 2. Allow Admins to select from profiles table under RLS
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  TO authenticated 
  USING (public.is_admin_user(auth.uid()));

-- 3. Create Security Definer RPC for Triagem Responses
CREATE OR REPLACE FUNCTION public.admin_get_respostas_triagem()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'display_name', COALESCE(p.display_name, au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
        'email', au.email,
        'status_perfil', p.status_perfil,
        'faixa_etaria', p.faixa_etaria,
        'areas_interesse', p.areas_interesse,
        'interesses', p.interesses,
        'whatsapp_number', COALESCE(p.whatsapp_number, p.telefone),
        'onboarding_completed_at', p.onboarding_completed_at
      ) ORDER BY p.onboarding_completed_at DESC
    ),
    '[]'::jsonb
  )
  FROM public.profiles p
  LEFT JOIN auth.users au ON au.id = p.id
  WHERE p.onboarding_completed_at IS NOT NULL
  LIMIT 100;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_respostas_triagem() TO anon, authenticated, service_role;
