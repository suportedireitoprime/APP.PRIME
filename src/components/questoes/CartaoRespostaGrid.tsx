import { Check, X as XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/nativeHaptics';

export type CartaoRespostaGridProps = {
  questoesCount: number;
  idxAtual: number;
  respostas: Record<string, { acertou: boolean }>;
  questoesIdMap: string[];
  onSelect: (idx: number) => void;
  className?: string;
};

export const CartaoRespostaGrid = ({
  questoesCount,
  idxAtual,
  respostas,
  questoesIdMap,
  onSelect,
  className
}: CartaoRespostaGridProps) => {
  return (
    <div className={cn("grid grid-cols-5 gap-3 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-5 xl:grid-cols-6", className)}>
      {Array.from({ length: questoesCount }).map((_, i) => {
        const qId = questoesIdMap[i];
        const resp = qId ? respostas[qId] : undefined;
        const isAtual = i === idxAtual;
        
        let bgClass = "bg-muted text-muted-foreground border-transparent";
        if (resp) {
          bgClass = resp.acertou 
            ? "bg-green-500 text-white border-green-600 shadow-green-500/20 shadow-lg" 
            : "bg-red-500 text-white border-red-600 shadow-red-500/20 shadow-lg";
        } else if (isAtual) {
          bgClass = "bg-primary/20 text-primary border-primary shadow-primary/20 shadow-lg";
        }

        return (
          <button
            key={i}
            onClick={() => {
              haptic.light?.();
              onSelect(i);
            }}
            className={cn(
              "relative flex aspect-square w-full items-center justify-center rounded-full border-2 text-[15px] font-bold transition-transform active:scale-90",
              bgClass
            )}
          >
            {resp ? (
              resp.acertou ? <Check className="h-5 w-5" /> : <XIcon className="h-5 w-5" />
            ) : (
              String(i + 1)
            )}
          </button>
        );
      })}
    </div>
  );
};
