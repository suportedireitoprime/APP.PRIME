// Agenda lembrete de fim de trial: 1) salva no Supabase (para o cron enviar
// via WhatsApp); 2) agenda push local (Capacitor) para o mesmo instante.
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

export type TrialPlan = 'mensal' | 'anual' | 'anual_parcelado';

export function trialDaysFor(_plan: TrialPlan): number {
  // 3 dias grátis em todos os planos (Google Play e App Store).
  return 3;
}

/** Momento em que o lembrete "seu teste termina em breve" deve chegar. */
export function computeReminderAt(startedAt: Date, trialDays: number): Date {
  // 24h antes do fim do teste de 3 dias.
  const endsAt = new Date(startedAt.getTime() + trialDays * 86400_000);
  const leadHours = trialDays >= 7 ? 48 : 24;
  return new Date(endsAt.getTime() - leadHours * 3600_000);
}

export async function scheduleTrialReminder(plan: TrialPlan = 'anual'): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const trialDays = trialDaysFor(plan);
    const startedAt = new Date();
    const endsAt = new Date(startedAt.getTime() + trialDays * 86400_000);
    const reminder24h = computeReminderAt(startedAt, trialDays);
    const reminder6h = new Date(endsAt.getTime() - 6 * 3600_000); // Item 35: 6h antes da expiração

    // 1) Persistência para o cron (Horus/WhatsApp/Push backend)
    await supabase.from('trial_reminders').insert([
      {
        user_id: user.id,
        plano: plan,
        trial_days: trialDays,
        trial_started_at: startedAt.toISOString(),
        trial_ends_at: endsAt.toISOString(),
        reminder_at: reminder24h.toISOString(),
        status: 'scheduled',
      },
      {
        user_id: user.id,
        plano: plan,
        trial_days: trialDays,
        trial_started_at: startedAt.toISOString(),
        trial_ends_at: endsAt.toISOString(),
        reminder_at: reminder6h.toISOString(),
        status: 'scheduled',
      }
    ]);

    // 2) Push local no dispositivo (24h e 6h antes)
    if (Capacitor.isNativePlatform()) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const perm = await LocalNotifications.checkPermissions();
        if (perm.display !== 'granted') {
          const req = await LocalNotifications.requestPermissions();
          if (req.display !== 'granted') return;
        }
        const notifyId1 = 77000 + Math.floor(Math.random() * 10000);
        const notifyId2 = 88000 + Math.floor(Math.random() * 10000);
        await LocalNotifications.schedule({
          notifications: [
            {
              id: notifyId1,
              title: 'Seu teste grátis está acabando',
              body: 'Faltam 24 horas para o fim do seu teste grátis do Direito Prime PRO. Aproveite todos os recursos!',
              schedule: { at: reminder24h, allowWhileIdle: true },
              smallIcon: 'ic_stat_icon_config_sample',
              iconColor: '#c94c4c',
              channelId: 'alertas_urgentes',
            },
            {
              id: notifyId2,
              title: 'Últimas horas do seu teste gratuito! ⏳',
              body: 'Restam apenas 6 horas de teste gratuito. Escolha seu plano com desconto para não perder o acesso.',
              schedule: { at: reminder6h, allowWhileIdle: true },
              smallIcon: 'ic_stat_icon_config_sample',
              iconColor: '#c94c4c',
              channelId: 'alertas_urgentes',
            }
          ],
        });
      } catch (e) {
        console.warn('[trialReminders] push local falhou', e);
      }
    }
  } catch (e) {
    console.warn('[trialReminders] agendamento falhou', e);
  }
}
