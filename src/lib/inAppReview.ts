/**
 * In-App Review orchestrator.
 *
 * Rules:
 *  - Only fires on native platform.
 *  - Requires either 5+ tracked positive events OR 7+ days since first open.
 *  - Cooldown: at most once per 90 days.
 *  - Immediate memory lock preventing concurrent double triggers.
 *
 * Call `trackReviewEvent()` after high-satisfaction moments
 * (finished simulado ≥ 60%, long reading session, quiz completed).
 */
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { logDb } from './appEvents';

const K_LAST_SHOWN = 'iar_last_shown_ts';
const K_EVENT_COUNT = 'iar_event_count';
const K_FIRST_OPEN = 'iar_first_open_ts';
const K_OPEN_COUNT = 'iar_open_count';
const K_PROMPTED = 'iar_prompted_ts';

const MIN_DAYS_BETWEEN_PROMPTS = 90;
const MIN_POSITIVE_EVENTS = 5;
const MIN_DAYS_SINCE_INSTALL = 7;
const DAY_MS = 86_400_000;

// Trava síncrona em memória contra concorrência e condições de corrida
let isReviewInFlight = false;
let memoryHasPrompted: boolean | null = null;

async function get(key: string): Promise<string | null> {
  try {
    const { value } = await Preferences.get({ key });
    return value ?? null;
  } catch {
    return null;
  }
}

async function set(key: string, value: string): Promise<void> {
  try {
    await Preferences.set({ key, value });
  } catch {
    /* noop */
  }
}

/** Seed the first-open timestamp at app boot. */
export async function seedFirstOpen(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const existing = await get(K_FIRST_OPEN);
  if (!existing) await set(K_FIRST_OPEN, String(Date.now()));
}

/**
 * Já mostramos o prompt nativo de avaliação alguma vez?
 * As lojas (Play e StoreKit) não devolvem se a pessoa realmente avaliou,
 * então usamos a marca local de "prompt exibido" como proxy.
 */
export async function hasRated(): Promise<boolean> {
  if (memoryHasPrompted === true) return true;
  const v = await get(K_PROMPTED);
  if (v) {
    memoryHasPrompted = true;
    return true;
  }
  return false;
}

async function markPrompted(source = 'unknown'): Promise<void> {
  const now = String(Date.now());
  memoryHasPrompted = true;
  logDb('avaliacao_prompt_exibido', {
    source,
    platform: Capacitor.getPlatform(),
  });
  await set(K_PROMPTED, now);
  await set(K_LAST_SHOWN, now);
}

/**
 * Dispara o prompt nativo (Play In-App Review no Android,
 * SKStoreReviewController/AppStore.requestReview no iOS).
 * Retorna true se a chamada nativa foi feita com sucesso.
 */
export async function requestReviewNow(source = 'manual'): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  // 1. Bloqueio imediato em memória contra disparos concorrentes
  if (isReviewInFlight || memoryHasPrompted) return false;

  // 2. Checa se já avaliou no storage persistente
  const alreadyRated = await hasRated();
  if (alreadyRated) return false;

  // 3. Trava de cooldown (mínimo de 90 dias entre prompts)
  const lastShown = await get(K_LAST_SHOWN);
  const now = Date.now();
  if (lastShown && now - Number(lastShown) < MIN_DAYS_BETWEEN_PROMPTS * DAY_MS) {
    return false;
  }

  isReviewInFlight = true;
  // Bloqueio otimista imediato em memória para anular qualquer timer concorrente nos próximos ms
  memoryHasPrompted = true;

  try {
    const { InAppReview } = await import('@capacitor-community/in-app-review');
    await InAppReview.requestReview();
    await markPrompted(source);
    return true;
  } catch (e: any) {
    // Se falhou (ex: sem Google Play Services), restaura para permitir nova tentativa
    memoryHasPrompted = false;
    console.warn('[InAppReview] request failed', e);
    logDb('avaliacao_prompt_erro', {
      source,
      platform: Capacitor.getPlatform(),
      error: e?.message || String(e),
    });
    return false;
  } finally {
    isReviewInFlight = false;
  }
}

/** Incrementa o contador de aberturas do app e retorna o novo valor. Evita contar duas vezes na mesma sessão. */
export async function trackAppOpen(): Promise<number> {
  if (!Capacitor.isNativePlatform()) return 0;
  
  if (typeof window !== 'undefined' && window.sessionStorage.getItem('app_open_tracked')) {
    const raw = await get(K_OPEN_COUNT);
    return raw ? Number(raw) : 1;
  }

  const raw = await get(K_OPEN_COUNT);
  const n = (raw ? Number(raw) : 0) + 1;
  await set(K_OPEN_COUNT, String(n));
  
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem('app_open_tracked', '1');
  }
  
  return n;
}

/**
 * Na SEGUNDA abertura do app (ou depois, se ainda não pedimos),
 * mostra o prompt nativo de avaliação. No-op na web e se já mostramos antes.
 */
export async function maybeRequestOnSecondOpen(delayMs = 3500): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const opens = await trackAppOpen();
  if (await hasRated()) return;

  if (opens === 2) {
    setTimeout(() => { void requestReviewNow('second_open'); }, delayMs);
  }
}

/**
 * Retorna true se ainda não avaliou.
 */
export async function checkHorusAvaliacaoEligibility(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  if (await hasRated()) return false;
  return true;
}

/** Prompt pós-compra — só aparece se a pessoa ainda não avaliou. */
export async function maybeRequestAfterPurchase(delayMs = 1500): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (await hasRated()) return;
  setTimeout(() => { void requestReviewNow('after_purchase'); }, delayMs);
}

/** Increment the positive-event counter and try to prompt. */
export async function trackReviewEvent(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const raw = await get(K_EVENT_COUNT);
  const n = raw ? Number(raw) + 1 : 1;
  await set(K_EVENT_COUNT, String(n));
  await maybeRequestReview('engagement_event');
}

/** Attempt to show the native review dialog if all conditions met. */
export async function maybeRequestReview(source = 'engagement_event'): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (memoryHasPrompted || isReviewInFlight) return;

  try {
    const [lastShown, count, firstOpen] = await Promise.all([
      get(K_LAST_SHOWN),
      get(K_EVENT_COUNT),
      get(K_FIRST_OPEN),
    ]);
    const now = Date.now();

    if (lastShown && now - Number(lastShown) < MIN_DAYS_BETWEEN_PROMPTS * DAY_MS) return;

    const events = count ? Number(count) : 0;
    const daysSinceInstall = firstOpen ? (now - Number(firstOpen)) / DAY_MS : 0;

    const eligibleByEvents = events >= MIN_POSITIVE_EVENTS;
    const eligibleByTime = daysSinceInstall >= MIN_DAYS_SINCE_INSTALL;
    if (!eligibleByEvents && !eligibleByTime) return;

    await requestReviewNow(source);
  } catch (e: any) {
    console.warn('[InAppReview] request skipped', e);
  }
}
