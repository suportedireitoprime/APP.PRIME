import { describe, it, expect } from 'vitest';
import { isAnualAntigo, CUTOFF_ANUAL_ISO } from './useSubscription';

describe('isAnualAntigo (Regra de corte para vitalício em 10/11/2026)', () => {
  it('deve retornar true para plano anual adquirido antes de 10/11/2026', () => {
    // Exemplo real de Edinaelma: adquirida em 20/10/2026
    const res = isAnualAntigo('anual', '2026-10-20T22:48:48.754Z', '2026-10-23T00:00:00Z');
    expect(res).toBe(true);
  });

  it('deve retornar true para plano anual promocional adquirido antes de 10/11/2026', () => {
    const res = isAnualAntigo('anual_promocional', '2026-09-22T00:00:00Z', '2027-09-22T00:00:00Z');
    expect(res).toBe(true);
  });

  it('deve retornar true para plano anual sem started_at mas com expiração antes de novembro de 2027', () => {
    const res = isAnualAntigo('prime_premium_anual', null, '2027-10-27T03:24:45.473Z');
    expect(res).toBe(true);
  });

  it('deve retornar false para novo plano anual adquirido em ou após 10/11/2026', () => {
    // Nova compra anual hoje ou amanhã
    const res = isAnualAntigo('anual', '2026-11-10T14:00:00.000Z', '2027-11-15T14:00:00.000Z');
    expect(res).toBe(false);
  });

  it('deve retornar false para compra realizada hoje mesmo com expiração inferior a 365 dias (ex: 2027-11-09)', () => {
    // Edge case: iniciado hoje em 10/11/2026 com expiração antes de 2027-11-10
    const res = isAnualAntigo('anual', '2026-11-10T08:00:00.000Z', '2027-11-09T08:00:00.000Z');
    expect(res).toBe(false);
  });

  it('deve respeitar created_at quando started_at for nulo', () => {
    // Antigo via created_at
    expect(isAnualAntigo('anual', null, null, '2026-08-01T00:00:00.000Z')).toBe(true);
    // Novo via created_at
    expect(isAnualAntigo('anual', null, '2027-11-09T00:00:00.000Z', '2026-11-10T09:00:00.000Z')).toBe(false);
  });

  it('deve retornar false para planos mensais, independentemente da data', () => {
    expect(isAnualAntigo('mensal', '2026-10-15T00:00:00Z', '2026-11-15T00:00:00Z')).toBe(false);
    expect(isAnualAntigo('prime_premium_mensal', '2026-11-10T00:00:00Z', '2026-12-10T00:00:00Z')).toBe(false);
  });

  it('deve retornar false para planos que já são vitalício', () => {
    expect(isAnualAntigo('vitalicio', '2026-08-01T00:00:00Z', null)).toBe(false);
    expect(isAnualAntigo('vitalício', '2026-11-10T00:00:00Z', null)).toBe(false);
  });
});
