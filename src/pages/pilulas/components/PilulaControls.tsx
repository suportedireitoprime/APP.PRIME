import { motion } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import type { LivroNormalizado } from '@/lib/bibliotecaColecoes';
import { haptic } from '@/lib/nativeHaptics';
import { formatTime } from '../utils/formatTime';

interface PilulaControlsProps {
  livro: LivroNormalizado;
  isThisPlaying: boolean;
  progress: number;
  unifiedDuration: number;
  handleSeek: (time: number) => void;
  onTogglePlay: () => void;
}

export function PilulaControls({ 
  livro, 
  isThisPlaying, 
  progress, 
  unifiedDuration, 
  handleSeek, 
  onTogglePlay 
}: PilulaControlsProps) {

  return (
    <>
      {/* Soundwave Animation */}
      <div className="flex items-center justify-center gap-1 h-12 mb-8 relative z-10" aria-hidden="true">
        {[
          { anim: ["20%", "80%", "40%", "90%", "20%"], paused: "20%" },
          { anim: ["40%", "100%", "30%", "70%", "40%"], paused: "40%" },
          { anim: ["60%", "30%", "100%", "50%", "60%"], paused: "60%" },
          { anim: ["30%", "90%", "20%", "100%", "30%"], paused: "30%" },
          { anim: ["80%", "20%", "90%", "40%", "80%"], paused: "80%" },
          { anim: ["40%", "100%", "30%", "70%", "40%"], paused: "40%" },
          { anim: ["100%", "40%", "80%", "30%", "100%"], paused: "100%" },
          { anim: ["20%", "80%", "40%", "90%", "20%"], paused: "20%" },
          { anim: ["60%", "30%", "100%", "50%", "60%"], paused: "60%" },
          { anim: ["30%", "90%", "20%", "100%", "30%"], paused: "30%" },
          { anim: ["50%", "20%", "80%", "30%", "50%"], paused: "50%" },
        ].map((wave, i) => (
          <motion.div
            key={i}
            className="w-1.5 bg-primary rounded-full"
            animate={{ height: isThisPlaying ? wave.anim : wave.paused }}
            transition={{
              duration: isThisPlaying ? 0.5 + (i % 3) * 0.1 : 0.3,
              repeat: isThisPlaying ? Infinity : 0,
              repeatType: "mirror",
              ease: "easeInOut",
              delay: isThisPlaying ? i * 0.05 : 0,
            }}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-4 mb-10 w-full relative z-10">
        <span className="text-[11px] font-medium text-white/50 w-10 text-right">
          {formatTime(progress)}
        </span>
        <div
          role="slider"
          aria-label="Controle de progresso do áudio"
          aria-valuemin={0}
          aria-valuemax={Math.round(unifiedDuration || 1)}
          aria-valuenow={Math.round(progress)}
          tabIndex={0}
          className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden relative cursor-pointer group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            handleSeek(percent * unifiedDuration);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') {
              e.preventDefault();
              handleSeek(progress + 5);
            } else if (e.key === 'ArrowLeft') {
              e.preventDefault();
              handleSeek(progress - 5);
            }
          }}
        >
          <div
            className="absolute top-0 left-0 h-full bg-primary transition-all duration-75 ease-linear group-hover:bg-primary/90"
            style={{ width: `${(progress / (unifiedDuration || 1)) * 100}%` }}
          />
        </div>
        <span className="text-[11px] font-medium text-white/50 w-10">
          {formatTime(unifiedDuration)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-8 relative z-10">
        <button
          onClick={() => {
            haptic.selection();
            handleSeek(progress - 15);
          }}
          className="w-12 h-12 min-h-[48px] min-w-[48px] rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors active:scale-95"
          aria-label="Voltar 15 segundos"
        >
          <span className="text-sm font-bold">-15s</span>
        </button>

        <button
          onClick={() => {
            haptic.selection();
            onTogglePlay();
          }}
          disabled={!livro.audioResumoUrl}
          className={`w-20 h-20 flex items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 active:scale-95 shadow-2xl shadow-primary/30 ${
            !livro.audioResumoUrl ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          aria-label={isThisPlaying ? "Pausar áudio" : "Reproduzir áudio"}
        >
          {isThisPlaying ? (
            <Pause className="w-10 h-10 fill-current" />
          ) : (
            <Play className="w-10 h-10 fill-current ml-1.5" />
          )}
        </button>

        <button
          onClick={() => {
            haptic.selection();
            handleSeek(progress + 15);
          }}
          className="w-12 h-12 min-h-[48px] min-w-[48px] rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors active:scale-95"
          aria-label="Avançar 15 segundos"
        >
          <span className="text-sm font-bold">+15s</span>
        </button>
      </div>
    </>
  );
}
