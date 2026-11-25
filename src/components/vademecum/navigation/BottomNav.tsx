import { useState, useEffect, Suspense, startTransition } from 'react';
import { createPortal } from 'react-dom';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Target,
  Headphones,
  BookOpen,
  GraduationCap,
  ChevronRight,
  X,
  CheckSquare,
  Layers,
  ListChecks,
  FileText,
  Pill,
} from 'lucide-react';

import { haptic } from '@/lib/nativeHaptics';
import { useKeyboardHeight } from '@/hooks/useKeyboardListeners';
import { pushRecente } from '@/lib/leisRecentes';
import { startAppMetrics } from '@/lib/appMetrics';
import { usePrefetchProfileSummary } from '@/hooks/useProfileSummary';
import { tipoToSlug, leiToSlug } from '@/lib/legislacaoSlugs';
import { prefetchRoute, prefetchMainTabsIdle, type PrefetchKey } from '@/lib/routePrefetch';

const SideMenu = lazyWithRetry(() => import('@/components/vademecum/navigation/SideMenu'));
const SearchOverlay = lazyWithRetry(() => import('@/components/vademecum/overlays/SearchOverlay'));
const AssistenteOverlay = lazyWithRetry(() => import('@/components/vademecum/overlays/AssistenteOverlay'));

const PRATICAR_ITENS: Array<{
  id: string;
  label: string;
  desc: string;
  to: string;
  icon: typeof Target;
  prefetch?: PrefetchKey;
}> = [
  { id: 'questoes', label: 'Questões', desc: 'Banco completo por matéria e banca', to: '/questoes', icon: CheckSquare, prefetch: 'questoes' },
  { id: 'flashcards', label: 'Flashcards', desc: 'Memorização ativa com repetição espaçada', to: '/flashcards', icon: Layers, prefetch: 'flashcards' },
  { id: 'simulado', label: 'Simulado', desc: 'Provas completas e estatísticas', to: '/simulados', icon: ListChecks },
  { id: 'licoes', label: 'Lições', desc: 'Estudo guiado artigo por artigo', to: '/lei-seca', icon: FileText, prefetch: 'leiSeca' },
];

const AUDIOAULAS_ITENS: Array<{
  id: string;
  label: string;
  desc: string;
  to: string;
  icon: typeof Headphones;
  prefetch?: PrefetchKey;
}> = [
  { id: 'audioaulas', label: 'Audioaulas', desc: 'Aulas narradas por área do Direito', to: '/audioaulas', icon: Headphones, prefetch: 'audioaulas' },
  { id: 'pilulas', label: 'Pílulas', desc: 'Conceitos essenciais em minutos', to: '/pilulas', icon: Pill, prefetch: 'pilulas' },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const [praticarOpen, setPraticarOpen] = useState(false);
  const [audioaulasOpen, setAudioaulasOpen] = useState(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [externalMenuOpen, setExternalMenuOpen] = useState(false);
  const [explicitHidden, setExplicitHidden] = useState(false);

  const prefetchProfile = usePrefetchProfileSummary();

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setExternalMenuOpen(!!detail?.open);
    };
    window.addEventListener('sidemenu-state', handler);
    startAppMetrics();
    const idle: any = (window as any).requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 300));
    idle(() => {
      prefetchProfile();
      import('@/components/vademecum/navigation/SideMenu').catch(() => {});
    });
    return () => window.removeEventListener('sidemenu-state', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleOpenChat = () => setChatOpen(true);
    window.addEventListener('direitoprime:abrir-chat', handleOpenChat);
    return () => window.removeEventListener('direitoprime:abrir-chat', handleOpenChat);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { hidden?: boolean } | undefined;
      if (detail && typeof detail.hidden === 'boolean') {
        setExplicitHidden(detail.hidden);
      }
    };
    window.addEventListener('direitoprime:bottom-nav-visibility', handler as EventListener);
    return () => window.removeEventListener('direitoprime:bottom-nav-visibility', handler as EventListener);
  }, []);

  useEffect(() => {
    setExternalMenuOpen(false);
    setSideMenuOpen(false);
    setExplicitHidden(false);
    setPraticarOpen(false);
    setAudioaulasOpen(false);
  }, [path]);

  useEffect(() => {
    prefetchMainTabsIdle();
  }, []);

  const handleNavWarmup = () => {
    try {
      prefetchRoute('biblioteca');
      prefetchRoute('aulas');
    } catch {
      /* noop */
    }
  };

  const keyboardHeight = useKeyboardHeight();
  const hideNav =
    sideMenuOpen ||
    externalMenuOpen ||
    explicitHidden ||
    keyboardHeight > 0 ||
    path.startsWith('/blog') ||
    path.startsWith('/noticias/boletins');

  // Visível na Home e nas seções principais de Biblioteca
  if (path !== '/' && path !== '/biblioteca' && !path.startsWith('/bibliotecas')) {
    return null;
  }

  const isPraticarActive =
    praticarOpen ||
    path.startsWith('/questoes') ||
    path.startsWith('/flashcards') ||
    path.startsWith('/simulados') ||
    path.startsWith('/lei-seca') ||
    path.startsWith('/licoes');

  const isAudioaulasActive =
    audioaulasOpen ||
    path.startsWith('/audioaulas') ||
    path.startsWith('/pilulas');

  const isBibliotecaActive = !praticarOpen && !audioaulasOpen && path.startsWith('/biblioteca');
  const isAulasActive = !praticarOpen && !audioaulasOpen && path.startsWith('/aulas');
  const isInicioActive =
    path === '/' &&
    !praticarOpen &&
    !audioaulasOpen &&
    !isBibliotecaActive &&
    !isAulasActive;

  const navigateFromSheet = (to: string) => {
    haptic.selection();
    setPraticarOpen(false);
    setAudioaulasOpen(false);
    startTransition(() => navigate(to));
  };

  const navContent = (
    <>
      <nav
        aria-label="Navegação principal"
        role="navigation"
        data-bottom-nav
        className={`fixed z-50 transition-all duration-200 ease-out
          bottom-[calc(0.75rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] left-3 right-3 mx-auto max-w-md
          bg-[#141418]/92 backdrop-blur-xl border border-white/15 rounded-3xl shadow-[0_14px_36px_rgba(0,0,0,0.72)]
          md:top-0 md:bottom-0 md:left-0 md:right-auto md:mx-0 md:max-w-none md:w-[90px] md:border-t-0 md:rounded-none md:bg-black/95 md:shadow-none md:border-r md:border-white/10
          ${hideNav ? 'translate-y-[160%] md:-translate-x-[140%] md:translate-y-0 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}
      >
        <div
          onPointerDown={handleNavWarmup}
          onTouchStart={handleNavWarmup}
          className="relative z-10 md:h-full"
        >
          <div className="px-1.5 py-1.5 md:px-2 md:py-8 md:h-full md:flex md:flex-col md:justify-center">
            <div className="grid grid-cols-5 items-center gap-1 md:grid-cols-1 md:items-stretch md:gap-4">
              {/* 1. Início */}
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setPraticarOpen(false);
                  setAudioaulasOpen(false);
                  if (path !== '/') startTransition(() => navigate('/'));
                }}
                data-track="bottom_nav_click"
                data-track-destino="inicio"
                className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 md:py-3 rounded-2xl transition-all active:scale-95 touch-manipulation cursor-pointer ${
                  isInicioActive
                    ? 'bg-white text-zinc-950 shadow-sm font-semibold'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
                aria-label="Início"
              >
                <Home className="w-5 h-5 md:w-6 md:h-6" strokeWidth={isInicioActive ? 2 : 1.6} />
                <span className="font-body text-[10px] leading-tight text-center truncate max-w-full">
                  Início
                </span>
              </button>

              {/* 2. Praticar */}
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setAudioaulasOpen(false);
                  setPraticarOpen((prev) => !prev);
                }}
                data-track="bottom_nav_click"
                data-track-destino="praticar"
                className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 md:py-3 rounded-2xl transition-all active:scale-95 touch-manipulation cursor-pointer ${
                  isPraticarActive
                    ? 'bg-white text-zinc-950 shadow-sm font-semibold'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
                aria-label="Praticar"
              >
                <Target className="w-5 h-5 md:w-6 md:h-6" strokeWidth={isPraticarActive ? 2 : 1.6} />
                <span className="font-body text-[10px] leading-tight text-center truncate max-w-full">
                  Praticar
                </span>
              </button>

              {/* 3. Audioaulas */}
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setPraticarOpen(false);
                  setAudioaulasOpen((prev) => !prev);
                }}
                data-track="bottom_nav_click"
                data-track-destino="audioaulas"
                className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 md:py-3 rounded-2xl transition-all active:scale-95 touch-manipulation cursor-pointer ${
                  isAudioaulasActive
                    ? 'bg-white text-zinc-950 shadow-sm font-semibold'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
                aria-label="Audioaulas"
              >
                <Headphones className="w-5 h-5 md:w-6 md:h-6" strokeWidth={isAudioaulasActive ? 2 : 1.6} />
                <span className="font-body text-[10px] leading-tight text-center truncate max-w-full">
                  Audioaulas
                </span>
              </button>

              {/* 4. Biblioteca */}
              <button
                type="button"
                onPointerDown={() => prefetchRoute('biblioteca')}
                onMouseEnter={() => prefetchRoute('biblioteca')}
                onClick={() => {
                  haptic.selection();
                  setPraticarOpen(false);
                  setAudioaulasOpen(false);
                  startTransition(() => navigate('/bibliotecas'));
                }}
                data-track="bottom_nav_click"
                data-track-destino="biblioteca"
                className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 md:py-3 rounded-2xl transition-all active:scale-95 touch-manipulation cursor-pointer ${
                  isBibliotecaActive
                    ? 'bg-white text-zinc-950 shadow-sm font-semibold'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
                aria-label="Biblioteca"
              >
                <BookOpen className="w-5 h-5 md:w-6 md:h-6" strokeWidth={isBibliotecaActive ? 2 : 1.6} />
                <span className="font-body text-[10px] leading-tight text-center truncate max-w-full">
                  Biblioteca
                </span>
              </button>

              {/* 5. Aulas de Direito */}
              <button
                type="button"
                onPointerDown={() => prefetchRoute('aulas')}
                onMouseEnter={() => prefetchRoute('aulas')}
                onClick={() => {
                  haptic.selection();
                  setPraticarOpen(false);
                  setAudioaulasOpen(false);
                  startTransition(() => navigate('/aulas'));
                }}
                data-track="bottom_nav_click"
                data-track-destino="aulas"
                className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 md:py-3 rounded-2xl transition-all active:scale-95 touch-manipulation cursor-pointer ${
                  isAulasActive
                    ? 'bg-white text-zinc-950 shadow-sm font-semibold'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
                aria-label="Aulas de Direito"
              >
                <GraduationCap className="w-5 h-5 md:w-6 md:h-6" strokeWidth={isAulasActive ? 2 : 1.6} />
                <span className="font-body text-[10px] leading-tight text-center truncate max-w-full">
                  Aulas
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sheet Minimalista: Praticar */}
      {praticarOpen && (
        <>
          <div
            onClick={() => setPraticarOpen(false)}
            className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-[2px]"
          />
          <div className="fixed bottom-0 left-0 right-0 z-[80] bg-[#141417] border-t border-white/10 rounded-t-3xl pb-[calc(1.25rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] shadow-2xl md:max-w-lg md:mx-auto md:bottom-6 md:rounded-3xl md:border">
            <div className="flex items-center justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/15" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3 pt-1">
              <div>
                <h3 className="font-display text-base font-semibold text-white tracking-tight">Praticar</h3>
                <p className="font-body text-xs text-white/50">Escolha como treinar agora</p>
              </div>
              <button
                type="button"
                onClick={() => { haptic.light(); setPraticarOpen(false); }}
                aria-label="Fechar Praticar"
                className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-4 space-y-2">
              {PRATICAR_ITENS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onPointerEnter={() => { if (item.prefetch) prefetchRoute(item.prefetch); }}
                    onClick={() => navigateFromSheet(item.to)}
                    className="w-full min-h-[56px] flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 active:scale-[0.99] transition-all text-left cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/90 shrink-0">
                      <Icon className="w-5 h-5" strokeWidth={1.6} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-semibold text-white leading-tight">{item.label}</p>
                      <p className="font-body text-xs text-white/50 truncate mt-0.5">{item.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/35 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Sheet Minimalista: Audioaulas */}
      {audioaulasOpen && (
        <>
          <div
            onClick={() => setAudioaulasOpen(false)}
            className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-[2px]"
          />
          <div className="fixed bottom-0 left-0 right-0 z-[80] bg-[#141417] border-t border-white/10 rounded-t-3xl pb-[calc(1.25rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] shadow-2xl md:max-w-lg md:mx-auto md:bottom-6 md:rounded-3xl md:border">
            <div className="flex items-center justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/15" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3 pt-1">
              <div>
                <h3 className="font-display text-base font-semibold text-white tracking-tight">Audioaulas</h3>
                <p className="font-body text-xs text-white/50">Estude ouvindo em qualquer lugar</p>
              </div>
              <button
                type="button"
                onClick={() => { haptic.light(); setAudioaulasOpen(false); }}
                aria-label="Fechar Audioaulas"
                className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-4 space-y-2">
              {AUDIOAULAS_ITENS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onPointerEnter={() => { if (item.prefetch) prefetchRoute(item.prefetch); }}
                    onClick={() => navigateFromSheet(item.to)}
                    className="w-full min-h-[56px] flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 active:scale-[0.99] transition-all text-left cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/90 shrink-0">
                      <Icon className="w-5 h-5" strokeWidth={1.6} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-semibold text-white leading-tight">{item.label}</p>
                      <p className="font-body text-xs text-white/50 truncate mt-0.5">{item.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/35 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {sideMenuOpen && (
        <Suspense fallback={null}>
          <SideMenu open={sideMenuOpen} onClose={() => setSideMenuOpen(false)} />
        </Suspense>
      )}

      {searchOpen && (
        <Suspense fallback={null}>
          <SearchOverlay
            open={searchOpen}
            onClose={() => setSearchOpen(false)}
            onSelectLei={(lei) => {
              setSearchOpen(false);
              pushRecente({
                tipo: lei.tipo,
                leiId: lei.leiId,
                nome: lei.nome,
                descricao: lei.descricao,
                tabela_nome: lei.tabela_nome,
              });
              const slug = leiToSlug({ id: lei.leiId, nome: lei.nome });
              const base = `/legislacao/${tipoToSlug(lei.tipo)}/${slug}`;
              navigate(lei.artigoNumero ? `${base}/${encodeURIComponent(lei.artigoNumero)}` : base);
            }}
          />
        </Suspense>
      )}

      {chatOpen && (
        <Suspense fallback={null}>
          <AssistenteOverlay open={chatOpen} onClose={() => setChatOpen(false)} />
        </Suspense>
      )}
    </>
  );

  return typeof document !== 'undefined' ? createPortal(navContent, document.body) : navContent;
};

export default BottomNav;
