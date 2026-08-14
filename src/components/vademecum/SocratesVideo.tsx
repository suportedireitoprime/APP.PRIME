import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Img,
  Sequence,
} from 'remotion';

export const SOCRATES_FPS = 30;
export const SOCRATES_DURATION_FRAMES = 30 * 12; // 12 seconds
export const SOCRATES_WIDTH = 1080;
export const SOCRATES_HEIGHT = 1920;

export const SocratesVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animations
  const imgOpacity = interpolate(frame, [0, 30], [0, 0.5], { extrapolateRight: 'clamp' });
  const imgScale = interpolate(frame, [0, SOCRATES_DURATION_FRAMES], [1.05, 1.15]);
  
  const titleY = interpolate(frame, [15, 40], [50, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const titleOpacity = interpolate(frame, [15, 30], [0, 1], { extrapolateRight: 'clamp' });

  const subtitleOpacity = interpolate(frame, [45, 60], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  const quoteOpacity = interpolate(frame, [150, 180], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const quoteY = interpolate(frame, [150, 180], [30, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#050505', fontFamily: '"Inter", sans-serif' }}>
      
      {/* Background Image Layer */}
      <Sequence from={0}>
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
            background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0) 100%)'
          }} />
        </AbsoluteFill>
      </Sequence>

      {/* Title Sequence */}
      <Sequence from={15}>
        <AbsoluteFill style={{ alignItems: 'center', paddingTop: '20%' }}>
          <h1 style={{ 
            fontSize: '120px', 
            fontWeight: 800,
            color: '#FFFFFF',
            margin: 0,
            letterSpacing: '-0.02em',
            opacity: titleOpacity, 
            transform: `translateY(${titleY}px)`,
            textShadow: '0 10px 40px rgba(0,0,0,0.8)'
          }}>
            SÓCRATES
          </h1>
          <p style={{
            fontSize: '42px',
            fontWeight: 500,
            color: '#D7BD87', // Vintage gold
            margin: '20px 0 0 0',
            opacity: subtitleOpacity,
            textShadow: '0 4px 20px rgba(0,0,0,0.5)'
          }}>
            O Mártir da Verdade
          </p>
        </AbsoluteFill>
      </Sequence>

      {/* Quote Sequence */}
      <Sequence from={120}>
        <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: '15%' }}>
          <div style={{
            width: '80%',
            textAlign: 'center',
            opacity: quoteOpacity,
            transform: `translateY(${quoteY}px)`,
          }}>
            <p style={{
              fontSize: '48px',
              fontStyle: 'italic',
              color: '#FFFFFF',
              lineHeight: 1.4,
              margin: 0,
              textShadow: '0 4px 20px rgba(0,0,0,0.8)'
            }}>
              "Eu nada escrevi. E é por não escrever nada que serei lido para sempre."
            </p>
          </div>
        </AbsoluteFill>
      </Sequence>

    </AbsoluteFill>
  );
};
