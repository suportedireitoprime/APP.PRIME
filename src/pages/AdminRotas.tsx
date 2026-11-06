import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Route as RouteIcon,
  ExternalLink,
  Copy,
  Check,
  Folder,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  Lock,
  Globe,
  Sparkles,
  HelpCircle,
  MessageSquareQuote,
  CornerDownRight,
  Filter,
  Play,
  Flame,
  Gauge,
  Activity,
  Zap,
  ArrowDownUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppHeader } from '@/components/layout/AppHeader';
import { APP_ROUTES_CATALOG, AppRouteItem, RouteWeightLevel } from '@/data/appRoutesCatalog';
import { useRouteInspector } from '@/hooks/useRouteInspector';
import { haptic } from '@/lib/nativeHaptics';
import { toast } from 'sonner';

type ViewMode = 'agrupadas' | 'todas' | 'pesadas' | 'ativas' | 'redirects' | 'admin' | 'publicas';
type SortBy = 'alfabetica' | 'peso';

function getWeightBadge(level: RouteWeightLevel, estimate: string) {
  switch (level) {
    case 'muito_pesada':
      return {
        label: 'Muito Pesada',
        estimate,
        badgeClass: 'bg-red-500/20 text-red-300 border-red-500/40',
        dotClass: 'bg-red-500 animate-pulse',
        icon: Flame,
      };
    case 'pesada':
      return {
        label: 'Pesada',
        estimate,
        badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
        dotClass: 'bg-orange-500',
        icon: Gauge,
      };
    case 'media':
      return {
        label: 'Média',
        estimate,
        badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        dotClass: 'bg-amber-500',
        icon: Activity,
      };
    case 'leve':
      return {
        label: 'Leve',
        estimate,
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        dotClass: 'bg-emerald-500',
        icon: Zap,
      };
    case 'zero':
    default:
      return {
        label: 'Zero',
        estimate: '0 KB',
        badgeClass: 'bg-zinc-800 text-zinc-400 border-zinc-700',
        dotClass: 'bg-zinc-600',
        icon: CornerDownRight,
      };
  }
}

const AdminRotas = () => {
  const navigate = useNavigate();
  const { startInspector } = useRouteInspector();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('agrupadas');
  const [sortBy, setSortBy] = useState<SortBy>('alfabetica');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Filtra rotas com base na busca e na aba ativa
  const filteredRoutes = useMemo(() => {
    let list = APP_ROUTES_CATALOG.filter((r) => r.path !== '*');

    // Filtros de modo
    if (viewMode === 'pesadas') {
      list = list.filter((r) => (r.weightScore ?? 1) >= 4);
    } else if (viewMode === 'ativas') {
      list = list.filter((r) => !r.isRedirect);
    } else if (viewMode === 'redirects') {
      list = list.filter((r) => r.isRedirect);
    } else if (viewMode === 'admin') {
      list = list.filter((r) => r.isAdmin);
    } else if (viewMode === 'publicas') {
      list = list.filter((r) => !r.isProtected);
    }

    // Busca textual
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.path.toLowerCase().includes(q) ||
          r.label.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.group.toLowerCase().includes(q) ||
          r.weightEstimate.toLowerCase().includes(q) ||
          (r.redirectTarget && r.redirectTarget.toLowerCase().includes(q))
      );
    }

    // Ordenação da lista linear
    const effectiveSort = viewMode === 'pesadas' ? 'peso' : sortBy;
    const sorted = [...list].sort((a, b) => {
      if (effectiveSort === 'peso') {
        const diff = (b.weightScore ?? 1) - (a.weightScore ?? 1);
        if (diff !== 0) return diff;
      }
      return a.path.localeCompare(b.path);
    });

    return sorted;
  }, [search, viewMode, sortBy]);

  // Agrupamento por Rota Principal e suas subrotas
  const groupedRoutes = useMemo(() => {
    const groups: Record<string, AppRouteItem[]> = {};
    for (const r of filteredRoutes) {
      if (!groups[r.group]) groups[r.group] = [];
      groups[r.group].push(r);
    }

    const effectiveSort = viewMode === 'pesadas' ? 'peso' : sortBy;

    // Converte em array e calcula o peso máximo por grupo
    const groupEntries = Object.entries(groups).map(([group, routes]) => {
      const maxScore = Math.max(...routes.map((r) => r.weightScore ?? 1), 0);
      const sortedRoutes = [...routes].sort((a, b) => {
        if (effectiveSort === 'peso') {
          const diff = (b.weightScore ?? 1) - (a.weightScore ?? 1);
          if (diff !== 0) return diff;
        }
        return a.path.localeCompare(b.path);
      });
      return {
        group,
        routes: sortedRoutes,
        maxScore,
      };
    });

    // Ordenação dos grupos
    groupEntries.sort((a, b) => {
      if (effectiveSort === 'peso') {
        const diff = b.maxScore - a.maxScore;
        if (diff !== 0) return diff;
      }
      return a.group.localeCompare(b.group);
    });

    return groupEntries;
  }, [filteredRoutes, viewMode, sortBy]);

  // Métricas rápidas
  const stats = useMemo(() => {
    const total = APP_ROUTES_CATALOG.length;
    const redirects = APP_ROUTES_CATALOG.filter((r) => r.isRedirect).length;
    const ativas = total - redirects;
    const admin = APP_ROUTES_CATALOG.filter((r) => r.isAdmin).length;
    const muitoPesadas = APP_ROUTES_CATALOG.filter((r) => r.weightLevel === 'muito_pesada').length;
    const pesadas = APP_ROUTES_CATALOG.filter((r) => r.weightLevel === 'pesada').length;
    const medias = APP_ROUTES_CATALOG.filter((r) => r.weightLevel === 'media').length;
    const leves = APP_ROUTES_CATALOG.filter((r) => r.weightLevel === 'leve').length;
    return { total, ativas, redirects, admin, muitoPesadas, pesadas, medias, leves };
  }, []);

  const toggleGroup = useCallback((group: string, currentIsOpen: boolean) => {
    haptic.selection();
    setExpandedGroups((prev) => ({
      ...prev,
      [group]: !currentIsOpen,
    }));
  }, []);

  const expandAll = useCallback(() => {
    haptic.selection();
    const all: Record<string, boolean> = {};
    groupedRoutes.forEach((g) => {
      all[g.group] = true;
    });
    setExpandedGroups(all);
  }, [groupedRoutes]);

  const collapseAll = useCallback(() => {
    haptic.selection();
    setExpandedGroups({});
  }, []);

  const handleCopyPath = useCallback(async (path: string) => {
    haptic.selection();
    try {
      await navigator.clipboard.writeText(path);
      setCopiedPath(path);
      toast.success(`Rota copiada: ${path}`);
      setTimeout(() => setCopiedPath(null), 2000);
    } catch {
      toast.error('Não foi possível copiar');
    }
  }, []);

  const handleAskAI = useCallback(async (route: AppRouteItem) => {
    haptic.selection();
    const prompt = `Sobre a rota "${route.path}" no aplicativo Direito Prime:\n- Componente: ${route.component}\n- Finalidade atual: ${route.description}\n- Tipo: ${route.isRedirect ? `Redirecionamento para ${route.redirectTarget}` : 'Rota direta'}\n\nPergunta: O que exatamente essa rota faz no sistema, quais arquivos ela toca e se ela é essencial ou pode ser refatorada/excluída?`;
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success('Pergunta pronta copiada! Cole aqui no chat do assistente.', {
        duration: 4000,
      });
    } catch {
      toast.error('Erro ao copiar pergunta');
    }
  }, []);

  const handleOpenRoute = useCallback(
    (route: AppRouteItem) => {
      haptic.selection();
      startInspector(route.path);
      if (route.exampleUrl) {
        navigate(route.exampleUrl);
      } else {
        navigate(route.path);
      }
    },
    [navigate, startInspector]
  );

  return (
    <div className="min-h-dvh bg-background text-foreground pb-24">
      <AppHeader
        title={
          <span className="flex items-center gap-2">
            <RouteIcon className="w-4 h-4 text-primary" />
            <span>Rotas do Aplicativo</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
              {stats.total}
            </span>
          </span>
        }
      />

      <div className="px-4 lg:px-8 py-5 max-w-6xl mx-auto space-y-5">
        {/* Banner Informativo Superior */}
        <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-secondary/30 p-4 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Catálogo Geral de Rotas & Sub-rotas
              </h2>
              <p className="font-body text-xs text-muted-foreground mt-0.5">
                Inspecione todas as páginas do sistema com métricas de peso de carregamento, teste ao vivo ou pergunte à IA.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  haptic.selection();
                  const first = filteredRoutes[0] || APP_ROUTES_CATALOG[0];
                  startInspector(first.path);
                  navigate(first.exampleUrl || first.path);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-body font-bold shadow-sm transition-all active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Navegar com Menu Flutuante</span>
              </button>

              {/* Badges de Contagem e Peso */}
              <div className="flex flex-wrap gap-1.5 text-xs font-mono">
                <span
                  title="Funções que utilizam Three.js, PDF.js ou streams de áudio pesado"
                  className="px-2 py-0.5 rounded-lg bg-red-500/15 text-red-300 border border-red-500/30 flex items-center gap-1"
                >
                  <Flame className="w-3 h-3 text-red-400" />
                  {stats.muitoPesadas} Muito Pesadas
                </span>
                <span
                  title="Funções com motores de simulados, ranking e questões"
                  className="px-2 py-0.5 rounded-lg bg-orange-500/15 text-orange-300 border border-orange-500/30 flex items-center gap-1"
                >
                  <Gauge className="w-3 h-3 text-orange-400" />
                  {stats.pesadas} Pesadas
                </span>
                <span
                  title="Funções com gráficos radar e tabelas de leis"
                  className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1"
                >
                  {stats.medias} Médias
                </span>
                <span
                  title="Funções ultraleves e instantâneas"
                  className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1"
                >
                  <Zap className="w-3 h-3 text-emerald-400" />
                  {stats.leves} Leves
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Busca Instantânea */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por caminho (/questoes), nome, grupo ou peso (~3.8 MB)..."
            className="w-full h-11 pl-10 pr-10 rounded-xl border border-border bg-card text-foreground font-body text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-body text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded bg-muted"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Abas e Filtros de Visualização */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'agrupadas', label: 'Pastas & Sub-rotas', icon: Folder },
              { id: 'pesadas', label: '🔥 Mais Pesadas +', icon: Flame },
              { id: 'todas', label: 'Todas as Rotas', icon: RouteIcon },
              { id: 'ativas', label: 'Páginas Ativas', icon: ShieldCheck },
              { id: 'redirects', label: 'Redirecionamentos', icon: ArrowRight },
              { id: 'admin', label: 'Área Admin', icon: Lock },
              { id: 'publicas', label: 'Públicas', icon: Globe },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  haptic.selection();
                  setViewMode(tab.id as ViewMode);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-body font-semibold transition-all ${
                  viewMode === tab.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Alternador de Ordenação (A-Z vs Peso) */}
            <button
              onClick={() => {
                haptic.selection();
                setSortBy((prev) => (prev === 'alfabetica' ? 'peso' : 'alfabetica'));
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-body font-semibold transition-all border ${
                sortBy === 'peso' || viewMode === 'pesadas'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
              title="Alternar entre ordem alfabética (A-Z) e ordenação pelas funções mais pesadas do app"
            >
              <ArrowDownUp className="w-3.5 h-3.5" />
              <span>{sortBy === 'peso' || viewMode === 'pesadas' ? '🔥 Mais Pesadas 1º' : 'Ordem A-Z'}</span>
            </button>

            {viewMode === 'agrupadas' && (
              <div className="flex items-center gap-2 text-xs pl-1">
                <button
                  onClick={expandAll}
                  className="text-primary hover:underline font-semibold"
                >
                  Expandir
                </button>
                <span className="text-muted-foreground/40">|</span>
                <button
                  onClick={collapseAll}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Recolher
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Lista de Rotas */}
        {filteredRoutes.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-2xl p-8">
            <Filter className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="font-display text-sm text-foreground">Nenhuma rota encontrada</p>
            <p className="font-body text-xs text-muted-foreground mt-1">
              Tente pesquisar com outro termo ou limpe os filtros.
            </p>
          </div>
        ) : viewMode === 'agrupadas' ? (
          /* Visualização Agrupada por Rota Principal com suas subrotas */
          <div className="space-y-4">
            {groupedRoutes.map(({ group, routes, maxScore }) => {
              const isOpen = search.trim().length > 0 ? (expandedGroups[group] ?? true) : (expandedGroups[group] ?? false);
              const maxItem = routes.find((r) => r.weightScore === maxScore) || routes[0];
              const wBadge = getWeightBadge(maxItem.weightLevel, maxItem.weightEstimate);

              return (
                <div
                  key={group}
                  className="rounded-2xl border border-border bg-card/60 overflow-hidden shadow-sm transition-colors"
                >
                  {/* Cabeçalho da Rota Principal / Pasta */}
                  <button
                    onClick={() => toggleGroup(group, isOpen)}
                    className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                        {isOpen ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-sm font-bold text-foreground truncate">
                            {group}
                          </h3>
                          {maxScore >= 4 && (
                            <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                              <Flame className="w-2.5 h-2.5" /> Alta Carga
                            </span>
                          )}
                        </div>
                        <p className="font-body text-xs text-muted-foreground truncate">
                          {routes.length} {routes.length === 1 ? 'rota' : 'rotas e sub-rotas'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Tag de Peso da Pasta */}
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${wBadge.badgeClass}`}
                        title={`Maior peso nesta pasta: ${maxItem.weightEstimate}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${wBadge.dotClass}`} />
                        <span>{maxItem.weightEstimate}</span>
                      </span>

                      <span className="text-xs font-mono font-medium text-muted-foreground px-2 py-0.5 rounded bg-muted/60">
                        {isOpen ? 'Recolher' : 'Ver rotas'}
                      </span>
                    </div>
                  </button>

                  {/* Lista de Sub-rotas */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-border/60 divide-y divide-border/40"
                      >
                        {routes.map((route) => (
                          <RouteCard
                            key={route.path}
                            route={route}
                            copiedPath={copiedPath}
                            onCopy={handleCopyPath}
                            onAskAI={handleAskAI}
                            onOpen={handleOpenRoute}
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ) : (
          /* Visualização em Lista Linear */
          <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border/50 shadow-sm">
            {filteredRoutes.map((route) => (
              <RouteCard
                key={route.path}
                route={route}
                copiedPath={copiedPath}
                onCopy={handleCopyPath}
                onAskAI={handleAskAI}
                onOpen={handleOpenRoute}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface RouteCardProps {
  route: AppRouteItem;
  copiedPath: string | null;
  onCopy: (path: string) => void;
  onAskAI: (route: AppRouteItem) => void;
  onOpen: (route: AppRouteItem) => void;
}

function RouteCard({ route, copiedPath, onCopy, onAskAI, onOpen }: RouteCardProps) {
  const isCopied = copiedPath === route.path;
  const w = getWeightBadge(route.weightLevel, route.weightEstimate);
  const WeightIcon = w.icon;

  return (
    <div className="p-3 sm:p-4 hover:bg-secondary/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Informações da Rota */}
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Caminho Mono */}
          <span className="font-mono text-xs sm:text-[13px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md select-all">
            {route.path}
          </span>

          {/* TAG DE PESO DA FUNÇÃO */}
          <span
            title={`Estimativa de carga de bundle e memória: ${route.weightEstimate}${
              route.weightReasons?.length ? ` (${route.weightReasons.join(', ')})` : ''
            }`}
            className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border shadow-sm ${w.badgeClass}`}
          >
            <WeightIcon className="w-3 h-3 shrink-0" />
            <span>{w.estimate}</span>
            <span className="opacity-80 hidden xs:inline">· {w.label}</span>
          </span>

          {/* Badges de Estado */}
          {route.isRedirect ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-body font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <ArrowRight className="w-3 h-3" />
              <span>Redireciona → {route.redirectTarget}</span>
            </span>
          ) : (
            <span className="text-[10px] font-body font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Ativa
            </span>
          )}

          {route.isAdmin && (
            <span className="text-[10px] font-body font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Admin
            </span>
          )}

          {route.isProtected ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-body px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              <Lock className="w-2.5 h-2.5" />
              <span>Protegida</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-body px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              <Globe className="w-2.5 h-2.5" />
              <span>Pública</span>
            </span>
          )}
        </div>

        {/* Título e Descrição */}
        <div className="space-y-0.5">
          <p className="font-display text-xs font-semibold text-foreground flex items-center gap-1.5">
            <CornerDownRight className="w-3 h-3 text-muted-foreground/60 shrink-0" />
            <span>{route.label}</span>
            <span className="text-[10px] font-mono text-muted-foreground font-normal">
              ({route.component})
            </span>
          </p>
          <p className="font-body text-xs text-muted-foreground leading-relaxed pl-4">
            {route.description}
          </p>
          {route.weightReasons && route.weightReasons.length > 0 && !route.isRedirect && (
            <div className="flex flex-wrap items-center gap-1 pl-4 pt-0.5">
              <span className="text-[10px] text-muted-foreground/60 font-mono">Carga:</span>
              {route.weightReasons.map((reason, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-secondary/70 text-muted-foreground border border-border/40"
                >
                  {reason}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
        {/* Perguntar à IA */}
        <button
          onClick={() => onAskAI(route)}
          title="Copiar prompt pronto para perguntar à IA sobre esta rota"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground text-xs font-body font-medium transition-colors"
        >
          <MessageSquareQuote className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Perguntar à IA</span>
        </button>

        {/* Copiar Caminho */}
        <button
          onClick={() => onCopy(route.path)}
          title="Copiar caminho da rota"
          className="p-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Copiar rota"
        >
          {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>

        {/* Abrir / Acessar Rota no App */}
        <button
          onClick={() => onOpen(route)}
          title={`Acessar ${route.exampleUrl} no aplicativo`}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-body font-semibold shadow-sm transition-transform active:scale-95"
        >
          <span>Abrir</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default AdminRotas;
