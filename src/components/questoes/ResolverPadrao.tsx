import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Clock, Heart, Loader2, PlayCircle, CheckCircle2, XCircle, RotateCw, Sparkles, AlertTriangle, ScanText, FileText, Plus,
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
  const [ocrLoading, setOcrLoading] = useState<Record<string, boolean>>({});
  const [ocrText, setOcrText] = useState<Record<string, string>>({});
  const topoRef = useRef<HTMLDivElement>(null);
  const gateQuestoes = useGatedFeature('questoes', 'questoes');
  const gateFuncoes = useGatedFeature('questao_funcoes', 'questao_funcoes');

  useEffect(() => {
    setIdx(0); setRespostas({}); setSelecao(null); setSegundos(0);
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
    if (!gateFuncoes.blocked) setComentarioAberto(true);
  };

  // Atalhos de teclado no Desktop (A, B, C, D, E ou 1, 2, 3, 4, 5 para escolher; Enter para responder/avançar)
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


  const favoritar = async () => {
    if (!atual || !user) { toast.error('Entre na sua conta para salvar'); return; }
    const ja = favoritos.has(atual.id);
    setFavoritos((p) => { const n = new Set(p); ja ? n.delete(atual.id) : n.add(atual.id); return n; });
    if (ja) await db.from('questoes_favoritos').delete().eq('user_id', user.id).eq('questao_id', atual.id);
    else await db.from('questoes_favoritos').insert({ user_id: user.id, questao_id: atual.id });
  };

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
    // Ação do ícone de atenção (reportar erro)
    // Pode abrir um sheet ou alert. Por enquanto apenas feedback visual:
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

  const tags = [atual.disciplina, atual.assunto ?? atual.tema_central, atual.ano ? String(atual.ano) : null, atual.banca]
    .filter(Boolean) as string[];

  return (
    <div ref={topoRef} className={cn("flex min-h-screen flex-col bg-background", resp ? "pb-[260px]" : "pb-32")}>
      {gateQuestoes.gateNode}
      {gateFuncoes.gateNode}

      {/* 1. Cabeçalho Principal */}
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
        {/* 2. Sub-cabeçalho (Numeração e Recursos) */}
        <div className="flex items-end justify-between border-b border-border/50 pb-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[36px] font-extrabold leading-none text-foreground tracking-tight">
              {String(idx + 1).padStart(2, '0')}
            </span>
            <span className="text-[15px] font-medium text-muted-foreground mb-1">
              de {questoes.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setRecursosAberto(!recursosAberto)}
              className="relative ml-1 flex h-9 items-center gap-1.5 overflow-hidden rounded-full border border-primary px-3 text-[13px] font-bold text-primary hover:bg-primary/5 transition-colors"
            >
              <Plus className="h-4 w-4 z-10" />
              <span className="z-10">Recursos</span>
              
              {/* Animação de reflexo brilhante a cada nova questão */}
              <motion.div
                key={atual.id}
                initial={{ x: '-150%' }}
                animate={{ x: '200%' }}
                transition={{ duration: 0.7, ease: "easeInOut", delay: 0.3 }}
                className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-primary/30 to-transparent skew-x-12 z-0"
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
                <QuestaoAcoesBar source={atual.id} chaveRevisao={atual.id} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. Metadados (Ano, Banca, Órgão, Assunto) */}
        <div className="flex flex-col gap-1.5 pt-4 pb-5 text-[14px] text-muted-foreground/90">
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {atual.ano && <span><strong className="font-semibold text-foreground/80">Ano:</strong> {atual.ano}</span>}
            {atual.banca && <span><strong className="font-semibold text-foreground/80">Banca:</strong> {atual.banca}</span>}
            {atual.orgao && <span><strong className="font-semibold text-foreground/80">Órgão:</strong> {atual.orgao}</span>}
          </div>
          {atual.assunto && (
            <div>
              <strong className="font-semibold text-foreground/80">Assunto:</strong> {atual.assunto}
            </div>
          )}
        </div>

        {/* Textos da Questão */}
        <div className="flex flex-col gap-4 pb-6">
          {atual.texto_associado && (
            <div className="max-h-60 overflow-y-auto rounded-xl bg-muted/40 p-4 text-[15.5px] leading-[1.65] text-muted-foreground sm:text-[16px]">
              {atual.texto_associado}
            </div>
          )}

          {atual.imagem_url && (
            <div className="space-y-3">
              {!ocrText[atual.id] && (
                <img src={atual.imagem_url} alt="Imagem da questão" loading="lazy" className="w-full rounded-xl border border-border" />
              )}
              {ocrText[atual.id] && (
                <div className="max-h-96 overflow-y-auto rounded-xl border border-border bg-card p-5 text-[16px] leading-[1.7] text-foreground shadow-sm">
                  <div className="mb-3 flex items-center gap-2 border-b border-border/50 pb-2 text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
                    <FileText className="h-4 w-4" /> Texto extraído da imagem
                  </div>
                  <div className="whitespace-pre-wrap">{ocrText[atual.id]}</div>
                </div>
              )}
              {!ocrText[atual.id] && (
                <button
                  onClick={() => extrairOcr(atual.imagem_url!, atual.id)}
                  disabled={ocrLoading[atual.id]}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent/50 py-3.5 text-[14px] font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {ocrLoading[atual.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanText className="h-4 w-4" />}
                  {ocrLoading[atual.id] ? 'Lendo texto da imagem...' : 'Extrair texto com IA (OCR)'}
                </button>
              )}
            </div>
          )}

          <p className="text-[16.5px] font-normal leading-[1.7] text-foreground sm:text-[17.5px]">
            {atual.enunciado}
          </p>
        </div>

        {/* 4. Alternativas */}
        <div className="space-y-3">
          {alternativas.map((op) => {
            const escolhida = selecao === op.letra;
            const revela = !!resp && op.letra === correta;
            const errou = !!resp && resp.escolha === op.letra && !resp.acertou;
            
            // Auto responder logic:
            const handleSelect = () => {
              haptic.light?.(); 
              setSelecao(op.letra);
              // Na nova UI, como não temos o botão enorme de responder, podemos ativar a resposta automática
              // ou manter a seleção para responder depois se ainda formos implementar isso.
              // Como no QConcursos a resposta é imediata ou tem um botão fixo, vamos manter o fluxo atual onde ele clica 
              // e aparece o "Responder" em baixo, mas com o botão "Responder" embutido na barra inferior?
              // Vamos manter o setSelecao por enquanto.
            };

            return (
              <button
                key={op.letra}
                disabled={!!resp}
                onClick={handleSelect}
                className={cn(
                  'flex min-h-[60px] w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all',
                  revela ? 'border-green-500 bg-green-500/10 shadow-sm shadow-green-500/10'
                    : errou ? 'border-red-500 bg-red-500/10 shadow-sm shadow-red-500/10'
                    : escolhida ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
                    : 'border-border/60 bg-muted/40 hover:border-border hover:bg-accent/50',
                )}
              >
                <span className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-bold transition-colors',
                  revela ? 'bg-green-500 text-white'
                    : errou ? 'bg-red-500 text-white'
                    : escolhida ? 'bg-primary text-primary-foreground'
                    : 'bg-foreground/5 text-foreground/60',
                )}>
                  {op.letra}
                </span>
                <span className="flex-1 text-[16px] leading-[1.5] text-foreground/90">{op.texto}</span>
                {revela && <CheckCircle2 className="h-6 w-6 shrink-0 text-green-600" />}
                {errou && <XCircle className="h-6 w-6 shrink-0 text-red-600" />}
              </button>
            );
          })}
        </div>

      {/* feedback + navegação após responder */}
      {resp && (
        <div className={cn(
          'flex items-center gap-2 rounded-xl border p-4 text-[15px] font-semibold sm:text-[16px]',
          resp.acertou ? 'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400'
            : 'border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400',
        )}>
          {resp.acertou ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
          {resp.acertou ? 'Resposta correta!' : `Você errou — o gabarito é ${correta}`}
        </div>
      )}



      {todasRespondidas && (
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <Trophy className="h-6 w-6 text-primary" />
          <p className="text-[14px] text-muted-foreground">
            {acertos} de {questoes.length} ({Math.round((acertos / questoes.length) * 100)}% de aproveitamento)
          </p>
        </div>
      )}

        {/* 5. Barra Fixa Inferior (Bottom Navigation) */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 px-4 pb-safe-nav pt-3 backdrop-blur-md shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
            
            <AnimatePresence>
              {resp && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mb-2 space-y-3">
                    <button
                      onClick={() => { if (gateFuncoes.blocked) { gateFuncoes.openGate(); return; } setComentarioAberto(true); }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 py-3.5 text-[15.5px] font-bold text-primary transition-colors hover:bg-primary/20"
                    >
                      <Sparkles className="h-5 w-5" /> Ver comentário do professor
                    </button>
                    <div className="pt-1 border-t border-border/50">
                      <QuestaoAcoesBar source={atual.id} chaveRevisao={atual.id} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setIdx((i) => i - 1)}
                disabled={idx === 0}
                className="flex h-12 flex-1 items-center justify-center gap-1.5 text-[15px] font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
              >
                <ChevronLeft className="h-5 w-5" /> Anterior
              </button>
              
              {!resp && selecao ? (
                <button
                  onClick={responder}
                  className="flex h-12 flex-1 items-center justify-center rounded-xl bg-primary text-[15px] font-bold text-primary-foreground shadow-lg shadow-primary/25 active:scale-95 transition-all"
                >
                  Responder
                </button>
              ) : resp && idx === questoes.length - 1 ? (
                <button
                  onClick={onNovoBloco}
                  className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary text-[15px] font-bold text-primary-foreground shadow-lg shadow-primary/25 active:scale-95 transition-all"
                >
                  <RotateCw className="h-4 w-4" /> Novo bloco
                </button>
              ) : (
                <button className="flex h-12 flex-1 items-center justify-center rounded-xl bg-muted/60 text-[14.5px] font-bold text-foreground hover:bg-muted transition-colors">
                  Ir para questão
                </button>
              )}

              <button
                onClick={() => setIdx((i) => i + 1)}
                disabled={idx === questoes.length - 1}
                className="flex h-12 flex-1 items-center justify-center gap-1.5 text-[15px] font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
              >
                Próximo <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
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
