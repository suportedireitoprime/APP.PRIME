import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, Heart,
  Trophy, RotateCw, Sparkles, MessageSquare,
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
  vazioTexto?: string;
};

function formatarTempo(seg: number) {
  const m = Math.floor(seg / 60).toString().padStart(2, '0');
  const s = (seg % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/** Player padrão de resolução: seleção → Responder → feedback → comentário + recursos. */
const ResolverPadrao = ({
  questoes, loading, contexto = 'pratica', onRegistrar, onNovoBloco, vazioTexto,
}: Props) => {
  const { user } = useAuth();
  const [idx, setIdx] = useState(0);
  const [selecao, setSelecao] = useState<string | null>(null);
  const [respostas, setRespostas] = useState<Record<string, { escolha: string; acertou: boolean }>>({});
  const [comentarioAberto, setComentarioAberto] = useState(false);
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set());
  const [segundos, setSegundos] = useState(0);
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


  const favoritar = async () => {
    if (!atual || !user) { toast.error('Entre na sua conta para salvar'); return; }
    const ja = favoritos.has(atual.id);
    setFavoritos((p) => { const n = new Set(p); ja ? n.delete(atual.id) : n.add(atual.id); return n; });
    if (ja) await db.from('questoes_favoritos').delete().eq('user_id', user.id).eq('questao_id', atual.id);
    else await db.from('questoes_favoritos').insert({ user_id: user.id, questao_id: atual.id });
  };

  if (loading) return <div className="h-[520px] animate-pulse rounded-2xl bg-muted" />;

  if (!questoes.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-muted/40 p-8 text-center">
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
    <div ref={topoRef} className={cn('flex flex-col gap-4', resp ? 'pb-52' : 'pb-28')}>
      {gateQuestoes.gateNode}
      {gateFuncoes.gateNode}
      {/* topo: contador, tempo, favorito */}
      <div className="flex items-center justify-between">
        <span className="text-[14px] font-bold tabular-nums text-foreground sm:text-[15px]">
          {String(idx + 1).padStart(2, '0')} <span className="text-muted-foreground">de {questoes.length}</span>
        </span>
        <div className="flex items-center gap-2">
          <span className="inline-flex min-h-[32px] items-center gap-1 rounded-full bg-muted px-3 text-[13px] tabular-nums text-muted-foreground">
            <Clock className="h-4 w-4" /> {formatarTempo(segundos)}
          </span>
          <span className="text-[13px] tabular-nums text-muted-foreground">{acertos} acertos</span>
          <button
            onClick={favoritar}
            aria-label="Favoritar questão"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:text-primary"
          >
            <Heart className={cn('h-6 w-6', favoritos.has(atual.id) && 'fill-primary text-primary')} />
          </button>
        </div>
      </div>

      {/* tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t, i) => (
            <span key={`${t}-${i}`} className="rounded-full bg-primary/10 px-3 py-1.5 text-[12px] font-semibold text-primary sm:text-[13px]">
              {t}
            </span>
          ))}
        </div>
      )}

      {atual.texto_associado && (
        <div className="max-h-60 overflow-y-auto rounded-xl bg-muted/50 p-4 text-[15px] leading-[1.7] text-muted-foreground sm:text-[16px]">
          {atual.texto_associado}
        </div>
      )}

      {atual.imagem_url && (
        <img src={atual.imagem_url} alt="Imagem da questão" loading="lazy" className="w-full rounded-xl border border-border" />
      )}

      <p className="text-[16px] font-normal leading-[1.65] text-foreground sm:text-[17px]">{atual.enunciado}</p>

      <div className="space-y-2.5">
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
                'flex min-h-[56px] w-full items-start gap-3 rounded-xl border p-4 text-left text-[16px] leading-[1.65] transition-colors sm:text-[17px]',
                revela ? 'border-green-500/60 bg-green-500/10'
                  : errou ? 'border-red-500/60 bg-red-500/10'
                  : escolhida ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50 hover:bg-accent',
              )}
            >
              <span className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[15px] font-bold',
                escolhida && !resp ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
              )}>
                {op.letra}
              </span>
              <span className="flex-1">{op.texto}</span>
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

      {/* botão flutuante Responder */}
      <AnimatePresence>
        {!resp && selecao && (
          <motion.div
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3 backdrop-blur"
          >
            <div className="mx-auto w-full max-w-3xl">
              <button
                onClick={responder}
                className="h-14 w-full rounded-2xl bg-primary text-[16px] font-bold text-primary-foreground shadow-lg"
              >
                Responder
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* barra fixa: navegação + trilho de recursos — só depois de responder */}
      <AnimatePresence>
        {resp && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-2 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 backdrop-blur"
          >
            <div className="mx-auto w-full max-w-3xl space-y-2">
              <div className="flex items-center gap-2 px-1">
                <button
                  onClick={() => setIdx((i) => i - 1)}
                  disabled={idx === 0}
                  className="inline-flex h-12 flex-1 items-center justify-center gap-1 rounded-xl border border-border bg-card text-[15px] font-semibold text-foreground disabled:opacity-40"
                >
                  <ChevronLeft className="h-5 w-5" /> Anterior
                </button>
                <button
                  onClick={() => { if (gateFuncoes.blocked) { gateFuncoes.openGate(); return; } setComentarioAberto(true); }}
                  className="inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card text-[15px] font-semibold text-foreground"
                >
                  <MessageSquare className="h-5 w-5" /> Comentário
                </button>
                {idx < questoes.length - 1 ? (
                  <button
                    onClick={() => setIdx((i) => i + 1)}
                    className="inline-flex h-12 flex-1 items-center justify-center gap-1 rounded-xl bg-primary text-[15px] font-bold text-primary-foreground"
                  >
                    Próxima <ChevronRight className="h-5 w-5" />
                  </button>
                ) : (
                  <button
                    onClick={onNovoBloco}
                    className="inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary text-[15px] font-bold text-primary-foreground"
                  >
                    <RotateCw className="h-5 w-5" /> Novo bloco
                  </button>
                )}
              </div>
              <QuestaoAcoesBar source={atual.id} chaveRevisao={atual.id} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      <ComentarioSheet
        aberto={comentarioAberto && !!resp}
        source={atual.id}
        onClose={() => setComentarioAberto(false)}
      />
    </div>
  );
};

export default ResolverPadrao;
