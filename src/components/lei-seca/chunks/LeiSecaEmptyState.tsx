import React from "react";

interface LeiSecaEmptyStateProps {
  icon: React.ReactNode;
  titulo: string;
  texto: string;
  acaoLabel?: string;
  onAcao?: () => void;
}

export function LeiSecaEmptyState({
  icon,
  titulo,
  texto,
  acaoLabel,
  onAcao,
}: LeiSecaEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 px-6 py-10 grid place-items-center text-center bg-card/40">
      <div className="h-14 w-14 rounded-full bg-violet-500/10 grid place-items-center mb-3">
        {icon}
      </div>
      <p className="font-bold text-[15px] text-foreground">{titulo}</p>
      <p className="text-[12.5px] text-muted-foreground mt-1 max-w-xs leading-relaxed">{texto}</p>
      {acaoLabel && onAcao && (
        <button
          type="button"
          onClick={onAcao}
          className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-secondary text-foreground hover:bg-secondary/80 active:scale-95 transition-all duration-[80ms]"
        >
          {acaoLabel}
        </button>
      )}
    </div>
  );
}
