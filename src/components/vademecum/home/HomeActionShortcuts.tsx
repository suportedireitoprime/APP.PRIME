import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Headphones, BookOpen, ScrollText, Radio } from 'lucide-react';
import { useShortcutBadges } from '@/hooks/useShortcutBadges';
import { prefetchRoute, type PrefetchKey } from '@/lib/routePrefetch';
import { haptic } from '@/lib/nativeHaptics';

const SHORTCUT_ITEMS = [
  { label: 'Audioaulas',  icon: Headphones,            to: '/audioaulas',       color: '#A855F7', badgeColor: null, badgeKey: null, tag: null, prefetch: 'audioaulas' as PrefetchKey },
  { label: 'Audiobooks',  icon: BookOpen,              to: '/audiobooks',       color: '#F43F5E', badgeColor: null, badgeKey: null, tag: 'Novo', prefetch: 'audiobooks' as PrefetchKey },
  { label: 'Blog',        icon: ScrollText,            to: '/blog',             color: '#FACC15', badgeColor: null, badgeKey: null, tag: null, prefetch: 'blog' as PrefetchKey },
  { label: 'Boletins',    icon: Radio,                 to: '/boletins',         color: '#38BDF8', badgeColor: '#EF4444', badgeKey: 'boletim' as const, tag: null, prefetch: 'boletins' as PrefetchKey },
];

const HomeActionShortcuts = () => {
  const navigate = useNavigate();
  const shortcutBadges = useShortcutBadges();

  return (
    <div className="flex items-center justify-between gap-1.5 mx-1 mt-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-1.5 shadow-2xl">
      {SHORTCUT_ITEMS.map((item, index) => {
        const Icon = item.icon;
        const badgeCount = item.badgeKey ? shortcutBadges.counts[item.badgeKey] : 0;
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
                if (item.badgeKey) shortcutBadges.markSeen(item.badgeKey);
              } catch (err) {
                console.warn('[HomeActionShortcuts] Feedback error:', err);
              }
              navigate(item.to);
            }}
            style={{ '--shimmer-delay': `${index * 150}ms` } as React.CSSProperties}
            className="flex-1 group relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl hover:bg-white/5 active:bg-white/10 transition-all duration-200 active:scale-95 gap-1 text-center select-none cursor-pointer overflow-hidden"
          >
            {badgeCount > 0 && item.badgeColor ? (
              <span
                className="absolute top-0.5 right-1.5 min-w-[16px] h-[15px] px-1 rounded-full text-white text-[9px] font-medium tracking-tight leading-none flex items-center justify-center border border-white/20 shadow-md drop-shadow z-10"
                style={{ backgroundColor: item.badgeColor }}
              >
                <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]">
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              </span>
            ) : item.tag ? (
              <span className="absolute top-0.5 right-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[8px] font-bold tracking-wider uppercase leading-none shadow-[0_2px_8px_rgba(244,63,94,0.4)] border border-white/20 z-10 select-none">
                {item.tag}
              </span>
            ) : null}

            <Icon
              className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110"
              style={{ color: item.color, filter: 'saturate(1.25) drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
              strokeWidth={2}
            />
            <span className="font-sans text-white/95 text-[11px] sm:text-[11.5px] font-medium leading-tight tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] truncate max-w-full">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default memo(HomeActionShortcuts);
