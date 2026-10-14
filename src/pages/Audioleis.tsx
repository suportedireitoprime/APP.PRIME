import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Volume2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/lib/nativeHaptics';
import { toast } from 'sonner';
import { setupMediaSession, clearMediaSession } from '@/lib/mediaSession';
import { LEIS_CATALOG } from '@/data/leisCatalog';
import { leiToSlug, tipoToSlug } from '@/lib/legislacaoSlugs';

interface NarracaoItem {
  artigo_numero: string;
  audio_url: string;
  titulo_artigo?: string;
  word_timings?: unknown;
}

interface LawOption {
  id: string;
  sigla: string;
  nome: string;
  tabela_nome: string;
  descricao: string;
  tipo: string;
  artigosCount?: number;
  status: 'completo' | 'em_breve';
  color: string;
}

const LAWS_CONFIG: LawOption[] = [
  {
    id: 'cp',
    sigla: 'CP',
    nome: 'Código Penal',
    tabela_nome: 'CP_CODIGO_PENAL',
    descricao: 'Decreto-Lei nº 2.848/1940 • Todos os artigos narrados',
    tipo: 'codigo',
    artigosCount: 420,
    status: 'completo',
    color: '#ef4444',
  },
  {
    id: 'cdc',
    sigla: 'CDC',
    nome: 'Código de Defesa do Consumidor',
    tabela_nome: 'CDC_CODIGO_DEFESA_CONSUMIDOR',
    descricao: 'Lei nº 8.078/1990 • Todos os artigos narrados',
    tipo: 'codigo',
    artigosCount: 130,
    status: 'completo',
    color: '#f97316',
  },
  {
    id: 'cpc',
    sigla: 'CPC',
    nome: 'Código de Processo Civil',
    tabela_nome: 'CPC_CODIGO_PROCESSO_CIVIL',
    descricao: 'Lei nº 13.105/2015 • Narrações em áudio estúdio',
    tipo: 'codigo',
    artigosCount: 534,
    status: 'completo',
    color: '#3b82f6',
  },
  {
    id: 'ctn',
    sigla: 'CTN',
    nome: 'Código Tributário Nacional',
    tabela_nome: 'CTN_CODIGO_TRIBUTARIO_NACIONAL',
    descricao: 'Lei nº 5.172/1966 • Todos os artigos narrados',
    tipo: 'codigo',
    artigosCount: 245,
    status: 'completo',
    color: '#10b981',
  },
  {
    id: 'ce',
    sigla: 'CE',
    nome: 'Código Eleitoral',
    tabela_nome: 'CE_CODIGO_ELEITORAL',
    descricao: 'Lei nº 4.737/1965 • Todos os artigos narrados (Arts. 1 a 383)',
    tipo: 'codigo',
    artigosCount: 389,
    status: 'completo',
    color: '#6366f1',
  },
  {
    id: 'cf88',
    sigla: 'CF/88',
    nome: 'Constituição Federal',
    tabela_nome: 'CF88_CONSTITUICAO_FEDERAL',
    descricao: 'Constituição da República de 1988',
    tipo: 'constituicao',
    status: 'em_breve',
    color: '#fbbf24',
  },
  {
    id: 'cc',
    sigla: 'CC',
    nome: 'Código Civil',
    tabela_nome: 'CC_CODIGO_CIVIL',
    descricao: 'Lei nº 10.406/2002',
    tipo: 'codigo',
    status: 'em_breve',
    color: '#a855f7',
  },
  {
    id: 'cpp',
    sigla: 'CPP',
    nome: 'Código de Processo Penal',
    tabela_nome: 'CPP_CODIGO_PROCESSO_PENAL',
    descricao: 'Decreto-Lei nº 3.689/1941',
    tipo: 'codigo',
    status: 'em_breve',
    color: '#ec4899',
  },
  {
    id: 'clt',
    sigla: 'CLT',
    nome: 'Consolidação das Leis do Trabalho',
    tabela_nome: 'CLT_CONSOLIDACAO_LEIS_TRABALHO',
    descricao: 'Decreto-Lei nº 5.452/1943',
    tipo: 'codigo',
    status: 'em_breve',
    color: '#8b5cf6',
  },
];

function sortArtigos(a: string, b: string) {
  const matchA = a.match(/^(\d+)(.*)$/);
  const matchB = b.match(/^(\d+)(.*)$/);
  if (!matchA || !matchB) return a.localeCompare(b);
  const numA = parseInt(matchA[1], 10);
  const numB = parseInt(matchB[1], 10);
  if (numA !== numB) return numA - numB;
  return (matchA[2] || '').localeCompare(matchB[2] || '');
}

function formatAudioTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function AudioleisPage() {
  const navigate = useNavigate();

  // Estados principais
  const [selectedTabela, setSelectedTabela] = useState<string>('CP_CODIGO_PENAL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [artigos, setArtigos] = useState<NarracaoItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Player de Áudio
  const [currentArtigo, setCurrentArtigo] = useState<NarracaoItem | null>(null);
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

  const currentLaw = useMemo(() => {
    return LAWS_CONFIG.find((l) => l.tabela_nome === selectedTabela) || LAWS_CONFIG[0];
  }, [selectedTabela]);

  // Carrega os artigos narrados da tabela selecionada
  useEffect(() => {
    let isCancelled = false;

    async function carregarNarracoes() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('narracoes_artigos')
          .select('artigo_numero, audio_url, titulo_artigo, word_timings')
          .eq('tabela_nome', selectedTabela);

        if (error) throw error;
        if (isCancelled) return;

        // Deduplica por número base do artigo
        const map = new Map<string, NarracaoItem>();
        for (const row of data || []) {
          const numRaw = (row.artigo_numero || '')
            .replace(/^Art(?:igo|\.)?\s*/i, '')
            .replace(/º$/, '')
            .trim();
          if (numRaw && !map.has(numRaw)) {
            map.set(numRaw, {
              artigo_numero: numRaw,
              audio_url: row.audio_url,
              titulo_artigo: row.titulo_artigo,
              word_timings: row.word_timings,
            });
          }
        }

        const sorted = Array.from(map.values()).sort((a, b) =>
          sortArtigos(a.artigo_numero, b.artigo_numero)
        );

        setArtigos(sorted);
        setTotalCount(sorted.length);
      } catch (err) {
        console.error('Erro ao buscar áudio-leis:', err);
        if (!isCancelled) {
          setArtigos([]);
          setTotalCount(0);
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    carregarNarracoes();
    return () => {
      isCancelled = true;
    };
  }, [selectedTabela]);

  // Filtragem com busca
  const filteredArtigos = useMemo(() => {
    if (!searchQuery.trim()) return artigos;
    const q = searchQuery.toLowerCase().trim();
    return artigos.filter((item) => {
      const matchNum = item.artigo_numero.toLowerCase().includes(q);
      const matchTitle = item.titulo_artigo?.toLowerCase().includes(q);
      return matchNum || matchTitle;
    });
  }, [artigos, searchQuery]);

  // Inicialização e controle do áudio nativo
  const playAudio = useCallback(
    (item: NarracaoItem) => {
      haptic.impact();
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      const audio = audioRef.current;

      if (currentArtigo?.artigo_numero === item.artigo_numero && isPlaying) {
        audio.pause();
        setIsPlaying(false);
        return;
      }

      if (currentArtigo?.artigo_numero === item.artigo_numero && !isPlaying) {
        audio.play().catch(console.error);
        setIsPlaying(true);
        return;
      }

      // Novo artigo
      setCurrentArtigo(item);
      audio.src = item.audio_url;
      audio.playbackRate = playbackRate;
      audio.currentTime = 0;
      setCurrentTime(0);

      audio.play().then(() => {
        setIsPlaying(true);
        setupMediaSession({
          title: `Artigo ${item.artigo_numero} — ${currentLaw.nome}`,
          artist: 'Audioleis Prime',
          album: currentLaw.nome,
        });
      }).catch((e) => {
        console.error('Erro ao iniciar áudio:', e);
        toast.error('Não foi possível reproduzir este áudio no momento.');
      });
    },
    [currentArtigo, isPlaying, playbackRate, currentLaw]
  );

  // Ouvintes do HTMLAudioElement
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);

      if (autoplayNext && currentArtigo) {
        const currentIdx = artigos.findIndex((a) => a.artigo_numero === currentArtigo.artigo_numero);
        if (currentIdx >= 0 && currentIdx < artigos.length - 1) {
          const next = artigos[currentIdx + 1];
          playAudio(next);
        }
      }
    };
    const onError = () => {
      setIsPlaying(false);
      toast.error('Erro na reprodução do áudio.');
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [currentArtigo, artigos, autoplayNext, playAudio]);

  // Alteração de velocidade
  const changeSpeed = (rate: number) => {
    haptic.selection();
    setPlaybackRate(rate);
    try {
      localStorage.setItem('vademecum_audio_speed', String(rate));
    } catch {}
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  // Pular para o próximo ou anterior
  const pularArtigo = (direction: 'next' | 'prev') => {
    if (!currentArtigo) return;
    const currentIdx = artigos.findIndex((a) => a.artigo_numero === currentArtigo.artigo_numero);
    if (currentIdx === -1) return;

    const nextIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
    if (nextIdx >= 0 && nextIdx < artigos.length) {
      playAudio(artigos[nextIdx]);
    } else {
      toast.info(direction === 'next' ? 'Fim da lista de artigos.' : 'Primeiro artigo da lei.');
    }
  };

  // Navegar para o texto completo do artigo no Vade Mecum
  const irParaArtigoVadeMecum = (numArtigo: string) => {
    haptic.selection();
    const lei = LEIS_CATALOG.find((l) => l.tabela_nome === selectedTabela);
    if (lei) {
      const slug = leiToSlug({ id: lei.id, nome: lei.nome });
      navigate(`/legislacao/${tipoToSlug(lei.tipo)}/${slug}/${encodeURIComponent(numArtigo)}`);
    } else {
      navigate('/vademecum');
    }
  };

  // Limpeza ao sair da página
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      clearMediaSession();
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0D0D0D] text-white flex flex-col selection:bg-rose-500/30 overflow-x-hidden">
      {/* Background ShapeGrid oficial */}
      <ShapeGrid />

      {/* Header com Safe Area */}
      <header className="relative z-20 shrink-0 border-b border-zinc-800/80 bg-zinc-900/80 backdrop-blur-xl pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-4 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                haptic.impact();
                navigate(-1);
              }}
              className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-2xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/60 flex items-center justify-center text-zinc-200 active:scale-95 transition-all shadow-md shrink-0"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Volume2 className="w-3.5 h-3.5" />
                  Narrações Oficiais
                </span>
                <span className="text-[11px] text-zinc-400 hidden sm:inline">•</span>
                <span className="text-[11px] text-zinc-400 hidden sm:inline">Latência 0ms</span>
              </div>
              <h1 className="font-heading text-xl sm:text-2xl font-black uppercase tracking-widest text-white mt-0.5 flex items-center gap-2">
                AUDIOLEIS
              </h1>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <p className="text-xs text-zinc-400 font-mono">
              Total Narrado:{' '}
              <span className="text-rose-400 font-bold">{totalCount} artigos</span>
            </p>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 pb-[calc(7rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]">
        {/* Seletor de Códigos / Leis (Tabs Carrossel) */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Escolha a Lei para Ouvir
            </h2>
            <span className="text-[11px] text-zinc-400 font-mono">
              {currentLaw.status === 'completo' ? '100% narrado' : 'Em produção'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {LAWS_CONFIG.map((law) => {
              const isSelected = selectedTabela === law.tabela_nome;
              return (
                <button
                  key={law.id}
                  onClick={() => {
                    haptic.selection();
                    if (law.status === 'em_breve') {
                      toast.info(`A narração do ${law.nome} está sendo produzida e estará disponível em breve!`);
                      return;
                    }
                    setSelectedTabela(law.tabela_nome);
                  }}
                  className={`group relative p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between min-h-[92px] ${
                    isSelected
                      ? 'bg-rose-500/10 border-rose-500/50 shadow-lg shadow-rose-500/10 scale-[1.02]'
                      : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs font-mono"
                      style={{
                        backgroundColor: `${law.color}20`,
                        color: law.color,
                        border: `1px solid ${law.color}40`,
                      }}
                    >
                      {law.sigla}
                    </span>
                    {law.status === 'completo' ? (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Pronto
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-800/60 px-1.5 py-0.5 rounded-full border border-zinc-700/40">
                        Em breve
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-xs text-white leading-tight mt-2 line-clamp-1">
                      {law.nome}
                    </h3>
                    <p className="text-[10.5px] text-zinc-400 mt-0.5">
                      {law.status === 'completo'
                        ? `${law.artigosCount || totalCount} artigos`
                        : 'Gravação em breve'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Barra de Busca de Artigo */}
        <section className="mb-6">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Digite o número do artigo (ex: 121, 54-A) ou tema..."
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500/60 focus:ring-2 focus:ring-rose-500/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-800"
              >
                Limpar
              </button>
            )}
          </div>
        </section>

        {/* Lista de Artigos da Lei */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Artigos com Narração ({filteredArtigos.length})
            </h2>
            <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoplayNext}
                onChange={(e) => setAutoplayNext(e.target.checked)}
                className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-rose-500 focus:ring-rose-500/30"
              />
              Tocar próximo automaticamente
            </label>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-zinc-900/60 border border-zinc-800/60 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : filteredArtigos.length === 0 ? (
            <div className="p-12 text-center bg-zinc-900/40 border border-zinc-800/60 rounded-3xl">
              <Volume2 className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">Nenhum artigo encontrado</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Tente buscar por outro número de artigo ou limpe o filtro de busca.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredArtigos.map((item) => {
                const isSelected = currentArtigo?.artigo_numero === item.artigo_numero;
                const activeThis = isSelected && isPlaying;

                return (
                  <div
                    key={item.artigo_numero}
                    className={`group relative p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-rose-500/10 border-rose-500/40 shadow-lg shadow-rose-500/5'
                        : 'bg-zinc-900/50 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Botão Play/Pause Direto */}
                      <button
                        onClick={() => playAudio(item)}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
                          activeThis
                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 scale-105'
                            : isSelected
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : 'bg-zinc-800/90 text-zinc-200 hover:bg-rose-500 hover:text-white border border-zinc-700/60'
                        }`}
                        aria-label={activeThis ? 'Pausar' : 'Ouvir Artigo'}
                      >
                        {activeThis ? (
                          <Pause className="w-5 h-5 fill-current" />
                        ) : (
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        )}
                      </button>

                      {/* Info do Artigo */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-heading font-black text-sm text-white tracking-wide">
                            Art. {item.artigo_numero}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                            MP3
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                          {item.titulo_artigo || `${currentLaw.sigla} — Narração em Áudio`}
                        </p>
                      </div>
                    </div>

                    {/* Ação de abrir texto no Vade Mecum */}
                    <button
                      onClick={() => irParaArtigoVadeMecum(item.artigo_numero)}
                      className="w-9 h-9 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/40 flex items-center justify-center text-zinc-400 hover:text-white transition-all shrink-0 active:scale-95"
                      title="Ler artigo completo no Vade Mecum"
                    >
                      <BookOpen className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Miniplayer Fixo no Rodapé */}
      {currentArtigo && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] pb-[var(--sai-bottom,env(safe-area-inset-bottom,0px))]">
          <div className="max-w-4xl mx-auto px-4 py-3">
            {/* Barra de Progresso com Scrub */}
            <div
              className="h-1.5 rounded-full bg-zinc-800 overflow-hidden cursor-pointer mb-2.5 relative group"
              onClick={(e) => {
                const audio = audioRef.current;
                if (!audio || !audio.duration) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                audio.currentTime = pct * audio.duration;
              }}
            >
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-rose-400 transition-[width] duration-100 ease-out"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              {/* Título do Artigo em Reprodução */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
                  <Volume2 className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-black text-sm text-white">
                      Art. {currentArtigo.artigo_numero}
                    </span>
                    <span className="text-xs text-rose-400 font-semibold truncate">
                      {currentLaw.sigla}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400 tabular-nums">
                    {formatAudioTime(currentTime)} / {formatAudioTime(duration)}
                  </div>
                </div>
              </div>

              {/* Controles Principais */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => pularArtigo('prev')}
                  className="w-9 h-9 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 flex items-center justify-center text-zinc-300 active:scale-95"
                  aria-label="Artigo Anterior"
                >
                  <SkipBack className="w-4 h-4 fill-current" />
                </button>

                <button
                  onClick={() => playAudio(currentArtigo)}
                  className="w-11 h-11 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 active:scale-95"
                  aria-label={isPlaying ? 'Pausar' : 'Tocar'}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  onClick={() => pularArtigo('next')}
                  className="w-9 h-9 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 flex items-center justify-center text-zinc-300 active:scale-95"
                  aria-label="Próximo Artigo"
                >
                  <SkipForward className="w-4 h-4 fill-current" />
                </button>
              </div>

              {/* Seletor de Velocidade */}
              <div className="hidden sm:flex items-center gap-1 shrink-0 border-l border-zinc-800 pl-3">
                {[1, 1.25, 1.5, 2].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => changeSpeed(speed)}
                    className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                      playbackRate === speed
                        ? 'bg-rose-500 text-white'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
