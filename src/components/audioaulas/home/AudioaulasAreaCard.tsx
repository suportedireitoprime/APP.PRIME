import React from "react";
import { ChevronRight } from "lucide-react";
import { getAreaCover } from "@/lib/areasDireitoCovers";
import { getDisciplinaVisualTheme } from "@/lib/disciplinasTheme";
import { capaDaArea } from "@/lib/audioaulasHelper";
import { haptic } from "@/lib/nativeHaptics";

interface AudioaulasAreaCardProps {
  nome: string;
  totalAulas: number;
  concluidas?: number;
  pct?: number;
  index?: number;
  onClick: () => void;
}

export const AudioaulasAreaCard: React.FC<AudioaulasAreaCardProps> = ({
  nome,
  totalAulas,
  concluidas = 0,
  pct = 0,
  index = 0,
  onClick,
}) => {
  // Capa oficial das Aulas Interativas (Resumos Jurídicos)
  const visualTheme = getDisciplinaVisualTheme(nome);
  const areaCover = getAreaCover(nome);
  const capaUrl = visualTheme?.fundoAssetUrl || areaCover?.cover || capaDaArea(nome);

  const nomeExibicao = nome.startsWith("Direito") ? nome : `Direito ${nome}`;
  const pctReal = Math.min(100, Math.max(0, pct));
  const numeroIndice = (index + 1).toString().padStart(2, "0");

  return (
    <div
      onClick={() => {
        haptic.selection();
        onClick();
      }}
      className="group rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-md overflow-hidden transition-all duration-200 hover:border-amber-400/40 hover:bg-zinc-900/90 shadow-md p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] touch-manipulation"
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Capa com Índice da Matéria igual ao modelo minimalista de Pílulas */}
        <div className="relative w-12 sm:w-14 aspect-[3/4] rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-md bg-zinc-950">
          <img
            src={capaUrl}
            alt={nomeExibicao}
            loading={index < 8 ? "eager" : "lazy"}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
          <span className="absolute bottom-1 right-1 px-1 rounded bg-black/85 text-[8.5px] font-black text-amber-300 leading-none shadow font-sans">
            {numeroIndice}
          </span>
        </div>

        {/* Informações da Matéria */}
        <div className="min-w-0 flex-1">
          <h3 className="font-sans font-bold text-[15px] sm:text-base text-zinc-100 group-hover:text-amber-300 transition-colors tracking-normal leading-snug line-clamp-1">
            {nomeExibicao}
          </h3>

          <p className="text-[11.5px] text-zinc-400 mt-0.5 font-sans">
            {totalAulas} {totalAulas === 1 ? "aula em áudio" : "aulas em áudio"}
          </p>

          {/* Barra de Progresso Minimalista da Matéria */}
          <div className="mt-2 w-full max-w-sm">
            <div className="flex items-center justify-between text-[10.5px] text-zinc-400 mb-1 font-sans">
              <span>
                {concluidas > 0 ? `${concluidas} de ${totalAulas} ouvidas` : `Disponível`}
              </span>
              <span className="font-bold text-amber-400">{pctReal}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300"
                style={{ width: `${Math.max(pctReal === 0 ? 0 : 4, pctReal)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Seta Chevron dourada de navegação */}
      <div className="shrink-0 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all pl-2">
        <ChevronRight className="w-5 h-5" />
      </div>
    </div>
  );
};
