import { motion } from 'framer-motion';
import { CheckCircle2, Play, Star } from 'lucide-react';
import ThumbImg from '@/components/videoaulas/ThumbImg';
import { formatDuracao, limparTitulo, ytThumb, getCapaDaArea } from '@/lib/videoaulasCatalogos';
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

  return (
    <motion.button
      variants={{
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
      }}
      whileHover={{ scale: 1.015, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-border/40 bg-card shadow-lg hover:border-primary/50 transition-all overflow-hidden flex gap-3 p-2.5 active:scale-[0.98] h-auto focus-visible:outline-none"
    >
      <div className="relative w-[130px] sm:w-[150px] aspect-video shrink-0 rounded-xl overflow-hidden bg-muted self-center shadow-inner">
        <ThumbImg
          src={getCapaDaArea(nomeArea) || aula.thumb || aula.thumbnail || ytThumb(aula.video_id, 'mq')}
          alt={`Capa da aula ${limparTitulo(aula.titulo)}`}
          priority={index < 4}
          fallback={<Play className="h-6 w-6 text-primary/50" />}
        />
        <div className="absolute inset-0 bg-black/5" />
        <span className="absolute inset-0 grid place-items-center">
          <div className="rounded-full bg-white/20 border border-white/30 p-2 shadow-lg">
            {progresso?.concluida ? (
              <CheckCircle2 className="h-6 w-6 text-primary" fill="currentColor" />
            ) : (
              <Play className="h-6 w-6 text-white ml-0.5" fill="currentColor" />
            )}
          </div>
        </span>
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <p className="text-[11px] font-black tracking-wider uppercase text-[#E3262F]">
              Aula {aula.ordem ?? index}
            </p>
            {isFavorito && (
              <Star className="h-3.5 w-3.5 text-yellow-500" fill="currentColor" />
            )}
          </div>

          <p className="text-xs font-medium leading-tight text-foreground">
            {limparTitulo(aula.titulo)}
          </p>
        </div>

        <div className="mt-2">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold mb-1">
            <span className="text-[#E3262F] font-bold">{pct}%</span>
            {progresso?.tempo_atual && aula.duracao_segundos ? (
              <span>{formatDuracao(progresso.tempo_atual)} / {formatDuracao(aula.duracao_segundos)}</span>
            ) : null}
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-[#E3262F] transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </motion.button>
  );
};
