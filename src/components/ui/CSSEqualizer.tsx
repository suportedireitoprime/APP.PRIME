/**
 * CSSEqualizer — Barras de equalizer animadas via CSS puro (compositor GPU).
 *
 * Substitui motion.div animate={{ height }} + repeat: Infinity do Framer Motion,
 * que roda na main thread e causa layout thrashing a cada frame.
 *
 * CSS @keyframes com scaleY + transform-origin: bottom = zero reflow, 120fps.
 */
import { memo } from 'react';

interface CSSEqualizerProps {
  playing: boolean;
  bars?: number;
  barWidth?: string;
  barColor?: string;
  height?: string;
  gap?: string;
  className?: string;
}

const CSSEqualizer = memo(({
  playing,
  bars = 4,
  barWidth = '3px',
  barColor = 'bg-primary',
  height = '20px',
  gap = '2px',
  className = '',
}: CSSEqualizerProps) => (
  <div
    className={`flex items-end shrink-0 ${className}`}
    style={{ height, gap }}
    aria-hidden
  >
    {Array.from({ length: bars }, (_, i) => (
      <span
        key={i}
        className={`rounded-full ${barColor}`}
        style={{
          width: barWidth,
          height: '100%',
          transformOrigin: 'bottom',
          transform: playing ? undefined : 'scaleY(0.2)',
          animation: playing
            ? `eq-bar ${0.7 + i * 0.12}s ease-in-out ${i * 0.08}s infinite`
            : 'none',
          transition: playing ? 'none' : 'transform 0.2s ease',
        }}
      />
    ))}
  </div>
));

CSSEqualizer.displayName = 'CSSEqualizer';
export default CSSEqualizer;
