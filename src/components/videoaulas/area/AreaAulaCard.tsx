import { motion } from 'framer-motion';
import { CheckCircle2, Play, Star } from 'lucide-react';
import ThumbImg from '@/components/videoaulas/ThumbImg';
import { formatDuracao, limparTitulo, ytThumb } from '@/lib/videoaulasCatalogos';
import { areaIconFor } from '@/lib/areasDireitoIcons';
import type { Aula } from './areaTypes';

interface AreaAulaCardProps {
  aula: Aula;
  index: number;
  nomeArea: string;
  isFavorito: boolean;
  progresso?: { percentual: number; concluida: boolean; tempo_atual?: number | null };
  onClick: () => void;
}

export const AreaAulaCard = ({
  aula,
  index,
  nomeArea,
  isFavorito,
  progresso,
  onClick,
}: AreaAulaCardProps) => {
  const pct = progresso?.concluida ? 100 : Math.min(100, Math.round(progresso?.percentual ?? 0));
  const { color } = areaIconFor(nomeArea);
  // Capa direta e exclusiva do próprio vídeo do YouTube
  const videoThumb = aula.thumb || aula.thumbnail || ytThumb(aula.video_id, 'hq') || ytThumb(aula.video_id, 'mq');

  return (
    <motion.button
      variants={{
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
      }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-white/5 bg-[#252528] hover:bg-[#2F2F33] shadow-sm transition-all overflow-hidden flex gap-3 p-3 active:scale-[0.99] h-auto focus-visible:outline-none group cursor-pointer"
    >
      {/* Capa do próprio vídeo */}
      <div className="relative w-[124px] sm:w-[140px] aspect-video shrink-0 rounded-xl overflow-hidden bg-black/40 self-center shadow-inner">
        <ThumbImg
          src={videoThumb}
          alt={`Capa da aula ${limparTitulo(aula.titulo)}`}
          priority={index < 4}
          fallback={<Play className="h-5 w-5 text-zinc-500" />}
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
        <span className="absolute inset-0 grid place-items-center">
          <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/90 shadow-md group-hover:scale-110 transition-transform">
            {progresso?.concluida ? (
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" fill="currentColor" />
            ) : (
              <Play className="h-4 w-4 fill-white text-white ml-0.5" />
            )}
          </div>
        </span>
      </div>

      {/* Conteúdo com traços finos e barra de progresso */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] sm:text-[10.5px] font-light tracking-wider uppercase text-zinc-400 font-sans">
              Aula {aula.ordem ?? index + 1}
            </span>
            {isFavorito && (
              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
            )}
          </div>

          <h4 className="font-sans text-[13px] sm:text-[14px] font-normal leading-snug text-white/95 group-hover:text-white transition-colors line-clamp-2">
            {limparTitulo(aula.titulo)}
          </h4>
        </div>

        {/* Barra de progresso visível para contabilizar */}
        <div className="mt-2.5">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white/[0.08] h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor: color || '#E3262F',
                }}
              />
            </div>
            <span className="font-sans text-[10.5px] text-zinc-400 font-light leading-none shrink-0">
              {pct}%
            </span>
            {progresso?.tempo_atual && aula.duracao_segundos ? (
              <span className="font-sans text-[10px] text-zinc-500 font-light ml-auto">
                {formatDuracao(progresso.tempo_atual)} / {formatDuracao(aula.duracao_segundos)}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </motion.button>
  );
};
