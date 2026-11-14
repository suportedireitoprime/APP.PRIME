import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Headphones, BookOpen, ScrollText, Pill } from 'lucide-react';
import { useShortcutBadges } from '@/hooks/useShortcutBadges';
import { prefetchRoute, type PrefetchKey } from '@/lib/routePrefetch';
import { haptic } from '@/lib/nativeHaptics';

const SHORTCUT_ITEMS = [
  { label: 'Audioaulas',  icon: Headphones,            to: '/audioaulas',       tag: null, prefetch: 'audioaulas' as PrefetchKey },
  { label: 'Audiobooks',  icon: BookOpen,              to: '/audiobooks',       tag: null, prefetch: 'audiobooks' as PrefetchKey },
  { label: 'Blog',        icon: ScrollText,            to: '/blog',             tag: null, prefetch: 'blog' as PrefetchKey },
  { label: 'Pílulas',     icon: Pill,                  to: '/pilulas',          tag: 'Novo', prefetch: 'pilulas' as PrefetchKey },
];

const HomeActionShortcuts = () => {
  const navigate = useNavigate();
  const shortcutBadges = useShortcutBadges();

  return (
    <div className="flex items-center justify-between gap-2 mx-1 mt-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl p-2 shadow-2xl">
      {SHORTCUT_ITEMS.map((item, index) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            type="button"
            onPointerDown={() => prefetchRoute(item.prefetch)}
            onMouseEnter={() => prefetchRoute(item.prefetch)}
            onFocus={() => prefetchRoute(item.prefetch)}
            onClick={() => {
              try {
                haptic.selection();
              } catch (err) {
                console.warn('[HomeActionShortcuts] Feedback error:', err);
              }
              navigate(item.to);
            }}
            style={{ '--shimmer-delay': `${index * 150}ms` } as React.CSSProperties}
            className="flex-1 group relative flex flex-col items-center justify-center pt-2.5 pb-2 px-1 rounded-[14px] hover:bg-white/5 active:bg-white/10 transition-all duration-200 active:scale-95 gap-1.5 text-center select-none cursor-pointer overflow-visible"
          >
            <div className="relative flex items-center justify-center">
              {item.tag && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-primary text-white text-[7.5px] sm:text-[8px] font-black tracking-wider uppercase leading-none shadow-[0_2px_8px_rgba(230,25,66,0.6)] border border-white/25 z-20 select-none pointer-events-none whitespace-nowrap">
                  {item.tag}
                </span>
              )}
              <Icon
                className="w-[22px] h-[22px] shrink-0 transition-transform duration-200 group-hover:scale-110 text-primary drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
              />
            </div>
            <span className="text-white/90 text-[10.5px] sm:text-[11px] font-medium tracking-tight whitespace-nowrap drop-shadow-sm group-hover:text-white transition-colors">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default memo(HomeActionShortcuts);
