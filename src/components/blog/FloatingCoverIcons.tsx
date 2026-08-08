import { memo, useMemo } from 'react';
import { Scale, Gavel, BookOpen, Feather, Landmark, ScrollText, Stamp, Hourglass } from 'lucide-react';

const ICONS = [Scale, Gavel, BookOpen, Feather, Landmark, ScrollText, Stamp, Hourglass];

/** Ícones jurídicos em SVG que passeiam suavemente sobre a capa do artigo. */
function FloatingCoverIcons({ seed = 0, count = 7 }: { seed?: number; count?: number }) {
  const itens = useMemo(() => {
    const rnd = (n: number) => {
      const x = Math.sin(seed * 97 + n * 31.7) * 10000;
      return x - Math.floor(x);
    };
    return Array.from({ length: count }, (_, i) => ({
      Icon: ICONS[Math.floor(rnd(i) * ICONS.length)],
      left: 4 + rnd(i + 100) * 88,
      top: 6 + rnd(i + 200) * 78,
      size: 16 + Math.round(rnd(i + 300) * 22),
      dur: 9 + rnd(i + 400) * 10,
      delay: -rnd(i + 500) * 12,
      drift: (rnd(i + 600) > 0.5 ? 1 : -1) * (8 + rnd(i + 700) * 14),
      opacity: 0.16 + rnd(i + 800) * 0.18,
    }));
  }, [seed, count]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {itens.map((it, i) => {
        const { Icon } = it;
        return (
          <span
            key={i}
            className="absolute animate-cover-drift will-change-transform"
            style={{
              left: `${it.left}%`,
              top: `${it.top}%`,
              opacity: it.opacity,
              animationDuration: `${it.dur}s`,
              animationDelay: `${it.delay}s`,
              ['--drift-x' as string]: `${it.drift}px`,
            } as React.CSSProperties}
          >
            <Icon width={it.size} height={it.size} className="text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]" strokeWidth={1.5} />
          </span>
        );
      })}
    </div>
  );
}

export default memo(FloatingCoverIcons);
