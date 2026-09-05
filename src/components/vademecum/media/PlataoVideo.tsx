import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, spring, interpolate, Img, Audio, staticFile } from 'remotion';
import { TransitionSeries, springTiming, linearTiming } from '@remotion/transitions';
import { wipe } from '@remotion/transitions/wipe';
import { fade } from '@remotion/transitions/fade';
import { BookOpen, Scale, Sparkles as SparklesIcon, Landmark, Eye, Compass, Flame, ArrowRight, Sun, User } from 'lucide-react';

export const PLATAO_FPS = 30;
export const PLATAO_DURATION_FRAMES = 3825; // 8.5s * 15 cenas
export const PLATAO_WIDTH = 1080;
export const PLATAO_HEIGHT = 1920;

// Paleta
const GOLD = '#D7BD87';
const LIGHT_GOLD = '#F4E5C1';
const OFF_WHITE = '#FAF7EF';

const displayFont = '"Outfit", "Inter", ui-sans-serif, system-ui, sans-serif';
const bodyFont = '"Inter", ui-sans-serif, system-ui, sans-serif';

/* ------------------------------------------------------------------ */
/*  Componentes Reutilizáveis                                         */
/* ------------------------------------------------------------------ */

const SceneTimeline: React.FC<{ year: number; event: string; color: string; version: number }> = ({ year, event, color, version }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, config: { damping: version === 1 ? 20 : 30 } });
  
  return (
    <AbsoluteFill style={{ backgroundColor: version === 3 ? '#020202' : '#050505' }}>
      {/* Linha vertical na esquerda */}
      <div style={{ position: 'absolute', left: '15%', top: 0, bottom: 0, width: version === 3 ? 1 : 4, backgroundColor: 'rgba(255,255,255,0.05)' }} />
      <div style={{ position: 'absolute', left: '15%', top: 0, height: `${progress * 100}%`, width: version === 3 ? 1 : 4, backgroundColor: color, boxShadow: version === 3 ? 'none' : `0 0 20px ${color}` }} />
      
      {/* Círculo do ponto no tempo */}
      <div style={{ position: 'absolute', left: `calc(15% - ${version === 3 ? 12 : 16}px)`, top: '50%', width: version === 3 ? 25 : 36, height: version === 3 ? 25 : 36, borderRadius: '50%', backgroundColor: '#0A0A0A', border: `${version === 3 ? 2 : 4}px solid ${color}`, transform: `scale(${progress}) translateY(-50%)`, boxShadow: version === 3 ? 'none' : `0 0 20px ${color}`, zIndex: 20 }} />

      {/* Conteúdo na direita */}
      <div style={{ position: 'absolute', left: '25%', right: '10%', top: '50%', transform: `translateY(-50%)`, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', opacity: progress }}>
         <h1 style={{ fontSize: version === 3 ? 110 : 130, fontWeight: version === 3 ? 300 : 900, color: '#FFF', margin: 0, textShadow: version === 3 ? 'none' : `0 0 60px ${color}`, transform: `translateX(${interpolate(progress, [0,1], [40, 0])}px)` }}>
           {year} <span style={{ fontSize: 50, color: 'rgba(255,255,255,0.4)', fontWeight: 300 }}>a.C.</span>
         </h1>
         <div style={{ height: version === 3 ? 1 : 4, width: 120, backgroundColor: color, margin: '20px 0', transform: `translateX(${interpolate(progress, [0,1], [60, 0])}px)` }} />
         <p style={{ fontSize: version === 3 ? 40 : 48, color: '#E5E5E5', fontWeight: version === 3 ? 300 : 600, letterSpacing: '0.05em', textTransform: 'uppercase', transform: `translateX(${interpolate(progress, [0,1], [80, 0])}px)` }}>
           {event}
         </p>
      </div>
    </AbsoluteFill>
  );
};

const Sparkles: React.FC<{ count?: number, color?: string }> = ({ count = 25, color = GOLD }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {Array.from({ length: count }).map((_, i) => {
        const seed = (i * 97) % 100;
        const x = (seed / 100) * 100;
        const delay = (i * 11) % 60;
        const t = ((frame + delay) % 150) / 150;
        const y = interpolate(t, [0, 1], [110, -10]);
        const size = 4 + ((i * 7) % 6);
        const opacity = interpolate(t, [0, 0.2, 0.8, 1], [0, 0.7, 0.7, 0]);
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
              background: color,
              opacity,
              boxShadow: `0 0 ${size * 2.5}px ${color}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const FilmGrain: React.FC = () => {
  const opacity = 0.08 + Math.random() * 0.04; 
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        zIndex: 50,
        opacity,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        transform: `translate(${Math.random() * 2 - 1}px, ${Math.random() * 2 - 1}px)`
      }}
    />
  );
};

const LightLeak: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame % (fps * 4)) / (fps * 4); 
  const x = interpolate(t, [0, 1], [-50, 150]);
  const opacity = interpolate(t, [0, 0.5, 1], [0, 0.15, 0]);
  
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 40 }}>
       <div style={{
         position: 'absolute',
         top: '-20%',
         left: `${x}%`,
         width: '100%',
         height: '140%',
         background: 'linear-gradient(90deg, transparent, rgba(255,100,50,0.8), transparent)',
         filter: 'blur(80px)',
         transform: 'skewX(-30deg)',
         opacity
       }} />
    </AbsoluteFill>
  );
};

const GeometricLines: React.FC = () => {
  const frame = useCurrentFrame();
  const height = interpolate(frame, [0, 60], [0, 100], { extrapolateRight: 'clamp' });
  const width = interpolate(frame, [30, 90], [0, 100], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 10 }}>
      <div style={{ position: 'absolute', right: '10%', top: 0, width: 1, height: `${height}%`, backgroundColor: 'rgba(255,255,255,0.1)' }} />
      <div style={{ position: 'absolute', bottom: '15%', right: '10%', width: `${width}%`, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
      <div style={{ position: 'absolute', top: '20%', left: '10%', width: 300, height: 300, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', transform: `rotate(${frame * 0.2}deg) scale(${1 + Math.sin(frame/30)*0.02})` }} />
    </AbsoluteFill>
  );
};

const Eyebrow: React.FC<{ text: string; delay?: number; version: number }> = ({ text, delay = 0, version }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: version === 2 ? 30 : 20, stiffness: 160 } });
  
  if (version === 3) {
    return (
      <div style={{ opacity: s, transform: `translateY(${interpolate(s, [0, 1], [20, 0])}px)`, marginBottom: 30 }}>
         <span style={{ fontFamily: bodyFont, fontSize: 24, color: LIGHT_GOLD, fontWeight: 300, letterSpacing: '0.3em', textTransform: 'uppercase' }}>
            {text}
         </span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 14,
        padding: '12px 26px',
        borderRadius: 999,
        background: version === 2 ? 'transparent' : 'rgba(215, 189, 135, 0.1)',
        border: version === 2 ? 'none' : '2px solid rgba(215, 189, 135, 0.4)',
        transform: `translateY(${interpolate(s, [0, 1], [20, 0])}px)`,
        opacity: s,
        marginBottom: 30,
        boxShadow: version === 2 ? 'none' : '0 10px 30px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: GOLD, boxShadow: `0 0 12px ${GOLD}` }} />
      <span style={{ fontFamily: bodyFont, fontSize: 26, color: LIGHT_GOLD, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
        {text}
      </span>
    </div>
  );
};

const FloatingIcon: React.FC<{ IconComponent: React.ElementType; size: number; color: string; delay: number; startX: number; startY: number }> = ({ IconComponent, size, color, delay, startX, startY }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 80 } });
  const floatY = Math.sin((frame - delay) / 30) * 15;
  const rotate = Math.cos((frame - delay) / 40) * 5;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${startX}%`,
        top: `${startY}%`,
        transform: `scale(${interpolate(s, [0, 1], [0, 1])}) translateY(${floatY}px) rotate(${rotate}deg)`,
        opacity: interpolate(s, [0, 1], [0, 0.15]),
        color: color,
      }}
    >
      <IconComponent size={size} />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Cenas                                                             */
/* ------------------------------------------------------------------ */

const Scene1Intro: React.FC<{ version: number }> = ({ version }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const zoomEnd = version === 2 ? 1.15 : (version === 3 ? 1.05 : 1.3);
  const imgScale = interpolate(frame, [0, 180], [1.0, zoomEnd]);
  
  const letters = 'PLATÃO'.split('');
  const subSpring = spring({ frame: frame - 15, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <Img src="/biografias/platao-capa.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: version === 3 ? 0.1 : 0.4, transform: `scale(${imgScale})`, transformOrigin: 'top center' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.85) 100%)' }} />
      
      {version === 1 && (
        <>
          <FloatingIcon IconComponent={Eye} size={250} color={GOLD} delay={10} startX={10} startY={20} />
          <FloatingIcon IconComponent={Sun} size={180} color={GOLD} delay={40} startX={70} startY={60} />
          <FloatingIcon IconComponent={Scale} size={150} color={LIGHT_GOLD} delay={60} startX={80} startY={20} />
          <Sparkles count={30} color={LIGHT_GOLD} />
        </>
      )}

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {letters.map((L, i) => {
            const delay = version === 2 ? i * 12 : i * 8;
            const s = spring({ frame: frame - 15 - delay, fps, config: { damping: version === 3 ? 20 : 12, stiffness: 180 } });
            const y = interpolate(s, [0, 1], [80, 0]);
            const rotateX = interpolate(s, [0, 1], [90, 0]);
            return (
              <span
                key={i}
                style={{
                  fontFamily: displayFont, 
                  fontWeight: version === 3 ? 300 : 900, 
                  fontSize: 140, 
                  lineHeight: 1, 
                  color: OFF_WHITE,
                  transform: version === 3 ? `translateY(${y}px)` : `translateY(${y}px) rotateX(${rotateX}deg)`, 
                  opacity: s, 
                  letterSpacing: version === 3 ? '0.1em' : '-0.02em',
                  textShadow: version === 3 ? 'none' : `0 10px 50px rgba(215, 189, 135, 0.5)`,
                }}
              >
                {L}
              </span>
            );
          })}
        </div>
        
        <p style={{
          fontSize: version === 3 ? 40 : 48, 
          fontWeight: version === 3 ? 300 : 500, 
          color: GOLD, 
          opacity: subSpring,
          transform: `translateY(${interpolate(subSpring, [0, 1], [40, 0])}px)`,
          textTransform: 'uppercase', 
          letterSpacing: '0.2em', 
          textShadow: version === 3 ? 'none' : '0 4px 20px rgba(0,0,0,0.8)'
        }}>
          O Arquiteto das Ideias
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const AnimatedTextSequence: React.FC<{ text: string; delay: number; version: number }> = ({ text, delay, version }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(' ');

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: version === 3 ? 'center' : 'flex-start' }}>
      {words.map((word, i) => {
        const s = spring({ frame: frame - delay - i * (version === 1 ? 2 : 4), fps, config: { damping: version === 1 ? 16 : 24 } });
        return (
          <span
            key={i}
            style={{
              opacity: s,
              transform: `translateY(${interpolate(s, [0, 1], [20, 0])}px)`,
              display: 'inline-block'
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

const SceneGeneric: React.FC<{ imgSrc: string, eyebrow: string, title: string, desc1: string, desc2: string, Icon1: React.ElementType, Icon2: React.ElementType, version: number }> = ({ imgSrc, eyebrow, title, desc1, desc2, Icon1, Icon2, version }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const imgScale = interpolate(frame, [0, 180], [1.2, 1.0]);
  const floatIcon = Math.sin(frame / 8) * 20;
  const rotateIcon = frame * 0.5;
  
  const titleSpring = spring({ frame: frame - 10, fps, config: { damping: version === 1 ? 12 : 20 } });

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <Img src={imgSrc} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: version === 3 ? 0.08 : 0.35, transform: `scale(${imgScale})` }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 100%)' }} />
      
      {version === 1 && (
        <>
          <div style={{ position: 'absolute', top: '20%', left: '10%', width: 120, height: 120, border: `2px solid ${GOLD}`, borderRadius: '50%', opacity: 0.15, transform: `scale(${1 + Math.sin(frame / 15) * 0.1})` }} />
          <div style={{ position: 'absolute', bottom: '25%', right: '20%', width: 250, height: 250, border: `1px dashed ${GOLD}`, borderRadius: '50%', opacity: 0.08, transform: `rotate(${frame}deg)` }} />
          <div style={{ position: 'absolute', top: '40%', left: '85%', width: 2, height: 300, backgroundColor: GOLD, opacity: 0.15, transform: `rotate(35deg) translateY(${Math.sin(frame / 20) * 80}px)` }} />

          <div style={{ position: 'absolute', right: '-5%', top: '15%', opacity: 0.08, transform: `translateY(${floatIcon}px)`, color: GOLD }}>
            <Icon1 size={650} />
          </div>
          <div style={{ position: 'absolute', left: '40%', bottom: '-5%', opacity: 0.05, transform: `translateY(${floatIcon * -1}px) rotate(${15 + rotateIcon}deg)`, color: LIGHT_GOLD }}>
            <Icon2 size={400} />
          </div>
          <Sparkles count={40} color={OFF_WHITE} />
        </>
      )}

      {version === 2 && (
        <>
          <FilmGrain />
          <LightLeak />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.6) 100%)', pointerEvents: 'none' }} />
        </>
      )}

      {version === 3 && (
        <GeometricLines />
      )}

      <AbsoluteFill style={{ justifyContent: 'center', padding: '0 8%', textAlign: version === 3 ? 'center' : 'left', alignItems: version === 3 ? 'center' : 'flex-start' }}>
        <Eyebrow text={eyebrow} delay={10} version={version} />
        <h2 style={{ 
          fontSize: version === 3 ? 90 : 80, 
          fontWeight: version === 3 ? 300 : 800, 
          color: OFF_WHITE, 
          marginBottom: 40, 
          lineHeight: 1.1, 
          opacity: titleSpring, 
          transform: `translateY(${interpolate(titleSpring, [0, 1], [50, 0])}px)` 
        }}>
          {title}
        </h2>
        <div style={{ fontSize: version === 3 ? 48 : 42, color: '#D4D4D4', lineHeight: 1.5, fontWeight: version === 3 ? 300 : 400 }}>
          <AnimatedTextSequence text={desc1} delay={20} version={version} />
          <div style={{ height: 20 }} />
          <AnimatedTextSequence text={desc2} delay={50} version={version} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const PLATAO_SCENES = [
  { type: 'intro' }, // Cena 1
  { type: 'generic', img: '/biografias/scene-atenas.jpg', eyebrow: 'O Destinado', title: 'Atenas', d1: 'O aristocrata destinado a governar...', d2: 'que mudou tudo ao conhecer Sócrates.', icon1: Landmark, icon2: BookOpen },
  { type: 'generic', img: '/biografias/scene-julgamento.jpg', eyebrow: 'A Revolta', title: 'A Queda', d1: 'A morte do seu mestre', d2: 'o revoltou profundamente.', icon1: Scale, icon2: Flame },
  { type: 'generic', img: '/biografias/scene-academia.jpg', eyebrow: 'O Exílio', title: 'A Jornada', d1: 'Ele fugiu de Atenas,', d2: 'e viajou pelo mundo antigo.', icon1: Compass, icon2: ArrowRight },
  { type: 'generic', img: '/biografias/scene-academia.jpg', eyebrow: 'A Primeira Faculdade', title: 'Academia', d1: 'Voltando, fundou a Academia.', d2: 'A primeira universidade da história.', icon1: BookOpen, icon2: Landmark },
  { type: 'timeline', year: 387, event: 'Fundação da Academia' }, // Cena 6
  { type: 'generic', img: '/biografias/platao-capa.jpg', eyebrow: 'A Essência', title: 'O Pensamento', d1: 'Ali, ele esculpiu todo', d2: 'o pensamento do ocidente.', icon1: Eye, icon2: SparklesIcon },
  { type: 'generic', img: '/biografias/scene-caverna.jpg', eyebrow: 'A Alegoria', title: 'Mito da Caverna', d1: 'Um aviso poderoso:', d2: 'Vivemos acorrentados em sombras ilusórias.', icon1: Flame, icon2: Eye },
  { type: 'generic', img: '/biografias/scene-caverna.jpg', eyebrow: 'O Dever', title: 'A Luz', d1: 'O dever do verdadeiro jurista', d2: 'é sempre buscar a luz.', icon1: Sun, icon2: Scale },
  { type: 'generic', img: '/biografias/scene-republica.jpg', eyebrow: 'O Best-Seller', title: 'A República', d1: 'Em 375, publicou A República.', d2: 'Sua maior obra política.', icon1: BookOpen, icon2: Landmark },
  { type: 'timeline', year: 375, event: 'Publicação de A República' }, // Cena 11
  { type: 'generic', img: '/biografias/scene-republica.jpg', eyebrow: 'O Governo Ideal', title: 'Reis-Filósofos', d1: 'Uma utopia governada puramente', d2: 'por reis-filósofos.', icon1: User, icon2: Scale },
  { type: 'generic', img: '/biografias/scene-leis.jpg', eyebrow: 'O Propósito da Lei', title: 'A Pedagogia', d1: 'Para Platão, a lei não', d2: 'serve para punir...', icon1: Scale, icon2: ArrowRight },
  { type: 'timeline', year: 347, event: 'Morte de Platão' }, // Cena 14
  { type: 'generic', img: '/biografias/scene-academia.jpg', eyebrow: 'A Alma', title: 'A Educação', d1: 'A lei serve para educar', d2: 'a alma humana.', icon1: Sun, icon2: BookOpen },
];

export const PlataoVideo: React.FC<{ customAudioUrl?: string, version?: number, roteiro?: Array<{frame: number, text: string, duration: number}> }> = ({ customAudioUrl, version = 1, roteiro }) => {
  const getTransition = () => {
    if (version === 1) return <TransitionSeries.Transition presentation={wipe()} timing={springTiming({ config: { damping: 15 } })} />;
    if (version === 2) return <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 30 })} />;
    if (version === 3) return <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 20 })} />;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: BG_COLOR, fontFamily: bodyFont }}>
      <Audio src={customAudioUrl || staticFile('trilha-sonora.mp3')} volume={0.3} />
      <TransitionSeries>
        {PLATAO_SCENES.map((scene, i) => (
          <React.Fragment key={i}>
            <TransitionSeries.Sequence durationInFrames={roteiro ? roteiro[i]?.duration || 255 : 255}>
              {scene.type === 'intro' && <Scene1Intro version={version} />}
              {scene.type === 'timeline' && <SceneTimeline year={scene.year!} event={scene.event!} color={GOLD} version={version} />}
              {scene.type === 'generic' && (
                <SceneGeneric 
                  imgSrc={scene.img!}
                  eyebrow={scene.eyebrow!}
                  title={scene.title!}
                  desc1={scene.d1!}
                  desc2={scene.d2!}
                  Icon1={scene.icon1!}
                  Icon2={scene.icon2!}
                  version={version}
                />
              )}
            </TransitionSeries.Sequence>
            {i < PLATAO_SCENES.length - 1 && getTransition()}
          </React.Fragment>
        ))}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
