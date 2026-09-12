import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { proximaRevisao, rotuloIntervalo, type NivelFlashcard } from '@/lib/spacedRepetition';
import { Aula, Bloco, interleaveBlocos } from '@/lib/aprenderUtils';
import flipSoundAsset from '@/assets/flipcard.mp3.asset.json';
import { srcOf } from '@/lib/assetUrl';
import { haptic } from '@/lib/nativeHaptics';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import {
  getLocalAulaProgress,
  saveLocalAulaProgress,
  clearLocalAulaProgress,
} from '@/lib/aprenderProgressoStorage';

export function useAprenderAula(aulaId: string | undefined, user: any) {
  const [aula, setAula] = useState<Aula | null>(null);
  const [blocos, setBlocos] = useState<Bloco[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [proximaAula, setProximaAula] = useState<{ id: string; titulo: string } | null>(null);
  const [proximasAulas, setProximasAulas] = useState<{ id: string; titulo: string }[]>([]);

  // Estados de Interação e Navegação
  const [currentIdx, setCurrentIdx] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, { correta: boolean; escolha?: string }>>({});
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [conexoes, setConexoes] = useState<Record<string, Record<number, number | null>>>({});

  const [finalizada, setFinalizada] = useState(false);
  const [mostrarPrevia, setMostrarPrevia] = useState(false);
  const [progressoSalvo, setProgressoSalvo] = useState(0);

  // Modal Flutuante de Retomada Inteligente ("Continuar de onde parou" vs "Começar do zero")
  const [modalRetomarOpen, setModalRetomarOpen] = useState(false);
  const [savedPosition, setSavedPosition] = useState<{ page: number; idx: number; pct: number } | null>(null);

  const [feedbackPergunta, setFeedbackPergunta] = useState<{
    correta: boolean;
    escolha: string;
    explicacao: string;
  } | null>(null);

  const startedAt = useRef<number>(Date.now());
  const saveTimeoutRef = useRef<number | null>(null);

  const flipAudioRef = useRef<HTMLAudioElement | null>(null);
  const swooshAudioRef = useRef<HTMLAudioElement | null>(null);

  if (typeof window !== 'undefined' && !flipAudioRef.current) {
    flipAudioRef.current = new Audio(srcOf(flipSoundAsset));
    flipAudioRef.current.volume = 0.5;
    flipAudioRef.current.preload = 'auto';
  }
  if (typeof window !== 'undefined' && !swooshAudioRef.current) {
    swooshAudioRef.current = new Audio('/sounds/mixkit-paper-slide-1530.wav');
    swooshAudioRef.current.volume = 0.6;
    swooshAudioRef.current.preload = 'auto';
  }

  const playFlipSound = () => {
    const a = flipAudioRef.current;
    if (!a) return;
    try { a.currentTime = 0; void a.play(); } catch {}
  };
  const playSwooshSound = () => {
    const a = swooshAudioRef.current;
    if (!a) return;
    try { a.currentTime = 0; void a.play(); } catch {}
  };

  const fetchAulasEBlocos = useCallback(async (isMounted: boolean) => {
    const cacheKey = `aprender_aula_cache_${aulaId}`;
    try {
      const [{ data: a }, { data: bs }] = await Promise.all([
        supabase.from('aprender_aulas').select('id, titulo, objetivo, duracao_est_min, previa, modulo_id, ordem').eq('id', aulaId).maybeSingle(),
        supabase.from('aprender_blocos').select('id, ordem, tipo, payload, resposta_correta').eq('aula_id', aulaId).order('ordem'),
      ]);
      if (!isMounted) return null;

      if (a) {
        setAula(a as Aula | null);
        let loadedBlocos = (bs ?? []) as Bloco[];

        // Geração sob Demanda via IA se a aula estiver vazia
        if (loadedBlocos.length === 0) {
          setIsGenerating(true);
          try {
            const { error: genError } = await supabase.functions.invoke('aprender-aula-gerar', {
              body: { aulaId }
            });
            if (genError) throw genError;
            
            // Busca novamente após a IA gerar
            const { data: bsRefetched } = await supabase.from('aprender_blocos').select('id, ordem, tipo, payload, resposta_correta').eq('aula_id', aulaId).order('ordem');
            loadedBlocos = (bsRefetched ?? []) as Bloco[];
          } catch (err) {
            console.error("Falha ao gerar aula via IA:", err);
            toast.error("Ocorreu um erro ao gerar a aula. Tente novamente mais tarde.");
          } finally {
            setIsGenerating(false);
          }
        }

        const finalBlocos = interleaveBlocos(loadedBlocos);
        setBlocos(finalBlocos);
        startedAt.current = Date.now();
        setLoading(false);

        let proxLista: any[] = [];
        let proxItem: any = null;
        if (a?.modulo_id != null) {
          const { data: prox } = await supabase
            .from('aprender_aulas')
            .select('id, titulo, ordem')
            .eq('modulo_id', a.modulo_id)
            .gt('ordem', a.ordem ?? 0)
            .order('ordem')
            .limit(8);
          proxLista = (prox ?? []).map((p: any) => ({ id: p.id, titulo: p.titulo }));
          proxItem = proxLista[0] ?? null;
          setProximasAulas(proxLista);
          setProximaAula(proxItem);
        } else {
          setProximaAula(null);
          setProximasAulas([]);
        }

        // Grava em IndexedDB para acesso 100% offline
        void idbSet(cacheKey, {
          aula: a,
          blocos: finalBlocos,
          proximaAula: proxItem,
          proximasAulas: proxLista,
        }).catch(() => {});

        return finalBlocos;
      }
    } catch (networkErr) {
      console.warn('Rede indisponível, falha ao buscar aula remota:', networkErr);
    }
    return null;
  }, [aulaId]);

  // Carrega aula e blocos
  useEffect(() => {
    if (!aulaId) return;
    let isMounted = true;
    (async () => {
      const cacheKey = `aprender_aula_cache_${aulaId}`;
      try {
        const cached = await idbGet<{ aula: Aula; blocos: Bloco[]; proximaAula: any; proximasAulas: any }>(cacheKey);
        if (cached && isMounted && cached.blocos && cached.blocos.length > 0) {
          setAula(cached.aula);
          setBlocos(cached.blocos);
          setProximaAula(cached.proximaAula);
          setProximasAulas(cached.proximasAulas || []);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Erro ao carregar cache offline da aula:', err);
      }

      await fetchAulasEBlocos(isMounted);
    })();
    return () => { isMounted = false; };
  }, [aulaId, fetchAulasEBlocos]);

  const total = blocos.length;
  const perguntas = useMemo(() => blocos.filter((b) => b.tipo === 'pergunta'), [blocos]);

  // Carrega progresso salvo e abre card flutuante de retomada caso haja progresso inacabado
  useEffect(() => {
    if (!aulaId) return;

    // 1. Verificação local instantânea (0ms)
    const local = getLocalAulaProgress(aulaId);
    let initialSavedBlocks = local?.blocosConcluidos ?? 0;
    let initialSavedIdx = local?.currentIdx ?? 0;
    let initialConcluida = local?.concluida ?? false;

    if (initialSavedBlocks > 0) {
      setProgressoSalvo(initialSavedBlocks);
      if (initialConcluida) {
        setFinalizada(true);
      } else if (initialSavedIdx > 0) {
        const pct = total > 0 ? Math.round(((initialSavedIdx + 1) / total) * 100) : 0;
        setSavedPosition({ page: initialSavedIdx + 1, idx: initialSavedIdx, pct });
        setModalRetomarOpen(true);
      }
    }

    // 2. Sincronização com Supabase (se autenticado)
    if (!user) return;
    (async () => {
      try {
        const { data } = await supabase
          .from('aprender_progresso_aula')
          .select('blocos_concluidos, concluida_em')
          .eq('user_id', user.id)
          .eq('aula_id', aulaId)
          .maybeSingle();

        if (data) {
          const numSupabase = Number(data.blocos_concluidos ?? 0);
          const isConcluida = !!data.concluida_em;
          const effectiveBlocks = Math.max(numSupabase, initialSavedBlocks);
          setProgressoSalvo(effectiveBlocks);

          if (isConcluida) {
            setFinalizada(true);
          } else if (effectiveBlocks > 0) {
            const targetIdx = local && typeof local.currentIdx === 'number' ? local.currentIdx : Math.max(0, effectiveBlocks - 1);
            if (targetIdx > 0) {
              const effectiveTotal = total > 0 ? total : 10;
              const pct = Math.min(100, Math.round(((targetIdx + 1) / effectiveTotal) * 100));
              setSavedPosition({ page: targetIdx + 1, idx: targetIdx, pct });
              setModalRetomarOpen(true);
            }
          }
        }
      } catch (err) {
        console.warn('Erro ao consultar progresso no Supabase:', err);
      }
    })();
  }, [aulaId, user, total]);

  const maxRevealedIdx = useMemo(() => {
    if (!blocos || blocos.length === 0) return 0;
    let last = 0;
    for (let i = 0; i < blocos.length; i++) {
      last = i;
      const b = blocos[i];
      const isInteractive = ['pergunta', 'flashcard', 'conexao', 'ordenacao'].includes(b.tipo);

      let completed = false;
      if (i < progressoSalvo) {
        completed = true;
      } else {
        if (b.tipo === 'pergunta' && respostas[b.id]) completed = true;
        if (b.tipo === 'flashcard' && flipped[b.id]) completed = true;
        if (b.tipo === 'conexao' && conexoes[b.id]) {
          const map = conexoes[b.id];
          const pares = b.payload?.pares || [];
          if (pares.length > 0 && pares.every((_: any, idx: number) => map[idx] === idx)) {
            completed = true;
          }
        }
      }

      if (isInteractive && !completed) {
        break;
      }
    }
    return last;
  }, [blocos, respostas, flipped, conexoes, progressoSalvo]);

  const acertos = useMemo(
    () => perguntas.filter((p) => respostas[p.id]?.correta).length,
    [perguntas, respostas],
  );

  // Salva o progresso tanto localmente quanto no Supabase
  const salvarProgresso = useCallback(async (concluida = false, overrideIdx?: number) => {
    if (!aulaId) return;
    const targetIdx = typeof overrideIdx === 'number' ? overrideIdx : currentIdx;
    const targetBlocks = concluida
      ? total
      : Math.min(total, Math.max(targetIdx + 1, progressoSalvo));

    const isConcluida = concluida || (total > 0 && targetBlocks >= total);

    // 1. Salva localmente instantâneo (0ms)
    saveLocalAulaProgress(aulaId, targetIdx, total, isConcluida);

    // 2. Salva no Supabase
    if (user) {
      const payload = {
        user_id: user.id,
        aula_id: aulaId,
        blocos_concluidos: targetBlocks,
        acertos,
        total_perguntas: perguntas.length,
        tempo_ms: Date.now() - startedAt.current,
        concluida_em: isConcluida ? new Date().toISOString() : null,
      };

      try {
        await supabase.from('aprender_progresso_aula').upsert(payload, { onConflict: 'user_id,aula_id' });
      } catch (err) {
        console.warn('Erro ao sincronizar progresso no Supabase:', err);
      }
    }
  }, [aulaId, user, currentIdx, progressoSalvo, total, acertos, perguntas.length]);

  const salvarBloco = async (
    bloco: Bloco,
    resposta: any,
    acertou: boolean | null,
    proxima_revisao_em?: string | null,
  ) => {
    if (!user) return;
    const payload: any = {
      user_id: user.id,
      bloco_id: bloco.id,
      resposta,
      acertou,
      tentativas: 1,
    };
    if (typeof proxima_revisao_em !== 'undefined') payload.proxima_revisao_em = proxima_revisao_em;
    await supabase.from('aprender_progresso_bloco').upsert(payload, { onConflict: 'user_id,bloco_id' });

    // Atualiza progresso da aula
    void salvarProgresso(false, currentIdx);
  };

  const avaliarFlashcard = async (bloco: Bloco, nivel: NivelFlashcard) => {
    haptic.selection();
    const { data: anterior } = user
      ? await supabase
          .from('aprender_progresso_bloco')
          .select('proxima_revisao_em')
          .eq('user_id', user.id)
          .eq('bloco_id', bloco.id)
          .maybeSingle()
      : { data: null as any };
    const nova = proximaRevisao(nivel, anterior?.proxima_revisao_em);
    void salvarBloco(bloco, { nivel }, nivel === 'sabia', nova);
    toast.success(`Revisão marcada para ${rotuloIntervalo(nova)}`);
    playSwooshSound();
  };

  const responderPergunta = async (bloco: Bloco, escolha: string) => {
    if (respostas[bloco.id]) return;
    const correctId = String(
      bloco.resposta_correta?.id_correto ??
      bloco.resposta_correta ??
      ''
    ).toLowerCase();
    const correta = correctId === escolha.toLowerCase();
    setRespostas((r) => ({ ...r, [bloco.id]: { correta, escolha } }));
    void salvarBloco(bloco, { escolha }, correta);
    if (correta) {
      playSwooshSound();
      haptic.notification('success');
    } else {
      haptic.notification('error');
    }

    setFeedbackPergunta({
      correta,
      escolha,
      explicacao:
        bloco.resposta_correta?.explicacao ||
        bloco.payload?.explicacao ||
        'Revise o conceito aprendido nesta etapa e siga em frente!',
    });
  };

  const concluirAula = async () => {
    await salvarProgresso(true, total - 1);
    setFinalizada(true);
    toast.success('Aula concluída com sucesso!');
  };

  const refazerAula = () => {
    setCurrentIdx(0);
    setProgressoSalvo(0);
    setRespostas({});
    setFlipped({});
    setConexoes({});
    setFinalizada(false);
    startedAt.current = Date.now();
    if (aulaId) clearLocalAulaProgress(aulaId);
  };

  const comecarAula = () => {
    setCurrentIdx(0);
    setProgressoSalvo(0);
    setRespostas({});
    setFlipped({});
    setConexoes({});
    startedAt.current = Date.now();
    setMostrarPrevia(false);
    if (aulaId) clearLocalAulaProgress(aulaId);
  };

  const continuarAula = (idx: number) => {
    setCurrentIdx(idx);
    startedAt.current = Date.now();
    setMostrarPrevia(false);
  };

  // Ações do Modal Flutuante de Retomada
  const confirmarRetomada = () => {
    if (savedPosition) {
      setCurrentIdx(savedPosition.idx);
    }
    setModalRetomarOpen(false);
  };

  const recomecarDoZero = () => {
    setCurrentIdx(0);
    setProgressoSalvo(0);
    setRespostas({});
    setFlipped({});
    setConexoes({});
    startedAt.current = Date.now();
    if (aulaId) clearLocalAulaProgress(aulaId);
    if (user && aulaId) {
      void supabase.from('aprender_progresso_aula').upsert({
        user_id: user.id,
        aula_id: aulaId,
        blocos_concluidos: 0,
        acertos: 0,
        total_perguntas: perguntas.length,
        tempo_ms: 0,
        concluida_em: null,
      }, { onConflict: 'user_id,aula_id' });
    }
    setModalRetomarOpen(false);
  };

  const avancarIdx = () => setCurrentIdx((i) => Math.min(total - 1, i + 1));
  const voltarIdx = () => setCurrentIdx((i) => Math.max(0, i - 1));

  return {
    aula,
    blocos,
    loading,
    isGenerating,
    proximaAula,
    proximasAulas,
    total,
    perguntas,

    currentIdx,
    setCurrentIdx,
    respostas,
    flipped,
    setFlipped,
    conexoes,
    setConexoes,

    finalizada,
    setFinalizada,
    mostrarPrevia,
    setMostrarPrevia,
    progressoSalvo,
    feedbackPergunta,
    setFeedbackPergunta,
    maxRevealedIdx,
    acertos,

    // Modal Flutuante de Retomada
    modalRetomarOpen,
    setModalRetomarOpen,
    savedPosition,
    confirmarRetomada,
    recomecarDoZero,

    playFlipSound,
    playSwooshSound,

    avaliarFlashcard,
    responderPergunta,
    concluirAula,
    salvarBloco,
    salvarProgresso,

    refazerAula,
    comecarAula,
    continuarAula,
    avancarIdx,
    voltarIdx,
  };
}
