import React from 'react';
import { motion } from 'framer-motion';
import {
  Music,
  Scale,
  FileText,
  Search,
  X,
  ListMusic,
  Heart,
  ThumbsUp,
  ArrowUpDown,
  Flame,
  Pause,
  Play,
  Headphones,
  Check,
  ListPlus,
} from 'lucide-react';
import { LeiCantada, ResumoCantado, resumoParaFaixa } from '@/lib/leisCantadasApi';
import { CAPA_PENAL, fmtN, normalizar, numArtigo } from './leisCantadasUtils';

interface LeisCantadasListaViewProps {
  tipo: 'todos' | 'leis' | 'resumos';
  setTipo: (t: 'todos' | 'leis' | 'resumos') => void;
  faixas: LeiCantada[];
  resumos: ResumoCantado[];
  busca: string;
  setBusca: (b: string) => void;
  buscaRef?: React.RefObject<HTMLInputElement>;
  soFavoritos: boolean;
  soCurtidas: boolean;
  soPlaylist: boolean;
  limparFiltros: () => void;
  ordenar: 'ordem' | 'ouvidas' | 'curtidas';
  setOrdenar: (o: 'ordem' | 'ouvidas' | 'curtidas') => void;
  setSoFavoritos: React.Dispatch<React.SetStateAction<boolean>>;
  setSoCurtidas: React.Dispatch<React.SetStateAction<boolean>>;
  setSoPlaylist: React.Dispatch<React.SetStateAction<boolean>>;
  porLei: [string, LeiCantada[]][];
  favoritos: Set<string>;
  curtidas: Set<string>;
  playlist: Set<string>;
  atualId: string | null;
  tocando: boolean;
  abrirFaixa: (f: LeiCantada) => void;
  alternarPlaylist: (id: string) => void;
  alternarFavorito: (id: string) => void;
  plays: (id: string) => number;
  likes: (id: string) => number;
}

export function LeisCantadasListaView({
  tipo,
  setTipo,
  faixas,
  resumos,
  busca,
  setBusca,
  buscaRef,
  soFavoritos,
  soCurtidas,
  soPlaylist,
  limparFiltros,
  ordenar,
  setOrdenar,
  setSoFavoritos,
  setSoCurtidas,
  setSoPlaylist,
  porLei,
  favoritos,
  curtidas,
  playlist,
  atualId,
  tocando,
  abrirFaixa,
  alternarPlaylist,
  alternarFavorito,
  plays,
  likes,
}: LeisCantadasListaViewProps) {
  return (
    <div className="px-4 space-y-6 mt-2">
      {/* Seletor de tipo: Todos / Leis / Resumos */}
      <div className="grid grid-cols-3 gap-1 rounded-full bg-white/5 p-1 text-xs font-semibold">
        {[
          { id: 'todos' as const, label: 'Todos', Icon: Music },
          {
            id: 'leis' as const,
            label: 'Leis',
            Icon: Scale,
            count: faixas.filter((f) => f.slug !== 'resumo').length,
          },
          { id: 'resumos' as const, label: 'Resumos', Icon: FileText, count: resumos.length },
        ].map((t) => {
          const ativo = tipo === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTipo(t.id)}
              className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-full transition ${
                ativo
                  ? 'bg-fuchsia-500/25 text-fuchsia-100 shadow-inner shadow-fuchsia-500/20'
                  : 'text-muted-foreground hover:text-foreground/80'
              }`}
            >
              <t.Icon className="h-3.5 w-3.5" />
              <span>{t.label}</span>
              {typeof t.count === 'number' && (
                <span
                  className={`text-[10px] tabular-nums ${
                    ativo ? 'text-fuchsia-200/90' : 'text-muted-foreground/70'
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Busca / localizar */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={buscaRef}
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar artigo, número ou lei..."
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-fuchsia-400/40"
        />
        {busca && (
          <button
            onClick={() => setBusca('')}
            aria-label="Limpar busca"
            className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filtro de coleção ativo */}
      {(soFavoritos || soCurtidas || soPlaylist) && (
        <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs">
          <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
            {soPlaylist ? (
              <>
                <ListMusic className="h-3.5 w-3.5 text-fuchsia-300" /> Playlist
              </>
            ) : soFavoritos ? (
              <>
                <Heart className="h-3.5 w-3.5 text-rose-300" /> Favoritas
              </>
            ) : (
              <>
                <ThumbsUp className="h-3.5 w-3.5 text-emerald-300" /> Curtidas
              </>
            )}
          </span>
          <button onClick={limparFiltros} className="font-semibold text-muted-foreground hover:text-foreground">
            Limpar
          </button>
        </div>
      )}

      {/* Ordenação + favoritos */}
      <div className="grid grid-cols-4 gap-1.5 rounded-xl bg-white/5 p-1.5 text-[10px] font-semibold">
        {[
          { id: 'ordem' as const, label: 'Ordem', Icon: ArrowUpDown },
          { id: 'ouvidas' as const, label: 'Em alta', Icon: Flame },
          { id: 'curtidas' as const, label: 'Em alta ♥', Icon: ThumbsUp },
        ].map((o) => {
          const ativo = !soFavoritos && !soCurtidas && !soPlaylist && ordenar === o.id;
          return (
            <button
              key={o.id}
              onClick={() => {
                setOrdenar(o.id);
                limparFiltros();
              }}
              className={`flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-lg transition ${
                ativo ? 'bg-white/15 text-foreground' : 'text-muted-foreground hover:text-foreground/80'
              }`}
            >
              <o.Icon className="h-4 w-4" />
              <span>{o.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => {
            setSoCurtidas(false);
            setSoPlaylist(false);
            setSoFavoritos((v) => !v);
          }}
          className={`flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-lg transition ${
            soFavoritos ? 'bg-rose-400/20 text-rose-300' : 'text-muted-foreground hover:text-foreground/80'
          }`}
        >
          <Heart className={`h-4 w-4 ${soFavoritos ? 'fill-rose-300' : ''}`} />
          <span>Favoritos</span>
        </button>
      </div>

      {tipo !== 'resumos' &&
        porLei.map(([slug, arr]) => {
          let lista = [...arr];
          if (soFavoritos) lista = lista.filter((f) => favoritos.has(f.id));
          else if (soCurtidas) lista = lista.filter((f) => curtidas.has(f.id));
          else if (soPlaylist) lista = lista.filter((f) => playlist.has(f.id));
          if (busca.trim()) {
            const q = normalizar(busca);
            lista = lista.filter((f) =>
              normalizar(`${f.titulo ?? ''} ${f.numero_artigo ?? ''} ${f.lei_nome ?? ''}`).includes(q)
            );
          }
          if (ordenar === 'ouvidas') lista.sort((a, b) => plays(b.id) - plays(a.id));
          else if (ordenar === 'curtidas') lista.sort((a, b) => likes(b.id) - likes(a.id));
          else lista.sort((a, b) => numArtigo(a.numero_artigo) - numArtigo(b.numero_artigo));
          return (
            <section key={slug}>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-8 w-8 grid place-items-center rounded-lg text-white bg-fuchsia-600">
                  <Music className="h-4 w-4" />
                </span>
                <h2 className="text-lg font-bold">{arr[0].lei_nome ?? slug}</h2>
                <span className="ml-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  Leis
                </span>
              </div>
              {lista.length === 0 ? (
                <p className="text-sm text-muted-foreground px-2.5 py-6 text-center">
                  {soPlaylist
                    ? 'Sua playlist está vazia. Toque no + de uma faixa para adicionar.'
                    : soCurtidas
                    ? 'Você ainda não curtiu nenhuma faixa aqui.'
                    : soFavoritos
                    ? 'Nenhum favorito ainda. Toque no coração para favoritar.'
                    : busca.trim()
                    ? 'Nada encontrado para sua busca.'
                    : 'Nenhuma faixa disponível.'}
                </p>
              ) : (
                <motion.div
                  className="divide-y divide-white/[0.06]"
                  variants={{
                    hidden: { opacity: 0 },
                    show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
                  }}
                  initial="hidden"
                  animate="show"
                >
                  {lista.map((f) => {
                    const ativo = f.id === atualId;
                    const fav = favoritos.has(f.id);
                    return (
                      <motion.div
                        key={f.id}
                        variants={{
                          hidden: { opacity: 0, y: 15 },
                          show: {
                            opacity: 1,
                            y: 0,
                            transition: { type: 'spring', stiffness: 300, damping: 24 },
                          },
                        }}
                        className={`flex items-center gap-3 px-2.5 py-3 transition first:rounded-t-xl last:rounded-b-xl ${
                          ativo ? 'bg-white/10' : 'hover:bg-white/5'
                        }`}
                      >
                        <motion.button
                          whileHover={{ scale: 1.015 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => abrirFaixa(f)}
                          className="flex items-center gap-3 min-w-0 flex-1 text-left focus-visible:outline-none"
                        >
                          <span className="relative h-11 w-11 shrink-0 rounded-lg overflow-hidden">
                            <img
                              src={CAPA_PENAL}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover transition-transform hover:scale-105"
                            />
                            <span className="absolute inset-0 grid place-items-center bg-black/35 text-white">
                              {ativo && tocando ? (
                                <Pause className="h-5 w-5" />
                              ) : (
                                <Play className="h-5 w-5 ml-0.5" />
                              )}
                            </span>
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-semibold truncate ${ativo ? 'text-fuchsia-300' : ''}`}>
                              {f.titulo || `Art. ${f.numero_artigo}`}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{f.lei_nome}</p>
                          </div>
                        </motion.button>
                        <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground tabular-nums">
                          <span className="inline-flex items-center gap-1" title="Reproduções">
                            <Headphones className="h-3.5 w-3.5" /> {fmtN(plays(f.id))}
                          </span>
                          <span className="inline-flex items-center gap-1" title="Curtidas">
                            <ThumbsUp
                              className={`h-3.5 w-3.5 ${curtidas.has(f.id) ? 'fill-sky-400 text-sky-400' : ''}`}
                            />{' '}
                            {fmtN(likes(f.id))}
                          </span>
                        </div>
                        <button
                          onClick={() => alternarPlaylist(f.id)}
                          aria-label={playlist.has(f.id) ? 'Remover da playlist' : 'Adicionar à playlist'}
                          className="h-8 w-8 grid place-items-center rounded-full hover:bg-white/10 shrink-0"
                        >
                          {playlist.has(f.id) ? (
                            <Check className="h-4 w-4 text-fuchsia-400" />
                          ) : (
                            <ListPlus className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                        <button
                          onClick={() => alternarFavorito(f.id)}
                          aria-label={fav ? 'Remover dos favoritos' : 'Favoritar'}
                          className="h-8 w-8 grid place-items-center rounded-full hover:bg-white/10 shrink-0"
                        >
                          <Heart
                            className={`h-4 w-4 ${
                              fav ? 'fill-rose-400 text-rose-400' : 'text-muted-foreground'
                            }`}
                          />
                        </button>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </section>
          );
        })}

      {/* ───────── Resumos cantados (temas por área) ───────── */}
      {tipo !== 'leis' &&
        (() => {
          let lista = [...resumos].map(resumoParaFaixa);
          if (soFavoritos) lista = lista.filter((f) => favoritos.has(f.id));
          else if (soCurtidas) lista = lista.filter((f) => curtidas.has(f.id));
          else if (soPlaylist) lista = lista.filter((f) => playlist.has(f.id));
          if (busca.trim()) {
            const q = normalizar(busca);
            lista = lista.filter((f) =>
              normalizar(`${f.titulo ?? ''} ${f.numero_artigo ?? ''} ${f.lei_nome ?? ''}`).includes(q)
            );
          }
          if (ordenar === 'ouvidas') lista.sort((a, b) => plays(b.id) - plays(a.id));
          else if (ordenar === 'curtidas') lista.sort((a, b) => likes(b.id) - likes(a.id));
          if (resumos.length === 0) return null;
          return (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-8 w-8 grid place-items-center rounded-lg bg-fuchsia-500/90 text-white">
                  <FileText className="h-4 w-4" />
                </span>
                <h2 className="text-lg font-bold">Resumos</h2>
                <span className="ml-1 rounded-full bg-fuchsia-500/15 text-fuchsia-200 px-2 py-0.5 text-[10px] font-semibold">
                  Temas cantados
                </span>
              </div>
              {lista.length === 0 ? (
                <p className="text-sm text-muted-foreground px-2.5 py-6 text-center">
                  {soPlaylist
                    ? 'Sua playlist está vazia. Toque no + de uma faixa para adicionar.'
                    : soCurtidas
                    ? 'Você ainda não curtiu nenhum resumo.'
                    : soFavoritos
                    ? 'Nenhum favorito ainda. Toque no coração para favoritar.'
                    : busca.trim()
                    ? 'Nada encontrado para sua busca.'
                    : 'Nenhum resumo disponível.'}
                </p>
              ) : (
                <motion.div
                  className="divide-y divide-white/[0.06]"
                  variants={{
                    hidden: { opacity: 0 },
                    show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
                  }}
                  initial="hidden"
                  animate="show"
                >
                  {lista.map((f) => {
                    const ativo = f.id === atualId;
                    const fav = favoritos.has(f.id);
                    return (
                      <motion.div
                        key={f.id}
                        variants={{
                          hidden: { opacity: 0, y: 15 },
                          show: {
                            opacity: 1,
                            y: 0,
                            transition: { type: 'spring', stiffness: 300, damping: 24 },
                          },
                        }}
                        className={`flex items-center gap-3 px-2.5 py-3 transition first:rounded-t-xl last:rounded-b-xl ${
                          ativo ? 'bg-white/10' : 'hover:bg-white/5'
                        }`}
                      >
                        <motion.button
                          whileHover={{ scale: 1.015 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => abrirFaixa(f)}
                          className="flex items-center gap-3 min-w-0 flex-1 text-left focus-visible:outline-none"
                        >
                          <span className="relative h-11 w-11 shrink-0 rounded-lg overflow-hidden bg-fuchsia-900/40">
                            <img
                              src={CAPA_PENAL}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover transition-transform hover:scale-105"
                            />
                            <span className="absolute inset-0 grid place-items-center bg-black/35 text-white">
                              {ativo && tocando ? (
                                <Pause className="h-5 w-5" />
                              ) : (
                                <Play className="h-5 w-5 ml-0.5" />
                              )}
                            </span>
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-semibold truncate ${ativo ? 'text-fuchsia-300' : ''}`}>
                              {f.titulo}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{f.lei_nome}</p>
                          </div>
                        </motion.button>
                        <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground tabular-nums">
                          <span className="inline-flex items-center gap-1" title="Reproduções">
                            <Headphones className="h-3.5 w-3.5" /> {fmtN(plays(f.id))}
                          </span>
                          <span className="inline-flex items-center gap-1" title="Curtidas">
                            <ThumbsUp
                              className={`h-3.5 w-3.5 ${curtidas.has(f.id) ? 'fill-sky-400 text-sky-400' : ''}`}
                            />{' '}
                            {fmtN(likes(f.id))}
                          </span>
                        </div>
                        <button
                          onClick={() => alternarPlaylist(f.id)}
                          aria-label={playlist.has(f.id) ? 'Remover da playlist' : 'Adicionar à playlist'}
                          className="h-8 w-8 grid place-items-center rounded-full hover:bg-white/10 shrink-0"
                        >
                          {playlist.has(f.id) ? (
                            <Check className="h-4 w-4 text-fuchsia-400" />
                          ) : (
                            <ListPlus className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                        <button
                          onClick={() => alternarFavorito(f.id)}
                          aria-label={fav ? 'Remover dos favoritos' : 'Favoritar'}
                          className="h-8 w-8 grid place-items-center rounded-full hover:bg-white/10 shrink-0"
                        >
                          <Heart
                            className={`h-4 w-4 ${
                              fav ? 'fill-rose-400 text-rose-400' : 'text-muted-foreground'
                            }`}
                          />
                        </button>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </section>
          );
        })()}
    </div>
  );
}
