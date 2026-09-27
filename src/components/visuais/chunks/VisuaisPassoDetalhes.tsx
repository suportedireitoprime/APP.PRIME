import React from 'react';
import { toast } from 'sonner';
import { BookOpen, ChevronRight, Loader2, Sparkles, Star } from 'lucide-react';
import { iconeDoItem } from '@/lib/visuaisJuridicos/icones';
import type { CatalogoItem } from '@/lib/visuaisJuridicos/catalogo';
import type { VisualCategoria, VisualRecord } from '@/lib/visuaisJuridicos/types';
import type { TemaResumo, SubtemaResumo } from '@/lib/visuaisJuridicos/materias';
import type { ArtigoLei } from '@/data/mockData';
import { CATEGORIA_COR, ITEM_CORES, type Filtro } from './visuaisConstants';
import { VisuaisBarraBusca } from './VisuaisBarraBusca';
import { VisuaisAbasFiltro, EstrelaFavorito } from './VisuaisAbasFiltro';

interface VisuaisPassoDetalhesProps {
  categoria: VisualCategoria;
  filtro: Filtro;
  setFiltro: (f: Filtro) => void;
  buscaArtigo: string;
  setBuscaArtigo: (b: string) => void;
  item: CatalogoItem;
  tema: TemaResumo | null;
  setTema: (t: TemaResumo | null) => void;
  carregandoTemas: boolean;
  temasFiltrados: TemaResumo[];
  carregandoSubtemas: boolean;
  subtemasFiltrados: SubtemaResumo[];
  carregandoArtigos: boolean;
  artigosFiltrados: ArtigoLei[];
  limiteDetalhe: number;
  setLimiteDetalhe: React.Dispatch<React.SetStateAction<number>>;
  gerando: boolean;
  gerandoKey: string | null;
  prontos: Record<string, VisualRecord>;
  favoritos: string[];
  chaveDe: (base: CatalogoItem, sub?: string, kind?: 'artigo' | 'tema') => string;
  gerar: (alvo?: CatalogoItem, sub?: string, kind?: 'artigo' | 'tema', temaPai?: string) => void;
  alternarFavorito: (key: string) => void;
}

export function VisuaisPassoDetalhes({
  categoria,
  filtro,
  setFiltro,
  buscaArtigo,
  setBuscaArtigo,
  item,
  tema,
  setTema,
  carregandoTemas,
  temasFiltrados,
  carregandoSubtemas,
  subtemasFiltrados,
  carregandoArtigos,
  artigosFiltrados,
  limiteDetalhe,
  setLimiteDetalhe,
  gerando,
  gerandoKey,
  prontos,
  favoritos,
  chaveDe,
  gerar,
  alternarFavorito,
}: VisuaisPassoDetalhesProps) {
  return (
    <div className="space-y-2">
      <div className="-mx-1 space-y-3 px-1 pb-3 pt-0.5">
        <VisuaisAbasFiltro valor={filtro} onChange={setFiltro} />
        <VisuaisBarraBusca
          valor={buscaArtigo}
          onChange={setBuscaArtigo}
          placeholder={
            categoria === 'materias'
              ? tema
                ? `Pesquisar subtema de ${tema.tema}...`
                : 'Pesquisar tópico ou princípio...'
              : 'Pesquisar artigo (ex.: 121, homicídio...)'
          }
        />
      </div>

      {categoria === 'materias' && !tema && (
        <>
          {carregandoTemas && (
            <p className="flex items-center gap-2 px-1 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando tópicos…
            </p>
          )}

          <div className="py-8 flex flex-col items-center gap-6 overflow-x-hidden">
            {temasFiltrados.slice(0, limiteDetalhe).map((t, idx) => {
              const chave = chaveDe(item, t.tema, 'tema');
              const pronto = prontos[chave];
              const favorito = favoritos.includes(chave);
              
              // Ziguezague suave (5 posições)
              const offsets = [0, 40, 64, 40, 0, -40, -64, -40];
              const offset = offsets[idx % offsets.length];

              return (
                <div 
                  key={t.tema} 
                  className="relative w-[160px] sm:w-[180px]"
                  style={{ transform: `translateX(${offset}px)` }}
                >
                  <button
                    onClick={() => {
                      if (t.total === 0) {
                        gerar(item, t.tema, 'tema');
                      } else {
                        setTema(t);
                        setBuscaArtigo('');
                        setFiltro('todos');
                      }
                    }}
                    disabled={gerando}
                    className="w-full text-left relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#120524]/90 to-[#3B0764]/70 border border-white/10 p-4 flex flex-col justify-between aspect-[4/3] active:scale-[0.96] transition-all disabled:opacity-70 shadow-[0_8px_20px_rgba(0,0,0,0.4)] hover:border-white/20"
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="p-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/5 shadow-inner">
                        <FolderOpen className="w-7 h-7 text-indigo-300 drop-shadow-[0_2px_4px_rgba(129,140,248,0.4)]" strokeWidth={1.8} />
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {pronto && (
                          <span className="rounded-full bg-primary/20 px-2 py-0.5 font-display text-[9px] font-bold tracking-wider text-primary border border-primary/20 shadow-xs">
                            PRONTO
                          </span>
                        )}
                        {t.total === 0 && !pronto && (
                          <Sparkles className="w-4 h-4 text-white/30" />
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-3 space-y-1 w-full relative z-10">
                      <p className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white text-[14px] leading-[1.15] line-clamp-2 drop-shadow-md">
                        {t.tema}
                      </p>
                      <p className="font-body text-indigo-200/60 text-[11px] font-medium leading-snug">
                        {t.total} {t.total === 1 ? 'subtema' : 'subtemas'}
                      </p>
                    </div>

                    {/* Efeito de brilho no fundo */}
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-indigo-500/20 blur-2xl rounded-full pointer-events-none" />

                    {gerandoKey === chave && (
                      <div className="absolute inset-0 bg-[#0D0D0D]/80 backdrop-blur-sm flex items-center justify-center z-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                      </div>
                    )}
                  </button>

                  <div className="absolute -top-3 -right-3 z-30">
                    <EstrelaFavorito ativo={favorito} onToggle={() => alternarFavorito(chave)} />
                  </div>
                </div>
              );
            })}
          </div>

          {!carregandoTemas && !temasFiltrados.length && (
            <p className="py-8 text-center font-body text-sm text-muted-foreground">
              {filtro === 'favoritos'
                ? 'Nenhum tópico favoritado ainda.'
                : filtro === 'recentes'
                  ? 'Nenhum tópico aberto recentemente.'
                  : 'Nenhum tópico encontrado.'}
            </p>
          )}

          {temasFiltrados.length > limiteDetalhe && (
            <div className="pt-2 pb-6">
              <button
                onClick={() => setLimiteDetalhe((l) => l + 30)}
                className="w-full py-3.5 rounded-xl bg-secondary/50 font-display text-sm font-bold text-primary active:scale-95 transition-transform"
              >
                Mostrar mais tópicos...
              </button>
            </div>
          )}
        </>
      )}

      {categoria === 'materias' && tema && (
        <>
          {carregandoSubtemas && (
            <p className="flex items-center gap-2 px-1 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando subtemas…
            </p>
          )}

          {subtemasFiltrados.slice(0, limiteDetalhe).map((s, idx) => {
            const chave = chaveDe(item, `${tema.tema} ${s.subtema}`, 'tema');
            const pronto = prontos[chave];
            const carregandoEste = gerandoKey === chave;
            const cor = ITEM_CORES[idx % ITEM_CORES.length];
            const favorito = favoritos.includes(chave);
            const Icon = iconeDoItem(`materia:${s.subtema}`, s.subtema);
            return (
              <div key={s.subtema} className="relative">
                <button
                  onClick={() => {
                    toast.info(`Clicou em: ${s.subtema}`);
                    gerar(item, s.subtema, 'tema', tema.tema);
                  }}
                  disabled={gerando}
                  className="w-full flex items-center gap-4 px-4 h-[84px] rounded-2xl bg-secondary/40 border border-border/50 active:scale-[0.99] transition disabled:opacity-70"
                >
                  <div className="relative overflow-hidden rounded-xl shrink-0">
                    <Icon
                      className="w-8 h-8 relative"
                      style={{ color: cor, filter: 'saturate(1.5) brightness(1.2) drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}
                      strokeWidth={1.3}
                    />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-['Plus_Jakarta_Sans',sans-serif] text-foreground text-[16px] font-bold leading-tight line-clamp-1 uppercase tracking-tight">
                      {s.subtema}
                    </p>
                    <p className="font-body text-muted-foreground text-[12.5px] leading-snug mt-1 line-clamp-1">
                      {tema.tema}
                    </p>
                    {favorito && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-1.5 py-0.5 font-display text-[9.5px] font-bold uppercase tracking-wider text-amber-500">
                        <Star className="h-2.5 w-2.5 fill-amber-500" /> Favorito
                      </span>
                    )}
                  </div>
                  <span className="mr-7 shrink-0">
                    {carregandoEste ? (
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    ) : pronto ? (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 font-display text-[10px] font-bold tracking-wider text-primary">PRONTO</span>
                    ) : (
                      <Sparkles className="w-5 h-5 text-muted-foreground" />
                    )}
                  </span>
                </button>
                <EstrelaFavorito ativo={favorito} onToggle={() => alternarFavorito(chave)} />
              </div>
            );
          })}

          {!carregandoSubtemas && !subtemasFiltrados.length && filtro === 'todos' && (() => {
            const chave = chaveDe(item, tema.tema, 'tema');
            const pronto = prontos[chave];
            const carregandoEste = gerandoKey === chave;
            const favorito = favoritos.includes(chave);
            const Icon = iconeDoItem(`materia:${tema.tema}`, tema.tema);
            return (
              <div className="relative">
                <button
                  onClick={() => gerar(item, tema.tema, 'tema')}
                  disabled={gerando}
                  className="w-full flex items-center gap-4 px-4 h-[84px] rounded-2xl bg-secondary/40 border border-border/50 active:scale-[0.99] transition disabled:opacity-70"
                >
                  <div className="relative overflow-hidden rounded-xl shrink-0">
                    <Icon
                      className="w-8 h-8 relative"
                      style={{ color: CATEGORIA_COR.materias, filter: 'saturate(1.5) brightness(1.2) drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}
                      strokeWidth={1.3}
                    />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-['Plus_Jakarta_Sans',sans-serif] text-foreground text-[16px] font-bold leading-tight line-clamp-1 uppercase tracking-tight">
                      {tema.tema}
                    </p>
                    <p className="font-body text-muted-foreground text-[12.5px] leading-snug mt-1 line-clamp-1">
                      Este tópico não tem subtemas — gerar direto
                    </p>
                  </div>
                  <span className="mr-7 shrink-0">
                    {carregandoEste ? (
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    ) : pronto ? (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 font-display text-[10px] font-bold tracking-wider text-primary">PRONTO</span>
                    ) : (
                      <Sparkles className="w-5 h-5 text-muted-foreground" />
                    )}
                  </span>
                </button>
                <EstrelaFavorito ativo={favorito} onToggle={() => alternarFavorito(chave)} />
              </div>
            );
          })()}

          {!carregandoSubtemas && !subtemasFiltrados.length && filtro !== 'todos' && (
            <p className="py-8 text-center font-body text-sm text-muted-foreground">
              {filtro === 'favoritos' ? 'Nenhum subtema favoritado ainda.' : 'Nenhum subtema aberto recentemente.'}
            </p>
          )}

          {subtemasFiltrados.length > limiteDetalhe && (
            <div className="pt-2 pb-6">
              <button
                onClick={() => setLimiteDetalhe((l) => l + 30)}
                className="w-full py-3.5 rounded-xl bg-secondary/50 font-display text-sm font-bold text-primary active:scale-95 transition-transform"
              >
                Mostrar mais subtemas...
              </button>
            </div>
          )}
        </>
      )}

      {(categoria === 'leis' || categoria === 'codigos' || categoria === 'estatutos') && (
        <>
          {carregandoArtigos && (
            <p className="flex items-center gap-2 px-1 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando artigos…
            </p>
          )}

          {artigosFiltrados.slice(0, limiteDetalhe).map((a, idx) => {
            const chave = chaveDe(item, a.numero);
            const pronto = prontos[chave];
            const carregandoEste = gerandoKey === chave;
            const cor = ITEM_CORES[idx % ITEM_CORES.length];
            const favorito = favoritos.includes(chave);
            return (
              <div key={a.id || a.numero} className="relative">
                <button
                  onClick={() => gerar(item, a.numero)}
                  disabled={gerando}
                  className="w-full flex items-center gap-4 px-4 h-[84px] rounded-2xl bg-secondary/40 border border-border/50 active:scale-[0.99] transition disabled:opacity-70"
                >
                  <div className="relative overflow-hidden rounded-xl shrink-0">
                    <BookOpen
                      className="w-8 h-8 relative"
                      style={{ color: cor, filter: 'saturate(1.5) brightness(1.2) drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}
                      strokeWidth={1.3}
                    />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-['Plus_Jakarta_Sans',sans-serif] text-foreground text-[16px] font-bold leading-tight line-clamp-1 uppercase tracking-tight">
                      Art. {a.numero}
                    </p>
                    <p className="font-body text-muted-foreground text-[12.5px] leading-snug mt-1 line-clamp-1">
                      {a.caput}
                    </p>
                    {favorito && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-1.5 py-0.5 font-display text-[9.5px] font-bold uppercase tracking-wider text-amber-500">
                        <Star className="h-2.5 w-2.5 fill-amber-500" /> Favorito
                      </span>
                    )}
                  </div>
                  <span className="mr-7 shrink-0">
                    {carregandoEste ? (
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    ) : pronto ? (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 font-display text-[10px] font-bold tracking-wider text-primary">PRONTO</span>
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                  </span>
                </button>
                <EstrelaFavorito ativo={favorito} onToggle={() => alternarFavorito(chave)} />
              </div>
            );
          })}

          {!carregandoArtigos && !artigosFiltrados.length && (
            <p className="py-8 text-center font-body text-sm text-muted-foreground">
              {filtro === 'favoritos'
                ? 'Nenhum artigo favoritado ainda.'
                : filtro === 'recentes'
                  ? 'Nenhum artigo aberto recentemente.'
                  : 'Nenhum artigo encontrado.'}
            </p>
          )}

          {artigosFiltrados.length > limiteDetalhe && (
            <div className="pt-2 pb-6">
              <button
                onClick={() => setLimiteDetalhe((l) => l + 50)}
                className="w-full py-3.5 rounded-xl bg-secondary/50 font-display text-sm font-bold text-primary active:scale-95 transition-transform"
              >
                Mostrar mais artigos...
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
