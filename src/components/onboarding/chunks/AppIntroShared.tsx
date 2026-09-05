import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Img } from 'remotion';

/* ------------------------------------------------------------------ */
/*  Shared visual language                                            */
/* ------------------------------------------------------------------ */

export const YELLOW = '#F5C518';
export const YELLOW_SOFT = '#FFDD57';
export const INK = '#0A0A0A';
export const CREAM = '#FAF7EF';

export const displayFont =
  '"Space Grotesk", "Inter", ui-sans-serif, system-ui, sans-serif';
export const bodyFont = '"Inter", ui-sans-serif, system-ui, sans-serif';

/* Animated background  subtle dark + red gradient */
export const BackdropRays: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: '#0A0A0A', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at top right, rgba(224,31,71,0.22), transparent 60%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at bottom left, rgba(0,0,0,0.5), transparent 65%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
        }}
      />
    </AbsoluteFill>
  );
};

/* Sparkle particles rising */
export const Sparkles: React.FC<{ count?: number }> = ({ count = 14 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {Array.from({ length: count }).map((_, i) => {
        const seed = (i * 97) % 100;
        const x = (seed / 100) * 100;
        const delay = (i * 11) % 60;
        const t = ((frame + delay) % 120) / 120;
        const y = interpolate(t, [0, 1], [110, -10]);
        const size = 4 + ((i * 7) % 6);
        const opacity = interpolate(t, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              borderRadius: '50%',
              background: YELLOW_SOFT,
              opacity,
              boxShadow: `0 0 ${size * 2}px ${YELLOW}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/* Section label  small yellow eyebrow used across feature scenes */
export const Eyebrow: React.FC<{ text: string; delay?: number }> = ({
  text,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    frame: frame - delay,
    fps,
    config: { damping: 20, stiffness: 160 },
  });
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 14,
        padding: '10px 22px',
        borderRadius: 999,
        background: 'rgba(239,68,68,0.14)',
        border: '2px solid rgba(239,68,68,0.4)',
        transform: `translateY(${interpolate(s, [0, 1], [20, 0])}px)`,
        opacity: s,
      }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: YELLOW,
          boxShadow: `0 0 12px ${YELLOW}`,
        }}
      />
      <span
        style={{
          fontFamily: bodyFont,
          fontSize: 26,
          color: YELLOW,
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
        }}
      >
        {text}
      </span>
    </div>
  );
};
