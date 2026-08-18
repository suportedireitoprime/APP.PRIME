import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

export interface AlarmeConfig {
  hora: number;
  minuto: number;
  diasDaSemana: number[]; // 1 = Domingo, 2 = Segunda, ..., 7 = Sábado
  ativo: boolean;
}

const ALARME_ID_BASE = 9000;

export async function solicitarPermissaoAlarme(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    console.log('Notificações locais não suportadas na web (para teste).');
    return true;
  }
  const perm = await LocalNotifications.requestPermissions();
  return perm.display === 'granted';
}

export async function configurarAlarmeEstudo(config: AlarmeConfig) {
  if (!Capacitor.isNativePlatform()) {
    toast.success(`Alarme de estudo salvo para ${config.hora}:${config.minuto.toString().padStart(2, '0')} (Modo Web)`);
    return;
  }

  // Cancelar alarmes de estudo anteriores para reconfigurar
  const pendentes = await LocalNotifications.getPending();
  const alarmesAntigos = pendentes.notifications.filter(n => n.id >= ALARME_ID_BASE && n.id < ALARME_ID_BASE + 7);
  if (alarmesAntigos.length > 0) {
    await LocalNotifications.cancel({ notifications: alarmesAntigos });
  }

  if (!config.ativo || config.diasDaSemana.length === 0) {
    toast('Alarme de estudo desativado.');
    return;
  }

  const hasPermission = await solicitarPermissaoAlarme();
  if (!hasPermission) {
    toast.error('Permissão de notificação negada. Não é possível agendar o alarme.');
    return;
  }

  const notificationsToSchedule = config.diasDaSemana.map((diaSemana, index) => {
    return {
      id: ALARME_ID_BASE + index,
      title: 'Hora de Estudar! 📚',
      body: 'O seu horário reservado para estudos começou. Vamos lá?',
      schedule: {
        on: {
          weekday: diaSemana,
          hour: config.hora,
          minute: config.minuto,
        },
        allowWhileIdle: true,
      },
      // Configuração para som relaxante: requer arquivo 'relax_sound.wav' em res/raw no Android e bundle no iOS
      sound: 'relax_sound.wav', 
      smallIcon: 'ic_stat_name',
      actionTypeId: '',
      extra: {
        tipo: 'alarme_estudo'
      }
    };
  });

  await LocalNotifications.schedule({
    notifications: notificationsToSchedule
  });

  toast.success(`Alarme agendado com sucesso para ${config.hora}:${config.minuto.toString().padStart(2, '0')}.`);
}

export async function checarStatusAlarme(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  const pendentes = await LocalNotifications.getPending();
  const ativo = pendentes.notifications.some(n => n.id >= ALARME_ID_BASE && n.id < ALARME_ID_BASE + 7);
  return ativo;
}
