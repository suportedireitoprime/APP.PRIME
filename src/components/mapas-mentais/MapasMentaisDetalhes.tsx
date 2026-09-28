import React from 'react';
import { Search, X, Heart, ChevronRight, FileText, Sparkles, BookOpen, Layers } from 'lucide-react';
import { CATEGORIA_COR, getCorParaItem } from './mapasConstants';
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
}

export function MapasMentaisDetalhes({
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
}: MapasMentaisDetalhesProps) {
  const isMateria = categoria === 'materias';
  const corCategoria = getCorParaItem(item.key, categoria);

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-2">
      {/* Campo de Busca Interno */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
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
            <div className="py-16 text-center text-xs text-zinc-400">
              <div className="w-7 h-7 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto mb-2" />
              Carregando tópicos de {item.label}...
            </div>
          ) : !temas.length ? (
            <div className="py-12 text-center text-xs text-zinc-400">
              Nenhum tópico encontrado.
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
                        <p className="font-['Plus_Jakarta_Sans',sans-serif] text-[13px] font-medium text-white group-hover:text-purple-300 transition-colors truncate">
                          {t.tema}
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
                        <Heart className={`w-3.5 h-3.5 ${isFavorito ? 'fill-rose-500 text-rose-500' : ''}`} />
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
              Subtemas de <strong className="text-white">{tema.tema}</strong> ({subtemas.length})
            </span>
          </div>

          {carregandoSubtemas ? (
            <div className="py-16 text-center text-xs text-zinc-400">
              <div className="w-7 h-7 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto mb-2" />
              Carregando subtemas...
            </div>
          ) : !subtemas.length ? (
            <div className="py-12 text-center text-xs text-zinc-400">
              Nenhum subtema encontrado para este tópico.
            </div>
          ) : (
            <div className="space-y-2">
              {subtemas.map((s, index) => {
                const chave = chaveDe(item, `${tema.tema} ${s.subtema}`, 'tema');
                const pronto = prontos[chave];
                const isFavorito = favoritos.includes(chave);

                return (
                  <div
                    key={s.subtema}
                    className="p-3.5 sm:p-3 sm:p-3.5 rounded-xl bg-zinc-900/90 border border-white/5 hover:border-white/15 flex items-center justify-between gap-3 transition-all min-h-[64px]"
                  >
                    <div 
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 border"
                      style={{ backgroundColor: `${corCategoria}20`, borderColor: `${corCategoria}30` }}
                    >
                      <span className="text-xs font-bold" style={{ color: corCategoria }}>{index + 1}</span>
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <p className="font-['Plus_Jakarta_Sans',sans-serif] text-[13px] font-medium text-white">
                        {s.subtema}
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
                        <Heart className={`w-4 h-4 ${isFavorito ? 'fill-rose-500 text-rose-500' : ''}`} />
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
            <div className="py-16 text-center text-xs text-zinc-400">
              <div className="w-7 h-7 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto mb-2" />
              Carregando artigos de {item.label}...
            </div>
          ) : !artigos.length ? (
            <div className="py-12 text-center text-xs text-zinc-400">
              Nenhum artigo encontrado.
            </div>
          ) : (
            <div className="space-y-2">
              {artigos.map((a) => {
                const chave = chaveDe(item, a.numero, 'artigo');
                const pronto = prontos[chave];
                const isFavorito = favoritos.includes(chave);

                return (
                  <div
                    key={a.numero}
                    className="p-3.5 sm:p-3 sm:p-3.5 rounded-xl bg-zinc-900/90 border border-white/5 hover:border-white/15 flex items-start justify-between gap-3 transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-['Plus_Jakarta_Sans',sans-serif] text-[13px] font-bold text-white">
                          Art. {a.numero.replace(/^art\.?\s*/i, '')}
                        </span>
                        {a.titulo && (
                          <span className="text-xs font-medium text-purple-300">
                            · {a.titulo}
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
                        <Heart className={`w-4 h-4 ${isFavorito ? 'fill-rose-500 text-rose-500' : ''}`} />
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
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
