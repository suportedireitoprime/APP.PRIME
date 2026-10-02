import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, MessageCircleQuestion, Bot, Monitor } from 'lucide-react';
import { useShortcutBadges } from '@/hooks/useShortcutBadges';
import { prefetchRoute, type PrefetchKey } from '@/lib/routePrefetch';
import { haptic } from '@/lib/nativeHaptics';

const SHORTCUT_ITEMS = [
  { label: 'Aprender',    icon: GraduationCap,         to: '/aprender',         color: '#FACC15', badgeColor: null, badgeKey: null, prefetch: 'aprender' as PrefetchKey },
  { label: 'Me Explique', icon: MessageCircleQuestion, to: '/me-explique',      color: '#F97316', badgeColor: null, badgeKey: null, prefetch: 'meExplique' as PrefetchKey },
  { label: 'Assistente',  icon: Bot,                   to: '/assistente-horus', color: '#A855F7', badgeColor: null, badgeKey: null, prefetch: 'horus' as PrefetchKey },
  { label: 'Desktop',     icon: Monitor,               to: '/desktop',          color: '#38BDF8', badgeColor: null, badgeKey: null, prefetch: 'desktop' as PrefetchKey },
];

const HomeActionShortcuts = () => {
  const navigate = useNavigate();
  const shortcutBadges = useShortcutBadges();

  return (
    <div className="flex items-center justify-between gap-2 mx-1 mt-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl p-2 shadow-2xl">
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
            className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-[14px] hover:bg-white/5 active:bg-white/10 transition-all duration-200 active:scale-95 gap-1.5 text-center select-none cursor-pointer overflow-hidden"
          >
            {badgeCount > 0 && item.badgeColor && (
              <span
                className="absolute top-1 right-2 min-w-[16px] h-[16px] px-1 rounded-full text-white text-[9px] font-bold leading-none flex items-center justify-center border border-white/20 shadow z-10"
                style={{ backgroundColor: item.badgeColor }}
              >
                {badgeCount > 99 ? '99+' : badgeCount}
              </span>
            )}

            <Icon
              className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110"
              style={{ color: item.color, filter: 'saturate(1.25) drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
              strokeWidth={2}
            />
            <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight capitalize tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default memo(HomeActionShortcuts);
