import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Img } from 'remotion';
import { YELLOW, YELLOW_SOFT, INK, CREAM, displayFont, bodyFont } from './AppIntroShared';

import primeLogoAsset from '@/assets/logo-direitoprime-v2.png.asset.json';
import primeLogoBundled from '@/assets/bundled/logo-direitoprime-v2.webp';
import { pickAsset, srcOf } from '@/lib/assetUrl';
const primeLogo = pickAsset(primeLogoBundled, srcOf(primeLogoAsset));

/* ---------- Mocks (visual props for feature scenes) ---------- */

export const PhoneFrame: React.FC<{ children: React.ReactNode; height?: number }> = ({
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

export const WhatsMock: React.FC = () => {
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

export const DocMock: React.FC = () => {
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

export const OCRMock: React.FC = () => {
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

export const AudioMock: React.FC = () => {
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
