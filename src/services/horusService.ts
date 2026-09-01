import { supabase } from '@/integrations/supabase/client';

export type NotifPrefs = {
  radar_leis: boolean;
  boletim_juridico: boolean;
  boletim_leis: boolean;
  blog_novos_posts: boolean;
  app_atualizacoes: boolean;
  artigo_favorito: boolean;
};

export const DEFAULT_PREFS: NotifPrefs = {
  radar_leis: true,
  boletim_juridico: true,
  boletim_leis: true,
  blog_novos_posts: true,
  app_atualizacoes: true,
  artigo_favorito: true,
};

export type HorusLinkedStatus = {
  phone_e164: string;
  verified_at: string | null;
  nome_preferido: string | null;
  apelido: string | null;
  apelido_ativo: boolean;
  notif_prefs: NotifPrefs | null;
};

export const horusService = {
  async getStatus() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { user: null, linked: null, profileName: '' };

    const [{ data }, { data: prof }] = await Promise.all([
      supabase
        .from('horus_whatsapp_users')
        .select('phone_e164, verified_at, nome_preferido, apelido, apelido_ativo, notif_prefs')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .maybeSingle(),
    ]);

    const linked = (data as unknown as HorusLinkedStatus) || null;
    const profileName = ((prof as any)?.display_name || '').trim();

    return { user, linked, profileName };
  },

  async updatePrefs(userId: string, nextPrefs: NotifPrefs) {
    return supabase
      .from('horus_whatsapp_users')
      .update({ notif_prefs: nextPrefs as any })
      .eq('user_id', userId);
  },

  async updateNome(userId: string, phone_e164: string | undefined, finalName: string) {
    const ops: PromiseLike<any>[] = [
      supabase.from('profiles').update({ display_name: finalName }).eq('id', userId),
    ];
    if (phone_e164) {
      ops.push(
        supabase.from('horus_whatsapp_users').update({ nome_preferido: finalName }).eq('user_id', userId),
        supabase.from('horus_user_stats').update({ nome_preferido: finalName }).eq('telefone', phone_e164)
      );
    }
    return Promise.all(ops);
  },

  async updateApelido(userId: string, finalApelido: string, apelidoAtivo: boolean) {
    return supabase
      .from('horus_whatsapp_users')
      .update({ apelido: finalApelido || null, apelido_ativo: apelidoAtivo && !!finalApelido })
      .eq('user_id', userId);
  }
};
