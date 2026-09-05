import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Crown, PlayCircle, Smartphone } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { isAdminEmail } from '@/lib/adminEmails';

import {
  CombinedRow,
  LegacySubscriber,
  Payload,
  EMPTY_METRICS,
  fmtBRL,
  fmtDate,
  fmtDateTime,
  parseObservacao,
  priceFor,
} from '@/components/admin/assinantes/assinantesTypes';
import { AssinantesFunnelCard } from '@/components/admin/assinantes/AssinantesFunnelCard';
import { AssinantesFunnelModal } from '@/components/admin/assinantes/AssinantesFunnelModal';
import { AssinantesRevenueCharts } from '@/components/admin/assinantes/AssinantesRevenueCharts';
import { AssinantesRevenueModal } from '@/components/admin/assinantes/AssinantesRevenueModal';
import { AssinantesListView } from '@/components/admin/assinantes/AssinantesListView';

const AdminAssinantes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = isAdminEmail(user?.email);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Payload | null>(null);
  const [legacyData, setLegacyData] = useState<LegacySubscriber[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Filtros de listagem
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Modos de visualização
  const [viewMode, setViewMode] = useState<'dashboard' | 'asaas' | 'play' | 'apple'>('dashboard');
  const [activeChart, setActiveChart] = useState<'mrr' | 'gross' | 'sales' | 'subs'>('mrr');
  const [selectedMonthId, setSelectedMonthId] = useState<string>('');

  // Modais
  const [modalDetails, setModalDetails] = useState<'mrr' | 'gross' | null>(null);
  const [funnelStage, setFunnelStage] = useState<'assinatura_aberta' | 'trial_click' | 'start_trial' | 'purchase' | null>(null);

  // Filtros do funil
  const [funnelPlatform, setFunnelPlatform] = useState<'asaas' | 'play' | 'apple'>('asaas');
  const [funnelDays, setFunnelDays] = useState<number>(7);

  const load = async (syncPlay = false, customDays?: number) => {
    setLoading(true);
    setError(null);
    const d = customDays !== undefined ? customDays : funnelDays;
    const { data: res, error: err } = await supabase.functions.invoke('play-billing', {
      body: { fn: 'reporting', sync: syncPlay, funnelDays: d },
    });
    if (err) {
      setError(err.message ?? 'Erro ao carregar dados locais');
    } else {
      setData(res as Payload);
      setLegacyData((res as Payload).legacy ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const funnelMetrics = useMemo(() => {
    if (!data?.funnel) return null;

    const filteredEvents = data.funnel.filter((e: any) => {
      if (e.event_name === 'assinatura_aberta') return true;
      const isWeb = e.metadata?.metodo === 'web' || e.metadata?.source === 'planos_page';
      if (funnelPlatform === 'asaas') return isWeb;
      if (funnelPlatform === 'play') return !isWeb && e.metadata?.platform !== 'ios';
      if (funnelPlatform === 'apple') return !isWeb && e.metadata?.platform === 'ios';
      return false;
    });

    return {
      assinatura_aberta: filteredEvents.filter((e: any) => e.event_name === 'assinatura_aberta'),
      trial_click: filteredEvents.filter((e: any) => e.event_name === 'trial_click'),
      start_trial: filteredEvents.filter((e: any) => e.event_name === 'start_trial'),
      purchase: filteredEvents.filter((e: any) => e.event_name === 'purchase'),
    };
  }, [data, funnelPlatform]);

  const combinedRows = useMemo(() => {
    const list: CombinedRow[] = [];
    if (data?.local?.rows) {
      for (const r of data.local.rows) {
        if (isAdminEmail(r.email)) continue;
        list.push({
          id: `${r.user_id}-${r.purchase_token}`,
          source: 'play',
          email: r.email,
          display_name: r.display_name,
          product_id: r.product_id,
          order_id: r.order_id,
          status: r.status,
          is_test: r.is_test,
          avatar_url: r.avatar_url,
          start_time: r.start_time,
          expires_at: r.expires_at,
          raw: r,
        });
      }
    }
    for (const r of legacyData) {
      if (isAdminEmail(r.email)) continue;
      list.push({
        id: r.id,
        source: r.asaas_subscription_id ? 'asaas' : 'old',
        email: r.email,
        display_name: r.nome,
        product_id: r.tipo,
        order_id: r.asaas_subscription_id ?? r.asaas_customer_id,
        status: r.status,
        is_test: false,
        avatar_url: null,
        start_time: r.created_at,
        expires_at: r.expires_at,
        observacao: r.observacao,
        raw: r,
      });
    }

    list.sort((a, b) => {
      const activeA = a.status === 'SUBSCRIPTION_STATE_ACTIVE' || a.status === 'active' ? 1 : 0;
      const activeB = b.status === 'SUBSCRIPTION_STATE_ACTIVE' || b.status === 'active' ? 1 : 0;
      if (activeA !== activeB) return activeB - activeA;
      return new Date(b.start_time ?? 0).getTime() - new Date(a.start_time ?? 0).getTime();
    });
    return list;
  }, [data, legacyData]);

  const platformRows = useMemo(() => {
    return combinedRows.filter((r) => {
      if (viewMode === 'asaas' && r.source !== 'asaas' && r.source !== 'old') return false;
      if (viewMode === 'play' && r.source !== 'play') return false;
      if (viewMode === 'apple' && r.source !== 'apple') return false;
      return true;
    });
  }, [combinedRows, viewMode]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return platformRows.filter((r) => {
      let matchesStatus = true;
      if (statusFilter !== 'all') {
        if (r.source === 'asaas') {
          if (statusFilter === 'SUBSCRIPTION_STATE_ACTIVE' && r.status !== 'active') matchesStatus = false;
          else if (statusFilter === 'SUBSCRIPTION_STATE_CANCELED' && r.status !== 'inactive') matchesStatus = false;
          else if (
            statusFilter !== 'SUBSCRIPTION_STATE_ACTIVE' &&
            statusFilter !== 'SUBSCRIPTION_STATE_CANCELED' &&
            r.status !== statusFilter
          )
            matchesStatus = false;
        } else {
          matchesStatus = r.status === statusFilter;
        }
      }
      if (!matchesStatus) return false;

      if (dateFilter !== 'all') {
        const now = new Date();
        const d = r.start_time ? new Date(r.start_time) : null;
        if (!d) return false;

        if (dateFilter === 'today') {
          if (
            d.getDate() !== now.getDate() ||
            d.getMonth() !== now.getMonth() ||
            d.getFullYear() !== now.getFullYear()
          )
            return false;
        } else if (dateFilter === 'month') {
          if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
        } else if (dateFilter === 'year') {
          if (d.getFullYear() !== now.getFullYear()) return false;
        }
      }

      if (!term) return true;
      return [r.email, r.display_name, r.product_id, r.order_id].some((v) =>
        (v ?? '').toLowerCase().includes(term)
      );
    });
  }, [platformRows, q, statusFilter, dateFilter]);

  const isActiveRecord = (r: CombinedRow) => {
    if (r.is_test) return false;
    const isPlay = r.source === 'play';
    const isCancelled =
      r.status === 'SUBSCRIPTION_STATE_CANCELED' ||
      r.status === 'inactive' ||
      (isPlay && r.raw?.auto_renewing === false);
    if (isCancelled) return false;
    return (
      r.status === 'SUBSCRIPTION_STATE_ACTIVE' ||
      r.status === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD' ||
      r.status === 'active'
    );
  };

  const revenue = useMemo(() => {
    const active = platformRows.filter(isActiveRecord);
    let mrr = 0;
    let lifetimeGross = 0;
    const planAgg: Record<string, { plan: string; count: number; mrr: number; gross: number }> = {};
    const mrrUsers: any[] = [];
    const grossUsers: any[] = [];

    platformRows
      .filter((r) => !r.is_test)
      .forEach((r) => {
        let monthly = 0;
        let sticker = 0;
        const p = priceFor(r.product_id);

        if (p) {
          monthly = p.monthly;
          sticker = p.sticker;
        }

        if (r.source === 'asaas' && r.observacao) {
          const obs = parseObservacao(r.observacao);
          if (obs && typeof obs.value === 'number') {
            sticker = obs.value;
            const prodId = r.product_id?.toLowerCase() ?? '';
            if (prodId.includes('anual')) monthly = sticker / 12;
            else if (prodId.includes('semestral')) monthly = sticker / 6;
            else if (prodId.includes('vitalicio')) monthly = 0;
            else monthly = sticker;
          }
        }

        if (!p && sticker === 0) return;

        if (sticker > 0) {
          grossUsers.push({ ...r, value: sticker, plan: r.product_id ?? 'desconhecido' });
        }

        if (!isActiveRecord(r)) return;

        mrr += monthly;
        lifetimeGross += sticker;
        const key = r.product_id ?? 'desconhecido';
        const cur = planAgg[key] ?? { plan: key, count: 0, mrr: 0, gross: 0 };
        cur.count += 1;
        cur.mrr += monthly;
        cur.gross += sticker;
        planAgg[key] = cur;

        if (monthly > 0) {
          mrrUsers.push({ ...r, value: monthly, plan: key });
        }
      });

    return {
      mrr,
      arr: mrr * 12,
      paying: active.length,
      avgTicket: active.length ? mrr / active.length : 0,
      lifetimeGross,
      byPlan: Object.values(planAgg).sort((a, b) => b.mrr - a.mrr),
      mrrUsers: mrrUsers.sort((a, b) => b.value - a.value),
      grossUsers: grossUsers.sort((a, b) => b.value - a.value),
    };
  }, [platformRows]);

  const grossAccumulated = useMemo(() => {
    return platformRows
      .filter((r) => !r.is_test)
      .reduce((sum, r) => sum + (priceFor(r.product_id)?.sticker ?? 0), 0);
  }, [platformRows]);

  const subsByMonth = useMemo(() => {
    const active = platformRows.filter((r) => !r.is_test);
    const agg: Record<string, number> = {};
    active.forEach((r) => {
      if (!r.start_time) return;
      const d = new Date(r.start_time);
      const m = d.toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
      agg[m] = (agg[m] ?? 0) + 1;
    });
    return Object.entries(agg)
      .map(([month, count]) => ({ month, count, total: count }))
      .reverse();
  }, [platformRows]);

  const monthlyRevenueData = useMemo(() => {
    const active = platformRows.filter((r) => !r.is_test);
    const monthsMap = new Map<
      string,
      { monthId: string; label: string; date: Date; plans: Record<string, number>; total: number }
    >();

    active.forEach((r) => {
      if (!r.start_time) return;
      const d = new Date(r.start_time);
      const monthId = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('pt-BR', { month: 'short', year: 'numeric' });

      let sticker = 0;
      const p = priceFor(r.product_id);
      if (p) sticker = p.sticker;

      if (r.source === 'asaas' && r.observacao) {
        const obs = parseObservacao(r.observacao);
        if (obs && typeof obs.value === 'number') {
          sticker = obs.value;
        }
      }

      if (sticker === 0) return;

      const planName = r.product_id ?? 'desconhecido';
      let m = monthsMap.get(monthId);
      if (!m) {
        m = { monthId, label, date: new Date(d.getFullYear(), d.getMonth(), 1), plans: {}, total: 0 };
        monthsMap.set(monthId, m);
      }

      m.plans[planName] = (m.plans[planName] ?? 0) + sticker;
      m.total += sticker;
    });

    return Array.from(monthsMap.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [platformRows]);

  const currentMonthData = useMemo(() => {
    if (monthlyRevenueData.length === 0) return null;
    const targetId = selectedMonthId || monthlyRevenueData[0].monthId;
    return monthlyRevenueData.find((m) => m.monthId === targetId) || monthlyRevenueData[0];
  }, [monthlyRevenueData, selectedMonthId]);

  const currentMonthChartData = useMemo(() => {
    if (!currentMonthData) return [];
    return Object.entries(currentMonthData.plans)
      .map(([plan, gross]) => ({ plan, gross }))
      .sort((a, b) => b.gross - a.gross);
  }, [currentMonthData]);

  const metrics = data?.local?.metrics ?? EMPTY_METRICS;
  const timeline = metrics.timeline;
  const testsCount = platformRows.filter((r) => r.is_test).length;

  if (!isAdmin) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-muted-foreground">
        Acesso restrito.
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background pb-20">
      <PageHeader
        title={
          viewMode === 'dashboard'
            ? 'Assinantes Gerais'
            : viewMode === 'asaas'
            ? 'Assinantes Asaas'
            : viewMode === 'play'
            ? 'Assinantes Google Play'
            : 'Assinantes iPhone'
        }
        subtitle={viewMode === 'dashboard' ? 'Asaas (Legado) + Google Play Billing' : ''}
        onBack={() => (viewMode === 'dashboard' ? navigate('/admin-funcoes') : setViewMode('dashboard'))}
        rightAction={
          <button
            onClick={() => load(false)}
            disabled={loading}
            aria-label="Recarregar Tela"
            className="w-11 h-11 rounded-full bg-muted flex items-center justify-center disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {viewMode === 'dashboard' && (
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setViewMode('asaas')}
              className="flex items-center justify-between p-2.5 rounded-xl border border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 transition-colors text-left group"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Crown className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <div className="font-bold text-foreground">Asaas</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setViewMode('play')}
              className="flex items-center justify-between p-2.5 rounded-xl border border-[#3DDC84]/20 bg-[#3DDC84]/10 hover:bg-[#3DDC84]/20 transition-colors text-left group"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#3DDC84]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <PlayCircle className="w-4 h-4 text-[#3DDC84]" />
                </div>
                <div>
                  <div className="font-bold text-foreground">Google Play</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setViewMode('apple')}
              className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-500/20 bg-zinc-500/10 hover:bg-zinc-500/20 transition-colors text-left group"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-zinc-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Smartphone className="w-4 h-4 text-zinc-400" />
                </div>
                <div>
                  <div className="font-bold text-foreground">Apple</div>
                </div>
              </div>
            </button>
          </div>
        )}

        {viewMode === 'dashboard' && (
          <>
            {funnelMetrics && (
              <AssinantesFunnelCard
                funnelMetrics={funnelMetrics}
                funnelDays={funnelDays}
                setFunnelDays={setFunnelDays}
                onDaysChange={(days) => load(false, days)}
                funnelPlatform={funnelPlatform}
                setFunnelPlatform={setFunnelPlatform}
                setFunnelStage={setFunnelStage}
              />
            )}

            <AssinantesRevenueCharts
              revenue={revenue}
              grossAccumulated={grossAccumulated}
              setModalDetails={setModalDetails}
              timeline={timeline}
              viewMode={viewMode}
              loading={loading}
              platformRowsCount={platformRows.length}
              testsCount={testsCount}
              activeChart={activeChart}
              setActiveChart={setActiveChart}
              currentMonthData={currentMonthData}
              selectedMonthId={selectedMonthId}
              setSelectedMonthId={setSelectedMonthId}
              monthlyRevenueData={monthlyRevenueData}
              currentMonthChartData={currentMonthChartData}
              subsByMonth={subsByMonth}
            />
          </>
        )}

        {viewMode !== 'dashboard' && (
          <AssinantesListView
            q={q}
            setQ={setQ}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            loading={loading}
            filtered={filtered}
            fmtBRL={fmtBRL}
            fmtDate={fmtDate}
            fmtDateTime={fmtDateTime}
            priceFor={priceFor}
            parseObservacao={parseObservacao}
          />
        )}
      </div>

      <AssinantesRevenueModal
        modalDetails={modalDetails}
        onClose={() => setModalDetails(null)}
        revenue={revenue}
        fmtBRL={fmtBRL}
      />

      <AssinantesFunnelModal
        funnelStage={funnelStage}
        onClose={() => setFunnelStage(null)}
        funnelMetrics={funnelMetrics}
        combinedRows={combinedRows}
      />
    </div>
  );
};

export default AdminAssinantes;