import { memo } from 'react';
import { BookOpen, Flame, Bookmark, HardDrive } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { abrirAtalhoBiblioteca } from './BibliotecaBottomNav';

const SHORTCUT_ITEMS = [
  { label: 'Leitura',   icon: BookOpen,  action: () => abrirAtalhoBiblioteca('leitura') },
  { label: 'Em Alta',   icon: Flame,     action: () => abrirAtalhoBiblioteca('em-alta') },
  { label: 'Favoritos', icon: Bookmark,  action: () => abrirAtalhoBiblioteca('favoritos') },
  { label: 'Meus PDFs', icon: HardDrive, action: () => abrirAtalhoBiblioteca('personalizado') },
];

interface BibliotecaActionShortcutsProps {
  className?: string;
}

const BibliotecaActionShortcuts = ({ className = '' }: BibliotecaActionShortcutsProps) => {
  return (
    <div
      className={`grid grid-cols-4 gap-1.5 bg-zinc-900/75 border border-white/10 rounded-2xl p-1 ${className}`}
    >
      {SHORTCUT_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              haptic.selection();
              item.action();
            }}
            className="group flex flex-col items-center justify-center min-h-[44px] py-1.5 px-1 rounded-xl hover:bg-white/5 active:bg-white/10 active:scale-95 transition-all gap-1 text-center select-none cursor-pointer"
          >
            <Icon
              className="w-4 h-4 shrink-0 text-zinc-300 group-hover:text-white transition-colors"
              strokeWidth={2}
            />
            <span className="text-zinc-300 group-hover:text-white text-[11px] font-medium tracking-tight whitespace-nowrap transition-colors">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default memo(BibliotecaActionShortcuts);
