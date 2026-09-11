import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  List,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '@/hooks/useAuth';
import { useTrackArea } from "@/hooks/useTrackArea";

import { iconePorTipo, rotuloPorTipo, isBlocoTexto, isPerguntaBloco } from '@/lib/aprenderUtils';
import { useAprenderAula } from '@/hooks/domain/useAprenderAula';
import { BlocoView } from '@/components/aprender/BlocoView';
import { AulaConcluidaScreen } from '@/components/aprender/AulaConcluidaScreen';
import { RetomarAulaModal } from '@/components/aprender/RetomarAulaModal';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AulaPreviaScreen, type PreviaAula } from '@/components/aprender/AulaPreviaScreen';
import { haptic } from '@/lib/nativeHaptics';
import ShapeGrid from '@/components/ui/ShapeGrid';
import pageTurnSound from '@/assets/page-turn.mp3';

export const getAtoInfo = (idx: number, totalSlides: number) => {
  const lim1 = Math.max(1, Math.round(totalSlides * 0.33));
  const lim2 = Math.max(lim1 + 1, Math.round(totalSlides * 0.68));
  if (idx < lim1) {
    return { numero: 1, nome: 'Ato I · Fundamentos', cor: 'text-sky-400', badgeBg: 'bg-sky-500/10 border-sky-500/20' };
  }
  if (idx < lim2) {
    return { numero: 2, nome: 'Ato II · Aprofundamento', cor: 'text-amber-400', badgeBg: 'bg-amber-500/10 border-amber-500/20' };
  }
  return { numero: 3, nome: 'Ato III · Fixação Ativa', cor: 'text-emerald-400', badgeBg: 'bg-emerald-500/10 border-emerald-500/20' };
};

const AprenderAula = () => {
  useTrackArea("aprender_aula_iniciada");
  const navigate = useNavigate();
  const location = useLocation();
  const { aulaId } = useParams<{ aulaId: string }>();
  const { user } = useAuth();

  const {
    aula, blocos, loading, proximaAula, total,
    currentIdx, setCurrentIdx, respostas, flipped, setFlipped, conexoes, setConexoes,
    finalizada, mostrarPrevia, progressoSalvo,
    feedbackPergunta, setFeedbackPergunta,
    maxRevealedIdx, acertos, perguntas,
    playFlipSound,
    avaliarFlashcard, responderPergunta, concluirAula, salvarBloco,
    refazerAula, comecarAula, continuarAula,
    modalRetomarOpen, savedPosition, confirmarRetomada, recomecarDoZero, salvarProgresso,
  } = useAprenderAula(aulaId, user);

  // Voltar inteligente com resolução contextual de módulo, trilha e histórico
  const handleVoltar = useCallback(() => {
    haptic.impact('light');

    // 1. Rota de origem informada explicitamente no state
    const state = location.state as { from?: string; moduloId?: string; areaSlug?: string } | null;
    if (state?.from && typeof state.from === 'string') {
      navigate(state.from);
      return;
    }

    // 2. Módulo pai da aula (prioridade de hierarquia pedagógica)
    if (aula?.modulo_id) {
      navigate(`/aprender/modulo/${aula.modulo_id}`);
      return;
    }
    if (state?.moduloId) {
      navigate(`/aprender/modulo/${state.moduloId}`);
      return;
    }

    // 3. Área temática
    if (state?.areaSlug) {
      navigate(`/aprender/area/${state.areaSlug}`);
      return;
    }

    // 4. Histórico da sessão (apenas se houver navegação prévia no mesmo app)
    const idx = typeof window !== 'undefined' ? (window.history.state as { idx?: number } | null)?.idx : undefined;
    if (typeof idx === 'number' && idx > 0 && typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1);
      return;
    }

    // 5. Fallback padrão seguro para o Aprender (nunca ejetar para a raiz '/' e sem loop)
    navigate('/aprender', { replace: true });
  }, [navigate, location, aula]);

  const blocoAtual = (blocos && blocos[currentIdx]) ? blocos[currentIdx] : ((blocos && blocos[0]) ? blocos[0] : null);
  const isPergunta = isPerguntaBloco(blocoAtual);
  const isFlashcard = blocoAtual?.tipo === 'flashcard';
  const isGrafoDecisao =
    blocoAtual?.payload?.subtipo === 'grafo_decisao' ||
    (typeof blocoAtual?.payload?.titulo === 'string' && (
      blocoAtual.payload.titulo.toLowerCase().includes('grafo') ||
      blocoAtual.payload.titulo.toLowerCase().includes('árvore de decisão')
    )) ||
    (typeof blocoAtual?.payload?.conteudo === 'string' && (
      blocoAtual.payload.conteudo.includes('GRAFO DE DECISÃO') ||
      (blocoAtual.payload.conteudo.includes('┌') && blocoAtual.payload.conteudo.includes('▼'))
    )) ||
    (currentIdx === total - 1 && blocoAtual?.tipo === 'leitura');
  const isLacunas = isBlocoTexto(blocoAtual?.tipo) && /Opções do Menu Suspenso/i.test(String(blocoAtual?.payload?.conteudo ?? blocoAtual?.payload?.texto ?? '')) && /Gabarito Comentado/i.test(String(blocoAtual?.payload?.conteudo ?? blocoAtual?.payload?.texto ?? ''));
  const questaoRespondida = blocoAtual ? !!respostas[blocoAtual.id] : true;
  const flashcardVirado = blocoAtual ? !!flipped[blocoAtual.id] : true;
  const podeAvancar = (!isPergunta || questaoRespondida) && (!isFlashcard || flashcardVirado) && (!isLacunas || questaoRespondida);

  const [selectedOpcao, setSelectedOpcao] = useState<string | null>(null);

  // Limpa opção selecionada ao mudar de página
  useEffect(() => {
    setSelectedOpcao(null);
  }, [currentIdx]);

  const [sumarioOpen, setSumarioOpen] = useState(false);
  const [highestVisible, setHighestVisible] = useState(0);
  const [direction, setDirection] = useState(1);
  const cardScrollRef = useRef<HTMLDivElement>(null);
  const pageTurnAudioRef = useRef<HTMLAudioElement | null>(null);

  // Referências para detecção de gestos (Swipe Touch + Drag Mouse)
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const mouseStartX = useRef<number>(0);
  const mouseStartY = useRef<number>(0);
  const isMouseDown = useRef<boolean>(false);
  const hasMouseDragged = useRef<boolean>(false);

  const playPageTurnSound = useCallback(() => {
    try {
      if (!pageTurnAudioRef.current) {
        pageTurnAudioRef.current = new Audio(pageTurnSound);
        pageTurnAudioRef.current.volume = 0.35;
      }
      pageTurnAudioRef.current.currentTime = 0;
      pageTurnAudioRef.current.play().catch(() => {});
    } catch (e) {}
  }, []);

  const goToPage = useCallback((newIdx: number) => {
    if (newIdx > currentIdx && !podeAvancar) {
      haptic.notification('warning');
      return;
    }
    haptic.selection();
    playPageTurnSound();
    const clamped = Math.max(0, Math.min(total - 1, newIdx));
    setDirection(clamped >= currentIdx ? 1 : -1);
    setCurrentIdx(clamped);
    setHighestVisible((prev) => Math.max(prev, clamped));
    if (cardScrollRef.current) {
      cardScrollRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
    // Salva progresso imediatamente
    void salvarProgresso(clamped >= total - 1, clamped);
  }, [total, currentIdx, podeAvancar, setCurrentIdx, salvarProgresso, playPageTurnSound]);

  // Garante scroll no topo imediatamente a cada mudança de bloco (Item 17)
  useEffect(() => {
    if (cardScrollRef.current) {
      cardScrollRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [currentIdx]);

  // Gestos Touch (Mobile / Tablet)
  const handleTouchStart = (e: React.TouchEvent) => {
    // Deadzone de 36px na borda esquerda: protege o gesto nativo de voltar do iOS e Android (Item 20)
    if (e.touches[0].clientX < 36) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches.length === 0) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const dx = touchStartX.current - touchEndX;
    const dy = touchStartY.current - touchEndY;

    // Apenas dispara se o deslize horizontal for preponderante (evita conflito com scroll vertical)
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      if (dx > 0 && currentIdx < total - 1) {
        if (podeAvancar) goToPage(currentIdx + 1);
      } else if (dx < 0 && currentIdx > 0) {
        goToPage(currentIdx - 1);
      }
    }
  };

  // Gestos Mouse (Desktop / Laptop)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select')) {
      return;
    }
    isMouseDown.current = true;
    hasMouseDragged.current = false;
    mouseStartX.current = e.clientX;
    mouseStartY.current = e.clientY;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown.current) return;
    const dx = e.clientX - mouseStartX.current;
    if (Math.abs(dx) > 8) {
      hasMouseDragged.current = true;
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isMouseDown.current) return;
    isMouseDown.current = false;
    if (hasMouseDragged.current) {
      const dx = mouseStartX.current - e.clientX;
      const dy = mouseStartY.current - e.clientY;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && currentIdx < total - 1) {
          if (podeAvancar) goToPage(currentIdx + 1);
        } else if (dx < 0 && currentIdx > 0) {
          goToPage(currentIdx - 1);
        }
      }
    }
    hasMouseDragged.current = false;
  };

  const handleMouseLeave = () => {
    isMouseDown.current = false;
    hasMouseDragged.current = false;
  };

  // Navegação e atalhos por teclado no Desktop (Item 14)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (feedbackPergunta || sumarioOpen) return;
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        if (currentIdx < total - 1 && podeAvancar) goToPage(currentIdx + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        if (currentIdx > 0) goToPage(currentIdx - 1);
      } else if (e.code === 'Space') {
        const bloco = blocos[currentIdx];
        if (bloco && bloco.tipo === 'flashcard') {
          e.preventDefault();
          playFlipSound();
          setFlipped((f) => ({ ...f, [bloco.id]: !f[bloco.id] }));
        }
      } else if (e.key === '1' || e.key === '2' || e.key === '3') {
        const bloco = blocos[currentIdx];
        if (bloco && bloco.tipo === 'flashcard' && flipped[bloco.id]) {
          e.preventDefault();
          const nivel = e.key === '1' ? 'nao_sabia' : e.key === '2' ? 'duvida' : 'sabia';
          avaliarFlashcard(bloco, nivel);
          if (currentIdx < total - 1) goToPage(currentIdx + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIdx, total, podeAvancar, goToPage, feedbackPergunta, sumarioOpen, blocos, flipped, playFlipSound, setFlipped, avaliarFlashcard]);

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
        onVoltar={handleVoltar}
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

  const canFinish = currentIdx >= total - 1 || highestVisible >= total - 1;
  const atoInfo = getAtoInfo(currentIdx, total);

  return (
    <div className="flex min-h-dvh flex-col bg-[#0D0D0D] text-neutral-100 selection:bg-primary/30 relative overflow-x-hidden">
      {/* Background ShapeGrid oficial idêntico ao de Pílulas e restante do APP.PRIME (Item 3) */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <ShapeGrid
          speed={0.5}
          squareSize={40}
          direction="diagonal"
          borderColor="rgba(255, 255, 255, 0.04)"
          hoverFillColor="rgba(255, 255, 255, 0.08)"
          shape="square"
          hoverTrailAmount={5}
        />
      </div>

      <div className="relative z-10 flex min-h-dvh flex-col">
        {/* ── Header editorial com Linha do Tempo no topo ── */}
        <header
          className={`${(isFlashcard || isLacunas) ? 'hidden' : 'sticky top-0 z-30 bg-[#121214]/95 backdrop-blur-xl border-b border-white/[0.08]'}`}
          style={{ paddingTop: 'calc(var(--sai-top) + 0.25rem)' }}
        >
          {/* ── Linha do Tempo na parte superior (Timeline de Páginas - Item 1) ── */}
          {/* Oculta no topo se a questão ainda não foi respondida ou o flashcard não foi virado */}
          {podeAvancar && (
            <div
              className="max-w-7xl mx-auto px-4 pt-2.5 pb-1 w-full"
              role="navigation"
              aria-label="Linha do tempo das páginas da aula"
            >
              {/* Mobile (<640px): Barra de progresso contínua e fluida (Item 1) */}
              <div className="flex sm:hidden items-center gap-2.5 w-full">
                <div className="relative flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary via-emerald-400 to-sky-400 shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
                    initial={false}
                    animate={{ width: `${Math.min(100, Math.max(4, ((currentIdx + 1) / total) * 100))}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-[11px] font-mono font-bold text-neutral-400 tabular-nums shrink-0">
                  {currentIdx + 1}/{total}
                </span>
              </div>

              {/* Desktop/Tablet (>=640px): Linha do tempo segmentada interativa */}
              <div className="hidden sm:flex items-center gap-1 sm:gap-1.5 w-full">
                {blocos.map((b, i) => {
                  const isPast = i < currentIdx;
                  const isCurrent = i === currentIdx;
                  const canJump = i <= currentIdx || podeAvancar;
                  return (
                    <button
                      key={b.id}
                      disabled={!canJump}
                      onClick={() => {
                        if (canJump) goToPage(i);
                      }}
                      className={`group relative flex-1 py-2 -my-2 focus:outline-none ${canJump ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}`}
                      aria-label={`Ir para página ${i + 1} de ${total}: ${rotuloPorTipo(b.tipo)}`}
                      title={`Página ${i + 1} de ${total} • ${rotuloPorTipo(b.tipo)}`}
                    >
                      <div
                        className={`h-[3.5px] sm:h-1 rounded-full transition-all duration-300 ${
                          isPast
                            ? 'bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.6)]'
                            : isCurrent
                            ? 'bg-primary shadow-[0_0_12px_hsl(var(--primary))] scale-y-125'
                            : 'bg-white/15 group-hover:bg-white/25'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Linha de navegação e título */}
          <div
            className="flex items-center justify-between py-2 max-w-7xl mx-auto"
            style={{
              paddingLeft: 'calc(1rem + var(--sai-left))',
              paddingRight: 'calc(1rem + var(--sai-right))',
            }}
          >
            <button
              type="button"
              onClick={handleVoltar}
              aria-label="Voltar para o módulo de aulas"
              className="flex w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 items-center justify-center rounded-2xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1] active:scale-95 transition-all text-white/80 hover:text-white cursor-pointer z-30"
            >
              <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
            </button>

            <div className="flex flex-col items-center text-center flex-1 min-w-0 px-2 sm:px-4">
              <span className={`inline-flex items-center text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border mb-1 ${atoInfo.badgeBg} ${atoInfo.cor}`}>
                {atoInfo.nome}
              </span>
              <p className="text-[13px] sm:text-[14px] md:text-[15px] font-bold text-white truncate max-w-[280px] sm:max-w-none leading-tight font-sans tracking-tight">
                {aula.titulo}
              </p>
              {!podeAvancar ? (
                <p className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mt-0.5 animate-pulse ${isPergunta ? 'text-amber-400' : 'text-sky-400'}`}>
                  {isPergunta ? 'Responda à questão para avançar' : 'Toque no cartão para virar e avançar'}
                </p>
              ) : (
                <p className="text-[10px] sm:text-[11px] font-semibold text-primary uppercase tracking-wider mt-0.5">
                  Página {currentIdx + 1} de {total} • {blocoAtual ? rotuloPorTipo(blocoAtual.tipo, blocoAtual.payload?.subtipo) : ''}
                </p>
              )}
            </div>

            {/* Espaçador para balanceamento visual e centralização perfeita do título */}
            <div className="w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0" />
          </div>
        </header>

        {/* ── Corpo da aula adaptativo: 2 Painéis no Desktop/Tablet Landscape (Item 18) ── */}
        <main className="flex-1 flex flex-col justify-center px-0 sm:px-6 md:px-8 py-0 sm:py-6 max-w-7xl w-full mx-auto pb-24 relative">
          <div className="flex-1 flex gap-6 items-stretch w-full">
            {/* Painel Lateral Esquerdo (Two-Pane Master Detail) para telas grandes (lg: / xl: - Item 18) */}
            <aside className="hidden lg:flex flex-col w-72 shrink-0 bg-[#141416]/90 backdrop-blur-md border border-white/[0.08] rounded-3xl p-4 shadow-xl select-none max-h-[calc(100vh-160px)] overflow-hidden">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/[0.06]">
                <span className="text-xs font-bold text-white/90 flex items-center gap-2">
                  <List className="w-4 h-4 text-primary" />
                  Roteiro da Aula
                </span>
                <span className="text-[10px] font-mono font-semibold text-neutral-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                  {total} págs
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1.5 no-scrollbar">
                {[
                  {
                    ato: 1,
                    titulo: 'Ato I · Fundamentos',
                    cor: 'text-sky-400',
                    badgeBg: 'bg-sky-500/10 border-sky-500/20',
                    items: blocos.slice(0, Math.max(1, Math.round(total * 0.33))),
                    offset: 0,
                  },
                  {
                    ato: 2,
                    titulo: 'Ato II · Doutrina & Casos',
                    cor: 'text-amber-400',
                    badgeBg: 'bg-amber-500/10 border-amber-500/20',
                    items: blocos.slice(Math.max(1, Math.round(total * 0.33)), Math.max(2, Math.round(total * 0.68))),
                    offset: Math.max(1, Math.round(total * 0.33)),
                  },
                  {
                    ato: 3,
                    titulo: 'Ato III · Fixação Ativa',
                    cor: 'text-emerald-400',
                    badgeBg: 'bg-emerald-500/10 border-emerald-500/20',
                    items: blocos.slice(Math.max(2, Math.round(total * 0.68))),
                    offset: Math.max(2, Math.round(total * 0.68)),
                  },
                ].map((secao) => (
                  <div key={secao.ato} className="space-y-1">
                    <div className="flex items-center gap-1.5 px-1 py-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${secao.badgeBg} ${secao.cor}`}>
                        {secao.titulo}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {secao.items.map((b, localIdx) => {
                        const i = secao.offset + localIdx;
                        const Icon = iconePorTipo(b.tipo);
                        const isCurrent = i === currentIdx;
                        const isPassed = i <= highestVisible;
                        const canClick = i <= currentIdx || podeAvancar;
                        const titulo = b.payload?.titulo || b.payload?.enunciado || b.payload?.frente || rotuloPorTipo(b.tipo, b.payload?.subtipo);

                        return (
                          <button
                            key={b.id}
                            disabled={!canClick}
                            onClick={() => {
                              if (canClick) goToPage(i);
                            }}
                            className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-all ${
                              !canClick ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                            } ${
                              isCurrent
                                ? 'bg-primary/15 border border-primary/40 text-white shadow-sm'
                                : isPassed
                                ? 'hover:bg-white/[0.06] text-neutral-300'
                                : 'text-neutral-500 hover:bg-white/[0.03]'
                            }`}
                          >
                            <span
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs ${
                                isCurrent
                                  ? 'bg-primary text-primary-foreground font-bold'
                                  : isPassed
                                  ? 'bg-white/10 text-primary'
                                  : 'bg-white/5 text-neutral-500'
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium leading-tight">
                                {i + 1}. {titulo}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            {/* Painel Central / Direito: Cartão da Aula */}
            <div className="flex-1 flex flex-col min-w-0 relative">
              {/* Setas Flutuantes Laterais para Navegação Rápida em Telas Maiores */}
              {currentIdx > 0 && (
                <button
                  onClick={() => goToPage(currentIdx - 1)}
                  aria-label="Página anterior"
                  className="hidden lg:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-[#18181b]/90 border border-white/10 text-white/70 hover:text-white hover:bg-[#27272a] hover:scale-110 shadow-xl transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {currentIdx < total - 1 && podeAvancar && (
                <button
                  onClick={() => goToPage(currentIdx + 1)}
                  aria-label="Próxima página"
                  className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-[#18181b]/90 border border-white/10 text-white/70 hover:text-white hover:bg-[#27272a] hover:scale-110 shadow-xl transition-all cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              <div
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                className={`w-full flex-1 flex flex-col ${
                  isFlashcard
                    ? 'bg-transparent border-transparent'
                    : (isPergunta || isGrafoDecisao)
                      ? 'bg-[#0f0f13]/85 backdrop-blur-xl border border-primary/25 shadow-primary/10'
                      : 'bg-[#131316]/95 backdrop-blur-md border border-white/[0.08]'
                } border-y sm:border rounded-none sm:rounded-3xl px-4 py-5 sm:p-8 md:p-10 ${isFlashcard ? 'shadow-none' : 'shadow-2xl shadow-black/40'} overflow-hidden relative select-none md:cursor-grab md:active:cursor-grabbing min-h-[500px]`}
              >
                {/* ── Fundo animado de quadrados ShapeGrid (Questões e Grafo Decisório) ── */}
                {(isPergunta || isGrafoDecisao || isLacunas) && (
                  <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-none sm:rounded-3xl opacity-55">
                    <ShapeGrid
                      speed={0.6}
                      squareSize={38}
                      direction="diagonal"
                      borderColor="rgba(255, 255, 255, 0.08)"
                      hoverFillColor="rgba(255, 255, 255, 0.16)"
                      shape="square"
                      hoverTrailAmount={6}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#131316]/40 via-transparent to-[#131316]/80" />
                  </div>
                )}

                {/* ── Marca d'água ilustrada vazada no fundo do card (Direito Penal) ── */}
                {!isFlashcard && !isPergunta && !isGrafoDecisao && !isLacunas && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-10 -right-10 sm:-bottom-14 sm:-right-14 select-none z-0 overflow-hidden opacity-[0.07] sm:opacity-[0.09] transition-opacity duration-500"
                  >
                    <img
                      src="/images/gamificacao/direito_penal_prisao_vazado.webp"
                      alt=""
                      loading="eager"
                      decoding="async"
                      className="w-72 h-72 sm:w-96 sm:h-96 md:w-[440px] md:h-[440px] object-contain"
                    />
                  </div>
                )}

                <AnimatePresence mode="popLayout" custom={direction}>
                  <motion.div
                    key={blocoAtual?.id || currentIdx}
                    custom={direction}
                    initial={{ opacity: 0, x: direction * 35 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -direction * 35 }}
                    transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
                    className="flex-1 flex flex-col overflow-hidden select-text relative z-10"
                  >
                    {/* Conteúdo com scroll interno delimitado à página atual */}
                    <div
                      ref={cardScrollRef}
                      className="flex-1 overflow-y-auto pr-1 sm:pr-2 pb-8 space-y-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                      {blocoAtual && (
                        <BlocoView
                          bloco={blocoAtual}
                          resposta={respostas[blocoAtual.id]}
                          selectedOpcao={selectedOpcao}
                          onSelectOpcao={(opcao) => {
                            haptic.selection();
                            setSelectedOpcao(opcao);
                          }}
                          onResponder={(escolha) => {
                            responderPergunta(blocoAtual, escolha);
                            setSelectedOpcao(null);
                          }}
                          flipped={!!flipped[blocoAtual.id]}
                          onFlip={() => {
                            playFlipSound();
                            setFlipped((f) => ({ ...f, [blocoAtual.id]: !f[blocoAtual.id] }));
                          }}
                          onAvaliarFlash={(nivel) => avaliarFlashcard(blocoAtual, nivel)}
                          conexao={conexoes[blocoAtual.id]}
                          onConexao={async (map, done) => {
                            setConexoes((c) => ({ ...c, [blocoAtual.id]: map }));
                            if (done) {
                              const pares = blocoAtual.payload?.pares || [];
                              const acertou = pares.every((_: any, i: number) => map[i] === i);
                              await salvarBloco(blocoAtual, { map }, acertou);
                            }
                          }}
                        />
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Dica sutil de navegação por gesto */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400 select-none pt-2">
                <span>Deslize</span>
                <span className="inline-flex items-center text-primary font-bold">← →</span>
                <span>para navegar</span>
              </div>
            </div>
          </div>
        </main>

        {/* ── Barra de Confirmação de Resposta — Ocupa o rodapé quando uma opção é selecionada ── */}
        <AnimatePresence>
          {isPergunta && !respostas[blocoAtual?.id || ''] && selectedOpcao && (
            <motion.aside
              aria-label="Confirmar resposta selecionada"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-50 border-t border-primary/30 bg-[#141417]/98 backdrop-blur-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.85)] pointer-events-auto"
              style={{
                paddingBottom: 'calc(0.75rem + var(--sai-bottom, env(safe-area-inset-bottom, 0px)))',
                paddingLeft: 'calc(1.25rem + var(--sai-left, env(safe-area-inset-left, 0px)))',
                paddingRight: 'calc(1.25rem + var(--sai-right, env(safe-area-inset-right, 0px)))',
                paddingTop: '0.75rem',
              }}
            >
              <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-2.5 w-2.5 relative shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                    {['certo', 'errado', 'verdadeiro', 'falso'].includes(selectedOpcao.toLowerCase())
                      ? `Opção ${selectedOpcao.toUpperCase()} selecionada`
                      : `Alternativa ${selectedOpcao.toUpperCase()} selecionada`}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      setSelectedOpcao(null);
                    }}
                    className="h-11 px-3 sm:px-4 rounded-xl bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 active:scale-95 text-xs sm:text-sm font-semibold transition-all min-h-[44px]"
                  >
                    Trocar
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      haptic.impact('medium');
                      if (blocoAtual) {
                        responderPergunta(blocoAtual, selectedOpcao);
                      }
                      setSelectedOpcao(null);
                    }}
                    className="flex items-center justify-center gap-2 h-11 rounded-xl bg-gradient-to-r from-primary to-rose-600 px-4 sm:px-6 text-xs sm:text-sm font-black text-white shadow-md shadow-primary/30 hover:brightness-110 active:scale-[0.97] transition-all cursor-pointer min-h-[44px]"
                  >
                    <span>Confirmar Resposta</span>
                    <ArrowRight className="h-4 w-4 text-white" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── Barra inferior: APENAS sumário + quantas páginas tem + navegação (desce quando confirmar está visível) ── */}
        <motion.nav
          aria-label="Navegação da aula"
          initial={false}
          animate={{
            y: ((isPergunta && !respostas[blocoAtual?.id || ''] && selectedOpcao) || (isFlashcard && !flashcardVirado) || (isLacunas && !questaoRespondida)) ? '110%' : 0,
            opacity: ((isPergunta && !respostas[blocoAtual?.id || ''] && selectedOpcao) || (isFlashcard && !flashcardVirado) || (isLacunas && !questaoRespondida)) ? 0 : 1,
          }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.08] bg-[#141417]/95 backdrop-blur-xl flex items-center justify-between"
          style={{
            paddingBottom: 'calc(0.75rem + var(--sai-bottom, env(safe-area-inset-bottom, 0px)))',
            paddingLeft: 'calc(1.25rem + var(--sai-left, env(safe-area-inset-left, 0px)))',
            paddingRight: 'calc(1.25rem + var(--sai-right, env(safe-area-inset-right, 0px)))',
            paddingTop: '0.75rem',
            pointerEvents: ((isPergunta && !respostas[blocoAtual?.id || ''] && selectedOpcao) || (isFlashcard && !flashcardVirado) || (isLacunas && !questaoRespondida)) ? 'none' : 'auto',
          }}
        >
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <button
              onClick={() => {
                haptic.selection();
                setSumarioOpen(true);
              }}
              className="flex items-center gap-2.5 h-11 px-4 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/90 hover:text-white hover:bg-white/10 active:scale-95 transition-all shadow-xl shadow-black/40 min-h-[44px]"
              aria-label="Abrir sumário da aula"
            >
              <List className="h-5 w-5 text-primary" />
              <span className="text-[14px] font-semibold tracking-wide">Sumário</span>
            </button>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center rounded-2xl bg-white/[0.03] border border-white/[0.08] p-1 backdrop-blur-md shadow-xl shadow-black/40">
                <button
                  onClick={() => goToPage(currentIdx - 1)}
                  disabled={currentIdx <= 0}
                  aria-label="Página anterior"
                  className="flex h-11 w-14 sm:w-16 items-center justify-center rounded-xl bg-white/5 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:pointer-events-none active:scale-95 transition-all shadow-sm cursor-pointer"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>

                <div className="flex flex-col items-center justify-center px-4 sm:px-6 min-w-[90px] sm:min-w-[100px] select-none">
                  <span className="text-[14px] font-black tabular-nums text-white leading-none">
                    {currentIdx + 1} de {total}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mt-1 leading-none">
                    Páginas
                  </span>
                </div>

                <button
                  onClick={() => goToPage(currentIdx + 1)}
                  disabled={currentIdx >= total - 1 || !podeAvancar}
                  aria-label="Próxima página"
                  className={`flex h-11 w-14 sm:w-16 items-center justify-center rounded-xl transition-all shadow-lg cursor-pointer ${
                    !podeAvancar || currentIdx >= total - 1
                      ? 'opacity-25 pointer-events-none bg-white/5 text-white/30 shadow-none cursor-not-allowed'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 shadow-primary/25'
                  }`}
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>

              {canFinish && (
                <button
                  onClick={() => {
                    haptic.impact('medium');
                    concluirAula();
                  }}
                  className="flex h-10 items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-4 text-[13px] font-bold hover:bg-primary/90 active:scale-95 transition-all shadow-md shadow-primary/25 min-h-[44px]"
                >
                  Concluir <CheckCircle2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </motion.nav>

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
              className="relative z-10 w-full max-h-[85vh] rounded-t-[2.5rem] border-t border-white/10 bg-[#18181b] p-6 sm:p-8 pb-[calc(2rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] shadow-2xl flex flex-col text-neutral-100"
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
                      {feedbackPergunta.correta ? 'Excelente raciocínio!' : 'Revise o comentário do professor e continue.'}
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
                <div className="rounded-2xl border border-white/10 bg-[#121214] p-5 text-[15px] leading-relaxed text-neutral-100 whitespace-pre-wrap shadow-inner">
                  {feedbackPergunta.explicacao || 'Nenhum comentário disponível para esta questão.'}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setFeedbackPergunta(null);
                    if (currentIdx < total - 1) {
                      goToPage(currentIdx + 1);
                    }
                  }}
                  className={`w-full rounded-2xl px-6 py-4 text-[16px] font-extrabold text-white shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                    feedbackPergunta.correta ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/30' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                  }`}
                >
                  {currentIdx < total - 1 ? 'Próxima Página' : 'Concluir'} <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Sheet do Sumário da aula organizado por Atos Pedagógicos (Item 12) ── */}
      <Sheet open={sumarioOpen} onOpenChange={setSumarioOpen}>
        <SheetContent side="bottom" className="h-[78vh] rounded-t-[2rem] p-0 bg-[#18181b] border-t border-white/10 text-white">
          <SheetHeader className="border-b border-white/5 p-5 pr-14">
            <SheetTitle className="text-left text-lg font-black font-display uppercase tracking-widest text-white flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-2.5">
                <List className="w-5 h-5 text-primary" />
                Sumário da Aula
              </span>
              <span className="text-[10px] font-bold font-sans normal-case tracking-normal text-neutral-400 bg-white/5 px-2.5 py-0.5 rounded-lg border border-white/10">
                {total} páginas
              </span>
            </SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto p-4 space-y-4 max-h-[calc(78vh-80px)]">
            {[
              {
                ato: 1,
                titulo: 'Ato I · Fundamentos & Letra da Lei',
                cor: 'text-sky-400',
                badgeBg: 'bg-sky-500/10 border-sky-500/20',
                items: blocos.slice(0, Math.max(1, Math.round(total * 0.33))),
                offset: 0,
              },
              {
                ato: 2,
                titulo: 'Ato II · Aprofundamento & Casos Práticos',
                cor: 'text-amber-400',
                badgeBg: 'bg-amber-500/10 border-amber-500/20',
                items: blocos.slice(Math.max(1, Math.round(total * 0.33)), Math.max(2, Math.round(total * 0.68))),
                offset: Math.max(1, Math.round(total * 0.33)),
              },
              {
                ato: 3,
                titulo: 'Ato III · Fixação Ativa & Síntese',
                cor: 'text-emerald-400',
                badgeBg: 'bg-emerald-500/10 border-emerald-500/20',
                items: blocos.slice(Math.max(2, Math.round(total * 0.68))),
                offset: Math.max(2, Math.round(total * 0.68)),
              },
            ].map((secao) => (
              <div key={secao.ato} className="space-y-1.5">
                <div className="flex items-center gap-2 px-2 pt-2 pb-1">
                  <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded border ${secao.badgeBg} ${secao.cor}`}>
                    {secao.titulo}
                  </span>
                </div>
                {secao.items.map((b, localIdx) => {
                  const i = secao.offset + localIdx;
                  const Icon = iconePorTipo(b.tipo);
                  const titulo = b.payload?.titulo || b.payload?.enunciado || b.payload?.frente || rotuloPorTipo(b.tipo);
                  const isCurrent = i === currentIdx;
                  const isPassed = i <= highestVisible;
                  const canClick = i <= currentIdx || podeAvancar;
                  return (
                    <button
                      key={b.id}
                      disabled={!canClick}
                      onClick={() => {
                        if (canClick) {
                          setSumarioOpen(false);
                          goToPage(i);
                        }
                      }}
                      className={`flex w-full items-center gap-3.5 rounded-xl p-3 text-left transition-all ${
                        !canClick ? 'opacity-30 cursor-not-allowed' : 'active:scale-[0.99] cursor-pointer'
                      } ${
                        isCurrent ? 'bg-white/10 border border-primary/40' : 'hover:bg-white/[0.05]'
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                          isCurrent
                            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                            : isPassed
                            ? 'bg-primary/30 text-primary-foreground'
                            : 'bg-white/5 text-neutral-400 border border-white/5'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
                          Página {i + 1} de {total} • {rotuloPorTipo(b.tipo)}
                        </p>
                        <p className="font-semibold text-white/95 text-[14px] leading-snug">{titulo}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Card Flutuante Responsivo de Retomada de Aula */}
      <RetomarAulaModal
        open={modalRetomarOpen}
        aulaTitulo={aula?.titulo || ''}
        paginaSalva={savedPosition?.page || 1}
        totalPaginas={total || 10}
        pctConcluido={savedPosition?.pct || 0}
        onContinuar={confirmarRetomada}
        onRecomecar={recomecarDoZero}
      />
    </div>
  );
};

export default AprenderAula;
