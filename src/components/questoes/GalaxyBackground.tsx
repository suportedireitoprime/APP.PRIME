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
        @keyframes cometTravel1 {
          0% {
            transform: translate3d(0, 0, 0) rotate(-35deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          60% {
            opacity: 0.9;
          }
          100% {
            transform: translate3d(-600px, 420px, 0) rotate(-35deg);
            opacity: 0;
          }
        }
        @keyframes cometTravel2 {
          0% {
            transform: translate3d(0, 0, 0) rotate(-38deg);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          65% {
            opacity: 0.8;
          }
          100% {
            transform: translate3d(-700px, 540px, 0) rotate(-38deg);
            opacity: 0;
          }
        }
        @keyframes cometTravel3 {
          0% {
            transform: translate3d(0, 0, 0) rotate(-32deg);
            opacity: 0;
          }
          12% {
            opacity: 1;
          }
          70% {
            opacity: 0.85;
          }
          100% {
            transform: translate3d(-550px, 340px, 0) rotate(-32deg);
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

      {/* ── COMETAS PASSANDO COM CAUDA BRILHANTE (SHOOTING STARS) ── */}
      {/* Cometa 1 (Topo-Direita) */}
      <div 
        className="absolute top-[12%] right-[8%] z-10 pointer-events-none flex items-center"
        style={{
          animation: 'cometTravel1 7.5s cubic-bezier(0.25, 0.1, 0.25, 1) infinite',
          animationDelay: '1s'
        }}
      >
        {/* Cauda Luminosa do Cometa */}
        <div 
          className="w-40 sm:w-56 h-[2px]"
          style={{
            background: 'linear-gradient(to left, #ffffff, rgba(249,115,22,0.8), rgba(168,85,247,0.5), transparent)'
          }}
        />
        {/* Cabeça Brilhante do Cometa */}
        <div 
          className="w-2.5 h-2.5 rounded-full bg-white -ml-1 shrink-0"
          style={{
            boxShadow: '0 0 12px 3px rgba(255,255,255,0.95), 0 0 20px 6px rgba(249,115,22,0.8)'
          }}
        />
      </div>

      {/* Cometa 2 (Meio) */}
      <div 
        className="absolute top-[42%] right-[15%] z-10 pointer-events-none flex items-center"
        style={{
          animation: 'cometTravel2 10.5s cubic-bezier(0.25, 0.1, 0.25, 1) infinite',
          animationDelay: '4.8s'
        }}
      >
        <div 
          className="w-36 sm:w-48 h-[2px]"
          style={{
            background: 'linear-gradient(to left, #ffffff, rgba(168,85,247,0.8), rgba(59,130,246,0.5), transparent)'
          }}
        />
        <div 
          className="w-2 h-2 rounded-full bg-white -ml-1 shrink-0"
          style={{
            boxShadow: '0 0 10px 2px rgba(255,255,255,0.95), 0 0 18px 5px rgba(168,85,247,0.7)'
          }}
        />
      </div>

      {/* Cometa 3 (Inferior-Direita) */}
      <div 
        className="absolute top-[72%] right-[5%] z-10 pointer-events-none flex items-center"
        style={{
          animation: 'cometTravel3 9s cubic-bezier(0.25, 0.1, 0.25, 1) infinite',
          animationDelay: '7.2s'
        }}
      >
        <div 
          className="w-44 sm:w-60 h-[2px]"
          style={{
            background: 'linear-gradient(to left, #ffffff, rgba(234,179,8,0.8), rgba(249,115,22,0.5), transparent)'
          }}
        />
        <div 
          className="w-2.5 h-2.5 rounded-full bg-white -ml-1 shrink-0"
          style={{
            boxShadow: '0 0 12px 3px rgba(255,255,255,0.95), 0 0 20px 6px rgba(234,179,8,0.7)'
          }}
        />
      </div>
    </div>
  );
};

export default GalaxyBackground;
