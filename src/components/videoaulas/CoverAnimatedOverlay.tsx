import { useMemo } from 'react';
import { Scale, Sparkles } from 'lucide-react';
import laurelLeaf from '@/assets/landing-tribunal/laurel-leaf.png';
import scalesImg from '@/assets/landing-tribunal/scales.png';

interface Props {
  className?: string;
  leafCount?: number;
}

/**
 * Overlay animado para capas de videoaulas.
 * Renderiza folhas de louro caindo delicadamente por toda a capa
 * e elementos jurídicos flutuantes com brilho suave nas áreas de fundo.
 */
export default function CoverAnimatedOverlay({ className = '', leafCount = 6 }: Props) {
  // Gerar posições determinísticas para as folhas caindo
  const leaves = useMemo(() => {
    return Array.from({ length: leafCount }).map((_, i) => ({
      id: i,
      left: `${(i * 15 + 7) % 90}%`,
      size: 14 + (i % 3) * 6, // 14px to 26px
      duration: 7 + (i % 4) * 2.5, // 7s to 14.5s
      delay: (i * 1.3) % 5,
      rotate: (i * 45) % 360,
    }));
  }, [leafCount]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden z-10 ${className}`}>
      {/* Estilos CSS Inline de Animação para leveza e performance 0ms */}
      <style>{`
        @keyframes coverLeafFall {
          0% {
            transform: translateY(-20px) rotate(0deg) translateX(0px);
            opacity: 0;
          }
          15% {
            opacity: 0.85;
          }
          85% {
            opacity: 0.85;
          }
          100% {
            transform: translateY(220px) rotate(360deg) translateX(15px);
            opacity: 0;
          }
        }
        @keyframes coverFloatRight {
          0%, 100% {
            transform: translateY(0px) rotate(-3deg) scale(1);
          }
          50% {
            transform: translateY(-6px) rotate(4deg) scale(1.05);
          }
        }
        @keyframes coverGlowPulse {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.65; transform: scale(1.15); }
        }
      `}</style>

      {/* 🍃 Folhas de Louro caindo do topo (passam por toda a capa) */}
      {leaves.map((leaf) => (
        <img
          key={leaf.id}
          src={laurelLeaf}
          alt=""
          aria-hidden="true"
          className="absolute top-0 select-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
          style={{
            left: leaf.left,
            width: `${leaf.size}px`,
            height: 'auto',
            animation: `coverLeafFall ${leaf.duration}s linear infinite`,
            animationDelay: `${leaf.delay}s`,
            opacity: 0,
          }}
        />
      ))}

      {/* ⚖️ Elementos Jurídicos Flutuantes no Canto Superior Direito (Área de fundo/laranja) */}
      <div 
        className="absolute top-2 right-3 flex items-center gap-1.5 opacity-80"
        style={{ animation: 'coverFloatRight 5s ease-in-out infinite' }}
      >
        <img
          src={scalesImg}
          alt=""
          aria-hidden="true"
          className="w-7 h-7 object-contain drop-shadow-[0_0_10px_rgba(227,38,47,0.5)]"
        />
        <Sparkles 
          className="w-3.5 h-3.5 text-[#E3262F]" 
          style={{ animation: 'coverGlowPulse 2.5s ease-in-out infinite' }}
        />
      </div>

      {/* ⚖️ Ícone Balança Sutil Flutuando no Canto Superior Esquerdo */}
      <div 
        className="absolute top-3 left-3 opacity-60"
        style={{ animation: 'coverFloatRight 6s ease-in-out infinite', animationDelay: '1.5s' }}
      >
        <Scale className="w-4 h-4 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
      </div>
    </div>
  );
}
