import { isAdminEmail } from '@/lib/adminEmails';

export type DevSimulationMode = 'premium' | 'free';

export const DEV_SIMULATION_STORAGE_KEY = 'direitoprime:dev_simulation_mode';
export const DEV_SIMULATION_EVENT = 'direitoprime:dev-simulation-change';

/**
 * Retorna se o e-mail atual tem permissão para utilizar o simulador de desenvolvedor.
 * Exclusivo para administradores / contas de desenvolvedor autorizadas (ex: wes@gmail.com).
 */
export function isDevSimulatorEligible(email?: string | null): boolean {
  if (!email) return false;
  return isAdminEmail(email);
}

/**
 * Obtém o modo de simulação atual.
 * - 'premium': Assinante Premium (Acesso total irrestrito)
 * - 'free': Não Assinante (Plano gratuito com cota de 10 itens por mês e travas ativas)
 */
export function getDevSimulationMode(): DevSimulationMode {
  if (typeof localStorage === 'undefined') return 'premium';
  try {
    const saved = localStorage.getItem(DEV_SIMULATION_STORAGE_KEY);
    if (saved === 'free' || saved === 'expired' || saved === 'new_user') {
      return 'free';
    }
    if (saved === 'premium') {
      return 'premium';
    }
  } catch {
    // fallback seguro
  }
  return 'premium';
}

/**
 * Altera o modo de simulação e dispara o evento global para atualização reativa a 0ms.
 */
export function setDevSimulationMode(mode: DevSimulationMode): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(DEV_SIMULATION_STORAGE_KEY, mode);
  } catch {
    // fallback seguro
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(DEV_SIMULATION_EVENT, { detail: { mode } })
    );
  }
}

/**
 * Helper para verificar se o usuário atual deve ter passe-livre incondicional de admin.
 * Se o desenvolvedor estiver simulando 'new_user' ou 'expired', o bypass incondicional
 * é temporariamente suspenso para que os bloqueios, contadores e telas reais possam ser validados.
 */
export function shouldBypassAsAdmin(email?: string | null): boolean {
  if (!isAdminEmail(email)) return false;
  const mode = getDevSimulationMode();
  return mode === 'premium';
}

/**
 * Retorna se a conta admin está simulando ativamente o modo Não Assinante (Free).
 */
export function isSimulatingExpired(email?: string | null): boolean {
  if (!isAdminEmail(email)) return false;
  return getDevSimulationMode() === 'free';
}

/**
 * Retorna o estado simulado de assinatura para administradores/contas dev conforme o modo selecionado.
 * Retorna null se o usuário não for elegível.
 */
export function getDevSimulatedSubscriptionState(email?: string | null): {
  isPremium: boolean;
  loading: boolean;
  plano: string | null;
  startedAt: string | null;
  expiresAt: string | null;
  source: 'play' | 'apple' | 'asaas' | null;
  status: string | null;
  isAdminOverride: boolean;
  isTrial: boolean;
} | null {
  if (!isAdminEmail(email)) return null;
  const mode = getDevSimulationMode();

  if (mode === 'free') {
    return {
      isPremium: false,
      loading: false,
      plano: null,
      startedAt: null,
      expiresAt: null,
      source: null,
      status: 'FREE_LIMITED',
      isAdminOverride: false,
      isTrial: false,
    };
  }

  // Padrão: 'premium'
  const startedAt = new Date();
  const expiresAt = new Date(startedAt);
  expiresAt.setFullYear(expiresAt.getFullYear() + 100);
  return {
    isPremium: true,
    loading: false,
    plano: 'vitalício',
    startedAt: startedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    source: 'play',
    status: 'SUBSCRIPTION_STATE_ACTIVE',
    isAdminOverride: true,
    isTrial: false,
  };
}

/**
 * Metadados descritivos dos 2 modos para renderização na interface.
 */
export const DEV_SIMULATION_INFO = {
  premium: {
    id: 'premium' as const,
    name: 'Assinante Premium',
    badge: 'PREMIUM',
    badgeClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    description: 'Acesso vitalício irrestrito. Sem travas ou paywalls.',
    tag: 'Acesso Total',
  },
  free: {
    id: 'free' as const,
    name: 'Não Assinante',
    badge: 'NÃO ASSINANTE',
    badgeClass: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    description: "Acesso limitado por cota: 10 acessos por mês e travas ativas.",
    tag: 'Modo Gratuito',
  },
} as const;


