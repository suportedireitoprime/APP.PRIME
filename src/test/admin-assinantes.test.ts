import { describe, it, expect } from 'vitest';
import { isAnualAntigo } from '@/hooks/useSubscription';
import { PRECO_MENSAL, PRECO_ANUAL, PRECO_VITALICIO, brl } from '@/lib/precos';

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
});
