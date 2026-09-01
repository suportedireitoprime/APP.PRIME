CREATE OR REPLACE FUNCTION public.admin_list_opens_recent()
RETURNS TABLE (
  event_id uuid,
  campaign_id uuid,
  campaign_title text,
  user_id uuid,
  display_name text,
  email text,
  platform text,
  install_id text,
  opened_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.id                                                       AS event_id,
    e.campaign_id,
    c.title                                                    AS campaign_title,
    e.user_id,
    COALESCE(p.display_name, '—')                              AS display_name,
    u.email                                                    AS email,
    e.platform,
    NULLIF((e.metadata->>'install_id'), '')                    AS install_id,
    e.created_at                                               AS opened_at
  FROM public.push_events e
  LEFT JOIN public.push_campaigns c ON c.id = e.campaign_id
  LEFT JOIN public.profiles       p ON p.id = e.user_id
  LEFT JOIN auth.users            u ON u.id = e.user_id
  WHERE e.event_type = 'opened'
    AND e.created_at >= (now() AT TIME ZONE 'America/Sao_Paulo' - INTERVAL '7 days') AT TIME ZONE 'America/Sao_Paulo'
    AND public.is_admin_user((select auth.uid()))
  ORDER BY e.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.admin_list_opens_recent() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_opens_recent() TO authenticated;
