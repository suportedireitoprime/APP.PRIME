import React from 'react';
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
      <div className="sticky top-0 z-10 -mx-1 space-y-4 bg-background px-1 pb-3 pt-0.5">
        <VisuaisAbasFiltro valor={filtro} onChange={setFiltro} />
        <VisuaisBarraBusca
          valor={buscaArtigo}
          onChange={setBuscaArtigo}
          placeholder={
            categoria === 'materias'
              ? tema
                ? 'Pesquisar subtema'
                : 'Pesquisar tópico'
              : 'Pesquisar artigo (ex.: 121)'
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

          {temasFiltrados.slice(0, limiteDetalhe).map((t, idx) => {
            const chave = chaveDe(item, t.tema, 'tema');
            const pronto = prontos[chave];
            const cor = ITEM_CORES[idx % ITEM_CORES.length];
            const favorito = favoritos.includes(chave);
            const Icon = iconeDoItem(`materia:${t.tema}`, t.tema);
            return (
              <div key={t.tema} className="relative">
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
                    <p className="font-display text-foreground text-[16px] font-bold leading-tight line-clamp-1 uppercase tracking-[0.08em]">
                      {t.tema}
                    </p>
                    <p className="font-body text-muted-foreground text-[12.5px] leading-snug mt-1 line-clamp-1">
                      {t.total} {t.total === 1 ? 'subtema' : 'subtemas'}
                    </p>
                    {favorito && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-1.5 py-0.5 font-display text-[9.5px] font-bold uppercase tracking-wider text-amber-500">
                        <Star className="h-2.5 w-2.5 fill-amber-500" /> Favorito
                      </span>
                    )}
                  </div>
                  <span className="mr-7 shrink-0">
                    {gerandoKey === chave ? (
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    ) : pronto ? (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 font-display text-[10px] font-bold tracking-wider text-primary">PRONTO</span>
                    ) : t.total === 0 ? (
                      <Sparkles className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                  </span>
                </button>
                <EstrelaFavorito ativo={favorito} onToggle={() => alternarFavorito(chave)} />
              </div>
            );
          })}

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
                  onClick={() => gerar(item, s.subtema, 'tema', tema.tema)}
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
                    <p className="font-display text-foreground text-[16px] font-bold leading-tight line-clamp-1 uppercase tracking-[0.08em]">
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
                    <p className="font-display text-foreground text-[16px] font-bold leading-tight line-clamp-1 uppercase tracking-[0.08em]">
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

      {categoria === 'leis' && (
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
                    <p className="font-display text-foreground text-[16px] font-bold leading-tight line-clamp-1 uppercase tracking-[0.08em]">
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
