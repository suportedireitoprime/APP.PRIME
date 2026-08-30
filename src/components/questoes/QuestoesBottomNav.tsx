import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ListChecks, Route, Timer, Flame, Bell } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

const SLOTS = [
  { id: 'questoes', label: 'Questões', icon: ListChecks, route: '/questoes' },
  { id: 'trilhas', label: 'Trilhas', icon: Route, route: '/questoes/trilhas' },
  { id: 'simulado', label: 'Simulado', icon: Timer, route: '/questoes/simulado' },
  { id: 'desafios', label: 'Desafios', icon: Flame, route: '/questoes/desafios' },
  { id: 'lembretes', label: 'Lembretes', icon: Bell, route: '/questoes/lembretes' },
];

/** Rodapé da área de Questões — mesmo padrão visual do rodapé da Biblioteca. */
const QuestoesBottomNav = ({ hidden = false }: { hidden?: boolean }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <motion.nav
      aria-label="Navegação de Questões"
      data-bottom-nav
      initial={false}
      animate={hidden ? { y: 60, opacity: 0 } : { y: 0, opacity: 1 }}
      transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
      className="fixed bottom-0 left-0 right-0 z-50  md:bottom-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-auto"
    >
      <div className="bg-card/95 backdrop-blur-md border-t border-border rounded-t-3xl shadow-lg shadow-black/10 pb-[calc(0.5rem+var(--sai-bottom))] md:border md:rounded-full md:shadow-2xl md:shadow-black/30 md:pb-0">
        <div className="grid grid-cols-5 items-end px-1 pt-3.5 pb-3.5 max-w-lg mx-auto md:gap-1 md:px-3 md:py-2">
          {SLOTS.map((slot) => {
            const isActive = slot.route === '/questoes' ? pathname === '/questoes' : pathname.startsWith(slot.route);
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
                    layoutId="questoes-nav-active-pill"
                    className="absolute inset-0 rounded-2xl bg-white/10 ring-1 ring-white/20"
                    transition={{ type: 'tween', ease: 'easeOut', duration: 0.15 }}
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

export default QuestoesBottomNav;
