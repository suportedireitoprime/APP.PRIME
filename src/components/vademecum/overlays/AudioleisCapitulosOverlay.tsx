import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Volume2,
  Headphones,
  Play,
  Pause,
  ChevronRight,
  Clock,
  Sparkles,
  Search,
  BookOpen,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/lib/nativeHaptics';
import { toast } from 'sonner';
import { obterAliasesTabela } from '@/utils/narracaoLookup';
import { extractLeiCapitulos, isStructuralArtigo, type LeiCapituloItem } from '@/lib/leiStructure';
import type { ArtigoLei } from '@/data/mockData';
import { setupMediaSession, clearMediaSession } from '@/lib/mediaSession';
import { safeStorageUrl } from '@/lib/cdnImg';

interface AudioleisCapitulosOverlayProps {
  leiId: string;
  leiNome: string;
  tabelaNome: string | null;
  artigos: ArtigoLei[];
  onClose: () => void;
  onOpenArtigo?: (artigo: ArtigoLei) => void;
}

interface NarracaoData {
  audio_url: string;
  artigo_numero: string;
  titulo_artigo?: string;
}

function cleanArtNum(num: string | undefined): string {
  if (!num) return '';
  return String(num)
    .replace(/^art(?:igo|\.)?\s*/i, '')
    .replace(/[º°ª]/g, '')
    .trim();
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const AudioleisCapitulosOverlay: React.FC<AudioleisCapitulosOverlayProps> = ({
  leiId,
  leiNome,
  tabelaNome,
  artigos,
  onClose,
  onOpenArtigo,
}) => {
  const [selectedCapitulo, setSelectedCapitulo] = useState<LeiCapituloItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingNarracoes, setLoadingNarracoes] = useState(true);
  const [audioMap, setAudioMap] = useState<Map<string, string>>(new Map());

  // Player de Áudio local integrado
  const [currentArtigoNum, setCurrentArtigoNum] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [autoplayNext, setAutoplayNext] = useState(true);
  const [playbackRate, setPlaybackRate] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem('vademecum_audio_speed'));
      return [0.75, 1, 1.25, 1.5, 2].includes(saved) ? saved : 1.0;
    } catch {
      return 1.0;
    }
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Carrega as narrações disponíveis para a lei atual no Supabase
  useEffect(() => {
    let active = true;

    async function carregarAudios() {
      if (!tabelaNome) {
        setLoadingNarracoes(false);
        return;
      }
      setLoadingNarracoes(true);
      try {
        const aliases = obterAliasesTabela(tabelaNome);
        const { data, error } = await supabase
          .from('narracoes_artigos')
          .select('artigo_numero, audio_url')
          .in('tabela_nome', aliases);

        if (error) throw error;
        if (!active) return;

        const map = new Map<string, string>();
        for (const row of (data as NarracaoData[]) || []) {
          const num = cleanArtNum(row.artigo_numero);
          if (num && row.audio_url && !map.has(num)) {
            const resolvedAudio = safeStorageUrl(row.audio_url) || row.audio_url;
            map.set(num, resolvedAudio);
          }
        }
        setAudioMap(map);
      } catch (err) {
        console.error('Erro ao buscar narrações da lei:', err);
      } finally {
        if (active) setLoadingNarracoes(false);
      }
    }

    carregarAudios();
    return () => {
      active = false;
    };
  }, [tabelaNome]);

  // Capítulos da lei selecionada
  const capitulos = useMemo(() => {
    return extractLeiCapitulos(artigos);
  }, [artigos]);

  // Total de artigos reais
  const realArtigos = useMemo(() => {
    return artigos.filter((a) => !isStructuralArtigo(a));
  }, [artigos]);

  const totalAudiosDisponiveis = useMemo(() => {
    let count = 0;
    for (const art of realArtigos) {
      const num = cleanArtNum(art.numero);
      if (audioMap.has(num)) count++;
    }
    return count;
  }, [realArtigos, audioMap]);

  const totalMinutosTexto = useMemo(() => {
    if (totalAudiosDisponiveis === 0) return '0 min';
    const tabelaKey = (tabelaNome || '').toUpperCase();
    const idKey = (leiId || '').toLowerCase();

    const DURACOES_TOTAIS: Record<string, number> = {
      CDC_CODIGO_DEFESA_CONSUMIDOR: 51,
      CP_CODIGO_PENAL: 175,
      CPC_CODIGO_PROCESSO_CIVIL: 220,
      CTN_CODIGO_TRIBUTARIO_NACIONAL: 95,
      CE_CODIGO_ELEITORAL: 155,
      CC_CODIGO_CIVIL: 320,
    };

    let duracaoBase = DURACOES_TOTAIS[tabelaKey];
    if (!duracaoBase) {
      if (idKey === 'cdc' || tabelaKey.includes('CONSUMIDOR')) duracaoBase = 51;
      else if (idKey === 'cp' || (tabelaKey.includes('PENAL') && !tabelaKey.includes('PROCESSO'))) duracaoBase = 175;
      else if (idKey === 'cpc' || tabelaKey.includes('PROCESSO_CIVIL')) duracaoBase = 220;
      else if (idKey === 'ctn' || tabelaKey.includes('TRIBUTARIO')) duracaoBase = 95;
      else if (idKey === 'ce' || tabelaKey.includes('ELEITORAL')) duracaoBase = 155;
      else if (idKey === 'cc' || tabelaKey.includes('CIVIL')) duracaoBase = 320;
    }

    if (duracaoBase && realArtigos.length > 0) {
      const proporcao = totalAudiosDisponiveis / realArtigos.length;
      const minsCalculados = Math.max(1, Math.round(duracaoBase * Math.min(1, proporcao)));
      return `${minsCalculados} min`;
    }

    const mins = Math.max(1, Math.round((totalAudiosDisponiveis * 23.6) / 60));
    return `${mins} min`;
  }, [totalAudiosDisponiveis, realArtigos.length, tabelaNome, leiId]);

  const pctGravado = useMemo(() => {
    if (realArtigos.length === 0) return 0;
    return Math.min(100, Math.round((totalAudiosDisponiveis / realArtigos.length) * 100));
  }, [totalAudiosDisponiveis, realArtigos.length]);

  // Tocar / Pausar um artigo
  const handleTogglePlay = useCallback(
    (artNum: string) => {
      haptic.selection();
      const clean = cleanArtNum(artNum);
      const url = audioMap.get(clean);

      if (!url) {
        toast.info(`Áudio do Art. ${clean} em produção. Em breve disponível.`);
        return;
      }

      if (currentArtigoNum === clean && audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          audioRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
        return;
      }

      // Novo artigo
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(url);
      audio.playbackRate = playbackRate;
      audioRef.current = audio;
      setCurrentArtigoNum(clean);
      setIsPlaying(true);
      setCurrentTime(0);

      audio.play().catch((err) => {
        console.error('Erro ao tocar áudio:', err);
        setIsPlaying(false);
      });

      setupMediaSession({
        title: `Art. ${clean} • ${leiNome}`,
        artist: 'Áudio Leis Prime',
        album: leiNome,
        audio,
      });
    },
    [audioMap, currentArtigoNum, isPlaying, leiNome, playbackRate]
  );

  // Listener de progresso e fim do áudio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (autoplayNext && selectedCapitulo) {
        const arts = selectedCapitulo.artigos;
        const currentIdx = arts.findIndex((a) => cleanArtNum(a.numero) === currentArtigoNum);
        if (currentIdx >= 0 && currentIdx < arts.length - 1) {
          const nextArt = arts[currentIdx + 1];
          const nextClean = cleanArtNum(nextArt.numero);
          if (audioMap.has(nextClean)) {
            setTimeout(() => handleTogglePlay(nextClean), 600);
          }
        }
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [currentArtigoNum, autoplayNext, selectedCapitulo, audioMap, handleTogglePlay]);

  // Limpeza ao desmontar
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      clearMediaSession();
    };
  }, []);

  // Mudar velocidade
  const handleChangeSpeed = () => {
    haptic.selection();
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
    try {
      localStorage.setItem('vademecum_audio_speed', String(nextSpeed));
    } catch {}
  };

  // Filtragem de artigos se houver busca
  const filteredCapitulos = useMemo(() => {
    if (!searchQuery.trim()) return capitulos;
    const q = searchQuery.toLowerCase().trim();
    return capitulos.filter(
      (c) =>
        c.capituloNome.toLowerCase().includes(q) ||
        c.capituloHead.toLowerCase().includes(q) ||
        c.artigos.some((a) => (a.numero || '').toLowerCase().includes(q) || (a.caput || '').toLowerCase().includes(q))
    );
  }, [capitulos, searchQuery]);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      className="fixed inset-0 z-[120] flex flex-col overflow-hidden select-none"
      style={{
        background: 'linear-gradient(180deg, hsl(270 70% 30%) 0%, hsl(275 75% 35%) 40%, hsl(265 72% 28%) 100%)',
      }}
    >
      {/* Brilho radial em todo o fundo roxo */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.18),transparent_65%)] z-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.25),transparent_70%)] z-0" />

      {/* ─── BOTÃO VOLTAR FIXO NO TOPO ESQUERDO (SEMPRE VISÍVEL AO SCROLLAR) ─── */}
      <button
        onClick={() => {
          haptic.selection();
          if (selectedCapitulo) {
            setSelectedCapitulo(null);
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            }
          } else {
            onClose();
          }
        }}
        aria-label="Voltar"
        style={{ top: 'calc(var(--sai-top, env(safe-area-inset-top, 0px)) + 12px)' }}
        className="fixed left-4 z-50 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl active:scale-95 transition-all cursor-pointer hover:bg-black/55"
      >
        <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-md" strokeWidth={2.4} />
      </button>

      {/* ─── CONTÊINER DE SCROLL ÚNICO (CABEÇALHO + LISTA SOBEM JUNTOS) ─── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto w-full relative z-10 overscroll-contain"
        style={{ paddingBottom: 'calc(9rem + var(--sai-bottom, env(safe-area-inset-bottom, 0px)))' }}
      >
        {/* Seção Superior (Hero) */}
        <section className="relative isolate shrink-0 pb-4 overflow-hidden -mx-px rounded-t-[30px]">
          <div className="relative p-5 pt-[calc(var(--sai-top,env(safe-area-inset-top,0px))+16px)] max-w-4xl mx-auto w-full">
            {/* Tag no topo direito */}
            <div className="flex items-center justify-end">
              <span className="text-[11px] font-bold uppercase tracking-widest text-purple-200/90 bg-white/10 px-3 py-1 rounded-full border border-white/15 backdrop-blur-sm shadow-sm">
                Áudio Leis • Oficial
              </span>
            </div>

            {/* Cabeçalho Principal (com margem para não bater no botão fixo) */}
            <div className="flex items-start gap-4 mt-6">
              {/* Círculo com porcentagem */}
              <div className="relative shrink-0 mt-0.5 w-16 h-16">
                <svg width="64" height="64" className="-rotate-90">
                  <circle cx="32" cy="32" r="26" stroke="rgba(255,255,255,0.18)" strokeWidth="6" fill="none" />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    stroke="#fff"
                    strokeWidth="6"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 26}
                    strokeDashoffset={2 * Math.PI * 26 - (pctGravado / 100) * (2 * Math.PI * 26)}
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-[15px] font-black leading-none text-white">{pctGravado}%</span>
                </div>
              </div>

              <div className="min-w-0 flex-1 text-white drop-shadow-md">
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-white/80">
                  Sua trilha em áudio
                </p>
                <h1 className="mt-0.5 font-display text-xl sm:text-2xl font-black leading-tight truncate">
                  {leiNome}
                </h1>
                <p className="mt-1 text-[12px] leading-snug text-white/80 font-body line-clamp-2">
                  {selectedCapitulo ? selectedCapitulo.capituloNome : 'Narrações organizadas por capítulos de ' + leiNome}
                </p>
              </div>
            </div>

            {/* Painel Resumo em Vidro Escuro */}
            <div className="relative mt-4 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white shadow-lg">
              <div className="grid grid-cols-3 divide-x divide-white/10">
                <div className="flex flex-col items-center justify-center px-2 py-2.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">Capítulos</span>
                  <span className="mt-0.5 font-display text-base sm:text-lg font-black leading-none">
                    {capitulos.length}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center px-2 py-2.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">Artigos</span>
                  <span className="mt-0.5 font-display text-base sm:text-lg font-black leading-none">
                    {realArtigos.length}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center px-2 py-2.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">Tempo Total</span>
                  <span className="mt-0.5 font-display text-base sm:text-lg font-black leading-none text-emerald-300">
                    {totalMinutosTexto}
                  </span>
                </div>
              </div>
            </div>

            {/* Campo de Pesquisa Rápida Responsivo e Ergonômico para Mobile */}
            <div className="relative mt-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar capítulo ou número do artigo..."
                className="w-full min-h-[52px] bg-black/35 backdrop-blur-md border border-white/20 rounded-2xl pl-12 pr-11 py-3.5 text-sm sm:text-base text-white placeholder-white/50 focus:outline-none focus:border-white/50 focus:bg-black/50 transition-all shadow-md"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Limpar pesquisa"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Lista de Capítulos ou Lista de Artigos */}
        <div className="px-4 py-2 space-y-3 max-w-4xl mx-auto w-full">
          {loadingNarracoes ? (
            <div className="py-20 flex flex-col items-center justify-center text-white/70 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
              <p className="text-xs font-medium">Sincronizando áudios oficiais da lei...</p>
            </div>
          ) : !selectedCapitulo ? (
            /* ───────── LISTA DE CAPÍTULOS (ESTILO VACATIO MAPASOVERLAY) ───────── */
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-white/90 uppercase tracking-wider flex items-center gap-1.5 drop-shadow-sm">
                  <BookOpen className="w-3.5 h-3.5 text-white/80" />
                  Selecione o Capítulo para Ouvir
                </span>
                <span className="text-[11px] text-white/60 font-medium">
                  {filteredCapitulos.length} capítulos disponíveis
                </span>
              </div>

              {filteredCapitulos.map((cap, i) => {
                const capRealArts = cap.artigos.filter((a) => !isStructuralArtigo(a));
                let capAudiosCount = 0;
                for (const a of capRealArts) {
                  if (audioMap.has(cleanArtNum(a.numero))) capAudiosCount++;
                }
                const capPct =
                  capRealArts.length > 0 ? Math.round((capAudiosCount / capRealArts.length) * 100) : 0;
                const hasAnyAudio = capAudiosCount > 0;

                return (
                  <button
                    key={cap.id || i}
                    onClick={() => {
                      haptic.selection();
                      setSelectedCapitulo(cap);
                      if (scrollContainerRef.current) {
                        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="group flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md p-3 text-left transition-all hover:bg-black/30 active:scale-[0.99] sm:p-3.5 shadow-sm cursor-pointer"
                  >
                    {/* Ícone de Destaque com Fone Roxo */}
                    <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 flex items-center justify-center rounded-2xl bg-black/30 border border-white/10">
                      <Headphones className="h-8 w-8 text-[#C084FC] drop-shadow-sm transition-transform group-hover:scale-110" strokeWidth={1.5} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[11px] font-bold text-white/60 uppercase tracking-wider truncate">
                          {cap.capituloHead}
                        </p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ml-auto border ${
                            hasAnyAudio
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-white/10 text-white/60 border-white/10'
                          }`}
                        >
                          {hasAnyAudio ? `${capAudiosCount} gravados` : 'Em breve'}
                        </span>
                      </div>

                      <p
                        className="min-w-0 text-[14px] font-bold text-white sm:text-[15px] leading-snug drop-shadow-sm truncate"
                        style={{ fontFamily: "'Barlow', system-ui, sans-serif", letterSpacing: '-0.005em' }}
                      >
                        {cap.capituloNome}
                      </p>

                      <p className="mt-0.5 text-[12px] text-white/60 sm:text-[13px]">
                        {capRealArts.length} {capRealArts.length === 1 ? 'artigo' : 'artigos'}
                        {cap.primeiroArtigo && cap.ultimoArtigo && ` • Arts. ${cap.primeiroArtigo} a ${cap.ultimoArtigo}`}
                      </p>

                      {/* Barra de Progresso de Áudios */}
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/40">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            hasAnyAudio ? 'bg-gradient-to-r from-purple-400 to-emerald-400' : 'bg-white/10'
                          }`}
                          style={{ width: `${Math.max(hasAnyAudio ? 12 : 0, capPct)}%` }}
                        />
                      </div>
                    </div>

                    <ChevronRight className="h-5 w-5 shrink-0 text-white/40 transition-transform group-hover:translate-x-0.5" />
                  </button>
                );
              })}

              {filteredCapitulos.length === 0 && (
                <div className="py-16 text-center text-white/60 text-sm">
                  Nenhum capítulo encontrado para o termo pesquisado.
                </div>
              )}
            </div>
          ) : (
            /* ───────── DETALHE DO CAPÍTULO: ARTIGOS DO CAPÍTULO ───────── */
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-white/10">
                <button
                  onClick={() => {
                    haptic.selection();
                    setSelectedCapitulo(null);
                    if (scrollContainerRef.current) {
                      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-purple-200 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar para Capítulos
                </button>
                <span className="text-[11px] text-white/70 font-medium">
                  {selectedCapitulo.artigos.filter((a) => !isStructuralArtigo(a)).length} artigos
                </span>
              </div>

              <div className="space-y-2.5">
                {selectedCapitulo.artigos
                  .filter((a) => !isStructuralArtigo(a))
                  .map((art) => {
                    const numClean = cleanArtNum(art.numero);
                    const hasAudio = audioMap.has(numClean);
                    const isCurrent = currentArtigoNum === numClean;

                    return (
                      <div
                        key={art.id}
                        className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all ${
                          isCurrent
                            ? 'bg-black/50 border-purple-400/60 shadow-xl'
                            : 'bg-black/25 backdrop-blur-md border-white/10 hover:bg-black/35 hover:border-white/20'
                        }`}
                      >
                        {/* Botão de Play ou Badge "Em breve" */}
                        {hasAudio ? (
                          <button
                            onClick={() => handleTogglePlay(art.numero)}
                            aria-label={`Reproduzir Artigo ${numClean}`}
                            className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center transition-transform active:scale-90 cursor-pointer shadow-md ${
                              isCurrent && isPlaying
                                ? 'bg-purple-500 text-white shadow-purple-500/50 animate-pulse'
                                : 'bg-purple-500/30 text-purple-200 border border-purple-400/40 hover:bg-purple-500 hover:text-white'
                            }`}
                          >
                            {isCurrent && isPlaying ? (
                              <Pause className="w-5 h-5 fill-current" />
                            ) : (
                              <Play className="w-5 h-5 fill-current ml-0.5" />
                            )}
                          </button>
                        ) : (
                          <div
                            title="Gravação em breve"
                            className="w-11 h-11 shrink-0 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-white/40"
                          >
                            <Clock className="w-5 h-5" />
                          </div>
                        )}

                        {/* Informações do Artigo */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`font-mono text-xs font-black px-2 py-0.5 rounded-md border ${
                                hasAudio
                                  ? 'bg-purple-400/20 text-purple-200 border-purple-400/40'
                                  : 'bg-white/10 text-white/60 border-white/10'
                              }`}
                            >
                              Art. {numClean}
                            </span>

                            {hasAudio ? (
                              <span className="text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Áudio Disponível
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-white/50 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Gravação em breve
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-white/85 line-clamp-2 leading-relaxed font-body">
                            {art.caput ? art.caput.replace(/\([^)]*\)/g, '').trim() : 'Texto do artigo...'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── MINI-PLAYER DE ÁUDIO NO RODAPÉ DO OVERLAY ─── */}
      <AnimatePresence>
        {currentArtigoNum && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-[130] bg-black/80 border-t border-purple-400/30 backdrop-blur-xl p-3 sm:p-4 pb-[calc(0.75rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] shadow-2xl"
          >
            <div className="max-w-4xl mx-auto flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
                    <Volume2 className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      Art. {currentArtigoNum} • {leiNome}
                    </p>
                    <p className="text-[10px] text-purple-200/80 truncate">Narração em áudio estúdio</p>
                  </div>
                </div>

                {/* Controles de Reprodução */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleChangeSpeed}
                    className="px-2 py-1 rounded-lg bg-black/40 text-[10px] font-bold text-purple-200 border border-purple-400/40 hover:bg-black/60 active:scale-95 transition-all"
                  >
                    {playbackRate}x
                  </button>

                  <button
                    onClick={() => handleTogglePlay(currentArtigoNum)}
                    className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center active:scale-95 shadow-md hover:bg-purple-400 transition-all cursor-pointer"
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Barra de Tempo / Progresso */}
              <div className="flex items-center gap-2 text-[10px] text-white/70 font-mono">
                <span>{formatTime(currentTime)}</span>
                <div
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    if (audioRef.current && duration > 0) {
                      audioRef.current.currentTime = ratio * duration;
                    }
                  }}
                  className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden cursor-pointer relative"
                >
                  <div
                    className="h-full bg-purple-400 rounded-full transition-all"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AudioleisCapitulosOverlay;
