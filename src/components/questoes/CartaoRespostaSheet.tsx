import { X, Check, X as XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/nativeHaptics';
import { PrimeBottomSheet } from '../vademecum/overlays/PrimeBottomSheet';
import { CartaoRespostaGrid } from './CartaoRespostaGrid';

type Props = {
  aberto: boolean;
  onClose: () => void;
  questoesCount: number;
  idxAtual: number;
  respostas: Record<string, { acertou: boolean }>;
  questoesIdMap: string[];
  onSelect: (idx: number) => void;
};

export const CartaoRespostaSheet = ({
  aberto,
  onClose,
  questoesCount,
  idxAtual,
  respostas,
  questoesIdMap,
  onSelect
}: Props) => {
  return (
    <PrimeBottomSheet open={aberto} onClose={onClose} zIndex={50} className="pb-safe-nav">
      <div className="mx-auto flex w-full max-w-3xl flex-col">
              {/* Handle */}
              <div className="flex justify-center py-3">
                <div className="h-1.5 w-12 rounded-full bg-border/60" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 pb-4">
                <h2 className="text-[20px] font-extrabold tracking-tight">Cartão Resposta</h2>
                <button
                  onClick={onClose}
                  className="rounded-full bg-muted/60 p-2 text-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Grid */}
              <div className="max-h-[60vh] overflow-y-auto px-6 pb-8">
                <CartaoRespostaGrid
                  questoesCount={questoesCount}
                  idxAtual={idxAtual}
                  respostas={respostas}
                  questoesIdMap={questoesIdMap}
                  onSelect={(i) => {
                    onSelect(i);
                    onClose();
                  }}
                />
              </div>
      </div>
    </PrimeBottomSheet>
  );
};
