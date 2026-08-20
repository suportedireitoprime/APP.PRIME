import { Capacitor } from '@capacitor/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_PUSH_CHANNEL_ID, configurarCanaisDeNotificacao } from '@/lib/nativeNotificationChannels';

const PENDING_TOKEN_KEY = 'oab_na_risca_pending_push_token';
const INSTALL_ID_KEY = 'oab_na_risca_install_id';

function getInstallId(): string {
  try {
    let id = window.localStorage.getItem(INSTALL_ID_KEY);
    if (!id) {
      id = (crypto?.randomUUID?.() || `inst_${Date.now()}_${Math.random().toString(36).slice(2)}`);
      window.localStorage.setItem(INSTALL_ID_KEY, id);
    }
    return id;
  } catch {
    return `inst_${Date.now()}`;
  }
}

const PENDING_EVENTS_KEY = 'direitoprime:push-pending-events';

type PendingEvent = {
  campaign_id: string;
  event_type: 'opened' | 'delivered' | 'converted';
  metadata: Record<string, unknown>;
};

function readPendingEvents(): PendingEvent[] {
  try {
    const raw = window.localStorage.getItem(PENDING_EVENTS_KEY);
    return raw ? (JSON.parse(raw) as PendingEvent[]) : [];
  } catch { return []; }
}

function writePendingEvents(list: PendingEvent[]) {
  try {
    window.localStorage.setItem(PENDING_EVENTS_KEY, JSON.stringify(list.slice(-30)));
  } catch {}
}

function queuePendingEvent(ev: PendingEvent) {
  const list = readPendingEvents();
  const dup = list.some((e) => e.campaign_id === ev.campaign_id && e.event_type === ev.event_type);
  if (!dup) writePendingEvents([...list, ev]);
}

function dropPendingEvent(ev: PendingEvent) {
  writePendingEvents(
    readPendingEvents().filter(
      (e) => !(e.campaign_id === ev.campaign_id && e.event_type === ev.event_type),
    ),
  );
}

/**
 * Reenvia eventos de push que não conseguiram chegar ao servidor (app fechado
 * logo após o toque, offline, cold-start). O backend deduplica por install_id.
 */
export async function flushPendingPushEvents() {
  const list = readPendingEvents();
  if (!list.length) return;
  for (const ev of list) {
    try {
      const { error } = await supabase.functions.invoke('push-track', {
        body: { campaign_id: ev.campaign_id, event_type: ev.event_type, metadata: ev.metadata },
      });
      if (!error) dropPendingEvent(ev);
    } catch { /* tenta de novo no próximo boot */ }
  }
}

function trackPush(campaignId: string, eventType: 'opened' | 'delivered' | 'converted', extra: Record<string, unknown> = {}) {
  const platform = (() => {
    try { return Capacitor.getPlatform(); } catch { return 'web'; }
  })();
  // Marca a sessão de jornada quando a notificação é aberta
  if (eventType === 'opened' && typeof window !== 'undefined') {
    try {
      window.sessionStorage.setItem('direitoprime:push-journey', JSON.stringify({
        campaign_id: campaignId, started_at: Date.now(), install_id: getInstallId(),
      }));
    } catch {}
  }
  const pending: PendingEvent = {
    campaign_id: campaignId,
    event_type: eventType,
    metadata: { install_id: getInstallId(), platform, ...extra },
  };
  // Persiste antes de enviar: se o app for morto no meio, reenviamos no boot.
  queuePendingEvent(pending);
  return supabase.functions.invoke('push-track', {
    body: {
      campaign_id: campaignId,
      event_type: eventType,
      metadata: pending.metadata,
    },
  }).then(({ error }) => {
    if (!error) dropPendingEvent(pending);
  }).catch((e) => console.warn(`push-track ${eventType} failed`, e));
}

export function getPushInstallId() { return getInstallId(); }

/**
 * Rede de segurança para a métrica de abertura.
 *
 * O `send-push` carimba `?_pc=<campaign_id>` na URL de destino. Se o evento
 * nativo `pushNotificationActionPerformed` não chegar (ex.: aparelho/versão
 * antiga sem o fix de cold start na MainActivity), ainda assim registramos a
 * abertura ao entrar na rota. O `push-track` deduplica por install_id, então
 * não há contagem em dobro quando os dois caminhos funcionam.
 */
export function trackPushOpenFromUrl() {
  if (typeof window === 'undefined') return;
  try {
    const params = new URLSearchParams(window.location.search);
    const campaignId = params.get('_pc');
    if (!campaignId) return;
    trackPush(campaignId, 'opened', { source: 'url_param', url: window.location.pathname });
    params.delete('_pc');
    const clean =
      window.location.pathname +
      (params.toString() ? `?${params.toString()}` : '') +
      window.location.hash;
    window.history.replaceState({}, '', clean);
  } catch { /* métrica nunca quebra o app */ }
}

/**
 * Anexa os listeners de push o mais cedo possível no boot (fora do ciclo do
 * React). O Capacitor retém `pushNotificationActionPerformed` até haver um
 * listener, mas quanto antes registrarmos, menor a chance de o usuário fechar
 * o app antes de o evento ser consumido e enviado.
 */
export function bootstrapNativePush() {
  trackPushOpenFromUrl();
  if (!Capacitor.isNativePlatform()) return;
  void ensureNativePushListeners();
}

type RegisterResult = {
  ok: boolean;
  reason?: string;
  token?: string;
};

let listenersReady: Promise<void> | null = null;
let waitingForRegistration: ((result: RegisterResult) => void) | null = null;

export const isNativePushAvailable = () => Capacitor.isNativePlatform();

export async function saveNativePushToken(token?: string): Promise<RegisterResult> {
  if (!token) return { ok: false, reason: 'empty_token' };

  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user?.id;

  if (!userId) {
    window.localStorage.setItem(PENDING_TOKEN_KEY, token);
    return { ok: false, reason: 'waiting_for_login', token };
  }

  const platform = Capacitor.getPlatform() as 'android' | 'ios' | 'web';
  const { error } = await supabase.from('device_tokens').upsert(
    // Reativa o token caso tenha sido marcado como invalidado (reinstalação)
    { user_id: userId, token, platform, invalidated_at: null, invalid_reason: null },
    { onConflict: 'token' },
  );

  if (error) {
    console.warn('Push token save failed', error);
    return { ok: false, reason: error.message, token };
  }

  if (window.localStorage.getItem(PENDING_TOKEN_KEY) === token) {
    window.localStorage.removeItem(PENDING_TOKEN_KEY);
  }

  return { ok: true, token };
}

export async function flushPendingNativePushToken(): Promise<RegisterResult> {
  const pending = window.localStorage.getItem(PENDING_TOKEN_KEY);
  if (!pending) return { ok: false, reason: 'no_pending_token' };
  return saveNativePushToken(pending);
}

export async function ensureNativePushListeners() {
  if (!Capacitor.isNativePlatform()) return;
  if (listenersReady) return listenersReady;

  listenersReady = (async () => {
    await FirebaseMessaging.addListener('tokenReceived', async (event) => {
      const result = await saveNativePushToken(event.token);
      waitingForRegistration?.({ ...result, token: event.token });
      waitingForRegistration = null;
    });

    // Toque na notificação (app em background/fechado ou aberto)
    await FirebaseMessaging.addListener('notificationActionPerformed', (event) => {
      const notif = event.notification;
      const data = (notif?.data ?? {}) as Record<string, string>;
      const actionId = event.actionId; // Ex: 'read_now', 'dismiss'
      
      const url = data.url;
      const campaignId = data.campaign_id;

      // Registra o clique pra métrica de "aberturas"
      if (campaignId) {
        trackPush(campaignId, 'opened', { url: url || null, source: 'action' });
      }

      if (url) {
        try {
          if (/^https?:\/\//i.test(url)) {
            window.location.href = url;
            if (campaignId) trackPush(campaignId, 'converted', { url });
          } else {
            const path = url.startsWith('/') ? url : `/${url}`;
            // Salva globalmente para caso o App.tsx ainda não tenha montado (Cold Start)
            (window as any)._pendingPushUrl = path;
            
            // Dispara evento — App.tsx escuta e usa react-router `navigate()`
            // para evitar reload completo quando o app já está aberto.
            window.dispatchEvent(new CustomEvent('direitoprime:push-navigate', { detail: { path } }));
            // Fallback: se ninguém tratar em 250ms, faz navegação hard.
            window.setTimeout(() => {
              const currentPathWithSearch = window.location.pathname + window.location.search;
              if (currentPathWithSearch !== path && (window as any)._pendingPushUrl) {
                window.location.assign(path);
              }
            }, 1500);
            // Convertido: navegou pra dentro do app
            if (campaignId) {
              window.setTimeout(() => trackPush(campaignId, 'converted', { url: path }), 500);
            }
          }
        } catch (e) {
          console.warn('Push navigation failed', e);
        }
      }
    });

    // Notificação chegou com app aberto — mostramos nosso Popup In-App customizado
    await FirebaseMessaging.addListener('notificationReceived', async (event) => {
      const notif = event.notification;
      const data = (notif.data ?? {}) as Record<string, string>;
      const campaignId = data.campaign_id;

      if (campaignId) {
        trackPush(campaignId, 'delivered', { foreground: true });
      }

      try {
        const { useInAppPushStore } = await import('@/store/inAppPushStore');
        useInAppPushStore.getState().showPush({
          title: notif.title ?? data.title ?? 'OAB na Risca',
          body: notif.body ?? data.body ?? '',
          imageUrl: data.image || (notif as any).image,
          actionUrl: data.url,
        });
      } catch (e) {
        console.warn('Foreground push display failed', e);
      }
    });

    // Cold-start recovery: quando o app abre a partir de uma notificação
    // (killed → foreground), o evento costuma disparar antes do listener anexar. 
    try {
      const { notifications } = await FirebaseMessaging.getDeliveredNotifications();
      for (const n of notifications ?? []) {
        const data = ((n as any).data ?? {}) as Record<string, string>;
        const campaignId = data.campaign_id;
        if (campaignId) {
          trackPush(campaignId, 'opened', { source: 'cold_start_recovery' });
        }
      }
    } catch (e) {
      console.warn('cold-start push recovery failed', e);
    }

    // Reenvia eventos que ficaram pendentes em execuções anteriores.
    flushPendingPushEvents();
  })();

  return listenersReady;
}

export async function registerNativePushToken(timeoutMs = 5000): Promise<RegisterResult> {
  if (!Capacitor.isNativePlatform()) return { ok: false, reason: 'not_native_app' };

  await ensureNativePushListeners();
  await flushPendingNativePushToken();

  let permission = await FirebaseMessaging.checkPermissions();
  if (permission.receive === 'prompt' || permission.receive === 'prompt-with-rationale') {
    permission = await FirebaseMessaging.requestPermissions();
  }

  if (permission.receive !== 'granted') {
    return { ok: false, reason: 'permission_not_granted' };
  }

  // Cria canais Android com sons personalizados por perfil (estudante/concurseiro/advogado)
  await configurarCanaisDeNotificacao();

  const registration = new Promise<RegisterResult>((resolve) => {
    waitingForRegistration = resolve;
    window.setTimeout(() => {
      if (waitingForRegistration === resolve) {
        waitingForRegistration = null;
        resolve({ ok: false, reason: 'registration_timeout' });
      }
    }, timeoutMs);
  });

  try {
    const { token } = await FirebaseMessaging.getToken();
    const result = await saveNativePushToken(token);
    
    // Resolve o timeout
    if (waitingForRegistration) {
      waitingForRegistration(result);
      waitingForRegistration = null;
    }
    return result;
  } catch (e: any) {
    if (waitingForRegistration) {
      waitingForRegistration({ ok: false, reason: e?.message });
      waitingForRegistration = null;
    }
    return { ok: false, reason: e?.message };
  }
}

// Bônus: Suporte a Tópicos (Firebase Messaging)
export async function subscribeToTopic(topicName: string) {
  if (!Capacitor.isNativePlatform()) return;
  try { await FirebaseMessaging.subscribeToTopic({ topic: topicName }); } catch (e) { console.warn(e); }
}

export async function unsubscribeFromTopic(topicName: string) {
  if (!Capacitor.isNativePlatform()) return;
  try { await FirebaseMessaging.unsubscribeFromTopic({ topic: topicName }); } catch (e) { console.warn(e); }
}