import React from 'react';
import { Heart, Sparkles, Folder } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import type { CatalogoItem } from '@/lib/visuaisJuridicos/catalogo';
import type { VisualRecord } from '@/lib/visuaisJuridicos/types';
import { iconeDoItem } from '@/lib/visuaisJuridicos/icones';
import { ITEM_CORES, limparNomeCard } from './mapasConstants';

interface MapasMentaisGridProps {
  itens: CatalogoItem[];
  limite: number;
  onCarregarMais: () => void;
  prontos: Record<string, VisualRecord>;
  favoritos: string[];
  onToggleFavorito: (key: string) => void;
  onSelect: (item: CatalogoItem) => void;
  carregando?: boolean;
}

export function MapasMentaisGrid({
  itens,
  limite,
  onCarregarMais,
  prontos,
  favoritos,
  onToggleFavorito,
  onSelect,
  carregando = false,
}: MapasMentaisGridProps) {
  if (carregando) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        <p className="text-xs sm:text-sm text-zinc-400 font-medium">Carregando catálogo...</p>
      </div>
    );
  }

  if (!itens.length) {
    return (
      <div className="py-16 text-center space-y-2 px-4">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto text-zinc-400">
          <Folder className="w-6 h-6" />
        </div>
        <p className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white text-base">
          Nenhum item encontrado
        </p>
        <p className="text-xs text-zinc-400 max-w-sm mx-auto">
          Tente alterar o termo de busca ou navegar por outras categorias acima.
        </p>
      </div>
    );
  }

  const visiveis = itens.slice(0, limite);
  const temMais = itens.length > limite;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5">
        {visiveis.map((item, idx) => {
          const Icon = iconeDoItem(item.key, item.label, item.sub);
          const cor = ITEM_CORES[idx % ITEM_CORES.length];
          const isFavorito = favoritos.includes(item.key);
          const isPronto = Boolean(prontos[item.key]);

          return (
            <div
              key={item.key}
              onClick={() => {
                haptic.selection();
                onSelect(item);
              }}
              className="relative group bg-zinc-900/90 hover:bg-zinc-800/90 border border-white/5 hover:border-purple-500/40 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between min-h-[110px] sm:min-h-[120px] transition-all cursor-pointer shadow-sm active:scale-[0.98]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="shrink-0 flex items-center justify-center pt-0.5">
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 transition-transform group-hover:scale-110" style={{ color: cor }} strokeWidth={2} />
                </div>

                <div className="flex items-center gap-1.5">
                  {isPronto && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      PRONTO
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      haptic.light();
                      onToggleFavorito(item.key);
                    }}
                    aria-label={isFavorito ? 'Remover dos favoritos' : 'Favoritar'}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <Heart
                      className={`w-4 h-4 transition-transform ${
                        isFavorito ? 'fill-rose-500 text-rose-500 scale-110' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Informações do Item */}
              <div className="mt-2 min-w-0">
                <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-xs sm:text-[13px] font-bold text-white leading-tight line-clamp-2 group-hover:text-purple-300 transition-colors">
                  {limparNomeCard(item.label)}
                </h3>
                {item.sub && (
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                    {item.sub}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {temMais && (
        <div className="pt-2 pb-6 text-center">
          <button
            type="button"
            onClick={onCarregarMais}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-white/10 text-xs sm:text-sm font-bold text-white transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            Carregar mais itens ({itens.length - limite} restantes)...
          </button>
        </div>
      )}
    </div>
  );
}
