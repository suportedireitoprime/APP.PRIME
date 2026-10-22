import { describe, it, expect } from 'vitest';
import { classificarAsaas } from './asaasClassificar';

const now = new Date('2026-10-20T12:00:00');
const c = [{ id: 'c1', name: 'Ana', email: 'a@x.com' }];

describe('classificarAsaas', () => {
  it('vitalício não tem vencimento', () => {
    const [r] = classificarAsaas(c, [], [{ id: 'p1', customer: 'c1', value: 300, status: 'RECEIVED', description: 'Plano Vitalício', dateCreated: '2026-01-01' }], now);
    expect(r.planClass).toBe('Vitalício');
    expect(r.dueDate).toBeNull();
    expect(r.grupo).toBe('ativo');
  });
  it('mensal mostra dias até vencer', () => {
    const [r] = classificarAsaas(c, [{ id: 's1', customer: 'c1', cycle: 'MONTHLY', nextDueDate: '2026-10-25', status: 'ACTIVE', value: 20 }], [{ id: 'p', subscription: 's1', status: 'RECEIVED' }], now);
    expect(r.planClass).toBe('Mensal');
    expect(r.daysLeft).toBe(5);
  });
  it('semestral é classificado', () => {
    const [r] = classificarAsaas(c, [{ id: 's1', customer: 'c1', cycle: 'SEMIANNUALLY', nextDueDate: '2027-01-01', status: 'ACTIVE' }], [{ id: 'p', subscription: 's1', status: 'CONFIRMED' }], now);
    expect(r.planClass).toBe('Semestral');
  });
  it('assinatura sem pagamento fica aguardando', () => {
    const [r] = classificarAsaas(c, [{ id: 's1', customer: 'c1', cycle: 'MONTHLY', nextDueDate: '2026-10-21', status: 'ACTIVE' }], [], now);
    expect(r.grupo).toBe('aguardando');
  });
});
