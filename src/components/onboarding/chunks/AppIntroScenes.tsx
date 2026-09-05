import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Img } from 'remotion';
import { YELLOW, YELLOW_SOFT, INK, CREAM, displayFont, bodyFont, BackdropRays, Sparkles, Eyebrow } from './AppIntroShared';
import { PhoneFrame, WhatsMock, DocMock, OCRMock, AudioMock, ProgressMock, MapMock, LogoMock } from './AppIntroMocks';

/* ------------------------------------------------------------------ */
/*  Scene 1  ABERTURA                                                */
/* ------------------------------------------------------------------ */

export const SceneAbertura: React.FC<{ owlSrc: string }> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame: frame - 10, fps, config: { damping: 12, stiffness: 130 } });

  return (
    <AbsoluteFill>
      <BackdropRays />
      <Sparkles />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ transform: `scale(${scale}) translateY(-30px)`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            marginBottom: 40, padding: 30, borderRadius: 40,
            background: 'rgba(224,31,71,0.2)',
            border: '1px solid rgba(224,31,71,0.3)',
            boxShadow: '0 0 40px rgba(224,31,71,0.2)'
          }}>
            <svg width="140" height="140" viewBox="0 0 24 24" fill="none" stroke="#E01F47" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>
          </div>
          
          <div style={{
             fontFamily: displayFont,
             fontSize: 34,
             fontWeight: 700,
             letterSpacing: '0.25em',
             color: 'rgba(255,255,255,0.9)',
             textTransform: 'uppercase',
             opacity: interpolate(frame, [25, 40], [0, 1], { extrapolateRight: 'clamp' }),
             transform: `translateY(${interpolate(frame, [25, 40], [10, 0], { extrapolateRight: 'clamp' })}px)`
          }}>
             Direito Prime
          </div>

          <div style={{
             fontFamily: 'serif',
             fontStyle: 'italic',
             fontSize: 96,
             fontWeight: 700,
             color: '#FFF',
             lineHeight: 1,
             marginTop: 15,
             opacity: interpolate(frame, [40, 55], [0, 1], { extrapolateRight: 'clamp' }),
             transform: `translateY(${interpolate(frame, [40, 55], [10, 0], { extrapolateRight: 'clamp' })}px)`,
             textShadow: '0 4px 20px rgba(0,0,0,0.8)'
          }}>
             Estudos Jur�dicos
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/*  Scene 2  APRESENTA��O                                            */
/* ------------------------------------------------------------------ */

export const SceneApresentacao: React.FC<{ owlSrc: string }> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 130 },
  });
  const textX = interpolate(enter, [0, 1], [400, 0]);

  return (
    <AbsoluteFill>
      <BackdropRays />
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 60px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 40,
            width: '100%',
          }}
        >
          <div
            style={{
              transform: `translateX(${textX}px)`,
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontFamily: bodyFont,
                fontSize: 34,
                color: YELLOW,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                margin: 0,
                fontWeight: 700,
              }}
            >
              Seu Assistente Jur�dico
            </p>
            <h2
              style={{
                fontFamily: displayFont,
                fontWeight: 900,
                fontSize: 100,
                color: CREAM,
                lineHeight: 0.95,
                margin: '20px 0 0',
                letterSpacing: '-0.03em',
              }}
            >
              Deixa eu te mostrar o <br/><span style={{ color: YELLOW }}>que preparamos</span>
            </h2>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/*  Feature scenes  reusable structure                                */
/* ------------------------------------------------------------------ */

export type FeatureSceneProps = {
  step: string; // e.g. "01 / 05"
  title: string;
  titleAccent: string;
  description: string;
  bullets: string[];
  mock: React.ReactNode; // visual mock on the right/top
};

export const FeatureScene: React.FC<FeatureSceneProps> = ({
  step,
  title,
  titleAccent,
  description,
  bullets,
  mock,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleS = spring({
    frame: frame - 8,
    fps,
    config: { damping: 16, stiffness: 140 },
  });
  const descS = spring({
    frame: frame - 24,
    fps,
    config: { damping: 20, stiffness: 130 },
  });
  const mockS = spring({
    frame: frame - 12,
    fps,
    config: { damping: 14, stiffness: 110 },
  });

  return (
    <AbsoluteFill>
      <BackdropRays />
      <AbsoluteFill
        style={{
          padding: '60px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <Eyebrow text={step} delay={0} />

        <h2
          style={{
            fontFamily: displayFont,
            fontWeight: 900,
            fontSize: 96,
            color: CREAM,
            lineHeight: 0.95,
            margin: 0,
            letterSpacing: '-0.03em',
            transform: `translateY(${interpolate(titleS, [0, 1], [30, 0])}px)`,
            opacity: titleS,
          }}
        >
          {title}
          <br />
          <span style={{ color: YELLOW }}>{titleAccent}</span>
        </h2>

        <p
          style={{
            fontFamily: bodyFont,
            fontSize: 36,
            color: 'rgba(250,247,239,0.85)',
            lineHeight: 1.35,
            margin: 0,
            fontWeight: 500,
            transform: `translateY(${interpolate(descS, [0, 1], [24, 0])}px)`,
            opacity: descS,
            maxWidth: 900,
          }}
        >
          {description}
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            marginTop: 8,
          }}
        >
          {bullets.map((b, i) => {
            const s = spring({
              frame: frame - 40 - i * 14,
              fps,
              config: { damping: 18, stiffness: 150 },
            });
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  transform: `translateX(${interpolate(s, [0, 1], [-40, 0])}px)`,
                  opacity: s,
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: YELLOW,
                    boxShadow: `0 0 14px ${YELLOW}`,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: bodyFont,
                    fontSize: 30,
                    color: CREAM,
                    fontWeight: 500,
                    lineHeight: 1.25,
                  }}
                >
                  {b}
                </span>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            justifyContent: 'center',
            transform: `translateY(${interpolate(mockS, [0, 1], [60, 0])}px) scale(1.15)`,
            opacity: mockS,
          }}
        >
          {mock}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
