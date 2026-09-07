import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { setupMediaSession, clearMediaSession } from '@/lib/mediaSession';
import { useNarracaoFlutuante } from '@/stores/useNarracaoFlutuante';
import { speakNative, stopNativeSpeech } from '@/lib/nativeTts';
import { formatTextoArtigoParaNarracao, formatNarracaoTime } from './artigoTextUtils';
import { LEIS_SUPABASE_URL, LEIS_SUPABASE_ANON_KEY } from '@/lib/legislacaoBackend';
import type { ArtigoLei } from '@/data/mockData';
import {
  getCachedAudio,
  saveCachedAudio,
  buildAudioCacheKey,
  prefetchNextArticleAudio,
} from '@/services/audioOfflineCache';

const SB_URL = LEIS_SUPABASE_URL;
const SB_KEY = LEIS_SUPABASE_ANON_KEY;

async function saveGeneratedAudioToSupabase(
  tabelaNome: string,
  artigoNumero: string,
  leiNome: string,
  tituloArtigo: string | null,
  audioUrlOrData: string,
  wordTimings: any[] | null
): Promise<string> {
  let finalAudioUrl = audioUrlOrData;
  try {
    if (audioUrlOrData.startsWith('data:audio/')) {
      // Item 17: Use fetch() to convert data URI to Blob efficiently
      // This avoids the expensive atob() + charCodeAt loop that caused 50-80MB memory spikes
      try {
        const response = await fetch(audioUrlOrData);
        const blob = await response.blob();
        const safeNum = String(artigoNumero).replace(/[^a-zA-Z0-9]/g, '_');
        const filePath = `narracoes/${tabelaNome}/${safeNum}.wav`;

        const { error: uploadErr } = await supabase.storage
          .from('audios')
          .upload(filePath, blob, { contentType: 'audio/wav', upsert: true });

        if (!uploadErr) {
          const { data: signed } = await supabase.storage
            .from('audios')
            .createSignedUrl(filePath, 60 * 60 * 24 * 365 * 5);
          if (signed?.signedUrl) {
            finalAudioUrl = signed.signedUrl;
          }
        } else {
          console.warn('[useArtigoNarracao] Upload de áudio para Supabase falhou:', uploadErr);
        }
      } catch (fetchErr) {
        console.warn('[useArtigoNarracao] Falha ao converter data URI para Blob via fetch:', fetchErr);
      }
    }

    const { error: dbErr } = await supabase
      .from('narracoes_artigos')
      .upsert(
        {
          tabela_nome: tabelaNome,
          artigo_numero: artigoNumero,
          lei_nome: leiNome,
          titulo_artigo: tituloArtigo,
          audio_url: finalAudioUrl,
          word_timings: wordTimings || null,
        },
        { onConflict: 'tabela_nome,artigo_numero' }
      );

    if (dbErr) {
      console.warn('[useArtigoNarracao] Salvar narração no Supabase DB falhou:', dbErr);
    }
  } catch (err) {
    console.error('[useArtigoNarracao] Erro em saveGeneratedAudioToSupabase:', err);
  }
  return finalAudioUrl;
}

export const RING_CIRCUMFERENCE = 2 * Math.PI * 26;

interface UseArtigoNarracaoParams {
  artigo: ArtigoLei | null;
  tabelaNome?: string;
  breadcrumb?: { parte?: string; titulo?: string; tituloDesc?: string } | null;
  isPremium: boolean;
  openPremiumGate: (feature: string) => void;
}

export function useArtigoNarracao({
  artigo,
  tabelaNome,
  breadcrumb,
  isPremium,
  openPremiumGate,
}: UseArtigoNarracaoParams) {
  // ─── State ───
  const [narracaoUrl, setNarracaoUrl] = useState<string | null>(null);
  const [narracaoWordTimings, setNarracaoWordTimings] = useState<Array<{ word: string; start: number; end: number }> | null>(null);
  const [narracaoLoading, setNarracaoLoading] = useState(false);
  const [narracaoStepIdx, setNarracaoStepIdx] = useState(0);
  const [narracaoPlaying, setNarracaoPlaying] = useState(false);
  const [narracaoActiveWordIndex, setNarracaoActiveWordIndex] = useState(-1);
  const [narracaoDuration, setNarracaoDuration] = useState(0);

  // ─── Refs ───
  const narracaoAudioRef = useRef<HTMLAudioElement | null>(null);
  const narracaoAnimRef = useRef<number | null>(null);
  const narracaoProgressFillRef = useRef<HTMLDivElement | null>(null);
  const narracaoRingRef = useRef<SVGCircleElement | null>(null);
  const narracaoTimeRef = useRef<HTMLSpanElement | null>(null);
  const narracaoTotalTimeRef = useRef<HTMLSpanElement | null>(null);
  const narracaoTimingsRef = useRef<Array<{ word: string; start: number; end: number }> | null>(null);
  const narracaoActiveIdxRef = useRef<number>(-1);
  const narrarPressGuardRef = useRef(0);
  const narrarActionInFlightRef = useRef(false);
  const narracaoAdoptedRef = useRef(false);
  // Item 12: Guard against concurrent audio generation (double-click flooding)
  const isGeneratingAudioRef = useRef(false);
  const prefetchedNextRef = useRef(false);

  // Item 18: Persistência no storage da velocidade de reprodução customizada (0.75x a 2.0x)
  const [playbackRate, setPlaybackRateState] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem('vademecum_audio_speed'));
      return [0.75, 1, 1.25, 1.5, 2].includes(saved) ? saved : 1.0;
    } catch {
      return 1.0;
    }
  });

  const setPlaybackRate = useCallback((rate: number) => {
    setPlaybackRateState(rate);
    try { localStorage.setItem('vademecum_audio_speed', String(rate)); } catch {}
    if (narracaoAudioRef.current) {
      narracaoAudioRef.current.playbackRate = rate;
    }
  }, []);

  // ─── Floating mini-player integration ───
  const location = useLocation();
  const adoptNarracao = useNarracaoFlutuante((s) => s.adopt);
  const reclaimNarracao = useNarracaoFlutuante((s) => s.reclaim);
  const closeFlutuante = useNarracaoFlutuante((s) => s.close);

  // ─── Check for existing narration when artigo changes ───
  useEffect(() => {
    prefetchedNextRef.current = false;
    const reclaimed = artigo?.id ? reclaimNarracao(artigo.id) : null;

    setNarracaoUrl(null);
    setNarracaoWordTimings(null);
    setNarracaoActiveWordIndex(-1);
    narracaoActiveIdxRef.current = -1;

    if (narracaoAdoptedRef.current) {
      narracaoAdoptedRef.current = false;
      narracaoAudioRef.current = null;
      setNarracaoPlaying(false);
    } else if (reclaimed) {
      narracaoAudioRef.current = reclaimed;
      reclaimed.onended = () => {
        setNarracaoPlaying(false);
        setNarracaoActiveWordIndex(-1);
        narracaoActiveIdxRef.current = -1;
        narracaoAudioRef.current = null;
        clearMediaSession();
      };
      reclaimed.onerror = null;
      setNarracaoPlaying(!reclaimed.paused);
      startProgressTracking(reclaimed);
    } else {
      setNarracaoPlaying(false);
      if (narracaoAudioRef.current) {
        narracaoAudioRef.current.pause();
        narracaoAudioRef.current = null;
      }
    }
    if (!tabelaNome || !artigo?.numero) return;

    (async () => {
      try {
        const cacheKey = buildAudioCacheKey(tabelaNome, artigo.numero);
        // Item 14: Cache persistente IndexedDB com cota inteligente LRU
        const cached = await getCachedAudio(cacheKey);
        if (cached) {
          setNarracaoUrl(cached.blobUrl);
          if (cached.wordTimings && cached.wordTimings.length > 0) {
            setNarracaoWordTimings(cached.wordTimings as any[]);
          }
          return;
        }

        const aliases = Array.from(new Set([
          tabelaNome,
          tabelaNome.toLowerCase(),
          tabelaNome.toUpperCase(),
          tabelaNome.replace(/^[A-Z0-9]+_/, '').toLowerCase(),
          tabelaNome.replace(/^[A-Z0-9]+_/, '').toUpperCase(),
        ]));

        const { data: rows } = await supabase
          .from('narracoes_artigos')
          .select('audio_url, word_timings')
          .in('tabela_nome', aliases)
          .eq('artigo_numero', artigo.numero)
          .limit(1);

        const row = rows?.[0];
        if (row?.audio_url) {
          setNarracaoUrl(row.audio_url);
          if (Array.isArray(row.word_timings) && row.word_timings.length > 0) {
            setNarracaoWordTimings(row.word_timings as any[]);
          }
          // Salva no IndexedDB em background para próximas reproduções offline instantâneas
          void (async () => {
            try {
              const resp = await fetch(row.audio_url);
              if (resp.ok) {
                const blob = await resp.blob();
                await saveCachedAudio(cacheKey, blob, row.word_timings as any);
              }
            } catch {}
          })();
        }
      } catch (e) {
        console.error('Erro ao verificar narração no banco principal:', e);
      }
    })();
  }, [tabelaNome, artigo?.id, artigo?.numero]);

  // ─── Item 11: Auto-adopt audio into floating miniplayer on unmount/route change ───
  useEffect(() => {
    return () => {
      const currentAudio = narracaoAudioRef.current;
      if (currentAudio && !currentAudio.paused && !currentAudio.ended && !narracaoAdoptedRef.current) {
        // The component is being unmounted (likely by route navigation)
        // Adopt the audio into the floating miniplayer so it continues playing
        const currentArtigo = artigo;
        if (currentArtigo) {
          narracaoAdoptedRef.current = true;
          stopProgressTracking();
          adoptNarracao({
            audio: currentAudio,
            artigo: currentArtigo,
            tabelaNome,
            leiNome: tabelaNome,
            returnPath: location.pathname + location.search,
          });
        } else {
          // No artigo context available — just pause to prevent background leak
          try { currentAudio.pause(); } catch {}
          narracaoAudioRef.current = null;
          clearMediaSession();
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Progress tracking ───
  const startProgressTracking = useCallback((audio: HTMLAudioElement) => {
    const update = () => {
      const t = audio.currentTime || 0;
      const dur = audio.duration || 0;

      if (dur > 0) {
        const pct = Math.min(100, (t / dur) * 100);
        // Item 15: Pré-carregamento especulativo do áudio do próximo artigo durante a reprodução (>40%)
        if (pct > 40 && !prefetchedNextRef.current && artigo?.numero && tabelaNome) {
          prefetchedNextRef.current = true;
          const num = parseInt(String(artigo.numero).replace(/\D/g, ''), 10);
          if (!isNaN(num) && num > 0) {
            void prefetchNextArticleAudio(tabelaNome, num + 1);
          }
        }

        if (narracaoProgressFillRef.current) {
          narracaoProgressFillRef.current.style.width = `${pct}%`;
        }
        if (narracaoRingRef.current) {
          narracaoRingRef.current.style.strokeDashoffset = `${RING_CIRCUMFERENCE * (1 - pct / 100)}`;
        }
      }
      if (narracaoTimeRef.current) {
        narracaoTimeRef.current.textContent = formatNarracaoTime(t);
      }
      if (narracaoTotalTimeRef.current && dur > 0 && narracaoTotalTimeRef.current.textContent !== formatNarracaoTime(dur)) {
        narracaoTotalTimeRef.current.textContent = formatNarracaoTime(dur);
      }

      const timings = narracaoTimingsRef.current;
      if (timings && timings.length) {
        let idx = -1;
        const start = Math.max(0, narracaoActiveIdxRef.current);
        for (let i = start; i < timings.length; i++) {
          if (t >= timings[i].start && t < timings[i].end) { idx = i; break; }
          if (timings[i].start > t) break;
        }
        if (idx === -1) {
          for (let i = 0; i < timings.length; i++) {
            if (t >= timings[i].start && t < timings[i].end) { idx = i; break; }
          }
        }
        if (idx === -1 && t >= (timings[timings.length - 1]?.end ?? 0)) {
          idx = timings.length - 1;
        }
        if (idx !== narracaoActiveIdxRef.current) {
          narracaoActiveIdxRef.current = idx;
          setNarracaoActiveWordIndex(idx);
        }
      }

      if (!audio.paused && !audio.ended) {
        narracaoAnimRef.current = requestAnimationFrame(update);
      }
    };
    narracaoAnimRef.current = requestAnimationFrame(update);
  }, []);

  const stopProgressTracking = useCallback(() => {
    if (narracaoAnimRef.current) {
      cancelAnimationFrame(narracaoAnimRef.current);
      narracaoAnimRef.current = null;
    }
  }, []);

  // ─── playNarracao ───
  const playNarracao = useCallback(async (audioUrl: string, options?: { onRecover?: () => void }) => {
    // Item 19: Stop native TTS speech before playing recorded audio (mutex)
    stopNativeSpeech();
    closeFlutuante();
    if (narracaoAudioRef.current) {
      narracaoAudioRef.current.pause();
      stopProgressTracking();
    }

    const audio = new Audio(audioUrl);
    audio.preload = 'auto';
    // Item 18: Aplica a velocidade de reprodução customizada persistida no storage (0.75x a 2.0x)
    audio.playbackRate = playbackRate;
    setNarracaoDuration(0);
    const syncDuration = () => {
      const d = audio.duration;
      if (Number.isFinite(d) && d > 0) setNarracaoDuration(d);
    };
    audio.addEventListener('loadedmetadata', syncDuration);
    audio.addEventListener('durationchange', syncDuration);

    const clearAudioState = () => {
      setNarracaoPlaying(false);
      setNarracaoActiveWordIndex(-1);
      narracaoActiveIdxRef.current = -1;
      if (narracaoProgressFillRef.current) narracaoProgressFillRef.current.style.width = '0%';
      if (narracaoRingRef.current) narracaoRingRef.current.style.strokeDashoffset = `${RING_CIRCUMFERENCE}`;
      if (narracaoTimeRef.current) narracaoTimeRef.current.textContent = '0:00';
      stopProgressTracking();
      narracaoAudioRef.current = null;
      clearMediaSession();
    };

    audio.onended = clearAudioState;

    // Item 13: Exponential backoff retry for transient audio loading failures
    let retryCount = 0;
    const MAX_RETRIES = 3;
    const BASE_DELAY_MS = 1000; // 1s, 2s, 4s with jitter
    audio.onerror = () => {
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        const delay = BASE_DELAY_MS * Math.pow(2, retryCount - 1) + Math.random() * 500;
        console.warn(`[useArtigoNarracao] Erro de áudio transitório. Retentativa ${retryCount}/${MAX_RETRIES} em ${Math.round(delay)}ms...`);
        setTimeout(() => {
          // Reload the audio source for retry
          audio.load();
          audio.play().catch(() => {
            // If play() also fails, the onerror handler will fire again
          });
        }, delay);
        return;
      }
      // All retries exhausted
      clearAudioState();
      setNarracaoUrl(null);
      if (options?.onRecover) {
        toast('Atualizando a narração salva...');
        options.onRecover();
      } else {
        toast.error('Não consegui tocar esta narração. Toque em Narrar para gerar novamente.');
      }
    };

    narracaoAudioRef.current = audio;
    setNarracaoPlaying(true);
    try {
      await audio.play();
      // Item 16: Format MediaSession title for compact display on lockscreen/notification
      const sigla = (tabelaNome || '').replace(/_\d{4}$/, '').replace(/_/g, ' ').toUpperCase();
      const artigoNum = artigo?.numero || '';
      const mediaTitle = sigla
        ? `${sigla} Art. ${artigoNum}`.slice(0, 60)
        : `Art. ${artigoNum}`;
      setupMediaSession({
        title: mediaTitle,
        album: tabelaNome || '',
        audio,
      });
      startProgressTracking(audio);
      return true;
    } catch (e) {
      console.error('Erro ao tocar narração:', e);
      clearAudioState();
      if (e instanceof DOMException && e.name === 'NotAllowedError') {
        toast('Narração pronta. Toque em Ouvir para reproduzir.');
      } else if (options?.onRecover) {
        setNarracaoUrl(null);
        toast('Atualizando a narração salva...');
        options.onRecover();
      } else {
        toast.error('Não consegui tocar esta narração. Toque em Ouvir para tentar novamente.');
      }
      return false;
    }
  }, [artigo?.numero, tabelaNome, startProgressTracking, stopProgressTracking]);

  // ─── gerarNarracao ───
  const gerarNarracao = useCallback(async (options?: { autoplay?: boolean; silent?: boolean; forceRegenerate?: boolean }) => {
    if (!artigo || !tabelaNome) return;

    // Item 12: Prevent concurrent audio generation (double-click flooding)
    if (isGeneratingAudioRef.current) {
      console.warn('[useArtigoNarracao] Geração de áudio já em andamento. Ignorando clique duplicado.');
      return;
    }
    isGeneratingAudioRef.current = true;

    const autoplay = options?.autoplay ?? true;
    const silent = options?.silent ?? false;

    if (!silent) {
      setNarracaoLoading(true);
      setNarracaoStepIdx(0);
    }
    try {
      const leiCatalog = (await import('@/services/legislacaoService')).getLeisCatalog();
      const lei = leiCatalog.find((l: any) => l.tabela_nome === tabelaNome);

      if (!silent) {
        await new Promise((r) => setTimeout(r, 350));
        setNarracaoStepIdx(1);
      }

      const STRUCT_RE = /^(PARTE|LIVRO|T[IÍ]TULO|CAP[IÍ]TULO|SEÇ[AÃ]O|SUBSEÇ[AÃ]O)\b/i;
      const tituloIsEpig = artigo.titulo && !STRUCT_RE.test(artigo.titulo);
      const epig = tituloIsEpig ? artigo.titulo : null;
      const breadcrumbParts = [breadcrumb?.parte, breadcrumb?.titulo, breadcrumb?.tituloDesc].filter(Boolean);
      const hier = breadcrumbParts.length > 0
        ? breadcrumbParts.join('. ')
        : (artigo.capitulo || (!tituloIsEpig ? artigo.titulo : null) || null);

      const payload = {
        tabela_nome: tabelaNome,
        artigo_numero: artigo.numero,
        artigo_texto: artigo.caput,
        lei_nome: lei?.nome || tabelaNome,
        hierarquia: hier,
        titulo_artigo: hier,
        epigrafe: epig,
        force_regenerate: options?.forceRegenerate ?? false,
      };

      let audio_url: string | null = null;
      let word_timings: any[] | null = null;

      // 1ª Tentativa: cache no banco
      try {
        const aliases = Array.from(new Set([
          tabelaNome,
          tabelaNome.toLowerCase(),
          tabelaNome.toUpperCase(),
          tabelaNome.replace(/^[A-Z0-9]+_/, '').toLowerCase(),
          tabelaNome.replace(/^[A-Z0-9]+_/, '').toUpperCase(),
        ]));

        const { data: rows } = await supabase
          .from('narracoes_artigos')
          .select('audio_url, word_timings')
          .in('tabela_nome', aliases)
          .eq('artigo_numero', artigo.numero)
          .limit(1);

        const cachedUrl = rows?.[0]?.audio_url || null;
        const cachedTimings = Array.isArray(rows?.[0]?.word_timings) ? (rows![0].word_timings as any[]) : null;
        if (cachedUrl) {
          audio_url = cachedUrl;
          word_timings = cachedTimings;
        }
      } catch (errDb) {
        console.warn('[useArtigoNarracao] Erro ao consultar narracoes_artigos:', errDb);
      }

      // 2ª Tentativa: backend de legislação
      if (!audio_url) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const userJwt = sessionData.session?.access_token || null;
          const res = await fetch(`${SB_URL}/functions/v1/narracao?fn=artigo`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: SB_KEY,
              Authorization: `Bearer ${SB_KEY}`,
              ...(userJwt ? { 'x-user-jwt': userJwt } : {}),
            },
            body: JSON.stringify({ ...payload, fn: 'artigo' }),
          });

          if (res.ok) {
            const json = await res.json();
            audio_url = json.audio_url || null;
            word_timings = json.word_timings || null;
          } else {
            console.warn('[useArtigoNarracao] narracao?fn=artigo falhou:', res.status, await res.text().catch(() => ''));
          }
        } catch (fetchErr) {
          console.warn('[useArtigoNarracao] Fetch direto narracao?fn=artigo falhou:', fetchErr);
        }
      }

      // 3ª Tentativa: Gemini 2.5 Flash TTS
      if (!audio_url) {
        try {
          const textoFormatado = formatTextoArtigoParaNarracao(artigo, breadcrumb);
          const { data: fnData, error: fnErr } = await supabase.functions.invoke('narracao', {
            body: {
              fn: 'blog_preview',
              voz: 'Kore',
              texto: textoFormatado,
              estilo: 'Diga em português brasileiro com tom vibrante, animado e muito empolgante, como uma professora jovem apaixonada por Direito explicando aos seus alunos',
            },
          });

          if (!fnErr && fnData?.audio_data_url) {
            const savedUrl = await saveGeneratedAudioToSupabase(
              tabelaNome,
              String(artigo.numero),
              lei?.nome || tabelaNome,
              hier,
              fnData.audio_data_url,
              null
            );
            audio_url = savedUrl || fnData.audio_data_url;
          } else if (fnErr) {
            console.warn('[useArtigoNarracao] Edge function narracao error:', fnErr);
          }
        } catch (errFn) {
          console.warn('[useArtigoNarracao] Chamada Gemini 2.5 Flash TTS falhou:', errFn);
        }
      }

      if (audio_url) {
        if (!silent) setNarracaoStepIdx(2);
        setNarracaoUrl(audio_url);
        if (Array.isArray(word_timings)) setNarracaoWordTimings(word_timings);

        // Item 14: Salva o novo áudio gerado no cache IndexedDB
        if (artigo?.numero && tabelaNome) {
          const cKey = buildAudioCacheKey(tabelaNome, artigo.numero);
          void (async () => {
            try {
              const resp = await fetch(audio_url!);
              if (resp.ok) {
                const blob = await resp.blob();
                await saveCachedAudio(cKey, blob, word_timings as any);
              }
            } catch {}
          })();
        }

        if (!silent) setNarracaoLoading(false);
        await playNarracao(audio_url);
        return;
      }

      // Fallback nativo
      console.warn('[useArtigoNarracao] Narração em áudio via Gemini indisponível. Acionando síntese nativa...');
      const textoFormatadoFallback = formatTextoArtigoParaNarracao(artigo, breadcrumb);
      const ok = await speakNative(textoFormatadoFallback);
      setNarracaoLoading(false);
      setNarracaoStepIdx(0);
      if (ok) {
        setNarracaoPlaying(true);
        toast.success('Reproduzindo narração nativa do artigo.');
      } else if (!silent) {
        toast.error('Não consegui gerar a narração agora. Tente novamente.');
      }
    } catch (e) {
      console.error('Erro ao gerar narração via Gemini. Tentando narração nativa...', e);
      if (artigo) {
        const textoFormatadoFallback = formatTextoArtigoParaNarracao(artigo, breadcrumb);
        const ok = await speakNative(textoFormatadoFallback);
        setNarracaoLoading(false);
        setNarracaoStepIdx(0);
        if (ok) {
          setNarracaoPlaying(true);
          toast.success('Reproduzindo narração nativa do artigo.');
          return;
        }
      }
      if (!silent) toast.error('Não consegui gerar a narração agora. Tente novamente.');
    } finally {
      isGeneratingAudioRef.current = false;
    }
    if (!silent) setNarracaoLoading(false);
  }, [artigo, tabelaNome, breadcrumb?.tituloDesc, breadcrumb?.titulo, playNarracao, openPremiumGate, isPremium]);

  // ─── handleNarrar ───
  const handleNarrar = async () => {
    if (!artigo || !tabelaNome) {
      toast.error('Não encontrei os dados deste artigo para narrar.');
      return;
    }

    if (narracaoPlaying) {
      // Item 20: Fade-out suave de 150ms antes de pausar para evitar clipping
      if (narracaoAudioRef.current) {
        const audio = narracaoAudioRef.current;
        const originalVolume = audio.volume;
        const fadeSteps = 6;
        const fadeInterval = 25; // 6 * 25ms = 150ms
        let step = 0;
        const fadeTimer = setInterval(() => {
          step++;
          audio.volume = Math.max(0, originalVolume * (1 - step / fadeSteps));
          if (step >= fadeSteps) {
            clearInterval(fadeTimer);
            audio.pause();
            audio.volume = originalVolume; // Restore for next play
            stopProgressTracking();
          }
        }, fadeInterval);
      }
      stopNativeSpeech();
      setNarracaoPlaying(false);
      return;
    }

    if (narracaoUrl) {
      const played = await playNarracao(narracaoUrl, {
        onRecover: () => { gerarNarracao({ autoplay: true, forceRegenerate: false }).catch(() => {}); },
      });
      if (played) return;
    }

    await gerarNarracao();
  };

  const activeNarracaoWordIndex = narracaoPlaying ? narracaoActiveWordIndex : -1;

  const handleNarrarButtonPress = useCallback(async (event?: React.SyntheticEvent<HTMLButtonElement>) => {
    event?.preventDefault();
    event?.stopPropagation();
    const now = Date.now();
    if (now - narrarPressGuardRef.current < 650) return;
    narrarPressGuardRef.current = now;
    if (narrarActionInFlightRef.current) return;
    if (narracaoLoading) return;
    narrarActionInFlightRef.current = true;

    try {
      if (!narracaoPlaying && !isPremium) {
        openPremiumGate('narracao');
        return;
      }
      await handleNarrar();
    } catch (e) {
      console.error('Erro ao acionar narração:', e);
      if (isPremium) {
        toast.error('Não consegui iniciar a narração agora. Tente novamente.');
      } else {
        openPremiumGate('narracao');
      }
    } finally {
      narrarActionInFlightRef.current = false;
    }
  }, [handleNarrar, isPremium, narracaoLoading, narracaoPlaying]);

  return {
    // State
    narracaoUrl,
    narracaoWordTimings,
    narracaoLoading,
    narracaoStepIdx,
    narracaoPlaying,
    narracaoDuration,
    activeNarracaoWordIndex,

    // Refs (for imperative DOM updates)
    narracaoAudioRef,
    narracaoProgressFillRef,
    narracaoRingRef,
    narracaoTimeRef,
    narracaoTotalTimeRef,
    narracaoTimingsRef,
    narracaoAdoptedRef,
    narracaoActiveIdxRef,

    // Actions
    setNarracaoUrl,
    setNarracaoWordTimings,
    setNarracaoPlaying,
    setNarracaoActiveWordIndex,
    handleNarrarButtonPress,
    gerarNarracao,
    playNarracao,
    stopProgressTracking,
    startProgressTracking,
    adoptNarracao,
    closeFlutuante,
    playbackRate,
    setPlaybackRate,
  };
}
