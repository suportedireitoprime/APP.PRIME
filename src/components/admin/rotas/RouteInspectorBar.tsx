import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Route as RouteIcon,
  X,
  Minimize2,
  Maximize2,
  Copy,
  Check,
  MessageSquareQuote,
  LayoutGrid,
  Search,
  ExternalLink,
  Lock,
  Globe,
  ArrowRight,
  Flame,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouteInspector, INSPECTOR_ROUTES } from '@/hooks/useRouteInspector';
import { haptic } from '@/lib/nativeHaptics';
import { toast } from 'sonner';

export function RouteInspectorBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isActive,
    currentPath,
    currentIndex,
    totalRoutes,
    currentRouteItem,
    isMinimized,
    setRouteByIndex,
    closeInspector,
    toggleMinimize,
  } = useRouteInspector();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const isNavigatingViaInspector = useRef(false);

  // Navega para um índice específico de rota com proteção de redirect
  const handleGoTo = useCallback(
    (index: number) => {
      haptic.selection();
      const safeIndex = ((index % totalRoutes) + totalRoutes) % totalRoutes;
      const target = INSPECTOR_ROUTES[safeIndex];
      if (!target) return;

      isNavigatingViaInspector.current = true;
      setRouteByIndex(safeIndex);
      setPickerOpen(false);

      const targetUrl = target.exampleUrl || target.path;
      try {
        navigate(targetUrl);
      } catch (e) {
        console.warn('Erro ao navegar para rota:', targetUrl, e);
      }

      // Mantém a trava ativa durante a troca de tela para evitar que redirects mudem o índice
      setTimeout(() => {
        isNavigatingViaInspector.current = false;
      }, 1500);
    },
    [totalRoutes, setRouteByIndex, navigate]
  );

  const handlePrev = useCallback(() => {
    const prevIndex = ((currentIndex - 1 % totalRoutes) + totalRoutes) % totalRoutes;
    handleGoTo(prevIndex);
  }, [currentIndex, totalRoutes, handleGoTo]);

  const handleNext = useCallback(() => {
    const nextIndex = (currentIndex + 1) % totalRoutes;
    handleGoTo(nextIndex);
  }, [currentIndex, totalRoutes, handleGoTo]);

  // Sincroniza a rota atual quando a URL do navegador muda espontaneamente (sem sobrescrever navegação em lote)
  useEffect(() => {
    if (!isActive) return;
    if (isNavigatingViaInspector.current) return;

    const pathname = location.pathname;

    // Se a rota atual no inspetor for um redirect conhecido para essa URL, mantém a rota original do catálogo
    if (
      currentRouteItem?.isRedirect &&
      (pathname === currentRouteItem.redirectTarget || pathname === currentRouteItem.exampleUrl)
    ) {
      return;
    }

    // Se foi redirecionado para /auth ou / por proteção de rota, não puxa o inspetor de volta para /auth
    if (
      (pathname === '/auth' || pathname === '/') &&
      currentRouteItem?.isProtected &&
      currentRouteItem.path !== pathname
    ) {
      return;
    }

    // Se navegou via link comum dentro do app
    const match = INSPECTOR_ROUTES.find(
      (r) => r.path === pathname || (r.exampleUrl && r.exampleUrl === pathname)
    );
    if (match && match.path !== currentPath) {
      const matchIndex = INSPECTOR_ROUTES.findIndex((r) => r.path === match.path);
      if (matchIndex >= 0) {
        setRouteByIndex(matchIndex);
      }
    }
  }, [location.pathname, isActive, currentPath, currentRouteItem, setRouteByIndex]);

  // Suporte a atalhos do teclado: Setas Direita/Esquerda para alternar rapidamente entre todas as rotas
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === ']') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === '[') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, handleNext, handlePrev]);

  // Filtro de rotas do picker rápido
  const filteredPickerRoutes = useMemo(() => {
    if (!pickerSearch.trim()) return INSPECTOR_ROUTES;
    const q = pickerSearch.toLowerCase().trim();
    return INSPECTOR_ROUTES.filter(
      (r) =>
        r.path.toLowerCase().includes(q) ||
        r.label.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
    );
  }, [pickerSearch]);

  const handleCopyCurrent = async () => {
    haptic.selection();
    if (!currentRouteItem) return;
    try {
      await navigator.clipboard.writeText(currentRouteItem.path);
      setCopied(true);
      toast.success(`Rota copiada: ${currentRouteItem.path}`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  const handleAskAI = async () => {
    haptic.selection();
    if (!currentRouteItem) return;
    const prompt = `Sobre a rota "${currentRouteItem.path}" no aplicativo Direito Prime:\n- Componente: ${currentRouteItem.component}\n- Descrição: ${currentRouteItem.description}\n- Tipo: ${currentRouteItem.isRedirect ? `Redireciona para ${currentRouteItem.redirectTarget}` : 'Ativa'}\n\nPergunta: O que essa rota faz, quais arquivos ela toca e se ela é essencial ou pode ser removida/refatorada?`;
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success('Pergunta pronta copiada! Cole no chat do assistente.', {
        duration: 4000,
      });
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  const handleOpenMap = () => {
    haptic.selection();
    navigate('/admin-rotas');
  };

  const handleReloadCurrent = () => {
    haptic.selection();
    if (!currentRouteItem) return;
    const targetUrl = currentRouteItem.exampleUrl || currentRouteItem.path;
    navigate(targetUrl);
    toast.info(`Navegando para: ${targetUrl}`);
  };

  if (!isActive) return null;

  return (
    <div className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-1.5rem)] max-w-xl pointer-events-none select-none">
      <AnimatePresence mode="wait">
        {isMinimized ? (
          /* Estado Minimizado: Pílula compacta */
          <motion.div
            key="minimized"
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            className="pointer-events-auto flex items-center justify-between gap-2 px-3.5 py-2 rounded-full bg-zinc-950/95 border border-primary/40 shadow-2xl backdrop-blur-xl text-white mx-auto w-fit"
          >
            <button
              onClick={toggleMinimize}
              className="flex items-center gap-2 text-xs font-mono font-bold hover:text-primary transition-colors"
            >
              <RouteIcon className="w-3.5 h-3.5 text-primary animate-pulse shrink-0" />
              <span className="text-muted-foreground text-[11px] shrink-0">
                [{currentIndex + 1}/{totalRoutes}]
              </span>
              <span className="text-red-400 max-w-[140px] truncate">{currentPath}</span>
              {currentRouteItem && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-bold shrink-0 ${
                    currentRouteItem.weightLevel === 'muito_pesada'
                      ? 'bg-red-500/20 text-red-300 border-red-500/40'
                      : currentRouteItem.weightLevel === 'pesada'
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                      : currentRouteItem.weightLevel === 'media'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : currentRouteItem.weightLevel === 'leve'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}
                >
                  {currentRouteItem.weightEstimate}
                </span>
              )}
            </button>

            <div className="flex items-center gap-1 border-l border-white/10 pl-2">
              <button
                onClick={handlePrev}
                className="p-1 rounded-full hover:bg-white/10 active:scale-90 transition-transform"
                title="Rota anterior (Seta Esquerda)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-1 rounded-full hover:bg-white/10 active:scale-90 transition-transform text-primary hover:text-primary"
                title="Próxima rota (Seta Direita)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={toggleMinimize}
                className="p-1 rounded-full hover:bg-white/10 text-muted-foreground hover:text-white"
                title="Expandir menu flutuante"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ) : (
          /* Estado Completo: Barra de Navegação e Alternância */
          <motion.div
            key="expanded"
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            className="pointer-events-auto rounded-2xl bg-zinc-950/95 border border-border/80 shadow-[0_12px_36px_rgba(0,0,0,0.85)] backdrop-blur-xl p-3 sm:p-3.5 space-y-2.5 text-white"
          >
            {/* Top Header do Inspetor */}
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-primary shrink-0 animate-ping" />
                <span className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground truncate">
                  Menu de Alternância de Rotas
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-bold shrink-0">
                  {currentIndex + 1} de {totalRoutes} (A-Z)
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={handleOpenMap}
                  title="Ver catálogo completo de rotas"
                  className="flex items-center gap-1 text-[11px] font-body font-semibold px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                >
                  <LayoutGrid className="w-3 h-3 text-amber-400" />
                  <span className="hidden sm:inline">Mapa de Rotas</span>
                </button>
                <button
                  onClick={toggleMinimize}
                  title="Minimizar barra"
                  className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={closeInspector}
                  title="Encerrar menu flutuante"
                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Controle de Navegação Principal: [◀ Anterior] [ Rota Atual / Seletor ] [Próxima ▶] */}
            <div className="flex items-center gap-2">
              {/* Botão Anterior (com looping contínuo) */}
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-secondary/80 hover:bg-secondary border border-border text-xs font-body font-semibold transition-all active:scale-95 shrink-0 hover:border-white/20"
                title="Ir para a rota anterior (← Teclado)"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              {/* Botão Seletor de Rota (Abre dropdown rápido) */}
              <button
                onClick={() => setPickerOpen(!pickerOpen)}
                className="flex-1 min-w-0 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-card border border-primary/40 hover:border-primary transition-all text-left group"
                title="Clique para pesquisar e pular direto para qualquer rota"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-xs sm:text-[13px] font-bold text-red-400 truncate">
                      {currentPath}
                    </span>
                    {currentRouteItem && (
                      <span
                        title={`Peso estimado: ${currentRouteItem.weightEstimate}`}
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold border shrink-0 ${
                          currentRouteItem.weightLevel === 'muito_pesada'
                            ? 'bg-red-500/20 text-red-300 border-red-500/40'
                            : currentRouteItem.weightLevel === 'pesada'
                            ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                            : currentRouteItem.weightLevel === 'media'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : currentRouteItem.weightLevel === 'leve'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {currentRouteItem.weightEstimate}
                      </span>
                    )}
                    {currentRouteItem?.isRedirect && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold shrink-0">
                        Redirect → {currentRouteItem.redirectTarget}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate font-body">
                    {currentRouteItem?.label || 'Rota'} · {currentRouteItem?.description || ''}
                  </p>
                </div>
                <Search className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
              </button>

              {/* Botão Próxima (com looping contínuo) */}
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-body font-bold transition-all active:scale-95 shrink-0 shadow-md hover:shadow-primary/20"
                title="Ir para a próxima rota (→ Teclado)"
              >
                <span className="hidden sm:inline">Próxima</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Ações Auxiliares: Copiar, Perguntar à IA e Badges */}
            <div className="flex items-center justify-between gap-2 pt-1 text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyCurrent}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                  title="Copiar caminho da rota"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>Copiar</span>
                </button>

                <button
                  onClick={handleAskAI}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-amber-400 hover:text-amber-300 transition-colors"
                  title="Copiar prompt pronto para perguntar à IA"
                >
                  <MessageSquareQuote className="w-3.5 h-3.5" />
                  <span>Perguntar à IA</span>
                </button>

                <button
                  onClick={handleReloadCurrent}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-primary hover:text-primary/90 transition-colors"
                  title="Abrir novamente esta rota no navegador"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="hidden sm:inline">Abrir Rota</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground shrink-0">
                {currentRouteItem?.isProtected ? (
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Protegida
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Pública
                  </span>
                )}
                {currentRouteItem?.isAdmin && (
                  <span className="text-purple-400 font-bold">· Admin</span>
                )}
              </div>
            </div>

            {/* Dropdown / Modal de Busca Rápida de Rotas */}
            <AnimatePresence>
              {pickerOpen && (
                <motion.div
                  ref={pickerRef}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  className="rounded-xl border border-border bg-zinc-950 p-2.5 space-y-2 shadow-2xl max-h-[320px] flex flex-col"
                >
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={pickerSearch}
                      onChange={(e) => setPickerSearch(e.target.value)}
                      placeholder="Buscar rota para pular..."
                      autoFocus
                      className="w-full h-8 pl-8 pr-3 rounded-lg bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="overflow-y-auto divide-y divide-white/5 max-h-[240px] pr-1">
                    {filteredPickerRoutes.map((r) => {
                      const idx = INSPECTOR_ROUTES.findIndex((item) => item.path === r.path);
                      const isSelected = r.path === currentPath;
                      return (
                        <button
                          key={r.path}
                          onClick={() => handleGoTo(idx)}
                          className={`w-full text-left p-2 rounded-lg flex items-center justify-between gap-2 transition-colors ${
                            isSelected
                              ? 'bg-primary/20 text-primary font-bold'
                              : 'hover:bg-white/5 text-foreground/90'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono text-muted-foreground">
                                #{idx + 1}
                              </span>
                              <p className="font-mono text-xs truncate">{r.path}</p>
                              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-white/5 border border-white/10 text-muted-foreground shrink-0">
                                {r.weightEstimate}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate">{r.label}</p>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default RouteInspectorBar;
