CREATE OR REPLACE FUNCTION public.increment_push_campaign_stats(c_id uuid, ok_count int, fail_count int)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  UPDATE public.push_campaigns
  SET 
    sent_count = COALESCE(sent_count, 0) + ok_count,
    failed_count = COALESCE(failed_count, 0) + fail_count,
    last_run_at = now()
  WHERE id = c_id;
$function$;

GRANT EXECUTE ON FUNCTION public.increment_push_campaign_stats(uuid, int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_push_campaign_stats(uuid, int, int) TO service_role;
