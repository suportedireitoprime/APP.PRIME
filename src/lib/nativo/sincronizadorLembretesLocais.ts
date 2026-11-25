/**
 * Sincronizador Central de Notificações Locais Nativas (Local-First Híbrido)
 * 
 * Garante que todos os lembretes do usuário (Leitura, Artigos, Questões,
 * Streak e Trial) estejam agendados diretamente no hardware do smartphone
 * via @capacitor/local-notifications (AlarmManager no Android / UNNotificationRequest no iOS).
 * 
 * Vantagens:
 * 1. 0ms de atraso e precisão absoluta de horário.
 * 2. 100% isolado (zero chance de notificações de outros usuários vazarem).
 * 3. Funciona sem internet (offline, avião, metrô).
 */
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { registrarCanaisEAcoesLocais } from '@/lib/nativo/notificacaoLocalManager';

// Faixas de ID numérico estável para evitar colisões
const ID_RANGE = {
  READING: 100000,
  ARTICLE: 200000,
  QUESTOES: 300000,
  STREAK: 400001,
  TRIAL_6H: 500001,
  TRIAL_EXPIRED: 500002,
};

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export async function sincronizarTodosLembretesLocais(userId?: string): Promise<{ ok: boolean; agendados: number }> {
  if (!Capacitor.isNativePlatform()) {
    return { ok: true, agendados: 0 };
  }

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      return { ok: false, agendados: 0 };
    }

    // Inicializa canais com som e prioridade alta no Android
    await registrarCanaisEAcoesLocais();

    let targetUserId = userId;
    if (!targetUserId) {
      const { data: sessionData } = await supabase.auth.getSession();
      targetUserId = sessionData.session?.user?.id;
    }

    if (!targetUserId) {
      // Se deslogado, limpa todos os lembretes locais agendados
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length) {
        await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: Number(n.id) })) });
      }
      return { ok: true, agendados: 0 };
    }

    // Busca todos os dados ativos do usuário em paralelo
    const [readingRes, articleRes, questoesRes, profileRes] = await Promise.all([
      supabase
        .from('reading_reminders')
        .select('id, title, livro_titulo, time_of_day, days_of_week, enabled')
        .eq('user_id', targetUserId)
        .eq('enabled', true),
      supabase
        .from('article_time_reminders')
        .select('id, label, message, time_of_day, days_of_week, active')
        .eq('user_id', targetUserId)
        .eq('active', true),
      supabase
        .from('questoes_lembretes')
        .select('id, horario, dias, meta_questoes, ativo')
        .eq('user_id', targetUserId)
        .eq('ativo', true),
      supabase
        .from('profiles')
        .select('id, created_at, is_premium')
        .eq('id', targetUserId)
        .maybeSingle(),
    ]);

    const notificationsToSchedule: any[] = [];
    const WEEKDAY_MAP: Record<string, number> = { dom: 1, seg: 2, ter: 3, qua: 4, qui: 5, sex: 6, sab: 7 };

    // 1. Lembretes de Leitura
    for (const r of readingRes.data || []) {
      const [hh, mm] = (r.time_of_day || '20:00').split(':').map(Number);
      const days = Array.isArray(r.days_of_week) ? r.days_of_week : [0, 1, 2, 3, 4, 5, 6];
      const hBase = hashString(r.id) % 9000;

      for (const dow of days) {
        // dow pode ser 0..6 (onde 0=Dom) -> Capacitor espera 1..7 (1=Dom)
        const weekday = (typeof dow === 'number' ? dow + 1 : WEEKDAY_MAP[dow]) || 1;
        const notifId = ID_RANGE.READING + hBase * 10 + weekday;

        notificationsToSchedule.push({
          id: notifId,
          title: r.title || `📖 Hora de ler ${r.livro_titulo || 'sua matéria'}`,
          body: 'Sua meta diária de estudos te espera. Toque para abrir o livro!',
          schedule: { on: { weekday, hour: hh, minute: mm }, allowWhileIdle: true, repeats: true },
          channelId: 'retencao_leitura',
          smallIcon: 'ic_stat_name',
          iconColor: '#c94c4c',
          extra: { rota: '/biblioteca', modulo: 'livros' },
        });
      }
    }

    // 2. Lembretes de Artigos
    for (const r of articleRes.data || []) {
      const [hh, mm] = (r.time_of_day || '20:00').split(':').map(Number);
      const days = Array.isArray(r.days_of_week) ? r.days_of_week : [0, 1, 2, 3, 4, 5, 6];
      const hBase = hashString(r.id) % 9000;

      for (const dow of days) {
        const weekday = (typeof dow === 'number' ? dow + 1 : WEEKDAY_MAP[dow]) || 1;
        const notifId = ID_RANGE.ARTICLE + hBase * 10 + weekday;

        notificationsToSchedule.push({
          id: notifId,
          title: `⏰ ${r.label || 'Revisão Jurídica'}`,
          body: r.message || 'Hora de revisar seu artigo do dia.',
          schedule: { on: { weekday, hour: hh, minute: mm }, allowWhileIdle: true, repeats: true },
          channelId: 'lembrete_estudo',
          smallIcon: 'ic_stat_name',
          iconColor: '#c94c4c',
          extra: { rota: '/vade-mecum', modulo: 'livros' },
        });
      }
    }

    // 3. Lembretes de Questões
    for (const r of questoesRes.data || []) {
      const [hh, mm] = (r.horario || '20:00').split(':').map(Number);
      const days = Array.isArray(r.dias) ? r.dias : ['seg', 'ter', 'qua', 'qui', 'sex'];
      const hBase = hashString(r.id) % 9000;
      const meta = r.meta_questoes || 10;

      for (const diaStr of days) {
        const weekday = typeof diaStr === 'number' ? diaStr + 1 : (WEEKDAY_MAP[diaStr] || 1);
        const notifId = ID_RANGE.QUESTOES + hBase * 10 + weekday;

        notificationsToSchedule.push({
          id: notifId,
          title: '🎯 Hora de praticar questões',
          body: `Bora resolver ${meta} questões agora para fixar o aprendizado?`,
          schedule: { on: { weekday, hour: hh, minute: mm }, allowWhileIdle: true, repeats: true },
          channelId: 'lembrete_estudo',
          smallIcon: 'ic_stat_name',
          iconColor: '#c94c4c',
          extra: { rota: '/questoes', modulo: 'streak' },
        });
      }
    }

    // 4. Lembrete Diário de Streak (Fogo / Ofensiva às 20h)
    const profile = profileRes.data;
    const streakDays = (profile as any)?.streak_days || 0;
    notificationsToSchedule.push({
      id: ID_RANGE.STREAK,
      title: streakDays > 0 ? `🔥 Não perca sua sequência de ${streakDays} dias!` : '🔥 Inicie sua sequência de estudos hoje!',
      body: 'Resolva 1 questão rápida antes da meia-noite para manter o fogo aceso.',
      schedule: { on: { hour: 20, minute: 0 }, allowWhileIdle: true, repeats: true },
      channelId: 'lembrete_estudo',
      smallIcon: 'ic_stat_name',
      iconColor: '#f97316',
      extra: { rota: '/questoes', modulo: 'streak' },
    });

    // 5. Lembretes de Trial (Se usuário não for premium)
    if (profile && !(profile as any).is_premium && (profile as any).created_at) {
      const createdTime = new Date((profile as any).created_at).getTime();
      const fire66h = new Date(createdTime + 66 * 3600 * 1000);
      const fire72h = new Date(createdTime + 72 * 3600 * 1000);
      const now = Date.now();

      if (fire66h.getTime() > now) {
        notificationsToSchedule.push({
          id: ID_RANGE.TRIAL_6H,
          title: '⚡ Restam 6 horas da sua degustação!',
          body: 'Seu acesso VIP de 3 dias termina hoje! Garanta desconto exclusivo no Vitalício.',
          schedule: { at: fire66h, allowWhileIdle: true },
          channelId: 'lembrete_estudo',
          smallIcon: 'ic_stat_name',
          iconColor: '#eab308',
          extra: { rota: '/assinatura', modulo: 'trial' },
        });
      }

      if (fire72h.getTime() > now) {
        notificationsToSchedule.push({
          id: ID_RANGE.TRIAL_EXPIRED,
          title: '🔒 Teste de 3 dias encerrado',
          body: 'Sua degustação gratuita acabou. Desbloqueie todo o acervo e IA sem limites!',
          schedule: { at: fire72h, allowWhileIdle: true },
          channelId: 'lembrete_estudo',
          smallIcon: 'ic_stat_name',
          iconColor: '#ef4444',
          extra: { rota: '/assinatura', modulo: 'trial' },
        });
      }
    }

    // Cancela os pendentes anteriores pertencentes a essas faixas
    const pending = await LocalNotifications.getPending();
    const oldIds = pending.notifications
      .map((n) => Number(n.id))
      .filter((id) => id >= 100000 && id <= 599999);

    if (oldIds.length) {
      await LocalNotifications.cancel({ notifications: oldIds.map((id) => ({ id })) });
    }

    // Agenda o novo conjunto limpo e deduplicado
    if (notificationsToSchedule.length) {
      await LocalNotifications.schedule({
        notifications: notificationsToSchedule,
      });
    }

    return { ok: true, agendados: notificationsToSchedule.length };
  } catch (err) {
    console.warn('[sincronizadorLembretesLocais] Erro ao sincronizar:', err);
    return { ok: false, agendados: 0 };
  }
}
