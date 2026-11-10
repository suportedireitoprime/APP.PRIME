import { describe, it, expect } from 'vitest';
import { precoBase, parcelamento, PRECO_MENSAL, PRECO_ANUAL, PRECO_VITALICIO } from './precos';

describe('preços de assinatura', () => {
  it('mensal custa 29,90 no cartão e no Pix', () => {
    expect(precoBase('mensal')).toBe(29.9);
    expect(precoBase('mensal_pix')).toBe(29.9);
    expect(PRECO_MENSAL).toBe(29.9);
  });

  it('anual custa 89,90 no cartão e no Pix', () => {
    expect(precoBase('anual')).toBe(89.9);
    expect(precoBase('anual_regular_pix')).toBe(89.9);
    expect(PRECO_ANUAL).toBe(89.9);
  });

  it('vitalício custa 149,90 no cartão e no Pix', () => {
    expect(precoBase('vitalicio')).toBe(149.9);
    expect(precoBase('vitalicio_pix')).toBe(149.9);
    expect(PRECO_VITALICIO).toBe(149.9);
  });

  it('promoções e planos inexistentes disparam erro', () => {
    expect(() => precoBase('promocao')).toThrow();
    expect(() => precoBase('invalido')).toThrow();
  });

  it('anual à vista não tem juros', () => {
    expect(parcelamento(1, PRECO_ANUAL).total).toBe(89.9);
  });

  it('parcelamento limitado a 6x e cobra juros proporcionais', () => {
    expect(parcelamento(12, PRECO_ANUAL).parcelas).toBe(6);
    expect(parcelamento(6, PRECO_ANUAL).total).toBeGreaterThan(89.9);
  });
});
