import React, { useRef } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { ArtigoCP } from './pilulasConstants';

interface PilulasArtigosListProps {
  loading: boolean;
  title: string;
  artigos: ArtigoCP[];
  onSelect: (artigo: ArtigoCP) => void;
}

export const PilulasArtigosList: React.FC<PilulasArtigosListProps> = ({
  loading,
  title,
  artigos,
  onSelect,
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  const virtualizer = useWindowVirtualizer({
    count: artigos.length,
    estimateSize: () => 74,
    scrollMargin: listRef.current?.offsetTop ?? 0,
    overscan: 10,
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p>Carregando {title}...</p>
      </div>
    );
  }

  if (artigos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-white/5 rounded-2xl bg-white/[0.02]">
        <p className="text-zinc-500 mb-2">Nenhum artigo encontrado.</p>
      </div>
    );
  }

  return (
    <div 
      ref={listRef} 
      style={{ 
        height: `${virtualizer.getTotalSize()}px`, 
        width: '100%', 
        position: 'relative' 
      }}
    >
      {virtualizer.getVirtualItems().map((virtualItem) => {
        const artigo = artigos[virtualItem.index];
        const hasAudio = !!artigo.audio_pilula_url;
        return (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={virtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
              paddingBottom: '8px',
            }}
          >
            <button
              type="button"
              onClick={() => onSelect(artigo)}
              className={`flex items-center justify-between rounded-xl p-4 border shadow-sm text-left active:scale-[0.98] transition-all w-full h-full ${
                hasAudio 
                  ? 'bg-success/5 border-success/30 hover:bg-success/10' 
                  : 'bg-card border-border hover:border-muted-foreground/30'
              }`}
            >
              <span className="font-bold text-base">{artigo.numero}</span>
              {hasAudio ? (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-success bg-success/10 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Concluída
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded-full">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Pendente
                </span>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
};
