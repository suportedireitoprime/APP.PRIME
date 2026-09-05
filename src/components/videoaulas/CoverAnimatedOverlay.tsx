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
  // O loop de folhas foi removido a pedido.
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden z-10 ${className}`}>
      {/* Estilos CSS Inline de Animação para leveza e performance 0ms */}
      <style>{`
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

      {/* As Folhas de Louro caindo foram removidas. */}
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
