import { describe, it, expect } from 'vitest';
import { isAnualAntigo } from '@/hooks/useSubscription';
import { PRECO_MENSAL, PRECO_ANUAL, PRECO_VITALICIO, brl } from '@/lib/precos';

function parseDateSafe(raw?: string | null): Date | null {
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

function formatarDataHora(iso?: string | null): string {
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

describe('Admin Assinantes - Regras de Classificação e Finanças', () => {
  it('deve classificar plano mensal com preço correto', () => {
    const plano = 'mensal';
    expect(PRECO_MENSAL).toBe(19.9);
    expect(brl(PRECO_MENSAL)).toBe('R$ 19,90');
    expect(isAnualAntigo(plano, '2026-11-10T12:00:00Z', null)).toBe(false);
  });

  it('deve classificar plano anual recente (>= 10/11/2026) como Anual normal', () => {
    const plano = 'anual';
    const startedAt = '2026-11-10T12:00:00Z';
    const expiresAt = '2027-11-10T12:00:00Z';
    expect(isAnualAntigo(plano, startedAt, expiresAt)).toBe(false);
    expect(PRECO_ANUAL).toBe(89.9);
    expect(brl(PRECO_ANUAL)).toBe('R$ 89,90');
  });

  it('deve promover plano anual antigo (< 10/11/2026) para Vitalício conforme regra oficial', () => {
    const plano = 'anual';
    const startedAt = '2026-11-05T10:00:00Z';
    const expiresAt = '2027-11-05T10:00:00Z';
    expect(isAnualAntigo(plano, startedAt, expiresAt)).toBe(true);
  });

  it('deve manter vitalício explícito como Vitalício independentemente da data', () => {
    const plano = 'vitalicio';
    expect(isAnualAntigo(plano, '2026-11-15T00:00:00Z', null)).toBe(false);
    expect(PRECO_VITALICIO).toBe(149.9);
    expect(brl(PRECO_VITALICIO)).toBe('R$ 149,90');
  });

  it('deve tratar adequadamente anuais promocionais antigos como vitalícios', () => {
    const plano = 'anual_promocional';
    const startedAt = '2026-08-01T00:00:00Z';
    expect(isAnualAntigo(plano, startedAt, null)).toBe(true);
  });

  it('deve fazer parse seguro de datas do Asaas mesmo no formato YYYY-MM-DD HH:MM:SS (Safari fix)', () => {
    const asaasDateWithSpace = '2026-11-08 14:30:00';
    const parsed = parseDateSafe(asaasDateWithSpace);
    expect(parsed).not.toBeNull();
    expect(parsed?.getFullYear()).toBe(2026);
    expect(formatarDataHora(asaasDateWithSpace)).toContain('08/11/2026');
    expect(formatarDataHora(asaasDateWithSpace)).toContain('14:30');
  });

  it('deve formatar data simples sem hora espúria (apenas dia/mês/ano)', () => {
    const dateOnly = '2026-11-10';
    const formatted = formatarDataHora(dateOnly);
    expect(formatted).toBe('10/11/2026');
  });

  it('deve calcular corretamente a taxa retida pelo Asaas', () => {
    const valorBruto = 149.90;
    const valorLiquido = 146.41;
    const taxa = valorBruto - valorLiquido;
    expect(Number(taxa.toFixed(2))).toBe(3.49);
    expect(brl(taxa)).toBe('R$ 3,49');
  });

  it('deve desconsiderar registros anônimos sem email e sem customer id', () => {
    const isValido = (item: { email?: string | null; asaasCustomerId?: string | null; userId?: string | null }) => {
      const emailNorm = item.email ? item.email.toLowerCase().trim() : '';
      const emailOk = emailNorm && emailNorm !== 'sem e-mail' && emailNorm.includes('@');
      return Boolean(emailOk || item.asaasCustomerId || item.userId);
    };

    // Item de telemetria sem identificação
    expect(isValido({ email: null, asaasCustomerId: null, userId: null })).toBe(false);
    expect(isValido({ email: 'Sem e-mail', asaasCustomerId: null, userId: null })).toBe(false);

    // Item real identificado
    expect(isValido({ email: 'usuario@gmail.com', asaasCustomerId: null, userId: '123' })).toBe(true);
    expect(isValido({ email: null, asaasCustomerId: 'cus_001', userId: null })).toBe(true);
  });

  it('deve calcular métricas considerando estritamente assinantes ativos (emerald) no MRR e ARR', () => {
    const mockSubscribers = [
      { id: '1', modalidade: 'mensal', valor: 19.9, statusBadgeColor: 'emerald' },
      { id: '2', modalidade: 'mensal', valor: 19.9, statusBadgeColor: 'sky' }, // Pendente NÃO soma MRR
      { id: '3', modalidade: 'mensal', valor: 19.9, statusBadgeColor: 'rose' }, // Cancelado NÃO soma MRR
      { id: '4', modalidade: 'anual', valor: 89.9, statusBadgeColor: 'emerald' },
      { id: '5', modalidade: 'vitalicio', valor: 149.9, statusBadgeColor: 'emerald' },
    ];

    let totalAtivos = 0;
    let totalPendentes = 0;
    let totalCancelados = 0;
    let mensaisMRR = 0;
    let anuaisARR = 0;
    let vitaliciosReceita = 0;

    mockSubscribers.forEach((s) => {
      if (s.statusBadgeColor === 'emerald') totalAtivos++;
      else if (s.statusBadgeColor === 'sky') totalPendentes++;
      else if (s.statusBadgeColor === 'rose') totalCancelados++;

      if (s.statusBadgeColor !== 'emerald') return;

      if (s.modalidade === 'mensal') mensaisMRR += s.valor;
      if (s.modalidade === 'anual') anuaisARR += s.valor;
      if (s.modalidade === 'vitalicio') vitaliciosReceita += s.valor;
    });

    expect(totalAtivos).toBe(3);
    expect(totalPendentes).toBe(1);
    expect(totalCancelados).toBe(1);
    expect(mensaisMRR).toBe(19.9); // Apenas 1 ativo, os outros 2 ignorados
    expect(anuaisARR).toBe(89.9);
    expect(vitaliciosReceita).toBe(149.9);
  });
});
