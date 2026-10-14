import React, { useState, useMemo, useCallback } from 'react';
import { Play, Pause, Heart, ArrowLeft, BookOpen, ChevronRight, ChevronLeft, Headphones, Layers, Sparkles } from 'lucide-react';
import { BotaoDownloadAudio } from './BotaoDownloadAudio';
import { capaDaArea } from '@/lib/audioaulasHelper';
import { type AulaAudio, audioIdOf } from '@/contexts/AudioaulasPlayerContext';
import { CapaOtimizada } from './CapaOtimizada';
import { motion, AnimatePresence } from 'framer-motion';

function obterDescricaoAmigavel(a: AulaAudio): string {
  if (a.area && /eca|criança|adolescente/i.test(a.area)) {
    return 'Lei nº 8.069/1990 • Estatuto da Criança e do Adolescente';
  }
  if (a.tema && !/^(liv\.|tít\.|cap\.|seç\.)/i.test(a.tema.trim())) {
    return `${a.tema} • Áudio Explicativo`;
  }
  if (a.area) {
    return `${a.area} • Áudio Explicativo`;
  }
  return 'Áudio Explicativo • Legislação';
}

function decomporTituloCapitulo(tema: string) {
  let nome = (tema || '').trim();
  let faixaArtigos = '';

  // 1. Extrair faixa de artigos entre parênteses no final, ex: "(arts. 1 a 6)" ou "(arts. 7 a 14-A)"
  const matchParen = nome.match(/\((?:arts?\.?|artigos?)\s*([^)]+)\)$/i);
  if (matchParen) {
    faixaArtigos = `Arts. ${matchParen[1].trim()}`;
    nome = nome.replace(/\s*\((?:arts?\.?|artigos?)\s*[^)]+\)$/i, '').trim();
  }

  // 2. Remover divisões legais prefixadas: Liv., Livro, Tít., Título, Cap., Capítulo, Seção, etc.
  const partesTravessao = nome.split(/\s+[—–-]\s+/);
  if (partesTravessao.length > 1) {
    if (/^(?:liv(?:ro|\.)?|t[íi]t(?:ulo|\.)?|cap(?:[íi]tulo|\.)?|se[çc](?:[ãa]o|\.)?|parte)/i.test(partesTravessao[0].trim())) {
      nome = partesTravessao.slice(1).join(' — ').trim();
    }
  } else {
    nome = nome.replace(/^(?:liv(?:ro|\.)?\s*[^:,—–-]+|t[íi]t(?:ulo|\.)?\s*[^:,—–-]+|cap(?:[íi]tulo|\.)?\s*[^:,—–-]+|se[çc](?:[ãa]o|\.)?\s*[^:,—–-]+)\s*[:—–-]\s*/i, '').trim();
  }

  // Fallback se não pegou faixaArtigos
  if (!faixaArtigos) {
    const matchArtAvulso = tema.match(/(?:arts?\.?|artigos?)\s*([0-9]+(?:\s*(?:a|ao|-|até)\s*[0-9]+[A-Za-z]*)?)/i);
    if (matchArtAvulso) {
      faixaArtigos = `Arts. ${matchArtAvulso[1].trim()}`;
    }
  }

  return {
    tituloLimpo: nome || tema,
    faixaArtigos
  };
}

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
          <p className={`text-sm sm:text-[14.5px] !font-sans font-semibold break-words text-left leading-snug tracking-normal normal-case ${ativo ? 'text-primary' : 'text-foreground'}`}>
            {typeof indice === 'number' ? `${indice}. ` : ''}
            {a.titulo}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-left">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ativo && tocando ? 'bg-primary animate-pulse' : 'bg-emerald-400'}`} />
            <p className="text-xs text-zinc-400 break-words text-left truncate font-medium">
              {a.url_audio ? obterDescricaoAmigavel(a) : 'Áudio em breve'}
            </p>
          </div>
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
  capituloSelecionado?: string | null;
  setCapituloSelecionado?: (cap: string | null) => void;
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
  handleTocarAula,
  capituloSelecionado: capituloExterno,
  setCapituloSelecionado: setCapituloExterno
}: AudioaulasListaAulasProps) {
  const [capituloLocal, setCapituloLocal] = useState<string | null>(null);

  const capituloSelecionado = capituloExterno !== undefined ? capituloExterno : capituloLocal;
  const setCapituloSelecionado = setCapituloExterno || setCapituloLocal;

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
  }, [capituloIdx, setCapituloSelecionado, temasDaArea]);

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
      <div className="mx-auto w-full max-w-[1400px] px-4 space-y-6 mt-4 lg:px-10 2xl:max-w-[1600px] pb-24">
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
                  {temasDaArea.length} {temasDaArea.length === 1 ? 'capítulo' : 'capítulos'}
                </span>
              </div>

              {/* Grid de Capítulos */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {temasDaArea.map(([tema, lista], i) => {
                  const contemAulaTocando = lista.some((a) => a.id === atualId);
                  const { tituloLimpo, faixaArtigos } = decomporTituloCapitulo(tema);
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
                          <p className="text-sm sm:text-[15px] !font-sans font-semibold text-white leading-snug line-clamp-2 group-hover:text-primary transition-colors tracking-normal normal-case">
                            {tituloLimpo}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            {faixaArtigos && (
                              <span className="inline-flex items-center text-[11px] font-semibold text-zinc-300 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                                {faixaArtigos}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400">
                              <Headphones className="w-3 h-3 text-primary" />
                              {lista.length} {lista.length === 1 ? 'aula' : 'aulas'}
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
              {/* Barra Superior do Capítulo — Sem botão duplicado de voltar */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-primary px-3 py-1 rounded-full bg-primary/15 border border-primary/30">
                    Capítulo {capituloIdx + 1} de {temasDaArea.length}
                  </span>

                  <span className="text-xs font-semibold text-zinc-400 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10">
                    {aulasDoCapitulo.length} {aulasDoCapitulo.length === 1 ? 'aula' : 'aulas'}
                  </span>
                </div>

                {(() => {
                  const infoCap = capituloSelecionado ? decomporTituloCapitulo(capituloSelecionado) : { tituloLimpo: '', faixaArtigos: '' };
                  return (
                    <div>
                      <h3 className="text-base sm:text-lg !font-sans font-bold text-white leading-snug tracking-normal normal-case">
                        {infoCap.tituloLimpo}
                      </h3>
                      <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                        {infoCap.faixaArtigos ? `${infoCap.faixaArtigos} • ` : ''}
                        {aulasDoCapitulo.length} {aulasDoCapitulo.length === 1 ? 'aula disponível' : 'aulas disponíveis'} neste capítulo
                      </p>
                    </div>
                  );
                })()}
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
    <div className="mx-auto w-full max-w-[1400px] px-4 space-y-4 mt-4 lg:px-10 2xl:max-w-[1600px] pb-24">
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
