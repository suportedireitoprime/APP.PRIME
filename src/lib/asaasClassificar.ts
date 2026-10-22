export type PlanClass = 'Mensal' | 'Semestral' | 'Anual' | 'Vitalício' | 'Desconhecido';
export type Grupo = 'ativo' | 'aguardando' | 'cancelado' | 'vencido';

export type AsaasRecord = {
  id: string;
  type: 'subscription' | 'payment';
  planClass: PlanClass;
  customerName: string;
  customerEmail: string;
  value: number;
  billingType: string;
  status: string;
  date: string;
  dueDate: string | null;
  daysLeft: number | null;
  grupo: Grupo;
  isInstallment?: boolean;
};

const PAID = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'];
const CANCEL = ['CANCELED', 'DELETED', 'REFUNDED', 'INACTIVE', 'EXPIRED'];
const DAY = 86400000;

function classDesc(desc: string): PlanClass {
  const d = desc.toLowerCase();
  if (d.includes('vitalic') || d.includes('vitalíc')) return 'Vitalício';
  if (d.includes('semestr')) return 'Semestral';
  if (d.includes('anual')) return 'Anual';
  if (d.includes('mensal')) return 'Mensal';
  return 'Desconhecido';
}

function cycleClass(cycle: string, desc: string): PlanClass {
  if (cycle === 'MONTHLY') return 'Mensal';
  if (cycle === 'SEMIANNUALLY') return 'Semestral';
  if (cycle === 'YEARLY') return 'Anual';
  return classDesc(desc);
}

function addMonths(iso: string, m: number) {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + m);
  return d.toISOString().slice(0, 10);
}

function days(due: string | null, now: Date) {
  if (!due) return null;
  const a = new Date(due + (due.length === 10 ? 'T00:00:00' : '')).getTime();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((a - b) / DAY);
}

const MONTHS: Record<PlanClass, number> = { Mensal: 1, Semestral: 6, Anual: 12, Vitalício: 0, Desconhecido: 0 };

export function classificarAsaas(customers: any[], subscriptions: any[], payments: any[], now = new Date()): AsaasRecord[] {
  const cust = new Map<string, any>(customers.map((c) => [c.id, c]));
  const subPay = new Map<string, any[]>();
  const inst = new Map<string, any[]>();
  const single: any[] = [];
  for (const p of payments) {
    if (p.subscription) (subPay.get(p.subscription) ?? subPay.set(p.subscription, []).get(p.subscription)!).push(p);
    else if (p.installment) (inst.get(p.installment) ?? inst.set(p.installment, []).get(p.installment)!).push(p);
    else single.push(p);
  }
  const base = (c: any) => ({ customerName: c?.name || 'Sem nome', customerEmail: c?.email || 'Sem email' });
  const out: AsaasRecord[] = [];

  for (const s of subscriptions) {
    const paid = (subPay.get(s.id) || []).some((p) => PAID.includes(p.status));
    const pc = cycleClass(s.cycle, s.description || '');
    const due = s.nextDueDate || null;
    const dl = days(due, now);
    let grupo: Grupo = CANCEL.includes(s.status) ? 'cancelado' : !paid ? 'aguardando' : dl !== null && dl < 0 ? 'vencido' : 'ativo';
    if (s.status === 'OVERDUE' || (paid && (subPay.get(s.id) || []).some((p) => p.status === 'OVERDUE'))) grupo = grupo === 'cancelado' ? grupo : 'vencido';
    out.push({ id: s.id, type: 'subscription', planClass: pc, ...base(cust.get(s.customer)), value: s.value, billingType: s.billingType, status: s.status, date: s.dateCreated || '', dueDate: due, daysLeft: dl, grupo });
  }

  const pushPay = (id: string, p: any, value: number, isInst: boolean, refunded: boolean) => {
    const pc = classDesc(p.description || '');
    const start = p.paymentDate || p.confirmedDate || p.dateCreated || p.dueDate;
    const due = MONTHS[pc] && start ? addMonths(start, MONTHS[pc]) : null;
    const dl = days(due, now);
    const grupo: Grupo = refunded ? 'cancelado' : dl !== null && dl < 0 ? 'vencido' : 'ativo';
    out.push({ id, type: 'payment', planClass: pc, ...base(cust.get(p.customer)), value, billingType: p.billingType, status: p.status, date: p.dateCreated || p.dueDate || '', dueDate: due, daysLeft: dl, grupo, isInstallment: isInst });
  };

  for (const p of single) {
    if (PAID.includes(p.status)) pushPay(p.id, p, p.value, false, false);
    else if (p.status === 'REFUNDED') pushPay(p.id, p, p.value, false, true);
  }
  inst.forEach((g, id) => {
    if (!g.some((p) => PAID.includes(p.status))) return;
    const sorted = [...g].sort((a, b) => +new Date(a.dateCreated || a.dueDate) - +new Date(b.dateCreated || b.dueDate));
    pushPay(id, sorted[0], g.reduce((a, c) => a + c.value, 0), true, g.every((p) => p.status === 'REFUNDED'));
  });

  return out.sort((a, b) => +new Date(b.date) - +new Date(a.date));
}
