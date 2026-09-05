import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ListChecks, Camera } from 'lucide-react';
import { FlashcardsIcon } from '@/components/icons/FlashcardsIcon';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useShortcutBadges } from '@/hooks/useShortcutBadges';
import { prefetchRoute, type PrefetchKey } from '@/lib/routePrefetch';

const SHORTCUT_ITEMS = [
  { label: 'Aprender',    icon: GraduationCap,    to: '/aprender',     color: '#FACC15', badgeColor: null, badgeKey: null, prefetch: 'aprender' as any },
  { label: 'Flashcards',  icon: FlashcardsIcon,   to: '/flashcards',   color: '#34D399', badgeColor: null, badgeKey: null, prefetch: 'flashcards' as PrefetchKey },
  { label: 'Questões',    icon: ListChecks,       to: '/questoes',     color: '#F87171', badgeColor: null, badgeKey: null, prefetch: 'questoes' as PrefetchKey },
  { label: 'Me Explique', icon: Camera,           to: '/me-explique',  color: '#F97316', badgeColor: null, badgeKey: null, prefetch: 'meExplique' as PrefetchKey },
];

const HomeActionShortcuts = () => {
  const navigate = useNavigate();
  const shortcutBadges = useShortcutBadges();

  return (
    <div className="grid grid-cols-4 gap-2 mt-1">
      {SHORTCUT_ITEMS.map((item, index) => {
        const Icon = item.icon;
        const badgeCount = item.badgeKey ? shortcutBadges.counts[item.badgeKey] : 0;
        return (
          <button
            key={item.label}
            onPointerDown={() => prefetchRoute(item.prefetch)}
            onMouseEnter={() => prefetchRoute(item.prefetch)}
            onFocus={() => prefetchRoute(item.prefetch)}
            onClick={() => {
              if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
              if (item.badgeKey) shortcutBadges.markSeen(item.badgeKey);
              navigate(item.to);
            }}
            style={{ '--shimmer-delay': `${index * 150}ms` } as React.CSSProperties}
            className="group relative flex flex-col items-center justify-center gap-1 h-[72px] rounded-2xl bg-black/45 backdrop-blur-md border border-white/15 shadow-lg shadow-black/30 active:scale-[0.96] transition shortcut-button-shine"
          >
            {badgeCount > 0 && item.badgeColor && (
              <span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-bold leading-none flex items-center justify-center border border-white/20 shadow z-10"
                style={{ backgroundColor: item.badgeColor }}
              >
                {badgeCount > 99 ? '99+' : badgeCount}
              </span>
            )}

            <Icon
              className="w-6 h-6"
              style={{ color: item.color, filter: 'saturate(1.3) drop-shadow(0 2px 6px rgba(0,0,0,0.6))' }}
              strokeWidth={1.6}
            />
            <span className="font-display text-white text-[12px] font-bold tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default memo(HomeActionShortcuts);
