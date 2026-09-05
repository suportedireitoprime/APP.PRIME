import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Loader2, Sparkles, Star } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { iconeDoItem } from '@/lib/visuaisJuridicos/icones';
import type { CatalogoItem } from '@/lib/visuaisJuridicos/catalogo';
import type { VisualCategoria, VisualRecord } from '@/lib/visuaisJuridicos/types';
import { ITEM_CORES, type Filtro } from './visuaisConstants';
import { VisuaisBarraBusca } from './VisuaisBarraBusca';
import { VisuaisAbasFiltro, EstrelaFavorito } from './VisuaisAbasFiltro';

interface VisuaisPassoItensProps {
  filtro: Filtro;
  setFiltro: (f: Filtro) => void;
  busca: string;
  setBusca: (b: string) => void;
  carregando: boolean;
  carregandoMaterias: boolean;
  lista: CatalogoItem[];
  limiteLista: number;
  setLimiteLista: React.Dispatch<React.SetStateAction<number>>;
  gerando: boolean;
  gerandoKey: string | null;
  prontos: Record<string, VisualRecord>;
  categoria: VisualCategoria;
  favoritos: string[];
  onEscolherItem: (item: CatalogoItem) => void;
  alternarFavorito: (key: string) => void;
}

export function VisuaisPassoItens({
  filtro,
  setFiltro,
  busca,
  setBusca,
  carregando,
  carregandoMaterias,
  lista,
  limiteLista,
  setLimiteLista,
  gerando,
  gerandoKey,
  prontos,
  categoria,
  favoritos,
  onEscolherItem,
  alternarFavorito,
}: VisuaisPassoItensProps) {
  return (
    <div className="space-y-2">
      <div className="sticky top-0 z-10 -mx-1 space-y-4 bg-background px-1 pb-3 pt-0.5">
        <VisuaisAbasFiltro valor={filtro} onChange={setFiltro} />
        <VisuaisBarraBusca valor={busca} onChange={setBusca} placeholder="Pesquisar nesta área" />
      </div>

      {(carregando || carregandoMaterias) && (
        <p className="flex items-center gap-2 px-1 py-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />{' '}
          {carregandoMaterias ? 'Carregando matérias…' : 'Verificando o que já está pronto…'}
        </p>
      )}

      {lista.slice(0, limiteLista).map((i, idx) => {
        const Icon = iconeDoItem(i.key, i.label, i.sub);
        const cor = ITEM_CORES[idx % ITEM_CORES.length];
        const favorito = favoritos.includes(i.key);
        return (
          <motion.div
            key={i.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx * 0.02, 0.2), duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
            className="relative"
          >
            <button
              disabled={gerando}
              onClick={() => {
                haptic.selection();
                onEscolherItem(i);
              }}
              className="w-full flex items-center gap-4 px-4 h-[84px] rounded-2xl bg-secondary/40 border border-border/50 active:scale-[0.99] transition"
            >
              <div className="relative overflow-hidden rounded-xl shrink-0">
                <Icon
                  className="w-8 h-8 relative"
                  style={{
                    color: cor,
                    filter: 'saturate(1.5) brightness(1.2) drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
                  }}
                  strokeWidth={1.3}
                />
                <span aria-hidden className="pointer-events-none absolute inset-0 icon-shine" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="font-display text-foreground text-[16px] font-bold leading-tight line-clamp-1 uppercase tracking-[0.08em]">
                  {i.label}
                </p>
                {i.sub && (
                  <p className="font-body text-muted-foreground text-[12.5px] leading-snug mt-1 line-clamp-1">
                    {i.sub}
                  </p>
                )}
                {favorito && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-1.5 py-0.5 font-display text-[9.5px] font-bold uppercase tracking-wider text-amber-500">
                    <Star className="h-2.5 w-2.5 fill-amber-500" /> Favorito
                  </span>
                )}
              </div>

              <span className="mr-7 shrink-0">
                {gerandoKey === i.key ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                ) : prontos[i.key] ? (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 font-display text-[10px] font-bold tracking-wider text-primary">
                    PRONTO
                  </span>
                ) : categoria === 'jurisprudencia' ? (
                  <Sparkles className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </span>
            </button>
            <EstrelaFavorito ativo={favorito} onToggle={() => alternarFavorito(i.key)} />
          </motion.div>
        );
      })}

      {!lista.length && !carregando && !carregandoMaterias && (
        <p className="py-8 text-center font-body text-sm text-muted-foreground">
          {filtro === 'favoritos'
            ? 'Nenhum favorito por aqui ainda.'
            : filtro === 'recentes'
              ? 'Você ainda não abriu nenhum visual nesta área.'
              : 'Nenhum tema encontrado.'}
        </p>
      )}

      {lista.length > limiteLista && (
        <div className="pt-2 pb-6">
          <button
            onClick={() => setLimiteLista((l) => l + 30)}
            className="w-full py-3.5 rounded-xl bg-secondary/50 font-display text-sm font-bold text-primary active:scale-95 transition-transform"
          >
            Mostrar mais opções...
          </button>
        </div>
      )}
    </div>
  );
}
