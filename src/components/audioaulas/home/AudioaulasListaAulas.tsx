import React, { useState, useMemo, useCallback } from 'react';
import { Play, Pause, Heart, ArrowLeft, BookOpen, ChevronRight, ChevronLeft, Headphones, Layers, Sparkles } from 'lucide-react';
import { BotaoDownloadAudio } from './BotaoDownloadAudio';
import { capaDaArea } from '@/lib/audioaulasHelper';
import { type AulaAudio, audioIdOf } from '@/contexts/AudioaulasPlayerContext';
import { CapaOtimizada } from './CapaOtimizada';
import { motion, AnimatePresence } from 'framer-motion';

interface LinhaAulaProps {
  a: AulaAudio;
  indice?: number;
  atualId: number | null;
  tocando: boolean;
  favoritos: Set<string>;
  alternarFavorito: (a: AulaAudio) => void;
  handleTocarAula: (a: AulaAudio) => void;
}

const LinhaAula = React.memo(function LinhaAula({
  a,
  indice,
  atualId,
  tocando,
  favoritos,
  alternarFavorito,
  handleTocarAula
}: LinhaAulaProps) {
  const ativo = a.id === atualId;
  const fav = favoritos.has(audioIdOf(a));

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
      }}
      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition ${
        ativo ? 'bg-primary/15 border border-primary/30 shadow-sm' : 'hover:bg-white/5'
      }`}
    >
      <motion.button
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => void handleTocarAula(a)}
        disabled={!a.url_audio}
        className="flex items-center gap-3 min-w-0 flex-1 text-left disabled:opacity-50 group focus-visible:outline-none"
      >
        <span className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-zinc-800 shadow-md border border-white/5">
          <CapaOtimizada
            src={capaDaArea(a.area || '')}
            alt=""
            className="transition-transform group-hover:scale-105"
          />
          <span className="absolute inset-0 grid place-items-center bg-black/40 text-white transition-opacity">
            {ativo && tocando ? (
              <Pause className="h-5 w-5 text-primary fill-primary" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </span>
        </span>
        <div className="min-w-0 flex-1 py-1">
          <p className={`text-sm font-semibold break-words text-left ${ativo ? 'text-primary' : 'text-foreground'}`}>
            {typeof indice === 'number' ? `${indice}. ` : ''}
            {a.titulo}
          </p>
          <p className="text-xs text-muted-foreground break-words mt-0.5 text-left line-clamp-1">
            {a.url_audio ? a.tema || a.area : 'Áudio em breve'}
          </p>
        </div>
      </motion.button>

      <BotaoDownloadAudio aula={a} />

      <button
        onClick={() => alternarFavorito(a)}
        aria-label={fav ? 'Remover dos favoritos' : 'Favoritar'}
        className="h-8 w-8 grid place-items-center rounded-full hover:bg-white/10 shrink-0 transition active:opacity-70"
      >
        <Heart className={`h-4 w-4 ${fav ? 'fill-rose-400 text-rose-400' : 'text-muted-foreground'}`} />
      </button>
    </motion.div>
  );
});

interface AudioaulasListaAulasProps {
  areaAtual: string | null;
  aba: string;
  temasDaArea: [string, AulaAudio[]][];
  listaAba: AulaAudio[];
  busca: string;
  atualId: number | null;
  tocando: boolean;
  favoritos: Set<string>;
  alternarFavorito: (a: AulaAudio) => void;
  handleTocarAula: (a: AulaAudio) => void;
}

export const AudioaulasListaAulas = React.memo(function AudioaulasListaAulas({
  areaAtual,
  aba,
  temasDaArea,
  listaAba,
  busca,
  atualId,
  tocando,
  favoritos,
  alternarFavorito,
  handleTocarAula
}: AudioaulasListaAulasProps) {
  const [capituloSelecionado, setCapituloSelecionado] = useState<string | null>(null);

  // Encontrar índice do capítulo selecionado para navegação anterior/próximo
  const capituloIdx = useMemo(() => {
    if (!capituloSelecionado) return -1;
    return temasDaArea.findIndex(([tema]) => tema === capituloSelecionado);
  }, [capituloSelecionado, temasDaArea]);

  const aulasDoCapitulo = useMemo(() => {
    if (capituloIdx < 0) return [];
    return temasDaArea[capituloIdx][1];
  }, [capituloIdx, temasDaArea]);

  const navegarCapitulo = useCallback((dir: -1 | 1) => {
    if (capituloIdx < 0) return;
    const novoIdx = capituloIdx + dir;
    if (novoIdx >= 0 && novoIdx < temasDaArea.length) {
      setCapituloSelecionado(temasDaArea[novoIdx][0]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [capituloIdx, temasDaArea]);

  // Se estiver visualizando a área específica (ex: ECA ou Direito Constitucional)
  if (areaAtual) {
    if (temasDaArea.length === 0) {
      return (
        <div className="mx-auto w-full max-w-[1400px] px-4 space-y-6 mt-4 lg:px-10 2xl:max-w-[1600px]">
          <p className="py-16 text-center text-sm text-muted-foreground bg-white/[0.02] border border-white/[0.05] rounded-2xl">
            Aulas em breve nesta área.
          </p>
        </div>
      );
    }

    return (
      <div className="mx-auto w-full max-w-[1400px] px-4 space-y-6 mt-4 lg:px-10 2xl:max-w-[1600px]">
        <AnimatePresence mode="wait">
          {capituloSelecionado === null ? (
            /* ════════════ VISTA 1: LISTA DE CAPÍTULOS ════════════ */
            <motion.div
              key="vista-capitulos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                    <Layers className="w-4 h-4" />
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-widest">
                    Capítulos & Títulos
                  </h3>
                </div>
                <span className="text-xs text-zinc-400 font-semibold px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                  {temasDaArea.length} capítulo(s)
                </span>
              </div>

              {/* Grid de Capítulos */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {temasDaArea.map(([tema, lista], i) => {
                  const contemAulaTocando = lista.some((a) => a.id === atualId);
                  return (
                    <motion.button
                      key={tema}
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => setCapituloSelecionado(tema)}
                      className={`group relative flex items-center justify-between gap-3 p-4 rounded-2xl text-left border transition-all duration-200 ${
                        contemAulaTocando
                          ? 'bg-primary/15 border-primary/40 shadow-lg shadow-primary/15'
                          : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10 hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <span className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-sm font-bold shadow-md ${
                          contemAulaTocando
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-white/5 text-zinc-300 border border-white/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors'
                        }`}>
                          {i + 1}
                        </span>

                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                            {tema}
                          </h4>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400">
                              <Headphones className="w-3 h-3 text-primary" />
                              {lista.length} aula(s)
                            </span>

                            {contemAulaTocando && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30 animate-pulse">
                                <Sparkles className="w-2.5 h-2.5" /> Tocando agora
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span className="w-8 h-8 shrink-0 rounded-full bg-white/5 group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center text-zinc-400 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            /* ════════════ VISTA 2: ARTIGOS DO CAPÍTULO SELECIONADO ════════════ */
            <motion.div
              key="vista-artigos"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Barra Superior do Capítulo */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => setCapituloSelecionado(null)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 transition active:scale-95"
                    aria-label="Voltar para a lista de capítulos"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar aos Capítulos</span>
                  </button>

                  <span className="text-xs font-bold text-primary px-3 py-1 rounded-full bg-primary/15 border border-primary/30">
                    Capítulo {capituloIdx + 1} de {temasDaArea.length}
                  </span>
                </div>

                <div>
                  <h3 className="text-base sm:text-xl font-black text-white leading-tight">
                    {capituloSelecionado}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                    {aulasDoCapitulo.length} aula(s) disponível(is) neste capítulo
                  </p>
                </div>
              </div>

              {/* Lista de Aulas do Capítulo */}
              <motion.div
                className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-2 sm:p-3 divide-y divide-white/[0.06]"
                variants={{
                  hidden: { opacity: 0 },
                  show: { opacity: 1, transition: { staggerChildren: 0.04 } }
                }}
                initial="hidden"
                animate="show"
              >
                {aulasDoCapitulo.map((a, i) => (
                  <LinhaAula
                    key={a.id}
                    a={a}
                    indice={a.sequencia ?? i + 1}
                    atualId={atualId}
                    tocando={tocando}
                    favoritos={favoritos}
                    alternarFavorito={alternarFavorito}
                    handleTocarAula={handleTocarAula}
                  />
                ))}
              </motion.div>

              {/* Navegação entre Capítulos no Rodapé */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  disabled={capituloIdx <= 0}
                  onClick={() => navegarCapitulo(-1)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 transition disabled:opacity-30 disabled:pointer-events-none active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Capítulo Anterior</span>
                </button>

                <button
                  disabled={capituloIdx >= temasDaArea.length - 1}
                  onClick={() => navegarCapitulo(1)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 transition disabled:opacity-30 disabled:pointer-events-none active:scale-95"
                >
                  <span>Próximo Capítulo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Se for abas extras (favoritas, baixadas, buscar)
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 space-y-4 mt-4 lg:px-10 2xl:max-w-[1600px]">
      <h2 className="text-lg font-bold text-white">
        {aba === 'favoritas' ? 'Favoritas' : aba === 'baixadas' ? 'Baixadas' : 'Resultados da Busca'}
      </h2>

      {listaAba.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground bg-white/[0.02] border border-white/[0.05] rounded-2xl">
          {aba === 'favoritas'
            ? 'Nenhuma favorita ainda. Toque no coração de uma aula para adicionar.'
            : aba === 'baixadas'
              ? 'Nenhuma aula baixada. Toque no ícone de download para ouvir offline.'
              : busca.trim()
                ? 'Nada encontrado para sua busca.'
                : 'Digite o nome de uma aula, tema ou área.'}
        </p>
      ) : (
        <motion.div
          className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-2 divide-y divide-white/[0.06] lg:grid lg:grid-cols-2 lg:divide-y-0 lg:gap-2 2xl:grid-cols-3"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
          }}
          initial="hidden"
          animate="show"
        >
          {listaAba.map((a) => (
            <LinhaAula
              key={a.id}
              a={a}
              atualId={atualId}
              tocando={tocando}
              favoritos={favoritos}
              alternarFavorito={alternarFavorito}
              handleTocarAula={handleTocarAula}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
});
