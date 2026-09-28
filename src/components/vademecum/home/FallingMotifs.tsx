import { useEffect, useState, memo } from 'react';
import { Scale, Gavel, BookOpen } from 'lucide-react';
import laurel from '@/assets/landing-tribunal/laurel-leaf.webp';

/**
 * FallingMotifs — 120fps otimizado:
 *
 * Antes: 24 motion.div com repeat: Infinity = 24 rAF loops simultâneos na main thread.
 * Agora: CSS @keyframes com transform (translateY, rotate) = compositor GPU puro, zero JS.
 *
 * - FallingLeaves: CSS `falling-leaf` keyframe (translateY + rotate + opacity)
 * - FloatingSVGs: CSS `floating-svg` keyframe (translate + rotate)
 * - prefers-reduced-motion: animações desativadas automaticamente
 */

const SVGS = [Scale, Gavel, BookOpen];

interface LeafData {
  id: string;
  left: number;
  duration: number;
  delay: number;
  size: number;
  rotationFinal: number;
}

interface SvgData {
  id: string;
  Icon: typeof Scale;
  left: number;
  top: number;
  duration: number;
  delay: number;
  size: number;
  rotationInitial: number;
}

export const FallingLeaves = memo(() => {
  const [leaves, setLeaves] = useState<LeafData[]>([]);

  useEffect(() => {
    const newLeaves = Array.from({ length: 12 }).map((_, i) => ({
      id: `leaf-${i}`,
      left: Math.random() * 100,
      duration: 10 + Math.random() * 15,
      delay: Math.random() * 10,
      size: 16 + Math.random() * 24,
      rotationFinal: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 360),
    }));
    setLeaves(newLeaves);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[2]">
      {leaves.map((m) => (
        <img
          key={m.id}
          src={laurel}
          alt=""
          aria-hidden="true"
          className="absolute css-falling-leaf"
          style={{
            left: `${m.left}%`,
            width: m.size,
            height: m.size,
            // CSS custom properties drive the keyframe
            ['--leaf-rotate' as string]: `${m.rotationFinal}deg`,
            animation: `falling-leaf ${m.duration}s linear ${m.delay}s infinite`,
            willChange: 'transform, opacity',
          }}
        />
      ))}
    </div>
  );
});

FallingLeaves.displayName = 'FallingLeaves';

export const FloatingSVGs = memo(() => {
  const [svgs, setSvgs] = useState<SvgData[]>([]);

  useEffect(() => {
    const newSvgs = Array.from({ length: 12 }).map((_, i) => ({
      id: `svg-${i}`,
      Icon: SVGS[i % SVGS.length],
      left: Math.random() * 90,
      top: Math.random() * 90,
      duration: 10 + Math.random() * 15,
      delay: Math.random() * 5,
      size: 40 + Math.random() * 40,
      rotationInitial: Math.random() * 60 - 30,
    }));
    setSvgs(newSvgs);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1]">
      {svgs.map((m) => {
        const { Icon } = m;
        return (
          <div
            key={m.id}
            className="absolute text-black css-floating-svg"
            style={{
              left: `${m.left}%`,
              top: `${m.top}%`,
              width: m.size,
              height: m.size,
              opacity: 0.4,
              ['--float-rotate-start' as string]: `${m.rotationInitial}deg`,
              ['--float-rotate-mid' as string]: `${m.rotationInitial + 20}deg`,
              ['--float-rotate-end' as string]: `${m.rotationInitial - 20}deg`,
              animation: `floating-svg ${m.duration}s ease-in-out ${m.delay}s infinite`,
              willChange: 'transform',
            }}
          >
            <Icon className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" strokeWidth={1.5} />
          </div>
        );
      })}
    </div>
  );
});

FloatingSVGs.displayName = 'FloatingSVGs';
