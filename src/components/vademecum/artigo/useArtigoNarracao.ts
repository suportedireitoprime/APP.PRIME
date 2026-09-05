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
      const base64Data = audioUrlOrData.split(',')[1];
      if (base64Data) {
        const binaryStr = atob(base64Data);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/wav' });
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

  // ─── Floating mini-player integration ───
  const location = useLocation();
  const adoptNarracao = useNarracaoFlutuante((s) => s.adopt);
  const reclaimNarracao = useNarracaoFlutuante((s) => s.reclaim);
  const closeFlutuante = useNarracaoFlutuante((s) => s.close);

  // ─── Check for existing narration when artigo changes ───
  useEffect(() => {
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
        }
      } catch (e) {
        console.error('Erro ao verificar narração no banco principal:', e);
      }
    })();
  }, [tabelaNome, artigo?.id, artigo?.numero]);

  // ─── Progress tracking ───
  const startProgressTracking = useCallback((audio: HTMLAudioElement) => {
    const update = () => {
      const t = audio.currentTime || 0;
      const dur = audio.duration || 0;

      if (dur > 0) {
        const pct = Math.min(100, (t / dur) * 100);
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
    closeFlutuante();
    if (narracaoAudioRef.current) {
      narracaoAudioRef.current.pause();
      stopProgressTracking();
    }

    const audio = new Audio(audioUrl);
    audio.preload = 'auto';
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
    audio.onerror = () => {
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
      setupMediaSession({
        title: `Art. ${artigo?.numero || ''}`,
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
      if (narracaoAudioRef.current) {
        narracaoAudioRef.current.pause();
        stopProgressTracking();
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
  };
}
