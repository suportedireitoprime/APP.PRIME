import { Capacitor } from '@capacitor/core';

/** Gera um id numérico estável (positivo) a partir do uuid do lembrete. */
function idNumerico(uuid: string): number {
  let h = 0;
  for (let i = 0; i < uuid.length; i++) h = (h * 31 + uuid.charCodeAt(i)) | 0;
  // faixa 1.000.000 - 1.999.999 pra não colidir com os ids 9999x dos lembretes de estudo
  return 1_000_000 + (Math.abs(h) % 1_000_000);
}

type Aviso = {
  id: string;
  titulo: string;
  mensagem?: string | null;
  avisar_em: string;
  recorrencia?: string | null;
  ativo?: boolean;
};

/** Agenda (ou reagenda) a notificação local de um lembrete livre/conteúdo. */
export async function agendarAvisoLocal(aviso: Aviso, corpo?: string) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      const req = await LocalNotifications.requestPermissions();
      if (req.display !== 'granted') return;
    }

    const id = idNumerico(aviso.id);
    await LocalNotifications.cancel({ notifications: [{ id }] });
    if (aviso.ativo === false) return;

    const at = new Date(aviso.avisar_em);
    if (Number.isNaN(at.getTime())) return;

    const rec = aviso.recorrencia || 'unica';
    const every =
      rec === 'diaria' ? 'day' : rec === 'semanal' ? 'week' : rec === 'mensal' ? 'month' : undefined;

    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title: aviso.titulo,
          body: corpo || aviso.mensagem || 'Toque para abrir o Estudos Jurídicos.',
          schedule: {
            at,
            allowWhileIdle: true,
            ...(every ? { every, repeats: true } : {}),
          } as any,
          iconColor: '#c94c4c',
        },
      ],
    });
  } catch (e) {
    console.warn('[lembretes] falha ao agendar notificação local', e);
  }
}

/** Cancela a notificação local de um lembrete. */
export async function cancelarAvisoLocal(uuid: string) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.cancel({ notifications: [{ id: idNumerico(uuid) }] });
  } catch (e) {
    console.warn('[lembretes] falha ao cancelar notificação local', e);
  }
}
