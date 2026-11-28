import React, { memo, useEffect, useRef } from 'react';
import { Search, X, Bookmark, ChevronRight, FileText, Sparkles, BookOpen, Layers } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CATEGORIA_COR, getCorParaItem, formatarTituloMapa } from './mapasConstants';
import { iconeDoItem } from '@/lib/visuaisJuridicos/icones';
import { haptic } from '@/lib/nativeHaptics';
import type { CatalogoItem } from '@/lib/visuaisJuridicos/catalogo';
import type { VisualCategoria, VisualRecord } from '@/lib/visuaisJuridicos/types';
import type { TemaResumo, SubtemaResumo } from '@/lib/visuaisJuridicos/materias';
import type { ArtigoLei } from '@/data/mockData';

interface MapasMentaisDetalhesProps {
  categoria: VisualCategoria;
  item: CatalogoItem;
  busca: string;
  setBusca: (b: string) => void;
  // Para matérias
  tema: TemaResumo | null;
  setTema: (t: TemaResumo | null) => void;
  carregandoTemas: boolean;
  temas: TemaResumo[];
  carregandoSubtemas: boolean;
  subtemas: SubtemaResumo[];
  // Para códigos/leis
  carregandoArtigos: boolean;
  artigos: ArtigoLei[];
  // Estados compartilhados
  prontos: Record<string, VisualRecord>;
  favoritos: string[];
  chaveDe: (base: CatalogoItem, sub?: string, kind?: 'artigo' | 'tema') => string;
  onGerar: (alvo: CatalogoItem, sub?: string, kind?: 'artigo' | 'tema', temaPai?: string) => void;
  onAbrir: (registro: VisualRecord) => void;
  onToggleFavorito: (key: string) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

export const MapasMentaisDetalhes = memo(function MapasMentaisDetalhes({
  categoria,
  item,
  busca,
  setBusca,
  tema,
  setTema,
  carregandoTemas,
  temas,
  carregandoSubtemas,
  subtemas,
  carregandoArtigos,
  artigos,
  prontos,
  favoritos,
  chaveDe,
  onGerar,
  onAbrir,
  onToggleFavorito,
  scrollRef,
}: MapasMentaisDetalhesProps) {
  const isMateria = categoria === 'materias';
  const corCategoria = getCorParaItem(item.key, categoria);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Atalho "/" no desktop para focar o campo de pesquisa
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      e.preventDefault();
      searchInputRef.current?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const rowVirtualizer = useVirtualizer({
    count: artigos.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 100, // Altura aproximada de cada card
    overscan: 10,
  });

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-2">
      {/* Campo de Busca Interno */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          ref={searchInputRef}
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value.slice(0, 60))}
          placeholder={
            isMateria
              ? tema
                ? `Pesquisar subtema de ${tema.tema}...`
                : 'Pesquisar tópico da matéria...'
              : 'Pesquisar artigo (ex: 121, homicídio...)'
          }
          className="h-11 sm:h-12 w-full rounded-xl border border-white/10 bg-zinc-900/90 pl-10 pr-10 font-sans text-xs sm:text-[13px] text-white placeholder:text-zinc-500 outline-none focus:border-purple-500/60 transition-colors"
        />
        {busca && (
          <button
            type="button"
            onClick={() => setBusca('')}
            aria-label="Limpar pesquisa"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* CASO 1: Matéria sem Tópico Selecionado (Lista de Tópicos) */}
      {isMateria && !tema && (
        <div className="space-y-3">
          {carregandoTemas ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
              {[0, 1, 2, 3, 4, 5].map((sk) => (
                <div
                  key={sk}
                  className="h-[68px] rounded-xl bg-zinc-900/70 border border-white/5 animate-pulse p-3.5 flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-white/10 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-3/4 rounded bg-white/10" />
                    <div className="h-2.5 w-1/3 rounded bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : !temas.length ? (
            <div className="py-12 text-center text-xs text-zinc-400 space-y-3">
              <p>Nenhum tópico encontrado{busca.trim() ? ` para "${busca.trim()}"` : ''}.</p>
              {busca.trim() && (
                <button
                  type="button"
                  onClick={() => setBusca('')}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition cursor-pointer"
                >
                  Limpar pesquisa
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
              {temas.map((t) => {
                const chave = chaveDe(item, t.tema, 'tema');
                const pronto = prontos[chave];
                const isFavorito = favoritos.includes(chave);
                const TemaIcon = iconeDoItem(item.key, t.tema);

                return (
                  <div
                    key={t.tema}
                    onClick={() => {
                      haptic.selection();
                      setTema(t);
                    }}
                    className="p-3 sm:p-3.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-850 border border-white/5 hover:border-purple-500/40 flex items-center justify-between gap-3 transition-all cursor-pointer shadow-sm group active:scale-[0.99] min-h-[64px]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ color: '#a855f7' }}>
                        <TemaIcon className="w-8 h-8" strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-sans text-[14px] sm:text-[15px] font-semibold leading-snug text-white group-hover:text-purple-300 transition-colors truncate">
                          {formatarTituloMapa(t.tema)}
                        </p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {t.total} {t.total === 1 ? 'subtema' : 'subtemas'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {pronto && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          PRONTO
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          haptic.light();
                          onToggleFavorito(chave);
                        }}
                        className="p-1 text-zinc-500 hover:text-white"
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isFavorito ? 'fill-purple-400 text-purple-400' : ''}`} strokeWidth={2} />
                      </button>
                      <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CASO 2: Matéria com Tópico Selecionado (Lista de Subtemas) */}
      {isMateria && tema && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-white/5">
            <span className="text-xs text-zinc-400 font-medium">
              Subtemas de <strong className="text-white">{formatarTituloMapa(tema.tema)}</strong> ({subtemas.length})
            </span>
          </div>

          {carregandoSubtemas ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
              {[0, 1, 2, 3].map((sk) => (
                <div
                  key={sk}
                  className="h-[64px] rounded-xl bg-zinc-900/70 border border-white/5 animate-pulse p-3.5 flex items-center gap-3"
                >
                  <div className="w-7 h-7 rounded-full bg-white/10 shrink-0" />
                  <div className="h-3.5 flex-1 rounded bg-white/10" />
                  <div className="w-16 h-7 rounded-lg bg-white/10 shrink-0" />
                </div>
              ))}
            </div>
          ) : !subtemas.length ? (
            <div className="py-12 text-center text-xs text-zinc-400 space-y-3">
              <p>Nenhum subtema encontrado{busca.trim() ? ` para "${busca.trim()}"` : ' para este tópico'}.</p>
              {busca.trim() && (
                <button
                  type="button"
                  onClick={() => setBusca('')}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition cursor-pointer"
                >
                  Limpar pesquisa
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-3">
              {subtemas.map((s, index) => {
                const chave = chaveDe(item, `${tema.tema} ${s.subtema}`, 'tema');
                const pronto = prontos[chave];
                const isFavorito = favoritos.includes(chave);

                return (
                  <div
                    key={s.subtema}
                    className="p-3.5 sm:p-4 rounded-xl bg-zinc-900/90 border border-white/5 hover:border-white/15 flex items-center justify-between gap-3 transition-all min-h-[64px]"
                  >
                    <div 
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 border"
                      style={{ backgroundColor: `${corCategoria}20`, borderColor: `${corCategoria}30` }}
                    >
                      <span className="text-xs font-bold font-mono" style={{ color: corCategoria }}>{index + 1}</span>
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <p className="font-sans text-[14px] sm:text-[15px] font-semibold leading-snug text-white">
                        {formatarTituloMapa(s.subtema)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          haptic.light();
                          onToggleFavorito(chave);
                        }}
                        className="p-2 text-zinc-500 hover:text-white"
                      >
                        <Bookmark className={`w-4 h-4 ${isFavorito ? 'fill-purple-400 text-purple-400' : ''}`} strokeWidth={2} />
                      </button>

                      {pronto ? (
                        <button
                          type="button"
                          onClick={() => {
                            haptic.selection();
                            onAbrir(pronto);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                        >
                          Ver Mapa
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            haptic.selection();
                            onGerar(item, s.subtema, 'tema', tema.tema);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-[#9333ea] hover:bg-[#a855f7] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                        >
                          Gerar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CASO 3: Códigos / Estatutos / Leis (Lista de Artigos) */}
      {!isMateria && (
        <div className="space-y-3">
          {carregandoArtigos ? (
            <div className="space-y-2">
              {[0, 1, 2, 3, 4].map((sk) => (
                <div
                  key={sk}
                  className="h-[78px] rounded-xl bg-zinc-900/70 border border-white/5 animate-pulse p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-1/3 rounded bg-white/10" />
                    <div className="h-3 w-4/5 rounded bg-white/5" />
                  </div>
                  <div className="w-16 h-7 rounded-lg bg-white/10 shrink-0" />
                </div>
              ))}
            </div>
          ) : !artigos.length ? (
            <div className="py-12 text-center text-xs text-zinc-400 space-y-3">
              <p>Nenhum artigo encontrado{busca.trim() ? ` para "${busca.trim()}"` : ''}.</p>
              {busca.trim() && (
                <button
                  type="button"
                  onClick={() => setBusca('')}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition cursor-pointer"
                >
                  Limpar pesquisa
                </button>
              )}
            </div>
          ) : (
            <div 
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const a = artigos[virtualRow.index];
                const chave = chaveDe(item, a.numero, 'artigo');
                const pronto = prontos[chave];
                const isFavorito = favoritos.includes(chave);

                return (
                  <div
                    key={a.numero}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    className="absolute top-0 left-0 w-full"
                    style={{
                      transform: `translateY(${virtualRow.start}px)`,
                      paddingBottom: '8px', // Espaço entre os itens
                    }}
                  >
                    <div className="p-3.5 sm:p-3 sm:p-3.5 rounded-xl bg-zinc-900/90 border border-white/5 hover:border-white/15 flex items-start justify-between gap-3 transition-all h-full">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-sans text-[14px] sm:text-[15px] font-semibold text-white">
                            Art. {a.numero.replace(/^art\.?\s*/i, '')}
                          </span>
                          {a.titulo && (
                            <span className="font-sans text-xs sm:text-[13px] font-medium text-purple-300">
                              · {formatarTituloMapa(a.titulo)}
                            </span>
                          )}
                        </div>
                        {a.caput && (
                          <p className="text-xs text-zinc-400 leading-relaxed mt-1 line-clamp-2">
                            {a.caput}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            haptic.light();
                            onToggleFavorito(chave);
                          }}
                          className="p-1.5 text-zinc-500 hover:text-white"
                        >
                          <Bookmark className={`w-4 h-4 ${isFavorito ? 'fill-purple-400 text-purple-400' : ''}`} strokeWidth={2} />
                        </button>

                        {pronto ? (
                          <button
                            type="button"
                            onClick={() => {
                              haptic.selection();
                              onAbrir(pronto);
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                          >
                            Ver Mapa
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              haptic.selection();
                              onGerar(item, a.numero, 'artigo');
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-[#9333ea] hover:bg-[#a855f7] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                          >
                            Gerar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
