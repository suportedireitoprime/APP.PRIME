import { describe, it, expect } from 'vitest';
import { precoBase, parcelamento } from './precos';

describe('preços de assinatura', () => {
  it('mensal custa 29,90 no cartão e no Pix', () => {
    expect(precoBase('mensal')).toBe(29.9);
    expect(precoBase('mensal_pix')).toBe(29.9);
  });
  it('anual custa 199,90 no cartão e no Pix (sem desconto)', () => {
    expect(precoBase('anual')).toBe(199.9);
    expect(precoBase('anual_regular_pix')).toBe(199.9);
  });
  it('vitalício e promoção não existem', () => {
    expect(() => precoBase('vitalicio')).toThrow();
    expect(() => precoBase('promocao')).toThrow();
  });
  it('anual à vista não tem juros', () => {
    expect(parcelamento(1).total).toBe(199.9);
  });
  it('parcelamento limitado a 6x e cobra juros', () => {
    expect(parcelamento(12).parcelas).toBe(6);
    expect(parcelamento(6).total).toBeGreaterThan(199.9);
  });
});
