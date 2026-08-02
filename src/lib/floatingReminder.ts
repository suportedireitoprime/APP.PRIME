// Camada única para o "card flutuante" de lembretes.
//
// - Android: plugin nativo `FloatingReminder` desenha uma view por cima de
//   qualquer app (TYPE_APPLICATION_OVERLAY + foreground service). É o mesmo
//   efeito do card do 99/Uber.
// - iOS: plugin nativo `LiveActivity` (ActivityKit) mostra o card na tela de
//   bloqueio e na Ilha Dinâmica. Se o aparelho/build não suportar, vira no-op
//   e o app segue com a notificação normal + banner interno.
// - Web: no-op silencioso — quem cuida é o `ReminderInAppBanner`.
//
// O código nativo é injetado pelos workflows `.github/workflows/build-android.yml`
// e `.github/workflows/build-ios.yml`.

import { Capacitor, registerPlugin } from '@capacitor/core';

export interface ReminderOverlayInput {
  /** Identificador estável do lembrete (usado para atualizar/fechar). */
  id: string;
  titulo: string;
  subtitulo: string;
  /** Distância atual até o local, em metros (lembretes de geolocalização). */
  distanciaM?: number | null;
  /** Rota interna aberta pelo botão "Ir". Ex.: `/questoes/praticar`. */
  deepLink?: string | null;
}

interface FloatingReminderPlugin {
  show(options: {
    id: string;
    title: string;
    body: string;
    distanceText?: string;
    deepLink?: string;
  }): Promise<void>;
  update(options: { id: string; body?: string; distanceText?: string }): Promise<void>;
  hide(options: { id: string }): Promise<void>;
  hasPermission(): Promise<{ granted: boolean }>;
  requestPermission(): Promise<{ opened: boolean }>;
}

interface LiveActivityPlugin {
  start(options: {
    id: string;
    title: string;
    body: string;
    distanceText?: string;
    deepLink?: string;
  }): Promise<{ started: boolean }>;
  update(options: { id: string; body?: string; distanceText?: string }): Promise<void>;
  end(options: { id: string }): Promise<void>;
  isSupported(): Promise<{ supported: boolean }>;
}

const FloatingReminder = registerPlugin<FloatingReminderPlugin>('FloatingReminder');
const LiveActivity = registerPlugin<LiveActivityPlugin>('LiveActivity');

const PREF_KEY = 'ej-card-flutuante';

/** A pessoa quer o card flutuante? (default: sim) */
export function overlayEnabled(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) !== '0';
  } catch {
    return true;
  }
}

export function setOverlayEnabled(enabled: boolean) {
  try { localStorage.setItem(PREF_KEY, enabled ? '1' : '0'); } catch {}
  if (!enabled) void hideAllReminderOverlays();
}

function isAndroid(): boolean {
  return Capacitor.isNativePlatform()
    && Capacitor.getPlatform() === 'android'
    && Capacitor.isPluginAvailable('FloatingReminder');
}

function isIos(): boolean {
  return Capacitor.isNativePlatform()
    && Capacitor.getPlatform() === 'ios'
    && Capacitor.isPluginAvailable('LiveActivity');
}

export type OverlayKind = 'android-overlay' | 'ios-live-activity' | 'none';

export function overlayKind(): OverlayKind {
  if (isAndroid()) return 'android-overlay';
  if (isIos()) return 'ios-live-activity';
  return 'none';
}

export function formatDistance(m?: number | null): string | undefined {
  if (m == null || !Number.isFinite(m)) return undefined;
  if (m < 1000) return `${Math.max(0, Math.round(m / 10) * 10)} m`;
  return `${(m / 1000).toFixed(1).replace('.', ',')} km`;
}

/** Android: a permissão "exibir sobre outros apps" já está liberada? */
export async function overlayPermissionGranted(): Promise<boolean> {
  if (isIos()) {
    try { return !!(await LiveActivity.isSupported())?.supported; } catch { return false; }
  }
  if (!isAndroid()) return false;
  try { return !!(await FloatingReminder.hasPermission())?.granted; } catch { return false; }
}

/** Android: abre a tela do sistema para liberar a sobreposição. */
export async function requestOverlayPermission(): Promise<boolean> {
  if (!isAndroid()) return false;
  try { return !!(await FloatingReminder.requestPermission())?.opened; } catch { return false; }
}

const active = new Set<string>();

export async function showReminderOverlay(input: ReminderOverlayInput): Promise<boolean> {
  if (!overlayEnabled()) return false;
  const payload = {
    id: input.id,
    title: input.titulo,
    body: input.subtitulo,
    distanceText: formatDistance(input.distanciaM),
    deepLink: input.deepLink || undefined,
  };
  try {
    if (isAndroid()) {
      if (!(await overlayPermissionGranted())) return false;
      await FloatingReminder.show(payload);
      active.add(input.id);
      return true;
    }
    if (isIos()) {
      const res = await LiveActivity.start(payload);
      if (res?.started) active.add(input.id);
      return !!res?.started;
    }
  } catch (e) {
    console.warn('[overlay] show falhou', e);
  }
  return false;
}

export async function updateReminderOverlay(
  id: string,
  patch: { subtitulo?: string; distanciaM?: number | null },
): Promise<void> {
  if (!active.has(id)) return;
  const payload = {
    id,
    body: patch.subtitulo,
    distanceText: formatDistance(patch.distanciaM),
  };
  try {
    if (isAndroid()) await FloatingReminder.update(payload);
    else if (isIos()) await LiveActivity.update(payload);
  } catch (e) {
    console.warn('[overlay] update falhou', e);
  }
}

export async function hideReminderOverlay(id: string): Promise<void> {
  if (!active.has(id)) return;
  active.delete(id);
  try {
    if (isAndroid()) await FloatingReminder.hide({ id });
    else if (isIos()) await LiveActivity.end({ id });
  } catch (e) {
    console.warn('[overlay] hide falhou', e);
  }
}

export async function hideAllReminderOverlays(): Promise<void> {
  await Promise.allSettled(Array.from(active).map(id => hideReminderOverlay(id)));
}

export function overlayIsActive(id: string): boolean {
  return active.has(id);
}