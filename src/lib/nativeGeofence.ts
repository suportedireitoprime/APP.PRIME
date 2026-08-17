// Geofence caseiro usando @capacitor/geolocation em foreground (funciona em web também)
// e @capacitor-community/background-geolocation para continuar rodando com o app
// fechado / em segundo plano (Android usa foreground service, iOS Significant
// Location Changes).
//
// Regras:
// - O lembrete só dispara na TRANSIÇÃO fora→dentro do raio (evita spam enquanto
//   a pessoa fica no local). Enquanto está dentro, apenas mantemos o "presence
//   banner" no topo do app e falamos "Você está no local" uma vez.
// - Debounce adicional de 10 min por lembrete pra caso de GPS oscilar na borda.

import { Capacitor, registerPlugin } from '@capacitor/core';

interface BackgroundGeolocationPlugin {
  addWatcher(
    options: {
      backgroundMessage?: string;
      backgroundTitle?: string;
      requestPermissions?: boolean;
      stale?: boolean;
      distanceFilter?: number;
    },
    callback: (location: { latitude: number; longitude: number } | null, error?: unknown) => void,
  ): Promise<string>;
  removeWatcher(options: { id: string }): Promise<void>;
}
const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>('BackgroundGeolocation');
import { supabase } from '@/integrations/supabase/client';
import { haversineMeters } from './nativeGeocoder';
import {
  showReminderOverlay,
  updateReminderOverlay,
  hideReminderOverlay,
} from './floatingReminder';

type Channel = 'push' | 'horus' | 'both';

export interface GeofenceReminder {
  id: string;
  label: string;
  address: string | null;
  lat: number;
  lng: number;
  radius_m: number;
  message: string;
  channel: Channel;
  last_triggered_at: string | null;
  origem?: string | null;
  target_route?: string | null;
}

let watchId: string | null = null;
let bgWatcherId: string | null = null;
let reminders: GeofenceReminder[] = [];
let currentDistanceFilter = 50;
const cooldownMs = 10 * 60 * 1000;
const localCooldown = new Map<string, number>();
const insideIds = new Set<string>();
const spokenOnce = new Set<string>();

type PresenceListener = (inside: GeofenceReminder[]) => void;
const presenceListeners = new Set<PresenceListener>();

function emitPresence() {
  const inside = reminders.filter(r => insideIds.has(r.id));
  presenceListeners.forEach(l => { try { l(inside); } catch {} });
}

export function subscribeGeofencePresence(cb: PresenceListener): () => void {
  presenceListeners.add(cb);
  cb(reminders.filter(r => insideIds.has(r.id)));
  return () => { presenceListeners.delete(cb); };
}

export function getGeofenceInside(): GeofenceReminder[] {
  return reminders.filter(r => insideIds.has(r.id));
}

const CACHE_KEY = 'vacatio-geofence-reminders';

function readCache(): GeofenceReminder[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as GeofenceReminder[]) : [];
  } catch { return []; }
}

function writeCache(list: GeofenceReminder[]) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(list)); } catch {}
}

async function syncNativeGeofences() {
  try {
    const { registerNativeGeofences, clearNativeGeofences } = await import('./nativeGeofencePlugin');
    if (!reminders.length) { await clearNativeGeofences(); return; }
    await registerNativeGeofences(reminders.map(r => ({
      id: r.id,
      lat: r.lat,
      lng: r.lng,
      radius: r.radius_m || 300,
      title: `📍 ${r.label}`,
      message: r.message,
    })));
  } catch (e) {
    console.warn('[geofence] sync nativo falhou', e);
  }
}

async function loadReminders(userId: string) {
  // Começa pelo cache local: garante monitoramento mesmo offline / sem sessão.
  if (!reminders.length) reminders = readCache();

  const { data, error } = await supabase
    .from('location_reminders')
    .select('id,label,address,lat,lng,radius_m,message,channel,last_triggered_at,origem,target_route')
    .eq('user_id', userId)
    .eq('active', true);

  if (!error && data) {
    reminders = data as GeofenceReminder[];
    writeCache(reminders);
  }

  // limpa insideIds pra remover lembretes que foram desativados/removidos
  for (const id of Array.from(insideIds)) {
    if (!reminders.find(r => r.id === id)) insideIds.delete(id);
  }
  emitPresence();
  void syncNativeGeofences();
}

// ---- Envio da última posição pro servidor (fallback por push do cron) -------
let lastUploaded: { lat: number; lng: number; at: number } | null = null;
const UPLOAD_MIN_DISTANCE_M = 200;
const UPLOAD_MIN_INTERVAL_MS = 5 * 60 * 1000;

async function uploadPosition(lat: number, lng: number, accuracy?: number) {
  try {
    if (lastUploaded) {
      const moved = haversineMeters({ lat, lng }, { lat: lastUploaded.lat, lng: lastUploaded.lng });
      const elapsed = Date.now() - lastUploaded.at;
      if (moved < UPLOAD_MIN_DISTANCE_M && elapsed < UPLOAD_MIN_INTERVAL_MS) return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    if (!uid) return;
    lastUploaded = { lat, lng, at: Date.now() };
    await supabase.from('user_last_location').upsert({
      user_id: uid,
      lat,
      lng,
      accuracy_m: accuracy ?? null,
      source: Capacitor.isNativePlatform() ? 'app_native' : 'web',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  } catch (e) {
    console.warn('[geofence] upload posição falhou', e);
  }
}


async function firePush(r: GeofenceReminder) {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.schedule({
      notifications: [{
        id: 92000 + Math.abs(hashCode(r.id) % 1000),
        title: `📍 ${r.label}`,
        body: r.message,
        smallIcon: 'ic_stat_icon_config_sample',
        iconColor: '#c94c4c',
        channelId: 'alertas_urgentes',
      }],
    });
  } catch (e) {
    console.warn('[geofence] push falhou', e);
  }
}

async function fireHorus(r: GeofenceReminder) {
  try {
    await supabase.functions.invoke('location-reminder-horus', {
      body: { label: r.label, message: r.message, address: r.address },
    });
  } catch (e) {
    console.warn('[geofence] horus falhou', e);
  }
}

function speakArrived(label: string) {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(`Você está no local: ${label}`);
    u.lang = 'pt-BR';
    u.rate = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {}
}

async function fireReminder(r: GeofenceReminder, opts?: { force?: boolean }) {
  if (!opts?.force) {
    const lastLocal = localCooldown.get(r.id) ?? 0;
    if (Date.now() - lastLocal < cooldownMs) return;
  }
  localCooldown.set(r.id, Date.now());

  try {
    window.dispatchEvent(new CustomEvent('lembrete-in-app', {
      detail: {
        titulo: `📍 ${r.label}`,
        mensagem: r.message,
        route: r.target_route || (r.origem === 'questoes' ? '/questoes/praticar' : null),
      },
    }));
  } catch {}

  const ch = (r.channel ?? 'push') as Channel;
  const tasks: Promise<void>[] = [];
  if (ch === 'push' || ch === 'both') tasks.push(firePush(r));
  if (ch === 'horus' || ch === 'both') tasks.push(fireHorus(r));
  await Promise.allSettled(tasks);

  try {
    await supabase
      .from('location_reminders')
      .update({ last_triggered_at: new Date().toISOString() })
      .eq('id', r.id);
  } catch (e) {
    console.warn('[geofence] update last_triggered_at falhou', e);
  }
}

function hashCode(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}

// ---- Card flutuante (Android) / Live Activity (iOS) ------------------------
// Aparece quando a pessoa está se aproximando do local (dentro da "zona de
// aproximação") e vai atualizando a distância em tempo real.
const APPROACH_MIN_M = 1200;
const overlayShown = new Set<string>();

function approachRadius(r: GeofenceReminder) {
  return Math.max(APPROACH_MIN_M, (r.radius_m || 300) * 3);
}

function overlayRoute(r: GeofenceReminder) {
  return r.target_route || (r.origem === 'questoes' ? '/questoes/praticar' : '/lembretes/local');
}

function syncOverlay(r: GeofenceReminder, dist: number, inside: boolean) {
  const inZone = dist <= approachRadius(r);
  if (!inZone) {
    if (overlayShown.has(r.id)) {
      overlayShown.delete(r.id);
      void hideReminderOverlay(r.id);
    }
    return;
  }
  const subtitulo = inside ? r.message : `Você está chegando em ${r.label}`;
  if (!overlayShown.has(r.id)) {
    overlayShown.add(r.id);
    void showReminderOverlay({
      id: r.id,
      titulo: `📍 ${r.label}`,
      subtitulo,
      distanciaM: dist,
      deepLink: overlayRoute(r),
    });
  } else {
    void updateReminderOverlay(r.id, { subtitulo, distanciaM: dist });
  }
}

function checkPosition(lat: number, lng: number, accuracy?: number) {
  let changed = false;
  let nearestDist = Infinity;
  for (const r of reminders) {
    const dist = haversineMeters({ lat, lng }, { lat: r.lat, lng: r.lng });
    if (dist < nearestDist) nearestDist = dist;
    const wasInside = insideIds.has(r.id);
    const nowInside = dist <= r.radius_m;
    syncOverlay(r, dist, nowInside);
    if (nowInside && !wasInside) {
      // transição fora → dentro: dispara + fala
      insideIds.add(r.id);
      changed = true;
      speakArrived(r.label);
      spokenOnce.add(r.id);
      fireReminder(r);
    } else if (!nowInside && wasInside) {
      // saiu do raio: libera cooldown pra próximo retorno já disparar
      insideIds.delete(r.id);
      spokenOnce.delete(r.id);
      localCooldown.delete(r.id);
      changed = true;
    }
  }
  if (changed) emitPresence();

  // Alimenta o fallback do servidor (cron dispara o push mesmo com o app morto).
  void uploadPosition(lat, lng, accuracy);

  // Economia de bateria: longe de qualquer lembrete, exige deslocamentos maiores.
  const desired = nearestDist > 3000 ? 500 : nearestDist > 1000 ? 200 : 50;
  if (desired !== currentDistanceFilter) {
    currentDistanceFilter = desired;
    void restartBackgroundWatcher();
  }
}

async function startForegroundWatcher() {
  try {
    const { Geolocation } = await import('@capacitor/geolocation');
    const perm = await Geolocation.checkPermissions();
    if (perm.location !== 'granted') {
      const req = await Geolocation.requestPermissions();
      if (req.location !== 'granted') return;
    }
    if (watchId) return;
    watchId = await Geolocation.watchPosition(
      { enableHighAccuracy: false, timeout: 30000, maximumAge: 60000 },
      (pos) => {
        if (!pos) return;
        checkPosition(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
      },
    );
  } catch (e) {
    console.warn('[geofence] foreground watch falhou', e);
  }
}

async function startBackgroundWatcher() {
  if (!Capacitor.isNativePlatform()) return;
  if (bgWatcherId) return;
  try {
    bgWatcherId = await BackgroundGeolocation.addWatcher(
      {
        backgroundMessage: 'Avisamos quando você chegar nos seus locais.',
        backgroundTitle: 'Lembretes por local ativos',
        requestPermissions: true,
        stale: false,
        distanceFilter: currentDistanceFilter,
      },
      (location, error) => {
        if (error) {
          console.warn('[geofence-bg]', error);
          return;
        }
        if (!location) return;
        checkPosition(location.latitude, location.longitude);
      },
    );
  } catch (e) {
    console.warn('[geofence] background watch falhou', e);
  }
}

async function restartBackgroundWatcher() {
  if (!bgWatcherId) return;
  try { await BackgroundGeolocation.removeWatcher({ id: bgWatcherId }); } catch {}
  bgWatcherId = null;
  await startBackgroundWatcher();
}

/** Consome os disparos que o receiver nativo registrou com o app fechado. */
async function drainNativeEvents() {
  try {
    const { drainNativeGeofenceEvents } = await import('./nativeGeofencePlugin');
    const events = await drainNativeGeofenceEvents();
    for (const ev of events) {
      const r = reminders.find(x => x.id === ev.id);
      if (!r) continue;
      localCooldown.set(r.id, ev.at || Date.now());
      try {
        await supabase.from('location_reminders')
          .update({ last_triggered_at: new Date(ev.at || Date.now()).toISOString() })
          .eq('id', r.id);
      } catch {}
    }
  } catch {}
}

let resumeHooked = false;
async function hookResume(userId: string) {
  if (resumeHooked || !Capacitor.isNativePlatform()) return;
  resumeHooked = true;
  try {
    const { App } = await import('@capacitor/app');
    App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) return;
      // Sistema pode ter matado o processo: religa watchers e consome eventos
      // que o receiver nativo gravou enquanto o app estava fechado.
      void (async () => {
        await loadReminders(userId);
        await drainNativeEvents();
        await startForegroundWatcher();
        await startBackgroundWatcher();
      })();
    });
  } catch {}
}

export async function startGeofenceWatcher(userId: string): Promise<void> {
  await loadReminders(userId);
  await hookResume(userId);
  // Mesmo sem lembretes carregados agora (offline, sessão fria), seguimos:
  // o cache local pode ter itens e o watcher se atualiza no próximo refresh.
  if (!reminders.length && !readCache().length) return;

  await drainNativeEvents();
  await startForegroundWatcher();
  await startBackgroundWatcher();
}

/** Status pra UI: o monitoramento em segundo plano está mesmo ligado? */
export async function getGeofenceStatus(): Promise<{
  foreground: boolean;
  background: boolean;
  nativeGeofence: boolean;
  reminders: number;
}> {
  let nativeGeofence = false;
  try {
    const { nativeGeofenceAvailable } = await import('./nativeGeofencePlugin');
    nativeGeofence = await nativeGeofenceAvailable();
  } catch {}
  return {
    foreground: !!watchId,
    background: !!bgWatcherId,
    nativeGeofence,
    reminders: reminders.length,
  };
}


export async function stopGeofenceWatcher(): Promise<void> {
  try {
    const { hideAllReminderOverlays } = await import('./floatingReminder');
    await hideAllReminderOverlays();
  } catch {}
  overlayShown.clear();
  if (watchId) {
    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      await Geolocation.clearWatch({ id: watchId });
    } catch {}
    watchId = null;
  }
  if (bgWatcherId) {
    try {
      await BackgroundGeolocation.removeWatcher({ id: bgWatcherId });
    } catch {}
    bgWatcherId = null;
  }
}

export async function refreshGeofenceReminders(userId: string): Promise<void> {
  await loadReminders(userId);
}

/**
 * Dispara manualmente o lembrete (botão "Testar" na UI). Ignora cooldown e
 * transição de entrada — simula exatamente como a notificação vai chegar.
 */
export async function triggerReminderNow(reminderId: string): Promise<boolean> {
  let r = reminders.find(x => x.id === reminderId);
  if (!r) {
    // pode ser um lembrete recém-criado ainda não carregado; busca direto.
    const { data } = await supabase
      .from('location_reminders')
      .select('id,label,address,lat,lng,radius_m,message,channel,last_triggered_at,origem,target_route')
      .eq('id', reminderId)
      .maybeSingle();
    if (!data) return false;
    r = data as GeofenceReminder;
  }
  await fireReminder(r, { force: true });
  return true;
}
