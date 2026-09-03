import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Img,
} from 'remotion';
import {
  TransitionSeries,
  linearTiming,
  springTiming,
} from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { wipe } from '@remotion/transitions/wipe';

/* ------------------------------------------------------------------ */
/*  Shared visual language                                            */
/* ------------------------------------------------------------------ */

const YELLOW = '#F5C518';
const YELLOW_SOFT = '#FFDD57';
const INK = '#0A0A0A';
const CREAM = '#FAF7EF';

const displayFont =
  '"Space Grotesk", "Inter", ui-sans-serif, system-ui, sans-serif';
const bodyFont = '"Inter", ui-sans-serif, system-ui, sans-serif';

/* Animated background  subtle dark + red gradient */
const BackdropRays: React.FC = () => {
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
const Sparkles: React.FC<{ count?: number }> = ({ count = 14 }) => {
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
const Eyebrow: React.FC<{ text: string; delay?: number }> = ({
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

/* ------------------------------------------------------------------ */
/*  Scene 1  ABERTURA                                                */
/* ------------------------------------------------------------------ */

const SceneAbertura: React.FC<{ owlSrc: string }> = () => {
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

const SceneApresentacao: React.FC<{ owlSrc: string }> = () => {
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

type FeatureSceneProps = {
  step: string; // e.g. "01 / 05"
  title: string;
  titleAccent: string;
  description: string;
  bullets: string[];
  mock: React.ReactNode; // visual mock on the right/top
};

const FeatureScene: React.FC<FeatureSceneProps> = ({
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

/* ---------- Mocks (visual props for feature scenes) ---------- */

const PhoneFrame: React.FC<{ children: React.ReactNode; height?: number }> = ({
  children,
  height = 560,
}) => (
  <div
    style={{
      width: 380,
      height,
      borderRadius: 44,
      background: '#111',
      border: '6px solid #222',
      boxShadow:
        '0 40px 80px rgba(0,0,0,0.6), 0 0 0 2px rgba(239,68,68,0.25)',
      overflow: 'hidden',
      position: 'relative',
    }}
  >
    <div
      style={{
        position: 'absolute',
        top: 10,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 110,
        height: 22,
        borderRadius: 999,
        background: '#000',
        zIndex: 2,
      }}
    />
    {children}
  </div>
);

const WhatsMock: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bubbles = [
    { me: true, text: 'Oi Horus! O que � usucapi�o?', at: 20 },
    {
      me: false,
      text: 'Usucapi�o � quando algu�m vira dono de um im�vel pelo uso prolongado. Quer que eu explique com um exemplo?',
      at: 40,
    },
    { me: true, text: 'Sim, por favor =O', at: 65 },
  ];
  return (
    <PhoneFrame height={520}>
      <div
        style={{
          background: '#0b141a',
          height: '100%',
          padding: '48px 14px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 6px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            marginBottom: 6,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: YELLOW,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              color: INK,
              fontSize: 16,
              fontFamily: bodyFont,
            }}
          >
            H
          </div>
          <div>
            <div
              style={{
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                fontFamily: bodyFont,
              }}
            >
              Horus
            </div>
            <div
              style={{
                color: '#25D366',
                fontSize: 11,
                fontFamily: bodyFont,
              }}
            >
              online
            </div>
          </div>
        </div>
        {bubbles.map((b, i) => {
          const s = spring({
            frame: frame - b.at,
            fps,
            config: { damping: 20, stiffness: 200 },
          });
          return (
            <div
              key={i}
              style={{
                alignSelf: b.me ? 'flex-end' : 'flex-start',
                maxWidth: '82%',
                background: b.me ? '#005c4b' : '#202c33',
                color: '#fff',
                padding: '9px 12px',
                borderRadius: 10,
                fontSize: 14,
                fontFamily: bodyFont,
                lineHeight: 1.35,
                transform: `translateY(${interpolate(s, [0, 1], [12, 0])}px)`,
                opacity: s,
              }}
            >
              {b.text}
            </div>
          );
        })}
      </div>
    </PhoneFrame>
  );
};

const DocMock: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scan = interpolate(frame % 90, [0, 90], [0, 100]);
  return (
    <div
      style={{
        display: 'flex',
        gap: 20,
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: 220,
          height: 300,
          background: CREAM,
          borderRadius: 8,
          boxShadow:
            '0 30px 60px rgba(0,0,0,0.5), 0 0 0 2px rgba(239,68,68,0.25)',
          padding: 20,
          position: 'relative',
          overflow: 'hidden',
          transform: 'rotate(-5deg)',
        }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 6,
              background: '#333',
              opacity: 0.6,
              borderRadius: 2,
              marginBottom: 10,
              width: `${60 + ((i * 13) % 40)}%`,
            }}
          />
        ))}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${scan}%`,
            height: 4,
            background: YELLOW,
            boxShadow: `0 0 20px ${YELLOW}, 0 -80px 60px rgba(239,68,68,0.35)`,
          }}
        />
      </div>
      <div
        style={{
          fontSize: 60,
          color: YELLOW,
          fontFamily: displayFont,
          fontWeight: 900,
        }}
      >
        �
      </div>
      <div
        style={{
          width: 230,
          padding: 16,
          borderRadius: 16,
          background: 'rgba(239,68,68,0.14)',
          border: '2px solid rgba(239,68,68,0.4)',
          color: CREAM,
          fontFamily: bodyFont,
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: YELLOW,
            fontWeight: 700,
            letterSpacing: '0.2em',
            marginBottom: 8,
            textTransform: 'uppercase',
          }}
        >
          Resumo
        </div>
        {['Objeto do contrato', 'Prazo: 24 meses', 'Multa rescis�ria: 20%', 'Foro: Comarca da Capital'].map(
          (t, i) => {
            const s = spring({
              frame: frame - 25 - i * 10,
              fps,
              config: { damping: 20, stiffness: 180 },
            });
            return (
              <div
                key={i}
                style={{
                  fontSize: 14,
                  marginBottom: 6,
                  opacity: s,
                  transform: `translateX(${interpolate(s, [0, 1], [10, 0])}px)`,
                }}
              >
                " {t}
              </div>
            );
          },
        )}
      </div>
    </div>
  );
};

const OCRMock: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scan = interpolate(frame % 60, [0, 60], [0, 100]);
  return (
    <div
      style={{
        width: 600,
        height: 400,
        borderRadius: 24,
        background: '#1a1a1a',
        border: '3px solid rgba(224,31,71,0.4)',
        position: 'relative',
        overflow: 'hidden',
        padding: 30,
        fontFamily: bodyFont,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}
    >
      <div
        style={{
          fontSize: 16,
          color: YELLOW,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          fontWeight: 700,
          marginBottom: 16,
        }}
      >
        Foto do caderno
      </div>
      <div
        style={{
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 12,
          padding: 12,
          color: '#ddd',
          fontSize: 15,
          lineHeight: 1.5,
          fontStyle: 'italic',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        "Art. 5� Todos s�o iguais perante a lei&"
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${scan}%`,
            height: 2,
            background: YELLOW,
            boxShadow: `0 0 14px ${YELLOW}`,
          }}
        />
      </div>
      <div
        style={{
          background: 'rgba(255,255,255,0.05)',
          padding: 24,
          borderRadius: 12,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: '90%',
            height: 12,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 6,
            marginBottom: 14,
          }}
        />
        <div
          style={{
            width: '60%',
            height: 12,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 6,
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div
          style={{
            background: YELLOW,
            color: '#000',
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          Reconhecido 
        </div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>
          CF/88 - Art. 5� - Direitos Fundamentais
        </div>
      </div>
    </div>
  );
};

const AudioMock: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        width: 380,
        padding: 20,
        borderRadius: 24,
        background: '#1a1a1a',
        border: '2px solid rgba(239,68,68,0.4)',
        fontFamily: bodyFont,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: YELLOW,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          fontWeight: 700,
        }}
      >
        Voc� enviou um �udio
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          height: 60,
        }}
      >
        {Array.from({ length: 40 }).map((_, i) => {
          const h = 20 + Math.abs(Math.sin(i * 0.5 + frame / 4)) * 40;
          const active = i < ((frame / 2) % 40);
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: h,
                background: active ? YELLOW : 'rgba(255,255,255,0.15)',
                borderRadius: 2,
              }}
            />
          );
        })}
      </div>
      <div
        style={{
          color: CREAM,
          fontSize: 16,
          lineHeight: 1.35,
        }}
      >
        "Explica pra mim o que é <b style={{ color: YELLOW }}>habeas corpus</b> em um minuto"
      </div>
      <div
        style={{
          fontSize: 12,
          color: '#888',
        }}
      >
        Respondo em áudio também 🎧
      </div>
    </div>
  );
};

const RadarMock: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pulse = ((frame % 60) / 60) * 100;
  const items = [
    { t: 'Nova Lei sancionada', d: 'PL 2.338/23 � IA no setor p�blico' },
    { t: 'STF publica s�mula', d: 'S�mula Vinculante 59' },
    { t: 'Portaria MJ', d: 'Regulamenta atendimento em delegacias' },
  ];
  return (
    <div
      style={{
        width: 400,
        padding: 20,
        borderRadius: 24,
        background: '#1a1a1a',
        border: '2px solid rgba(239,68,68,0.4)',
        fontFamily: bodyFont,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: YELLOW,
          boxShadow: `0 0 0 ${pulse * 0.3}px rgba(239,68,68,${
            0.3 - pulse * 0.003
          })`,
        }}
      />
      <div
        style={{
          fontSize: 13,
          color: YELLOW,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          fontWeight: 700,
          marginBottom: 14,
        }}
      >
        Radar de leis
      </div>
      {items.map((it, i) => {
        const s = spring({
          frame: frame - 20 - i * 12,
          fps,
          config: { damping: 20, stiffness: 180 },
        });
        return (
          <div
            key={i}
            style={{
              padding: '10px 0',
              borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.08)',
              transform: `translateY(${interpolate(s, [0, 1], [16, 0])}px)`,
              opacity: s,
            }}
          >
            <div
              style={{
                color: CREAM,
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              {it.t}
            </div>
            <div style={{ color: '#999', fontSize: 13, marginTop: 2 }}>
              {it.d}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Checklist recap (visual summary of all features)                   */
/* ------------------------------------------------------------------ */

const CHECK_ITEMS = [
  'Explico artigos e leis em linguagem simples',
  'Resumo PDFs, provas e documentos',
  'Leio imagens do caderno ou da prova',
  'Entendo �udios e respondo em �udio',
  'Aviso sobre novas leis e boletins',
  'Tudo direto no seu WhatsApp',
];

const CheckIcon: React.FC<{ progress: number }> = ({ progress }) => {
  const dash = 60;
  const drawn = dash * (1 - progress);
  return (
    <svg width={64} height={64} viewBox="0 0 72 72">
      <circle
        cx={36}
        cy={36}
        r={30}
        stroke={YELLOW}
        strokeWidth={4}
        fill="rgba(239,68,68,0.15)"
      />
      <path
        d="M22 38 L32 48 L52 26"
        stroke={YELLOW}
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray={dash}
        strokeDashoffset={drawn}
      />
    </svg>
  );
};

const SceneChecklist: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      <BackdropRays />
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          padding: '90px 70px',
        }}
      >
        <div style={{ alignSelf: 'flex-start', marginBottom: 30 }}>
          <Eyebrow text="Resumindo" />
        </div>
        <h3
          style={{
            fontFamily: displayFont,
            fontWeight: 900,
            fontSize: 68,
            color: CREAM,
            letterSpacing: '-0.02em',
            margin: '0 0 36px',
            alignSelf: 'flex-start',
            lineHeight: 1,
          }}
        >
          Tudo que <span style={{ color: YELLOW }}>eu sei fazer</span>
        </h3>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            width: '100%',
          }}
        >
          {CHECK_ITEMS.map((item, i) => {
            const start = 8 + i * 14;
            const s = spring({
              frame: frame - start,
              fps,
              config: { damping: 14, stiffness: 160 },
            });
            const drawS = spring({
              frame: frame - start - 8,
              fps,
              config: { damping: 20, stiffness: 100 },
            });
            const x = interpolate(s, [0, 1], [-120, 0]);
            const op = interpolate(s, [0, 1], [0, 1]);
            return (
              <div
                key={i}
                style={{
                  transform: `translateX(${x}px)`,
                  opacity: op,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 22,
                  padding: '18px 26px',
                  borderRadius: 24,
                  background:
                    'linear-gradient(90deg, rgba(239,68,68,0.14) 0%, rgba(239,68,68,0.02) 100%)',
                  border: '2px solid rgba(239,68,68,0.35)',
                }}
              >
                <CheckIcon progress={drawS} />
                <span
                  style={{
                    fontFamily: bodyFont,
                    fontSize: 32,
                    fontWeight: 600,
                    color: CREAM,
                    lineHeight: 1.15,
                  }}
                >
                  {item}
                </span>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/*  Scene  LIMITES (o que eu N�O fa�o)                                */
/* ------------------------------------------------------------------ */

const LIMITS = [
  'N�o substituo um advogado',
  'N�o emito parecer oficial nem fa�o peti��o',
  'Sempre confira antes de agir em processo',
  'N�o guardo nem exponho seus dados pessoais',
];

const SceneLimites: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      <BackdropRays />
      <AbsoluteFill
        style={{
          padding: '90px 70px',
          display: 'flex',
          flexDirection: 'column',
          gap: 30,
        }}
      >
        <Eyebrow text="Importante saber" />

        <h2
          style={{
            fontFamily: displayFont,
            fontWeight: 900,
            fontSize: 84,
            color: CREAM,
            lineHeight: 0.95,
            margin: 0,
            letterSpacing: '-0.03em',
          }}
        >
          O que eu <span style={{ color: YELLOW }}>n�o fa�o</span>
        </h2>

        <p
          style={{
            fontFamily: bodyFont,
            fontSize: 32,
            color: 'rgba(250,247,239,0.75)',
            lineHeight: 1.35,
            margin: 0,
            fontWeight: 500,
            maxWidth: 900,
          }}
        >
          Sou seu companheiro de estudos e consulta r�pida  mas conhecer meus
          limites te protege.
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            marginTop: 10,
          }}
        >
          {LIMITS.map((t, i) => {
            const s = spring({
              frame: frame - 20 - i * 14,
              fps,
              config: { damping: 18, stiffness: 150 },
            });
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                  padding: '18px 24px',
                  borderRadius: 20,
                  background: 'rgba(255,255,255,0.04)',
                  border: '2px dashed rgba(239,68,68,0.4)',
                  transform: `translateY(${interpolate(s, [0, 1], [24, 0])}px)`,
                  opacity: s,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'rgba(239,68,68,0.14)',
                    border: `2px solid ${YELLOW}`,
                    color: YELLOW,
                    fontFamily: displayFont,
                    fontWeight: 900,
                    fontSize: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  !
                </div>
                <span
                  style={{
                    fontFamily: bodyFont,
                    fontSize: 30,
                    fontWeight: 600,
                    color: CREAM,
                    lineHeight: 1.2,
                  }}
                >
                  {t}
                </span>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/*  Scene  PERGUNTA NOME                                             */
/* ------------------------------------------------------------------ */

const ScenePerguntaNome: React.FC<{ owlSrc: string }> = ({ owlSrc }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 14, stiffness: 130 } });
  const owlY = interpolate(s, [0, 1], [40, 0]) + Math.sin(frame / 9) * 6;
  const textY = interpolate(s, [0, 1], [60, 0]);

  return (
    <AbsoluteFill>
      <BackdropRays />
      <Sparkles count={8} />
      <AbsoluteFill
        style={{ alignItems: 'center', justifyContent: 'center', gap: 40 }}
      >
        <div
          style={{
            transform: `translateY(${owlY}px)`,
            filter: 'drop-shadow(0 20px 40px rgba(239,68,68,0.35))',
          }}
        >
          <Img
            src={owlSrc}
            style={{ width: 340, height: 340, objectFit: 'contain' }}
          />
        </div>
        <div
          style={{
            transform: `translateY(${textY}px)`,
            textAlign: 'center',
            padding: '0 80px',
            opacity: s,
          }}
        >
          <p
            style={{
              fontFamily: bodyFont,
              fontSize: 30,
              color: YELLOW,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              margin: 0,
              fontWeight: 700,
            }}
          >
            Uma �ltima coisa
          </p>
          <h2
            style={{
              fontFamily: displayFont,
              fontWeight: 900,
              fontSize: 100,
              color: CREAM,
              lineHeight: 1,
              margin: '24px 0 0',
              letterSpacing: '-0.03em',
            }}
          >
            Como posso te <span style={{ color: YELLOW }}>chamar?</span>
          </h2>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/*  Scene  SAUDA��O FINAL                                            */
/* ------------------------------------------------------------------ */

const SceneSaudacao: React.FC<{ owlSrc: string; nome: string }> = ({
  nome,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    frame: frame - 10,
    fps,
    config: { damping: 14, stiffness: 120 },
  });
  const primeiro = (nome || 'voc�').split(' ')[0];

  return (
    <AbsoluteFill>
      <BackdropRays />
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{ textAlign: 'center', opacity: s, padding: '0 60px' }}
        >
          <p
            style={{
              fontFamily: bodyFont,
              fontSize: 36,
              color: YELLOW,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              margin: 0,
              fontWeight: 700,
            }}
          >
            Tudo pronto
          </p>
          <h1
            style={{
              fontFamily: displayFont,
              fontWeight: 900,
              fontSize: 140,
              color: CREAM,
              lineHeight: 0.95,
              margin: '20px 0 0',
              letterSpacing: '-0.04em',
            }}
          >
            Ol�,{' '}
            <span
              style={{
                color: YELLOW,
                textShadow: '0 8px 40px rgba(224,31,71,0.5)',
              }}
            >
              {primeiro}!
            </span>
          </h1>
          <p
            style={{
              fontFamily: bodyFont,
              fontSize: 34,
              color: 'rgba(250,247,239,0.75)',
              margin: '30px 0 0',
              fontWeight: 500,
            }}
          >
            Sua jornada come�a agora.
          </p>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/*  Composi��o principal                                              */
/* ------------------------------------------------------------------ */

export type AppIntroProps = {
  owlSrc: string;
  nome: string;
};

/**
 * Sequ�ncias (30fps):
 *   1. Abertura              90     (090)
 *   2. Apresenta��o          70
 *   3. Feature 1  Biblioteca 150
 *   4. Feature 2  Flashcards 150
 *   5. Feature 3  Radar     150
 *   6. Feature 4  H�rus     150
 *   7. Sauda��o final        120
 */
export const APP_INTRO_FPS = 30;
export const APP_INTRO_WIDTH = 1080;
export const APP_INTRO_HEIGHT = 1920;

const SEQ = {
  abertura: 90,
  apresentacao: 70,
  featBiblioteca: 150,
  featFlashcards: 150,
  featRadar: 150,
  featHorus: 150,
  saudacao: 120,
};

const TRANS = {
  t1: 15,
  t2: 20,
  t3: 15,
  t4: 15,
  t5: 15,
  t6: 20,
};

const TOTAL_SEQ = Object.values(SEQ).reduce((a, b) => a + b, 0);
const TOTAL_TRANS = Object.values(TRANS).reduce((a, b) => a + b, 0);
export const APP_INTRO_DURATION = TOTAL_SEQ - TOTAL_TRANS;

export const AppIntroVideo: React.FC<AppIntroProps> = ({
  owlSrc,
  nome,
}) => {
  return (
    <AbsoluteFill style={{ background: INK }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SEQ.abertura}>
          <SceneAbertura owlSrc={owlSrc} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANS.t1 })}
        />

        <TransitionSeries.Sequence durationInFrames={SEQ.apresentacao}>
          <SceneApresentacao owlSrc={owlSrc} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: 'from-bottom' })}
          timing={springTiming({
            config: { damping: 200 },
            durationInFrames: TRANS.t2,
          })}
        />

        <TransitionSeries.Sequence durationInFrames={SEQ.featBiblioteca}>
          <FeatureScene
            step="01 / 04"
            title="Biblioteca"
            titleAccent="Inteligente"
            description="Todos os Vade Mecums, leis e c�digos atualizados diariamente. Leia de forma fluida e encontre o que precisa em segundos."
            bullets={[
              'Atualiza��o di�ria garantida',
              'Busca sem�ntica avan�ada',
              'Leitura adaptativa para telas de qualquer tamanho',
            ]}
            mock={<DocMock />}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANS.t3 })}
        />

        <TransitionSeries.Sequence durationInFrames={SEQ.featFlashcards}>
          <FeatureScene
            step="02 / 04"
            title="Flashcards e"
            titleAccent="Quest�es"
            description="Memorize a lei seca com repeti��o espa�ada. Crie cards com um clique a partir de qualquer artigo."
            bullets={[
              'Algoritmo de repeti��o espa�ada',
              'Mais de 50.000 quest�es comentadas',
              'Cria��o de cards com 1 clique',
            ]}
            mock={<OCRMock />}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANS.t4 })}
        />

        <TransitionSeries.Sequence durationInFrames={SEQ.featRadar}>
          <FeatureScene
            step="03 / 04"
            title="Radar"
            titleAccent="de Leis"
            description="Nunca mais estude material desatualizado. O Radar te avisa sempre que uma lei ou s�mula importante mudar."
            bullets={[
              'Avisos em tempo real',
              'Resumos das altera��es',
              'Monitoramento do STF e STJ',
            ]}
            mock={<RadarMock />}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANS.t5 })}
        />

        <TransitionSeries.Sequence durationInFrames={SEQ.featHorus}>
          <FeatureScene
            step="04 / 04"
            title="H�rus"
            titleAccent="Assistente AI"
            description="D�vidas complexas? O H�rus responde, explica e exemplifica, direto no app ou no seu WhatsApp."
            bullets={[
              'Dispon�vel 24 horas por dia',
              'Entende �udios e imagens',
              'Integrado ao seu WhatsApp',
            ]}
            mock={<WhatsMock />}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANS.t6 })}
        />

        <TransitionSeries.Sequence durationInFrames={SEQ.saudacao}>
          <SceneSaudacao owlSrc={owlSrc} nome={nome} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
