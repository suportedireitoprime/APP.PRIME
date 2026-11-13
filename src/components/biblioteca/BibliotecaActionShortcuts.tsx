import { memo } from 'react';
import { useNavigate, type NavigateFunction } from 'react-router-dom';
import { BookOpen, Map, Heart, HardDrive } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { abrirAtalhoBiblioteca } from './BibliotecaBottomNav';

const SHORTCUT_ITEMS = [
  { label: 'Leitura',     icon: BookOpen,   action: () => abrirAtalhoBiblioteca('leitura'),       color: '#FACC15' },
  { label: 'Trilhas',     icon: Map,        action: (navigate: NavigateFunction) => navigate('/bibliotecas/trilhas'), color: '#38BDF8' },
  { label: 'Favoritos',   icon: Heart,      action: () => abrirAtalhoBiblioteca('favoritos'),     color: '#F43F5E' },
  { label: 'Meus PDFs',   icon: HardDrive,  action: () => abrirAtalhoBiblioteca('personalizado'), color: '#A855F7' },
];

interface BibliotecaActionShortcutsProps {
  className?: string;
}

const BibliotecaActionShortcuts = ({ className = '' }: BibliotecaActionShortcutsProps) => {
  const navigate = useNavigate();

  return (
    <div
      className={`w-full flex items-center justify-between gap-1 sm:gap-2 bg-black/65 backdrop-blur-xl border-t border-white/10 rounded-b-[36px] px-3 sm:px-6 py-2.5 sm:py-3 shadow-2xl ${className}`}
    >
      {SHORTCUT_ITEMS.map((item, index) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              haptic.selection();
              item.action(navigate);
            }}
            style={{ '--shimmer-delay': `${index * 150}ms` } as React.CSSProperties}
            className="flex-1 group relative flex flex-col items-center justify-center py-1.5 sm:py-2 px-1 rounded-2xl hover:bg-white/10 active:bg-white/15 transition-all duration-200 active:scale-95 gap-1.5 text-center select-none cursor-pointer overflow-hidden"
          >
            <Icon
              className="w-[22px] h-[22px] shrink-0 transition-transform duration-200 group-hover:scale-110"
              style={{ color: item.color, filter: 'saturate(1.25) drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
              strokeWidth={2}
            />
            <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default memo(BibliotecaActionShortcuts);
