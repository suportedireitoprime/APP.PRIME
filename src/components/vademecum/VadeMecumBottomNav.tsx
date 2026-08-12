import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Radar, BellRing, Heart, Newspaper, X, FileText, Landmark } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

type Tab = {
  id: string;
  label: string;
  to: string;
  icon: typeof Scale;
  match: (path: string) => boolean;
};

const TABS: Tab[] = [
  {
    id: 'leis',
    label: 'Leis',
    to: '/vade-mecum',
    icon: Scale,
    match: (p) => p === '/vade-mecum',
  },
  {
    id: 'favoritos',
    label: 'Favoritos',
    to: '/vade-mecum/favoritos',
    icon: Heart,
    match: (p) => p.startsWith('/vade-mecum/favoritos'),
  },
  {
    id: 'boletins',
    label: 'Boletins',
    to: '/boletins',
    icon: Newspaper,
    match: (p) => p.startsWith('/boletins'),
  },
  {
    id: 'radar',
    label: 'Radar',
    to: '/radar-360',
    icon: Radar,
    match: (p) => p.startsWith('/radar-360') || p.startsWith('/radares'),
  },
  {
    id: 'lembretes',
    label: 'Lembretes',
    to: '/meus-lembretes',
    icon: BellRing,
    match: (p) => p.startsWith('/meus-lembretes'),
  },
];

const VadeMecumBottomNav = ({ hidden = false }: { hidden?: boolean }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [radarMenuOpen, setRadarMenuOpen] = useState(false);

  return (
    <motion.nav
      aria-label="Navegação Vade Mecum"
      initial={false}
      animate={hidden ? { y: 120, opacity: 0 } : { y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden md:bottom-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-auto"
    >
      <div className="bg-card/95 backdrop-blur-md border-t border-border rounded-t-3xl shadow-lg shadow-black/10 pb-[calc(0.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] md:border md:rounded-full md:shadow-2xl md:shadow-black/30 md:pb-0">
        <div className="grid grid-cols-5 items-end px-1 pt-3.5 pb-3.5 max-w-lg mx-auto md:gap-1 md:px-3 md:py-2">
          {TABS.map((tab) => {
            const active = tab.match(pathname);
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  haptic.selection();
                  if (tab.id === 'radar') {
                    setRadarMenuOpen(true);
                  } else {
                    if (!active) navigate(tab.to);
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
                    layoutId="vademecum-nav-active-pill"
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
      </motion.nav>

      {/* Radar Sheet */}
      <AnimatePresence>
        {radarMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              onClick={() => setRadarMenuOpen(false)}
              className="fixed inset-0 z-[70] bg-background/80 lg:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              style={{ willChange: 'transform', transform: 'translateZ(0)' }}
              className="fixed bottom-0 left-0 right-0 z-[80] bg-card border-t border-border rounded-t-2xl pb-[var(--sai-bottom,env(safe-area-inset-bottom,0px))] lg:hidden"
            >
              <div className="flex items-center justify-center pt-2 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>
              <div className="flex items-center justify-between px-4 pb-3">
                <div className="flex items-center gap-2">
                  <Radar className="w-5 h-5 text-primary" />
                  <h3 className="font-display text-lg text-foreground">Radares</h3>
                </div>
                <button
                  onClick={() => setRadarMenuOpen(false)}
                  aria-label="Fechar radares"
                  className="w-12 h-12 rounded-full touch-manipulation bg-secondary flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-foreground" aria-hidden="true" />
                </button>
              </div>
              <div className="px-4 pb-8 flex flex-col gap-3">
                <button
                  onClick={() => {
                    haptic.selection();
                    setRadarMenuOpen(false);
                    navigate('/radares');
                  }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 hover:bg-secondary active:scale-[0.98] transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-body text-sm font-bold text-foreground">Radar de Leis</h4>
                    <p className="font-body text-xs text-muted-foreground mt-0.5">Resenha diária: novas Leis, Decretos e MPVs.</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    haptic.selection();
                    setRadarMenuOpen(false);
                    navigate('/radar-360');
                  }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 hover:bg-secondary active:scale-[0.98] transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-[#0EA5E9]/10 flex items-center justify-center shrink-0">
                    <Landmark className="w-5 h-5 text-[#0EA5E9]" />
                  </div>
                  <div>
                    <h4 className="font-body text-sm font-bold text-foreground">Radar Legislativo</h4>
                    <p className="font-body text-xs text-muted-foreground mt-0.5">Acompanhe projetos de lei, deputados e votações.</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default VadeMecumBottomNav;
