import { Check, Play } from 'lucide-react';
import type { TrilhaItem } from '@/lib/questoesCuratedCovers';

type Props = {
  livro: TrilhaItem;
  onClose: () => void;
};

export default function QuestaoLivroModal({ livro, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#161228] border border-white/15 p-6 shadow-2xl space-y-5 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="relative w-20 h-28 rounded-xl overflow-hidden shrink-0 border-2 border-white/30 shadow-xl">
            <img src={livro.coverImage} alt={livro.titulo} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
          </div>

          <div className="space-y-1.5 min-w-0 flex-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#E11D48]/20 text-[#FB7185] border border-[#E11D48]/40">
              {livro.badgeLabel}
            </span>
            <p className="font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-base sm:text-lg font-bold text-white leading-snug">
              {livro.titulo}
            </p>
            <p className="text-xs text-zinc-400">
              {livro.displayTotal} questões oficiais comentadas
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs font-bold text-emerald-400">
              <Check className="w-4 h-4" />
              <span>{livro.displayConcluidas} resolvidas ({livro.displayPct}%)</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              livro.onClick();
            }}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#E11D48] to-[#BE123C] hover:from-[#BE123C] hover:to-[#9F1239] text-white font-extrabold text-sm uppercase tracking-wider shadow-[0_0_22px_rgba(225,29,72,0.7)] transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Começar Tema</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-xs transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
