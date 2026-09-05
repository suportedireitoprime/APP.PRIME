import React from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Ministro } from './pilulasConstants';

interface PilulasMinistrosListProps {
  loading: boolean;
  ministros: Ministro[];
  onSelect: (item: Ministro) => void;
}

export const PilulasMinistrosList: React.FC<PilulasMinistrosListProps> = ({
  loading,
  ministros,
  onSelect,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p>Carregando ministros...</p>
      </div>
    );
  }

  if (ministros.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10 border border-dashed rounded-xl bg-card">
        Nenhum ministro encontrado.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {ministros.map((item) => {
        const hasAudio = !!item.diversos?.audio_pilula_url;
        return (
          <button
            type="button"
            key={item.id}
            onClick={() => onSelect(item)}
            className={`flex items-center gap-4 rounded-2xl p-4 border shadow-sm text-left active:scale-[0.98] transition-all w-full ${
              hasAudio 
                ? 'bg-success/5 border-success/30 hover:bg-success/10' 
                : 'bg-card border-border hover:border-muted-foreground/30'
            }`}
          >
            <div className="w-12 h-16 rounded-lg bg-muted overflow-hidden shrink-0 shadow-sm border border-border">
              {item.foto_url ? (
                <img src={item.foto_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px] text-center p-1">
                  Sem Foto
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground text-sm sm:text-base leading-snug line-clamp-1">
                {item.nome}
              </h3>
              {item.nome_completo && (
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{item.nome_completo}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                {hasAudio ? (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-success bg-success/10 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Pílula Concluída
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded-full">
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
