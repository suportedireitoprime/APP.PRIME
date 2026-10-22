import { describe, it, expect } from 'vitest';
import { inicioCiclo, diasParaRenovar, percentualTotal, contarUsos } from './cotaCiclo';

describe('cota mensal', () => {
  it('ciclo de 30 dias a partir do cadastro', () => {
    const cad = '2026-09-01T10:00:00Z';
    expect(inicioCiclo(cad, new Date('2026-10-05T00:00:00Z')).toISOString()).toBe('2026-10-01T10:00:00.000Z');
    expect(diasParaRenovar(cad, new Date('2026-10-20T10:00:00Z'))).toBe(11);
  });
  it('percentual total soma todas as funções', () => {
    expect(percentualTotal([{ used: 5, limit: 10 }, { used: 2, limit: 2 }, { used: 0, limit: 8 }])).toBe(35);
    expect(percentualTotal([{ used: 50, limit: 10 }])).toBe(100);
  });
  it('mesmo item não conta duas vezes', () => {
    expect(contarUsos([{ ref_key: 'a' }, { ref_key: 'a' }, { ref_key: 'b' }])).toBe(2);
  });
});
