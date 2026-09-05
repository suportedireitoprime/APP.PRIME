export type LocalRow = {
  user_id: string;
  product_id: string | null;
  base_plan_id: string | null;
  purchase_token: string | null;
  order_id: string | null;
  status: string;
  auto_renewing: boolean | null;
  start_time: string | null;
  expires_at: string | null;
  cancel_reason: string | null;
  updated_at: string | null;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  is_test: boolean;
};

export type LegacySubscriber = {
  id: string;
  email: string;
  nome: string | null;
  tipo: string;
  asaas_customer_id: string | null;
  asaas_subscription_id: string | null;
  expires_at: string | null;
  status: string;
  created_at: string;
  observacao?: string | null;
};

export type CombinedRow = {
  id: string;
  source: 'play' | 'asaas' | 'old' | 'apple';
  email: string | null;
  display_name: string | null;
  product_id: string | null;
  order_id: string | null;
  status: string;
  is_test: boolean;
  avatar_url: string | null;
  start_time: string | null;
  expires_at: string | null;
  observacao?: string | null;
  raw?: any;
};

export type Row = CombinedRow;

export type RevenueUser = CombinedRow & { value: number; plan: string };

export type RevenueData = {
  mrr: number;
  arr: number;
  paying: number;
  avgTicket: number;
  lifetimeGross: number;
  byPlan: Array<{ plan: string; count: number; mrr: number; gross: number }>;
  mrrUsers: RevenueUser[];
  grossUsers: RevenueUser[];
};

export type Metrics = {
  ativosHoje: number;
  novos7: number;
  cancelados7: number;
  renovacoes30: number;
  timeline: { date: string; label: string; ativos: number; novos: number; cancelados: number; renovacoes: number }[];
};

export type SyncInfo = {
  checked?: number;
  updated?: number;
  errors?: { status: number; message: string }[];
  lastSyncAt?: string;
  error?: string;
};

export type Payload = {
  sync: SyncInfo | null;
  local: {
    rows: LocalRow[];
    stats: { total: number; active: number; test: number; byPlan: Record<string, number> };
    metrics: Metrics;
  };
  legacy: LegacySubscriber[];
  funnel: any[];
  packageName: string;
  serviceAccountEmail: string | null;
};

export const PRICE_TABLE: Record<string, { monthly: number; sticker: number; period: 'mensal' | 'anual' | 'semestral' | 'vitalicio' }> = {
  prime_premium_mensal: { monthly: 29.9, sticker: 29.9, period: 'mensal' },
  prime_premium_anual: { monthly: 199.9 / 12, sticker: 199.9, period: 'anual' },
  mensal: { monthly: 29.9, sticker: 29.9, period: 'mensal' },
  anual: { monthly: 199.9 / 12, sticker: 199.9, period: 'anual' },
  semestral: { monthly: 119.9 / 6, sticker: 119.9, period: 'semestral' },
  vitalicio: { monthly: 0, sticker: 299.9, period: 'vitalicio' },
};

export const priceFor = (productId: string | null) => {
  if (!productId) return null;
  return PRICE_TABLE[productId] ?? null;
};

export const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

export const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  SUBSCRIPTION_STATE_ACTIVE: { label: 'Ativa', cls: 'bg-emerald-500/15 text-emerald-500' },
  SUBSCRIPTION_STATE_IN_GRACE_PERIOD: { label: 'Em graça', cls: 'bg-amber-500/15 text-amber-500' },
  SUBSCRIPTION_STATE_ON_HOLD: { label: 'Em espera', cls: 'bg-orange-500/15 text-orange-500' },
  SUBSCRIPTION_STATE_PAUSED: { label: 'Pausada', cls: 'bg-slate-500/15 text-slate-400' },
  SUBSCRIPTION_STATE_CANCELED: { label: 'Cancelada', cls: 'bg-rose-500/15 text-rose-500' },
  SUBSCRIPTION_STATE_EXPIRED: { label: 'Expirada', cls: 'bg-muted text-muted-foreground' },
  SUBSCRIPTION_STATE_PENDING: { label: 'Pendente', cls: 'bg-blue-500/15 text-blue-500' },
  active: { label: 'Ativa', cls: 'bg-emerald-500/15 text-emerald-500' },
  inactive: { label: 'Cancelada', cls: 'bg-rose-500/15 text-rose-500' },
};

export const fmtDate = (iso: string | null) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
};

export const fmtDateTime = (iso: string | null) => {
  if (!iso) return '—';
  try {
    return new Date(iso)
      .toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
      .replace(',', ' às');
  } catch {
    return '—';
  }
};

export const parseObservacao = (obs: string | null) => {
  if (!obs) return null;
  try {
    return JSON.parse(obs);
  } catch {
    return null;
  }
};

export const EMPTY_METRICS: Metrics = { ativosHoje: 0, novos7: 0, cancelados7: 0, renovacoes30: 0, timeline: [] };
