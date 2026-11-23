export type SubscriptionLayoutType = 'vitalicio_promocional' | 'padrao_3_planos';

const STORAGE_KEY = 'app_subscription_layout_mode_v1';

export function getSubscriptionLayout(): SubscriptionLayoutType {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val === 'vitalicio_promocional') return 'vitalicio_promocional';
    return 'padrao_3_planos';
  } catch {
    return 'padrao_3_planos';
  }
}

export function setSubscriptionLayout(layout: SubscriptionLayoutType) {
  try {
    localStorage.setItem(STORAGE_KEY, layout);
    window.dispatchEvent(new CustomEvent('app_subscription_layout_changed', { detail: layout }));
  } catch {}
}

/**
 * Calcula o tempo restante no ciclo infinito de 5 dias (escassez persuasiva contínua).
 * Sempre que atinge 0, o ciclo de 5 dias recomeça de forma transparente e contínua.
 */
export function getCycle5DaysCountdown(): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
} {
  const CYCLE_SECONDS = 5 * 24 * 60 * 60; // 5 dias = 432.000 segundos
  const nowSeconds = Math.floor(Date.now() / 1000);
  
  const elapsedInCycle = nowSeconds % CYCLE_SECONDS;
  const remainingSeconds = CYCLE_SECONDS - elapsedInCycle;
  
  const days = Math.floor(remainingSeconds / (24 * 3600));
  const hours = Math.floor((remainingSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  
  const formatted = `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  
  return { days, hours, minutes, seconds, formatted };
}
