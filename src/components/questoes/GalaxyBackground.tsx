import React, { useMemo } from 'react';

interface Star {
  id: number;
  top: number;
  left: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
}

export const GalaxyBackground: React.FC = () => {
  // Gera 65 estrelas em posições naturais e pseudo-aleatórias consistentes
  const stars: Star[] = useMemo(() => {
    const list: Star[] = [];
    const count = 70;
    for (let i = 0; i < count; i++) {
      // Distribuição uniforme por tela
      const top = ((i * 37 + 13) % 100);
      const left = ((i * 59 + 29) % 100);
      const size = (i % 7 === 0) ? 2.5 : (i % 3 === 0) ? 2 : 1.2;
      const opacity = (i % 5 === 0) ? 0.9 : (i % 2 === 0) ? 0.6 : 0.35;
      const duration = 2 + (i % 4) * 1.5;
      const delay = (i % 5) * 0.8;
      list.push({ id: i, top, left, size, opacity, duration, delay });
    }
    return list;
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#07050E]">
      <style>{`
        @keyframes cometFallTopToBottom1 {
          0% {
            transform: translate3d(220px, -180px, 0) rotate(-45deg);
            opacity: 0;
          }
          6% {
            opacity: 1;
          }
          65% {
            opacity: 0.95;
          }
          100% {
            transform: translate3d(-750px, 790px, 0) rotate(-45deg);
            opacity: 0;
          }
        }
        @keyframes cometFallTopToBottom2 {
          0% {
            transform: translate3d(180px, -150px, 0) rotate(-42deg);
            opacity: 0;
          }
          8% {
            opacity: 1;
          }
          60% {
            opacity: 0.9;
          }
          100% {
            transform: translate3d(-680px, 720px, 0) rotate(-42deg);
            opacity: 0;
          }
        }
        @keyframes cometFallTopToBottom3 {
          0% {
            transform: translate3d(240px, -200px, 0) rotate(-48deg);
            opacity: 0;
          }
          7% {
            opacity: 1;
          }
          65% {
            opacity: 0.92;
          }
          100% {
            transform: translate3d(-800px, 850px, 0) rotate(-48deg);
            opacity: 0;
          }
        }
        @keyframes starTwinkle {
          0%, 100% { opacity: 0.25; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.15); }
        }
      `}</style>

      {/* ── Nebulosas Cósmicas em Degradê Profundo ── */}
      <div className="absolute -top-[10%] left-[10%] w-[520px] h-[520px] rounded-full bg-violet-900/25 blur-[130px]" />
      <div className="absolute top-[35%] -right-[15%] w-[480px] h-[480px] rounded-full bg-fuchsia-900/20 blur-[120px]" />
      <div className="absolute bottom-[10%] left-[5%] w-[580px] h-[580px] rounded-full bg-indigo-950/35 blur-[140px]" />
      <div className="absolute top-[65%] right-[20%] w-[380px] h-[380px] rounded-full bg-amber-900/15 blur-[110px]" />

      {/* ── Campo de Estrelas Cintilantes ── */}
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: s.opacity,
            boxShadow: s.size > 2 ? '0 0 6px rgba(255,255,255,0.9)' : undefined,
            animation: `starTwinkle ${s.duration}s ease-in-out infinite`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}

      {/* ── Estrelas Especiais com Brilho Cruzado (Cross Sparkles) ── */}
      <div 
        className="absolute top-[18%] left-[22%] text-white text-xs opacity-80"
        style={{ animation: 'starTwinkle 3.2s ease-in-out infinite' }}
      >
        ✦
      </div>
      <div 
        className="absolute top-[48%] right-[18%] text-amber-200 text-sm opacity-75"
        style={{ animation: 'starTwinkle 4.5s ease-in-out infinite', animationDelay: '1.2s' }}
      >
        ✦
      </div>
      <div 
        className="absolute top-[78%] left-[30%] text-violet-200 text-xs opacity-70"
        style={{ animation: 'starTwinkle 3.8s ease-in-out infinite', animationDelay: '2.1s' }}
      >
        ✦
      </div>
      <div 
        className="absolute top-[12%] right-[32%] text-white text-[11px] opacity-75"
        style={{ animation: 'starTwinkle 4.1s ease-in-out infinite', animationDelay: '0.6s' }}
      >
        ✦
      </div>

      {/* ── COMETAS CAINDO DO TOPO PARA BAIXO COM CAUDA BRILHANTE (SHOOTING STARS REAIS) ── */}
      {/* Cometa 1 (Topo-Direita cruzando em direção ao chão) */}
      <div 
        className="absolute top-[8%] right-[10%] z-10 pointer-events-none flex items-center"
        style={{
          animation: 'cometFallTopToBottom1 7.2s cubic-bezier(0.25, 0.1, 0.25, 1) infinite',
          animationDelay: '0.8s'
        }}
      >
        {/* Cabeça Brilhante em Frente (Lidera a queda) */}
        <div 
          className="w-2.5 h-2.5 rounded-full bg-white shrink-0 -mr-1 z-10"
          style={{
            boxShadow: '0 0 14px 4px rgba(255,255,255,1), 0 0 24px 8px rgba(168,85,247,0.85)'
          }}
        />
        {/* Cauda Luminosa do Cometa (Estende para trás e para cima) */}
        <div 
          className="w-48 sm:w-64 h-[2px]"
          style={{
            background: 'linear-gradient(to right, #ffffff, rgba(168,85,247,0.85), rgba(59,130,246,0.4), transparent)'
          }}
        />
      </div>

      {/* Cometa 2 (Meio-Direita caindo de cima para baixo) */}
      <div 
        className="absolute top-[35%] right-[15%] z-10 pointer-events-none flex items-center"
        style={{
          animation: 'cometFallTopToBottom2 9.8s cubic-bezier(0.25, 0.1, 0.25, 1) infinite',
          animationDelay: '4.2s'
        }}
      >
        <div 
          className="w-2.5 h-2.5 rounded-full bg-white shrink-0 -mr-1 z-10"
          style={{
            boxShadow: '0 0 14px 4px rgba(255,255,255,1), 0 0 22px 7px rgba(249,115,22,0.85)'
          }}
        />
        <div 
          className="w-44 sm:w-56 h-[2px]"
          style={{
            background: 'linear-gradient(to right, #ffffff, rgba(249,115,22,0.85), rgba(234,179,8,0.4), transparent)'
          }}
        />
      </div>

      {/* Cometa 3 (Topo-Centro cruzando de cima para baixo) */}
      <div 
        className="absolute top-[18%] right-[30%] z-10 pointer-events-none flex items-center"
        style={{
          animation: 'cometFallTopToBottom3 11.2s cubic-bezier(0.25, 0.1, 0.25, 1) infinite',
          animationDelay: '7.5s'
        }}
      >
        <div 
          className="w-3 h-3 rounded-full bg-white shrink-0 -mr-1 z-10"
          style={{
            boxShadow: '0 0 16px 5px rgba(255,255,255,1), 0 0 26px 8px rgba(236,72,153,0.85)'
          }}
        />
        <div 
          className="w-52 sm:w-72 h-[2.5px]"
          style={{
            background: 'linear-gradient(to right, #ffffff, rgba(236,72,153,0.85), rgba(168,85,247,0.4), transparent)'
          }}
        />
      </div>
    </div>
  );
};

export default GalaxyBackground;

