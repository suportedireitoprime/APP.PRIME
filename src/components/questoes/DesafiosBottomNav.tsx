import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Flame, ListChecks, BarChart3, Medal } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

const SLOTS = [
  { id: 'desafios', label: 'Desafios', icon: Trophy, route: '/questoes/desafios' },
  { id: 'pendentes', label: 'Pendentes', icon: Flame, route: '/questoes/desafios?trilha=pendentes' },
  { id: 'praticar', label: 'Praticar', icon: ListChecks, route: '/questoes/praticar' },
  { id: 'desempenho', label: 'Desempenho', icon: BarChart3, route: '/questoes/desempenho' },
  { id: 'conquistas', label: 'Conquistas', icon: Medal, route: '/questoes/desafios/conquistas' },
];

/** Rodapé exclusivo da área de Desafios — mesmo padrão do rodapé de Questões. */
const DesafiosBottomNav = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const trilha = params.get('trilha');

  const ativo = (id: string) => {
    if (pathname === '/questoes/desafios/conquistas') return id === 'conquistas';
    if (pathname === '/questoes/desafios') return id === 'pendentes' ? trilha === 'pendentes' : id === 'desafios' && trilha !== 'pendentes';
    if (pathname.startsWith('/questoes/praticar')) return id === 'praticar';
    if (pathname.startsWith('/questoes/desempenho')) return id === 'desempenho';
    return false;
  };

  return (
    <motion.nav
      aria-label="Navegação de Desafios"
      data-bottom-nav
      initial={false}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed bottom-0 left-0 right-0 z-50  md:bottom-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-auto"
    >
      <div className="bg-card/95 backdrop-blur-md border-t border-border rounded-t-3xl shadow-lg shadow-black/10 pb-safe md:border md:rounded-full md:shadow-2xl md:shadow-black/30 md:pb-0">
        <div className="grid grid-cols-5 items-end px-1 pt-3.5 pb-3.5 max-w-lg mx-auto md:gap-1 md:px-3 md:py-2">
          {SLOTS.map((slot) => {
            const isActive = ativo(slot.id);
            const Icon = slot.icon;
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => { haptic.selection(); navigate(slot.route); }}
                className={`relative flex flex-col items-center justify-end gap-1 py-1.5 px-0.5 rounded-2xl transition-colors ${
                  isActive ? 'text-white' : 'text-muted-foreground hover:text-white/80'
                }`}
                aria-label={slot.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && (
                  <motion.span
                    layoutId="desafios-nav-active-pill"
                    className="absolute inset-0 rounded-2xl bg-white/10 ring-1 ring-white/20"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    aria-hidden="true"
                  />
                )}
                <Icon className="relative w-7 h-7 sm:w-8 sm:h-8" strokeWidth={isActive ? 1.9 : 1.5} />
                <span className={`relative text-[10px] sm:text-[11px] leading-none ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {slot.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
};

export default DesafiosBottomNav;
