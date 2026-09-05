import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Img } from 'remotion';
import { YELLOW, INK, CREAM, displayFont, bodyFont, BackdropRays, Sparkles, Eyebrow } from './shared';
import { PhoneFrame, WhatsMock, DocMock, OCRMock, AudioMock, RadarMock } from './mocks';

/* ------------------------------------------------------------------ */
/*  Scene 1 â€” ABERTURA                                                */
/* ------------------------------------------------------------------ */

export const SceneAbertura: React.FC<{ owlSrc: string }> = ({ owlSrc }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const owlIn = spring({ frame, fps, config: { damping: 12, stiffness: 130 } });
  const owlScale = interpolate(owlIn, [0, 1], [0.4, 1]);
  const owlY = interpolate(owlIn, [0, 1], [80, 0]);
  const owlFloat = Math.sin(frame / 12) * 6;

  const letters = 'HORUS'.split('');

  return (
    <AbsoluteFill>
      <BackdropRays />
      <Sparkles />
      <AbsoluteFill
        style={{ alignItems: 'center', justifyContent: 'center', gap: 40 }}
      >
        <div
          style={{
            transform: `translateY(${owlY + owlFloat}px) scale(${owlScale})`,
            filter: `drop-shadow(0 30px 60px rgba(239,68,68,0.35))`,
          }}
        >
          <Img
            src={owlSrc}
            style={{ width: 460, height: 460, objectFit: 'contain' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {letters.map((L, i) => {
            const s = spring({
              frame: frame - 12 - i * 4,
              fps,
              config: { damping: 14, stiffness: 200 },
            });
            const y = interpolate(s, [0, 1], [40, 0]);
            const op = interpolate(s, [0, 1], [0, 1]);
            return (
              <span
                key={i}
                style={{
                  fontFamily: displayFont,
                  fontWeight: 900,
                  fontSize: 168,
                  lineHeight: 1,
                  color: CREAM,
                  transform: `translateY(${y}px)`,
                  opacity: op,
                  letterSpacing: '-0.04em',
                  textShadow: `0 8px 40px rgba(239,68,68,0.4)`,
                }}
              >
                {L}
              </span>
            );
          })}
        </div>

        <div
          style={{
            fontFamily: bodyFont,
            fontSize: 40,
            color: YELLOW,
            fontWeight: 600,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            opacity: interpolate(frame, [30, 55], [0, 1], {
              extrapolateRight: 'clamp',
            }),
          }}
        >
          Seu assistente jurÃ­dico
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/*  Scene 2 â€” APRESENTAÃ‡ÃƒO                                            */
/* ------------------------------------------------------------------ */

export const SceneApresentacao: React.FC<{ owlSrc: string }> = ({ owlSrc }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 130 },
  });
  const owlX = interpolate(enter, [0, 1], [400, 0]);
  const textX = interpolate(enter, [0, 1], [400, 0]);
  const owlFloat = Math.sin(frame / 10) * 8;

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
              transform: `translateX(${-owlX}px) translateY(${owlFloat}px)`,
            }}
          >
            <Img
              src={owlSrc}
              style={{
                width: 340,
                height: 340,
                objectFit: 'contain',
                filter: 'drop-shadow(0 20px 40px rgba(239,68,68,0.35))',
              }}
            />
          </div>
          <div
            style={{
              transform: `translateX(${textX}px)`,
              textAlign: 'center',
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
              Prazer, eu sou o Horus
            </p>
            <h2
              style={{
                fontFamily: displayFont,
                fontWeight: 900,
                fontSize: 96,
                color: CREAM,
                lineHeight: 0.95,
                margin: '20px 0 0',
                letterSpacing: '-0.03em',
              }}
            >
              Deixa eu te mostrar o{' '}
              <span style={{ color: YELLOW }}>que eu faÃ§o</span>
            </h2>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/*  Feature scenes â€” reusable structure                                */
/* ------------------------------------------------------------------ */

type FeatureSceneProps = {
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
          padding: '90px 70px',
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
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
            transform: `translateY(${interpolate(mockS, [0, 1], [60, 0])}px)`,
            opacity: mockS,
          }}
        >
          {mock}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};


/* ------------------------------------------------------------------ */
/*  Checklist recap (visual summary of all features)                   */
/* ------------------------------------------------------------------ */

export const CHECK_ITEMS = [
  'Explico artigos e leis em linguagem simples',
  'Resumo PDFs, provas e documentos',
  'Leio imagens do caderno ou da prova',
  'Entendo Ã¡udios e respondo em Ã¡udio',
  'Aviso sobre novas leis e boletins',
  'Tudo direto no seu WhatsApp',
];

export const CheckIcon: React.FC<{ progress: number }> = ({ progress }) => {
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

export const SceneChecklist: React.FC = () => {
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
/*  Scene â€” LIMITES (o que eu NÃƒO faÃ§o)                                */
/* ------------------------------------------------------------------ */

export const LIMITS = [
  'NÃ£o substituo um advogado',
  'NÃ£o emito parecer oficial nem faÃ§o petiÃ§Ã£o',
  'Sempre confira antes de agir em processo',
  'NÃ£o guardo nem exponho seus dados pessoais',
];

export const SceneLimites: React.FC = () => {
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
          O que eu <span style={{ color: YELLOW }}>nÃ£o faÃ§o</span>
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
          Sou seu companheiro de estudos e consulta rÃ¡pida â€” mas conhecer meus
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
/*  Scene â€” PERGUNTA NOME                                             */
/* ------------------------------------------------------------------ */

export const ScenePerguntaNome: React.FC<{ owlSrc: string }> = ({ owlSrc }) => {
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
            Uma Ãºltima coisa
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
/*  Scene â€” SAUDAÃ‡ÃƒO FINAL                                            */
/* ------------------------------------------------------------------ */

export const SceneSaudacao: React.FC<{ owlSrc: string; nome: string }> = ({
  owlSrc,
  nome,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 12, stiffness: 140 } });
  const owlScale = interpolate(s, [0, 1], [0.6, 1]);
  const wave = Math.sin(frame / 5) * 8;

  const primeiro = (nome || 'vocÃª').trim().split(/\s+/)[0];

  return (
    <AbsoluteFill>
      <BackdropRays />
      <Sparkles count={18} />
      <AbsoluteFill
        style={{ alignItems: 'center', justifyContent: 'center', gap: 40 }}
      >
        <div
          style={{
            transform: `translateY(${wave}px) scale(${owlScale}) rotate(${
              Math.sin(frame / 8) * 4
            }deg)`,
            filter: 'drop-shadow(0 30px 60px rgba(239,68,68,0.5))',
          }}
        >
          <Img
            src={owlSrc}
            style={{ width: 420, height: 420, objectFit: 'contain' }}
          />
        </div>

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
            Prazer em te conhecer
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
            OlÃ¡,{' '}
            <span
              style={{
                color: YELLOW,
                textShadow: '0 8px 40px rgba(239,68,68,0.5)',
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
            Estou pronto para te ajudar.
          </p>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};


