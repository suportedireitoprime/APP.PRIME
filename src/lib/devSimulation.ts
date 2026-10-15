import { isAdminEmail } from '@/lib/adminEmails';

export type DevSimulationMode = 'premium' | 'new_user' | 'expired';

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
 * - 'premium': Assinante Premium Vitalício (Acesso total)
 * - 'new_user': Recém-cadastrado (Degustação gratuita de 3 dias ativa)
 * - 'expired': 3 dias encerrados (Trial expirado / Modo Free com paywalls ativos)
 */
export function getDevSimulationMode(): DevSimulationMode {
  if (typeof localStorage === 'undefined') return 'premium';
  try {
    const saved = localStorage.getItem(DEV_SIMULATION_STORAGE_KEY);
    if (saved === 'new_user' || saved === 'expired' || saved === 'premium') {
      return saved;
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
 * Retorna se a conta admin está simulando ativamente o modo com trial expirado.
 */
export function isSimulatingExpired(email?: string | null): boolean {
  if (!isAdminEmail(email)) return false;
  return getDevSimulationMode() === 'expired';
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

  if (mode === 'new_user') {
    const now = Date.now();
    const startedAt = new Date(now - 2 * 60 * 60 * 1000).toISOString(); // criado há 2h
    const expiresAt = new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString(); // expira daqui a 3 dias
    return {
      isPremium: true,
      loading: false,
      plano: 'Teste de 3 Dias',
      startedAt,
      expiresAt,
      source: null,
      status: 'SUBSCRIPTION_STATE_ACTIVE',
      isAdminOverride: false,
      isTrial: true,
    };
  }

  if (mode === 'expired') {
    const now = Date.now();
    const startedAt = new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(); // criado há 4 dias
    const expiresAt = new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(); // expirou há 1 dia
    return {
      isPremium: false,
      loading: false,
      plano: null,
      startedAt,
      expiresAt,
      source: null,
      status: 'EXPIRED',
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
 * Metadados descritivos de cada modo para renderização na interface.
 */
export const DEV_SIMULATION_INFO = {
  premium: {
    id: 'premium' as const,
    name: 'Assinante Premium',
    badge: 'PREMIUM',
    badgeClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    description: 'Acesso vitalício completo liberado, sem bloqueios ou paywalls.',
    tag: 'Acesso Total',
  },
  new_user: {
    id: 'new_user' as const,
    name: 'Recém-cadastrado',
    badge: 'TRIAL 3 DIAS',
    badgeClass: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    description: 'Degustação gratuita ativa de 3 dias com contagem regressiva.',
    tag: 'Degustação Ativa',
  },
  expired: {
    id: 'expired' as const,
    name: '3 Dias Terminados',
    badge: 'EXPIRADO / FREE',
    badgeClass: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    description: 'Período encerrado. Bloqueios de paywall e limites do plano Free ativos.',
    tag: 'Modo Free / Bloqueado',
  },
} as const;

