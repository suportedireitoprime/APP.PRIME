import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/vademecum/PageHeader';
import FlashcardsBottomNav from '@/components/flashcards/FlashcardsBottomNav';
import AreaTemasSheet from '@/components/flashcards/AreaTemasSheet';
import ContagemRegressiva from '@/components/questoes/ContagemRegressiva';
import {
  CheckCircle2, RotateCcw, SlidersHorizontal, BookOpen, Scale, Lightbulb, ChevronRight, Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { haptic } from '@/lib/nativeHaptics';
import { playFlipSound } from '@/lib/flipSound';
import { getAreaVisual } from '@/lib/flashcardsAreaVisual';
import { useFlashcardsSessao, useFlashcardsResumoAreas, FlashcardCard } from '@/lib/flashcardsQueries';
import { useGatedFeature } from '@/hooks/useGatedFeature';
import laurel from '@/assets/landing-tribunal/laurel-leaf.png';
import scales from '@/assets/landing-tribunal/scales.png';

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

type AreaResumo = {
  area: string;
  total_cards: number;
  compreendidos: number;
  a_revisar: number;
};

const MODOS = [
  { id: 'todos', label: 'Todos os cards' },
  { id: 'novos', label: 'Novos' },
  { id: 'revisar', label: 'Em revisão' },
  { id: 'compreendidos', label: 'Compreendidos' },
];

const FlashcardsEstudo = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  // SEO & Título dinâmico
  useEffect(() => {
    document.title = 'Sessão de Prática de Flashcards | Vade Mecum PRIME';
  }, []);

  const areaParam = params.get('area');
  const areasParam = params.get('areas');
  const temasParam = params.get('temas') || params.get('tema');
  const deckId = params.get('deck');
  const modo = params.get('modo') || 'todos';
  const editalId = params.get('editalId');

  // Sem nenhum filtro escolhido → tela de categorias.
  const escolhendo = !areaParam && !areasParam && !deckId && modo !== 'edital';

  const limitParam = parseInt(params.get('limite') || '30', 10);
  let listaAreas = areasParam ? areasParam.split('|').filter(Boolean) : areaParam ? [areaParam] : null;
  const temasList = temasParam ? temasParam.split('|').filter(Boolean) : null;
  const modoAtual = modo;

  const { data: cardsRaw, isLoading: loadingCards, refetch: refetchCards } = useFlashcardsSessao({
    areas: listaAreas,
    temas: temasList,
    modo: modoAtual,
    deckId: deckId,
    limit: limitParam
  }, !escolhendo);

  const { data: areasRaw } = useFlashcardsResumoAreas();
  const areas = areasRaw || [];

  const [cards, setCards] = useState<FlashcardCard[]>([]);
  const [idx, setIdx] = useState(0);
  const [virado, setVirado] = useState(false);
  const [contando, setContando] = useState(!escolhendo);
  const [temas, setTemas] = useState<{ tema: string; total: number }[]>([]);
  const [feitos, setFeitos] = useState(0);
  const [areaSheet, setAreaSheet] = useState<string | null>(null);
  const [exitDirection, setExitDirection] = useState<'left' | 'down'>('left');
  const salvando = useRef(false);
  const gateFlashcards = useGatedFeature('flashcards', 'flashcards');

  const loading = loadingCards && !escolhendo;

  useEffect(() => {
    if (cardsRaw) {
      setCards(cardsRaw);
      setIdx(0);
      setVirado(false);
    }
  }, [cardsRaw]);

  // Ponto de Retomada: Salvar e restaurar último cartão estudado
  const sessionKey = `flashcards_pos_${areaParam || areasParam || deckId || 'geral'}_${temasParam || 'todos'}`;

  useEffect(() => {
    if (cards.length > 0) {
      const savedIdx = localStorage.getItem(sessionKey);
      if (savedIdx) {
        const parsed = parseInt(savedIdx, 10);
        if (!isNaN(parsed) && parsed > 0 && parsed < cards.length) {
          setIdx(parsed);
        }
      }
    }
  }, [cards, sessionKey]);

  useEffect(() => {
    if (cards.length > 0 && idx >= 0) {
      localStorage.setItem(sessionKey, idx.toString());
    }
  }, [idx, cards.length, sessionKey]);

  useEffect(() => {
    if (!areaParam) { setTemas([]); return; }
    supabase.rpc('flashcards_temas', { _area: areaParam }).then(({ data }) => {
      if (data) setTemas((data as any[]).map((t) => ({ tema: t.tema, total: Number(t.total) })));
    });
  }, [areaParam]);

  const atual = cards[idx];
  const progresso = cards.length ? Math.round((feitos / cards.length) * 100) : 0;

  const virar = () => {
    haptic.selection();
    playFlipSound();
    setVirado((v) => !v);
  };

  const responder = async (status: 'compreendido' | 'revisar') => {
    if (!atual || salvando.current) return;
    if (gateFlashcards.blocked) { gateFlashcards.openGate(); return; }
    
    // Configura a direção da animação baseada na resposta
    setExitDirection(status === 'revisar' ? 'down' : 'left');
    
    salvando.current = true;
    haptic.light();
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) {
      const { error } = await supabase.from('flashcards_progresso').upsert(
        {
          user_id: auth.user.id,
          card_id: atual.id,
          area: atual.area,
          tema: atual.tema,
          status,
          ultima_resposta_em: new Date().toISOString(),
        },
        { onConflict: 'user_id,card_id' },
      );
      if (error) toast.error('Não foi possível salvar o progresso');
    }
    await gateFlashcards.run();
    setFeitos((f) => f + 1);
    setVirado(false);
    salvando.current = false;
    if (idx + 1 >= cards.length) {
      toast.success('Sessão concluída!');
      setIdx(cards.length);
    } else {
      setIdx((i) => i + 1);
    }
  };


  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    if (k === 'area') { next.delete('tema'); next.delete('temas'); }
    setParams(next, { replace: true });
  };

  const titulo = useMemo(() => {
    if (escolhendo) return 'Estudar';
    return temasParam?.split('|')[0] || areaParam || 'Estudar';
  }, [areaParam, temasParam, escolhendo]);

  return (
    <div className={`min-h-dvh bg-background ${escolhendo ? 'pb-32' : 'pb-10'}`}>
      {contando && !escolhendo && (
        <ContagemRegressiva
          solido
          subtitulo="Preparando seus flashcards…"
          onFim={() => setContando(false)}
        />
      )}
      {gateFlashcards.gateNode}
      <div className="mx-auto w-full max-w-3xl px-3.5 sm:px-6">
        <PageHeader
          title={escolhendo ? 'Categorias de Flashcards' : areaParam || 'Prática de Flashcards'}
          subtitle={temasParam ? `Filtro: ${temasParam}` : undefined}
          onBack={() => navigate('/flashcards')}
          rightAction={
            !escolhendo && (
              <Sheet>
                <SheetTrigger asChild>
                  <button className="flex h-10 w-10 items-center justify-center rounded-full bg-card border border-border/80 shadow-sm text-foreground hover:bg-muted">
                    <SlidersHorizontal className="h-4.5 w-4.5 text-foreground" />
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto rounded-t-3xl border-t border-border">
                  <SheetHeader><SheetTitle>Filtros</SheetTitle></SheetHeader>

                  <div className="mt-4 space-y-5 pb-8">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Modo</p>
                      <div className="flex flex-wrap gap-2">
                        {MODOS.map((m) => (
                          <Chip key={m.id} active={modo === m.id} onClick={() => setParam('modo', m.id)}>
                            {m.label}
                          </Chip>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Área</p>
                      <div className="flex flex-wrap gap-2">
                        <Chip active={!areaParam} onClick={() => setParam('area', null)}>Todas</Chip>
                        {areas.map((a) => (
                          <Chip key={a.area} active={areaParam === a.area} onClick={() => setParam('area', a.area)}>
                            {a.area}
                          </Chip>
                        ))}
                      </div>
                    </div>

                    {!!temas.length && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Matéria</p>
                        <div className="flex flex-wrap gap-2">
                          <Chip active={!temasParam} onClick={() => setParam('temas', null)}>Todas</Chip>
                          {temas.slice(0, 60).map((t) => (
                            <Chip
                              key={t.tema}
                              active={temasParam === t.tema}
                              onClick={() => setParam('temas', t.tema)}
                            >
                              {t.tema} · {t.total}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            )
          }
        />

        {/* Categorias — padrão Aprender */}
        {escolhendo ? (
          <div className="space-y-3 pt-4">
            <p className="mb-1 text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
              Categorias
            </p>
            <button
              onClick={() => { haptic.selection(); setParam('areas', areas.map((a) => a.area).join('|')); }}
              className="flex w-full items-center gap-3.5 rounded-2xl border border-border/80 bg-card p-4 text-left transition-all hover:border-emerald-500/50 hover:shadow-md active:scale-[0.99]"
            >
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10">
                <Layers className="h-8 w-8 text-emerald-500" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-extrabold text-foreground">Mistura geral de matérias</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Praticar com flashcards de todas as categorias ativas
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {areas.map((a) => {
                const p = a.total_cards ? Math.round((a.compreendidos / a.total_cards) * 100) : 0;
                const { icon: Icon, color } = getAreaVisual(a.area);
                return (
                  <button
                    key={a.area}
                    onClick={() => { haptic.selection(); setAreaSheet(a.area); }}
                    className="group flex w-full items-center gap-3.5 rounded-2xl border border-border/80 bg-card p-4 text-left transition-all hover:border-emerald-500/50 hover:shadow-md active:scale-[0.99]"
                  >
                    <div className="relative flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10">
                      <Icon className="h-7 w-7" strokeWidth={2} style={{ color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="min-w-0 flex-1 truncate text-base font-extrabold text-foreground group-hover:text-emerald-500 transition-colors">
                          {a.area}
                        </p>
                        <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-black text-emerald-500 tabular-nums">
                          {p}%
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {a.total_cards} cards · {a.a_revisar} a revisar
                      </p>
                    </div>
                    <ChevronRight className="h-4.5 w-4.5 shrink-0 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="pt-4 space-y-4">
            {/* Barra de progresso */}
            <div className="flex items-center gap-3">
              <Progress value={cards.length ? ((idx + 1) / cards.length) * 100 : 0} className="h-2 flex-1 [&>div]:bg-emerald-500" />
              <span className="text-xs font-black tabular-nums text-muted-foreground">
                {idx + 1}/{cards.length}
              </span>
            </div>

            {loading && (
              <div className="relative w-full min-h-[380px] sm:min-h-[440px] h-[54dvh] max-h-[540px] rounded-[32px] border border-border/80 bg-card p-6 md:p-8 flex items-center justify-center shadow-lg">
                <div className="flex flex-col items-center gap-4 text-emerald-500/60">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-current border-t-transparent" />
                  <p className="text-sm font-semibold uppercase tracking-wider animate-pulse">Preparando Sessão...</p>
                </div>
              </div>
            )}

            {!loading && cards.length === 0 && (
              <div className="rounded-3xl border border-border bg-card p-10 text-center">
                <p className="text-base font-extrabold text-foreground">Nenhum card encontrado neste filtro.</p>
                <Button className="mt-4 rounded-xl" onClick={() => navigate('/flashcards')}>Voltar para Flashcards</Button>
              </div>
            )}

            {!loading && cards.length > 0 && !atual && (
              <div className="rounded-3xl border border-border bg-card p-10 text-center">
                <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
                <h3 className="text-xl font-black text-foreground">Sessão Concluída!</h3>
                <p className="mt-1 text-sm text-muted-foreground">{feitos} flashcards estudados com sucesso.</p>
                <Button className="mt-5 rounded-2xl px-6 font-bold" onClick={() => { setFeitos(0); refetchCards(); }}>Nova sessão</Button>
              </div>
            )}

            {atual && (() => {
              const accent = "#10b981";
              const temaKey = atual.tema ?? atual.area ?? atual.pergunta.slice(0, 32);
              const h = hashString(temaKey);
              const angle = h % 360;
              const pattern = h % 4;

              return (
              <>
                {/* Contêiner com empilhamento 3D de cards vindo de trás */}
                <div className="relative w-full min-h-[380px] sm:min-h-[440px] h-[54dvh] max-h-[540px]">
                  {/* Card 3 (Mais ao fundo) */}
                  {cards[idx + 2] && (
                    <div 
                      className="absolute inset-0 rounded-[32px] border border-emerald-500/20 bg-card/60 backdrop-blur-sm pointer-events-none transition-all duration-300"
                      style={{
                        transform: 'translateY(18px) scale(0.91)',
                        opacity: 0.35,
                        zIndex: 1,
                        background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(13,15,18,0.95) 100%)',
                        boxShadow: '0 10px 30px -15px rgba(0,0,0,0.8)'
                      }}
                    />
                  )}

                  {/* Card 2 (Logo atrás do ativo) */}
                  {cards[idx + 1] && (
                    <div 
                      className="absolute inset-0 rounded-[32px] border border-emerald-500/35 bg-card/85 backdrop-blur-sm pointer-events-none transition-all duration-300"
                      style={{
                        transform: 'translateY(9px) scale(0.95)',
                        opacity: 0.7,
                        zIndex: 2,
                        background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(13,15,18,0.98) 100%)',
                        boxShadow: '0 15px 40px -20px rgba(16,185,129,0.15)'
                      }}
                    />
                  )}

                  {/* Transição 3D do Card Ativo */}
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={atual.id || idx}
                      initial={{ opacity: 0, y: -15, scale: 0.94, rotateX: 12 }}
                      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                      exit={
                        exitDirection === 'down'
                          ? { opacity: 0, y: 180, rotateX: -55, scale: 0.82, transition: { duration: 0.32, ease: [0.32, 0.72, 0, 1] } }
                          : { opacity: 0, x: -160, rotateZ: -14, scale: 0.88, transition: { duration: 0.28, ease: 'easeInOut' } }
                      }
                      transition={{ duration: 0.35, ease: [0.34, 1.25, 0.64, 1] }}
                      className="relative z-10 w-full h-full [perspective:1600px]"
                    >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={virar}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') virar(); }}
                      aria-label={virado ? 'Ver pergunta' : 'Ver resposta'}
                      className="relative w-full h-full text-left focus:outline-none cursor-pointer select-none"
                    >
                      <div
                        className="relative h-full w-full transition-transform duration-[800ms] [transform-style:preserve-3d]"
                        style={{
                          transform: virado ? 'rotateY(180deg)' : 'rotateY(0deg)',
                          transitionTimingFunction: 'cubic-bezier(0.34, 1.25, 0.64, 1)',
                        }}
                      >
                        {/* Frente */}
                        <div
                          className="absolute inset-0 rounded-[32px] border p-6 md:p-8 flex flex-col overflow-hidden text-white [backface-visibility:hidden] [-webkit-backface-visibility:hidden]"
                          style={{
                            borderColor: `${accent}40`,
                            boxShadow: `0 20px 60px -30px ${accent}80, inset 0 0 0 1px ${accent}25`,
                            background: `
                              radial-gradient(120% 80% at ${20 + (h % 60)}% ${10 + (h % 40)}%, ${accent}55 0%, transparent 55%),
                              radial-gradient(100% 70% at ${80 - (h % 50)}% ${90 - (h % 30)}%, ${accent}30 0%, transparent 60%),
                              linear-gradient(${angle}deg, oklch(0.22 0.04 280) 0%, oklch(0.14 0.03 280) 100%)
                            `,
                          }}
                        >
                          <svg className="absolute inset-0 h-full w-full opacity-[0.07] pointer-events-none" aria-hidden viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
                            <defs>
                              <pattern id={`fcp-${h}`} x="0" y="0" width={pattern === 0 ? 40 : pattern === 1 ? 60 : 80} height={pattern === 0 ? 40 : pattern === 1 ? 60 : 80} patternUnits="userSpaceOnUse" patternTransform={`rotate(${angle / 6})`}>
                                {pattern === 0 && <circle cx="20" cy="20" r="1.5" fill="currentColor" />}
                                {pattern === 1 && <path d="M0 30 L60 30" stroke="currentColor" strokeWidth="0.6" />}
                                {pattern === 2 && <path d="M0 0 L80 80 M80 0 L0 80" stroke="currentColor" strokeWidth="0.5" />}
                                {pattern === 3 && <rect x="20" y="20" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="0.5" />}
                              </pattern>
                            </defs>
                            <rect width="400" height="400" fill={`url(#fcp-${h})`} />
                          </svg>

                          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full opacity-30 blur-3xl pointer-events-none" style={{ background: accent }} aria-hidden />

                          {/* Floating Elements from Landing Page */}
                          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[32px]">
                            {Array.from({ length: 6 }).map((_, i) => (
                              <img key={i} src={laurel} alt="" aria-hidden="true" className="absolute -top-10 lp-fall" style={{ left: `${(i * 18 + 5) % 100}%`, width: `${14 + (i % 3) * 6}px`, animationDuration: `${12 + (i % 4) * 3}s`, animationDelay: `${i * 1.5}s`, opacity: 0.5, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
                            ))}
                            <img src={scales} alt="" aria-hidden="true" className="pointer-events-none absolute right-[8%] top-[25%] w-10 lp-float" style={{ animationDirection: 'reverse', opacity: 0.45, filter: `drop-shadow(0 0 12px ${accent}60)` }} />
                            <img src={laurel} alt="" aria-hidden="true" className="pointer-events-none absolute left-[12%] bottom-[25%] w-8 lp-float" style={{ animationDelay: '2s', opacity: 0.35 }} />
                          </div>

                          <div className="relative z-10 mb-4 flex items-start justify-between gap-3">
                            <p className="text-sm md:text-base font-semibold leading-snug line-clamp-2" style={{ color: `color-mix(in oklab, ${accent} 70%, white)`, textShadow: "0 2px 12px rgba(0,0,0,0.55)" }}>
                              {atual.tema ?? atual.area ?? "Flashcard"}
                            </p>
                            <Scale className="h-5 w-5 shrink-0" style={{ color: `${accent}`, opacity: 0.7 }} aria-hidden />
                          </div>
                          
                          <div className="relative z-10 flex-1 flex items-center justify-center text-center">
                            <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3 }} className="text-xl md:text-2xl leading-snug font-medium" style={{ fontFamily: "'Merriweather','Georgia',serif", textShadow: "0 2px 16px rgba(0,0,0,0.6)" }}>
                              {atual.pergunta}
                            </motion.p>
                          </div>
                          
                          <div className="relative z-10 mt-auto shrink-0 flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-normal tracking-wide text-white/60 pt-4">
                            <RotateCcw className="h-3 w-3 text-white/60" /> Toque ou aperte espaço para virar
                          </div>
                        </div>

                        {/* Verso */}
                        <div
                          className="absolute inset-0 rounded-[32px] border bg-card p-5 md:p-7 overflow-y-auto scrollbar-hide flex flex-col [backface-visibility:hidden] [-webkit-backface-visibility:hidden]"
                          style={{
                            transform: 'rotateY(180deg)',
                            borderColor: `${accent}55`,
                            boxShadow: `0 20px 60px -30px ${accent}60`,
                          }}
                        >
                          {/* Floating Elements (Verso) */}
                          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[32px]">
                            {Array.from({ length: 6 }).map((_, i) => (
                              <img key={i} src={laurel} alt="" aria-hidden="true" className="absolute -top-10 lp-fall" style={{ left: `${(i * 18 + 5) % 100}%`, width: `${14 + (i % 3) * 6}px`, animationDuration: `${12 + (i % 4) * 3}s`, animationDelay: `${i * 1.5}s`, opacity: 0.15, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
                            ))}
                            <img src={scales} alt="" aria-hidden="true" className="pointer-events-none absolute right-[8%] top-[25%] w-10 lp-float" style={{ animationDirection: 'reverse', opacity: 0.1, filter: `drop-shadow(0 0 12px ${accent}60)` }} />
                            <img src={laurel} alt="" aria-hidden="true" className="pointer-events-none absolute left-[12%] bottom-[25%] w-8 lp-float" style={{ animationDelay: '2s', opacity: 0.1 }} />
                          </div>

                          <div className="relative z-10 flex-1 flex flex-col">
                            <p className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-3 text-center" style={{ color: accent }}>
                              Resposta Explicada
                            </p>
                            <div className="flex-1 flex flex-col items-center justify-center space-y-4 pb-4">
                              <p className="whitespace-pre-wrap text-base sm:text-lg md:text-xl font-medium leading-relaxed text-foreground text-center max-w-prose">
                                {atual.resposta}
                              </p>
                            </div>
                            
                            {(atual.exemplo || atual.base_legal || atual.dica) && (
                              <div className="mt-3 border-t border-border pt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
                                {atual.exemplo && <Bloco icon={BookOpen} titulo="Exemplo Prático" texto={atual.exemplo} />}
                                {atual.base_legal && <Bloco icon={Scale} titulo="Base Legal / Artigo" texto={atual.base_legal} />}
                                {atual.dica && <Bloco icon={Lightbulb} titulo="Dica de Ouro" texto={atual.dica} />}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
                </div>

                {/* Botões de Ação com Safe Area Inset Bottom para Mobile */}
                <div className="pt-2 pb-[calc(6.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-14 sm:h-16 rounded-2xl text-base font-bold gap-2 border-border/80 hover:border-emerald-500/50 hover:bg-emerald-500/10 active:scale-95 transition-all shadow-sm"
                    onClick={() => responder('revisar')}
                  >
                    <RotateCcw className="h-5 w-5 text-emerald-500" />
                    <span>Revisar</span>
                  </Button>
                  <Button
                    className="h-14 sm:h-16 rounded-2xl text-base font-black gap-2 active:scale-95 transition-all shadow-md hover:opacity-90"
                    style={{ backgroundColor: '#10b981', color: '#ffffff' }}
                    onClick={() => responder('compreendido')}
                  >
                    <CheckCircle2 className="h-5 w-5 text-white" />
                    <span>Compreendi</span>
                  </Button>
                </div>
              </>
              );
            })()}
          </div>
        )}
      </div>

      <AreaTemasSheet area={areaSheet} open={!!areaSheet} onOpenChange={(v) => !v && setAreaSheet(null)} />
      {escolhendo && <FlashcardsBottomNav />}
    </div>
  );
};

function Tags({ card }: { card: Card }) {
  const { icon: Icon, color } = getAreaVisual(card.area);
  return (
    <div className="mb-2 flex items-center flex-wrap gap-1.5 text-[11px] font-extrabold tracking-tight">
      <span
        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 shadow-sm shrink-0"
        style={{ backgroundColor: `${color}18`, color, border: `1px solid ${color}40` }}
      >
        <Icon className="h-3 w-3 shrink-0" strokeWidth={2.2} />
        <span className="truncate max-w-[140px] sm:max-w-none">{card.area}</span>
      </span>

      {card.tema && (
        <>
          <ChevronRight className="h-3 w-3 text-muted-foreground/60 shrink-0" strokeWidth={2.2} />
          <span className="inline-flex items-center rounded-md border border-border/70 bg-muted/70 px-2.5 py-1 text-foreground/90 font-bold truncate max-w-[180px] sm:max-w-none shrink-0 shadow-sm">
            {card.tema}
          </span>
        </>
      )}
    </div>
  );
}


function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? 'bg-emerald-500 text-white' : 'border border-border bg-card text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

function Bloco({ icon: Icon, titulo, texto }: { icon: any; titulo: string; texto: string }) {
  return (
    <div className="rounded-2xl bg-muted/50 p-3">
      <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {titulo}
      </p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{texto}</p>
    </div>
  );
}

export default FlashcardsEstudo;
