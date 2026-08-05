import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  Headphones,
  Heart,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Search,
  SkipBack,
  SkipForward,
  X,
  Gauge,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  baixarAudioOffline,
  removerAudioOffline,
  estaBaixado,
  suportaAudioOffline,
  assinarAudioOffline,
} from '@/lib/nativo/audioOffline';
import AudioaulasBottomNav, { type AudioaulasTab } from '@/components/audioaulas/AudioaulasBottomNav';
import { useGatedFeature } from '@/hooks/useGatedFeature';
import { srcOf } from '@/lib/assetUrl';
import { useAudioaulasPlayer, audioIdOf, type AulaAudio } from '@/contexts/AudioaulasPlayerContext';

import capaAudioaulas from '@/assets/atalho-audioaulas.webp.asset.json';
import capaPenal from '@/assets/direito-penal.webp.asset.json';
import capaCivil from '@/assets/direito-civil.webp.asset.json';
import capaConstituicao from '@/assets/direito-constituicao.webp.asset.json';
import capaClt from '@/assets/direito-clt.webp.asset.json';

const CAPA_HUB = srcOf(capaAudioaulas);
const CAPAS: { re: RegExp; url: string }[] = [
  { re: /penal|processo penal/i, url: srcOf(capaPenal) },
  { re: /civil/i, url: srcOf(capaCivil) },
  { re: /constitu/i, url: srcOf(capaConstituicao) },
  { re: /trabalh|clt/i, url: srcOf(capaClt) },
];
const capaDaArea = (area: string) => CAPAS.find((c) => c.re.test(area))?.url || CAPA_HUB;

const normalizar = (s: string) =>
  (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const fmt = (s: number) => {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const VELOCIDADES = [1, 1.25, 1.5, 2];

/** Botão de download offline otimizado para listas e player */
function BotaoDownload({ aula, grande = false }: { aula: AulaAudio; grande?: boolean }) {
  const id = audioIdOf(aula);
  const [baixado, setBaixado] = useState(false);
  const [baixando, setBaixando] = useState(false);

  useEffect(() => {
    const checar = () => {
      void estaBaixado(id).then(setBaixado);
    };
    checar();
    return assinarAudioOffline(checar);
  }, [id]);

  if (!suportaAudioOffline() || !aula.url_audio) return null;

  const alternar = async () => {
    if (baixado) {
      await removerAudioOffline(id);
      toast.success('Download removido');
      return;
    }
    setBaixando(true);
    const ok = await baixarAudioOffline({
      id,
      url: aula.url_audio!,
      titulo: aula.titulo,
      subtitulo: aula.tema || aula.area,
      categoria: 'audioaulas',
    });
    setBaixando(false);
    toast[ok ? 'success' : 'error'](ok ? 'Aula disponível offline' : 'Não foi possível baixar');
  };

  const size = grande ? 'h-11 w-11' : 'h-8 w-8';
  const icon = grande ? 'h-5 w-5' : 'h-4 w-4';

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        void alternar();
      }}
      disabled={baixando}
      aria-label={baixado ? 'Remover download' : 'Baixar aula'}
      className={`${size} grid place-items-center rounded-full shrink-0 transition hover:bg-white/10 active:scale-95 disabled:opacity-60 ${
        grande ? 'border border-white/10 bg-white/10 backdrop-blur' : ''
      }`}
    >
      {baixando ? (
        <Loader2 className={`${icon} animate-spin text-muted-foreground`} />
      ) : baixado ? (
        <Check className={`${icon} text-emerald-400`} />
      ) : (
        <Download className={`${icon} text-muted-foreground`} />
      )}
    </button>
  );
}

const Audioaulas = () => {
  const navigate = useNavigate();
  const { area } = useParams();
  const areaAtual = area ? decodeURIComponent(area) : null;

  const {
    aulas,
    loading,
    atualId,
    atual,
    atualIdx,
    tocando,
    tempo,
    dur,
    velocidade,
    aberto,
    fila,
    favoritos,
    alternarFavorito,
    setAberto,
    tocar,
    togglePlay,
    pular,
    seek,
    setVelocidade,
  } = useAudioaulasPlayer();

  const [baixadas, setBaixadas] = useState<Set<string>>(new Set());
  const [aba, setAba] = useState<AudioaulasTab>('aulas');
  const [busca, setBusca] = useState('');
  const buscaRef = useRef<HTMLInputElement | null>(null);

  // Gating de uso (se configurado)
  const gateDia = useGatedFeature('audioaula_dia', 'audioaula', { scope: null });
  const gateMes = useGatedFeature('audioaula_mes', 'audioaula', { scope: null });

  // Sincroniza estado das aulas offline baixadas para a aba "Baixadas"
  useEffect(() => {
    let vivo = true;
    const checar = async () => {
      const ids = await Promise.all(
        aulas.map(async (a) => ((await estaBaixado(audioIdOf(a))) ? audioIdOf(a) : null)),
      );
      if (vivo) setBaixadas(new Set(ids.filter(Boolean) as string[]));
    };
    void checar();
    const off = assinarAudioOffline(() => void checar());
    return () => {
      vivo = false;
      off();
    };
  }, [aulas]);

  // Atalhos de teclado no Desktop (Espaço = Play/Pause, Esc = Fechar, Setas = Avançar/Voltar 15s)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }
      if (e.key === 'Escape' && aberto) {
        e.preventDefault();
        setAberto(false);
      } else if (e.key === ' ' && atual) {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowLeft' && atual) {
        e.preventDefault();
        seek(Math.max(0, tempo - 15));
      } else if (e.key === 'ArrowRight' && atual) {
        e.preventDefault();
        seek(Math.min(dur, tempo + 15));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [aberto, atual, setAberto, togglePlay, seek, tempo, dur]);

  const areas = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of aulas) {
      const nome = a.area || 'Geral';
      map.set(nome, (map.get(nome) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'));
  }, [aulas]);

  const daArea = useMemo(
    () => (areaAtual ? aulas.filter((a) => (a.area || 'Geral') === areaAtual) : []),
    [aulas, areaAtual],
  );

  const temasDaArea = useMemo(() => {
    const map = new Map<string, AulaAudio[]>();
    for (const a of daArea) {
      const tema = a.tema || 'Aulas';
      map.set(tema, [...(map.get(tema) ?? []), a]);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'));
  }, [daArea]);

  // Lista da aba ativa (favoritas / baixadas / busca)
  const listaAba = useMemo(() => {
    if (aba === 'favoritas') return aulas.filter((a) => favoritos.has(audioIdOf(a)));
    if (aba === 'baixadas') return aulas.filter((a) => baixadas.has(audioIdOf(a)));
    if (aba === 'buscar') {
      const q = normalizar(busca);
      if (!q) return [];
      return aulas.filter((a) =>
        [a.titulo, a.descricao, a.tema, a.area].some((c) => normalizar(String(c ?? '')).includes(q)),
      );
    }
    return [];
  }, [aba, aulas, favoritos, baixadas, busca]);

  const handleTocarAula = useCallback(
    async (a: AulaAudio) => {
      if (gateMes.blocked) {
        gateMes.openGate();
        return;
      }
      if (gateDia.blocked) {
        gateDia.openGate();
        return;
      }
      void gateDia.run();
      void gateMes.run();

      const filaAtual = areaAtual ? daArea : aba === 'aulas' ? aulas : listaAba;
      await tocar(a, filaAtual);
    },
    [gateDia, gateMes, areaAtual, daArea, aba, aulas, listaAba, tocar],
  );

  /* ─── Item de Aula ─── */
  const LinhaAula = ({ a, indice }: { a: AulaAudio; indice?: number }) => {
    const ativo = a.id === atualId;
    const fav = favoritos.has(audioIdOf(a));
    return (
      <div
        className={`flex items-center gap-3 px-3 py-3 rounded-xl transition ${
          ativo ? 'bg-primary/15 border border-primary/20 shadow-sm' : 'hover:bg-white/5'
        }`}
      >
        <button
          onClick={() => void handleTocarAula(a)}
          disabled={!a.url_audio}
          className="flex items-center gap-3 min-w-0 flex-1 text-left disabled:opacity-50 group"
        >
          <span className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-zinc-800 shadow-md">
            <img
              src={capaDaArea(a.area || '')}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
            <span className="absolute inset-0 grid place-items-center bg-black/40 text-white transition-opacity">
              {ativo && tocando ? (
                <Pause className="h-5 w-5 text-primary fill-primary" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-semibold truncate ${ativo ? 'text-primary' : 'text-foreground'}`}>
              {typeof indice === 'number' ? `${indice}. ` : ''}
              {a.titulo}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {a.url_audio ? a.tema || a.area : 'Áudio em breve'}
            </p>
          </div>
        </button>

        <BotaoDownload aula={a} />

        <button
          onClick={() => alternarFavorito(a)}
          aria-label={fav ? 'Remover dos favoritos' : 'Favoritar'}
          className="h-8 w-8 grid place-items-center rounded-full hover:bg-white/10 shrink-0 transition active:scale-95"
        >
          <Heart className={`h-4 w-4 ${fav ? 'fill-rose-400 text-rose-400' : 'text-muted-foreground'}`} />
        </button>
      </div>
    );
  };

  const heroTitulo = areaAtual ?? 'Audioaulas';
  const heroSub = areaAtual ? 'Aulas em áudio para ouvir e revisar.' : 'Aprenda ouvindo, por área do Direito.';

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-background to-background text-foreground pb-40">
      {gateDia.gateNode}
      {gateMes.gateNode}

      {/* Hero Header */}
      <div className="relative px-4 pt-8 pb-6 overflow-hidden sm:px-6 lg:px-10 lg:pt-12 lg:pb-10">
        <div className="absolute inset-0 -z-10">
          <img
            src={areaAtual ? capaDaArea(areaAtual) : CAPA_HUB}
            alt=""
            aria-hidden
            className="w-full h-full object-cover opacity-35 scale-110 blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-background/80 to-background" />
        </div>

        <div className="mx-auto w-full max-w-[1400px] 2xl:max-w-[1600px]">
          <button
            onClick={() => (areaAtual ? navigate('/audioaulas') : navigate('/'))}
            aria-label="Voltar"
            className="mb-4 grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-full bg-white/10 text-foreground backdrop-blur-md transition hover:bg-white/20 active:scale-95"
          >
            <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          <div className="flex items-center gap-4 lg:gap-8">
            <span className="relative h-24 w-24 sm:h-32 sm:w-32 lg:h-44 lg:w-44 shrink-0 rounded-2xl overflow-hidden shadow-2xl shadow-black/70 border border-white/10">
              <img
                src={areaAtual ? capaDaArea(areaAtual) : CAPA_HUB}
                alt=""
                className="h-full w-full object-cover"
              />
            </span>
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary text-[11px] font-semibold uppercase tracking-widest mb-2 border border-primary/30">
                <Headphones className="h-3.5 w-3.5" /> {areaAtual ? 'Área' : 'Acervo'}
              </span>
              <h1 className="text-2xl sm:text-4xl lg:text-6xl font-black tracking-tight leading-none text-white">
                {heroTitulo}
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-zinc-300 mt-1.5">{heroSub}</p>
              {!loading && (
                <p className="text-xs text-zinc-400 mt-1 font-medium">
                  {areaAtual ? daArea.length : aulas.length} aula(s) disponível(is)
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 grid place-items-center text-muted-foreground">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : areaAtual ? (
        /* ───────── LISTA DA ÁREA ───────── */
        <div className="mx-auto w-full max-w-[1400px] px-4 space-y-6 mt-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8 lg:space-y-0 lg:px-10 2xl:max-w-[1600px] 2xl:grid-cols-3">
          {temasDaArea.length === 0 && (
            <p className="py-16 text-center text-sm text-muted-foreground col-span-full">
              Aulas em breve nesta área.
            </p>
          )}
          {temasDaArea.map(([tema, lista]) => (
            <section key={tema} className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-3 sm:p-4">
              <h2 className="text-base sm:text-lg font-bold text-white mb-3 px-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                {tema}
              </h2>
              <div className="divide-y divide-white/[0.06]">
                {lista.map((a, i) => (
                  <LinhaAula key={a.id} a={a} indice={a.sequencia ?? i + 1} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : aba === 'aulas' ? (
        /* ───────── HUB DE ÁREAS ───────── */
        <div className="mx-auto w-full max-w-[1400px] px-4 space-y-8 mt-4 lg:px-10 2xl:max-w-[1600px]">
          {areas.length === 0 ? (
            <div className="rounded-2xl bg-white/[0.04] p-10 text-center border border-white/10">
              <Headphones className="w-10 h-10 text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma audioaula publicada ainda.</p>
            </div>
          ) : (
            <section>
              <h2 className="text-lg sm:text-xl font-bold mb-4 text-white">Áreas do Direito</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-5 xl:grid-cols-5">
                {areas.map(([nome, total]) => (
                  <button
                    key={nome}
                    onClick={() => navigate(`/audioaulas/${encodeURIComponent(nome)}`)}
                    className="group relative aspect-square rounded-2xl overflow-hidden text-left transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-primary/20 border border-white/10 active:scale-95"
                  >
                    <img
                      src={capaDaArea(nome)}
                      alt={nome}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    <div className="absolute inset-0 p-3.5 flex flex-col justify-between">
                      <span className="self-start h-9 w-9 grid place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-black/40">
                        <Headphones className="h-5 w-5" />
                      </span>
                      <div className="flex items-end justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold leading-tight text-white text-sm sm:text-base truncate">
                            {nome}
                          </p>
                          <p className="text-[11px] text-zinc-300">{total} aula(s)</p>
                        </div>
                        <span className="shrink-0 h-8 w-8 grid place-items-center rounded-full bg-white/20 text-white backdrop-blur group-hover:bg-primary group-hover:text-primary-foreground transition">
                          <ChevronRight className="h-5 w-5" />
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        /* ───────── ABAS: favoritas / baixadas / buscar ───────── */
        <div className="mx-auto w-full max-w-[1400px] px-4 space-y-4 mt-4 lg:px-10 2xl:max-w-[1600px]">
          {aba === 'buscar' && (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={buscaRef}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar aula, tema ou área..."
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary/50 focus:bg-white/10"
              />
              {busca && (
                <button
                  onClick={() => setBusca('')}
                  aria-label="Limpar busca"
                  className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

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
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-2 divide-y divide-white/[0.06] lg:grid lg:grid-cols-2 lg:divide-y-0 lg:gap-2 2xl:grid-cols-3">
              {listaAba.map((a) => (
                <LinhaAula key={a.id} a={a} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Player Completo Expandido — Adaptado como Modal Centralizado em Desktop */}
      {atual && (
        <>
          {/* Backdrop escuro para desktop */}
          <div
            onClick={() => setAberto(false)}
            aria-hidden
            className={`fixed inset-0 z-50 bg-black/75 backdrop-blur-md transition-opacity duration-300 ${
              aberto ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
          />

          <div
            className={`fixed inset-0 z-[55] flex flex-col transition-all duration-300 ease-out lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-xl lg:h-[88vh] lg:max-h-[720px] lg:rounded-3xl lg:border lg:border-white/15 lg:shadow-2xl lg:shadow-black/90 lg:overflow-hidden ${
              aberto
                ? 'translate-y-0 opacity-100 scale-100'
                : 'translate-y-full lg:translate-y-[-40%] lg:scale-95 opacity-0 pointer-events-none'
            }`}
          >
            <div className="absolute inset-0 -z-10 bg-zinc-950">
              <img
                src={capaDaArea(atual.area || '')}
                alt=""
                aria-hidden
                className="w-full h-full object-cover opacity-25 blur-3xl scale-150"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-zinc-950/90 to-black" />
            </div>

          {/* Header do Player */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
            <button
              onClick={() => setAberto(false)}
              aria-label="Minimizar player"
              className="h-11 w-11 grid place-items-center rounded-full hover:bg-white/10 text-white transition active:scale-95"
            >
              <ChevronDown className="h-6 w-6" />
            </button>
            <div className="text-center min-w-0">
              <p className="text-[11px] uppercase tracking-widest font-semibold text-primary">Em Reprodução</p>
              <p className="text-sm font-bold text-white truncate max-w-[60vw]">{atual.area}</p>
            </div>
            <div className="h-11 w-11" />
          </div>

          {/* Conteúdo Principal do Player */}
          <div className="mx-auto w-full max-w-xl flex-1 min-h-0 flex flex-col justify-center px-6 pb-12">
            <div className="relative flex items-center justify-center my-auto">
              <span className="h-52 w-52 sm:h-64 sm:w-64 rounded-3xl overflow-hidden shadow-2xl shadow-black/80 border border-white/10">
                <img src={capaDaArea(atual.area || '')} alt="" className="h-full w-full object-cover" />
              </span>
              <button
                onClick={() => alternarFavorito(atual)}
                aria-label={favoritos.has(audioIdOf(atual)) ? 'Remover dos favoritos' : 'Favoritar'}
                className="absolute right-2 top-1/2 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-black/40 backdrop-blur-md transition hover:bg-white/20 active:scale-95"
              >
                <Heart
                  className={`h-6 w-6 transition ${
                    favoritos.has(audioIdOf(atual)) ? 'fill-rose-500 text-rose-500' : 'text-white'
                  }`}
                />
              </button>
            </div>

            <div className="mt-4 text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight line-clamp-2">
                {atual.titulo}
              </h2>
              <p className="text-sm font-medium text-primary mt-1 truncate">{atual.tema || atual.area}</p>
              {atual.descricao && (
                <p className="text-xs text-zinc-400 mt-2 line-clamp-2">{atual.descricao}</p>
              )}
            </div>

            {/* Progresso de Áudio */}
            <div className="mt-6">
              <input
                type="range"
                min={0}
                max={dur || 0}
                step={0.1}
                value={tempo}
                onChange={(e) => seek(Number(e.target.value))}
                aria-label="Progresso da aula"
                className="w-full accent-primary h-2 rounded-lg bg-white/10 cursor-pointer"
              />
              <div className="flex items-center justify-between text-xs font-semibold tabular-nums text-zinc-400 mt-1.5">
                <span>{fmt(tempo)}</span>
                <span>{fmt(dur)}</span>
              </div>
            </div>

            {/* Controles de Reprodução */}
            <div className="mt-6 flex items-center justify-center gap-6">
              <button
                onClick={() => seek(Math.max(0, tempo - 15))}
                aria-label="Voltar 15 segundos"
                title="Voltar 15s"
                className="h-10 w-10 grid place-items-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition active:scale-95"
              >
                <RotateCcw className="h-5 w-5" />
              </button>

              <button
                onClick={() => pular(-1)}
                disabled={atualIdx <= 0}
                aria-label="Aula anterior"
                className="h-12 w-12 grid place-items-center rounded-full text-white hover:bg-white/10 disabled:opacity-30 transition active:scale-95"
              >
                <SkipBack className="h-6 w-6" />
              </button>

              <button
                onClick={togglePlay}
                aria-label={tocando ? 'Pausar' : 'Tocar'}
                className="h-16 w-16 grid place-items-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/40 active:scale-95 transition hover:scale-105"
              >
                {tocando ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
              </button>

              <button
                onClick={() => pular(1)}
                disabled={atualIdx < 0 || atualIdx >= fila.length - 1}
                aria-label="Próxima aula"
                className="h-12 w-12 grid place-items-center rounded-full text-white hover:bg-white/10 disabled:opacity-30 transition active:scale-95"
              >
                <SkipForward className="h-6 w-6" />
              </button>

              <button
                onClick={() => seek(Math.min(dur, tempo + 15))}
                aria-label="Avançar 15 segundos"
                title="Avançar 15s"
                className="h-10 w-10 grid place-items-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition active:scale-95"
              >
                <RotateCw className="h-5 w-5" />
              </button>
            </div>

            {/* Opções de Velocidade e Download */}
            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
              <div className="flex items-center gap-1.5">
                <Gauge className="h-4 w-4 text-primary mr-1" />
                {VELOCIDADES.map((v) => (
                  <button
                    key={v}
                    onClick={() => setVelocidade(v)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      velocidade === v
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                    }`}
                  >
                    {v}x
                  </button>
                ))}
              </div>

              <BotaoDownload aula={atual} grande />
            </div>
          </div>
        </div>
      </>
    )}

      {/* Navegação Inferior das Áudio Aulas */}
      <AudioaulasBottomNav
        ativo={areaAtual ? null : aba}
        hidden={aberto}
        onSelect={(t) => {
          if (areaAtual) navigate('/audioaulas');
          setAba(t);
          setAberto(false);
          if (t === 'buscar') window.setTimeout(() => buscaRef.current?.focus(), 150);
        }}
      />
    </div>
  );
};

export default Audioaulas;
