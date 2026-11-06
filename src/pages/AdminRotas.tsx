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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppHeader } from '@/components/layout/AppHeader';
import { APP_ROUTES_CATALOG, AppRouteItem } from '@/data/appRoutesCatalog';
import { haptic } from '@/lib/nativeHaptics';
import { toast } from 'sonner';

type ViewMode = 'todas' | 'agrupadas' | 'ativas' | 'redirects' | 'admin' | 'publicas';

const AdminRotas = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('agrupadas');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Legislação & Leis': true,
    'Questões & Simulados': true,
    'Aulas & Áudios': true,
  });

  // Filtra rotas com base na busca e na aba ativa
  const filteredRoutes = useMemo(() => {
    let list = APP_ROUTES_CATALOG.filter((r) => r.path !== '*');

    // Filtros de modo
    if (viewMode === 'ativas') {
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
          (r.redirectTarget && r.redirectTarget.toLowerCase().includes(q))
      );
    }

    return list;
  }, [search, viewMode]);

  // Agrupamento por Rota Principal e suas subrotas
  const groupedRoutes = useMemo(() => {
    const groups: Record<string, AppRouteItem[]> = {};
    for (const r of filteredRoutes) {
      if (!groups[r.group]) groups[r.group] = [];
      groups[r.group].push(r);
    }

    // Ordena as chaves dos grupos em ordem alfabética (A-Z)
    const sortedKeys = Object.keys(groups).sort((a, b) => a.localeCompare(b));
    return sortedKeys.map((key) => ({
      group: key,
      routes: groups[key].sort((a, b) => a.path.localeCompare(b.path)),
    }));
  }, [filteredRoutes]);

  // Métricas rápidas
  const stats = useMemo(() => {
    const total = APP_ROUTES_CATALOG.length;
    const redirects = APP_ROUTES_CATALOG.filter((r) => r.isRedirect).length;
    const ativas = total - redirects;
    const admin = APP_ROUTES_CATALOG.filter((r) => r.isAdmin).length;
    return { total, ativas, redirects, admin };
  }, []);

  const toggleGroup = useCallback((group: string) => {
    haptic.selection();
    setExpandedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
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
      if (route.exampleUrl) {
        navigate(route.exampleUrl);
      } else {
        navigate(route.path);
      }
    },
    [navigate]
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
                Catálogo Geral de Rotas & Sub-rotas (A-Z)
              </h2>
              <p className="font-body text-xs text-muted-foreground mt-0.5">
                Inspecione todas as páginas do sistema, teste rotas ao vivo no app ou copie para perguntar à IA.
              </p>
            </div>

            {/* Badges de Contagem Rápida */}
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {stats.ativas} Ativas
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                {stats.redirects} Redirecionadas
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-primary/15 text-primary border border-primary/30">
                {stats.admin} Admin
              </span>
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
            placeholder="Buscar por caminho (/questoes), nome, grupo ou descrição..."
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
              { id: 'todas', label: 'Todas A-Z', icon: RouteIcon },
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

          {viewMode === 'agrupadas' && (
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={expandAll}
                className="text-primary hover:underline font-semibold"
              >
                Expandir Todas
              </button>
              <span className="text-muted-foreground/40">|</span>
              <button
                onClick={collapseAll}
                className="text-muted-foreground hover:text-foreground"
              >
                Recolher Todas
              </button>
            </div>
          )}
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
            {groupedRoutes.map(({ group, routes }) => {
              const isOpen = expandedGroups[group] ?? true;
              return (
                <div
                  key={group}
                  className="rounded-2xl border border-border bg-card/60 overflow-hidden shadow-sm transition-colors"
                >
                  {/* Cabeçalho da Rota Principal / Pasta */}
                  <button
                    onClick={() => toggleGroup(group)}
                    className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                        {isOpen ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display text-sm font-bold text-foreground truncate">
                          {group}
                        </h3>
                        <p className="font-body text-xs text-muted-foreground truncate">
                          {routes.length} {routes.length === 1 ? 'rota' : 'rotas e sub-rotas'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-medium text-muted-foreground px-2 py-0.5 rounded bg-muted/60">
                      {isOpen ? 'Recolher' : 'Ver rotas'}
                    </span>
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
          /* Visualização em Lista Linear A-Z */
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

  return (
    <div className="p-3 sm:p-4 hover:bg-secondary/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Informações da Rota */}
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Caminho Mono */}
          <span className="font-mono text-xs sm:text-[13px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md select-all">
            {route.path}
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
