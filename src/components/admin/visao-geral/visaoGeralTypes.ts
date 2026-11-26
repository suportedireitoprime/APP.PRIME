export type CardId = 'online5m' | 'online' | 'cadastros' | 'paywall' | 'viu_planos' | 'trial' | 'renovou';
export type PeriodoId = 'hoje' | 'ontem' | '7d' | '30d';

export interface CheckoutLogItem {
  event_name: string;
  created_at: string;
  erro?: string;
  plano?: string;
  payment_id?: string;
  billingType?: string;
  valor?: number;
  pixStatus?: 'pago' | 'nao_pago' | 'pendente';
  cep?: string;
  cidade?: string;
  uf?: string;
}

export interface Row {
  key: string;
  title: string;
  subtitle?: string | null;
  meta?: string | null;
  userId?: string | null;
  email?: string | null;
  provider?: string | null;
  acessos?: number | null;
  tempo_tela?: number | null;
  avatarUrl?: string | null;
  isPremium?: boolean;
  is_premium?: boolean;
  isAdmin?: boolean;
  funcaoPreferida?: string | null;
  planValue?: number;
  planTag?: { plano: string; status: string; expires_at: string | null };
  googleId?: string | null;
  created_at?: string | null;
  faixaEtaria?: string | null;
  checkoutStatus?: 'pago' | 'recusado' | 'enviando' | 'etapa2_parou' | 'desistiu_inicio';
  checkoutStatusLabel?: string;
  checkoutDetalhes?: string;
  logsCheckout?: CheckoutLogItem[];
}

export type CountsState = Record<
  CardId | 'trialValor' | 'renovouValor' | 'checkoutPago' | 'checkoutRecusado' | 'checkoutEtapa2' | 'checkoutDesistiu',
  number
>;

export type Seen = { count: number; keys: string[] };

export interface TotaisPaisItem {
  pais: string;
  total: number;
}

export interface TotaisData {
  error?: string;
  total?: number;
  hoje?: number;
  d7?: number;
  d30?: number;
  premium?: number;
  com_telefone?: number;
  onboarding?: number;
  providers?: Record<string, number>;
  paises?: TotaisPaisItem[];
}

export const CARD_TITLES: Record<CardId, string> = {
  online5m: 'Online (Últimos 5 min)',
  online: 'Online',
  cadastros: 'Cadastrados',
  paywall: 'Entraram em Assinaturas',
  viu_planos: 'Abriram Checkout',
  trial: 'Assinaram',
  renovou: 'Renovaram (Mensal)',
};
