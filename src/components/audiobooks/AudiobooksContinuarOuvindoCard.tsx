import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { cn } from '@/lib/utils';
import { AudiobookLivro } from '@/data/audiobooksCatalogo';

interface AudiobooksContinuarOuvindoCardProps {
  livro: AudiobookLivro;
  progressoSalvo?: { capituloIndex: number; time: number } | null;
  onPlay: (capituloIndex: number) => void;
  isResumo?: boolean;
}

export const AudiobooksContinuarOuvindoCard: React.FC<AudiobooksContinuarOuvindoCardProps> = ({
  livro,
  progressoSalvo,
  onPlay,
  isResumo: isResumoProp,
}) => {
  const isResumo = Boolean(
    isResumoProp ||
    livro.id?.endsWith('-resumo') ||
    livro.subtitulo?.toLowerCase().includes('resumo') ||
    (livro as any).isResumo
  );

  const totalCapitulos = livro.totalCapitulos || livro.capitulos?.length || 8;
  const capIndex = Math.min(progressoSalvo?.capituloIndex ?? 0, totalCapitulos - 1);
  const capNumero = capIndex + 1;

  // Cálculo de percentual de progresso
  const progressoPct = Math.min(
    Math.max(Math.round(((capIndex + 0.5) / totalCapitulos) * 100), 10),
    100
  );

  const handleClick = () => {
    haptic.impact();
    onPlay(capIndex);
  };

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleClick}
      className={cn(
        "w-full flex items-center gap-3 sm:gap-3.5 p-3 rounded-2xl border text-left active:scale-[0.99] transition-all overflow-hidden relative shadow-lg group cursor-pointer",
        isResumo
          ? "bg-gradient-to-r from-amber-950/25 via-[#1A1612] to-[#121110] border-amber-500/30 hover:border-amber-400/60"
          : "bg-gradient-to-r from-[#7C3AED]/15 via-[#161224] to-[#12101A] border-[#7C3AED]/30 hover:border-[#A855F7]/60"
      )}
    >
      {/* Capa Compacta à Esquerda */}
      <div className={cn(
        "w-12 sm:w-14 aspect-[3/4] rounded-lg overflow-hidden border shrink-0 relative shadow-md group-hover:scale-105 transition-transform",
        isResumo ? "border-amber-500/40 bg-black/60" : "border-[#7C3AED]/40 bg-black/60"
      )}>
        <img
          src={livro.capaUrl}
          alt={livro.titulo}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-y-0 left-0 w-0.5 bg-gradient-to-r from-white/30 to-transparent pointer-events-none" />
      </div>

      {/* Informações Minimalistas Centrais */}
      <div className="flex-1 min-w-0 py-0.5">
        {/* Linha 1: Label + Tag Modalidade */}
        <div className="flex items-center gap-2 mb-0.5">
          <span className={cn(
            "text-[9.5px] font-bold uppercase tracking-wider flex items-center gap-1",
            isResumo ? "text-amber-300" : "text-purple-300"
          )}>
            <Play className={cn("w-2.5 h-2.5", isResumo ? "fill-amber-400 text-amber-400" : "fill-purple-400 text-purple-400")} />
            Continuar
          </span>
          <span className={cn(
            "text-[8.5px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border tracking-wider",
            isResumo
              ? "bg-amber-400/20 text-amber-300 border-amber-400/40"
              : "bg-[#7C3AED]/25 text-[#D8B4FE] border-[#7C3AED]/40"
          )}>
            {isResumo ? "Resumo" : "Audiobook"}
          </span>
        </div>

        {/* Linha 2: Título da Obra (sem negrito excessivo, traços finos) */}
        <h4 className="font-sans font-normal text-sm sm:text-base text-white truncate leading-snug">
          {livro.titulo}
        </h4>

        {/* Linha 3: Capítulo e Percentual */}
        <p className="text-[11px] text-white/50 truncate mt-0.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
          <span className="text-white/70">Cap. {capNumero} de {totalCapitulos}</span>
          <span className="text-white/30">•</span>
          <span className={cn("font-mono font-bold", isResumo ? "text-amber-300" : "text-[#C084FC]")}>
            {progressoPct}%
          </span>
        </p>

        {/* Linha 4: Barra de Progresso Fina e Minimalista (h-1) */}
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1.5">
          <div
            style={{ width: `${progressoPct}%` }}
            className={cn(
              "h-full rounded-full transition-all duration-300",
              isResumo
                ? "bg-gradient-to-r from-amber-500 to-amber-300 shadow-[0_0_6px_rgba(245,158,11,0.5)]"
                : "bg-gradient-to-r from-[#7C3AED] to-[#C084FC] shadow-[0_0_6px_rgba(124,58,237,0.5)]"
            )}
          />
        </div>
      </div>

      {/* Botão Play Circular Minimalista à Direita */}
      <div className={cn(
        "w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 active:scale-95 shadow-md",
        isResumo
          ? "bg-amber-400 text-zinc-950 shadow-amber-500/25"
          : "bg-[#7C3AED] text-white shadow-[#7C3AED]/35"
      )}>
        <Play className={cn("w-4 h-4 ml-0.5", isResumo ? "fill-zinc-950" : "fill-white")} />
      </div>
    </motion.button>
  );
};

export default memo(AudiobooksContinuarOuvindoCard);
