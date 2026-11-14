import React, { useEffect, useState, useCallback, memo } from "react";
import { Play, Pause, X, Headphones, ArrowRight } from "lucide-react";
import { useAudioaulasPlayer } from "@/contexts/AudioaulasPlayerContext";
import {
  obterUltimoProgressoAudioaula,
  limparProgressoAudioaula,
  type ProgressoAudioaula,
} from "@/lib/audioaulaProgresso";
import { fmt, decomporTituloCapitulo, capaDaArea } from "@/lib/audioaulasHelper";
import { getDisciplinaVisualTheme } from "@/lib/disciplinasTheme";
import { getAreaCover } from "@/lib/areasDireitoCovers";
import { haptic } from "@/lib/nativeHaptics";
import { motion, AnimatePresence } from "framer-motion";

export const AudioaulasContinuarOuvindo: React.FC = () => {
  const { aulas, atualId, tocando, tocar, togglePlay } = useAudioaulasPlayer();
  const [progresso, setProgresso] = useState<ProgressoAudioaula | null>(() =>
    obterUltimoProgressoAudioaula(),
  );
  const [fechado, setFechado] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<ProgressoAudioaula | null>;
      setProgresso(custom.detail ?? obterUltimoProgressoAudioaula());
    };
    window.addEventListener("audioaula:progresso-mudou", handler);
    return () => window.removeEventListener("audioaula:progresso-mudou", handler);
  }, []);

  const handleRetomar = useCallback(() => {
    if (!progresso) return;
    haptic.impact();
    const aula = aulas.find((a) => a.id === progresso.id);
    if (!aula) return;

    if (atualId === aula.id) {
      togglePlay();
    } else {
      void tocar(aula, undefined, progresso.tempo);
    }
  }, [progresso, aulas, atualId, togglePlay, tocar]);

  const handleDispensar = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.selection();
    setFechado(true);
    limparProgressoAudioaula();
  }, []);

  if (fechado || !progresso || progresso.tempo <= 2) return null;

  const estaTocandoEsta = atualId === progresso.id && tocando;
  const pct =
    progresso.duracao > 0
      ? Math.min(100, Math.round((progresso.tempo / progresso.duracao) * 100))
      : 0;

  const areaNome = progresso.area || "";
  const coverUrl =
    getDisciplinaVisualTheme(areaNome)?.fundoAssetUrl ||
    getAreaCover(areaNome)?.cover ||
    capaDaArea(areaNome);

  const titulo = progresso.titulo || "Aula em áudio";
  const temaLimpo = progresso.tema
    ? decomporTituloCapitulo(progresso.tema).tituloLimpo
    : "";
  const subtitulo = `${areaNome || "Direito"}${temaLimpo ? ` · ${temaLimpo}` : ""} · ${fmt(progresso.tempo)}${
    progresso.duracao > 0 ? ` / ${fmt(progresso.duracao)}` : ""
  }`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className="mx-auto w-full max-w-350 px-4 mb-4 lg:px-10 2xl:max-w-[1600px]"
      >
        <div
          onClick={handleRetomar}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleRetomar();
            }
          }}
          style={{
            background:
              "linear-gradient(to right, rgba(255, 107, 74, 0.22), rgba(255, 107, 74, 0.05))",
            borderColor: "rgba(255, 107, 74, 0.4)",
          }}
          className="w-full flex items-stretch rounded-2xl border text-left active:scale-[0.98] transition-all overflow-hidden relative shadow-lg shadow-black/40 group cursor-pointer min-h-[82px] sm:min-h-[88px]"
        >
          {/* Capa da Aula à esquerda — flush sem margens (design idêntico a Resumos) */}
          <div className="w-[74px] sm:w-[86px] shrink-0 self-stretch relative overflow-hidden bg-black flex flex-col justify-end border-r border-white/10">
            <img
              src={coverUrl}
              alt={titulo}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="eager"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

            {/* Play/Pause pulsante com gradiente da onda salmão */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#ff6b4a] to-[#ffa285] text-white flex items-center justify-center shadow-lg shadow-black/80 border border-white/20 group-hover:scale-110 transition-transform">
                {estaTocandoEsta ? (
                  <Pause className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                )}
              </span>
            </div>

            <span className="relative z-10 w-full bg-gradient-to-r from-[#c74229] to-[#ff6b4a] text-[8px] sm:text-[8.5px] font-black uppercase text-center text-white py-0.5 tracking-wider">
              ÁUDIO
            </span>
          </div>

          {/* Textos informativos centrais e ações */}
          <div className="flex-1 min-w-0 z-10 py-3 pl-3 pr-3.5 sm:py-3.5 sm:pl-3.5 sm:pr-4 flex items-center justify-between gap-2.5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Headphones className="w-2.5 h-2.5 fill-[#ffa285] text-[#ffa285]" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#ffa285]">
                  CONTINUAR OUVINDO
                </p>
              </div>

              <p className="font-serif italic text-[15px] sm:text-[16px] font-semibold tracking-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] leading-snug line-clamp-1">
                {titulo}
              </p>

              <p className="text-[11px] sm:text-[11.5px] font-semibold truncate flex items-center gap-1.5 text-[#ffd4c7]/90 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-[#ff6b4a] shadow-[0_0_8px_rgba(255,107,74,0.8)] shrink-0" />
                <span className="truncate">{subtitulo}</span>
              </p>

              {/* Barra de progresso sutil */}
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#ff6b4a] to-[#ffa285] rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(255,107,74,0.5)]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium text-[#ffa285] shrink-0 font-mono">
                  {pct}%
                </span>
              </div>
            </div>

            {/* Botão fechar (X) e Seta indicativa à direita */}
            <div className="flex items-center gap-1.5 shrink-0 z-10">
              <button
                type="button"
                onClick={handleDispensar}
                aria-label="Dispensar continuar ouvindo"
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 text-[#ffd4c7]/70 hover:text-white flex items-center justify-center transition active:scale-95"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <ArrowRight
                className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 text-[#ffa285] group-hover:text-[#ff6b4a] group-hover:translate-x-1 transition-transform"
                strokeWidth={2.4}
              />
            </div>
          </div>

          {/* Decoração de fundo com glow laranja salmão no canto direito */}
          <div
            className="absolute -right-3 -bottom-3 pointer-events-none select-none z-0 overflow-visible flex items-center justify-center opacity-20"
            style={{
              filter:
                "drop-shadow(0 4px 12px rgba(0,0,0,0.9)) drop-shadow(0 0 10px rgba(255, 107, 74, 0.5))",
            }}
          >
            <Headphones className="w-24 h-24 text-[#ff6b4a]" strokeWidth={1.2} />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default memo(AudioaulasContinuarOuvindo);
