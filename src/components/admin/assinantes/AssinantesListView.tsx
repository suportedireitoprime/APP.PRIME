import React, { useMemo } from 'react';
import { Search, FlaskConical, AlertTriangle, Clock, CheckCircle2, XCircle, Users, Crown } from 'lucide-react';
import { Row, STATUS_LABEL } from './assinantesTypes';
import { avatarImg } from '@/lib/cdnImg';

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
  onSelectUser?: (r: Row) => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Calcula dias entre agora e a data de expiração. Positivo = futuro, negativo = passado */
function daysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const exp = new Date(expiresAt).getTime();
  const now = Date.now();
  return Math.ceil((exp - now) / DAY_MS);
}

type GroupKey = 'expired' | 'expiring_soon' | 'active' | 'trial' | 'testing';

function classifyRow(r: Row): GroupKey {
  const now = Date.now();
  const isPlay = r.source === 'play';
  const isCancelled =
    r.status === 'SUBSCRIPTION_STATE_CANCELED' ||
    r.status === 'SUBSCRIPTION_STATE_EXPIRED' ||
    r.status === 'inactive';
  const expMs = r.expires_at ? new Date(r.expires_at).getTime() : 0;
  const startMs = r.start_time ? new Date(r.start_time).getTime() : 0;

  // Trial/Testing detection
  const durationMs = startMs && expMs ? expMs - startMs : 0;
  const isTestLicense = isPlay && durationMs > 0 && durationMs < 60 * 60 * 1000; // < 1h
  if (r.is_test || isTestLicense) return 'testing';

  const isTrial =
    isPlay &&
    r.status === 'SUBSCRIPTION_STATE_ACTIVE' &&
    !isCancelled &&
    durationMs > 0 &&
    durationMs <= 3.1 * DAY_MS &&
    expMs > now;
  if (isTrial) return 'trial';

  // Expired / Cancelled
  if (isCancelled) return 'expired';
  if (expMs > 0 && expMs < now) return 'expired';

  // Expiring soon (next 7 days)
  const daysLeft = daysUntilExpiry(r.expires_at);
  if (
    daysLeft !== null &&
    daysLeft >= 0 &&
    daysLeft <= 7 &&
    (r.status === 'SUBSCRIPTION_STATE_ACTIVE' || r.status === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD' || r.status === 'active')
  ) {
    return 'expiring_soon';
  }

  return 'active';
}

const GROUP_CONFIG: Record<GroupKey, { title: string; icon: React.ElementType; color: string; borderColor: string; bgColor: string }> = {
  expired: {
    title: 'Vencidos / Não Renovaram',
    icon: XCircle,
    color: 'text-rose-400',
    borderColor: 'border-rose-500/30',
    bgColor: 'bg-rose-500/5',
  },
  expiring_soon: {
    title: 'Próximos de Vencer (7 dias)',
    icon: AlertTriangle,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/5',
  },
  trial: {
    title: 'Trial (Período de Teste)',
    icon: Clock,
    color: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    bgColor: 'bg-purple-500/5',
  },
  active: {
    title: 'Ativos',
    icon: CheckCircle2,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/5',
  },
  testing: {
    title: 'Licenças de Teste',
    icon: FlaskConical,
    color: 'text-zinc-400',
    borderColor: 'border-zinc-500/30',
    bgColor: 'bg-zinc-500/5',
  },
};

const GROUP_ORDER: GroupKey[] = ['expired', 'expiring_soon', 'active', 'trial', 'testing'];

function SubscriberCard({
  r,
  fmtBRL,
  fmtDate,
  fmtDateTime,
  priceFor,
  parseObservacao,
  group,
  onClick,
}: {
  r: Row;
  fmtBRL: (v: number) => string;
  fmtDate: (iso: string | null) => string;
  fmtDateTime: (iso: string | null) => string;
  priceFor: (sku: string | null) => { sticker: number } | null;
  parseObservacao: (obs: string | null) => { value?: number; billingType?: string } | null;
  group: GroupKey;
  onClick?: (r: Row) => void;
}) {
  const isAsaas = r.source === 'asaas';
  const asaasData = isAsaas ? parseObservacao(r.observacao ?? null) : null;
  const days = daysUntilExpiry(r.expires_at);

  let displayName = r.display_name;
  if (!displayName && r.email) {
    const emailPrefix = r.email.split('@')[0];
    displayName = emailPrefix.replace(/[0-9_.-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim();
  }
  if (!displayName) displayName = 'Usuário';

  const prod = (r.product_id || '').toLowerCase();
  let simplePlan = 'Desconhecido';
  if (prod.includes('anual')) simplePlan = 'Anual';
  else if (prod.includes('semestral')) simplePlan = 'Semestral';
  else if (prod.includes('mensal')) simplePlan = 'Mensal';
  else if (prod.includes('vitalicio')) simplePlan = 'Vitalício';
  else if (prod) simplePlan = prod.replace(/_/g, ' ');

  let valueStr = '';
  const p = priceFor(r.product_id);
  if (p) valueStr = fmtBRL(p.sticker);
  if (isAsaas && asaasData && asaasData.value) valueStr = fmtBRL(asaasData.value);

  // Status badge
  let badgeText = '';
  let badgeCls = '';
  if (group === 'expired') {
    if (r.status === 'SUBSCRIPTION_STATE_CANCELED' || r.status === 'inactive') {
      badgeText = 'CANCELADO';
      badgeCls = 'bg-rose-500/20 text-rose-400';
    } else {
      badgeText = days !== null ? `VENCIDO HÁ ${Math.abs(days)}d` : 'VENCIDO';
      badgeCls = 'bg-rose-500/20 text-rose-400';
    }
  } else if (group === 'expiring_soon') {
    badgeText = days !== null ? (days === 0 ? 'VENCE HOJE' : `VENCE EM ${days}d`) : 'VENCE EM BREVE';
    badgeCls = 'bg-amber-500/20 text-amber-400';
  } else if (group === 'trial') {
    badgeText = days !== null ? `TRIAL · ${days}d restantes` : 'TRIAL';
    badgeCls = 'bg-purple-500/20 text-purple-400';
  } else if (group === 'testing') {
    badgeText = 'TESTANDO';
    badgeCls = 'bg-zinc-500/20 text-zinc-400';
  } else {
    const autoRenew = r.raw?.auto_renewing !== false;
    badgeText = autoRenew ? 'ATIVA' : 'ATIVA (sem renovação)';
    badgeCls = autoRenew ? 'bg-emerald-500 text-white' : 'bg-amber-500/20 text-amber-400';
  }

  const isExpiredGroup = group === 'expired';

  return (
    <div
      onClick={() => onClick && onClick(r)}
      className={`flex items-center gap-3 p-3 border-b last:border-0 transition-colors ${
        onClick ? 'cursor-pointer' : ''
      } ${
        isExpiredGroup
          ? 'border-rose-500/10 hover:bg-rose-500/5'
          : 'border-border hover:bg-muted/50'
      }`}
    >
      {r.avatar_url ? (
        <img
          src={avatarImg(r.avatar_url, 72)}
          alt=""
          loading="lazy"
          decoding="async"
          width={36}
          height={36}
          className={`w-9 h-9 rounded-full object-cover border border-border/50 ${isExpiredGroup ? 'opacity-60 grayscale' : 'bg-muted'}`}
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      ) : (
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold uppercase border shrink-0 ${
            isExpiredGroup
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              : 'bg-muted border-border/50'
          }`}
        >
          {displayName.slice(0, 1)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          <span className={`text-[15px] font-semibold truncate tracking-tight ${isExpiredGroup ? 'text-muted-foreground' : ''}`}>
            {displayName}
          </span>
          {simplePlan === 'Vitalício' && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-sm ml-1">
              <Crown className="w-3 h-3 fill-amber-500/20" />
              Vitalício
            </div>
          )}
          {r.source === 'play' && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-[#3DDC84] text-black shadow-sm">
              Google Play
            </span>
          )}
          {r.source === 'asaas' && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-blue-500 text-white shadow-sm">
              Asaas
            </span>
          )}
          {r.source === 'apple' && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-zinc-700 text-white shadow-sm">
              Apple
            </span>
          )}
          {r.source === 'old' && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-amber-500 text-white shadow-sm">
              Antigo
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground truncate font-medium">{r.email ?? '—'}</div>
        {r.order_id && (
          <div className="text-[10px] text-muted-foreground/70 font-mono truncate mt-0.5" title={r.order_id}>
            🧾 {r.order_id}
          </div>
        )}
        <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-1 mt-1 font-medium">
          <span className={`font-bold uppercase tracking-wider text-[10px] ${simplePlan === 'Mensal' ? 'text-primary' : simplePlan === 'Vitalício' ? 'text-amber-500' : 'text-foreground'}`}>
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
          <span className={isExpiredGroup ? 'text-rose-400 font-semibold' : ''}>
            {isExpiredGroup ? `expirou em ${fmtDate(r.expires_at)}` : `renova em ${fmtDate(r.expires_at)}`}
          </span>
          {isAsaas && asaasData && (
            <>
              <span>·</span>
              <span className="text-[10px] uppercase tracking-wider bg-muted px-1.5 py-0.5 rounded text-foreground/70">
                {asaasData.billingType === 'CREDIT_CARD' ? 'Cartão' : asaasData.billingType === 'PIX' ? 'PIX' : asaasData.billingType}
              </span>
            </>
          )}
        </div>
        {r.last_sign_in_at && (
          <div className="text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-1">
            <span className="opacity-70">👤</span>
            Último acesso: {fmtDateTime(r.last_sign_in_at)}
          </div>
        )}
      </div>
      <span className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-widest whitespace-nowrap shadow-sm ${badgeCls}`}>
        {badgeText}
      </span>
    </div>
  );
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
  onSelectUser,
}) => {
  const groups = useMemo(() => {
    const map: Record<GroupKey, Row[]> = {
      expired: [],
      expiring_soon: [],
      active: [],
      trial: [],
      testing: [],
    };
    for (const r of filtered) {
      const key = classifyRow(r);
      map[key].push(r);
    }
    // Sort expired: most recent expiry first
    map.expired.sort((a, b) => {
      const expA = a.expires_at ? new Date(a.expires_at).getTime() : 0;
      const expB = b.expires_at ? new Date(b.expires_at).getTime() : 0;
      return expB - expA;
    });
    // Sort expiring_soon: soonest first
    map.expiring_soon.sort((a, b) => {
      const expA = a.expires_at ? new Date(a.expires_at).getTime() : Infinity;
      const expB = b.expires_at ? new Date(b.expires_at).getTime() : Infinity;
      return expA - expB;
    });
    return map;
  }, [filtered]);

  const stats = useMemo(
    () => ({
      total: filtered.length,
      active: groups.active.length,
      expired: groups.expired.length,
      expiringSoon: groups.expiring_soon.length,
      trial: groups.trial.length,
      testing: groups.testing.length,
    }),
    [filtered, groups],
  );

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Mini Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`rounded-xl border bg-card p-3 flex flex-col items-center gap-1 transition-all ${
            statusFilter === 'all' ? 'border-primary ring-1 ring-primary shadow-sm bg-primary/5' : 'border-border hover:bg-muted/50'
          }`}
        >
          <Users className={`w-4 h-4 ${statusFilter === 'all' ? 'text-primary' : 'text-muted-foreground'}`} />
          <span className="text-lg font-bold">{stats.total}</span>
          <span className={`text-[10px] uppercase tracking-widest font-semibold ${statusFilter === 'all' ? 'text-primary' : 'text-muted-foreground'}`}>
            Total
          </span>
        </button>
        <button
          onClick={() => setStatusFilter('active')}
          className={`rounded-xl border p-3 flex flex-col items-center gap-1 transition-all ${
            statusFilter === 'active' 
              ? 'border-emerald-500 ring-1 ring-emerald-500 shadow-sm bg-emerald-500/10' 
              : 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-lg font-bold text-emerald-400">{stats.active}</span>
          <span className="text-[10px] uppercase tracking-widest text-emerald-400/70 font-semibold">Ativos</span>
        </button>
        <button
          onClick={() => setStatusFilter('expired')}
          className={`rounded-xl border p-3 flex flex-col items-center gap-1 transition-all ${
            statusFilter === 'expired' 
              ? 'border-rose-500 ring-1 ring-rose-500 shadow-sm bg-rose-500/10' 
              : 'border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10'
          }`}
        >
          <XCircle className="w-4 h-4 text-rose-400" />
          <span className="text-lg font-bold text-rose-400">{stats.expired}</span>
          <span className="text-[10px] uppercase tracking-widest text-rose-400/70 font-semibold">Vencidos</span>
        </button>
        <button
          onClick={() => setStatusFilter('attention')}
          className={`rounded-xl border p-3 flex flex-col items-center gap-1 transition-all ${
            statusFilter === 'attention' 
              ? 'border-amber-500 ring-1 ring-amber-500 shadow-sm bg-amber-500/10' 
              : 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span className="text-lg font-bold text-amber-400">{stats.expiringSoon + stats.trial}</span>
          <span className="text-[10px] uppercase tracking-widest text-amber-400/70 font-semibold">Atenção</span>
        </button>
      </div>

      {/* Search + Filters */}
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

      {/* Loading */}
      {loading && <div className="p-6 text-center text-sm text-muted-foreground">Carregando…</div>}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="p-6 text-center text-sm text-muted-foreground">Nenhuma assinatura encontrada.</div>
      )}

      {/* Grouped Sections */}
      {!loading &&
        filtered.length > 0 &&
        GROUP_ORDER.map((groupKey) => {
          if (statusFilter === 'active' && groupKey !== 'active') return null;
          if (statusFilter === 'expired' && groupKey !== 'expired') return null;
          if (statusFilter === 'attention' && groupKey !== 'expiring_soon' && groupKey !== 'trial') return null;
          
          const rows = groups[groupKey];
          if (rows.length === 0) return null;
          const config = GROUP_CONFIG[groupKey];
          const Icon = config.icon;

          return (
            <div key={groupKey} className={`rounded-xl border ${config.borderColor} ${config.bgColor} overflow-hidden`}>
              {/* Section Header */}
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/30">
                <Icon className={`w-4.5 h-4.5 ${config.color}`} />
                <span className={`text-sm font-bold uppercase tracking-wider ${config.color}`}>
                  {config.title}
                </span>
                <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${config.bgColor} ${config.color} border ${config.borderColor}`}>
                  {rows.length}
                </span>
              </div>

              {/* Cards */}
              {rows.map((r) => (
                <SubscriberCard
                  key={r.id}
                  r={r}
                  fmtBRL={fmtBRL}
                  fmtDate={fmtDate}
                  fmtDateTime={fmtDateTime}
                  priceFor={priceFor}
                  parseObservacao={parseObservacao}
                  group={groupKey}
                  onClick={onSelectUser}
                />
              ))}
            </div>
          );
        })}
    </div>
  );
};
