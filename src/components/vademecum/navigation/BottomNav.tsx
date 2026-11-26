import { useState, useEffect, Suspense, startTransition } from 'react';
import { createPortal } from 'react-dom';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Target,
  Headphones,
  NotebookPen,
  Brain,
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
  colorClass: string;
  prefetch?: PrefetchKey;
}> = [
  { id: 'questoes', label: 'Questões', desc: 'Banco completo por matéria e banca', to: '/questoes', icon: CheckSquare, colorClass: 'text-emerald-400', prefetch: 'questoes' },
  { id: 'flashcards', label: 'Flashcards', desc: 'Memorização ativa com repetição espaçada', to: '/flashcards', icon: Layers, colorClass: 'text-amber-400', prefetch: 'flashcards' },
  { id: 'simulado', label: 'Simulado', desc: 'Provas completas e estatísticas', to: '/simulados', icon: ListChecks, colorClass: 'text-sky-400' },
  { id: 'licoes', label: 'Lições', desc: 'Estudo guiado artigo por artigo', to: '/lei-seca', icon: FileText, colorClass: 'text-violet-400', prefetch: 'leiSeca' },
];

const AUDIOAULAS_ITENS: Array<{
  id: string;
  label: string;
  desc: string;
  to: string;
  icon: typeof Headphones;
  colorClass: string;
  prefetch?: PrefetchKey;
}> = [
  { id: 'audioaulas', label: 'Audioaulas', desc: 'Aulas narradas por área do Direito', to: '/audioaulas', icon: Headphones, colorClass: 'text-rose-400', prefetch: 'audioaulas' },
  { id: 'pilulas', label: 'Pílulas', desc: 'Conceitos essenciais em minutos', to: '/pilulas', icon: Pill, colorClass: 'text-cyan-400', prefetch: 'pilulas' },
];

const RESUMOS_ITENS: Array<{
  id: string;
  label: string;
  desc: string;
  to: string;
  icon: typeof NotebookPen;
  colorClass: string;
  prefetch?: PrefetchKey;
}> = [
  { id: 'resumos', label: 'Resumos', desc: 'Sínteses e anotações jurídicas', to: '/resumos-juridicos', icon: NotebookPen, colorClass: 'text-amber-400' },
  { id: 'mapas-mentais', label: 'Mapas Mentais', desc: 'Esquemas visuais para revisão rápida', to: '/mapas-mentais', icon: Brain, colorClass: 'text-violet-400' },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const [praticarOpen, setPraticarOpen] = useState(false);
  const [audioaulasOpen, setAudioaulasOpen] = useState(false);
  const [resumosOpen, setResumosOpen] = useState(false);
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
    setResumosOpen(false);
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

  const isResumosActive =
    resumosOpen ||
    path.startsWith('/resumos-juridicos') ||
    path.startsWith('/mapas-mentais');
  const isAulasActive = !praticarOpen && !audioaulasOpen && !resumosOpen && path.startsWith('/aulas');
  const isInicioActive =
    path === '/' &&
    !praticarOpen &&
    !audioaulasOpen &&
    !resumosOpen &&
    !isAulasActive;

  const navigateFromSheet = (to: string) => {
    haptic.selection();
    setPraticarOpen(false);
    setAudioaulasOpen(false);
    setResumosOpen(false);
    startTransition(() => navigate(to));
  };

  const navItems = [
    {
      id: 'inicio',
      label: 'Início',
      ariaLabel: 'Início',
      icon: Home,
      active: isInicioActive,
      onClick: () => {
        haptic.selection();
        setPraticarOpen(false);
        setAudioaulasOpen(false);
        setResumosOpen(false);
        if (path !== '/') startTransition(() => navigate('/'));
      },
    },
    {
      id: 'aulas',
      label: 'Aulas',
      ariaLabel: 'Aulas de Direito',
      icon: GraduationCap,
      active: isAulasActive,
      prefetch: 'aulas' as PrefetchKey,
      onClick: () => {
        haptic.selection();
        setPraticarOpen(false);
        setAudioaulasOpen(false);
        setResumosOpen(false);
        startTransition(() => navigate('/aulas'));
      },
    },
    {
      id: 'praticar',
      label: 'Praticar',
      ariaLabel: 'Praticar',
      icon: Target,
      active: isPraticarActive,
      onClick: () => {
        haptic.selection();
        setAudioaulasOpen(false);
        setResumosOpen(false);
        setPraticarOpen((prev) => !prev);
      },
    },
    {
      id: 'audioaulas',
      label: 'Em Áudio',
      ariaLabel: 'Em Áudio',
      icon: Headphones,
      active: isAudioaulasActive,
      onClick: () => {
        haptic.selection();
        setPraticarOpen(false);
        setResumosOpen(false);
        setAudioaulasOpen((prev) => !prev);
      },
    },
    {
      id: 'resumos',
      label: 'Resumos',
      ariaLabel: 'Resumos e Mapas Mentais',
      icon: NotebookPen,
      active: isResumosActive,
      onClick: () => {
        haptic.selection();
        setPraticarOpen(false);
        setAudioaulasOpen(false);
        setResumosOpen((prev) => !prev);
      },
    },
  ];

  const navContent = (
    <>
      <nav
        aria-label="Navegação principal"
        role="navigation"
        data-bottom-nav
        className={`fixed z-50 transition-all duration-200 ease-out
          bottom-[calc(0.75rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] left-2.5 right-2.5 sm:left-5 sm:right-5 mx-auto w-auto max-w-xl sm:max-w-2xl
          bg-[#141418]/94 backdrop-blur-xl border border-white/15 rounded-[28px] sm:rounded-[30px] shadow-[0_14px_36px_rgba(0,0,0,0.72)]
          md:top-0 md:bottom-0 md:left-0 md:right-auto md:mx-0 md:max-w-none md:w-[100px] md:border-t-0 md:rounded-none md:bg-black/95 md:shadow-none md:border-r md:border-white/10
          ${hideNav ? 'translate-y-[160%] md:-translate-x-[140%] md:translate-y-0 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}
      >
        <div
          onPointerDown={handleNavWarmup}
          onTouchStart={handleNavWarmup}
          className="relative z-10 md:h-full"
        >
          <div className="px-2.5 py-2.5 sm:px-3.5 sm:py-3 md:px-2.5 md:py-8 md:h-full md:flex md:flex-col md:justify-center">
            <div className="grid grid-cols-5 items-center gap-1.5 sm:gap-2.5 md:grid-cols-1 md:items-stretch md:gap-5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onPointerDown={item.prefetch ? () => prefetchRoute(item.prefetch!) : undefined}
                    onMouseEnter={item.prefetch ? () => prefetchRoute(item.prefetch!) : undefined}
                    onClick={item.onClick}
                    data-track="bottom_nav_click"
                    data-track-destino={item.id}
                    className={`min-h-[64px] sm:min-h-[70px] md:min-h-[74px] flex flex-col items-center justify-center gap-1.5 py-2.5 px-1.5 sm:px-2.5 md:py-4 rounded-2xl transition-all active:scale-95 touch-manipulation cursor-pointer ${
                      item.active
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30 font-semibold'
                        : 'text-white/65 hover:text-white hover:bg-white/5'
                    }`}
                    aria-label={item.ariaLabel}
                  >
                    <Icon
                      className="w-7 h-7 sm:w-[30px] sm:h-[30px] shrink-0"
                      strokeWidth={item.active ? 2.1 : 1.75}
                    />
                    <span className="font-body text-[11px] sm:text-[12px] md:text-[11.5px] leading-tight text-center truncate max-w-full">
                      {item.label}
                    </span>
                  </button>
                );
              })}
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
                    <Icon className={`w-6 h-6 shrink-0 ${item.colorClass}`} strokeWidth={1.9} />
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
                    <Icon className={`w-6 h-6 shrink-0 ${item.colorClass}`} strokeWidth={1.9} />
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

      {/* Sheet Minimalista: Resumos */}
      {resumosOpen && (
        <>
          <div
            onClick={() => setResumosOpen(false)}
            className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-[2px]"
          />
          <div className="fixed bottom-0 left-0 right-0 z-[80] bg-[#141417] border-t border-white/10 rounded-t-3xl pb-[calc(1.25rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] shadow-2xl md:max-w-lg md:mx-auto md:bottom-6 md:rounded-3xl md:border">
            <div className="flex items-center justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/15" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3 pt-1">
              <div>
                <h3 className="font-display text-base font-semibold text-white tracking-tight">Resumos</h3>
                <p className="font-body text-xs text-white/50">Revise com sínteses e esquemas visuais</p>
              </div>
              <button
                type="button"
                onClick={() => { haptic.light(); setResumosOpen(false); }}
                aria-label="Fechar Resumos"
                className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-4 space-y-2">
              {RESUMOS_ITENS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onPointerEnter={() => { if (item.prefetch) prefetchRoute(item.prefetch); }}
                    onClick={() => navigateFromSheet(item.to)}
                    className="w-full min-h-[56px] flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 active:scale-[0.99] transition-all text-left cursor-pointer"
                  >
                    <Icon className={`w-6 h-6 shrink-0 ${item.colorClass}`} strokeWidth={1.9} />
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
