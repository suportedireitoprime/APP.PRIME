import React from "react";
import { ChevronRight } from "lucide-react";
import { getAreaCover } from "@/lib/areasDireitoCovers";
import { getDisciplinaVisualTheme } from "@/lib/disciplinasTheme";
import { haptic } from "@/lib/nativeHaptics";
import { type AreaRow } from "../resumosStyles";

interface ResumosAreaCardProps {
  areaRow: AreaRow;
  index?: number;
  onClick: (area: string) => void;
}

export const ResumosAreaCard: React.FC<ResumosAreaCardProps> = ({
  areaRow,
  index = 0,
  onClick,
}) => {
  const nome = areaRow.area;
  const visualTheme = getDisciplinaVisualTheme(nome);
  const areaCover = getAreaCover(nome);
  const capaUrl = visualTheme?.fundoAssetUrl || areaCover?.cover;

  const nomeExibicao = nome.startsWith("Direito") ? nome : `Direito ${nome}`;
  const numeroIndice = (index + 1).toString().padStart(2, "0");

  return (
    <div
      onClick={() => {
        haptic.selection();
        onClick(nome);
      }}
      className="group rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-md overflow-hidden transition-all duration-200 hover:border-emerald-500/40 hover:bg-zinc-900/90 shadow-md p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] touch-manipulation select-none"
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Capa com Índice da Matéria igual ao modelo de Audioaulas */}
        <div className="relative w-12 sm:w-14 aspect-[3/4] rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-md bg-zinc-950">
          <img
            src={capaUrl}
            alt={nomeExibicao}
            loading={index < 8 ? "eager" : "lazy"}
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
          <span className="absolute bottom-1 right-1 px-1 rounded bg-black/85 text-[8.5px] font-black text-emerald-400 leading-none shadow font-sans">
            {numeroIndice}
          </span>
        </div>

        {/* Informações da Matéria (sem barra de progresso) */}
        <div className="min-w-0 flex-1">
          <h3 className="font-sans font-bold text-[15px] sm:text-base text-zinc-100 group-hover:text-emerald-400 transition-colors tracking-normal leading-snug line-clamp-1">
            {nomeExibicao}
          </h3>

          <p className="text-[11.5px] text-zinc-400 mt-0.5 font-sans">
            {areaRow.total} {areaRow.total === 1 ? "tópico disponível" : "tópicos disponíveis"}
          </p>
        </div>
      </div>

      {/* Seta Chevron de navegação */}
      <div className="shrink-0 text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all pl-2">
        <ChevronRight className="w-5 h-5" />
      </div>
    </div>
  );
};
