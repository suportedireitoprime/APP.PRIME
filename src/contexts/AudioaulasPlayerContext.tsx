import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useGatedFeature } from '@/hooks/useGatedFeature';
import { supabase } from '@/integrations/supabase/client';
import { registrarMidia, clearMediaSession } from '@/lib/mediaSession';
import { telaAcesa } from '@/lib/nativo/telaAcordada';
import { fonteDeAudio } from '@/lib/nativo/audioOffline';
import { notifyMediaPlay, subscribeMediaPlay } from '@/lib/mediaCoordinator';
import { toast } from 'sonner';
import {
  salvarProgressoAudioaula,
  obterUltimoProgressoAudioaula,
  normalizarStreamAudio,
  marcarAulaConcluida,
} from '@/lib/audioaulaProgresso';
import { R2_VACATIO_AUDIO_BASE_URL, safeStorageUrl } from '@/lib/cdnImg';
import { NOVAS_AUDIOAULAS_CATALOG } from '@/data/novasAudioaulasCatalog';
import { get as idbGet, set as idbSet } from 'idb-keyval';

export const AUDIOAULAS_CACHE_KEY = 'audioaulas_acervo_cache_v2';
let memoryAulasCache: AulaAudio[] | null = null;

export const INTRO_AUDIOAULA_URL = `${R2_VACATIO_AUDIO_BASE_URL}/audios/vinhetas/intro_audioaulas.mp3`;

export interface AulaAudio {
  id: number;
  area: string;
  tema: string | null;
  sequencia: number | null;
  titulo: string;
  descricao: string | null;
  url_audio: string | null;
  r2_key?: string | null;
}

interface AudioaulasPlayerContextType {
  aulas: AulaAudio[];
  loading: boolean;
  atualId: number | null;
  atual: AulaAudio | null;
  atualIdx: number;
  tocando: boolean;
  tempo: number;
  dur: number;
  velocidade: number;
  aberto: boolean;
  fila: AulaAudio[];
  favoritos: Set<string>;
  alternarFavorito: (a: AulaAudio) => void;
  setAberto: (v: boolean) => void;
  tocar: (a: AulaAudio, customFila?: AulaAudio[], tempoInicial?: number, pularIntro?: boolean) => Promise<boolean>;
  retomarUltimoProgresso: () => void;
  togglePlay: () => void;
  pular: (dir: 1 | -1) => void;
  seek: (v: number) => void;
  setVelocidade: (rate: number) => void;
  fechar: () => void;
  audioRef: React.RefObject<HTMLAudioElement>;
  tocandoIntro: boolean;
  openGate: () => void;
  gateBlocked: boolean;
}

const FAV_KEY = 'aa_favoritos';
const lerFavoritos = (): Set<string> => {
  try {
    return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]'));
  } catch {
    return new Set();
  }
};

export const audioIdOf = (a: AulaAudio) => `audioaula-${a.id}`;

const fallbackAudioRef: React.RefObject<HTMLAudioElement> = { current: null };

const fallbackAudioaulasContext: AudioaulasPlayerContextType = {
  aulas: [],
  loading: false,
  atualId: null,
  atual: null,
  atualIdx: -1,
  tocando: false,
  tempo: 0,
  dur: 0,
  velocidade: 1,
  aberto: false,
  fila: [],
  favoritos: new Set(),
  alternarFavorito: () => {},
  setAberto: () => {},
  tocar: async () => false,
  retomarUltimoProgresso: () => {},
  togglePlay: () => {},
  pular: () => {},
  seek: () => {},
  setVelocidade: () => {},
  fechar: () => {},
  audioRef: fallbackAudioRef,
  tocandoIntro: false,
  openGate: () => {},
  gateBlocked: false,
};

const Ctx = createContext<AudioaulasPlayerContextType | undefined>(undefined);

export function useAudioaulasPlayer() {
  const ctx = useContext(Ctx);
  return ctx ?? fallbackAudioaulasContext;
}

export const AudioaulasPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [aulas, setAulas] = useState<AulaAudio[]>(() => memoryAulasCache ?? []);
  const [loading, setLoading] = useState(() => !memoryAulasCache || memoryAulasCache.length === 0);
  const [atualId, setAtualId] = useState<number | null>(null);
  const [tocando, setTocando] = useState(false);
  const [tempo, setTempo] = useState(0);
  const [dur, setDur] = useState(0);
  const [velocidade, setVelocidadeState] = useState(1);
  const [aberto, setAberto] = useState(false);
  const [favoritos, setFavoritos] = useState<Set<string>>(() => lerFavoritos());
  const [filaCustom, setFilaCustom] = useState<AulaAudio[] | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const introAudioRef = useRef<HTMLAudioElement>(null);
  const aulaSobrepostaIniciadaRef = useRef(false);
  const pularRef = useRef<(dir: 1 | -1) => void>(() => {});
  const gateMes = useGatedFeature('audioaula_mes', 'audioaula', { scope: null });

  // Carregamento e cache aquecido das aulas (Offline-First / Stale-While-Revalidate a 0ms)
  useEffect(() => {
    let cancelado = false;

    const carregar = async () => {
      // 1. Hidratação instantânea do IndexedDB caso o cache em memória ainda esteja vazio
      if (!memoryAulasCache || memoryAulasCache.length === 0) {
        try {
          const cached = await idbGet<AulaAudio[]>(AUDIOAULAS_CACHE_KEY);
          if (cached && Array.isArray(cached) && cached.length > 0 && !cancelado) {
            memoryAulasCache = cached;
            setAulas(cached);
            setLoading(false);
          }
        } catch {
          /* ignore idb error */
        }
      }

      // 2. Revalidação em segundo plano no Supabase
      try {
        const todasAulas: AulaAudio[] = [];
        const batchSize = 1000;
        let teveErro = false;

        for (let from = 0; ; from += batchSize) {
          const { data, error } = await supabase
            .from('audioaulas_acervo')
            .select('id, area, tema, sequencia, titulo, descricao, url_audio')
            .order('id', { ascending: true })
            .range(from, from + batchSize - 1);
          if (cancelado) return;
          if (error) {
            console.error('Erro ao revalidar acervo de audioaulas:', error);
            teveErro = true;
            break;
          }
          if (data && data.length > 0) {
            const sanitized = (data as AulaAudio[]).map((aula) => ({
              ...aula,
              url_audio: aula.url_audio ? (safeStorageUrl(aula.url_audio) || aula.url_audio) : null
            }));
            todasAulas.push(...sanitized);
          }
          if (!data || data.length < batchSize) break;
        }
        if (cancelado) return;

        // Se revalidou com sucesso, mescla com o catálogo complementar e atualiza caches
        if (!teveErro && todasAulas.length > 0) {
          const chavesExistentes = new Set(
            todasAulas.map((a) => `${(a.area || '').toLowerCase()}:::${(a.tema || '').toLowerCase()}:::${(a.titulo || '').toLowerCase()}`)
          );
          for (const nova of NOVAS_AUDIOAULAS_CATALOG) {
            const chave = `${(nova.area || '').toLowerCase()}:::${(nova.tema || '').toLowerCase()}:::${(nova.titulo || '').toLowerCase()}`;
            if (!chavesExistentes.has(chave)) {
              todasAulas.push(nova);
            }
          }

          // Ordenação alfabética por Área e Sequência realizada em memória (instantânea a 0ms)
          todasAulas.sort((a, b) => {
            const comp = (a.area || '').localeCompare(b.area || '', 'pt-BR');
            if (comp !== 0) return comp;
            return (a.sequencia ?? 0) - (b.sequencia ?? 0);
          });

          memoryAulasCache = todasAulas;
          setAulas(todasAulas);
          void idbSet(AUDIOAULAS_CACHE_KEY, todasAulas).catch(() => {});
        }
      } catch (err) {
        console.error('Erro ao revalidar acervo de audioaulas:', err);
      } finally {
        if (!cancelado) setLoading(false);
      }
    };

    const idle = (cb: () => void) => {
      const w = window as unknown as { requestIdleCallback?: (cb: () => void, o?: unknown) => void };
      if (typeof w.requestIdleCallback === 'function') w.requestIdleCallback(cb, { timeout: 1500 });
      else setTimeout(cb, 100);
    };

    idle(() => void carregar());
    return () => {
      cancelado = true;
    };
  }, []);

  const alternarFavorito = useCallback((a: AulaAudio) => {
    setFavoritos((prev) => {
      const next = new Set(prev);
      const k = audioIdOf(a);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      try {
        localStorage.setItem(FAV_KEY, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const fila = useMemo(() => {
    if (filaCustom && filaCustom.length > 0) return filaCustom.filter((a) => a.url_audio);
    return aulas.filter((a) => a.url_audio);
  }, [aulas, filaCustom]);

  const atualIdx = useMemo(() => fila.findIndex((a) => a.id === atualId), [fila, atualId]);
  const atual = useMemo(() => aulas.find((a) => a.id === atualId) ?? (atualIdx >= 0 ? fila[atualIdx] : null), [aulas, atualId, fila, atualIdx]);

  // Manter tela acesa enquanto o áudio estiver tocando
  useEffect(() => {
    void telaAcesa('audioaulas', tocando);
    return () => {
      void telaAcesa('audioaulas', false);
    };
  }, [tocando]);

  // Registro na MediaSession nativa
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !atual) return;
    registrarMidia({
      titulo: atual.titulo,
      subtitulo: atual.tema || atual.area,
      album: 'Audioaulas',
      capaUrl: (atual as any).capa_url || (atual as any).url_capa || (atual as any).imagem_url,
      audio: el,
      onNext: atualIdx >= 0 && fila[atualIdx + 1] ? () => pularRef.current(1) : undefined,
      onPrev: atualIdx > 0 ? () => pularRef.current(-1) : undefined,
      onStop: () => {
        el.pause();
        if (introAudioRef.current && !introAudioRef.current.paused) {
          introAudioRef.current.pause();
        }
        setTocando(false);
      },
      onSeek: (t) => {
        if (el) el.currentTime = t;
        setTempo(t);
      },
    });
  }, [atual, atualIdx, fila]);

  // Coordenador Universal: pausa se outro player de mídia iniciar
  useEffect(() => {
    return subscribeMediaPlay((active) => {
      if (active !== 'audioaula') {
        const el = audioRef.current;
        if (el && !el.paused) el.pause();
        const introEl = introAudioRef.current;
        if (introEl && !introEl.paused) introEl.pause();
        setTocando(false);
      }
    });
  }, []);

  const [tocandoIntro, setTocandoIntro] = useState(false);
  const audioAulaPendenteRef = useRef<{ aula: AulaAudio; tempoInicial?: number } | null>(null);
  const tempoInicialRef = useRef<number | null>(null);
  const atualRef = useRef<AulaAudio | null>(null);

  useEffect(() => {
    atualRef.current = atual;
  }, [atual]);

  const tocarConteudoAula = useCallback(
    async (a: AulaAudio, tempoInicial?: number) => {
      const el = audioRef.current;
      if (!el || !a.url_audio) return;
      audioAulaPendenteRef.current = null;
      atualRef.current = a;

      if (typeof tempoInicial === 'number' && tempoInicial > 0) {
        // Inicia 1 segundo antes do tempo registrado para garantir contexto contínuo
        tempoInicialRef.current = Math.max(0, tempoInicial - 1.0);
      } else {
        tempoInicialRef.current = null;
      }

      setAtualId(a.id);
      setTempo(tempoInicialRef.current ?? 0);
      setDur(0);

      try {
        const streamUrl = normalizarStreamAudio(a.url_audio);
        const src = await fonteDeAudio(audioIdOf(a), streamUrl);
        if (el) {
          if (el.src !== src) {
            el.src = src;
          }
          el.playbackRate = velocidade;
          el.volume = 1.0;
          if (tempoInicialRef.current !== null && tempoInicialRef.current > 0) {
            el.currentTime = tempoInicialRef.current;
          }
          notifyMediaPlay('audioaula');
          await el.play().catch((playErr: unknown) => {
            console.warn('[AudioaulasPlayer] play() da aula pausado ou bloqueado:', playErr);
          });
        }
        setTocando(true);
      } catch (err) {
        console.error('[AudioaulasPlayer] Erro ao carregar áudio:', err);
        setTocando(false);
        toast.error('Não foi possível carregar este áudio.');
      }
    },
    [velocidade],
  );

  const tocar = useCallback(
    async (a: AulaAudio, customFila?: AulaAudio[], tempoInicial?: number, pularIntro = false): Promise<boolean> => {
      const el = audioRef.current;
      const introEl = introAudioRef.current;
      if (!a.url_audio) return false;

      atualRef.current = a;
      if (customFila) {
        setFilaCustom(customFila);
      }

      // Se já for a mesma aula tocando/pausada
      if (atualId === a.id) {
        if (el?.paused && (!introEl || introEl.paused)) {
          notifyMediaPlay('audioaula');
          if (tocandoIntro && introEl && introEl.currentTime < (introEl.duration || 0)) {
            await introEl.play().catch(() => {});
          } else if (el) {
            await el.play().catch(() => {});
          }
          setTocando(true);
        } else {
          el?.pause();
          introEl?.pause();
          setTocando(false);
        }
        return true;
      }

      // Se for uma aula nova e o usuário estiver bloqueado pela cota mensal
      if (gateMes.blocked) {
        el?.pause();
        introEl?.pause();
        setTocando(false);
        setTocandoIntro(false);
        gateMes.openGate();
        return false;
      }

      // Registra imediatamente o consumo na cota mensal assim que entra na nova áudio-aula
      if (a?.id || a?.titulo) {
        void gateMes.register(String(a.id ?? a.titulo));
      }

      // Se deve pular intro (ex: retomando progresso do meio da aula ou se tempoInicial for informado)
      if (pularIntro || (typeof tempoInicial === 'number' && tempoInicial > 0)) {
        if (introEl) {
          introEl.pause();
          introEl.currentTime = 0;
          introEl.volume = 1.0;
        }
        setTocandoIntro(false);
        aulaSobrepostaIniciadaRef.current = false;
        await tocarConteudoAula(a, tempoInicial);
        return true;
      }

      // Inicia com a intro exclusiva de audioaulas
      setAtualId(a.id);
      setTempo(0);
      setDur(0);
      setTocandoIntro(true);
      audioAulaPendenteRef.current = { aula: a, tempoInicial };
      aulaSobrepostaIniciadaRef.current = false;

      // Pré-carrega o áudio da aula em buffer no audioRef para disparo instantâneo após a vinheta (0ms de latência)
      void (async () => {
        try {
          const streamUrl = normalizarStreamAudio(a.url_audio!);
          const src = await fonteDeAudio(audioIdOf(a), streamUrl);
          if (audioRef.current) {
            audioRef.current.src = src;
            audioRef.current.playbackRate = velocidade;
            audioRef.current.volume = 1.0;
            audioRef.current.preload = 'auto';
            if (typeof tempoInicial === 'number' && tempoInicial > 0) {
              tempoInicialRef.current = Math.max(0, tempoInicial - 1.0);
            } else {
              tempoInicialRef.current = null;
            }
          }
        } catch (err) {
          console.warn('[AudioaulasPlayer] Erro no pré-carregamento da aula:', err);
        }
      })();

      try {
        if (introEl) {
          introEl.src = INTRO_AUDIOAULA_URL;
          introEl.volume = 1.0;
          introEl.playbackRate = 1.0;
          notifyMediaPlay('audioaula');
          introEl.play().catch((err: unknown) => {
            console.warn('[AudioaulasPlayer] Intro bloqueada ou cancelada, tocando aula diretamente:', err);
            void tocarConteudoAula(a, tempoInicial);
          });
        } else {
          void tocarConteudoAula(a, tempoInicial);
        }
        setTocando(true);
      } catch (err) {
        console.warn('[AudioaulasPlayer] Falha na intro, tocando aula diretamente:', err);
        void tocarConteudoAula(a, tempoInicial);
      }
      return true;
    },
    [atualId, tocarConteudoAula, tocandoIntro, velocidade, gateMes],
  );

  const retomarUltimoProgresso = useCallback(async () => {
    const ultimo = obterUltimoProgressoAudioaula();
    if (!ultimo) return;
    const aulaEncontrada = aulas.find((x) => x.id === ultimo.id);
    if (aulaEncontrada) {
      const tempoRecuado = Math.max(0, (ultimo.tempo || 0) - 1.0);
      const ok = await tocar(aulaEncontrada, undefined, tempoRecuado, true);
      if (ok) {
        setAberto(true);
      }
    }
  }, [aulas, tocar]);

  const togglePlay = useCallback(() => {
    const el = audioRef.current;
    const introEl = introAudioRef.current;
    if (!atual) return;

    if (tocandoIntro && introEl) {
      if (!introEl.paused) {
        introEl.pause();
        setTocando(false);
      } else {
        notifyMediaPlay('audioaula');
        introEl.play().catch(() => {});
        setTocando(true);
      }
      return;
    }

    if (el) {
      if (!el.paused) {
        el.pause();
        setTocando(false);
      } else {
        notifyMediaPlay('audioaula');
        el.play()
          .then(() => setTocando(true))
          .catch((err) => {
            console.error('[AudioaulasPlayer] Erro ao alternar reprodução:', err);
            setTocando(false);
            toast.error('Erro ao reproduzir o áudio.');
          });
      }
    }
  }, [atual, tocandoIntro]);

  const pular = useCallback(
    (dir: 1 | -1) => {
      if (atualIdx < 0) return;
      const prox = fila[atualIdx + dir];
      if (prox) {
        if (gateMes.blocked && atualId !== prox.id) {
          audioRef.current?.pause();
          introAudioRef.current?.pause();
          setTocando(false);
          setTocandoIntro(false);
          gateMes.openGate();
          return;
        }
        if (introAudioRef.current) {
          introAudioRef.current.pause();
          introAudioRef.current.currentTime = 0;
          introAudioRef.current.volume = 1.0;
        }
        setTocandoIntro(false);
        aulaSobrepostaIniciadaRef.current = false;
        void tocar(prox);
      }
    },
    [atualIdx, fila, tocar, gateMes, atualId],
  );

  pularRef.current = pular;

  const seek = useCallback((v: number) => {
    // Se o usuário mexer na barra de progresso, cancela a vinheta e foca no áudio da aula
    if (introAudioRef.current && !introAudioRef.current.paused) {
      introAudioRef.current.pause();
      introAudioRef.current.currentTime = 0;
      setTocandoIntro(false);
    }
    const el = audioRef.current;
    if (el) {
      el.currentTime = v;
      if (el.paused) {
        notifyMediaPlay('audioaula');
        el.play().catch(() => {});
      }
    }
    setTempo(v);
  }, []);

  const setVelocidade = useCallback((rate: number) => {
    setVelocidadeState(rate);
    const el = audioRef.current;
    if (el) el.playbackRate = rate;
  }, []);

  const fechar = useCallback(() => {
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.removeAttribute('src');
      el.load();
      clearMediaSession(el);
    }
    const introEl = introAudioRef.current;
    if (introEl) {
      introEl.pause();
      introEl.removeAttribute('src');
      introEl.load();
      introEl.volume = 1.0;
    }
    setTocando(false);
    setTocandoIntro(false);
    audioAulaPendenteRef.current = null;
    aulaSobrepostaIniciadaRef.current = false;
    setAtualId(null);
    setTempo(0);
    setDur(0);
    setAberto(false);
  }, []);

  // Fade-out suave no final da vinheta (últimos 0.5s) preparando entrada suave da aula
  const onIntroTimeUpdate = useCallback(
    (e: React.SyntheticEvent<HTMLAudioElement>) => {
      const introEl = e.currentTarget;
      const t = introEl.currentTime;
      const d = introEl.duration || 0;

      if (d > 0.6 && t >= d - 0.5) {
        const restante = Math.max(0, d - t);
        introEl.volume = Math.min(1, Math.max(0, restante / 0.5));
      }
    },
    [],
  );

  const onIntroEnded = useCallback(() => {
    setTocandoIntro(false);
    if (introAudioRef.current) {
      introAudioRef.current.volume = 1.0;
    }
    const el = audioRef.current;
    const pendente = audioAulaPendenteRef.current;
    const aulaAlvo = pendente?.aula ?? atualRef.current;
    const tempoAlvo = pendente?.tempoInicial ?? tempoInicialRef.current ?? undefined;
    audioAulaPendenteRef.current = null;
    aulaSobrepostaIniciadaRef.current = false;

    if (el && el.src && el.src !== window.location.href) {
      notifyMediaPlay('audioaula');
      el.playbackRate = velocidade;
      el.volume = 1.0;
      if (typeof tempoAlvo === 'number' && tempoAlvo > 0) {
        el.currentTime = tempoAlvo;
      }
      el.play()
        .then(() => {
          setTocando(true);
        })
        .catch((err) => {
          console.warn('[AudioaulasPlayer] Play direto após vinheta falhou, recarregando:', err);
          if (aulaAlvo) {
            void tocarConteudoAula(aulaAlvo, tempoAlvo);
          }
        });
    } else if (aulaAlvo) {
      void tocarConteudoAula(aulaAlvo, tempoAlvo);
    }
  }, [tocarConteudoAula, velocidade]);

  const onIntroError = useCallback(() => {
    console.warn('[AudioaulasPlayer] Erro na reprodução da intro, iniciando aula diretamente.');
    setTocandoIntro(false);
    const pendente = audioAulaPendenteRef.current;
    const aulaAlvo = pendente?.aula ?? atualRef.current;
    const tempoAlvo = pendente?.tempoInicial ?? tempoInicialRef.current ?? undefined;
    audioAulaPendenteRef.current = null;
    aulaSobrepostaIniciadaRef.current = false;
    if (aulaAlvo) {
      void tocarConteudoAula(aulaAlvo, tempoAlvo);
    }
  }, [tocarConteudoAula]);

  const value: AudioaulasPlayerContextType = {
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
    retomarUltimoProgresso,
    togglePlay,
    pular,
    seek,
    setVelocidade,
    fechar,
    audioRef,
    tocandoIntro,
    openGate: gateMes.openGate,
    gateBlocked: gateMes.blocked,
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      {/* Elemento de áudio principal da áudioaula */}
      <audio
        ref={audioRef}
        preload="auto"
        playsInline
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime;
          setTempo(t);
          const d = e.currentTarget.duration || 0;

          if (atual && t > 1) {
            salvarProgressoAudioaula({
              id: atual.id,
              area: atual.area,
              tema: atual.tema,
              titulo: atual.titulo,
              sequencia: atual.sequencia,
              url_audio: atual.url_audio,
              tempo: t,
              duracao: d,
              timestamp: Date.now(),
            });
          }
        }}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration || 0;
          setDur(d);
          if (
            tempoInicialRef.current !== null &&
            tempoInicialRef.current > 0 &&
            tempoInicialRef.current < d
          ) {
            e.currentTarget.currentTime = tempoInicialRef.current;
            setTempo(tempoInicialRef.current);
            tempoInicialRef.current = null;
          }
        }}
        onPlay={() => setTocando(true)}
        onPause={() => {
          const introEl = introAudioRef.current;
          if (!introEl || introEl.paused) {
            setTocando(false);
          }
        }}
        onError={(e) => {
          console.error('[AudioaulasPlayer] Erro no elemento de áudio:', e);
          setTocando(false);
          toast.error('Erro de carregamento do áudio.');
        }}
        onEnded={() => {
          setTocando(false);
          if (atual) {
            marcarAulaConcluida(atual.id, dur || 0);
          }
          if (atualIdx >= 0 && fila[atualIdx + 1]) {
            const prox = fila[atualIdx + 1];
            if (gateMes.blocked && atualId !== prox.id) {
              gateMes.openGate();
            } else {
              void tocar(prox);
            }
          } else {
            clearMediaSession(audioRef.current);
          }
        }}
      />

      {/* Elemento de áudio dedicado à vinheta de abertura (sobreposição com a aula 1s antes) */}
      <audio
        ref={introAudioRef}
        preload="auto"
        playsInline
        onTimeUpdate={onIntroTimeUpdate}
        onEnded={onIntroEnded}
        onError={onIntroError}
      />
      {gateMes.gateNode}
    </Ctx.Provider>
  );
};

export default AudioaulasPlayerProvider;
