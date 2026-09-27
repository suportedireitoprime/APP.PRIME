import React from 'react';
import { Folder, FileText, ChevronRight } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import type { VisualRecord } from '@/lib/visuaisJuridicos/types';
import { TIPO_INFO } from '@/lib/visuaisJuridicos/types';

interface MapasMentaisPastasProps {
  prontos: Record<string, VisualRecord>;
  onAbrir: (registro: VisualRecord) => void;
}

export function MapasMentaisPastas({ prontos, onAbrir }: MapasMentaisPastasProps) {
  const listaProntos = Object.values(prontos);

  if (!listaProntos.length) {
    return (
      <div className="py-20 text-center space-y-2 px-4">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto text-zinc-400">
          <Folder className="w-6 h-6" />
        </div>
        <p className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white text-base">
          Nenhuma pasta ou visual gerado ainda
        </p>
        <p className="text-xs text-zinc-400 max-w-sm mx-auto">
          Ao gerar um mapa mental, infográfico ou fluxograma, ele será arquivado automaticamente aqui para consultas instantâneas offline.
        </p>
      </div>
    );
  }

  // Agrupa os visuais por Categoria ou Matéria
  const grupos = listaProntos.reduce((acc, v) => {
    const chave = v.item_label?.split('—')[0]?.trim() || v.categoria.toUpperCase();
    if (!acc[chave]) acc[chave] = [];
    acc[chave].push(v);
    return acc;
  }, {} as Record<string, VisualRecord[]>);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-2">
      {Object.entries(grupos).map(([grupoNome, visuais]) => (
        <div key={grupoNome} className="space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b border-white/5">
            <Folder className="w-4 h-4 text-purple-400" />
            <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-sm font-bold text-white">
              {grupoNome} ({visuais.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {visuais.map((v) => {
              const tipoLabel = TIPO_INFO[v.tipo]?.label ?? 'Visual';

              return (
                <div
                  key={v.id || v.item_key}
                  onClick={() => {
                    haptic.selection();
                    onAbrir(v);
                  }}
                  className="p-3.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/5 hover:border-purple-500/40 flex items-center justify-between gap-3 transition-all cursor-pointer shadow-sm group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-['Plus_Jakarta_Sans',sans-serif] text-xs sm:text-sm font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                        {v.titulo}
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                        {tipoLabel} · {v.item_label}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
