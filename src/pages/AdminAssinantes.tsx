import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Crown, AlertTriangle, Copy, ExternalLink, Search, Users, User, TrendingUp, XCircle, FlaskConical, CircleDollarSign, PieChart as PieIcon, PlayCircle, Smartphone, ArrowLeft, Filter } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { isAdminEmail } from '@/lib/adminEmails';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend, BarChart, Bar, Cell,
} from 'recharts';

type LocalRow = {
  user_id: string;
  product_id: string | null;
  base_plan_id: string | null;
  purchase_token: string | null;
  order_id: string | null;
  status: string;
  auto_renewing: boolean | null;
  start_time: string | null;
  expires_at: string | null;
  cancel_reason: string | null;
  updated_at: string | null;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  is_test: boolean;
};

type LegacySubscriber = {
  id: string;
  email: string;
  nome: string | null;
  tipo: string;
  asaas_customer_id: string | null;
  asaas_subscription_id: string | null;
  expires_at: string | null;
  status: string;
  created_at: string;
  observacao?: string | null;
};

type CombinedRow = {
  id: string;
  source: 'play' | 'asaas' | 'old' | 'apple';
  email: string | null;
  display_name: string | null;
  product_id: string | null;
  order_id: string | null;
  status: string;
  is_test: boolean;
  avatar_url: string | null;
  start_time: string | null;
  expires_at: string | null;
  observacao?: string | null;
  raw?: any;
};

type Metrics = {
  ativosHoje: number;
  novos7: number;
  cancelados7: number;
  renovacoes30: number;
  timeline: { date: string; label: string; ativos: number; novos: number; cancelados: number; renovacoes: number }[];
};

type SyncInfo = {
  checked?: number;
  updated?: number;
  errors?: { status: number; message: string }[];
  lastSyncAt?: string;
  error?: string;
};

type Payload = {
  sync: SyncInfo | null;
  local: {
    rows: LocalRow[];
    stats: { total: number; active: number; test: number; byPlan: Record<string, number> };
    metrics: Metrics;
  };
  legacy: LegacySubscriber[];
  funnel: any[];
  packageName: string;
  serviceAccountEmail: string | null;
};

// Preços vigentes (BRL) — usados para estimar MRR/ARR/receita acumulada
const PRICE_TABLE: Record<string, { monthly: number; sticker: number; period: 'mensal' | 'anual' | 'semestral' | 'vitalicio' }> = {
  prime_premium_mensal: { monthly: 29.9, sticker: 29.9, period: 'mensal' },
  prime_premium_anual: { monthly: 199.9 / 12, sticker: 199.9, period: 'anual' },
  // Asaas legacy
  mensal: { monthly: 29.9, sticker: 29.9, period: 'mensal' },
  anual: { monthly: 199.9 / 12, sticker: 199.9, period: 'anual' },
  semestral: { monthly: 119.9 / 6, sticker: 119.9, period: 'semestral' },
  vitalicio: { monthly: 0, sticker: 299.9, period: 'vitalicio' },
};

const priceFor = (productId: string | null) => {
  if (!productId) return null;
  return PRICE_TABLE[productId] ?? null;
};

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  SUBSCRIPTION_STATE_ACTIVE: { label: 'Ativa', cls: 'bg-emerald-500/15 text-emerald-500' },
  SUBSCRIPTION_STATE_IN_GRACE_PERIOD: { label: 'Em graça', cls: 'bg-amber-500/15 text-amber-500' },
  SUBSCRIPTION_STATE_ON_HOLD: { label: 'Em espera', cls: 'bg-orange-500/15 text-orange-500' },
  SUBSCRIPTION_STATE_PAUSED: { label: 'Pausada', cls: 'bg-slate-500/15 text-slate-400' },
  SUBSCRIPTION_STATE_CANCELED: { label: 'Cancelada', cls: 'bg-rose-500/15 text-rose-500' },
  SUBSCRIPTION_STATE_EXPIRED: { label: 'Expirada', cls: 'bg-muted text-muted-foreground' },
  SUBSCRIPTION_STATE_PENDING: { label: 'Pendente', cls: 'bg-blue-500/15 text-blue-500' },
  // Asaas statuses
  active: { label: 'Ativa', cls: 'bg-emerald-500/15 text-emerald-500' },
  inactive: { label: 'Cancelada', cls: 'bg-rose-500/15 text-rose-500' },
};

const fmtDate = (iso: string | null) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
};

const fmtDateTime = (iso: string | null) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', ' às'); }
  catch { return '—'; }
};

const parseObservacao = (obs: string | null) => {
  if (!obs) return null;
  try { return JSON.parse(obs); } catch { return null; }
};

const EMPTY_METRICS: Metrics = { ativosHoje: 0, novos7: 0, cancelados7: 0, renovacoes30: 0, timeline: [] };

const AdminAssinantes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = isAdminEmail(user?.email);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Payload | null>(null);
  const [legacyData, setLegacyData] = useState<LegacySubscriber[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [activeChart, setActiveChart] = useState<'mrr' | 'gross' | 'sales' | 'subs'>('mrr');
  const [viewMode, setViewMode] = useState<'dashboard' | 'asaas' | 'play' | 'apple'>('dashboard');
  const [selectedMonthId, setSelectedMonthId] = useState<string>('');
  const [syncingAsaas, setSyncingAsaas] = useState(false);
  const [modalDetails, setModalDetails] = useState<'mrr' | 'gross' | null>(null);
  const [funnelStage, setFunnelStage] = useState<'assinatura_aberta' | 'trial_click' | 'start_trial' | 'purchase' | null>(null);
  const [funnelPlatform, setFunnelPlatform] = useState<'asaas' | 'play' | 'apple'>('asaas');

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
      purchase: filteredEvents.filter((e: any) => e.event_name === 'purchase')
    };
  }, [data, funnelPlatform]);

  const load = async (syncPlay = false) => {
    setLoading(true); setError(null);
    const { data: res, error: err } = await supabase.functions.invoke('play-billing', { body: { fn: 'reporting', sync: syncPlay, funnelDays: 7 } });
    if (err) {
      setError(err.message ?? 'Erro ao carregar dados locais');
    } else {
      setData(res as Payload);
      setLegacyData((res as Payload).legacy ?? []);
    }

    setLoading(false);
  };

  const handleSyncAll = async () => {
    setSyncingAsaas(true);
    try {
      // 1. Sincronizar Asaas
      const { data: syncData, error: syncErr } = await supabase.functions.invoke('legacy-sync', {
        body: { action: 'sync', apply: true, sources: ['asaas', 'old'] }
      });
      if (syncErr) throw syncErr;
      
      // 2. Sincronizar Google Play e carregar tudo
      await load(true);
      
      if (syncData?.errors?.asaas || syncData?.errors?.old) {
        toast.warning('Sincronizado (Play + Asaas), mas com alguns avisos (ver console)');
        console.warn('Erros de sync Asaas:', syncData.errors);
      } else {
        toast.success(`Sincronização completa concluída! Play & Asaas atualizados.`);
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao sincronizar plataformas');
    } finally {
      setSyncingAsaas(false);
    }
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const combinedRows = useMemo(() => {
    const list: CombinedRow[] = [];
    if (data?.local?.rows) {
      for (const r of data.local.rows) {
        if (isAdminEmail(r.email)) continue; // Remove testes do admin
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
          raw: r
        });
      }
    }
    for (const r of legacyData) {
      if (isAdminEmail(r.email)) continue; // Remove testes do admin
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
        raw: r
      });
    }
    // Sort by most recently active or created to put at top
    list.sort((a, b) => {
      const activeA = (a.status === 'SUBSCRIPTION_STATE_ACTIVE' || a.status === 'active') ? 1 : 0;
      const activeB = (b.status === 'SUBSCRIPTION_STATE_ACTIVE' || b.status === 'active') ? 1 : 0;
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
      // Normalizar filtro de status para "Ativas" e "Canceladas" no Asaas
      let matchesStatus = true;
      if (statusFilter !== 'all') {
        if (r.source === 'asaas') {
          // No Asaas, status é 'active' ou 'inactive'
          if (statusFilter === 'SUBSCRIPTION_STATE_ACTIVE' && r.status !== 'active') matchesStatus = false;
          else if (statusFilter === 'SUBSCRIPTION_STATE_CANCELED' && r.status !== 'inactive') matchesStatus = false;
          else if (statusFilter !== 'SUBSCRIPTION_STATE_ACTIVE' && statusFilter !== 'SUBSCRIPTION_STATE_CANCELED' && r.status !== statusFilter) matchesStatus = false;
        } else {
          matchesStatus = r.status === statusFilter;
        }
      }
      if (!matchesStatus) return false;
      
      // Date filter
      if (dateFilter !== 'all') {
        const now = new Date();
        const d = r.start_time ? new Date(r.start_time) : null;
        if (!d) return false;
        
        if (dateFilter === 'today') {
          if (d.getDate() !== now.getDate() || d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
        } else if (dateFilter === 'month') {
          if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
        } else if (dateFilter === 'year') {
          if (d.getFullYear() !== now.getFullYear()) return false;
        }
      }

      if (!term) return true;
      return [r.email, r.display_name, r.product_id, r.order_id].some((v) =>
        (v ?? '').toLowerCase().includes(term),
      );
    });
  }, [platformRows, q, statusFilter, dateFilter]);

  const sync = data?.sync ?? null;
  const syncErrors = sync?.errors?.filter(e => e.status !== 400 && e.status !== 404 && e.status !== 410) ?? [];
  const syncFatal = sync?.error ?? null;
  const sync403 = syncErrors.some((e) => e.status === 401 || e.status === 403);

  const metrics = data?.local.metrics ?? EMPTY_METRICS;
  const activeToday = metrics.ativosHoje + legacyData.filter(r => r.status === 'active' && !isAdminEmail(r.email)).length;
  
  const isActiveRecord = (r: CombinedRow) => {
    if (r.is_test) return false;
    const isPlay = r.source === 'play';
    const isCancelled = r.status === 'SUBSCRIPTION_STATE_CANCELED' || r.status === 'inactive' || (isPlay && r.raw?.auto_renewing === false);
    if (isCancelled) return false;
    return r.status === 'SUBSCRIPTION_STATE_ACTIVE' || r.status === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD' || r.status === 'active';
  };

  const newLast7 = metrics.novos7;
  const canceledLast7 = metrics.cancelados7;
  const renewals30 = metrics.renovacoes30;
  const timeline = metrics.timeline; // A timeline de assinaturas do Play Store continua a mesma (não mistura)

  // Receita estimada com base nos assinantes ativos NÃO-teste e preços vigentes
  const revenue = useMemo(() => {
    const active = platformRows.filter(isActiveRecord);
    let mrr = 0;
    let lifetimeGross = 0;
    const planAgg: Record<string, { plan: string; count: number; mrr: number; gross: number }> = {};
    const mrrUsers: any[] = [];
    const grossUsers: any[] = [];
    
    platformRows.filter(r => !r.is_test).forEach((r) => {
      let monthly = 0;
      let sticker = 0;
      const p = priceFor(r.product_id);
      
      if (p) {
        monthly = p.monthly;
        sticker = p.sticker;
      }
      
      // Override with actual Asaas values if available
      if (r.source === 'asaas' && r.observacao) {
        const obs = parseObservacao(r.observacao);
        if (obs && typeof obs.value === 'number') {
           sticker = obs.value;
           const prodId = r.product_id?.toLowerCase() ?? '';
           if (prodId.includes('anual')) monthly = sticker / 12;
           else if (prodId.includes('semestral')) monthly = sticker / 6;
           else if (prodId.includes('vitalicio')) monthly = 0; // MRR remains 0 for lifetime
           else monthly = sticker; // Assume monthly by default
        }
      }

      if (!p && sticker === 0) return; // Skip completely unknown plans with 0 value

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

    // Soma a receita bruta de quem foi cancelado também
    platformRows.filter((r) => !r.is_test).forEach((r) => {
      const p = priceFor(r.product_id);
      if (p) lifetimeGross += 0; // já somamos no loop anterior, gross acumulado está abaixo
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
    const active = platformRows.filter(r => !r.is_test);
    const agg: Record<string, number> = {};
    active.forEach(r => {
      if (!r.start_time) return;
      const d = new Date(r.start_time);
      const m = d.toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
      agg[m] = (agg[m] ?? 0) + 1;
    });
    return Object.entries(agg).map(([month, count]) => ({ month, count })).reverse();
  }, [platformRows]);

  const monthlyRevenueData = useMemo(() => {
    const active = platformRows.filter(r => !r.is_test);
    const monthsMap = new Map<string, { monthId: string; label: string; date: Date; plans: Record<string, number>; total: number }>();

    active.forEach(r => {
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
    return monthlyRevenueData.find(m => m.monthId === targetId) || monthlyRevenueData[0];
  }, [monthlyRevenueData, selectedMonthId]);

  const currentMonthChartData = useMemo(() => {
    if (!currentMonthData) return [];
    return Object.entries(currentMonthData.plans)
      .map(([plan, gross]) => ({ plan, gross }))
      .sort((a, b) => b.gross - a.gross);
  }, [currentMonthData]);

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
        title={viewMode === 'dashboard' ? "Assinantes Gerais" : viewMode === 'asaas' ? 'Assinantes Asaas' : viewMode === 'play' ? 'Assinantes Google Play' : 'Assinantes iPhone'}
        subtitle={viewMode === 'dashboard' ? "Asaas (Legado) + Google Play Billing" : ''}
        onBack={() => viewMode === 'dashboard' ? navigate('/admin-funcoes') : setViewMode('dashboard')}
        rightAction={
          <button onClick={() => load(false)} disabled={loading} aria-label="Recarregar Tela" className="w-11 h-11 rounded-full bg-muted flex items-center justify-center disabled:opacity-50">
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

            <button onClick={() => setViewMode('asaas')} className="flex items-center justify-between p-2.5 rounded-xl border border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 transition-colors text-left group">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Crown className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <div className="font-bold text-foreground">Asaas</div>
                  
                </div>
              </div>
            </button>
            
            <button onClick={() => setViewMode('play')} className="flex items-center justify-between p-2.5 rounded-xl border border-[#3DDC84]/20 bg-[#3DDC84]/10 hover:bg-[#3DDC84]/20 transition-colors text-left group">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#3DDC84]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <PlayCircle className="w-4 h-4 text-[#3DDC84]" />
                </div>
                <div>
                  <div className="font-bold text-foreground">Google Play</div>
                  
                </div>
              </div>
            </button>
            
            <button onClick={() => setViewMode('apple')} className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-500/20 bg-zinc-500/10 hover:bg-zinc-500/20 transition-colors text-left group">
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
            {/* Funil de Assinatura */}
            {funnelMetrics && (
              <section className="bg-card rounded-2xl border border-border p-2.5 md:p-4 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-3 justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-500/10 rounded-xl">
                      <Filter className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h2 className="font-black text-base">Funil de Conversão</h2>
                      <p className="text-[10px] text-muted-foreground">Últimos 7 dias</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => navigate('/admin/funil')}
                    className="absolute top-2.5 md:p-4 right-5 text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors border border-blue-500/20"
                  >
                    Ver completo
                  </button>
                  
                  {/* Toggle Plataforma do Funil */}
                  <div className="flex items-center bg-muted/50 rounded-full p-0.5 border border-border/50">
                    <button
                      onClick={() => setFunnelPlatform('asaas')}
                      className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors ${
                        funnelPlatform === 'asaas' 
                          ? 'bg-blue-500 text-white shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Asaas
                    </button>
                    <button
                      onClick={() => setFunnelPlatform('play')}
                      className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors ${
                        funnelPlatform === 'play' 
                          ? 'bg-[#3DDC84] text-white shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Play
                    </button>
                    <button
                      onClick={() => setFunnelPlatform('apple')}
                      className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors ${
                        funnelPlatform === 'apple' 
                          ? 'bg-zinc-700 text-white shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Apple
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div 
                    onClick={() => setFunnelStage('assinatura_aberta')}
                    className="relative cursor-pointer hover:bg-background/40 transition-colors rounded-xl border border-border p-2.5 flex justify-between items-center overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-full bg-blue-500/10 pointer-events-none" />
                    <span className="text-sm font-medium relative z-10">1. Acessaram a tela de Planos</span>
                    <span className="font-bold text-blue-500 relative z-10">{funnelMetrics.assinatura_aberta.length}</span>
                  </div>
                  
                  <div 
                    onClick={() => setFunnelStage('trial_click')}
                    className="relative cursor-pointer hover:bg-background/40 transition-colors rounded-xl border border-border p-2.5 flex justify-between items-center overflow-hidden ml-4"
                  >
                    <div 
                      className="absolute left-0 top-0 bottom-0 bg-blue-500/20 pointer-events-none transition-all" 
                      style={{ width: funnelMetrics.assinatura_aberta.length ? `${(funnelMetrics.trial_click.length / funnelMetrics.assinatura_aberta.length) * 100}%` : '0%' }}
                    />
                    <span className="text-sm font-medium relative z-10">2. Clicaram em Assinar / Ver Modal</span>
                    <div className="flex items-center gap-2.5 relative z-10">
                      {funnelMetrics.assinatura_aberta.length > 0 && (
                        <span className="text-xs text-muted-foreground">{Math.min(100, Math.round((funnelMetrics.trial_click.length / funnelMetrics.assinatura_aberta.length) * 100))}%</span>
                      )}
                      <span className="font-bold text-blue-500">{funnelMetrics.trial_click.length}</span>
                    </div>
                  </div>
                  
                  <div 
                    onClick={() => setFunnelStage('start_trial')}
                    className="relative cursor-pointer hover:bg-background/40 transition-colors rounded-xl border border-border p-2.5 flex justify-between items-center overflow-hidden ml-8"
                  >
                    <div 
                      className="absolute left-0 top-0 bottom-0 bg-blue-500/30 pointer-events-none transition-all" 
                      style={{ width: funnelMetrics.trial_click.length ? `${(funnelMetrics.start_trial.length / funnelMetrics.trial_click.length) * 100}%` : '0%' }}
                    />
                    <span className="text-sm font-medium relative z-10">3. Iniciaram Checkout / Teste Grátis</span>
                    <div className="flex items-center gap-2.5 relative z-10">
                      {funnelMetrics.trial_click.length > 0 && (
                        <span className="text-xs text-muted-foreground">{Math.min(100, Math.round((funnelMetrics.start_trial.length / funnelMetrics.trial_click.length) * 100))}%</span>
                      )}
                      <span className="font-bold text-blue-500">{funnelMetrics.start_trial.length}</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => setFunnelStage('purchase')}
                    className="relative cursor-pointer hover:bg-background/40 transition-colors rounded-xl border border-border p-2.5 flex justify-between items-center overflow-hidden ml-12"
                  >
                    <div 
                      className="absolute left-0 top-0 bottom-0 bg-blue-500/40 pointer-events-none transition-all" 
                      style={{ width: funnelMetrics.start_trial.length ? `${(funnelMetrics.purchase.length / funnelMetrics.start_trial.length) * 100}%` : '0%' }}
                    />
                    <span className="text-sm font-medium relative z-10">4. Pagamento Confirmado</span>
                    <div className="flex items-center gap-2.5 relative z-10">
                      {funnelMetrics.start_trial.length > 0 && (
                        <span className="text-xs text-muted-foreground">{Math.min(100, Math.round((funnelMetrics.purchase.length / funnelMetrics.start_trial.length) * 100))}%</span>
                      )}
                      <span className="font-bold text-blue-500">{funnelMetrics.purchase.length}</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

        {viewMode === 'dashboard' && (
          <>
            <section className="rounded-2xl overflow-hidden border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-transparent p-4 md:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <CircleDollarSign className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Receita recorrente estimada</div>
                    <div className="text-xs text-muted-foreground">com base em {revenue.paying} assinante(s) pagante(s)</div>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full bg-background/60 text-muted-foreground">BRL</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <RevenueCard label="MRR" value={fmtBRL(revenue.mrr)} hint="mensal" accent="from-amber-500 to-orange-500" onClick={() => setModalDetails('mrr')} />
                <RevenueCard label="ARR" value={fmtBRL(revenue.arr)} hint="anualizado" accent="from-emerald-500 to-teal-500" />
                <RevenueCard label="Ticket médio" value={fmtBRL(revenue.avgTicket)} hint="por assinante/mês" accent="from-blue-500 to-cyan-500" />
                <RevenueCard label="Bruto acumulado" value={fmtBRL(grossAccumulated)} hint="ciclos vendidos" accent="from-purple-500 to-fuchsia-500" onClick={() => setModalDetails('gross')} />
              </div>
            </section>

            {/* Gráfico timeline (Apenas Play Billing) */}
            {timeline.length > 0 && (
              <section className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold">Evolução Play (últimos 30 dias)</h2>
                </div>
                <div className="h-56 -ml-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeline}>
                      <defs>
                        <linearGradient id="gNovos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(217 91% 60%)" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gCanc" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(346 87% 60%)" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="hsl(346 87% 60%)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gAtivos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(160 84% 45%)" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="hsl(160 84% 45%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="label" fontSize={10} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                      <YAxis fontSize={10} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} width={28} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Area type="monotone" dataKey="ativos" name="Ativos" stroke="hsl(160 84% 45%)" fill="url(#gAtivos)" strokeWidth={2} />
                      <Area type="monotone" dataKey="novos" name="Novos" stroke="hsl(217 91% 60%)" fill="url(#gNovos)" strokeWidth={2} />
                      <Area type="monotone" dataKey="cancelados" name="Cancelados" stroke="hsl(346 87% 60%)" fill="url(#gCanc)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            }

            {/* Métricas locais */}
            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
                Visão Geral {viewMode !== 'dashboard' && `(${viewMode === 'asaas' ? 'Asaas' : viewMode === 'play' ? 'Google Play' : 'Apple'})`}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <StatCard icon={Users} label="Total registradas" value={loading ? '…' : platformRows.length} tint="text-primary" />
                <StatCard icon={Crown} label="Premium agora" value={loading ? '…' : revenue.paying} tint="text-amber-500" />
                <StatCard icon={FlaskConical} label="Testes" value={loading ? '…' : platformRows.filter(r => r.is_test || (r.source === 'play' && r.status === 'SUBSCRIPTION_STATE_ACTIVE' && r.raw?.auto_renewing !== false && new Date(r.expires_at ?? 0).getTime() - new Date(r.start_time ?? 0).getTime() <= 3.1 * 24 * 60 * 60 * 1000 && new Date(r.expires_at ?? 0).getTime() > Date.now())).length} tint="text-purple-500" />
                <StatCard icon={TrendingUp} label="SKUs ativos" value={loading ? '…' : revenue.byPlan.length} tint="text-cyan-500" />
              </div>
              {revenue.byPlan.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <PieIcon className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-semibold">Análise de Assinaturas</h3>
                    </div>
                    <div className="flex items-center rounded-lg bg-muted p-1 text-xs">
                      <button onClick={() => setActiveChart('mrr')} className={`px-2 py-1 rounded-md transition-colors ${activeChart === 'mrr' ? 'bg-background shadow-sm font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>MRR</button>
                      <button onClick={() => setActiveChart('gross')} className={`px-2 py-1 rounded-md transition-colors ${activeChart === 'gross' ? 'bg-background shadow-sm font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Faturamento</button>
                      <button onClick={() => setActiveChart('sales')} className={`px-2 py-1 rounded-md transition-colors ${activeChart === 'sales' ? 'bg-background shadow-sm font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Vendas Mês</button>
                      <button onClick={() => setActiveChart('subs')} className={`px-2 py-1 rounded-md transition-colors ${activeChart === 'subs' ? 'bg-background shadow-sm font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Volume</button>
                    </div>
                  </div>

                  {activeChart === 'sales' && currentMonthData && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <select
                          value={selectedMonthId || currentMonthData.monthId}
                          onChange={(e) => setSelectedMonthId(e.target.value)}
                          className="text-xs bg-muted border border-border rounded-md px-2 py-1 outline-none"
                        >
                          {monthlyRevenueData.map(m => (
                            <option key={m.monthId} value={m.monthId}>{m.label}</option>
                          ))}
                        </select>
                        <span className="text-xs font-bold text-primary">Faturamento Total: {fmtBRL(currentMonthData.total)}</span>
                      </div>
                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={currentMonthChartData} layout="vertical" margin={{ left: 4, right: 12 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                            <XAxis type="number" fontSize={10} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R$${v.toFixed(0)}`} />
                            <YAxis type="category" dataKey="plan" fontSize={10} width={110} stroke="hsl(var(--muted-foreground))" />
                            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} formatter={(v: any) => fmtBRL(Number(v))} />
                            <Bar dataKey="gross" name="Vendas (Bruto)" radius={[0, 6, 6, 0]}>
                              {currentMonthChartData.map((_, i) => <Cell key={i} fill={['hsl(280 65% 60%)', 'hsl(217 91% 60%)', 'hsl(160 84% 45%)', 'hsl(0 96% 56%)'][i % 4]} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {activeChart === 'mrr' && (
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenue.byPlan.filter(p => p.mrr > 0)} layout="vertical" margin={{ left: 4, right: 12 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                          <XAxis type="number" fontSize={10} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R$${v.toFixed(0)}`} />
                          <YAxis type="category" dataKey="plan" fontSize={10} width={110} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} formatter={(v: any) => fmtBRL(Number(v))} />
                          <Bar dataKey="mrr" name="MRR Mensal" radius={[0, 6, 6, 0]}>
                            {revenue.byPlan.map((_, i) => <Cell key={i} fill={['hsl(0 96% 56%)', 'hsl(160 84% 45%)', 'hsl(217 91% 60%)', 'hsl(280 65% 60%)'][i % 4]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {activeChart === 'gross' && (
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenue.byPlan.filter(p => p.gross > 0)} layout="vertical" margin={{ left: 4, right: 12 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                          <XAxis type="number" fontSize={10} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R$${v.toFixed(0)}`} />
                          <YAxis type="category" dataKey="plan" fontSize={10} width={110} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} formatter={(v: any) => fmtBRL(Number(v))} />
                          <Bar dataKey="gross" name="Faturamento Total" radius={[0, 6, 6, 0]}>
                            {revenue.byPlan.map((_, i) => <Cell key={i} fill={['hsl(217 91% 60%)', 'hsl(160 84% 45%)', 'hsl(280 65% 60%)', 'hsl(0 96% 56%)'][i % 4]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {activeChart === 'subs' && (
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={subsByMonth} margin={{ left: 4, right: 4, top: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis dataKey="month" fontSize={10} stroke="hsl(var(--muted-foreground))" />
                          <YAxis fontSize={10} stroke="hsl(var(--muted-foreground))" width={24} />
                          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                          <Bar dataKey="total" name="Total Ativas" fill="hsl(160 84% 45%)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}
            </section>
          </>
        )}

        {/* LISTA FILTRADA */}
        {viewMode !== 'dashboard' && (
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
                // Tenta extrair o nome do email (ex: "carolinavergilino04@..." -> "Carolina Vergilino")
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
        )}
      </div>

      {/* Modal Details */}
      {modalDetails && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card w-full sm:max-w-2xl sm:rounded-2xl border-t sm:border border-border/50 shadow-2xl flex flex-col h-[85vh] sm:h-[80vh] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-4">
            <div className="flex items-center justify-between p-4 border-b border-border/50 shrink-0">
              <div>
                <h3 className="font-bold text-lg">
                  {modalDetails === 'mrr' ? 'Composição do MRR' : 'Composição do Bruto Acumulado'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {modalDetails === 'mrr' ? 'Apenas assinaturas ativas com valor mensal' : 'Todas as vendas (inclui cancelados e vitalício)'}
                </p>
              </div>
              <button onClick={() => setModalDetails(null)} className="p-2 hover:bg-muted rounded-full">
                <AlertTriangle className="w-5 h-5 text-muted-foreground hidden" />
                <span className="sr-only">Fechar</span>
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {(modalDetails === 'mrr' ? revenue.mrrUsers : revenue.grossUsers).map((u: any) => (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <span className="text-sm font-medium truncate">{u.display_name || u.email || 'Usuário'}</span>
                    <span className="text-xs text-muted-foreground truncate">{u.email}</span>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-background border border-border text-foreground">
                        {u.plan}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold ${
                        u.source === 'asaas' ? 'bg-blue-500 text-white' :
                        u.source === 'old' ? 'bg-amber-500 text-white' :
                        u.source === 'play' ? 'bg-[#3DDC84] text-black' :
                        'bg-zinc-700 text-white'
                      }`}>
                        {u.source}
                      </span>
                      {u.status !== 'active' && u.status !== 'SUBSCRIPTION_STATE_ACTIVE' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive font-bold uppercase tracking-wider">
                          Inativo
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className="font-bold text-foreground">{fmtBRL(u.value)}</div>
                    <div className="text-[10px] text-muted-foreground">{modalDetails === 'mrr' ? '/mês' : 'total'}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-border/50 shrink-0 bg-muted/10 flex justify-between items-center rounded-b-2xl">
              <span className="text-sm font-medium text-muted-foreground">Total Listado:</span>
              <span className="text-lg font-bold">
                {fmtBRL((modalDetails === 'mrr' ? revenue.mrrUsers : revenue.grossUsers).reduce((acc: number, u: any) => acc + u.value, 0))}
              </span>
            </div>
          </div>
        </div>
      )}
      {funnelStage && funnelMetrics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl border border-border flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">
                  {funnelStage === 'assinatura_aberta' ? 'Acessaram a tela de Planos' : 
                   funnelStage === 'trial_click' ? 'Clicaram em Assinar / Ver Modal' : 
                   funnelStage === 'start_trial' ? 'Iniciaram Checkout / Teste Grátis' :
                   'Pagamento Confirmado'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {
                    Object.keys(
                      funnelMetrics[funnelStage].reduce((acc: any, ev: any) => {
                        const key = ev.email || ev.user_id || 'anonymous';
                        acc[key] = true;
                        return acc;
                      }, {})
                    ).length
                  } usuário(s) único(s) em {funnelMetrics[funnelStage].length} evento(s)
                </p>
              </div>
              <button onClick={() => setFunnelStage(null)} className="p-2 rounded-full hover:bg-muted text-muted-foreground">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {funnelMetrics[funnelStage].length === 0 ? (
                <div className="text-center text-muted-foreground p-8">Nenhum evento registrado.</div>
              ) : (
                Object.values(
                  funnelMetrics[funnelStage].reduce((acc: any, ev: any) => {
                    const key = ev.email || ev.user_id || 'anonymous';
                    if (!acc[key]) acc[key] = { ...ev, count: 1 };
                    else acc[key].count += 1;
                    return acc;
                  }, {})
                ).map((ev: any, idx: number) => {
                  // Procura correspondência nos assinantes reais (Play Billing ou Asaas)
                  const match = combinedRows.find(r => r.email === ev.email || (ev.user_id && r.id?.includes(ev.user_id)));
                  // Ignoramos a tag 'Concluído' para os usuários Asaas antigos (old)
                  const isConcluded = match && (match.status === 'active' || match.status === 'ACTIVE' || match.status === 'SUBSCRIPTION_STATE_ACTIVE') && match.source !== 'old';

                  return (
                    <div key={idx} className="p-3 rounded-lg border border-border bg-muted/30">
                      <div className="flex items-start justify-between gap-3">
                        
                        {/* Avatar do Usuário */}
                        <div className="mt-1">
                          {match?.avatar_url ? (
                            <img src={match.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full border border-border/50 object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border/50">
                              <User className="w-4 h-4 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="font-medium text-sm break-all">{ev.email || 'Usuário Anônimo'}</div>
                            {ev.count > 1 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-500 font-bold">
                                {ev.count} vezes
                              </span>
                            )}
                            {isConcluded ? (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#3DDC84] text-black font-extrabold uppercase tracking-wider">
                                Concluído ({match.source})
                              </span>
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground font-bold uppercase tracking-wider">
                                Não Concluído
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground">ID: {ev.user_id || 'Não logado'}</div>
                          
                          {match && match.order_id && (
                            <div className="text-[10px] text-amber-500 mt-1 truncate">
                              Pedido: {match.order_id}
                            </div>
                          )}

                          {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {ev.metadata.plano && (
                                <span className="text-[10px] bg-red-500/20 text-red-400 font-medium px-2 py-0.5 rounded-full border border-red-500/30">
                                  Plano: {String(ev.metadata.plano).replace('_', ' ')}
                                </span>
                              )}
                              {ev.metadata.dias && (
                                <span className="text-[10px] bg-purple-500/20 text-purple-300 font-medium px-2 py-0.5 rounded-full border border-purple-500/30">
                                  {ev.metadata.dias} dias de teste
                                </span>
                              )}
                              {ev.metadata.value !== undefined && (
                                <span className="text-[10px] bg-green-500/20 text-green-400 font-medium px-2 py-0.5 rounded-full border border-green-500/30">
                                  {ev.metadata.currency || 'BRL'} {ev.metadata.value}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground whitespace-nowrap bg-background px-2 py-1 rounded-full border border-border">
                          {new Date(ev.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tint }: { icon: any; label: string; value: number | string; tint: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className={`w-3.5 h-3.5 ${tint}`} /> {label}
      </div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}

const RevenueCard = ({
  label,
  value,
  hint,
  accent,
  onClick,
}: {
  label: string;
  value: string;
  hint: string;
  accent: string;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className={`rounded-xl border border-border/50 bg-card p-3 relative overflow-hidden group ${onClick ? 'cursor-pointer hover:border-border transition-colors' : ''}`}
  >
    <div className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r ${accent} opacity-50`} />
    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1">
      {label}
    </div>
    <div className="text-lg font-bold tracking-tight text-foreground">{value}</div>
    <div className="text-[10px] text-muted-foreground mt-1">{hint}</div>
  </div>
);

export default AdminAssinantes;