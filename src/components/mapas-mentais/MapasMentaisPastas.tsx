import React, { useState } from 'react';
import { Folder, FileText, ChevronRight, FolderOpen, ArrowLeft } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import type { VisualRecord } from '@/lib/visuaisJuridicos/types';
import { TIPO_INFO } from '@/lib/visuaisJuridicos/types';

interface MapasMentaisPastasProps {
  prontos: Record<string, VisualRecord>;
  onAbrir: (registro: VisualRecord) => void;
}

export function MapasMentaisPastas({ prontos, onAbrir }: MapasMentaisPastasProps) {
  const [pastaAberta, setPastaAberta] = useState<string | null>(null);

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

  if (pastaAberta && grupos[pastaAberta]) {
    const visuais = grupos[pastaAberta];
    return (
      <div className="space-y-6 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-2">
        <div className="flex items-center gap-3 pb-2 border-b border-white/5">
          <button 
            onClick={() => {
              haptic.selection();
              setPastaAberta(null);
            }}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/15 active:opacity-70 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <FolderOpen className="w-5 h-5 text-red-400" />
          <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-base font-bold text-white">
            {pastaAberta} ({visuais.length})
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
                className="p-3.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/5 hover:border-red-500/40 flex items-center justify-between gap-3 transition-all cursor-pointer shadow-sm group active:opacity-70"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-['Plus_Jakarta_Sans',sans-serif] text-xs sm:text-sm font-bold text-white group-hover:text-red-300 transition-colors truncate">
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
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
        {Object.entries(grupos).map(([grupoNome, visuais]) => {
          const temPdfs = visuais.length > 0;
          return (
            <div
              key={grupoNome}
              onClick={() => {
                haptic.selection();
                setPastaAberta(grupoNome);
              }}
              className="relative group cursor-pointer"
            >
              {/* Cabinho mais claro no topo, acompanhando o gradiente */}
              <div
                className={`w-16 h-3.5 rounded-t-lg -mb-[1px] ml-3 transition-colors ${
                  temPdfs
                    ? 'bg-[#4a0e14] border-t border-x border-red-500/40 group-hover:bg-[#5c1219] group-hover:border-red-400/80'
                    : 'bg-[#260a0d] border-t border-x border-red-900/30 group-hover:bg-[#320d11] group-hover:border-red-700/50'
                }`}
              />

              {/* Corpo da Pasta Vermelha */}
              <div
                className={`p-3.5 sm:p-4 rounded-2xl rounded-tl-none border transition-all flex flex-col justify-between min-h-[125px] h-[125px] active:opacity-70 ${
                  temPdfs
                    ? 'bg-gradient-to-b from-[#4a0e14] via-[#2f090d] to-[#1a0507] border-red-500/40 shadow-lg shadow-black/60 group-hover:border-red-400/80 group-hover:from-[#5c1219]'
                    : 'bg-gradient-to-b from-[#260a0d] to-[#140506] border-red-900/30 group-hover:border-red-700/50 group-hover:from-[#320d11]'
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      temPdfs
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-red-950/40 text-red-400/60 border border-red-900/30'
                    }`}
                  >
                    <Folder className="w-5 h-5 fill-current/20" />
                  </div>

                  {temPdfs ? (
                    <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-[10px] font-bold text-red-300 font-['Plus_Jakarta_Sans',sans-serif]">
                      {visuais.length} arq{visuais.length !== 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-500 font-['Plus_Jakarta_Sans',sans-serif]">
                      Vazia
                    </span>
                  )}
                </div>

                <div className="min-w-0 mt-1">
                  <p className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-xs sm:text-sm text-white line-clamp-2 leading-snug group-hover:text-red-200 transition-colors tracking-normal normal-case">
                    {grupoNome}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
