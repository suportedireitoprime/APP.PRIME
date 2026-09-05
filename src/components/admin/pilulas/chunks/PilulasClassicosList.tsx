import React from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { LivroComColecao } from './pilulasConstants';

interface PilulasClassicosListProps {
  loading: boolean;
  livros: LivroComColecao[];
  onSelect: (item: LivroComColecao) => void;
}

export const PilulasClassicosList: React.FC<PilulasClassicosListProps> = ({
  loading,
  livros,
  onSelect,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p>Carregando clássicos...</p>
      </div>
    );
  }

  if (livros.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10 border border-dashed rounded-xl bg-card">
        Nenhum clássico encontrado.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {livros.map((item) => {
        const hasAudio = !!item.livro.audioResumoUrl;
        return (
          <button
            type="button"
            key={item.livro.id}
            onClick={() => onSelect(item)}
            className={`flex items-start gap-4 rounded-2xl p-4 border shadow-sm text-left active:scale-[0.98] transition-all w-full ${
              hasAudio 
                ? 'bg-success/5 border-success/30 hover:bg-success/10' 
                : 'bg-card border-border hover:border-muted-foreground/30'
            }`}
          >
            <div className="w-16 h-24 rounded-lg bg-muted overflow-hidden shrink-0 shadow-sm">
              {item.livro.capa ? (
                <img src={item.livro.capa} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px] text-center leading-tight p-1">
                  Sem Capa
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 py-0.5">
              <h3 className="font-bold text-foreground text-sm sm:text-base leading-snug line-clamp-2 mb-1.5">
                {item.livro.titulo}
              </h3>
              {item.livro.autor && (
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{item.livro.autor}</p>
              )}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {hasAudio ? (
                  <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-success bg-success/10 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Pílula Concluída
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded-full">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Pendente
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
