import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Radar, Briefcase, MapPin, Bell, BarChart3 } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

type Tab = {
  id: string;
  label: string;
  to: string;
  icon: typeof Radar;
  match: (path: string) => boolean;
};

const TABS: Tab[] = [
  {
    id: 'concursos',
    label: 'Concursos',
    to: '/radar-concursos',
    icon: Radar,
    match: (p) => p === '/radar-concursos' || p === '/radar-concursos/' || p === '/concursos/radar' || p === '/ferramentas/radar-concursos',
  },
  {
    id: 'cargos',
    label: 'Cargos',
    to: '/radar-concursos/cargos',
    icon: Briefcase,
    match: (p) => p.startsWith('/radar-concursos/cargos'),
  },
  {
    id: 'regioes',
    label: 'Regiões',
    to: '/radar-concursos/regioes',
    icon: MapPin,
    match: (p) => p.startsWith('/radar-concursos/regioes'),
  },
  {
    id: 'alertas',
    label: 'Alertas',
    to: '/radar-concursos/alertas',
    icon: Bell,
    match: (p) => p.startsWith('/radar-concursos/alertas'),
  },
  {
    id: 'estatisticas',
    label: 'Estatísticas',
    to: '/radar-concursos/estatisticas',
    icon: BarChart3,
    match: (p) => p.startsWith('/radar-concursos/estatisticas'),
  },
];

const RadarBottomNav = ({ hidden = false }: { hidden?: boolean }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <motion.nav
      aria-label="Navegação do Radar"
      initial={false}
      animate={hidden ? { y: 120, opacity: 0 } : { y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed bottom-0 left-0 right-0 z-50  md:bottom-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-auto"
    >
      <div className="bg-card/95 backdrop-blur-md border-t border-border rounded-t-3xl shadow-lg shadow-black/10 pb-[calc(0.5rem+var(--sai-bottom))] md:border md:rounded-full md:shadow-2xl md:shadow-black/30 md:pb-0">
        <div className="grid grid-cols-5 items-end px-1 pt-3.5 pb-3.5 max-w-lg mx-auto md:gap-1 md:px-3 md:py-2">
          {TABS.map((tab) => {
            const active = tab.match(pathname);
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  haptic.selection();
                  if (!active && tab.to) {
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
                    layoutId="radar-nav-active-pill"
                    className="absolute inset-0 rounded-2xl bg-white/20 ring-1 ring-white/40 shadow-[0_0_15px_rgba(255,255,255,0.15)]"
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
  );
};

export default RadarBottomNav;
