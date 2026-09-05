import React from 'react';
import { Search, FlaskConical } from 'lucide-react';
import { Row, STATUS_LABEL } from './assinantesTypes';

interface AssinantesListViewProps {
  q: string;
  setQ: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  dateFilter: string;
  setDateFilter: (val: string) => void;
  loading: boolean;
  filtered: Row[];
  fmtBRL: (val: number) => string;
  fmtDate: (iso: string | null) => string;
  fmtDateTime: (iso: string | null) => string;
  priceFor: (sku: string | null) => { sticker: number } | null;
  parseObservacao: (obs: string | null) => { value?: number; billingType?: string } | null;
}

export const AssinantesListView: React.FC<AssinantesListViewProps> = ({
  q,
  setQ,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  loading,
  filtered,
  fmtBRL,
  fmtDate,
  fmtDateTime,
  priceFor,
  parseObservacao,
}) => {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por e-mail, nome, SKU…"
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-background text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2 py-2 rounded-lg border border-border bg-background text-sm"
        >
          <option value="all">Status</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-2 py-2 rounded-lg border border-border bg-background text-sm min-w-[100px]"
        >
          <option value="all">Todas as datas</option>
          <option value="today">Hoje</option>
          <option value="month">Este Mês</option>
          <option value="year">Este Ano</option>
        </select>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {loading && <div className="p-6 text-center text-sm text-muted-foreground">Carregando…</div>}
        {!loading && filtered.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">Nenhuma assinatura encontrada.</div>
        )}
        {!loading && filtered.map((r) => {
          const status = STATUS_LABEL[r.status] ?? { label: r.status, cls: 'bg-muted text-muted-foreground' };
          const isAsaas = r.source === 'asaas';
          const asaasData = isAsaas ? parseObservacao(r.observacao ?? null) : null;
          
          const isPlay = r.source === 'play';
          const isCancelled = r.status === 'SUBSCRIPTION_STATE_CANCELED' || r.status === 'inactive' || (isPlay && r.raw?.auto_renewing === false);
          
          const startMs = r.start_time ? new Date(r.start_time).getTime() : 0;
          const expMs = r.expires_at ? new Date(r.expires_at).getTime() : 0;
          const isTrial = isPlay && r.status === 'SUBSCRIPTION_STATE_ACTIVE' && !isCancelled && (expMs - startMs > 0 && expMs - startMs <= 3.1 * 24 * 60 * 60 * 1000) && expMs > Date.now();
          
          const statusLabel = isCancelled ? 'Cancelado' : isTrial ? 'Testando' : status.label;
          const statusCls = isCancelled ? 'bg-destructive/20 text-destructive' : isTrial ? 'bg-purple-500/20 text-purple-400' : (r.status === 'active' || r.status === 'SUBSCRIPTION_STATE_ACTIVE' ? 'bg-emerald-500 text-white' : status.cls);
          
          let valueStr = '';
          const p = priceFor(r.product_id);
          if (p) valueStr = fmtBRL(p.sticker);
          if (isAsaas && asaasData && asaasData.value) valueStr = fmtBRL(asaasData.value);

          let displayName = r.display_name;
          if (!displayName && r.email) {
            const emailPrefix = r.email.split('@')[0];
            displayName = emailPrefix.replace(/[0-9_.-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
          }
          if (!displayName) displayName = 'Usuário';

          // Nome simplificado do plano
          const prod = (r.product_id || '').toLowerCase();
          let simplePlan = 'Desconhecido';
          if (prod.includes('anual')) simplePlan = 'Anual';
          else if (prod.includes('semestral')) simplePlan = 'Semestral';
          else if (prod.includes('mensal')) simplePlan = 'Mensal';
          else if (prod.includes('vitalicio')) simplePlan = 'Vitalício';
          else if (prod) simplePlan = prod.replace(/_/g, ' ');

          return (
            <div key={r.id} className="flex items-center gap-3 p-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
              {r.avatar_url ? (
                <img src={r.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover bg-muted border border-border/50" onError={(e) => (e.currentTarget.style.display = 'none')} />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold uppercase border border-border/50 shrink-0">
                  {displayName.slice(0, 1)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                  <span className="text-[15px] font-semibold truncate tracking-tight">{displayName}</span>
                  {r.is_test && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md bg-purple-500 text-white font-medium">
                      <FlaskConical className="w-2.5 h-2.5" /> teste
                    </span>
                  )}
                  {r.source === 'asaas' && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-blue-500 text-white shadow-sm">
                      Asaas
                    </span>
                  )}
                  {r.source === 'old' && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-amber-500 text-white shadow-sm">
                      Antigo
                    </span>
                  )}
                  {r.source === 'play' && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-[#3DDC84] text-black shadow-sm">
                      Google Play
                    </span>
                  )}
                  {r.source === 'apple' && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-zinc-700 text-white shadow-sm">
                      Apple
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate font-medium">{r.email ?? '—'}</div>
                <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-1 mt-1 font-medium">
                  <span className={`font-bold uppercase tracking-wider text-[10px] ${simplePlan === 'Mensal' ? 'text-primary' : 'text-foreground'}`}>
                    {simplePlan}
                  </span>
                  {valueStr && (
                    <>
                      <span>·</span>
                      <span className="font-bold text-foreground/90">{valueStr}</span>
                    </>
                  )}
                  <span>·</span>
                  <span>início {fmtDateTime(r.start_time)}</span>
                  <span>·</span>
                  <span>renova em {fmtDate(r.expires_at)}</span>
                  {isAsaas && asaasData && (
                    <>
                      <span>·</span>
                      <span className="text-foreground/80">{fmtBRL(asaasData.value)}</span>
                      <span className="text-[10px] uppercase tracking-wider bg-muted px-1.5 py-0.5 rounded text-foreground/70">
                        {asaasData.billingType === 'CREDIT_CARD' ? 'Cartão' : asaasData.billingType === 'PIX' ? 'PIX' : asaasData.billingType}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <span className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-widest whitespace-nowrap shadow-sm ${statusCls}`}>
                {statusLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
