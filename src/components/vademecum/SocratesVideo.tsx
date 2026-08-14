import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Img,
  Sequence,
} from 'remotion';

export const SOCRATES_FPS = 30;
export const SOCRATES_DURATION_FRAMES = 1800; // 60 seconds (1 minute)
export const SOCRATES_WIDTH = 1080;
export const SOCRATES_HEIGHT = 1920;

export const SocratesVideo: React.FC = () => {
  const frame = useCurrentFrame();

  // Background Image Opacity and Zoom (Slow continuous pan)
  const imgOpacity = interpolate(frame, [0, 40], [0, 0.4], { extrapolateRight: 'clamp' });
  const imgScale = interpolate(frame, [0, SOCRATES_DURATION_FRAMES], [1.0, 1.25]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#050505', fontFamily: '"Inter", sans-serif' }}>
      
      {/* Background Image Layer */}
      <AbsoluteFill>
        <Img 
          src="/biografias/socrates-capa.jpg" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover', 
            opacity: imgOpacity,
            transform: `scale(${imgScale})`,
            transformOrigin: 'top center'
          }} 
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 100%)'
        }} />
      </AbsoluteFill>

      {/* Act 1: Introduction (0s to 15s -> Frames 0 to 450) */}
      <Sequence from={0} durationInFrames={450}>
        <AbsoluteFill style={{ alignItems: 'center', paddingTop: '25%' }}>
          <h1 style={{ 
            fontSize: '110px', 
            fontWeight: 800,
            color: '#FFFFFF',
            margin: 0,
            letterSpacing: '-0.02em',
            opacity: interpolate(frame, [15, 45, 400, 450], [0, 1, 1, 0], { extrapolateRight: 'clamp' }), 
            transform: `translateY(${interpolate(frame, [15, 45], [50, 0], { extrapolateRight: 'clamp' })}px)`,
          }}>
            SÓCRATES
          </h1>
          <p style={{
            fontSize: '40px',
            fontWeight: 500,
            color: '#D7BD87',
            margin: '20px 0 0 0',
            opacity: interpolate(frame, [60, 90, 400, 450], [0, 1, 1, 0], { extrapolateRight: 'clamp' }),
            transform: `translateY(${interpolate(frame, [60, 90], [30, 0], { extrapolateRight: 'clamp' })}px)`,
          }}>
            O Soldado da Verdade
          </p>
        </AbsoluteFill>
      </Sequence>

      {/* Act 2: The Method (15s to 30s -> Frames 450 to 900) */}
      <Sequence from={450} durationInFrames={450}>
        <AbsoluteFill style={{ justifyContent: 'center', padding: '0 10%' }}>
          <h2 style={{
            fontSize: '60px',
            fontWeight: 700,
            color: '#F1E4BE',
            marginBottom: '30px',
            opacity: interpolate(frame, [460, 490, 850, 900], [0, 1, 1, 0], { extrapolateRight: 'clamp' }),
          }}>
            A Guerra contra a Arrogância
          </h2>
          <p style={{
            fontSize: '36px',
            color: '#FFFFFF',
            lineHeight: 1.5,
            opacity: interpolate(frame, [500, 530, 850, 900], [0, 1, 1, 0], { extrapolateRight: 'clamp' }),
          }}>
            Sem cobrar pelas aulas, ele usava a Ironia para demolir o ego dos Sofistas atenienses. Sua missão era despertar as pessoas do sono da ignorância presunçosa.
          </p>
        </AbsoluteFill>
      </Sequence>

      {/* Act 3: The Trial and Death (30s to 45s -> Frames 900 to 1350) */}
      <Sequence from={900} durationInFrames={450}>
        <AbsoluteFill style={{ justifyContent: 'center', padding: '0 10%' }}>
          <h2 style={{
            fontSize: '60px',
            fontWeight: 700,
            color: '#B98758',
            marginBottom: '30px',
            opacity: interpolate(frame, [910, 940, 1300, 1350], [0, 1, 1, 0], { extrapolateRight: 'clamp' }),
          }}>
            O Julgamento Final
          </h2>
          <p style={{
            fontSize: '36px',
            color: '#FFFFFF',
            lineHeight: 1.5,
            opacity: interpolate(frame, [950, 980, 1300, 1350], [0, 1, 1, 0], { extrapolateRight: 'clamp' }),
          }}>
            Acusado de corromper a juventude por estimulá-la a pensar, o maior Tribunal da Antiguidade o condenou a ingerir a fatídica Cicuta.
          </p>
        </AbsoluteFill>
      </Sequence>

      {/* Act 4: The Legacy (45s to 60s -> Frames 1350 to 1800) */}
      <Sequence from={1350} durationInFrames={450}>
        <AbsoluteFill style={{ justifyContent: 'flex-end', padding: '0 10% 20% 10%' }}>
          <div style={{
            textAlign: 'center',
            opacity: interpolate(frame, [1360, 1400, 1750, 1800], [0, 1, 1, 0], { extrapolateRight: 'clamp' }),
            transform: `translateY(${interpolate(frame, [1360, 1400], [40, 0], { extrapolateRight: 'clamp' })}px)`,
          }}>
            <p style={{
              fontSize: '52px',
              fontStyle: 'italic',
              fontWeight: 600,
              color: '#FFFFFF',
              lineHeight: 1.4,
              margin: 0,
              textShadow: '0 4px 20px rgba(0,0,0,0.9)'
            }}>
              "Eu nada escrevi. E é por não escrever nada que serei lido para sempre."
            </p>
          </div>
        </AbsoluteFill>
      </Sequence>

    </AbsoluteFill>
  );
};
