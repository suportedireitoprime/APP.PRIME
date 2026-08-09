import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, PlayCircle, Route, Star, Trophy, BookOpenText, BrainCircuit, Menu, X } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { useState } from 'react';
import { Drawer, DrawerContent, DrawerOverlay, DrawerPortal } from '@/components/ui/drawer';

type Tab = {
  id: string;
  label: string;
  to: string;
  icon: typeof PlayCircle;
  match: (path: string) => boolean;
};

const TABS: Tab[] = [
  {
    id: 'categorias',
    label: 'Categorias',
    to: '/videoaulas/categorias',
    icon: LayoutGrid,
    match: (p) => p === '/videoaulas' || p.startsWith('/videoaulas/categorias'),
  },
  {
    id: 'trilhas',
    label: 'Trilhas',
    to: '/videoaulas/trilhas',
    icon: Route,
    match: (p) => p.startsWith('/videoaulas/trilhas'),
  },
  {
    id: 'praticar',
    label: 'Praticar',
    to: '/videoaulas/praticar',
    icon: BrainCircuit,
    match: (p) => p.startsWith('/videoaulas/praticar'),
  },
  {
    id: 'anotacoes',
    label: 'Anotações',
    to: '/videoaulas/anotacoes',
    icon: BookOpenText,
    match: (p) => p.startsWith('/videoaulas/anotacoes'),
  },
  {
    id: 'mais',
    label: 'Mais',
    to: '#', // Handled by drawer
    icon: Menu,
    match: (p) => p.startsWith('/videoaulas/favoritos') || p.startsWith('/videoaulas/conquistas'),
  },
];

const VideoaulasBottomNav = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <nav
        aria-label="Navegação Videoaulas"
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden md:bottom-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-auto"
      >
        <div className="bg-card/95 backdrop-blur-md border-t border-border rounded-t-3xl shadow-lg shadow-black/10 pb-[var(--sai-bottom,env(safe-area-inset-bottom,0px))] md:border md:rounded-full md:shadow-2xl md:shadow-black/30 md:pb-0">
          <div className="grid grid-cols-5 items-end px-1 pt-3.5 pb-3.5 max-w-lg mx-auto md:gap-1 md:px-3 md:py-2">
            {TABS.map((tab) => {
              const active = tab.id === 'mais' ? drawerOpen : tab.match(pathname);
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    haptic.selection();
                    if (tab.id === 'mais') {
                      setDrawerOpen(true);
                    } else if (!active) {
                      setDrawerOpen(false);
                      navigate(tab.to);
                    }
                  }}
                  className={`relative flex flex-col items-center justify-end gap-1 py-1.5 px-1 rounded-2xl transition-colors ${
                    active ? 'text-white' : 'text-muted-foreground hover:text-white/80'
                  }`}
                  aria-label={tab.label}
                  aria-current={active ? 'page' : undefined}
                >
                  {active && (
                    <motion.span
                      layoutId="videoaulas-nav-active-pill"
                      className="absolute inset-0 rounded-2xl bg-white/10 ring-1 ring-white/20"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      aria-hidden="true"
                    />
                  )}

                  <Icon className="relative w-7 h-7 sm:w-8 sm:h-8" strokeWidth={active ? 1.9 : 1.5} />
                  <span
                    className={`relative text-[10px] sm:text-[11px] leading-none ${
                      active ? 'font-bold' : 'font-medium'
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerPortal>
          <DrawerOverlay className="fixed inset-0 bg-black/60 z-50" onClick={() => setDrawerOpen(false)} />
          <DrawerContent className="bg-card flex flex-col rounded-t-[20px] fixed bottom-0 left-0 right-0 z-50 pb-[var(--sai-bottom,env(safe-area-inset-bottom,0px))]">
            <div className="p-4 bg-card rounded-t-[20px] flex-1">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted-foreground/20 mb-6" />
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-bold text-foreground mb-4 px-2">Mais Opções</h3>
                
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      haptic.selection();
                      setDrawerOpen(false);
                      navigate('/videoaulas/favoritos');
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 active:scale-[0.98] transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Star className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Aulas Favoritas</p>
                      <p className="text-xs text-muted-foreground">Suas aulas salvas para ver depois</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      haptic.selection();
                      setDrawerOpen(false);
                      navigate('/videoaulas/conquistas');
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 active:scale-[0.98] transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-[hsl(var(--aprender-accent))]">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Conquistas</p>
                      <p className="text-xs text-muted-foreground">Seu progresso e medalhas</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      haptic.selection();
                      setDrawerOpen(false);
                      navigate('/videoaulas');
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 active:scale-[0.98] transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                      <PlayCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Visão Geral (Painel)</p>
                      <p className="text-xs text-muted-foreground">Acesse seu progresso em vídeo</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </DrawerContent>
        </DrawerPortal>
      </Drawer>
    </>
  );
};

export default VideoaulasBottomNav;
