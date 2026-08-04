import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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
  Search,
  SkipBack,
  SkipForward,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { registrarMidia, clearMediaSession } from '@/lib/mediaSession';
import { telaAcesa } from '@/lib/nativo/telaAcordada';
import {
  baixarAudioOffline,
  removerAudioOffline,
  estaBaixado,
  fonteDeAudio,
  suportaAudioOffline,
  assinarAudioOffline,
} from '@/lib/nativo/audioOffline';
import AudioaulasBottomNav, { type AudioaulasTab } from '@/components/audioaulas/AudioaulasBottomNav';
import { srcOf } from '@/lib/assetUrl';
import capaAudioaulas from '@/assets/atalho-audioaulas.webp.asset.json';
import capaPenal from '@/assets/direito-penal.webp.asset.json';
import capaCivil from '@/assets/direito-civil.webp.asset.json';
import capaConstituicao from '@/assets/direito-constituicao.webp.asset.json';
import capaClt from '@/assets/direito-clt.webp.asset.json';

interface Aula {
  id: number;
  area: string;
  tema: string | null;
  sequencia: number | null;
  titulo: string;
  descricao: string | null;
  url_audio: string | null;
}

const CAPA_HUB = srcOf(capaAudioaulas);
const CAPAS: { re: RegExp; url: string }[] = [
  { re: /penal|processo penal/i, url: srcOf(capaPenal) },
  { re: /civil/i, url: srcOf(capaCivil) },
  { re: /constitu/i, url: srcOf(capaConstituicao) },
  { re: /trabalh|clt/i, url: srcOf(capaClt) },
];
const capaDaArea = (area: string) => CAPAS.find((c) => c.re.test(area))?.url || CAPA_HUB;

const FAV_KEY = 'aa_favoritos';
const lerFavoritos = (): Set<string> => {
  try {
    return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]'));
  } catch {
    return new Set();
  }
};

const normalizar = (s: string) =>
  (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const fmt = (s: number) => {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const audioIdOf = (a: Aula) => `audioaula-${a.id}`;

/** Botão de download offline reaproveitado nas listas e no player. */
function BotaoDownload({ aula, grande = false }: { aula: Aula; grande?: boolean }) {
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
      className={`${size} grid place-items-center rounded-full shrink-0 transition hover:bg-white/10 disabled:opacity-60 ${
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

  const [aulas, setAulas] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoritos, setFavoritos] = useState<Set<string>>(() => lerFavoritos());
  const [baixadas, setBaixadas] = useState<Set<string>>(new Set());
  const [aba, setAba] = useState<AudioaulasTab>('aulas');
  const [busca, setBusca] = useState('');

  // Player
  const ref = useRef<HTMLAudioElement | null>(null);
  const [atualId, setAtualId] = useState<number | null>(null);
  const [tocando, setTocando] = useState(false);
  const [tempo, setTempo] = useState(0);
  const [dur, setDur] = useState(0);
  const [aberto, setAberto] = useState(false);
  const buscaRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('audioaulas_acervo')
        .select('id, area, tema, sequencia, titulo, descricao, url_audio')
        .order('area', { ascending: true })
        .order('sequencia', { ascending: true });
      if (!ativo) return;
      setAulas((data ?? []) as Aula[]);
      setLoading(false);
    })();
    return () => {
      ativo = false;
    };
  }, []);

  // Mantém a lista de aulas já baixadas para a aba "Baixadas".
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

  const alternarFavorito = (a: Aula) => {
    setFavoritos((s) => {
      const n = new Set(s);
      const k = audioIdOf(a);
      n.has(k) ? n.delete(k) : n.add(k);
      try {
        localStorage.setItem(FAV_KEY, JSON.stringify([...n]));
      } catch {
        /* ignore */
      }
      return n;
    });
  };

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
    const map = new Map<string, Aula[]>();
    for (const a of daArea) {
      const tema = a.tema || 'Aulas';
      map.set(tema, [...(map.get(tema) ?? []), a]);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'));
  }, [daArea]);

  // Lista da aba ativa (favoritas / baixadas / busca).
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

  // Fila de reprodução: área aberta > aba ativa > acervo inteiro.
  const fila = useMemo(() => {
    const base = areaAtual ? daArea : aba === 'aulas' ? aulas : listaAba;
    return base.filter((a) => a.url_audio);
  }, [areaAtual, daArea, aba, aulas, listaAba]);

  const atual = useMemo(() => aulas.find((a) => a.id === atualId) ?? null, [aulas, atualId]);
  const atualIdx = useMemo(() => fila.findIndex((a) => a.id === atualId), [fila, atualId]);

  useEffect(() => {
    void telaAcesa('audioaulas', tocando);
    return () => {
      void telaAcesa('audioaulas', false);
    };
  }, [tocando]);

  const tocar = useCallback(
    async (a: Aula) => {
      const el = ref.current;
      if (!el || !a.url_audio) return;
      if (atualId === a.id) {
        if (el.paused) await el.play();
        else el.pause();
        setAberto(true);
        return;
      }
      setAtualId(a.id);
      setTempo(0);
      setDur(0);
      setAberto(true);
      const src = await fonteDeAudio(audioIdOf(a), a.url_audio);
      el.src = src;
      await el.play().catch(() => {});
      registrarMidia({
        titulo: a.titulo,
        subtitulo: a.tema || a.area,
        album: 'Audioaulas',
        audio: el,
        onStop: () => {
          el.pause();
          setTocando(false);
        },
      });
    },
    [atualId],
  );

  const pular = (delta: number) => {
    if (atualIdx < 0) return;
    const prox = fila[atualIdx + delta];
    if (prox) void tocar(prox);
  };

  /* ─── Linha de aula (mesmo padrão das faixas de Leis Cantadas) ─── */
  const LinhaAula = ({ a, indice }: { a: Aula; indice?: number }) => {
    const ativo = a.id === atualId;
    const fav = favoritos.has(audioIdOf(a));
    return (
      <div
        className={`flex items-center gap-3 px-2.5 py-3 transition ${ativo ? 'bg-white/10' : 'hover:bg-white/5'}`}
      >
        <button
          onClick={() => void tocar(a)}
          disabled={!a.url_audio}
          className="flex items-center gap-3 min-w-0 flex-1 text-left disabled:opacity-60"
        >
          <span className="relative h-11 w-11 shrink-0 rounded-lg overflow-hidden bg-primary/20">
            <img
              src={capaDaArea(a.area || '')}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-0 grid place-items-center bg-black/35 text-white">
              {ativo && tocando ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-semibold truncate ${ativo ? 'text-primary' : ''}`}>
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
          className="h-8 w-8 grid place-items-center rounded-full hover:bg-white/10 shrink-0"
        >
          <Heart className={`h-4 w-4 ${fav ? 'fill-rose-400 text-rose-400' : 'text-muted-foreground'}`} />
        </button>
      </div>
    );
  };

  const heroTitulo = areaAtual ?? 'Audioaulas';
  const heroSub = areaAtual ? 'Aulas em áudio para ouvir e revisar.' : 'Aprenda ouvindo, por área do Direito.';

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-background to-background text-foreground pb-40">
      {/* Hero */}
      <div className="relative px-5 pt-10 pb-6 overflow-hidden lg:px-10 lg:pt-12 lg:pb-10">
        <div className="absolute inset-0 -z-10">
          <img
            src={areaAtual ? capaDaArea(areaAtual) : CAPA_HUB}
            alt=""
            aria-hidden
            className="w-full h-full object-cover opacity-40 scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/25 via-background/60 to-black" />
        </div>

        <div className="mx-auto w-full max-w-[1400px] 2xl:max-w-[1600px]">
        <button
          onClick={() => (areaAtual ? navigate('/audioaulas') : navigate('/'))}
          aria-label="Voltar"
          className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-foreground backdrop-blur transition hover:bg-white/20 active:scale-95"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>

        <div className="flex items-center gap-4 lg:gap-8">
          <span className="relative h-28 w-28 sm:h-32 sm:w-32 lg:h-44 lg:w-44 shrink-0 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
            <img
              src={areaAtual ? capaDaArea(areaAtual) : CAPA_HUB}
              alt=""
              className="h-full w-full object-cover"
            />
          </span>
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-[11px] font-semibold uppercase tracking-widest mb-2">
              <Headphones className="h-3.5 w-3.5" /> {areaAtual ? 'Área' : 'Acervo'}
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black tracking-tight leading-none">{heroTitulo}</h1>
            <p className="text-sm lg:text-base text-muted-foreground mt-1.5">{heroSub}</p>
            {!loading && (
              <p className="text-xs text-muted-foreground mt-1">
                {areaAtual ? daArea.length : aulas.length} aula(s)
              </p>
            )}
          </div>
        </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 grid place-items-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : areaAtual ? (
        /* ───────── LISTA DA ÁREA ───────── */
        <div className="mx-auto w-full max-w-[1400px] px-4 space-y-6 mt-2 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8 lg:space-y-0 lg:px-10 2xl:max-w-[1600px] 2xl:grid-cols-3">
          {temasDaArea.length === 0 && (
            <p className="py-16 text-center text-sm text-muted-foreground">Aulas em breve nesta área.</p>
          )}
          {temasDaArea.map(([tema, lista]) => (
            <section key={tema}>
              <h2 className="text-lg lg:text-xl font-bold mb-2">{tema}</h2>
              <div className="rounded-2xl bg-white/[0.03] divide-y divide-white/[0.06] overflow-hidden">
                {lista.map((a, i) => (
                  <LinhaAula key={a.id} a={a} indice={a.sequencia ?? i + 1} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : aba === 'aulas' ? (
        /* ───────── HUB ───────── */
        <div className="mx-auto w-full max-w-[1400px] px-4 space-y-8 mt-2 lg:px-10 2xl:max-w-[1600px]">
          {areas.length === 0 ? (
            <div className="rounded-2xl bg-white/[0.04] p-10 text-center">
              <Headphones className="w-10 h-10 text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma audioaula publicada ainda.</p>
            </div>
          ) : (
            <section>
              <h2 className="text-lg font-bold mb-3">Áreas</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5 2xl:grid-cols-5">
                {areas.map(([nome, total]) => (
                  <button
                    key={nome}
                    onClick={() => navigate(`/audioaulas/${encodeURIComponent(nome)}`)}
                    className="group relative aspect-square rounded-2xl overflow-hidden text-left transition-transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/50"
                  >
                    <img
                      src={capaDaArea(nome)}
                      alt={nome}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    <div className="absolute inset-0 p-3 flex flex-col justify-between">
                      <span className="self-start h-9 w-9 grid place-items-center rounded-lg bg-primary text-primary-foreground shadow-lg">
                        <Headphones className="h-5 w-5" />
                      </span>
                      <div className="flex items-end justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold leading-tight text-white truncate">{nome}</p>
                          <p className="text-[11px] text-white/70">{total} aula(s)</p>
                        </div>
                        <span className="shrink-0 h-8 w-8 grid place-items-center rounded-full bg-white/15 text-white group-hover:bg-white/25 transition">
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
        <div className="mx-auto w-full max-w-[1400px] px-4 space-y-4 mt-2 lg:px-10 2xl:max-w-[1600px]">
          {aba === 'buscar' && (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={buscaRef}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar aula, tema ou área..."
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary/40"
              />
              {busca && (
                <button
                  onClick={() => setBusca('')}
                  aria-label="Limpar busca"
                  className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          <h2 className="text-lg font-bold">
            {aba === 'favoritas' ? 'Favoritas' : aba === 'baixadas' ? 'Baixadas' : 'Resultados'}
          </h2>

          {listaAba.length === 0 ? (
            <p className="py-14 text-center text-sm text-muted-foreground">
              {aba === 'favoritas'
                ? 'Nenhuma favorita ainda. Toque no coração de uma aula.'
                : aba === 'baixadas'
                  ? 'Nenhuma aula baixada. Toque no ícone de download.'
                  : busca.trim()
                    ? 'Nada encontrado para sua busca.'
                    : 'Digite para buscar uma aula.'}
            </p>
          ) : (
            <div className="rounded-2xl bg-white/[0.03] divide-y divide-white/[0.06] overflow-hidden lg:grid lg:grid-cols-2 lg:divide-y-0 lg:gap-px 2xl:grid-cols-3">
              {listaAba.map((a) => (
                <LinhaAula key={a.id} a={a} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mini player */}
      {atual && !aberto && (
        <button
          onClick={() => setAberto(true)}
          className="fixed left-3 right-3 bottom-[calc(5.25rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] z-40 flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900/95 px-3 py-2.5 text-left backdrop-blur shadow-2xl shadow-black/50 md:left-1/2 md:right-auto md:w-[420px] md:-translate-x-1/2"
        >
          <span className="h-10 w-10 shrink-0 rounded-lg overflow-hidden">
            <img src={capaDaArea(atual.area || '')} alt="" className="h-full w-full object-cover" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold truncate">{atual.titulo}</span>
            <span className="block text-[11px] text-muted-foreground truncate">
              {atual.tema || atual.area}
            </span>
          </span>
          <span
            onClick={(e) => {
              e.stopPropagation();
              void tocar(atual);
            }}
            className="h-10 w-10 grid place-items-center rounded-full bg-primary text-primary-foreground shrink-0"
          >
            {tocando ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </span>
        </button>
      )}

      {/* Player em tela cheia (mesmo padrão das Leis Cantadas) */}
      {atual && (
        <div
          className={`fixed inset-0 z-50 flex flex-col transition-transform duration-300 ease-out ${
            aberto ? 'translate-y-0' : 'translate-y-full pointer-events-none'
          }`}
        >
          <div className="absolute inset-0 -z-10 bg-zinc-950">
            <img
              src={capaDaArea(atual.area || '')}
              alt=""
              aria-hidden
              className="w-full h-full object-cover opacity-30 blur-2xl scale-125"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-primary/25 via-zinc-950/90 to-black" />
          </div>

          <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
            <button
              onClick={() => setAberto(false)}
              aria-label="Minimizar player"
              className="h-11 w-11 grid place-items-center rounded-full hover:bg-white/10"
            >
              <ChevronDown className="h-6 w-6" />
            </button>
            <div className="text-center min-w-0">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Tocando</p>
              <p className="text-sm font-semibold truncate max-w-[60vw]">{atual.area}</p>
            </div>
            <div className="h-11 w-11" />
          </div>

          <div className="mx-auto w-full max-w-2xl flex-1 min-h-0 flex flex-col justify-center px-6 pb-10">
            <div className="relative flex items-center justify-center">
              <span className="h-44 w-44 sm:h-52 sm:w-52 rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
                <img src={capaDaArea(atual.area || '')} alt="" className="h-full w-full object-cover" />
              </span>
              <button
                onClick={() => alternarFavorito(atual)}
                aria-label={favoritos.has(audioIdOf(atual)) ? 'Remover dos favoritos' : 'Favoritar'}
                className="absolute right-0 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/10 backdrop-blur transition hover:bg-white/20 active:scale-95"
              >
                <Heart
                  className={`h-5 w-5 transition ${
                    favoritos.has(audioIdOf(atual)) ? 'fill-rose-400 text-rose-400' : 'text-white/80'
                  }`}
                />
              </button>
            </div>

            <div className="mt-6">
              <h2 className="text-2xl font-black tracking-tight line-clamp-2">{atual.titulo}</h2>
              <p className="text-sm text-muted-foreground truncate">{atual.tema || atual.area}</p>
              {atual.descricao && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{atual.descricao}</p>
              )}
            </div>

            {/* Progresso */}
            <div className="mt-6">
              <input
                type="range"
                min={0}
                max={dur || 0}
                step={0.1}
                value={tempo}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (ref.current) ref.current.currentTime = v;
                  setTempo(v);
                }}
                aria-label="Progresso da aula"
                className="w-full accent-primary"
              />
              <div className="flex items-center justify-between text-[11px] tabular-nums text-muted-foreground">
                <span>{fmt(tempo)}</span>
                <span>{fmt(dur)}</span>
              </div>
            </div>

            {/* Controles */}
            <div className="mt-4 flex items-center justify-center gap-6">
              <button
                onClick={() => pular(-1)}
                disabled={atualIdx <= 0}
                aria-label="Aula anterior"
                className="h-12 w-12 grid place-items-center rounded-full hover:bg-white/10 disabled:opacity-30"
              >
                <SkipBack className="h-6 w-6" />
              </button>
              <button
                onClick={() => void tocar(atual)}
                aria-label={tocando ? 'Pausar' : 'Tocar'}
                className="h-16 w-16 grid place-items-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 active:scale-95 transition"
              >
                {tocando ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 ml-1" />}
              </button>
              <button
                onClick={() => pular(1)}
                disabled={atualIdx < 0 || atualIdx >= fila.length - 1}
                aria-label="Próxima aula"
                className="h-12 w-12 grid place-items-center rounded-full hover:bg-white/10 disabled:opacity-30"
              >
                <SkipForward className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-5 flex items-center justify-center">
              <BotaoDownload aula={atual} grande />
            </div>
          </div>
        </div>
      )}

      <audio
        ref={ref}
        preload="none"
        onTimeUpdate={(e) => setTempo(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration || 0)}
        onPlay={() => setTocando(true)}
        onPause={() => setTocando(false)}
        onEnded={(e) => {
          setTocando(false);
          clearMediaSession(e.currentTarget);
          if (atualIdx >= 0 && fila[atualIdx + 1]) void tocar(fila[atualIdx + 1]);
        }}
      />

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
