import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, Newspaper, MessageCircle, Wrench } from 'lucide-react';
import { prefetchRoute, type PrefetchKey } from '@/lib/routePrefetch';
import { haptic } from '@/lib/nativeHaptics';

const SHORTCUT_ITEMS = [
  { label: 'Vade Mecum', icon: Scale, to: '/vade-mecum', prefetch: 'vadeMecum' as PrefetchKey },
  { label: 'Notícias', icon: Newspaper, to: '/noticias', prefetch: 'noticias' as PrefetchKey },
  { label: 'Chat', icon: MessageCircle, to: '/chat-juridico', prefetch: 'chatJuridico' as PrefetchKey },
  { label: 'Ferramentas', icon: Wrench, to: '/ferramentas', prefetch: 'ferramentas' as PrefetchKey },
];

const HomeActionShortcuts = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between gap-1.5 mx-0.5 mt-0.5 bg-black/45 backdrop-blur-md border border-white/10 rounded-2xl py-1.5 px-2 shadow-lg">
      {SHORTCUT_ITEMS.map((item) => {
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
              } catch {
                /* noop */
              }
              navigate(item.to);
            }}
            className="flex-1 min-w-0 min-h-[48px] group flex flex-col items-center justify-center py-1.5 px-1 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors active:scale-95 gap-1 text-center select-none cursor-pointer"
          >
            <Icon
              className="w-5 h-5 shrink-0 text-white/90 group-hover:text-white transition-colors"
              strokeWidth={1.6}
            />
            <span className="text-white/80 text-[11px] font-medium tracking-tight truncate max-w-full group-hover:text-white transition-colors">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default memo(HomeActionShortcuts);
