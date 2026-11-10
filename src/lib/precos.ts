// Fonte única dos preços de assinatura.
export const PRECO_MENSAL = 29.9;
export const PRECO_ANUAL = 89.9;
export const PRECO_VITALICIO = 149.9;
export const MAX_PARCELAS_ANUAL = 6;
export const MAX_PARCELAS_VITALICIO = 6;

// Juros de parcelamento repassados ao cliente (taxa Asaas + antecipação), por nº de parcelas.
export const JUROS_PARCELA: Record<number, number> = {
  1: 0,
  2: 0.058,
  3: 0.083,
  4: 0.108,
  5: 0.133,
  6: 0.158,
};

export type PlanoCheckout = 'mensal' | 'mensal_pix' | 'anual' | 'anual_regular_pix' | 'vitalicio' | 'vitalicio_pix';
export const PLANOS_VALIDOS: PlanoCheckout[] = ['mensal', 'mensal_pix', 'anual', 'anual_regular_pix', 'vitalicio', 'vitalicio_pix'];

export const isVitalicio = (p: string | null | undefined) => p === 'vitalicio' || p === 'vitalicio_pix';
export const isAnual = (p: string | null | undefined) => p === 'anual' || p === 'anual_regular_pix';
export const isMensal = (p: string | null | undefined) => p === 'mensal' || p === 'mensal_pix';

export function precoBase(plano: string): number {
  if (!PLANOS_VALIDOS.includes(plano as PlanoCheckout)) throw new Error('Plano inválido');
  if (isVitalicio(plano)) return PRECO_VITALICIO;
  if (isAnual(plano)) return PRECO_ANUAL;
  return PRECO_MENSAL;
}

export function parcelamento(num: number, base = PRECO_ANUAL, maxParcelas = MAX_PARCELAS_ANUAL) {
  const n = Math.min(Math.max(1, Math.floor(num || 1)), maxParcelas);
  const total = Number((base * (1 + (JUROS_PARCELA[n] ?? 0))).toFixed(2));
  const parcela = Number((total / n).toFixed(2));
  return { parcelas: n, total, parcela };
}

export const brl = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;
