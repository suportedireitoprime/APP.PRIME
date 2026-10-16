import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { registrarMidia, clearMediaSession } from '@/lib/mediaSession';
import { telaAcesa } from '@/lib/nativo/telaAcordada';
import { fonteDeAudio } from '@/lib/nativo/audioOffline';
import { notifyMediaPlay, subscribeMediaPlay } from '@/lib/mediaCoordinator';
import { toast } from 'sonner';
import { salvarProgressoAudioaula, obterUltimoProgressoAudioaula, normalizarStreamAudio } from '@/lib/audioaulaProgresso';

export const INTRO_AUDIOAULA_URL = 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/audios/vinhetas/intro_audioaulas.mp3';

export interface AulaAudio {
  id: number;
  area: string;
  tema: string | null;
  sequencia: number | null;
  titulo: string;
  descricao: string | null;
  url_audio: string | null;
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
  tocar: (a: AulaAudio, customFila?: AulaAudio[], tempoInicial?: number, pularIntro?: boolean) => Promise<void>;
  retomarUltimoProgresso: () => void;
  togglePlay: () => void;
  pular: (dir: 1 | -1) => void;
  seek: (v: number) => void;
  setVelocidade: (rate: number) => void;
  fechar: () => void;
  audioRef: React.RefObject<HTMLAudioElement>;
  tocandoIntro: boolean;
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
  tocar: async () => {},
  retomarUltimoProgresso: () => {},
  togglePlay: () => {},
  pular: () => {},
  seek: () => {},
  setVelocidade: () => {},
  fechar: () => {},
  audioRef: fallbackAudioRef,
  tocandoIntro: false,
};

const Ctx = createContext<AudioaulasPlayerContextType | undefined>(undefined);

export function useAudioaulasPlayer() {
  const ctx = useContext(Ctx);
  return ctx ?? fallbackAudioaulasContext;
}

export const AudioaulasPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [aulas, setAulas] = useState<AulaAudio[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Carregamento e cache aquecido das aulas
  useEffect(() => {
    let cancelado = false;
    const carregar = async () => {
      try {
        const { data } = await supabase
          .from('audioaulas_acervo')
          .select('id, area, tema, sequencia, titulo, descricao, url_audio')
          .order('area', { ascending: true })
          .order('sequencia', { ascending: true });
        if (cancelado) return;
        if (data) setAulas(data as AulaAudio[]);
      } catch (err) {
        console.error('Erro ao carregar acervo de audioaulas:', err);
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
    async (a: AulaAudio, customFila?: AulaAudio[], tempoInicial?: number, pularIntro = false) => {
      const el = audioRef.current;
      const introEl = introAudioRef.current;
      if (!a.url_audio) return;

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
        return;
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
        return;
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
    },
    [atualId, tocarConteudoAula, tocandoIntro, velocidade],
  );

  const retomarUltimoProgresso = useCallback(() => {
    const ultimo = obterUltimoProgressoAudioaula();
    if (!ultimo) return;
    const aulaEncontrada = aulas.find((x) => x.id === ultimo.id);
    if (aulaEncontrada) {
      const tempoRecuado = Math.max(0, (ultimo.tempo || 0) - 1.0);
      void tocar(aulaEncontrada, undefined, tempoRecuado, true);
      setAberto(true);
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
    [atualIdx, fila, tocar],
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
          if (atualIdx >= 0 && fila[atualIdx + 1]) {
            void tocar(fila[atualIdx + 1]);
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
    </Ctx.Provider>
  );
};

export default AudioaulasPlayerProvider;
