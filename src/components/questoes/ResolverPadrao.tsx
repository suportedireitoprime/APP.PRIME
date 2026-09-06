import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { type PanInfo } from 'framer-motion';
import { Sparkles, Grid2X2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Questao } from '@/hooks/useQuestoes';
import { letraGabarito } from '@/lib/questoesVisual';
import { haptic } from '@/lib/nativeHaptics';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useGatedFeature } from '@/hooks/useGatedFeature';
import { CartaoRespostaSheet } from './CartaoRespostaSheet';
import { CartaoRespostaGrid } from './CartaoRespostaGrid';
import { getSessaoById, saveSessao } from '@/lib/questoesSessoes';
import {
  QuestaoCountdown,
  QuestaoHeader,
  QuestaoEnunciadoCard,
  QuestaoFeedbackDrawer,
  ComentarioSheet,
} from './chunks';
import { QuestaoAcoesBar } from './QuestaoAcoesBar';

const db = supabase as any;

/* ─── Fila Offline de Respostas ─── */
const OFFLINE_QUEUE_KEY = 'APP_PRIME_RESPOSTAS_OFFLINE';
interface QueuedResposta {
  questao_id: string;
  alternativa: string;
  acertou: boolean;
  contexto: string;
  tempo_ms: number;
  user_id: string;
  ts: number;
}

function enqueueResposta(item: QueuedResposta) {
  try {
    const queue: QueuedResposta[] = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
    queue.push(item);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    /* storage full — ignora */
  }
}

async function flushRespostaQueue() {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return;
    const queue: QueuedResposta[] = JSON.parse(raw);
    if (!queue.length) return;
    const rows = queue.map(({ ts, ...rest }) => rest);
    const { error } = await db.from('questoes_respostas').insert(rows);
    if (!error) {
      localStorage.removeItem(OFFLINE_QUEUE_KEY);
    }
  } catch {
    /* rede indisponível — tenta na próxima vez */
  }
}

type Props = {
  questoes: Questao[];
  loading: boolean;
  contexto?: string;
  onRegistrar: (questaoId: string, alternativa: string, acertou: boolean, contexto?: string) => void;
  onNovoBloco: () => void;
  onBack?: () => void;
  vazioTexto?: string;
  sessaoId?: string | null;
};

/** Player padrão de resolução: seleção → Responder → feedback → comentário + recursos. */
const ResolverPadrao = ({
  questoes,
  loading,
  contexto = 'pratica',
  onRegistrar,
  onNovoBloco,
  onBack,
  vazioTexto,
  sessaoId,
}: Props) => {
  const { user } = useAuth();
  const [idx, setIdx] = useState(0);
  const [selecao, setSelecao] = useState<string | null>(null);
  const [respostas, setRespostas] = useState<Record<string, { escolha: string; acertou: boolean }>>({});
  const [comentarioAberto, setComentarioAberto] = useState(false);

  const [segundos, setSegundos] = useState(0);
  const [recursosAberto, setRecursosAberto] = useState(false);
  const [feedbackOculto, setFeedbackOculto] = useState(false);
  const [gradeAberta, setGradeAberta] = useState(false);
  const [streak, setStreak] = useState(0);
  const [abaAtiva, setAbaAtiva] = useState<'texto' | 'questao'>('questao');
  const [eliminadas, setEliminadas] = useState<Record<string, Set<string>>>({});
  const topoRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gateQuestoes = useGatedFeature('questoes', 'questoes');
  const gateFuncoes = useGatedFeature('questao_funcoes', 'questao_funcoes');
  const isFreeFuncoes = !gateFuncoes.isPremium && !gateFuncoes.isAdmin;

  const atual = questoes[idx];
  const resp = atual ? respostas[atual.id] : undefined;
  const correta = letraGabarito(atual?.gabarito_oficial);

  // Flush da fila offline ao montar e quando a rede voltar
  useEffect(() => {
    flushRespostaQueue();
    const handleOnline = () => flushRespostaQueue();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Direção do swipe para animação (1 = direita→esquerda, -1 = esquerda→direita)
  const [swipeDir, setSwipeDir] = useState(1);

  const handleSwipe = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const THRESHOLD = 60;
      const VELOCITY = 300;
      if (Math.abs(info.offset.x) > THRESHOLD || Math.abs(info.velocity.x) > VELOCITY) {
        if (info.offset.x < 0 && idx < questoes.length - 1) {
          setSwipeDir(1);
          setIdx((i) => i + 1);
          haptic.selection?.();
        } else if (info.offset.x > 0 && idx > 0) {
          setSwipeDir(-1);
          setIdx((i) => i - 1);
          haptic.selection?.();
        }
      }
    },
    [idx, questoes.length],
  );

  // Long-press para eliminar alternativa
  const handleLongPressStart = useCallback(
    (letra: string) => {
      if (resp) return;
      longPressTimer.current = setTimeout(() => {
        haptic.impact?.();
        setEliminadas((prev) => {
          const qid = questoes[idx]?.id;
          if (!qid) return prev;
          const current = new Set(prev[qid] || []);
          if (current.has(letra)) {
            current.delete(letra);
          } else {
            current.add(letra);
          }
          if (current.has(selecao ?? '')) setSelecao(null);
          return { ...prev, [qid]: current };
        });
      }, 500);
    },
    [resp, idx, questoes, selecao],
  );

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const eliminadasAtuais = atual ? eliminadas[atual.id] ?? new Set() : new Set<string>();

  useEffect(() => {
    if (questoes.length === 0) return;

    if (sessaoId) {
      const sessao = getSessaoById(sessaoId);
      if (sessao && sessao.questoes.length === questoes.length && sessao.contexto === contexto) {
        setRespostas(sessao.respostas || {});
        setIdx(sessao.idx || 0);
        setStreak(sessao.streak || 0);
        setSelecao(sessao.respostas?.[questoes[sessao.idx || 0]?.id]?.escolha || null);
        setSegundos(0);
        setFeedbackOculto(false);
        return;
      }
    } else {
      try {
        const saved = localStorage.getItem('APP_PRIME_LAST_SESSION');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.contexto === contexto && parsed.questoesHash === questoes.length) {
            setRespostas(parsed.respostas || {});
            setIdx(parsed.idx || 0);
            setStreak(parsed.streak || 0);
            setSelecao(parsed.respostas?.[questoes[parsed.idx || 0]?.id]?.escolha || null);
            setSegundos(0);
            setFeedbackOculto(false);
            return;
          }
        }
      } catch (e) {}
    }

    setIdx(0);
    setRespostas({});
    setSelecao(null);
    setSegundos(0);
    setFeedbackOculto(false);
    setStreak(0);
  }, [questoes, contexto, sessaoId]);

  useEffect(() => {
    if (questoes.length === 0) return;
    const q = questoes[idx];
    setAbaAtiva(q?.texto_associado ? 'texto' : 'questao');
  }, [idx, questoes]);

  useEffect(() => {
    if (questoes.length === 0) return;

    try {
      localStorage.setItem(
        'APP_PRIME_LAST_SESSION',
        JSON.stringify({
          contexto,
          questoesHash: questoes.length,
          respostas,
          idx,
          streak,
        }),
      );
    } catch (e) {}

    if (sessaoId) {
      const searchParams = new URLSearchParams(window.location.search);
      const area = searchParams.get('area') || '';
      const filtroFlag = searchParams.get('filtro') === '1' ? 'Filtro Personalizado' : '';
      const filtroAplicado = area || filtroFlag || 'Sessão Rápida';

      const s = getSessaoById(sessaoId) || {
        id: sessaoId,
        dataInicio: new Date().toISOString(),
        dataUltimoAcesso: new Date().toISOString(),
        filtroAplicado,
        questoes,
        respostas: {},
        idx: 0,
        streak: 0,
        contexto,
      };

      s.dataUltimoAcesso = new Date().toISOString();
      s.respostas = respostas;
      s.idx = idx;
      s.streak = streak;

      saveSessao(s);
    }
  }, [respostas, idx, streak, contexto, questoes, sessaoId]);

  useEffect(() => {
    const t = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const percentualAcerto = useMemo(() => {
    if (!questoes[idx]) return 0;
    let hash = 0;
    for (let i = 0; i < questoes[idx].id.length; i++) {
      hash = questoes[idx].id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return (Math.abs(hash) % 71) + 15;
  }, [idx, questoes]);

  useEffect(() => {
    setSelecao(resp?.escolha ?? null);
    setFeedbackOculto(false);
    topoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [idx, resp?.escolha]);

  const alternativas = useMemo(() => {
    if (!atual) return [];
    return (
      [
        ['A', atual.alt_a],
        ['B', atual.alt_b],
        ['C', atual.alt_c],
        ['D', atual.alt_d],
        ['E', atual.alt_e],
      ] as const
    )
      .filter(([, t]) => t && String(t).trim())
      .map(([l, t]) => ({ letra: l as string, texto: String(t) }));
  }, [atual]);

  const responder = useCallback(() => {
    if (!atual || !selecao || resp) return;
    if (gateQuestoes.blocked) {
      gateQuestoes.openGate();
      return;
    }
    const acertou = selecao === correta;
    haptic[acertou ? 'success' : 'warning']?.();
    setStreak(acertou ? streak + 1 : 0);

    setRespostas((prev) => ({ ...prev, [atual.id]: { escolha: selecao, acertou } }));

    if (user) {
      const tempo = Date.now();
      enqueueResposta({
        questao_id: atual.id,
        alternativa: selecao,
        acertou,
        contexto,
        tempo_ms: tempo,
        user_id: user.id,
        ts: tempo,
      });
    }
    onRegistrar(atual.id, selecao, acertou, contexto);
    void flushRespostaQueue();
    void gateQuestoes.run();
  }, [atual, selecao, resp, gateQuestoes, correta, streak, contexto, onRegistrar, user]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }
      const key = e.key.toUpperCase();
      const mapaLetras: Record<string, string> = {
        '1': 'A',
        A: 'A',
        '2': 'B',
        B: 'B',
        '3': 'C',
        C: 'C',
        '4': 'D',
        D: 'D',
        '5': 'E',
        E: 'E',
      };
      if (mapaLetras[key] && !resp && alternativas.some((a) => a.letra === mapaLetras[key])) {
        e.preventDefault();
        haptic.selection?.();
        setSelecao(mapaLetras[key]);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (!resp && selecao) {
          responder();
        } else if (resp && idx < questoes.length - 1) {
          setIdx((i) => i + 1);
        }
      } else if (e.key === 'ArrowRight' && idx < questoes.length - 1) {
        e.preventDefault();
        setIdx((i) => i + 1);
      } else if (e.key === 'ArrowLeft' && idx > 0) {
        e.preventDefault();
        setIdx((i) => i - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [alternativas, idx, questoes.length, responder, resp, selecao]);

  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (loading) {
      setCountdown(3);
    }
  }, [loading]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setInterval(() => {
        setCountdown((c) => {
          if (c > 1) {
            haptic.selection?.();
            return c - 1;
          }
          clearInterval(t);
          haptic.success?.();
          return 0;
        });
      }, 700);
      return () => clearInterval(t);
    }
  }, [countdown]);

  const agendarNotificacaoErro = () => {
    toast.info('Função de reportar erro em breve!');
  };

  const isBuscando = loading || countdown > 0;

  if (isBuscando) {
    return <QuestaoCountdown countdown={countdown} />;
  }

  if (!questoes.length) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-3 rounded-2xl border border-border bg-muted/40 p-8 text-center mt-10">
        <Sparkles className="h-8 w-8 text-muted-foreground" />
        <p className="text-[15px] font-semibold text-foreground">Nada por aqui ainda</p>
        <p className="max-w-sm text-[14px] text-muted-foreground">
          {vazioTexto ?? 'Nenhuma questão encontrada com esses filtros.'}
        </p>
      </div>
    );
  }

  const progresso = questoes.length > 0 ? (Object.keys(respostas).length / questoes.length) * 100 : 0;

  return (
    <div ref={topoRef} className={cn('flex min-h-screen flex-col bg-background', resp ? 'pb-[260px]' : 'pb-32')}>
      {gateQuestoes.gateNode}
      {gateFuncoes.gateNode}

      <QuestaoHeader
        disciplina={atual.disciplina}
        streak={streak}
        progresso={progresso}
        onBack={onBack}
        onReportarErro={agendarNotificacaoErro}
      />

      <div
        className={cn(
          'relative mx-auto w-full max-w-7xl px-0 lg:px-8 lg:grid lg:grid-cols-[1fr_320px] lg:gap-8 lg:items-start flex-1 transition-all',
          feedbackOculto ? 'pb-24 lg:pb-8' : 'pb-32 lg:pb-8',
        )}
      >
        {/* Main Content Column */}
        <div className="relative w-full max-w-3xl mx-auto lg:max-w-none lg:mx-0 px-4 sm:px-6 pt-6 sm:pt-8 flex flex-col min-w-0">
          <QuestaoEnunciadoCard
            atual={atual}
            idx={idx}
            totalQuestoes={questoes.length}
            swipeDir={swipeDir}
            resp={resp}
            correta={correta}
            selecao={selecao}
            eliminadasAtuais={eliminadasAtuais}
            recursosAberto={recursosAberto}
            abaAtiva={abaAtiva}
            alternativas={alternativas}
            onSwipe={handleSwipe}
            onToggleRecursos={() => {
              if (gateFuncoes.blocked) {
                gateFuncoes.openGate();
                return;
              }
              setRecursosAberto(!recursosAberto);
            }}
            onSetAbaAtiva={setAbaAtiva}
            onSelectAlternativa={(letra) => {
              if (eliminadasAtuais.has(letra)) return;
              haptic.selection?.();
              setSelecao(letra);
              setAbaAtiva('questao');
            }}
            onLongPressStart={handleLongPressStart}
            onLongPressEnd={handleLongPressEnd}
          />
        </div>

        {/* Desktop Sidebar Column */}
        <div className="hidden lg:flex lg:flex-col lg:gap-6 lg:pt-8 lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto w-full shrink-0 hide-scrollbar pb-8">
          {/* Cartão de Resposta Desktop */}
          <div className="bg-muted/30 rounded-2xl border border-border p-5 flex flex-col shadow-sm">
            <h3 className="text-[13px] font-bold text-foreground/70 mb-4 uppercase tracking-wider flex items-center gap-2">
              <Grid2X2 className="w-4 h-4" /> Cartão Resposta
            </h3>
            <CartaoRespostaGrid
              questoesCount={questoes.length}
              idxAtual={idx}
              respostas={respostas}
              questoesIdMap={questoes.map((q) => q.id)}
              onSelect={setIdx}
              className="grid-cols-5 gap-2"
            />
          </div>

          {/* Recursos Desktop */}
          <div className="bg-muted/30 rounded-2xl border border-border p-5 flex flex-col shadow-sm">
            <h3 className="text-[13px] font-bold text-foreground/70 mb-4 uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4" /> Recursos
            </h3>
            <QuestaoAcoesBar source={atual.id} chaveRevisao={atual.id} layout="vertical" />
          </div>
        </div>
      </div>

      <QuestaoFeedbackDrawer
        resp={resp}
        correta={correta}
        selecao={selecao}
        feedbackOculto={feedbackOculto}
        percentualAcerto={percentualAcerto}
        idx={idx}
        totalQuestoes={questoes.length}
        atualId={atual.id}
        onResponder={responder}
        onOpenGrade={() => setGradeAberta(true)}
        onHideFeedback={() => setFeedbackOculto(true)}
        onShowFeedback={() => setFeedbackOculto(false)}
        onOpenComentarios={() => {
          if (isFreeFuncoes) {
            gateFuncoes.openGate();
            return;
          }
          setComentarioAberto(true);
        }}
        onProximaQuestao={() => setIdx((i) => i + 1)}
        onNovoBloco={onNovoBloco}
      />

      <ComentarioSheet
        aberto={comentarioAberto && !!resp}
        source={atual.id}
        onClose={() => setComentarioAberto(false)}
      />

      <CartaoRespostaSheet
        aberto={gradeAberta}
        onClose={() => setGradeAberta(false)}
        questoesCount={questoes.length}
        idxAtual={idx}
        respostas={respostas}
        questoesIdMap={questoes.map((q) => q.id)}
        onSelect={setIdx}
      />
    </div>
  );
};

export default ResolverPadrao;
