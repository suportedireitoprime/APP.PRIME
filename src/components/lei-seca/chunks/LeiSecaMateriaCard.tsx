import { ChevronRight } from "lucide-react";
import { corIcone, type LeiSecaMateria } from "@/lib/leiSecaMaterias";
import { haptic } from "@/lib/nativeHaptics";

interface LeiSecaMateriaCardProps {
  materia: LeiSecaMateria & { disponiveis: number };
  index: number;
  onSelect: (materia: LeiSecaMateria) => void;
  onPrefetch?: () => void;
}

export function LeiSecaMateriaCard({
  materia,
  index,
  onSelect,
  onPrefetch,
}: LeiSecaMateriaCardProps) {
  const IconComponent = materia.icone;

  return (
    <button
      type="button"
      onPointerDown={onPrefetch}
      onMouseEnter={onPrefetch}
      onTouchStart={onPrefetch}
      onFocus={onPrefetch}
      onClick={() => {
        haptic.selection();
        onSelect(materia);
      }}
      style={{ animationDelay: `${Math.min(index, 8) * 24}ms` }}
      className="w-full min-h-[78px] h-auto py-3.5 rounded-2xl bg-card border border-border/60 hover:border-violet-500/40 hover:bg-card/80 hover:shadow-md transition-all duration-[80ms] flex items-center gap-3 px-3.5 text-left group active:scale-[0.985] animate-stagger-in touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div
        className="h-12 w-12 grid place-items-center shrink-0"
        style={{ color: corIcone(materia.cor), filter: "saturate(1.3) brightness(1.1)" }}
      >
        <IconComponent width={30} height={30} strokeWidth={1.9} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-bold text-[15px] leading-tight truncate text-foreground">
          {materia.nome}
        </div>
        <p className="text-[11.5px] text-muted-foreground mt-0.5 line-clamp-1">{materia.descricao}</p>
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-violet-500/80 mt-1">
          {materia.disponiveis} {materia.disponiveis === 1 ? "lei" : "leis"}
        </p>
      </div>

      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all duration-[80ms] shrink-0" />
    </button>
  );
}
