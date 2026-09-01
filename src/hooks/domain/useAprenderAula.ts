import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { proximaRevisao, rotuloIntervalo, type NivelFlashcard } from '@/lib/spacedRepetition';
import { Aula, Bloco, interleaveBlocos } from '@/lib/aprenderUtils';
import flipSoundAsset from '@/assets/flipcard.mp3.asset.json';
import { srcOf } from '@/lib/assetUrl';

export function useAprenderAula(aulaId: string | undefined, user: any) {
  const [aula, setAula] = useState<Aula | null>(null);
  const [blocos, setBlocos] = useState<Bloco[]>([]);
  const [loading, setLoading] = useState(true);
  const [proximaAula, setProximaAula] = useState<{ id: string; titulo: string } | null>(null);
  const [proximasAulas, setProximasAulas] = useState<{ id: string; titulo: string }[]>([]);
  
  // Estados de Interação
  const [currentIdx, setCurrentIdx] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, { correta: boolean; escolha?: string }>>({});
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [conexoes, setConexoes] = useState<Record<string, Record<number, number | null>>>({});
  
  const [finalizada, setFinalizada] = useState(false);
  const [mostrarPrevia, setMostrarPrevia] = useState(true);
  const [progressoSalvo, setProgressoSalvo] = useState(0);
  
  const [feedbackPergunta, setFeedbackPergunta] = useState<{
    correta: boolean;
    escolha: string;
    explicacao: string;
  } | null>(null);

  const startedAt = useRef<number>(Date.now());
  
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

  useEffect(() => {
    if (!aulaId) return;
    (async () => {
      const [{ data: a }, { data: bs }] = await Promise.all([
        supabase.from('aprender_aulas').select('id, titulo, objetivo, duracao_est_min, previa, modulo_id, ordem').eq('id', aulaId).maybeSingle(),
        supabase.from('aprender_blocos').select('id, ordem, tipo, payload, resposta_correta').eq('aula_id', aulaId).order('ordem'),
      ]);
      setAula(a as Aula | null);
      
      const loadedBlocos = (bs ?? []) as Bloco[];
      setBlocos(interleaveBlocos(loadedBlocos));
      
      startedAt.current = Date.now();
      setLoading(false);

      if (a?.modulo_id != null) {
        const { data: prox } = await supabase
          .from('aprender_aulas')
          .select('id, titulo, ordem')
          .eq('modulo_id', a.modulo_id)
          .gt('ordem', a.ordem ?? 0)
          .order('ordem')
          .limit(8);
        const lista = (prox ?? []).map((p: any) => ({ id: p.id, titulo: p.titulo }));
        setProximasAulas(lista);
        setProximaAula(lista[0] ?? null);
      } else {
        setProximaAula(null);
        setProximasAulas([]);
      }
    })();
  }, [aulaId]);

  useEffect(() => {
    if (!aulaId || !user) return;
    (async () => {
      const { data } = await supabase
        .from('aprender_progresso_aula')
        .select('blocos_concluidos')
        .eq('user_id', user.id)
        .eq('aula_id', aulaId)
        .maybeSingle();
      setProgressoSalvo(Number(data?.blocos_concluidos ?? 0));
    })();
  }, [aulaId, user]);

  const total = blocos.length;
  const perguntas = useMemo(() => blocos.filter((b) => b.tipo === 'pergunta'), [blocos]);

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

  const salvarProgresso = async (concluida = false) => {
    if (!user || !aulaId) return;
    const payload = {
      user_id: user.id,
      aula_id: aulaId,
      blocos_concluidos: concluida ? total : Math.min(maxRevealedIdx + 1, total),
      acertos,
      total_perguntas: perguntas.length,
      tempo_ms: Date.now() - startedAt.current,
      concluida_em: concluida ? new Date().toISOString() : null,
    };
    await supabase.from('aprender_progresso_aula').upsert(payload, { onConflict: 'user_id,aula_id' });
  };

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
  };

  const avaliarFlashcard = async (bloco: Bloco, nivel: NivelFlashcard) => {
    const { data: anterior } = user
      ? await supabase
          .from('aprender_progresso_bloco')
          .select('proxima_revisao_em')
          .eq('user_id', user.id)
          .eq('bloco_id', bloco.id)
          .maybeSingle()
      : { data: null as any };
    const nova = proximaRevisao(nivel, anterior?.proxima_revisao_em);
    await salvarBloco(bloco, { nivel }, nivel === 'sabia', nova);
    toast.success(`Revisão marcada para ${rotuloIntervalo(nova)}`);
    playSwooshSound();
  };

  const responderPergunta = async (bloco: Bloco, escolha: string) => {
    if (respostas[bloco.id]) return;
    const correta = String(bloco.resposta_correta?.id_correto || '').toLowerCase() === escolha.toLowerCase();
    setRespostas((r) => ({ ...r, [bloco.id]: { correta, escolha } }));
    await salvarBloco(bloco, { escolha }, correta);
    if (correta) playSwooshSound();

    setFeedbackPergunta({
      correta,
      escolha,
      explicacao: bloco.resposta_correta?.explicacao || 'Revise o conceito aprendido nesta etapa e siga em frente!',
    });
  };

  const concluirAula = async () => {
    await salvarProgresso(true);
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
  };
  
  const comecarAula = () => {
    setCurrentIdx(0);
    setProgressoSalvo(0);
    setRespostas({});
    setFlipped({});
    setConexoes({});
    startedAt.current = Date.now();
    setMostrarPrevia(false);
  };
  
  const continuarAula = (idx: number) => {
    setCurrentIdx(idx);
    startedAt.current = Date.now();
    setMostrarPrevia(false);
  };

  const avancarIdx = () => setCurrentIdx((i) => Math.min(total - 1, i + 1));
  const voltarIdx = () => setCurrentIdx((i) => Math.max(0, i - 1));

  return {
    aula,
    blocos,
    loading,
    proximaAula,
    proximasAulas,
    total,
    perguntas,
    
    currentIdx, setCurrentIdx,
    respostas,
    flipped, setFlipped,
    conexoes, setConexoes,
    
    finalizada, setFinalizada,
    mostrarPrevia, setMostrarPrevia,
    progressoSalvo,
    feedbackPergunta, setFeedbackPergunta,
    maxRevealedIdx,
    acertos,
    
    playFlipSound,
    playSwooshSound,
    
    avaliarFlashcard,
    responderPergunta,
    concluirAula,
    salvarBloco,
    
    refazerAula,
    comecarAula,
    continuarAula,
    avancarIdx,
    voltarIdx,
  };
}
