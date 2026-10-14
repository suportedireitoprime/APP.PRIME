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
        setTocando(false);
      }
    });
  }, []);

  const [tocandoIntro, setTocandoIntro] = useState(false);
  const audioAulaPendenteRef = useRef<{ aula: AulaAudio; tempoInicial?: number } | null>(null);
  const tempoInicialRef = useRef<number | null>(null);

  const tocarConteudoAula = useCallback(
    async (a: AulaAudio, tempoInicial?: number) => {
      const el = audioRef.current;
      if (!el || !a.url_audio) return;
      setTocandoIntro(false);
      audioAulaPendenteRef.current = null;

      if (typeof tempoInicial === 'number' && tempoInicial > 0) {
        tempoInicialRef.current = tempoInicial;
      } else {
        tempoInicialRef.current = null;
      }

      setAtualId(a.id);
      setTempo(tempoInicial ?? 0);
      setDur(0);

      try {
        const streamUrl = normalizarStreamAudio(a.url_audio);
        const src = await fonteDeAudio(audioIdOf(a), streamUrl);
        if (el) {
          el.src = src;
          el.playbackRate = velocidade;
          notifyMediaPlay('audioaula');
          el.play().catch((playErr: unknown) => {
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
      if (!a.url_audio) return;

      if (customFila) {
        setFilaCustom(customFila);
      }

      // Se já for a mesma aula tocando/pausada
      if (atualId === a.id) {
        if (el?.paused) {
          notifyMediaPlay('audioaula');
          await el.play().catch(() => {});
          setTocando(true);
        } else {
          el?.pause();
          setTocando(false);
        }
        return;
      }

      // Se deve pular intro (ex: retomando progresso do meio da aula ou se tempoInicial for informado)
      if (pularIntro || (typeof tempoInicial === 'number' && tempoInicial > 0)) {
        await tocarConteudoAula(a, tempoInicial);
        return;
      }

      // Inicia com a intro exclusiva de audioaulas
      setAtualId(a.id);
      setTempo(0);
      setDur(0);
      setTocandoIntro(true);
      audioAulaPendenteRef.current = { aula: a, tempoInicial };

      try {
        if (el) {
          el.src = INTRO_AUDIOAULA_URL;
          el.playbackRate = 1;
          notifyMediaPlay('audioaula');
          el.play().catch((err: unknown) => {
            console.warn('[AudioaulasPlayer] Intro bloqueada ou cancelada, tocando aula diretamente:', err);
            void tocarConteudoAula(a, tempoInicial);
          });
        }
        setTocando(true);
      } catch (err) {
        console.warn('[AudioaulasPlayer] Falha na intro, tocando aula diretamente:', err);
        void tocarConteudoAula(a, tempoInicial);
      }
    },
    [atualId, tocarConteudoAula],
  );

  const retomarUltimoProgresso = useCallback(() => {
    const ultimo = obterUltimoProgressoAudioaula();
    if (!ultimo) return;
    const aulaEncontrada = aulas.find((x) => x.id === ultimo.id);
    if (aulaEncontrada) {
      void tocar(aulaEncontrada, undefined, ultimo.tempo, true);
      setAberto(true);
    }
  }, [aulas, tocar]);

  const togglePlay = useCallback(() => {
    const el = audioRef.current;
    if (!el || !atual) return;
    if (tocando) {
      el.pause();
      setTocando(false);
    } else {
      notifyMediaPlay('audioaula');
      el.play().catch((err) => {
        console.error('[AudioaulasPlayer] Erro ao alternar reprodução:', err);
        setTocando(false);
        toast.error('Erro ao reproduzir o áudio.');
      });
      setTocando(true);
    }
  }, [atual, tocando]);

  const pular = useCallback(
    (dir: 1 | -1) => {
      if (atualIdx < 0) return;
      const prox = fila[atualIdx + dir];
      if (prox) void tocar(prox);
    },
    [atualIdx, fila, tocar],
  );

  pularRef.current = pular;

  const seek = useCallback((v: number) => {
    const el = audioRef.current;
    if (el) el.currentTime = v;
    setTempo(v);
  }, []);

  const setVelocidade = useCallback((rate: number) => {
    setVelocidadeState(rate);
    const el = audioRef.current;
    if (el && !tocandoIntro) el.playbackRate = rate;
  }, [tocandoIntro]);

  const fechar = useCallback(() => {
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.removeAttribute('src');
      el.load();
      clearMediaSession(el);
    }
    setTocando(false);
    setTocandoIntro(false);
    audioAulaPendenteRef.current = null;
    setAtualId(null);
    setTempo(0);
    setDur(0);
    setAberto(false);
  }, []);

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
      <audio
        ref={audioRef}
        preload="auto"
        playsInline
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime;
          setTempo(t);
          const d = e.currentTarget.duration || 0;
          if (atual && t > 1 && !tocandoIntro) {
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
            !tocandoIntro &&
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
        onPause={() => setTocando(false)}
        onError={(e) => {
          console.error('[AudioaulasPlayer] Erro no elemento de áudio:', e);
          if (tocandoIntro && audioAulaPendenteRef.current) {
            // Se falhar a intro, toca a aula diretamente
            const pendente = audioAulaPendenteRef.current;
            void tocarConteudoAula(pendente.aula, pendente.tempoInicial);
            return;
          }
          setTocando(false);
          toast.error('Erro de carregamento do áudio.');
        }}
        onEnded={() => {
          if (tocandoIntro && audioAulaPendenteRef.current) {
            // Intro finalizada com sucesso! Inicia a audioaula imediatamente
            const pendente = audioAulaPendenteRef.current;
            void tocarConteudoAula(pendente.aula, pendente.tempoInicial);
            return;
          }

          setTocando(false);
          if (atualIdx >= 0 && fila[atualIdx + 1]) {
            void tocar(fila[atualIdx + 1]);
          } else {
            clearMediaSession(audioRef.current);
          }
        }}
      />
    </Ctx.Provider>
  );
};

export default AudioaulasPlayerProvider;
