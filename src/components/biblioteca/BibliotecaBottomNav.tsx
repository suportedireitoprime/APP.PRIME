import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookMarked, Heart, Clock, HardDrive, Library } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

export type BibliotecaAtalhoTab = 'leitura' | 'favoritos' | 'recentes' | 'offline';

/** Abre um dos painéis da BibliotecaAtalhosBar (Leitura, Favoritos, Recentes, Offline). */
export function abrirAtalhoBiblioteca(tab: BibliotecaAtalhoTab) {
  window.dispatchEvent(new CustomEvent('biblioteca-atalho', { detail: { tab } }));
}

type Slot = {
  id: 'leitura' | 'favoritos' | 'biblioteca' | 'recentes' | 'offline';
  label: string;
  icon: typeof Heart;
};

const SLOTS: Slot[] = [
  { id: 'biblioteca', label: 'Biblioteca', icon: Library },
  { id: 'leitura', label: 'Leitura', icon: BookMarked },
  { id: 'favoritos', label: 'Favoritos', icon: Heart },
  { id: 'recentes', label: 'Recentes', icon: Clock },
  { id: 'offline', label: 'Offline', icon: HardDrive },
];

/**
 * Rodapé da Biblioteca — mesmo padrão visual do rodapé do Vade Mecum
 * (painel cinza translúcido com pílula de item ativo).
 */
const BibliotecaBottomNav = ({ hidden = false }: { hidden?: boolean }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [active, setActive] = useState<Slot['id']>('biblioteca');

  const handle = (slot: Slot) => {
    haptic.selection();
    setActive(slot.id);
    if (slot.id === 'biblioteca') {
      if (pathname !== '/bibliotecas') navigate('/bibliotecas');
      return;
    }
    abrirAtalhoBiblioteca(slot.id);
  };

  return (
    <motion.nav
      aria-label="Navegação da Biblioteca"
      data-bottom-nav
      initial={false}
      animate={hidden ? { y: 120, opacity: 0 } : { y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden md:bottom-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-auto"
    >
      <div className="bg-card/95 backdrop-blur-md border-t border-border rounded-t-3xl shadow-lg shadow-black/10 pb-[var(--sai-bottom,env(safe-area-inset-bottom,0px))] md:border md:rounded-full md:shadow-2xl md:shadow-black/30 md:pb-0">
        <div className="grid grid-cols-5 items-end px-1 pt-3.5 pb-3.5 max-w-lg mx-auto md:gap-1 md:px-3 md:py-2">
          {SLOTS.map((slot) => {
            const isActive = active === slot.id;
            const Icon = slot.icon;
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => handle(slot)}
                className={`relative flex flex-col items-center justify-end gap-1 py-1.5 px-1 rounded-2xl transition-colors ${
                  isActive ? 'text-white' : 'text-muted-foreground hover:text-white/80'
                }`}
                aria-label={slot.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && (
                  <motion.span
                    layoutId="biblioteca-nav-active-pill"
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

export default BibliotecaBottomNav;
