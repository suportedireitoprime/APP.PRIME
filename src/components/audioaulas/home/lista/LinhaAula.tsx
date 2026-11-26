import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Crown, Heart, Pause, Play } from 'lucide-react';
import { BotaoDownloadAudio } from '../BotaoDownloadAudio';
import { CapaOtimizada } from '../CapaOtimizada';
import { capaDaArea } from '@/lib/audioaulasHelper';
import { getAreaCover } from '@/lib/areasDireitoCovers';
import { getDisciplinaVisualTheme } from '@/lib/disciplinasTheme';
import { type AulaAudio, audioIdOf } from '@/contexts/AudioaulasPlayerContext';
import { haptic } from '@/lib/nativeHaptics';
import { cn } from '@/lib/utils';
import { formatarTituloAula } from './audioaulasListaUtils';

export interface LinhaAulaProps {
  a: AulaAudio;
  atualId: number | null;
  tocando: boolean;
  favoritos: Set<string>;
  alternarFavorito: (a: AulaAudio) => void;
  handleTocarAula: (a: AulaAudio) => void;
  isLocked?: boolean;
  onOpenGate?: () => void;
  concluida?: boolean;
  pct?: number;
}

export const LinhaAula = React.memo(function LinhaAula({
  a,
  atualId,
  tocando,
  favoritos,
  alternarFavorito,
  handleTocarAula,
  isLocked = false,
  onOpenGate,
  concluida = false,
  pct = 0,
}: LinhaAulaProps) {
  const ativo = a.id === atualId;
  const fav = favoritos.has(audioIdOf(a));

  const handleClick = () => {
    if (isLocked) {
      haptic.impact('medium');
      onOpenGate?.();
      return;
    }
    void handleTocarAula(a);
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
      }}
      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition ${
        ativo
          ? 'bg-primary/15 border border-primary/30 shadow-sm'
          : isLocked
            ? 'hover:bg-amber-500/4'
            : 'hover:bg-white/5'
      }`}
    >
      <motion.button
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleClick}
        disabled={!a.url_audio && !isLocked}
        className="flex items-center gap-3 min-w-0 flex-1 text-left disabled:opacity-50 group focus-visible:outline-none"
      >
        <span className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-zinc-800 shadow-md border border-white/5">
          <CapaOtimizada
            src={
              getDisciplinaVisualTheme(a.area || '')?.fundoAssetUrl ||
              getAreaCover(a.area || '')?.cover ||
              capaDaArea(a.area || '')
            }
            alt=""
            className="transition-transform group-hover:scale-105"
          />
          <span
            className={`absolute inset-0 grid place-items-center transition-opacity ${isLocked ? 'bg-black/60 text-amber-400' : 'bg-black/40 text-white'}`}
          >
            {isLocked ? (
              <Crown className="h-5 w-5 text-amber-400 fill-amber-400/20" />
            ) : ativo && tocando ? (
              <Pause className="h-5 w-5 text-primary fill-primary" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </span>
        </span>
        <div className="min-w-0 flex-1 py-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className={`text-sm sm:text-[14.5px] font-sans! font-normal break-words text-left leading-snug tracking-normal normal-case ${ativo ? 'text-primary' : 'text-foreground'}`}
            >
              {formatarTituloAula(a.titulo)}
            </p>
            {concluida && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 shrink-0">
                <CheckCircle2 className="w-2.5 h-2.5" />
                OUVIDA
              </span>
            )}
            {!concluida && pct > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold tracking-wider text-amber-300 bg-amber-500/15 border border-amber-500/30 shrink-0">
                {pct}%
              </span>
            )}
            {isLocked && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold tracking-wider uppercase text-amber-300 bg-amber-500/20 border border-amber-400/40 shrink-0">
                <Crown className="w-2.5 h-2.5 text-amber-400" />
                PREMIUM
              </span>
            )}
          </div>

          <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden mt-1.5 relative">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                concluida
                  ? 'bg-linear-to-r from-emerald-500 to-teal-400'
                  : pct > 0
                    ? 'bg-linear-to-r from-primary to-amber-400'
                    : 'bg-transparent',
              )}
              style={{ width: `${concluida ? 100 : Math.max(pct > 0 ? 5 : 0, pct)}%` }}
            />
          </div>
        </div>
      </motion.button>

      {!isLocked && <BotaoDownloadAudio aula={a} />}

      <button
        onClick={() => alternarFavorito(a)}
        aria-label={fav ? 'Remover dos favoritos' : 'Favoritar'}
        className="h-8 w-8 grid place-items-center rounded-full hover:bg-white/10 shrink-0 transition active:opacity-70"
      >
        <Heart className={`h-4 w-4 ${fav ? 'fill-rose-400 text-rose-400' : 'text-muted-foreground'}`} />
      </button>
    </motion.div>
  );
});
