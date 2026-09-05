import { memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Mic, MicOff, ChevronRight, X, BookMarked } from 'lucide-react';
import { ESTADOS } from '@/pages/LegislacaoEstadual';
import { bandeiraUF } from '@/data/estadoFlags';
import { LEI_ICON_MAP } from '@/lib/leiIcons';
import { leiPath } from '@/lib/legislacaoSlugs';
import { Cat, AreaCat, CategoriaFormal, normalizeSearch } from './homeSectionsData';

interface HomeCategorySheetProps {
  categoryOpen: Cat | AreaCat | CategoriaFormal | null;
  onClose: () => void;
  categorySearch: string;
  onSearchChange: (text: string) => void;
  voiceSearch: {
    toggle: () => void;
    listening: boolean;
  };
  filteredCategoryItems: any[];
}

const HomeCategorySheet = ({
  categoryOpen,
  onClose,
  categorySearch,
  onSearchChange,
  voiceSearch,
  filteredCategoryItems,
}: HomeCategorySheetProps) => {
  const navigate = useNavigate();

  if (typeof document === 'undefined') return null;

  const CategorySheetIcon = categoryOpen?.icon || BookMarked;

  return createPortal(
    <AnimatePresence>
      {categoryOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[1400] bg-black/85"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
            className="fixed bottom-0 left-0 right-0 z-[1401] flex h-[90dvh] flex-col rounded-t-3xl border-t border-border bg-background pb-[calc(1rem+var(--sai-bottom))]"
          >
            <div className="flex items-center justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-secondary/70 flex items-center justify-center shrink-0">
                  <CategorySheetIcon
                    className="w-6 h-6"
                    style={{ color: categoryOpen.color, filter: 'saturate(1.3) brightness(1.1)' }}
                    strokeWidth={1.2}
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-xl text-foreground font-bold leading-none truncate">
                    {categoryOpen.label}
                  </h3>
                  <p className="text-muted-foreground text-[12px] font-body leading-tight mt-1 truncate">
                    {categoryOpen.sublabel}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="w-9 h-9 rounded-full bg-secondary/60 flex items-center justify-center shrink-0"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>
            <div className="px-4 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex-1 flex items-center gap-2 rounded-2xl border border-border/60 bg-secondary/45 px-3 h-12">
                  <Search className="w-4.5 h-4.5 text-muted-foreground shrink-0" />
                  <input
                    value={categorySearch}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder={
                      categoryOpen && 'leiIds' in categoryOpen
                        ? 'Pesquisar nesta área'
                        : 'Pesquisar nesta categoria'
                    }
                    className="min-w-0 flex-1 bg-transparent font-body text-[14px] text-foreground placeholder:text-muted-foreground outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={voiceSearch.toggle}
                  aria-label={voiceSearch.listening ? 'Parar gravação' : 'Pesquisar por voz'}
                  className={`btn-attention-shine relative overflow-hidden shrink-0 w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-[0.95] transition ${
                    voiceSearch.listening
                      ? 'bg-red-500 text-white animate-pulse shadow-red-500/40'
                      : 'bg-primary text-primary-foreground shadow-primary/30'
                  }`}
                >
                  {voiceSearch.listening ? (
                    <MicOff className="w-6 h-6 relative z-[2]" strokeWidth={2.5} />
                  ) : (
                    <Mic className="w-6 h-6 relative z-[2]" strokeWidth={2.5} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {categoryOpen?.id === 'cat-estadual' ? (
                (() => {
                  const q = normalizeSearch(categorySearch.trim());
                  const estados = [...ESTADOS].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
                  const filtered = q
                    ? estados.filter((e) => normalizeSearch(`${e.nome} ${e.uf} ${e.capital}`).includes(q))
                    : estados;
                  return (
                    <div className="space-y-2">
                      {filtered.map((estado) => (
                        <button
                          key={estado.uf}
                          onClick={() => {
                            onClose();
                            navigate(`/legislacao-estadual/${estado.uf.toLowerCase()}`);
                          }}
                          className="w-full flex items-center gap-4 p-4 min-h-[76px] rounded-2xl bg-secondary/40 border border-border/50 active:scale-[0.99] transition"
                        >
                          <div className="w-12 h-12 shrink-0 rounded-xl bg-secondary/80 border border-border/60 flex items-center justify-center overflow-hidden">
                            <img
                              src={bandeiraUF(estado.uf, 96) || ''}
                              alt={`Bandeira de ${estado.nome}`}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const el = e.currentTarget as HTMLImageElement;
                                el.style.display = 'none';
                                if (el.parentElement) {
                                  el.parentElement.innerHTML = `<span class="font-display text-[15px] font-bold text-foreground tracking-wider">${estado.uf}</span>`;
                                }
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <p className="font-display text-foreground text-[16px] font-bold leading-tight line-clamp-1 uppercase tracking-[0.06em]">
                              {estado.nome}
                            </p>
                            <p className="font-body text-muted-foreground text-[12.5px] leading-snug mt-1 line-clamp-1">
                              {estado.capital} · {estado.regiao}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                        </button>
                      ))}
                      {filtered.length === 0 && (
                        <div className="py-8 text-center font-body text-sm text-muted-foreground">
                          Nenhum estado encontrado.
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="space-y-2">
                  {filteredCategoryItems.map((lei) => {
                    const LawIcon = LEI_ICON_MAP[lei.id] || CategorySheetIcon;
                    return (
                      <button
                        key={lei.id}
                        onClick={() => {
                          onClose();
                          navigate(leiPath(lei));
                        }}
                        className="w-full flex items-center gap-4 p-4 min-h-[84px] rounded-2xl bg-secondary/40 border border-border/50 active:scale-[0.99] transition"
                      >
                        <div className="relative overflow-hidden rounded-xl shrink-0">
                          <LawIcon
                            className="w-8 h-8 relative"
                            style={{
                              color: lei.iconColor || categoryOpen.color,
                            }}
                            strokeWidth={1.3}
                          />
                          <span aria-hidden className="pointer-events-none absolute inset-0 icon-shine" />
                        </div>

                        <div className="flex-1 min-w-0 text-left">
                          <p className="font-display text-foreground text-[16px] font-bold leading-tight line-clamp-1 uppercase tracking-[0.08em]">
                            {lei.nome}
                          </p>
                          <p className="font-body text-muted-foreground text-[12.5px] leading-snug mt-1 line-clamp-2">
                            {lei.descricao}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                      </button>
                    );
                  })}
                  {filteredCategoryItems.length === 0 && (
                    <div className="py-8 text-center font-body text-sm text-muted-foreground">
                      Nenhuma lei encontrada.
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default memo(HomeCategorySheet);
