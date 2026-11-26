import { supabase } from '@/integrations/supabase/client';
import type { PushCampaign } from './pushConfig';

export async function fetchPushCampaigns(): Promise<PushCampaign[]> {
  const { data, error } = await supabase
    .from('push_campaigns')
    .select(
      'id, title, body, status, url, image_url, next_run_at, created_at, sent_count, delivered_count, opened_count, failed_count, audience, tipo',
    )
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw error;
  return (data || []) as PushCampaign[];
}

export interface DispatchPushParams {
  title: string;
  body: string;
  url?: string | null;
  emoji?: string;
  audience: Record<string, unknown>;
  tipo: string;
  automationKey?: string;
  scheduledForIso?: string;
  data?: Record<string, unknown>;
  /** Se true, envia direto via send-push para admins sem criar campanha na tabela */
  adminTestOnly?: boolean;
}

export async function dispatchPushCampaign(params: DispatchPushParams): Promise<{ scheduled: boolean }> {
  const isNow = !params.scheduledForIso;

  if (params.adminTestOnly && isNow) {
    const { error } = await supabase.functions.invoke('send-push', {
      body: {
        title: params.title,
        body: params.body,
        url: params.url || undefined,
        emoji: params.emoji,
        audience: params.audience,
        data: params.data ?? { category: params.tipo },
      },
    });
    if (error) throw error;
    return { scheduled: false };
  }

  const nextRun = params.scheduledForIso || new Date().toISOString();
  const { data: campaign, error: cErr } = await supabase
    .from('push_campaigns')
    .insert({
      title: params.title,
      body: params.body,
      url: params.url || null,
      status: isNow ? 'sending' : 'scheduled',
      next_run_at: nextRun,
      audience: params.audience,
      tipo: params.tipo,
      ...(params.automationKey ? { automation_key: params.automationKey } : {}),
    } as never)
    .select()
    .single();

  if (cErr) throw cErr;

  if (isNow) {
    const { error: sErr } = await supabase.functions.invoke('send-push', {
      body: {
        campaign_id: campaign.id,
        title: params.title,
        body: params.body,
        url: params.url || undefined,
        emoji: params.emoji,
        audience: params.audience,
        data: params.data ?? { category: params.tipo },
      },
    });
    if (sErr) console.warn('Aviso worker send-push:', sErr);
  }

  return { scheduled: !isNow };
}

export async function cancelPushCampaign(id: string): Promise<void> {
  const { error } = await supabase
    .from('push_campaigns')
    .update({ status: 'cancelled' })
    .eq('id', id);
  if (error) throw error;
}
