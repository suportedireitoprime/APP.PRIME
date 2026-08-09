/**
 * Contador (badge) no ícone do app — lembretes/flashcards pendentes.
 * Silencioso na web.
 */
import { Capacitor } from '@capacitor/core';

const isNative = () => Capacitor.isNativePlatform();

async function getPlugin() {
  if (!isNative()) return null;
  try {
    const mod = await import('@capawesome/capacitor-badge');
    return mod;
  } catch {
    return null;
  }
}

export async function definirBadge(count: number): Promise<void> {
  const mod = await getPlugin();
  if (!mod) return;
  try {
    const Badge = mod.Badge;
    const { isSupported } = await Badge.isSupported();
    if (!isSupported) return;
    // iOS exige permissão de notificação para exibir o badge.
    const perm = await Badge.checkPermissions();
    if (perm.display !== 'granted') {
      const pedida = await Badge.requestPermissions();
      if (pedida.display !== 'granted') return;
    }
    await Badge.set({ count: Math.max(0, Math.floor(count)) });
  } catch {
    /* noop */
  }
}

export async function limparBadge(): Promise<void> {
  const mod = await getPlugin();
  if (!mod) return;
  try {
    await mod.Badge.clear();
  } catch {
    /* noop */
  }
}

export async function aumentarBadge(): Promise<void> {
  const mod = await getPlugin();
  if (!mod) return;
  try {
    await mod.Badge.increase();
  } catch {
    /* noop */
  }
}
