import { Search, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isFavorito, toggleFavorito } from '@/lib/leisFavoritos';
import { UnifiedTab } from './searchUtils';
import { LEIS_CATALOG } from '@/data/leisCatalog';

interface SearchOverlayLeiResultsProps {
  query: string;
  activeTab: UnifiedTab;
  artigoQueryDigits: string;
  temTextoSemNumero: boolean;
  leisPorTexto: typeof LEIS_CATALOG;
  artigoLeis: typeof LEIS_CATALOG;
  favVersion: number;
  emitSelect: (lei: typeof LEIS_CATALOG[number], artigoNumero?: string) => void;
  openArtigoInLei: (lei: typeof LEIS_CATALOG[number]) => void;
}

export const SearchOverlayLeiResults = ({
  query,
  activeTab,
  artigoQueryDigits,
  temTextoSemNumero,
  leisPorTexto,
  artigoLeis,
  favVersion,
  emitSelect,
  openArtigoInLei,
}: SearchOverlayLeiResultsProps) => {
  return (
    <div className="space-y-2 mb-4">
      {!artigoQueryDigits && !temTextoSemNumero && activeTab === 'leis' && (
        <div className="px-4 py-8 space-y-4">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
              <Search className="w-7 h-7 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Pesquise por qualquer lei ou código. Você pode usar siglas (ex: CF, CP, CDC) ou o número da lei (ex: 8078).
            </p>
          </div>
        </div>
      )}
      {temTextoSemNumero && (
        <>
          {leisPorTexto.length > 0 && (
            <p className="text-xs uppercase tracking-wider text-muted-foreground py-2 px-3 font-semibold mt-2">
              Leis encontradas
            </p>
          )}
          {leisPorTexto.map((lei) => {
            const fav = isFavorito(lei.id);
            return (
              <div
                key={lei.id + ':' + favVersion}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border hover:border-primary/40 transition-all"
              >
                <button
                  onClick={() => emitSelect(lei)}
                  className="flex items-center gap-4 flex-1 min-w-0 text-left"
                >
                  <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-red-500">{lei.sigla}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-foreground truncate">{lei.nome}</p>
                    <p className="text-sm text-muted-foreground truncate">{lei.descricao}</p>
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorito({
                      tipo: lei.tipo,
                      leiId: lei.id,
                      nome: lei.nome,
                      descricao: lei.descricao,
                      tabela_nome: lei.tabela_nome,
                    });
                  }}
                  aria-label={fav ? 'Remover dos favoritos' : 'Favoritar lei'}
                  className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-transform ${
                    fav ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <Heart className={`w-6 h-6 ${fav ? 'fill-current' : ''}`} />
                </button>
              </div>
            );
          })}
        </>
      )}
      {artigoQueryDigits && (
        <>
          <p className="text-sm uppercase tracking-wider text-muted-foreground py-2 px-3">
            Artigo {artigoQueryDigits} em… (por relevância)
          </p>
          <AnimatePresence initial={false}>
            {artigoLeis.map((lei, i) => (
              <motion.button
                key={lei.id}
                layout
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02, type: 'spring', stiffness: 260, damping: 22 }}
                onClick={() => openArtigoInLei(lei)}
                className="w-full flex items-center gap-4 p-3.5 rounded-xl bg-card border border-border hover:border-primary/40 transition-all text-left"
              >
                <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-red-500">{lei.sigla}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-foreground truncate">{lei.nome}</p>
                  <p className="text-sm text-muted-foreground truncate">{lei.descricao}</p>
                </div>
                <div className="shrink-0 px-3 py-1.5 rounded-md bg-primary/10 text-primary text-sm font-bold">
                  Art. {artigoQueryDigits}
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};
