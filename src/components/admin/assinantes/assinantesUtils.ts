import type { PaymentMethodType, SubscriberPlanType } from '@/types/admin-subscribers';

export function parseDateSafe(raw?: string | null): Date | null {
  if (!raw) return null;
  const str = String(raw).trim();
  const dateOnlyMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, y, m, d] = dateOnlyMatch;
    return new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
  }
  const cleaned = str.replace(' ', 'T');
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? null : d;
}

export function formatarDataHora(iso?: string | null): string {
  const d = parseDateSafe(iso);
  if (!d) return '—';
  const rawStr = String(iso || '');
  const hasTime = rawStr.includes(':') || rawStr.includes('T');
  const dataStr = d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  if (!hasTime) return dataStr;
  const horaStr = d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  if (horaStr === '00:00' && !rawStr.includes(':')) {
    return dataStr;
  }
  return `${dataStr} às ${horaStr}`;
}

export function formatarExpiracao(modalidade: SubscriberPlanType, expiresAt?: string | null): string {
  if (modalidade === 'vitalicio') {
    return 'Vitalício · Sem expiração';
  }
  const d = parseDateSafe(expiresAt);
  if (!d) return 'Renovação contínua';
  return (
    'Próxima cobrança: ' +
    d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  );
}

export function normalizarFormaPagamento(
  billingType?: string | null,
  plano?: string | null,
  origem?: string | null,
): PaymentMethodType {
  const b = (billingType || '').toUpperCase();
  const p = (plano || '').toLowerCase();
  const o = (origem || '').toLowerCase();

  if (b === 'PIX' || p.includes('pix') || o === 'pix') return 'PIX';
  if (b === 'CREDIT_CARD' || p.includes('cartao') || p.includes('card') || o === 'cartao') return 'CREDIT_CARD';
  if (b === 'BOLETO' || p.includes('boleto')) return 'BOLETO';
  return 'OUTRO';
}

export function normalizarStatus(status?: string | null): {
  label: string;
  badgeColor: 'emerald' | 'amber' | 'rose' | 'sky' | 'slate';
} {
  const s = (status || '').toUpperCase().trim();
  if (
    s === 'ACTIVE' ||
    s === 'ATIVO' ||
    s === 'CONFIRMED' ||
    s === 'RECEIVED' ||
    s === 'PAGA' ||
    s === 'RECEIVED_IN_CASH'
  ) {
    return { label: 'Ativa', badgeColor: 'emerald' };
  }
  if (s === 'ACTIVE_GRACE' || s === 'GRACE_PERIOD') {
    return { label: 'Período de Graça', badgeColor: 'amber' };
  }
  if (s === 'OVERDUE' || s === 'ATRASADA' || s === 'INADIMPLENTE') {
    return { label: 'Atrasada', badgeColor: 'amber' };
  }
  if (s === 'CANCELLED' || s === 'CANCELED' || s === 'CANCELADA' || s === 'INACTIVE' || s === 'EXPIRED') {
    return { label: 'Cancelada', badgeColor: 'rose' };
  }
  if (s === 'PENDING' || s === 'PENDENTE' || s === 'AGUARDANDO') {
    return { label: 'Pendente', badgeColor: 'sky' };
  }
  return { label: s || 'Ativa', badgeColor: 'slate' };
}
