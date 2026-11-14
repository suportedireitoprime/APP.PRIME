import React, { useMemo, useCallback } from "react";
import { Headphones } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { resetGlobalScroll } from "@/lib/scrollUtils";
import { AudioaulasAreaCard } from "./AudioaulasAreaCard";

export type ModoVisualizacao = "hub" | "areas" | "codigos" | "estatutos";

interface AudioaulasGridAreasProps {
  areas: [string, number][];
  modo?: ModoVisualizacao;
  onModoChange?: (modo: ModoVisualizacao) => void;
}

export const AudioaulasGridAreas = React.memo(function AudioaulasGridAreas({
  areas,
}: AudioaulasGridAreasProps) {
  const navigate = useNavigate();

  const irParaArea = useCallback(
    (nomeArea: string) => {
      resetGlobalScroll();
      navigate(`/audioaulas/${encodeURIComponent(nomeArea)}`);
      requestAnimationFrame(() => resetGlobalScroll());
    },
    [navigate],
  );

  // Ordena as matérias em lista limpa
  const areasOrdenadas = useMemo(() => {
    return [...areas].sort((a, b) => a[0].localeCompare(b[0], "pt-BR"));
  }, [areas]);

  if (areas.length === 0) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 space-y-8 mt-4 lg:px-10 2xl:max-w-[1600px]">
        <div className="rounded-2xl bg-white/4 p-10 text-center border border-white/10">
          <Headphones className="w-10 h-10 text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma audioaula publicada ainda.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl lg:max-w-7xl 2xl:max-w-[1600px] px-4 space-y-4 mt-6 pb-20">
      {/* Título de Seção com Barra Vermelha Padrão */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-foreground text-[17px] sm:text-[18px] font-bold flex items-center gap-2 uppercase tracking-widest">
            <span className="w-1 h-5 rounded-full bg-primary shrink-0" />
            <span className="break-words">Matérias em Áudio</span>
          </h2>
          <p className="font-body text-muted-foreground text-[12px] sm:text-[12.5px] leading-snug ml-3">
            Toque em uma matéria para abrir os módulos e aulas completas.
          </p>
        </div>
      </div>

      {/* Lista vertical minimalista idêntica à de Pílulas */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-3"
      >
        {areasOrdenadas.map(([nome, totalAulas], index) => {
          return (
            <AudioaulasAreaCard
              key={nome}
              nome={nome}
              totalAulas={totalAulas}
              concluidas={0}
              pct={0}
              index={index}
              onClick={() => irParaArea(nome)}
            />
          );
        })}
      </motion.div>
    </div>
  );
});
