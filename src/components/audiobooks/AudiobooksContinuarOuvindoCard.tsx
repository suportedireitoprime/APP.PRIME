import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Headphones, Play } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { AudiobookLivro } from '@/data/audiobooksCatalogo';

interface AudiobooksContinuarOuvindoCardProps {
  livro: AudiobookLivro;
  progressoSalvo?: { capituloIndex: number; time: number } | null;
  onPlay: (capituloIndex: number) => void;
}

export const AudiobooksContinuarOuvindoCard: React.FC<AudiobooksContinuarOuvindoCardProps> = ({
  livro,
  progressoSalvo,
  onPlay,
}) => {
  const capIndex = progressoSalvo?.capituloIndex ?? 0;
  const capNumero = capIndex + 1;
  const capituloAtual = livro.capitulos?.[capIndex];
  const capTitulo = capituloAtual?.titulo || 'Presidente Truepenny';

  const handleClick = () => {
    haptic.impact();
    onPlay(capIndex);
  };

  const subtitulo = progressoSalvo
    ? `Capítulo ${capNumero} de ${livro.totalCapitulos || 8}: ${capTitulo} · Toque para continuar`
    : `Capítulo 1: ${capTitulo} · Toque para começar`;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleClick}
      style={{
        background: 'linear-gradient(to right, rgba(124, 58, 237, 0.22), rgba(124, 58, 237, 0.06))',
        borderColor: 'rgba(168, 85, 247, 0.35)',
      }}
      className="w-full flex items-center gap-3.5 px-3.5 py-3 sm:px-4 sm:py-3.5 rounded-2xl border text-left active:scale-[0.98] transition-all overflow-hidden relative shadow-lg group cursor-pointer"
    >
      {/* Capa do Livro à esquerda (substitui o ícone do Vade Mecum) */}
      <div className="w-12 h-16 sm:w-14 sm:h-18 rounded-xl overflow-hidden border border-purple-500/30 bg-[#140D26] shrink-0 relative shadow-md group-hover:scale-105 transition-transform">
        <img
          src={livro.capaUrl}
          alt={livro.titulo}
          className="w-full h-full object-cover"
        />
        <span className="absolute bottom-0 inset-x-0 bg-[#7C3AED] text-[8px] font-black uppercase text-center text-white py-0.5 tracking-wider">
          ÁUDIO
        </span>
      </div>

      {/* Textos informativos centrais */}
      <div className="flex-1 min-w-0 z-10">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Play className="w-2.5 h-2.5 fill-[#A78BFA] text-[#A78BFA]" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#C4B5FD]">
            CONTINUAR OUVINDO
          </p>
        </div>

        <p className="font-sans text-[15px] sm:text-[16px] font-bold tracking-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] leading-snug">
          {livro.titulo}
        </p>

        <p className="text-[11px] font-semibold truncate flex items-center gap-1.5 text-purple-200/80 mt-0.5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-emerald-400 shrink-0" />
          <span>{subtitulo}</span>
        </p>
      </div>

      {/* Seta indicativa à direita */}
      <ArrowRight
        className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 z-10 text-[#A78BFA] group-hover:translate-x-1 transition-transform"
        strokeWidth={2.4}
      />

      {/* Decoração de fundo — Ícone translúcido com glow roxo no canto direito */}
      <div
        className="absolute -right-3 -bottom-3 pointer-events-none select-none z-0 overflow-visible flex items-center justify-center opacity-20"
        style={{
          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.9)) drop-shadow(0 0 10px rgba(124, 58, 237, 0.4))',
        }}
      >
        <Headphones className="w-24 h-24 text-purple-400" strokeWidth={1.2} />
      </div>
    </motion.button>
  );
};

export default memo(AudiobooksContinuarOuvindoCard);

