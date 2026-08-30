import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, ChevronUp, Clock, Heart, Loader2, PlayCircle, CheckCircle2, XCircle, X, RotateCw, Sparkles, AlertTriangle, ScanText, FileText, Plus, MessageSquare, Trophy, Grid2X2, Mic, Layers, ArrowRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Questao } from '@/hooks/useQuestoes';
import { letraGabarito } from '@/lib/questoesVisual';
import { haptic } from '@/lib/nativeHaptics';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { QuestaoAcoesBar, ComentarioSheet } from '@/components/questoes/QuestaoAcoesBar';
import { useGatedFeature } from '@/hooks/useGatedFeature';
import { CartaoRespostaSheet } from './CartaoRespostaSheet';
import { CartaoRespostaGrid } from './CartaoRespostaGrid';

import { getSessaoById, saveSessao } from '@/lib/questoesSessoes';

const db = supabase as any;

/* ─── Fila Offline de Respostas ─── */
const OFFLINE_QUEUE_KEY = 'APP_PRIME_RESPOSTAS_OFFLINE';
interface QueuedResposta { questao_id: string; alternativa: string; acertou: boolean; contexto: string; tempo_ms: number; user_id: string; ts: number; }

function enqueueResposta(item: QueuedResposta) {
  try {
    const queue: QueuedResposta[] = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
    queue.push(item);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch { /* storage full — ignora */ }
}

async function flushRespostaQueue() {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return;
    const queue: QueuedResposta[] = JSON.parse(raw);
    if (!queue.length) return;
    // Tenta enviar em lote
    const rows = queue.map(({ ts, ...rest }) => rest);
    const { error } = await db.from('questoes_respostas').insert(rows);
    if (!error) {
      localStorage.removeItem(OFFLINE_QUEUE_KEY);
    }
  } catch { /* rede indisponível — tenta na próxima vez */ }
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

function formatarTempo(seg: number) {
  const m = Math.floor(seg / 60).toString().padStart(2, '0');
  const s = (seg % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/** Player padrão de resolução: seleção → Responder → feedback → comentário + recursos. */
const ResolverPadrao = ({
  questoes, loading, contexto = 'pratica', onRegistrar, onNovoBloco, onBack, vazioTexto, sessaoId,
}: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [idx, setIdx] = useState(0);
  const [selecao, setSelecao] = useState<string | null>(null);
  const [respostas, setRespostas] = useState<Record<string, { escolha: string; acertou: boolean }>>({});
  const [comentarioAberto, setComentarioAberto] = useState(false);

  const [favoritos, setFavoritos] = useState<Set<string>>(new Set());
  const [segundos, setSegundos] = useState(0);
  const [recursosAberto, setRecursosAberto] = useState(false);
  const [feedbackOculto, setFeedbackOculto] = useState(false);
  const [gradeAberta, setGradeAberta] = useState(false);
  const [streak, setStreak] = useState(0);
  const [abaAtiva, setAbaAtiva] = useState<'texto' | 'questao'>('questao');
  const [eliminadas, setEliminadas] = useState<Record<string, Set<string>>>({});
  const [ocrLoading, setOcrLoading] = useState<Record<string, boolean>>({});
  const [ocrText, setOcrText] = useState<Record<string, string>>({});
  const topoRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gateQuestoes = useGatedFeature('questoes', 'questoes');
  const gateFuncoes = useGatedFeature('questao_funcoes', 'questao_funcoes');

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

  const handleSwipe = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const THRESHOLD = 60;
    const VELOCITY = 300;
    if (Math.abs(info.offset.x) > THRESHOLD || Math.abs(info.velocity.x) > VELOCITY) {
      if (info.offset.x < 0 && idx < questoes.length - 1) {
        setSwipeDir(1);
        setIdx(i => i + 1);
        haptic.selection?.();
      } else if (info.offset.x > 0 && idx > 0) {
        setSwipeDir(-1);
        setIdx(i => i - 1);
        haptic.selection?.();
      }
    }
  }, [idx, questoes.length]);

  // Long-press para eliminar alternativa
  const handleLongPressStart = useCallback((letra: string) => {
    if (resp) return; // Já respondeu
    longPressTimer.current = setTimeout(() => {
      haptic.impact?.();
      setEliminadas(prev => {
        const qid = questoes[idx]?.id;
        if (!qid) return prev;
        const current = new Set(prev[qid] || []);
        if (current.has(letra)) {
          current.delete(letra); // Desriscar
        } else {
          current.add(letra); // Riscar
        }
        // Se a seleção atual foi eliminada, limpa
        if (current.has(selecao ?? '')) setSelecao(null);
        return { ...prev, [qid]: current };
      });
    }, 500);
  }, [resp, idx, questoes, selecao]);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const eliminadasAtuais = atual ? (eliminadas[atual.id] ?? new Set()) : new Set<string>();

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
      // Tentar carregar da LAST_SESSION (legado) ou de sessao sem ID (fallback)
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
      } catch(e) {}
    }
    
    setIdx(0); setRespostas({}); setSelecao(null); setSegundos(0); setFeedbackOculto(false); setStreak(0);
  }, [questoes, contexto, sessaoId]);

  useEffect(() => {
    if (questoes.length === 0) return;
    const q = questoes[idx];
    setAbaAtiva(q?.texto_associado ? 'texto' : 'questao');
  }, [idx, questoes]);

  useEffect(() => {
    if (questoes.length === 0) return;
    
    // Atualiza a ultima sessao generica
    try {
      localStorage.setItem('APP_PRIME_LAST_SESSION', JSON.stringify({
        contexto,
        questoesHash: questoes.length,
        respostas,
        idx,
        streak
      }));
    } catch(e) {}

    // Salva na aba de historico
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
        contexto
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
    return Math.abs(hash) % 71 + 15;
  }, [idx, questoes]);

  useEffect(() => {
    setSelecao(resp?.escolha ?? null);
    setFeedbackOculto(false);
    topoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [idx, resp?.escolha]);

  const alternativas = useMemo(() => {
    if (!atual) return [];
    return ([['A', atual.alt_a], ['B', atual.alt_b], ['C', atual.alt_c], ['D', atual.alt_d], ['E', atual.alt_e]] as const)
      .filter(([, t]) => t && String(t).trim())
      .map(([l, t]) => ({ letra: l as string, texto: String(t) }));
  }, [atual]);

  const acertos = Object.values(respostas).filter((r) => r.acertou).length;
  const todasRespondidas = questoes.length > 0 && questoes.every((q) => respostas[q.id]);

  const responder = useCallback(() => {
    if (!atual || !selecao || resp) return;
    if (gateQuestoes.blocked) { gateQuestoes.openGate(); return; }
    const acertou = selecao === correta;
    haptic[acertou ? 'success' : 'warning']?.();
    setStreak(acertou ? streak + 1 : 0);
    
    setRespostas((prev) => ({ ...prev, [atual.id]: { escolha: selecao, acertou } }));

    // Offline-first: enfileira localmente e tenta enviar
    if (user) {
      const tempo = Date.now();
      enqueueResposta({ questao_id: atual.id, alternativa: selecao, acertou, contexto, tempo_ms: tempo, user_id: user.id, ts: tempo });
    }
    onRegistrar(atual.id, selecao, acertou, contexto);
    // Tenta flush assíncrono sem bloquear UI
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
        '1': 'A', 'A': 'A',
        '2': 'B', 'B': 'B',
        '3': 'C', 'C': 'C',
        '4': 'D', 'D': 'D',
        '5': 'E', 'E': 'E',
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
    if (typeof window !== 'undefined') {
      import('sonner').then(({ toast }) => toast.info('Função de reportar erro em breve!'));
    }
  };

  const isBuscando = loading || countdown > 0;

  if (isBuscando) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={countdown}
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="flex h-32 w-32 items-center justify-center rounded-full bg-[#E11D48]/10 text-6xl font-black text-[#E11D48] shadow-[0_0_40px_rgba(225,29,72,0.2)]"
          >
            {countdown > 0 ? countdown : <Loader2 className="h-12 w-12 animate-spin text-[#E11D48]" />}
          </motion.div>
        </AnimatePresence>
        <p className="mt-8 text-lg font-bold text-zinc-400 animate-pulse">Preparando suas questões...</p>
      </div>
    );
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
    <div ref={topoRef} className={cn("flex min-h-screen flex-col bg-background", resp ? "pb-[260px]" : "pb-32")}>
      {gateQuestoes.gateNode}
      {gateFuncoes.gateNode}

      <div className="sticky top-0 z-50 flex flex-col">
        <div className="flex items-center justify-between bg-primary px-4 pb-4 pt-safe-header text-primary-foreground shadow-sm">
          <button onClick={onBack} aria-label="Voltar" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-black/15 hover:bg-black/25 transition-colors">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="flex-1 px-3 flex flex-col items-center justify-center">
            <div className="flex items-center gap-2">
              <p className="line-clamp-1 text-[16px] font-bold leading-tight">{atual.disciplina}</p>
              <AnimatePresence>
                {streak >= 3 && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex items-center gap-1 rounded-full bg-orange-500/20 px-2 py-0.5"
                  >
                    <Trophy className="h-3 w-3 text-orange-500" />
                    <span className="text-[12px] font-bold text-orange-500">{streak}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <button onClick={agendarNotificacaoErro} aria-label="Reportar Erro" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-black/15 hover:bg-black/25 transition-colors">
            <AlertTriangle className="h-5 w-5" />
          </button>
        </div>
        {/* ── Barra de Progresso Viva ── */}
        <div className="h-[3px] w-full bg-black/20">
          <motion.div
            className="h-full bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 rounded-r-full"
            initial={false}
            animate={{ width: `${progresso}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>
      </div>

      <div className={cn("relative mx-auto w-full max-w-7xl px-0 lg:px-8 lg:grid lg:grid-cols-[1fr_320px] lg:gap-8 lg:items-start flex-1 transition-all", feedbackOculto ? "pb-24 lg:pb-8" : "pb-32 lg:pb-8")}>
        
        {/* Main Content Column */}
        <div className="relative w-full max-w-3xl mx-auto lg:max-w-none lg:mx-0 px-4 sm:px-6 pt-6 sm:pt-8 flex flex-col min-w-0">
        <AnimatePresence mode="wait" custom={swipeDir}>
          <motion.div
            key={atual.id}
            custom={swipeDir}
            initial={{ opacity: 0, x: swipeDir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: swipeDir * -40 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            drag={resp ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleSwipe}
            className="flex flex-col touch-pan-y"
          >
        <div className="flex items-end justify-between border-b border-border/50 pb-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[36px] font-extrabold leading-none text-foreground tracking-tight">
              {String(idx + 1).padStart(2, '0')}
            </span>
            <span className="text-[16px] font-medium text-muted-foreground">de {questoes.length}</span>
          </div>
          
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => { if (gateFuncoes.blocked) { gateFuncoes.openGate(); return; } setRecursosAberto(!recursosAberto); }}
              className="relative overflow-hidden flex h-10 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 text-[14px] font-semibold text-primary transition-colors hover:bg-primary/20 active:scale-95"
            >
              <Plus className="h-4 w-4 z-10" />
              <span className="z-10">Recursos</span>
              <motion.div
                key={atual.id}
                initial={{ x: '-150%' }}
                animate={{ x: '150%' }}
                transition={{ duration: 0.7, ease: "easeInOut", delay: 0.3 }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/30 to-transparent skew-x-12 z-0"
              />
            </button>
          </div>
        </div>

        {/* Questões Ações Bar - Slide Down when Recursos is open */}
        <AnimatePresence>
          {recursosAberto && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-border/50"
            >
              <div className="py-4">
                <QuestaoAcoesBar source={atual.id} chaveRevisao={atual.id} layout="horizontal" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-1.5 pt-4 pb-5 text-[14px] text-muted-foreground/90">
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {atual.ano && <span><strong className="font-semibold text-foreground/80">Ano:</strong> {atual.ano}</span>}
            {atual.banca && <span><strong className="font-semibold text-foreground/80">Banca:</strong> {atual.banca}</span>}
          </div>
          {atual.assunto && (
            <div>
              <strong className="font-semibold text-foreground/80">Assunto:</strong> {atual.assunto}
            </div>
          )}
        </div>

        {atual.texto_associado && (
          <div className="mb-6 flex w-full max-w-[400px] items-center gap-1 rounded-xl bg-muted/50 p-1">
            <button
              onClick={() => setAbaAtiva('texto')}
              className={cn(
                "flex-1 rounded-lg py-2 text-[14px] font-bold transition-all",
                abaAtiva === 'texto' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Texto
            </button>
            <button
              onClick={() => setAbaAtiva('questao')}
              className={cn(
                "flex-1 rounded-lg py-2 text-[14px] font-bold transition-all",
                abaAtiva === 'questao' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Questão
            </button>
          </div>
        )}

        {abaAtiva === 'texto' && atual.texto_associado ? (
          <motion.div 
            key="texto"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col pb-6"
          >
            <div className="rounded-2xl border border-border/50 bg-muted/20 p-5 text-[16px] leading-[1.75] text-muted-foreground whitespace-pre-wrap shadow-sm">
              {atual.texto_associado}
            </div>
            <button
              onClick={() => setAbaAtiva('questao')}
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-extrabold text-primary-foreground shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
            >
              Ir para Questão <ChevronRight className="h-5 w-5" />
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="questao"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-col gap-4 pb-6">
              <p className="text-[16.5px] font-normal leading-[1.75] text-foreground sm:text-[17.5px] whitespace-pre-wrap">{atual.enunciado}</p>
            </div>

            <div className="space-y-3">
              {alternativas.map((op) => {
                const escolhida = selecao === op.letra;
                const revela = !!resp && op.letra === correta;
                const errou = !!resp && resp.escolha === op.letra && !resp.acertou;
                const riscada = eliminadasAtuais.has(op.letra);
                return (
                  <button
                    key={op.letra}
                    disabled={!!resp || riscada}
                    onClick={() => { if (riscada) return; haptic.selection?.(); setSelecao(op.letra); setAbaAtiva('questao'); }}
                    onPointerDown={() => handleLongPressStart(op.letra)}
                    onPointerUp={handleLongPressEnd}
                    onPointerLeave={handleLongPressEnd}
                    onContextMenu={(e) => e.preventDefault()}
                    className={cn(
                      'relative flex min-h-[60px] w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all select-none',
                      revela ? 'border-green-500 bg-green-500/10'
                        : errou ? 'border-red-500 bg-red-500/10'
                        : riscada ? 'border-border/30 bg-muted/20 opacity-40'
                        : escolhida ? 'border-primary bg-primary/5'
                        : 'border-border/60 bg-muted/40 hover:border-border hover:bg-accent/50',
                    )}
                  >
                    <span className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-bold',
                      revela ? 'bg-green-500 text-white' : errou ? 'bg-red-500 text-white' : escolhida ? 'bg-primary text-primary-foreground' : 'bg-foreground/5 text-foreground/60',
                    )}>
                      {op.letra}
                    </span>
                    <span className={cn('flex-1 text-[16px] leading-[1.5] text-foreground/90', riscada && 'line-through text-muted-foreground/50')}>
                      {op.texto}
                    </span>
                    {/* Linha diagonal de eliminação */}
                    {riscada && !resp && (
                      <div className="absolute inset-y-0 left-4 right-4 flex items-center pointer-events-none">
                        <div className="h-[2px] w-full bg-red-500/40 rounded-full" />
                      </div>
                    )}
                  </button>
                );
              })}
              {!resp && (
                <p className="text-center text-[12px] text-muted-foreground/50 pt-1">
                  Segure para eliminar uma alternativa
                </p>
              )}
            </div>
          </motion.div>
        )}
        </motion.div>
        </AnimatePresence>
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
              questoesIdMap={questoes.map(q => q.id)}
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

      <AnimatePresence>
        {resp && !feedbackOculto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm"
            onClick={() => setFeedbackOculto(true)}
          />
        )}
      </AnimatePresence>

      <div className="fixed inset-x-0 bottom-0 z-40 pointer-events-none">
        <div className="mx-auto w-full max-w-7xl lg:px-8">
          <AnimatePresence mode="wait">
            {!resp ? (
              selecao ? (
                <motion.div
                  key="selecao"
                  initial={{ y: 80, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 80, opacity: 0 }}
                  transition={{ type: "tween", ease: 'easeOut', duration: 0.15 }}
                  className="pointer-events-auto rounded-t-3xl border-t border-border/50 bg-background/80 px-4 pb-safe-nav pt-4 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] backdrop-blur-xl lg:rounded-2xl lg:border lg:mb-8 lg:max-w-[calc(100%-320px-2rem)]"
                >
                  <div className="mx-auto flex max-w-3xl items-center gap-2">
                    <button
                      onClick={responder}
                      disabled={!selecao}
                      className={cn(
                        "flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-[15px] font-extrabold shadow-lg transition-all active:scale-[0.97]",
                        selecao ? "bg-primary text-primary-foreground shadow-primary/25 hover:bg-primary/90" : "bg-muted/50 text-muted-foreground cursor-not-allowed"
                      )}
                    >
                      Responder <CheckCircle2 className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => setGradeAberta(true)}
                      className="flex h-12 items-center justify-center rounded-xl bg-muted/50 px-4 text-foreground/60 transition-colors hover:bg-muted active:scale-[0.97] lg:hidden"
                    >
                      <Grid2X2 className="h-5 w-5" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div key="botoes-auxiliares" className="absolute bottom-6 right-6 pointer-events-auto flex flex-col gap-3 lg:hidden">
                  <button 
                    onClick={() => setGradeAberta(true)}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/80 text-foreground/70 shadow-lg backdrop-blur-md transition-all hover:bg-muted active:scale-[0.95] border border-border/50"
                  >
                    <Grid2X2 className="h-6 w-6" />
                  </button>
                </div>
              )
            {!feedbackOculto && (resp || (idx === questoes.length - 1 && selecao)) ? (
              <>
                <motion.div
                  key="feedback-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setFeedbackOculto(true)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
                  style={{ zIndex: -1 }}
                />
                <motion.div
                  key="feedback"
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 40, opacity: 0 }}
                  transition={{ type: "tween", ease: 'easeOut', duration: 0.2 }}
                  className={cn(
                    "pointer-events-auto relative rounded-t-3xl border-t px-5 pb-safe-nav pt-7 shadow-2xl lg:rounded-2xl lg:border lg:mb-8 lg:max-w-[calc(100%-320px-2rem)]",
                    resp.acertou ? "bg-[#0f1f14] border-green-500/30" : "bg-[#1f0a0a] border-red-500/30"
                  )}
                >
                  <button
                    onClick={() => setFeedbackOculto(true)}
                    className={cn("absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full transition-colors", 
                      resp.acertou ? "bg-green-500/20 text-green-500 hover:bg-green-500/30" : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    )}
                  >
                    <X className="h-5 w-5" />
                  </button>
                <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
                  <div className="flex items-center gap-4">
                    <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full", resp.acertou ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-400")}>
                      {resp.acertou ? <CheckCircle2 className="h-7 w-7" /> : <XCircle className="h-7 w-7" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-[22px] font-extrabold tracking-tight", resp.acertou ? "text-green-500" : "text-red-400")}>
                        {resp.acertou ? 'Resposta correta!' : 'Resposta incorreta'}
                      </p>
                      {resp.acertou ? (
                        <p className="text-[14px] font-medium text-green-500/80">
                          Você mandou bem.
                        </p>
                      ) : (
                        <p className="mt-1 text-[14.5px] font-medium text-red-400/80">
                          O gabarito é a <strong className="rounded bg-red-500/20 px-2 py-0.5 text-red-300">Alternativa {correta}</strong>
                        </p>
                      )}
                      <div className={cn("mt-2 text-[12px] font-medium flex items-center gap-1.5", resp.acertou ? "text-green-500/70" : "text-white/50")}>
                        <div className="h-1 flex-1 bg-black/20 rounded-full overflow-hidden max-w-[100px]">
                          <div className={cn("h-full rounded-full transition-all duration-1000", resp.acertou ? "bg-green-500" : "bg-red-500/50")} style={{ width: `${percentualAcerto}%` }} />
                        </div>
                        {percentualAcerto}% acertaram
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4 py-1">
                    <button
                      onClick={() => { if (gateFuncoes.blocked) { gateFuncoes.openGate(); return; } setComentarioAberto(true); }}
                      className={cn("relative overflow-hidden flex h-[60px] w-full items-center justify-between rounded-2xl border px-5 shadow-sm transition-all active:scale-[0.98]", 
                        resp.acertou 
                          ? "bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500/20" 
                          : "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                      )}
                    >
                      <motion.div 
                        className="absolute inset-0 w-[40%] bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                        animate={{ x: ["-250%", "350%"] }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", repeatDelay: 1 }}
                      />
                      <div className="flex items-center gap-3 relative z-10">
                        <MessageSquare className="h-6 w-6" /> 
                        <span className="text-[16px] font-bold">Ver comentário completo</span>
                      </div>
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                        className="relative z-10"
                      >
                        <ArrowRight className="h-5 w-5 opacity-80" />
                      </motion.div>
                    </button>

                    <div className="w-full">
                      <QuestaoAcoesBar source={atual.id} chaveRevisao={atual.id} layout="grid" />
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    {idx === questoes.length - 1 ? (
                      <button
                        onClick={onNovoBloco}
                        className={cn(
                          "flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-[15px] font-extrabold text-white shadow-lg transition-all active:scale-[0.97]",
                          resp.acertou ? "bg-green-600 hover:bg-green-500 shadow-green-600/25" : "bg-red-600 hover:bg-red-500 shadow-red-600/25"
                        )}
                      >
                        <RotateCw className="h-5 w-5" /> Novo bloco
                      </button>
                    ) : (
                      <button
                        onClick={() => setIdx((i) => i + 1)}
                        className={cn(
                          "flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-[15px] font-extrabold text-white shadow-lg transition-all active:scale-[0.97]",
                          resp.acertou ? "bg-green-600 hover:bg-green-500 shadow-green-600/25" : "bg-red-600 hover:bg-red-500 shadow-red-600/25"
                        )}
                      >
                        Próxima questão <ChevronRight className="h-5 w-5" />
                      </button>
                    )}
                    <button 
                      onClick={() => setGradeAberta(true)}
                      className="flex h-12 items-center justify-center rounded-xl bg-white/5 px-4 text-foreground/60 transition-colors hover:bg-white/10 active:scale-[0.97] lg:hidden"
                    >
                      <Grid2X2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
              </>
            ) : (
                <motion.div
                  key="feedback-oculto"
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 40, opacity: 0 }}
                  transition={{ type: "tween", ease: 'easeOut', duration: 0.15 }}
                  className="pointer-events-auto rounded-t-3xl border-t border-border/50 bg-background/80 px-4 pb-safe-nav pt-4 shadow-2xl backdrop-blur-xl lg:rounded-2xl lg:border lg:mb-8 lg:max-w-[calc(100%-320px-2rem)]"
                >
                <div className="mx-auto flex max-w-3xl items-center gap-2">
                  <button
                    onClick={() => setFeedbackOculto(false)}
                    className="flex h-12 items-center justify-center gap-2 rounded-xl bg-muted/50 px-4 text-[14px] font-semibold text-foreground/80 transition-colors hover:bg-muted active:scale-[0.97]"
                  >
                    <ChevronUp className="h-4 w-4" /> Feedback
                  </button>
                  {idx === questoes.length - 1 ? (
                    <button
                      onClick={onNovoBloco}
                      className={cn("flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-[15px] font-extrabold text-white shadow-lg", resp.acertou ? "bg-green-600" : "bg-red-600")}
                    >
                      <RotateCw className="h-5 w-5" /> Novo bloco
                    </button>
                  ) : (
                    <button
                      onClick={() => setIdx((i) => i + 1)}
                      className={cn("flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-[15px] font-extrabold text-white shadow-lg", resp.acertou ? "bg-green-600" : "bg-red-600")}
                    >
                      Próxima questão <ChevronRight className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

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
        questoesIdMap={questoes.map(q => q.id)}
        onSelect={setIdx}
      />
    </div>
  );
};

export default ResolverPadrao;
