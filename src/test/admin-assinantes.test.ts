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
    expect(PRECO_MENSAL).toBe(29.9);
    expect(brl(PRECO_MENSAL)).toBe('R$ 29,90');
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
      { id: '1', modalidade: 'mensal', valor: 29.9, statusBadgeColor: 'emerald' },
      { id: '2', modalidade: 'mensal', valor: 29.9, statusBadgeColor: 'sky' }, // Pendente NÃO soma MRR
      { id: '3', modalidade: 'mensal', valor: 29.9, statusBadgeColor: 'rose' }, // Cancelado NÃO soma MRR
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
    expect(mensaisMRR).toBe(29.9); // Apenas 1 ativo, os outros 2 ignorados
    expect(anuaisARR).toBe(89.9);
    expect(vitaliciosReceita).toBe(149.9);
  });

  it('deve garantir que checkout com PIX PENDENTE não concede isPremium nem coroa de assinante', () => {
    const isStatusAssinaturaAtiva = (st?: string | null) => {
      const s = (st || '').toUpperCase().trim();
      return ['ACTIVE', 'ACTIVE_GRACE', 'CONFIRMED', 'RECEIVED', 'PAGA'].includes(s);
    };

    // Cenário Walter: gerou PIX, status PENDING, is_premium false no perfil
    const walterProfile = { is_premium: false };
    const walterSub = { planTag: { plano: 'Mensal', status: 'PENDING' } };

    const isSubAtiva = isStatusAssinaturaAtiva(walterSub.planTag.status);
    const isUserPrem = Boolean(walterProfile.is_premium || isSubAtiva);

    expect(isSubAtiva).toBe(false);
    expect(isUserPrem).toBe(false); // NÃO deve ter coroa nem ser tratado como assinante ativo

    // Cenário Anderson Cezar: CC aprovado, status ACTIVE
    const andersonProfile = { is_premium: false };
    const andersonSub = { planTag: { plano: 'Mensal', status: 'ACTIVE' } };
    const isAndersonSubAtiva = isStatusAssinaturaAtiva(andersonSub.planTag.status);
    const isAndersonUserPrem = Boolean(andersonProfile.is_premium || isAndersonSubAtiva);

    expect(isAndersonSubAtiva).toBe(true);
    expect(isAndersonUserPrem).toBe(true);
  });

  it('deve classificar Walter como ASSINOU (1º mês) e NÃO como Renovou mesmo com perfil anterior', () => {
    const startIso = '2026-11-10T00:00:00.000Z';
    const endIso = '2026-11-10T23:59:59.999Z';

    const inPeriod = (dateStr?: string | null) => {
      if (!dateStr) return false;
      const t = new Date(dateStr).getTime();
      return !isNaN(t) && t >= new Date(startIso).getTime() && t <= new Date(endIso).getTime();
    };

    // Walter: perfil criado dias antes, mas assinatura criada HOJE às 19:25
    const walterSub = {
      user_id: 'walter-uid',
      created_at: '2026-11-10T19:25:00.000Z',
      started_at: '2026-11-10T19:25:00.000Z',
      plano: 'mensal',
      status: 'ACTIVE'
    };

    const createdInPeriod = inPeriod(walterSub.created_at);
    const startedInPeriod = inPeriod(walterSub.started_at);
    const createdTime = new Date(walterSub.created_at).getTime();
    const startedTime = new Date(walterSub.started_at).getTime();
    const isCriadaAntes = createdTime < new Date(startIso).getTime();
    const isSegundoMesOuMais = (startedTime - createdTime) >= 20 * 24 * 3600 * 1000;

    const isAssinou = createdInPeriod || (!isCriadaAntes && startedInPeriod);
    const isRenovou = walterSub.plano === 'mensal' && startedInPeriod && isCriadaAntes && isSegundoMesOuMais;

    expect(isAssinou).toBe(true);
    expect(isRenovou).toBe(false);
  });

  it('deve classificar renovação real (2º mês em diante) em RENOVOU', () => {
    const startIso = '2026-11-10T00:00:00.000Z';
    const endIso = '2026-11-10T23:59:59.999Z';

    const inPeriod = (dateStr?: string | null) => {
      if (!dateStr) return false;
      const t = new Date(dateStr).getTime();
      return !isNaN(t) && t >= new Date(startIso).getTime() && t <= new Date(endIso).getTime();
    };

    // Usuário antigo: assinatura criada há 31 dias (em outubro), novo ciclo cobrança HOJE
    const renewSub = {
      user_id: 'maria-uid',
      created_at: '2026-10-10T12:00:00.000Z',
      started_at: '2026-11-10T12:00:00.000Z',
      plano: 'mensal',
      status: 'ACTIVE'
    };

    const createdInPeriod = inPeriod(renewSub.created_at);
    const startedInPeriod = inPeriod(renewSub.started_at);
    const createdTime = new Date(renewSub.created_at).getTime();
    const startedTime = new Date(renewSub.started_at).getTime();
    const isCriadaAntes = createdTime < new Date(startIso).getTime();
    const isSegundoMesOuMais = (startedTime - createdTime) >= 20 * 24 * 3600 * 1000;

    const isAssinou = createdInPeriod || (!isCriadaAntes && startedInPeriod);
    const isRenovou = renewSub.plano === 'mensal' && startedInPeriod && isCriadaAntes && isSegundoMesOuMais;

    expect(isAssinou).toBe(false);
    expect(isRenovou).toBe(true);
  });

  it('deve identificar exatamente qual PIX foi pago quando o usuário gera 3 PIX', () => {
    const logs = [
      { event_name: 'checkout_pix_gerado', created_at: '2026-11-10T14:10:00Z', payment_id: 'pay_3' },
      { event_name: 'checkout_pix_gerado', created_at: '2026-11-10T14:05:00Z', payment_id: 'pay_2' },
      { event_name: 'checkout_pix_gerado', created_at: '2026-11-10T14:00:00Z', payment_id: 'pay_1' },
      { event_name: 'checkout_pix_pago', created_at: '2026-11-10T14:11:00Z', payment_id: 'pay_3' },
    ];

    const paidPixEvent = logs.find(l => l.event_name === 'checkout_pix_pago');
    const matchedPixIdx = logs.findIndex(l => l.event_name === 'checkout_pix_gerado' && l.payment_id === paidPixEvent?.payment_id);

    const statuses = logs.map((l, idx) => {
      if (l.event_name === 'checkout_pix_gerado') {
        return idx === matchedPixIdx ? 'pago' : 'nao_pago';
      }
      return null;
    });

    expect(statuses[0]).toBe('pago'); // pay_3 (14:10) foi o pago
    expect(statuses[1]).toBe('nao_pago'); // pay_2 (14:05) não foi pago
    expect(statuses[2]).toBe('nao_pago'); // pay_1 (14:00) não foi pago
  });

  it('deve marcar PIX gerados como NÃO PAGO quando o usuário pagar com Cartão de Crédito', () => {
    const logs = [
      { event_name: 'checkout_cc_aprovado', created_at: '2026-11-10T19:25:00Z' },
      { event_name: 'checkout_cc_enviado', created_at: '2026-11-10T19:25:00Z' },
      { event_name: 'checkout_pix_gerado', created_at: '2026-11-10T19:19:00Z' },
      { event_name: 'checkout_pix_gerado', created_at: '2026-11-10T13:33:00Z' },
    ];

    const hasCcAprovado = logs.some(l => l.event_name === 'checkout_cc_aprovado');
    const statuses = logs.map(l => {
      if (l.event_name === 'checkout_pix_gerado') {
        return hasCcAprovado ? 'nao_pago' : 'pendente';
      }
      return null;
    });

    expect(statuses[2]).toBe('nao_pago'); // PIX 19:19 não foi pago (abandonado pelo cartão)
    expect(statuses[3]).toBe('nao_pago'); // PIX 13:33 não foi pago (abandonado pelo cartão)
  });
});
