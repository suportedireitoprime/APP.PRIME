/**
 * Firebase Analytics nativo (Android/iOS) — espelha os eventos do GA4 web.
 * No navegador tudo vira no-op: o GA4 web já cobre esse caso.
 */
import { Capacitor } from "@capacitor/core";

function isNative() {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
}

async function getPlugin() {
  if (!isNative()) return null;
  try {
    const mod = await import("@capacitor-firebase/analytics");
    return mod;
  } catch {
    return null;
  }
}

export async function nativeSetConsent(granted: boolean) {
  const mod = await getPlugin();
  if (!mod) return;
  const p = mod.FirebaseAnalytics;
  try {
    await p.setEnabled({ enabled: granted });
    await p.setConsent?.({
      // @ts-expect-error tipos variam entre versões do plugin
      consentType: "ANALYTICS_STORAGE",
      consentStatus: granted ? "GRANTED" : "DENIED",
    });
  } catch { /* noop */ }
}

export async function nativeSetUserId(userId: string | null) {
  const mod = await getPlugin();
  if (!mod) return;
  try { await mod.FirebaseAnalytics.setUserId({ userId }); } catch { /* noop */ }
}

export async function nativeLogEvent(name: string, params: Record<string, any> = {}) {
  const mod = await getPlugin();
  if (!mod) return;
  try { await mod.FirebaseAnalytics.logEvent({ name, params }); } catch { /* noop */ }
}

export async function nativeLogScreen(screenName: string) {
  const mod = await getPlugin();
  if (!mod) return;
  try { await mod.FirebaseAnalytics.setCurrentScreen({ screenName }); } catch { /* noop */ }
}

export async function nativeSetUserProperty(name: string, value: string) {
  const mod = await getPlugin();
  if (!mod) return;
  try {
    // @ts-expect-error tipos variam entre versões do plugin
    await mod.FirebaseAnalytics.setUserProperty?.({ name, value });
  } catch { /* noop */ }
}
