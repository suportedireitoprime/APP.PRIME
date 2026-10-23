import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gauge, Users, CheckCircle2, Search, RefreshCw,
  Crown, Flame, ShieldAlert, Clock, ArrowUpDown,
  Layers, Sparkles, ExternalLink, Zap
} from 'lucide-react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { ShapeGrid } from '@/components/ui/ShapeGrid';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { isAdminEmail } from '@/lib/adminEmails';
import { useGoBack } from '@/hooks/useGoBack';
import { toast } from 'sonner';
import { inicioCiclo, fimCiclo, diasParaRenovar, contarUsos, CICLO_DIAS } from '@/lib/cotaCiclo';
import { loadLimits, type FeatureLimitConfig } from '@/hooks/useFeatureLimit';
import { UserDossieSheet } from '@/components/admin/UserDossieSheet';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  email: string | null;
  display_name?: string | null;
  nome_completo?: string | null;
  is_premium?: boolean;
  created_at: string;
  avatar_url?: string | null;
}

interface UserCotaStats {
  user: UserProfile;
  totalUsos: number;
  funcoesUsadas: Record<string, number>;
  funcoesEsgotadas: { feature_key: string; label: string; used: number; limit: number }[];
  percentualGeral: number;
  temCotaEsgotada: boolean;
  diasRestantes: number;
  dataInicioCiclo: Date;
  dataFimCiclo: Date;
  bloqueioEventosCount: number;
  ultimoUso?: string | null;
}

type TabType = 'esgotadas' | 'ranking' | 'por_funcao' | 'bloqueados';
type FilterUserType = 'todos' | 'gratuitos' | 'assinantes';

const USERS_CACHE_KEY = 'admin_usuarios_list_v2';
const COTAS_CACHE_KEY = 'admin_cotas_stats_cache_v2';
const COTAS_CACHE_TTL = 5 * 60 * 1000; // 5 minutos de cache automático

let memoryCotasStats: UserCotaStats[] | null = null;
let memoryCotasLimits: FeatureLimitConfig[] | null = null;
let memoryCotasTimestamp: number = 0;

export default function AdminCotasAnalise() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { user: currentUser } = useAuth();
  const isAdmin = isAdminEmail(currentUser?.email);

  const [loading, setLoading] = useState(() => !memoryCotasStats || memoryCotasStats.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [limits, setLimits] = useState<FeatureLimitConfig[]>(() => memoryCotasLimits || []);
  const [usageStats, setUsageStats] = useState<UserCotaStats[]>(() => memoryCotasStats || []);
  const [selectedUserDossie, setSelectedUserDossie] = useState<any | null>(null);
  const [ultimoSync, setUltimoSync] = useState<Date | null>(() =>
    memoryCotasTimestamp ? new Date(memoryCotasTimestamp) : null
  );

  // Filtros
  const [tab, setTab] = useState<TabType>('esgotadas');
  const [filtroUser, setFiltroUser] = useState<FilterUserType>('todos');
  const [search, setSearch] = useState('');
  const [selectedFeature, setSelectedFeature] = useState<string>('todas');
  const [ordem, setOrdem] = useState<'maior_uso' | 'mais_recente' | 'dias_restantes'>('maior_uso');

  const loadData = useCallback(async (isBackground = false) => {
    if (isBackground) {
      setRefreshing(true);
    } else if (!memoryCotasStats || memoryCotasStats.length === 0) {
      setLoading(true);
    }

    try {
      // 1. Carregar configuração de limites de cotas (garante fallback seguro aos padrões)
      const loadedLimits = await loadLimits(true);
      const activeMonthlyLimits = loadedLimits.filter(
        (l) => l.enabled && l.period === 'monthly' && l.limit_value > 0
      );
      setLimits(activeMonthlyLimits);

      // 2. Carregar perfis de usuários: tenta IDB, edge function admin-list-users e fallback para profiles
      let allProfiles: UserProfile[] = [];

      try {
        const cachedUsers = await idbGet<any[]>(USERS_CACHE_KEY);
        if (cachedUsers && Array.isArray(cachedUsers) && cachedUsers.length > 0) {
          allProfiles = cachedUsers.map((u) => ({
            id: u.id,
            email: u.email || null,
            display_name: u.display_name || null,
            is_premium: !!u.is_premium,
            created_at: u.created_at || new Date().toISOString(),
          }));
        }
      } catch (e) {
        console.warn('Aviso ao carregar cache de usuários:', e);
      }

      // Sincroniza via Edge Function com Auth
      try {
        const { data: authUsers, error: authErr } = await supabase.functions.invoke('admin-list-users', {
          body: {},
        });
        if (!authErr && Array.isArray(authUsers) && authUsers.length > 0) {
          allProfiles = authUsers.map((u: any) => ({
            id: u.id,
            email: u.email || null,
            display_name: u.profile_display_name || u.user_metadata?.full_name || u.user_metadata?.name || null,
            is_premium: !!u.is_premium,
            created_at: u.created_at || new Date().toISOString(),
          }));
        }
      } catch (errAuth) {
        console.warn('Aviso: admin-list-users em segundo plano:', errAuth);
      }

      // Fallback para profiles caso a edge function não retorne
      if (allProfiles.length === 0) {
        try {
          const { data: usersData } = await supabase
            .from('profiles' as any)
            .select('*')
            .limit(2000);
          if (usersData && usersData.length > 0) {
            allProfiles = (usersData as any[]).map((p) => ({
              id: p.id,
              email: p.email || null,
              display_name: p.display_name || p.nome || null,
              is_premium: !!p.is_premium,
              created_at: p.created_at || new Date().toISOString(),
            }));
          }
        } catch (pErr) {
          console.warn('Aviso ao ler profiles:', pErr);
        }
      }

      setProfiles(allProfiles);

      // 3. Buscar usos de features dos últimos 40 dias
      const dataCorte = new Date();
      dataCorte.setDate(dataCorte.getDate() - 40);

      let usagesData: any[] = [];
      try {
        const { data: usages, error: usagesErr } = await supabase
          .from('feature_usage' as any)
          .select('user_id, feature_key, used_at, scope_value, ref_key')
          .gte('used_at', dataCorte.toISOString())
          .limit(10000);
        if (!usagesErr && usages) {
          usagesData = usages;
        }
      } catch (uErr) {
        console.warn('Aviso feature_usage:', uErr);
      }

      // 4. Buscar eventos de paywall e cota em app_events
      const eventsByUser = new Map<string, number>();
      try {
        const { data: appEventsData } = await supabase
          .from('app_events' as any)
          .select('user_id, email, event_name, created_at')
          .in('event_name', ['paywall_view', 'cota_esgotada', 'feature_limit_reached'])
          .gte('created_at', dataCorte.toISOString())
          .limit(5000);

        (appEventsData || []).forEach((ev: any) => {
          const uid = ev.user_id;
          if (uid) {
            eventsByUser.set(uid, (eventsByUser.get(uid) || 0) + 1);
          }
        });
      } catch (evErr) {
        console.warn('Aviso app_events:', evErr);
      }

      // Mapear usos por usuário
      const usagesByUser = new Map<string, any[]>();
      usagesData.forEach((u: any) => {
        if (!u.user_id) return;
        const list = usagesByUser.get(u.user_id) || [];
        list.push(u);
        usagesByUser.set(u.user_id, list);
      });

      // 5. Computar estatísticas no ciclo individual de 30 dias de cada usuário
      const now = new Date();
      const statsList: UserCotaStats[] = allProfiles.map((u) => {
        const createdDate = u.created_at || new Date().toISOString();
        const startCiclo = inicioCiclo(createdDate, now);
        const endCiclo = fimCiclo(createdDate, now);
        const diasRest = diasParaRenovar(createdDate, now);

        const rawUsages = usagesByUser.get(u.id) || [];
        const cicloUsages = rawUsages.filter((us) => {
          const t = new Date(us.used_at).getTime();
          return t >= startCiclo.getTime() && t <= endCiclo.getTime();
        });

        const funcoesUsadas: Record<string, number> = {};
        const funcoesEsgotadas: { feature_key: string; label: string; used: number; limit: number }[] = [];
        let totalItensUsados = 0;
        let totalLimitesPossiveis = 0;

        activeMonthlyLimits.forEach((lim) => {
          const rowsFunc = cicloUsages.filter((r) => r.feature_key === lim.feature_key);
          const usedCount = contarUsos(rowsFunc);
          funcoesUsadas[lim.feature_key] = usedCount;
          totalItensUsados += usedCount;
          totalLimitesPossiveis += lim.limit_value;

          if (usedCount >= lim.limit_value) {
            funcoesEsgotadas.push({
              feature_key: lim.feature_key,
              label: lim.label,
              used: usedCount,
              limit: lim.limit_value,
            });
          }
        });

        const ultimoUso =
          rawUsages.length > 0
            ? rawUsages.sort(
                (a, b) => new Date(b.used_at).getTime() - new Date(a.used_at).getTime()
              )[0].used_at
            : null;

        const percentualGeral =
          totalLimitesPossiveis > 0
            ? Math.min(100, Math.round((totalItensUsados / totalLimitesPossiveis) * 100))
            : 0;

        return {
          user: u,
          totalUsos: totalItensUsados,
          funcoesUsadas,
          funcoesEsgotadas,
          temCotaEsgotada: funcoesEsgotadas.length > 0,
          percentualGeral,
          diasRestantes: diasRest,
          dataInicioCiclo: startCiclo,
          dataFimCiclo: endCiclo,
          bloqueioEventosCount: eventsByUser.get(u.id) || 0,
          ultimoUso,
        };
      });

      // Gravar nos caches (memória + IndexedDB)
      const nowTs = Date.now();
      memoryCotasStats = statsList;
      memoryCotasLimits = activeMonthlyLimits;
      memoryCotasTimestamp = nowTs;

      void idbSet(COTAS_CACHE_KEY, {
        stats: statsList,
        limits: activeMonthlyLimits,
        timestamp: nowTs,
      });

      setUsageStats(statsList);
      setUltimoSync(new Date(nowTs));

      if (!isBackground) {
        toast.success(`Cotas sincronizadas (${statsList.length} usuários)!`);
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados de cotas:', err);
      toast.error('Erro ao atualizar análise de cotas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Inicialização com cache inteligente e timer de 5 minutos
  useEffect(() => {
    if (!isAdmin) return;

    let active = true;

    // 1. Tenta recuperar do IndexedDB se não houver na memória (instantâneo)
    if (!memoryCotasStats || memoryCotasStats.length === 0) {
      idbGet<{ stats: UserCotaStats[]; limits: FeatureLimitConfig[]; timestamp: number }>(COTAS_CACHE_KEY)
        .then((cached) => {
          if (cached && cached.stats && active && (!memoryCotasStats || memoryCotasStats.length === 0)) {
            memoryCotasStats = cached.stats;
            memoryCotasLimits = cached.limits || [];
            memoryCotasTimestamp = cached.timestamp || Date.now();
            setUsageStats(cached.stats);
            if (cached.limits) setLimits(cached.limits);
            setUltimoSync(new Date(memoryCotasTimestamp));
            setLoading(false);
          }
        })
        .catch(console.warn);
    }

    // 2. Se o cache em memória tiver expirado (> 5 minutos) ou não existir, busca dados
    const isStale = !memoryCotasTimestamp || Date.now() - memoryCotasTimestamp > COTAS_CACHE_TTL;
    if (isStale) {
      loadData(Boolean(memoryCotasStats && memoryCotasStats.length > 0));
    }

    // 3. Atualização automática a cada 5 minutos em segundo plano (conforme solicitado pelo usuário)
    const interval = setInterval(() => {
      loadData(true);
    }, COTAS_CACHE_TTL);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isAdmin, loadData]);

  // Estatísticas de Resumo Globais
  const summary = useMemo(() => {
    const totalUsuarios = usageStats.length;
    const usuariosComUso = usageStats.filter((s) => s.totalUsos > 0).length;
    const usuariosEsgotados = usageStats.filter((s) => s.temCotaEsgotada).length;
    const totalUsosCiclo = usageStats.reduce((acc, s) => acc + s.totalUsos, 0);

    // Contagem por função global
    const contagemPorFuncao: Record<string, number> = {};
    usageStats.forEach((s) => {
      Object.entries(s.funcoesUsadas).forEach(([k, v]) => {
        contagemPorFuncao[k] = (contagemPorFuncao[k] || 0) + v;
      });
    });

    let topFuncao = '-';
    let topFuncaoCount = 0;
    Object.entries(contagemPorFuncao).forEach(([k, v]) => {
      if (v > topFuncaoCount) {
        topFuncaoCount = v;
        const l = limits.find((lim) => lim.feature_key === k);
        topFuncao = l ? l.label : k;
      }
    });

    return {
      totalUsuarios,
      usuariosComUso,
      usuariosEsgotados,
      totalUsosCiclo,
      topFuncao,
      topFuncaoCount,
    };
  }, [usageStats, limits]);

  // Filtragem e ordenação dos usuários na lista
  const filteredUsers = useMemo(() => {
    return usageStats.filter((s) => {
      // Filtro de perfil
      if (filtroUser === 'gratuitos' && s.user.is_premium) return false;
      if (filtroUser === 'assinantes' && !s.user.is_premium) return false;

      // Filtro por Tab
      if (tab === 'esgotadas' && !s.temCotaEsgotada) return false;
      if (tab === 'bloqueados' && s.bloqueioEventosCount === 0) return false;
      if (tab === 'por_funcao' && selectedFeature !== 'todas') {
        const u = s.funcoesUsadas[selectedFeature] || 0;
        if (u === 0) return false;
      }

      // Filtro de Busca
      if (search.trim()) {
        const q = search.toLowerCase();
        const nome = (s.user.nome_completo || s.user.display_name || '').toLowerCase();
        const email = (s.user.email || '').toLowerCase();
        return nome.includes(q) || email.includes(q);
      }

      return true;
    }).sort((a, b) => {
      if (ordem === 'maior_uso') {
        return b.totalUsos - a.totalUsos;
      }
      if (ordem === 'mais_recente') {
        const tA = a.ultimoUso ? new Date(a.ultimoUso).getTime() : 0;
        const tB = b.ultimoUso ? new Date(b.ultimoUso).getTime() : 0;
        return tB - tA;
      }
      if (ordem === 'dias_restantes') {
        return a.diasRestantes - b.diasRestantes;
      }
      return 0;
    });
  }, [usageStats, tab, filtroUser, search, selectedFeature, ordem]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-6 max-w-md text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Acesso Restrito</h2>
          <p className="text-sm text-zinc-400">Esta área de análise de cotas é exclusiva para administradores.</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white pb-20 relative overflow-hidden">
      <ShapeGrid />

      <div className="relative z-10">
        <PageHeader
          title="Cotas Análise"
          subtitle={
            ultimoSync
              ? `Ciclo de 30 dias • Atualizado às ${ultimoSync.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • Auto-sync 5 min`
              : "Controle do ciclo de 30 dias e ranking de esgotamento"
          }
          onBack={() => goBack()}
          rightAction={
            <button
              onClick={() => loadData(false)}
              disabled={loading || refreshing}
              title="Atualizar dados de cotas"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-all active:scale-95 border border-white/10 cursor-pointer"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", (loading || refreshing) && "animate-spin text-primary")} />
              <span>{refreshing ? "Sincronizando..." : "Atualizar"}</span>
            </button>
          }
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 space-y-6">

          {/* Cards de Métricas de Topo */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-gradient-to-br from-rose-950/30 via-zinc-900/60 to-zinc-900/90 border border-rose-500/30 rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Cotas Esgotadas</span>
                <div className="w-8 h-8 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-400">
                  <Flame className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black font-display text-white">{summary.usuariosEsgotados}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Usuários que bateram limite no ciclo</p>
            </div>

            <div className="bg-gradient-to-br from-amber-950/20 via-zinc-900/60 to-zinc-900/90 border border-amber-500/20 rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Usuários Ativos</span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black font-display text-white">{summary.usuariosComUso}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Consumiram alguma cota em 30 dias</p>
            </div>

            <div className="bg-gradient-to-br from-blue-950/20 via-zinc-900/60 to-zinc-900/90 border border-blue-500/20 rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Total de Usos</span>
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400">
                  <Gauge className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black font-display text-white">{summary.totalUsosCiclo}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Acessos únicos somados</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-950/20 via-zinc-900/60 to-zinc-900/90 border border-emerald-500/20 rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Função Mais Usada</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg font-bold font-display text-white truncate" title={summary.topFuncao}>
                {summary.topFuncao}
              </div>
              <p className="text-[11px] text-emerald-400/80 mt-1 font-semibold">{summary.topFuncaoCount} usos no período</p>
            </div>
          </div>

          {/* Regra dos 30 Dias Banner Didático */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-3.5 text-xs text-muted-foreground">
            <Clock className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1">
              <strong className="text-white block font-semibold mb-0.5">Ciclo Individual de 30 Dias (Rolling Window)</strong>
              <span>
                As cotas renovam a cada 30 dias a partir da data de cadastro de cada usuário (e não no final do mês calendário). Se o usuário esgotar as 10 cotas hoje, o acesso gratuito dessa função só liberará daqui a 30 dias.
              </span>
            </div>
          </div>

          {/* Barra de Filtros & Menu de Alternância */}
          <div className="flex flex-col gap-3 bg-zinc-900/70 border border-white/10 rounded-2xl p-3 sm:p-4 shadow-sm">
            
            {/* Tabs Principais */}
            <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-white/5">
              <button
                onClick={() => setTab('esgotadas')}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                  tab === 'esgotadas'
                    ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
                    : "bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10"
                )}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Esgotaram Cotas ({usageStats.filter((s) => s.temCotaEsgotada).length})</span>
              </button>

              <button
                onClick={() => setTab('ranking')}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                  tab === 'ranking'
                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                    : "bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10"
                )}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Ranking Geral ({usageStats.length})</span>
              </button>

              <button
                onClick={() => setTab('por_funcao')}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                  tab === 'por_funcao'
                    ? "bg-amber-500 text-black shadow-lg shadow-amber-500/30"
                    : "bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10"
                )}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Por Função Específica</span>
              </button>

              <button
                onClick={() => setTab('bloqueados')}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                  tab === 'bloqueados'
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                    : "bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10"
                )}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Paywall Exibido ({usageStats.filter((s) => s.bloqueioEventosCount > 0).length})</span>
              </button>
            </div>

            {/* Subfiltros: Busca, Seletor de Função e Tipo de Usuário */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              
              {/* Campo de Busca */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nome ou e-mail..."
                  className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>

              {/* Seletor de Função (apenas na aba por_funcao) */}
              {tab === 'por_funcao' && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-muted-foreground">Função:</span>
                  <select
                    value={selectedFeature}
                    onChange={(e) => setSelectedFeature(e.target.value)}
                    className="bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-foreground font-medium focus:outline-none focus:border-amber-500"
                  >
                    <option value="todas">Todas as Funções</option>
                    {limits.map((l) => (
                      <option key={l.feature_key} value={l.feature_key}>
                        {l.label} ({l.limit_value}/mês)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Filtro Free vs Premium */}
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <span className="text-[11px] font-semibold text-muted-foreground mr-1">Plano:</span>
                {(['todos', 'gratuitos', 'assinantes'] as FilterUserType[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFiltroUser(f)}
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer",
                      filtroUser === f
                        ? "bg-white/20 text-white"
                        : "text-muted-foreground hover:text-white"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Ordenação */}
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <span className="text-[11px] font-semibold text-muted-foreground mr-1">Ordenar:</span>
                <select
                  value={ordem}
                  onChange={(e: any) => setOrdem(e.target.value)}
                  className="bg-black/50 border border-white/15 rounded-xl px-2.5 py-1.5 text-[11px] text-foreground font-medium focus:outline-none"
                >
                  <option value="maior_uso">Maior Consumo</option>
                  <option value="mais_recente">Mais Recente</option>
                  <option value="dias_restantes">Dias para Renovar</option>
                </select>
              </div>

            </div>
          </div>

          {/* Lista de Usuários */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              <span className="text-sm text-muted-foreground font-medium">Calculando cotas e ciclos individuais...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-12 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto opacity-70" />
              <h3 className="text-base font-bold text-white">Nenhum usuário nesta visualização</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {tab === 'esgotadas'
                  ? "Nenhum usuário com cota esgotada no momento. Todos os usuários possuem cotas liberadas ou não consumiram ainda."
                  : "Nenhum usuário corresponde aos filtros selecionados."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>Mostrando <strong>{filteredUsers.length}</strong> usuários</span>
                <span>Ciclo: 30 dias contados da criação</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {filteredUsers.map((stat, idx) => {
                  const nome = stat.user.nome_completo || stat.user.display_name || 'Usuário';
                  const email = stat.user.email || 'Sem e-mail';
                  const dataCadFormat = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(stat.user.created_at));
                  const dataRenovFormat = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(stat.dataFimCiclo);

                  return (
                    <div
                      key={stat.user.id}
                      className={cn(
                        "bg-zinc-900/60 border rounded-2xl p-4 transition-all hover:bg-zinc-900/90 flex flex-col gap-3 relative overflow-hidden",
                        stat.temCotaEsgotada ? "border-rose-500/40 shadow-sm shadow-rose-950/20" : "border-white/10"
                      )}
                    >
                      {/* Topo do Card do Usuário */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Posição no Ranking */}
                          <div className={cn(
                            "w-8 h-8 rounded-xl font-display font-black text-xs flex items-center justify-center shrink-0",
                            idx < 3 ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-white/5 text-muted-foreground"
                          )}>
                            #{idx + 1}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-white truncate">{nome}</span>
                              {stat.user.is_premium ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                                  <Crown className="w-2.5 h-2.5" />
                                  ASSINANTE
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-white/10 text-zinc-300 border border-white/10">
                                  GRATUITO
                                </span>
                              )}
                              {stat.temCotaEsgotada && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                                  <Flame className="w-2.5 h-2.5" />
                                  COTA ESGOTADA ({stat.funcoesEsgotadas.length})
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground truncate block">{email}</span>
                          </div>
                        </div>

                        {/* Botão Ver Dossiê Completo */}
                        <button
                          onClick={() => setSelectedUserDossie(stat.user)}
                          className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-all active:scale-95 border border-white/10 cursor-pointer"
                        >
                          <span>Ver Dossiê</span>
                          <ExternalLink className="w-3 h-3 text-muted-foreground" />
                        </button>
                      </div>

                      {/* TAGS DE STATUS DE ESGOTAMENTO (Solicitado pelo usuário) */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {stat.temCotaEsgotada ? (
                          <>
                            {stat.funcoesEsgotadas.map((fe) => (
                              <span
                                key={fe.feature_key}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-950/30"
                              >
                                <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                                <span>{fe.label}: {fe.used}/{fe.limit} (ESGOTADA)</span>
                              </span>
                            ))}
                          </>
                        ) : stat.totalUsos > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <Gauge className="w-3.5 h-3.5 text-amber-400" />
                            <span>{stat.totalUsos} usos no ciclo • Limites disponíveis</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 text-zinc-400 border border-white/10">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Nenhum consumo no ciclo • 100% livre</span>
                          </span>
                        )}

                        {stat.bloqueioEventosCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/25">
                            <ShieldAlert className="w-3 h-3 text-purple-400" />
                            <span>{stat.bloqueioEventosCount}x paywall visto</span>
                          </span>
                        )}
                      </div>

                      {/* Informações do Ciclo de 30 Dias */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5 text-xs">
                        <div className="bg-black/30 rounded-xl p-2 border border-white/5">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Cadastrado em</span>
                          <span className="font-semibold text-white">{dataCadFormat}</span>
                        </div>
                        <div className="bg-black/30 rounded-xl p-2 border border-white/5">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Renova em</span>
                          <span className="font-semibold text-amber-400">{dataRenovFormat}</span>
                        </div>
                        <div className="bg-black/30 rounded-xl p-2 border border-white/5">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Dias Restantes</span>
                          <span className="font-semibold text-white">{stat.diasRestantes} dias</span>
                        </div>
                        <div className="bg-black/30 rounded-xl p-2 border border-white/5">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Avisos Exibidos</span>
                          <span className="font-semibold text-purple-400">{stat.bloqueioEventosCount}x</span>
                        </div>
                      </div>

                      {/* Funções Usadas & Limites */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                          Consumo detalhado por função no ciclo:
                        </span>

                        <div className="flex flex-wrap gap-2">
                          {limits.map((l) => {
                            const used = stat.funcoesUsadas[l.feature_key] || 0;
                            const isMax = used >= l.limit_value;
                            if (used === 0 && tab === 'esgotadas') return null;

                            return (
                              <div
                                key={l.feature_key}
                                className={cn(
                                  "px-2.5 py-1.5 rounded-xl border text-xs flex items-center gap-2",
                                  isMax
                                    ? "bg-rose-500/15 border-rose-500/40 text-rose-300 font-bold shadow-sm shadow-rose-950/20"
                                    : used > 0
                                      ? "bg-amber-500/10 border-amber-500/25 text-amber-200"
                                      : "bg-black/20 border-white/5 text-zinc-500"
                                )}
                              >
                                <span>{l.label}:</span>
                                <span className={cn("font-black", isMax && "text-rose-400")}>
                                  {used} / {l.limit_value}
                                </span>
                                {isMax && <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Dossiê Modal do Usuário */}
      {selectedUserDossie && (
        <UserDossieSheet
          userId={selectedUserDossie.id}
          nome={selectedUserDossie.nome_completo || selectedUserDossie.display_name}
          email={selectedUserDossie.email}
          onClose={() => setSelectedUserDossie(null)}
        />
      )}
    </div>
  );
}
