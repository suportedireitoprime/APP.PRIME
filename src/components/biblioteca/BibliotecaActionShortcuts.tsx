import { memo } from 'react';
import { useNavigate, type NavigateFunction } from 'react-router-dom';
import { BookOpen, Map, Bookmark, HardDrive } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { abrirAtalhoBiblioteca } from './BibliotecaBottomNav';

const SHORTCUT_ITEMS = [
  { label: 'Leitura',     icon: BookOpen,   action: () => abrirAtalhoBiblioteca('leitura'),       color: '#C084FC' },
  { label: 'Trilhas',     icon: Map,        action: (navigate: NavigateFunction) => navigate('/bibliotecas/trilhas'), color: '#C084FC' },
  { label: 'Favoritos',   icon: Bookmark,   action: () => abrirAtalhoBiblioteca('favoritos'),     color: '#C084FC' },
  { label: 'Meus PDFs',   icon: HardDrive,  action: () => abrirAtalhoBiblioteca('personalizado'), color: '#C084FC' },
];

interface BibliotecaActionShortcutsProps {
  className?: string;
}

const BibliotecaActionShortcuts = ({ className = '' }: BibliotecaActionShortcutsProps) => {
  const navigate = useNavigate();

  return (
    <div
      className={`flex items-center justify-between gap-2 mx-1 mt-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-[32px] sm:rounded-[36px] py-2.5 sm:py-3 px-3 sm:px-4 shadow-2xl ${className}`}
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
            className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-2xl hover:bg-white/5 active:bg-white/10 transition-all duration-200 active:scale-95 gap-1.5 text-center select-none cursor-pointer overflow-hidden"
          >
            <Icon
              className="w-[26px] h-[26px] shrink-0 transition-transform duration-200 group-hover:scale-110"
              style={{
                color: item.color,
                filter: 'drop-shadow(0 2px 5px rgba(0, 0, 0, 0.65))',
              }}
              strokeWidth={2.1}
            />
            <span className="text-white/95 text-[12px] sm:text-[12.5px] font-semibold tracking-tight whitespace-nowrap drop-shadow-sm group-hover:text-white transition-colors">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default memo(BibliotecaActionShortcuts);
