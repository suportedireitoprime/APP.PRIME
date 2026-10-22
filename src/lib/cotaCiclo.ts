const DAY = 86400000;
export const CICLO_DIAS = 30;

/** Início do ciclo de 30 dias atual, contado a partir do cadastro. */
export function inicioCiclo(createdAt: string | Date | undefined | null, now = new Date()): Date {
  const base = createdAt ? new Date(createdAt).getTime() : NaN;
  if (isNaN(base) || base > now.getTime()) {
    const d = new Date(now); d.setDate(1); d.setHours(0, 0, 0, 0); return d;
  }
  const ciclos = Math.floor((now.getTime() - base) / (CICLO_DIAS * DAY));
  return new Date(base + ciclos * CICLO_DIAS * DAY);
}

export function fimCiclo(createdAt: string | Date | undefined | null, now = new Date()): Date {
  return new Date(inicioCiclo(createdAt, now).getTime() + CICLO_DIAS * DAY);
}

export function diasParaRenovar(createdAt: string | Date | undefined | null, now = new Date()): number {
  return Math.max(0, Math.ceil((fimCiclo(createdAt, now).getTime() - now.getTime()) / DAY));
}

/** Percentual total (0–100) usado somando todas as funções com limite. */
export function percentualTotal(itens: { used: number; limit: number }[]): number {
  const lim = itens.reduce((a, i) => a + Math.max(0, i.limit), 0);
  if (!lim) return 0;
  const usados = itens.reduce((a, i) => a + Math.min(i.used, Math.max(0, i.limit)), 0);
  return Math.round((usados / lim) * 100);
}

/** Contagem de usos: o mesmo item (ref) conta uma vez só. */
export function contarUsos(rows: { ref_key?: string | null; scope_value?: string | null }[]): number {
  const vistos = new Set<string>();
  let soltos = 0;
  for (const r of rows) {
    const k = r.scope_value || r.ref_key;
    if (k) vistos.add(k); else soltos++;
  }
  return vistos.size + soltos;
}
