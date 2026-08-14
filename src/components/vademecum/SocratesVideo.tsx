import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Img,
} from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';

export const SOCRATES_FPS = 30;
export const SOCRATES_DURATION_FRAMES = 1800; // 60 seconds (1 minute)
export const SOCRATES_WIDTH = 1080;
export const SOCRATES_HEIGHT = 1920;

// Efeito de Partículas / Poeira Dourada (Sparkles)
const Sparkles: React.FC<{ count?: number }> = ({ count = 20 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {Array.from({ length: count }).map((_, i) => {
        const seed = (i * 97) % 100;
        const x = (seed / 100) * 100;
        const delay = (i * 11) % 60;
        const t = ((frame + delay) % 150) / 150;
        const y = interpolate(t, [0, 1], [110, -10]);
        const size = 3 + ((i * 7) % 5);
        const opacity = interpolate(t, [0, 0.2, 0.8, 1], [0, 0.6, 0.6, 0]);
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
              background: '#D7BD87', // Dourado Envelhecido
              opacity,
              boxShadow: `0 0 ${size * 2}px #B98758`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// COMPONENTES DE CENA
const Scene1Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Fundo
  const imgOpacity = interpolate(frame, [0, 60], [0, 0.5], { extrapolateRight: 'clamp' });
  const imgScale = interpolate(frame, [0, 450], [1.0, 1.15]);

  // Textos com Spring
  const titleSpring = spring({ frame: frame - 15, fps, config: { damping: 14 } });
  const titleY = interpolate(titleSpring, [0, 1], [50, 0]);
  
  const subSpring = spring({ frame: frame - 45, fps, config: { damping: 14 } });
  const subY = interpolate(subSpring, [0, 1], [30, 0]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <Img src="/biografias/socrates-capa.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: imgOpacity, transform: `scale(${imgScale})`, transformOrigin: 'top center' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0) 100%)' }} />
      <Sparkles count={15} />

      <AbsoluteFill style={{ alignItems: 'center', paddingTop: '30%' }}>
        <h1 style={{ fontSize: '110px', fontWeight: 800, color: '#FFF', margin: 0, opacity: titleSpring, transform: `translateY(${titleY}px)`, textShadow: '0 10px 40px rgba(0,0,0,0.9)' }}>
          SÓCRATES
        </h1>
        <p style={{ fontSize: '40px', fontWeight: 500, color: '#D7BD87', margin: '20px 0 0 0', opacity: subSpring, transform: `translateY(${subY}px)` }}>
          O Soldado da Verdade
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Scene2Method: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const imgOpacity = interpolate(frame, [0, 60], [0, 0.5], { extrapolateRight: 'clamp' });
  const imgScale = interpolate(frame, [0, 450], [1.15, 1.0]);

  const titleSpring = spring({ frame: frame - 15, fps, config: { damping: 14 } });
  
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <Img src="/biografias/scene-sofistas.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: imgOpacity, transform: `scale(${imgScale})`, transformOrigin: 'center center' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 100%)' }} />
      <Sparkles count={25} />

      <AbsoluteFill style={{ justifyContent: 'center', padding: '0 10%' }}>
        <h2 style={{ fontSize: '65px', fontWeight: 700, color: '#F1E4BE', marginBottom: '30px', opacity: titleSpring, transform: `translateY(${interpolate(titleSpring, [0, 1], [30, 0])}px)` }}>
          A Guerra contra a Arrogância
        </h2>
        <p style={{ fontSize: '38px', color: '#FFFFFF', lineHeight: 1.5, opacity: interpolate(frame, [45, 75], [0, 1], { extrapolateRight: 'clamp' }) }}>
          Sem cobrar pelas aulas, ele usava a Ironia para demolir o ego dos Sofistas atenienses. Sua missão era despertar as pessoas do sono da ignorância presunçosa.
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Scene3Trial: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const imgOpacity = interpolate(frame, [0, 60], [0, 0.4], { extrapolateRight: 'clamp' });
  const imgScale = interpolate(frame, [0, 450], [1.0, 1.1]);

  const titleSpring = spring({ frame: frame - 15, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <Img src="/biografias/scene-atenas.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: imgOpacity, transform: `scale(${imgScale})`, transformOrigin: 'bottom center' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 100%)' }} />
      <Sparkles count={10} />

      <AbsoluteFill style={{ justifyContent: 'center', padding: '0 10%' }}>
        <h2 style={{ fontSize: '65px', fontWeight: 700, color: '#B98758', marginBottom: '30px', opacity: titleSpring, transform: `translateY(${interpolate(titleSpring, [0, 1], [30, 0])}px)` }}>
          O Julgamento Final
        </h2>
        <p style={{ fontSize: '38px', color: '#FFFFFF', lineHeight: 1.5, opacity: interpolate(frame, [45, 75], [0, 1], { extrapolateRight: 'clamp' }) }}>
          Acusado de corromper a juventude por estimulá-la a pensar, o maior Tribunal da Antiguidade o condenou sob aplausos à morte.
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Scene4Legacy: React.FC = () => {
  const frame = useCurrentFrame();

  const imgOpacity = interpolate(frame, [0, 60], [0, 0.6], { extrapolateRight: 'clamp' });
  const imgScale = interpolate(frame, [0, 450], [1.2, 1.0]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <Img src="/biografias/scene-cicuta.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: imgOpacity, transform: `scale(${imgScale})`, transformOrigin: 'center center' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.95) 100%)' }} />
      <Sparkles count={30} />

      <AbsoluteFill style={{ justifyContent: 'flex-end', padding: '0 10% 20% 10%' }}>
        <div style={{ textAlign: 'center', opacity: interpolate(frame, [30, 90], [0, 1], { extrapolateRight: 'clamp' }), transform: `translateY(${interpolate(frame, [30, 90], [40, 0], { extrapolateRight: 'clamp' })}px)` }}>
          <p style={{ fontSize: '52px', fontStyle: 'italic', fontWeight: 600, color: '#FFFFFF', lineHeight: 1.4, margin: 0, textShadow: '0 4px 30px rgba(0,0,0,1)' }}>
            "Eu nada escrevi. E é por não escrever nada que serei lido para sempre."
          </p>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// VÍDEO PRINCIPAL ORQUESTRADO COM TRANSIÇÕES
export const SocratesVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#050505', fontFamily: '"Inter", sans-serif' }}>
      <TransitionSeries>
        {/* Cena 1 */}
        <TransitionSeries.Sequence durationInFrames={450}>
          <Scene1Intro />
        </TransitionSeries.Sequence>
        
        {/* Transição */}
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 30 })}
        />

        {/* Cena 2 */}
        <TransitionSeries.Sequence durationInFrames={450}>
          <Scene2Method />
        </TransitionSeries.Sequence>

        {/* Transição */}
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 30 })}
        />

        {/* Cena 3 */}
        <TransitionSeries.Sequence durationInFrames={450}>
          <Scene3Trial />
        </TransitionSeries.Sequence>

        {/* Transição */}
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 30 })}
        />

        {/* Cena 4 */}
        <TransitionSeries.Sequence durationInFrames={510}> 
          {/* Compensando o tempo final para bater em 1800 no total (450+450+450+450 = 1800) */}
          <Scene4Legacy />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
