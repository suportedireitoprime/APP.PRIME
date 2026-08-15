import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Clock, Heart, Loader2, PlayCircle, CheckCircle2, XCircle, RotateCw, Sparkles, AlertTriangle, ScanText, FileText, Plus, MessageSquare, Trophy
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

const db = supabase as any;

type Props = {
  questoes: Questao[];
  loading: boolean;
  contexto?: string;
  onRegistrar: (questaoId: string, alternativa: string, acertou: boolean, contexto?: string) => void;
  onNovoBloco: () => void;
  onBack?: () => void;
  vazioTexto?: string;
};

function formatarTempo(seg: number) {
  const m = Math.floor(seg / 60).toString().padStart(2, '0');
  const s = (seg % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/** Player padrão de resolução: seleção → Responder → feedback → comentário + recursos. */
const ResolverPadrao = ({
  questoes, loading, contexto = 'pratica', onRegistrar, onNovoBloco, onBack, vazioTexto,
}: Props) => {
  const { user } = useAuth();
  const [idx, setIdx] = useState(0);
  const [selecao, setSelecao] = useState<string | null>(null);
  const [respostas, setRespostas] = useState<Record<string, { escolha: string; acertou: boolean }>>({});
  const [comentarioAberto, setComentarioAberto] = useState(false);
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set());
  const [segundos, setSegundos] = useState(0);
  const [recursosAberto, setRecursosAberto] = useState(false);
  const [feedbackOculto, setFeedbackOculto] = useState(false);
  const [ocrLoading, setOcrLoading] = useState<Record<string, boolean>>({});
  const [ocrText, setOcrText] = useState<Record<string, string>>({});
  const topoRef = useRef<HTMLDivElement>(null);
  const gateQuestoes = useGatedFeature('questoes', 'questoes');
  const gateFuncoes = useGatedFeature('questao_funcoes', 'questao_funcoes');

  useEffect(() => {
    setIdx(0); setRespostas({}); setSelecao(null); setSegundos(0); setFeedbackOculto(false);
  }, [questoes]);

  useEffect(() => {
    const t = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const atual = questoes[idx];
  const resp = atual ? respostas[atual.id] : undefined;
  const correta = letraGabarito(atual?.gabarito_oficial);

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

  const responder = () => {
    if (!atual || !selecao || resp) return;
    if (gateQuestoes.blocked) { gateQuestoes.openGate(); return; }
    const acertou = selecao === correta;
    haptic[acertou ? 'success' : 'warning']?.();
    setRespostas((p) => ({ ...p, [atual.id]: { escolha: selecao, acertou } }));
    onRegistrar(atual.id, selecao, acertou, contexto);
    void gateQuestoes.run();
  };

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

  if (loading) return <div className="h-[520px] animate-pulse rounded-2xl bg-muted" />;

  const extrairOcr = async (url: string, id: string) => {
    setOcrLoading((p) => ({ ...p, [id]: true }));
    try {
      const Tesseract = await import('tesseract.js');
      const { data: { text } } = await Tesseract.recognize(url, 'por');
      setOcrText((p) => ({ ...p, [id]: text }));
    } catch (err) {
      console.error('OCR Error:', err);
    } finally {
      setOcrLoading((p) => ({ ...p, [id]: false }));
    }
  };

  const agendarNotificacaoErro = () => {
    if (typeof window !== 'undefined') {
      import('sonner').then(({ toast }) => toast.info('Função de reportar erro em breve!'));
    }
  };

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

  return (
    <div ref={topoRef} className={cn("flex min-h-screen flex-col bg-background", resp ? "pb-[260px]" : "pb-32")}>
      {gateQuestoes.gateNode}
      {gateFuncoes.gateNode}

      <div className="sticky top-0 z-50 flex items-center justify-between bg-primary px-4 pb-4 pt-safe-header text-primary-foreground shadow-sm">
        <button onClick={onBack} aria-label="Voltar" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-black/15 hover:bg-black/25 transition-colors">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="flex-1 px-3 text-center">
          <p className="line-clamp-1 text-[16px] font-bold leading-tight">{atual.disciplina}</p>
        </div>
        <button onClick={agendarNotificacaoErro} aria-label="Reportar Erro" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-black/15 hover:bg-black/25 transition-colors">
          <AlertTriangle className="h-5 w-5" />
        </button>
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 pt-5 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={atual.id}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex flex-col"
          >
        <div className="flex items-end justify-between border-b border-border/50 pb-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[36px] font-extrabold leading-none text-foreground tracking-tight">
              {String(idx + 1).padStart(2, '0')}
            </span>
            <span className="text-[16px] font-medium text-muted-foreground">de {questoes.length}</span>
          </div>
          
          <div className="flex items-center gap-2">
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

        <div className="flex flex-col gap-4 pb-6">
          {atual.texto_associado && (
            <div className="max-h-60 overflow-y-auto rounded-xl bg-muted/40 p-4 text-[15.5px] leading-[1.65] text-muted-foreground">{atual.texto_associado}</div>
          )}
          <p className="text-[16.5px] font-normal leading-[1.7] text-foreground sm:text-[17.5px]">{atual.enunciado}</p>
        </div>

        <div className="space-y-3">
          {alternativas.map((op) => {
            const escolhida = selecao === op.letra;
            const revela = !!resp && op.letra === correta;
            const errou = !!resp && resp.escolha === op.letra && !resp.acertou;
            return (
              <button
                key={op.letra}
                disabled={!!resp}
                onClick={() => { haptic.light?.(); setSelecao(op.letra); }}
                className={cn(
                  'flex min-h-[60px] w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all',
                  revela ? 'border-green-500 bg-green-500/10'
                    : errou ? 'border-red-500 bg-red-500/10'
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
                <span className="flex-1 text-[16px] leading-[1.5] text-foreground/90">{op.texto}</span>
              </button>
            );
          })}
        </div>
        </motion.div>
        </AnimatePresence>
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

      <div className="fixed inset-x-0 bottom-0 z-40">
          <AnimatePresence mode="wait">
            {!resp ? (
              <motion.div
                key="selecao"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="rounded-t-3xl border-t border-border/50 bg-background/80 px-4 pb-safe-nav pt-4 shadow-2xl backdrop-blur-xl"
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
                    {selecao ? (
                      <>Responder <CheckCircle2 className="h-5 w-5" /></>
                    ) : 'Selecione uma alternativa'}
                  </button>
                  <button className="flex h-12 items-center justify-center rounded-xl bg-muted/50 px-4 text-foreground/60 transition-colors hover:bg-muted active:scale-[0.97]">
                    <Grid2X2 className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            ) : !feedbackOculto ? (
              <motion.div
                key="feedback"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={cn(
                  "relative rounded-t-3xl border-t px-5 pb-safe-nav pt-7 shadow-2xl",
                  resp.acertou ? "bg-[#0a1f10] border-green-500/30" : "bg-[#1f0a0a] border-red-500/30"
                )}
              >
                <button
                  onClick={() => setFeedbackOculto(true)}
                  className="absolute right-4 top-4 rounded-full p-2 text-white/30 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
                  <div className="flex items-center gap-4">
                    <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full", resp.acertou ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                      {resp.acertou ? <CheckCircle2 className="h-7 w-7" /> : <XCircle className="h-7 w-7" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-[22px] font-extrabold tracking-tight", resp.acertou ? "text-green-400" : "text-red-400")}>
                        {resp.acertou ? 'Resposta correta!' : 'Resposta incorreta'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-5 py-1">
                    <button
                      onClick={() => { if (gateFuncoes.blocked) { gateFuncoes.openGate(); return; } setComentarioAberto(true); }}
                      className={cn("flex h-[56px] w-full items-center justify-between rounded-2xl border px-4", resp.acertou ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400")}
                    >
                      <div className="flex items-center gap-3"><MessageSquare className="h-5 w-5" /> <span className="font-bold">Ver comentário</span></div>
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="feedback-oculto"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="rounded-t-3xl border-t border-border/50 bg-background/80 px-4 pb-safe-nav pt-4 shadow-2xl backdrop-blur-xl"
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

      <ComentarioSheet
        aberto={comentarioAberto && !!resp}
        source={atual.id}
        onClose={() => setComentarioAberto(false)}
      />
    </div>
  );
};

export default ResolverPadrao;
