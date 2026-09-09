import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  List,
  MessageCircle,
  Settings2,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { motion, AnimatePresence, useInView } from 'framer-motion';

import { useAuth } from '@/hooks/useAuth';
import { useTrackArea } from "@/hooks/useTrackArea";
import { useGoBack } from '@/hooks/useGoBack';

import { iconePorTipo, isBlocoTexto, rotuloPorTipo, type Bloco } from '@/lib/aprenderUtils';
import { useAprenderAula } from '@/hooks/domain/useAprenderAula';
import { BlocoView } from '@/components/aprender/BlocoView';
import { AulaConcluidaScreen } from '@/components/aprender/AulaConcluidaScreen';
import { HorusContextualSheet } from '@/components/aprender/HorusContextualSheet';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AulaSettingsSheet } from '@/components/aprender/AulaSettingsSheet';
import { AulaPreviaScreen, type PreviaAula } from '@/components/aprender/AulaPreviaScreen';
import { haptic } from '@/lib/nativeHaptics';

/* ── Bloco com reveal no scroll ── */
function ScrollRevealBloco({
  bloco,
  index,
  total,
  respostas,
  flipped,
  conexoes,
  onResponder,
  onFlip,
  onAvaliarFlash,
  onConexao,
  onBlocoVisible,
}: {
  bloco: Bloco;
  index: number;
  total: number;
  respostas: Record<string, { correta: boolean; escolha?: string }>;
  flipped: Record<string, boolean>;
  conexoes: Record<string, Record<number, number | null>>;
  onResponder: (escolha: string) => void;
  onFlip: () => void;
  onAvaliarFlash: (nivel: any) => void;
  onConexao: (map: Record<number, number | null>, done: boolean) => void;
  onBlocoVisible: (idx: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px 0px' });
  const isExercicio = ['pergunta', 'flashcard', 'conexao'].includes(bloco.tipo);

  useEffect(() => {
    if (isInView) onBlocoVisible(index);
  }, [isInView, index, onBlocoVisible]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
      className="w-full"
    >
      {/* Separador visual entre blocos de exercício */}
      {isExercicio && (
        <div className="flex items-center gap-4 my-10">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary/60">
            Pratique agora
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        </div>
      )}

      <BlocoView
        bloco={bloco}
        resposta={respostas[bloco.id]}
        onResponder={onResponder}
        flipped={!!flipped[bloco.id]}
        onFlip={onFlip}
        onAvaliarFlash={onAvaliarFlash}
        conexao={conexoes[bloco.id]}
        onConexao={onConexao}
      />

      {/* Separador sutil entre blocos de leitura */}
      {!isExercicio && index < total - 1 && (
        <div className="my-6 flex justify-center">
          <div className="w-8 h-[2px] rounded-full bg-white/[0.06]" />
        </div>
      )}
    </motion.div>
  );
}

/* ────────────────────────────────────────── */

const AprenderAula = () => {
  useTrackArea("aprender_aula_iniciada");
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { aulaId } = useParams<{ aulaId: string }>();
  const { user } = useAuth();
  
  const {
    aula, blocos, loading, proximaAula, proximasAulas, total,
    currentIdx, setCurrentIdx, respostas, flipped, setFlipped, conexoes, setConexoes,
    finalizada, mostrarPrevia, progressoSalvo,
    feedbackPergunta, setFeedbackPergunta,
    maxRevealedIdx, acertos, perguntas,
    playFlipSound, playSwooshSound,
    avaliarFlashcard, responderPergunta, concluirAula, salvarBloco,
    refazerAula, comecarAula, continuarAula, avancarIdx, voltarIdx
  } = useAprenderAula(aulaId, user);

  const [sumarioOpen, setSumarioOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mentorOpen, setMentorOpen] = useState(false);
  const [highestVisible, setHighestVisible] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  const mainRef = useRef<HTMLDivElement>(null);

  // Barra de progresso por scroll
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const onScroll = () => {
      const scrollTop = el.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      if (scrollHeight > 0) setScrollProgress(Math.min(scrollTop / scrollHeight, 1));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [loading, mostrarPrevia, finalizada]);

  const handleBlocoVisible = useCallback((idx: number) => {
    setHighestVisible(prev => Math.max(prev, idx));
    setCurrentIdx(idx);
  }, [setCurrentIdx]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] p-6">
        <div className="mx-auto max-w-2xl space-y-6 pt-20">
          <div className="h-6 w-48 rounded bg-white/5 animate-pulse" />
          <div className="h-3 w-full rounded bg-white/5 animate-pulse" />
          <div className="h-3 w-3/4 rounded bg-white/5 animate-pulse" />
          <div className="h-3 w-5/6 rounded bg-white/5 animate-pulse" />
          <div className="h-40 rounded-2xl bg-white/5 animate-pulse mt-8" />
        </div>
      </div>
    );
  }

  if (!aula || total === 0) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] p-6 text-center flex items-center justify-center flex-col gap-4">
        <BookOpen className="w-12 h-12 text-white/20" />
        <p className="text-neutral-400 text-lg">Aula não encontrada ou sem conteúdo.</p>
        <button onClick={() => navigate('/aprender')} className="text-primary underline text-sm">
          Voltar
        </button>
      </div>
    );
  }

  if (mostrarPrevia && !finalizada) {
    const previaFallback: PreviaAula | null = aula.previa ?? (aula.objetivo ? { porque_importa: aula.objetivo } : null);
    const continuarDe = Math.min(Math.max(progressoSalvo, 0), total - 1);
    const pctProgresso = total > 0 ? Math.round((Math.min(progressoSalvo, total) / total) * 100) : 0;
    
    return (
      <AulaPreviaScreen
        titulo={aula.titulo}
        objetivo={aula.objetivo}
        duracaoMin={aula.duracao_est_min || 10}
        previa={previaFallback}
        progressoPct={pctProgresso}
        podeContinuar={continuarDe > 0 && pctProgresso < 100}
        onVoltar={() => goBack()}
        onComecar={comecarAula}
        onContinuar={() => continuarAula(continuarDe)}
      />
    );
  }

  if (finalizada) {
    return (
      <AulaConcluidaScreen
        aula={aula}
        total={total}
        perguntas={perguntas}
        acertos={acertos}
        proximaAula={proximaAula}
        onRefazer={refazerAula}
      />
    );
  }

  const atual = blocos[currentIdx] || blocos[0];
  const canFinish = highestVisible >= total - 1;

  return (
    <div className="flex min-h-dvh flex-col bg-[#0D0D0D]">
      {/* ── Header minimalista fixo ── */}
      <header
        className="sticky top-0 z-30 bg-[#0D0D0D]/95 backdrop-blur-xl border-b border-white/[0.04]"
        style={{ paddingTop: 'calc(var(--sai-top) + 0.25rem)' }}
      >
        <div
          className="flex items-center justify-between py-2.5 max-w-4xl mx-auto"
          style={{
            paddingLeft: 'calc(1rem + var(--sai-left))',
            paddingRight: 'calc(1rem + var(--sai-right))',
          }}
        >
          <button
            onClick={() => goBack()}
            aria-label="Voltar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] active:scale-95 transition-all text-white/70 hover:text-white"
          >
            <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>

          <div className="flex flex-col items-center text-center flex-1 min-w-0 px-4">
            <p className="text-[13px] font-semibold text-white/90 truncate max-w-[240px] sm:max-w-none leading-tight">
              {aula.titulo}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSumarioOpen(true)}
              aria-label="Sumário"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] active:scale-95 transition-all text-white/50 hover:text-white"
            >
              <List className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>

        {/* Barra de progresso suave por scroll */}
        <div className="h-[2px] w-full bg-white/[0.03]">
          <motion.div
            className="h-full bg-gradient-to-r from-primary/80 to-primary"
            animate={{ width: `${scrollProgress * 100}%` }}
            transition={{ duration: 0.15, ease: 'linear' }}
          />
        </div>
      </header>

      {/* ── Corpo da aula — scroll contínuo editorial ── */}
      <main
        ref={mainRef}
        className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth"
      >
        <div className="mx-auto w-full max-w-3xl px-5 md:px-8 lg:px-12 pt-8 md:pt-12 pb-40">
          {/* Cabeçalho editorial da aula */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12 md:mb-16"
          >
            <div className="flex items-center gap-2.5 mb-6">
              <span className="h-[3px] w-8 rounded-full bg-primary" />
              <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary">
                Aula
              </span>
            </div>
            <h1 className="font-sans text-[28px] sm:text-[34px] md:text-[40px] font-black tracking-tight text-white leading-[1.15]">
              {aula.titulo}
            </h1>
            {aula.objetivo && (
              <p className="mt-4 text-[16px] md:text-[18px] leading-relaxed text-neutral-400 max-w-[60ch]">
                {aula.objetivo}
              </p>
            )}
            <div className="mt-6 flex items-center gap-4 text-neutral-500 text-[13px]">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                {total} etapas
              </span>
              {aula.duracao_est_min && (
                <span>~{aula.duracao_est_min} min</span>
              )}
            </div>
          </motion.div>

          {/* Blocos da aula — scroll contínuo */}
          <div className="space-y-2">
            {blocos.map((bloco, idx) => (
              <ScrollRevealBloco
                key={bloco.id}
                bloco={bloco}
                index={idx}
                total={total}
                respostas={respostas}
                flipped={flipped}
                conexoes={conexoes}
                onResponder={(escolha) => responderPergunta(bloco, escolha)}
                onFlip={() => {
                  playFlipSound();
                  setFlipped((f) => ({ ...f, [bloco.id]: !f[bloco.id] }));
                }}
                onAvaliarFlash={(nivel) => avaliarFlashcard(bloco, nivel)}
                onConexao={async (map, done) => {
                  setConexoes((c) => ({ ...c, [bloco.id]: map }));
                  if (done) {
                    const pares = bloco.payload?.pares || [];
                    const acertou = pares.every((_: any, i: number) => map[i] === i);
                    await salvarBloco(bloco, { map }, acertou);
                  }
                }}
                onBlocoVisible={handleBlocoVisible}
              />
            ))}
          </div>

          {/* Botão de Concluir no final */}
          {canFinish && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-16 flex flex-col items-center gap-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/30" />
                <CheckCircle2 className="w-5 h-5 text-primary/60" />
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/30" />
              </div>
              <p className="text-neutral-400 text-sm">Você chegou ao final da aula</p>
              <button
                onClick={concluirAula}
                className="flex h-14 items-center justify-center gap-3 rounded-2xl bg-primary text-primary-foreground px-10 font-bold text-lg hover:bg-primary/90 active:scale-[0.97] transition-all shadow-lg shadow-primary/20"
              >
                <CheckCircle2 className="h-5 w-5" />
                Concluir Aula
              </button>
            </motion.div>
          )}
        </div>
      </main>

      {/* ── Barra inferior com ações ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.04] bg-[#0D0D0D]/95 backdrop-blur-xl flex items-center justify-between"
        style={{
          paddingBottom: 'calc(0.5rem + var(--sai-bottom))',
          paddingLeft: 'calc(1rem + var(--sai-left))',
          paddingRight: 'calc(1rem + var(--sai-right))',
          paddingTop: '0.5rem',
        }}
      >
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center justify-center h-10 w-10 rounded-full text-neutral-500 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Configurações"
          >
            <Settings2 className="h-[18px] w-[18px]" />
          </button>
          <button
            onClick={() => setMentorOpen(true)}
            className="flex items-center justify-center h-10 w-10 rounded-full text-neutral-500 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Mentor IA"
          >
            <MessageCircle className="h-[18px] w-[18px]" />
          </button>
        </div>

        <span className="text-[12px] font-medium tabular-nums text-neutral-500">
          {Math.round(scrollProgress * 100)}% lido
        </span>

        <div className="flex items-center gap-2">
          {canFinish && (
            <button
              onClick={concluirAula}
              className="flex h-9 items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 text-[13px] font-bold hover:bg-primary/90 active:scale-95 transition-all"
            >
              Concluir <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Modal de Feedback de Questão */}
      <AnimatePresence>
        {feedbackPergunta && (
          <div className="fixed inset-0 z-[100] flex flex-col justify-end pointer-events-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/85 backdrop-blur-sm"
              onClick={() => setFeedbackPergunta(null)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative z-10 w-full max-h-[85vh] rounded-t-[2.5rem] border-t border-white/10 bg-[#121418] p-6 sm:p-8 pb-[calc(2rem+var(--sai-bottom))] shadow-2xl flex flex-col"
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20" />
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3.5">
                  {feedbackPergunta.correta ? (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50">
                      <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/50">
                      <XCircle className="h-7 w-7 text-rose-400" />
                    </div>
                  )}
                  <div>
                    <h3 className={`font-display text-xl font-bold tracking-tight ${feedbackPergunta.correta ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {feedbackPergunta.correta ? 'Você acertou!' : 'Você errou'}
                    </h3>
                    <p className="text-sm text-neutral-300">
                      {feedbackPergunta.correta ? 'Excelente raciocínio!' : 'Revise o comentário e continue firme.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setFeedbackPergunta(null)}
                  aria-label="Fechar"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-y-auto pr-2 pb-6 flex-1">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-primary mb-2">Comentário do Professor</p>
                <div className="rounded-2xl border border-white/10 bg-[#1a1d24] p-5 text-[15px] leading-relaxed text-neutral-100 whitespace-pre-wrap shadow-inner">
                  {feedbackPergunta.explicacao || 'Nenhum comentário disponível para esta questão.'}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setFeedbackPergunta(null)}
                  className={`w-full rounded-2xl px-6 py-4 text-[16px] font-extrabold text-white shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                    feedbackPergunta.correta ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/30' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                  }`}
                >
                  Continuar <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Sheet open={sumarioOpen} onOpenChange={setSumarioOpen}>
        <SheetContent side="bottom" className="h-[75vh] rounded-t-2xl p-0">
          <SheetHeader className="border-b border-border p-4">
            <SheetTitle className="text-left">Sumário da aula</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto p-3">
            {blocos.map((b, i) => {
              const Icon = iconePorTipo(b.tipo);
              const titulo = b.payload?.titulo || b.payload?.enunciado || b.payload?.frente || rotuloPorTipo(b.tipo);
              return (
                <button
                  key={b.id}
                  onClick={() => {
                    setSumarioOpen(false);
                    const el = document.getElementById(`bloco-${i}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className="flex w-full items-center gap-3 rounded-lg p-3 text-left text-sm transition-colors hover:bg-accent/60"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ background: i <= highestVisible ? 'hsl(var(--primary))' : 'hsl(var(--muted))' }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {i + 1}. {rotuloPorTipo(b.tipo)}
                    </p>
                    <p className="truncate font-medium text-foreground">{titulo}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      <AulaSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        blocoKey={atual.id}
        onAbrirSumario={() => setSumarioOpen(true)}
        textoBlocoAtual={(() => {
          const p = atual.payload || {};
          const flip = !!flipped[atual.id];
          switch (atual.tipo) {
            case 'intro':
            case 'conceito':
            case 'exemplo':
            case 'conclusao':
            case 'leitura':
            case 'texto':
              return `${p.titulo ? p.titulo + '.\n\n' : ''}${p.conteudo || p.texto || ''}`;
            case 'citacao':
              return `Citação. ${p.texto || ''}${p.fonte ? `. Fonte: ${p.fonte}.` : ''}`;
            case 'artigo_lei':
              return `${p.lei || 'Artigo de lei'}${p.numero ? `, artigo ${p.numero}` : ''}.\n\n${p.texto || ''}`;
            case 'destaque':
              return `${p.titulo || 'Destaque'}. ${p.texto || ''}`;
            case 'pergunta': {
              const opcs = (p.opcoes || []).map((o: any) => `Alternativa ${String(o.id).toUpperCase()}: ${o.texto}.`).join(' ');
              return `Pergunta. ${p.enunciado || ''}\n\n${opcs}`;
            }
            case 'flashcard':
              return flip
                ? `Resposta. ${p.verso || ''}. ${p.explicacao || ''}. Exemplo prático: ${p.exemplo || ''}. Aplicando: ${p.aplicando || ''}.`
                : `Pergunta do flashcard. ${p.frente || ''}`;
            case 'conexao': {
              const pares = (p.pares || []).map((par: any) => `${par.termo}: ${par.definicao}.`).join('\n');
              return `Associe cada termo à sua definição.\n\n${pares}`;
            }
            case 'tabela':
              return `${p.titulo || 'Tabela'}. Colunas: ${(p.colunas || []).join(', ')}.`;
            case 'mapa_mental':
              return `Mapa mental. ${p.raiz || ''}. ${p.definicao_raiz || ''}. ${(p.ramos || [])
                .map((r: any) => `${r.titulo}: ${(r.itens || [])
                  .map((it: any) => typeof it === 'string' ? it : `${it.termo}, ${it.definicao}`)
                  .join(', ')}.`)
                .join(' ')}`;
            case 'fluxograma':
              return `Fluxograma. ${p.titulo || ''}. ${(p.etapas || []).map((et: any) => `Etapa ${et.n}: ${et.titulo}. ${et.descricao || ''}`).join(' ')}`;
            case 'mapa_conceitual':
              return `Mapa conceitual. ${(p.nos || []).map((n: any) => `${n.rotulo}${n.definicao ? ': ' + n.definicao : ''}`).join('. ')}. Relações: ${(p.arestas || []).map((a: any) => `${a.de} ${a.relacao} ${a.para}`).join('; ')}.`;
            case 'ordenacao':
              return `${p.titulo || 'Coloque em ordem'}. ${p.instrucao || ''}. Itens: ${(p.itens || []).map((it: any) => it.texto).join('; ')}.`;
            case 'cena_animada':
              return `${p.titulo || 'Cena animada'}. ${(p.cenas || []).map((c: any) => `Cena ${c.n}: ${c.titulo}. ${c.narracao}`).join(' ')}. ${p.moral ? 'Regra: ' + p.moral : ''}`;
            case 'linha_tempo':
              return `${p.titulo || 'Linha do tempo'}. ${(p.eventos || []).map((e: any) => `${e.marco}, ${e.titulo}. ${e.descricao || ''}`).join(' ')}`;
            case 'infografico':
              return `${p.titulo || 'Infográfico'}. ${(p.itens || []).map((it: any) => `${it.numero || ''} ${it.titulo}. ${it.descricao || ''}`).join(' ')}`;
            default:
              return p.titulo || p.texto || rotuloPorTipo(atual.tipo);
          }
        })()}
      />

      <HorusContextualSheet
        hideFab
        open={mentorOpen}
        onOpenChange={setMentorOpen}
        contexto={{
          aula_titulo: aula.titulo,
          bloco_tipo: atual.tipo,
          bloco_texto: (() => {
            const p = atual.payload || {};
            if (isBlocoTexto(atual.tipo)) return `${p.titulo || ''}\n\n${p.conteudo || ''}`;
            if (atual.tipo === 'pergunta') return `${p.enunciado || ''}\n\nOpções: ${JSON.stringify(p.opcoes || [])}`;
            if (atual.tipo === 'flashcard') return `${p.frente || ''} → ${p.verso || ''}`;
            if (atual.tipo === 'conexao') return `Pares: ${JSON.stringify(p.pares || [])}`;
            return JSON.stringify(p);
          })(),
          termos: atual.payload?.termos || [],
        }}
      />
    </div>
  );
};

export default AprenderAula;
