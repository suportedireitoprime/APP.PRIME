import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Capacitor } from '@capacitor/core';
import { NativeFlashcardsPlugin } from '@/plugins/NativeFlashcardsPlugin';
import { PageHeader } from '@/components/vademecum/PageHeader';
import FlashcardsBottomNav from '@/components/flashcards/FlashcardsBottomNav';
import AreaTemasSheet from '@/components/flashcards/AreaTemasSheet';
import Flashcard3D from '@/components/flashcards/Flashcard3D';
import {
  CheckCircle2, Shuffle, ArrowDownNarrowWide, BarChart3, ChevronRight, Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { haptic } from '@/lib/nativeHaptics';
import { getAreaVisual } from '@/lib/flashcardsAreaVisual';
import { useFlashcardsResumoAreas } from '@/lib/flashcardsQueries';
import { resetBodyScrollLock } from '@/hooks/useBodyScrollLock';
import ContagemRegressiva from '@/components/questoes/ContagemRegressiva';
import { useFlashcardsEngine } from '@/hooks/useFlashcardsEngine';
import ShapeGrid from '@/components/ui/ShapeGrid';

function AnimatedNumber({ value }: { value: number }) {
  const numRef = useRef<HTMLSpanElement>(null);
  
  useGSAP(() => {
    if (numRef.current) {
      const target = { val: parseFloat(numRef.current.innerText) || 0 };
      gsap.to(target, {
        val: value,
        duration: 0.4,
        ease: 'power2.out',
        onUpdate: () => {
          if (numRef.current) numRef.current.innerText = Math.round(target.val).toString();
        }
      });
    }
  }, [value]);

  return <span ref={numRef}>{value}</span>;
}

function toSentence(s: string): string {
  const minors = new Set(['da', 'de', 'do', 'das', 'dos', 'e', 'em', 'no', 'na', 'nos', 'nas', 'ao', 'à', 'às', 'por', 'para', 'com', 'sem', 'sob', 'ou']);
  return s.toLowerCase().split(/\s+/).map((word, i) => {
    if (i === 0 || !minors.has(word)) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return word;
  }).join(' ');
}

function formatTemaBreadcrumb(raw: string): string[] {
  const dashIdx = raw.search(/\s[-–]\s/);
  if (dashIdx === -1) return [toSentence(raw)];
  const leiName = raw.slice(0, dashIdx).trim();
  let remaining = raw.slice(dashIdx).replace(/^\s*[-–]\s*/, '').trim();
  const badges: string[] = [];
  const structRegex = /^(?:PARTE|LIVRO|T[ÍI]TULO|CAP[ÍI]TULO|SE[ÇC][ÃA]O|SUBSE[ÇC][ÃA]O)\s+[\wºª]+(?:-[\wºª]+)?/i;
  
  while (true) {
    const match = remaining.match(structRegex);
    if (!match) break;
    badges.push(toSentence(match[0]));
    remaining = remaining.slice(match[0].length).trim();
    if (remaining.startsWith('-') || remaining.startsWith('–') || remaining.startsWith(':')) {
      remaining = remaining.replace(/^[-–—:]+\s*/, '').trim();
    }
  }
  const result = [leiName, ...badges];
  if (remaining) {
    result.push(toSentence(remaining));
  }
  return result;
}

const FlashcardsEstudo = () => {
  const navigate = useNavigate();

  // Engine Hook que concentra lógica
  const {
    params, setParam, escolhendo, loading,
    emContagem, setEmContagem,
    cards, idx, feitos, atual,
    virado, virar, responder,
    sessionCompreendidos, sessionRevisar,
    exitDirection, sessionPerTitle,
    ordemParam, toggleOrdem,
    gateFlashcards, refetchCards,
    areaParam, temasParam, setFeitos
  } = useFlashcardsEngine();

  const { data: areasRaw } = useFlashcardsResumoAreas();
  const areas = areasRaw || [];
  
  // Sheet state local
  const [areaSheet, setAreaSheet] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Sessão de Prática de Flashcards | Vade Mecum PRIME';
    resetBodyScrollLock();
    
    const checkNative = async () => {
      if (Capacitor.isNativePlatform() && !escolhendo) {
        const { data } = await supabase.auth.getSession();
        NativeFlashcardsPlugin.startStudySession({ 
          category: areaSheet || 'Flashcards', 
          cards: [],
          accessToken: data.session?.access_token,
          refreshToken: data.session?.refresh_token
        });
      }
    };
    checkNative();
  }, [escolhendo, areaSheet]);

  return (
    <div className={`min-h-dvh overflow-x-hidden bg-background ${escolhendo ? 'pb-[calc(8rem+var(--sai-bottom))]' : 'pb-[calc(2.5rem+var(--sai-bottom))]'}`}>
      {!escolhendo && (
        <div className="fixed inset-0 z-0 opacity-80 mix-blend-screen pointer-events-none">
          <ShapeGrid 
            speed={0.5} 
            squareSize={40}
            direction='diagonal'
            borderColor='rgba(255, 255, 255, 0.05)'
            hoverFillColor='rgba(255, 255, 255, 0.1)'
            shape='square'
            hoverTrailAmount={5}
          />
        </div>
      )}
      <div className="relative z-10">
        {gateFlashcards.gateNode}
      </div>
      
      <div className="relative z-10 mx-auto w-full max-w-3xl px-3.5 sm:px-6">
        <PageHeader
          title={escolhendo ? 'Categorias de Flashcards' : ''}
          onBack={() => navigate('/flashcards')}
          rightAction={
            !escolhendo && (
              <Sheet>
                <SheetTrigger asChild>
                  <button className="flex h-10 w-10 items-center justify-center rounded-full bg-card border border-border/80 shadow-sm text-foreground hover:bg-muted">
                    <BarChart3 className="h-4.5 w-4.5 text-foreground" />
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto rounded-t-3xl border-t border-border">
                  <SheetHeader><SheetTitle>Sessão Atual</SheetTitle></SheetHeader>
                  <div className="mt-4 space-y-6 pb-8">
                    {/* Ring Chart */}
                    <div className="flex items-center gap-6">
                      <div className="relative shrink-0">
                        <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
                          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-zinc-800/60" />
                          {feitos > 0 && (
                            <>
                              <circle
                                cx="50" cy="50" r="40" fill="none"
                                stroke="#10b981" strokeWidth="8" strokeLinecap="round"
                                strokeDasharray={`${(sessionCompreendidos / Math.max(feitos, 1)) * 251.3} 251.3`}
                              />
                              <circle
                                cx="50" cy="50" r="40" fill="none"
                                stroke="#f59e0b" strokeWidth="8" strokeLinecap="round"
                                strokeDasharray={`${(sessionRevisar / Math.max(feitos, 1)) * 251.3} 251.3`}
                                strokeDashoffset={`${-(sessionCompreendidos / Math.max(feitos, 1)) * 251.3}`}
                              />
                            </>
                          )}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-black text-foreground tabular-nums">{feitos}</span>
                          <span className="text-[10px] font-medium text-muted-foreground">de {cards.length}</span>
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="text-sm font-bold text-foreground">{sessionCompreendidos} Compreendidos</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
                          <span className="text-sm font-bold text-foreground">{sessionRevisar} A revisar</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700 shrink-0" />
                          <span className="text-sm font-bold text-muted-foreground">{cards.length - feitos} Restantes</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress by Title */}
                    {sessionPerTitle.length > 1 && (
                      <div>
                        <p className="mb-3 text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">Progresso por Título</p>
                        <div className="space-y-2.5">
                          {sessionPerTitle.map(t => (
                            <div key={t.name} className="space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-foreground truncate flex-1">{formatTemaBreadcrumb(t.name).pop()}</span>
                                <span className="text-[11px] font-bold tabular-nums text-muted-foreground shrink-0">{t.done}/{t.total}</span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-zinc-800/60 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                                  style={{ width: `${t.pct}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Order Toggle */}
                    <div>
                      <p className="mb-3 text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">Ordem de Exibição</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => { if (ordemParam !== 'sequencial') toggleOrdem(); }}
                          className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border text-sm font-bold transition-all ${
                            ordemParam === 'sequencial'
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500 shadow-sm shadow-emerald-500/10'
                              : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:bg-zinc-900/80'
                          }`}
                        >
                          <ArrowDownNarrowWide className="h-4 w-4" />
                          Sequencial
                        </button>
                        <button
                          onClick={() => { if (ordemParam !== 'embaralhado') toggleOrdem(); }}
                          className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border text-sm font-bold transition-all ${
                            ordemParam === 'embaralhado'
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500 shadow-sm shadow-emerald-500/10'
                              : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:bg-zinc-900/80'
                          }`}
                        >
                          <Shuffle className="h-4 w-4" />
                          Aleatório
                        </button>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )
          }
        />

        {/* Categorias */}
        {escolhendo ? (
          <div className="space-y-3 pt-4">
            <p className="mb-1 text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">Categorias</p>
            <button
              onClick={() => { haptic.selection(); setParam('areas', areas.map((a) => a.area).join('|')); }}
              className="flex w-full items-center gap-3.5 rounded-2xl border border-border/80 bg-card p-4 text-left transition-all hover:border-emerald-500/50 hover:shadow-md active:scale-[0.99]"
            >
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10">
                <Layers className="h-8 w-8 text-emerald-500" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-extrabold text-foreground">Mistura geral de matérias</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Praticar com flashcards de todas as categorias ativas</p>
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
                      <p className="mt-0.5 text-xs text-muted-foreground">{a.total_cards} cards · {a.a_revisar} a revisar</p>
                    </div>
                    <ChevronRight className="h-4.5 w-4.5 shrink-0 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="pt-4 space-y-4">
            {emContagem && !escolhendo && (
              <ContagemRegressiva onFim={() => setEmContagem(false)} subtitulo="Preparando seus flashcards…" solido />
            )}

            <div className="flex items-center gap-3">
              <Progress value={cards.length ? ((idx + 1) / cards.length) * 100 : 0} className="h-2 flex-1 [&>div]:bg-emerald-500" />
              <span className="text-xs font-black tabular-nums text-muted-foreground">
                <AnimatedNumber value={idx + 1} />/<AnimatedNumber value={cards.length} />
              </span>
            </div>

            {loading && !emContagem && (
              <div className="relative w-full min-h-[380px] sm:min-h-[440px] h-[54dvh] max-h-[540px] rounded-[32px] border border-border/80 bg-card p-6 md:p-8 flex items-center justify-center shadow-lg animate-pulse">
                <div className="flex flex-col items-center gap-4 text-emerald-500/60">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-current border-t-transparent" />
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

            {atual && (
              <div className="relative w-full min-h-[380px] sm:min-h-[440px] h-[54dvh] max-h-[540px]">
                {/* Efeito de pilha (cards no fundo) */}
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
                {cards[idx + 1] && (
                  <div 
                    className="absolute inset-0 rounded-[32px] border border-emerald-500/30 bg-card/80 backdrop-blur-md pointer-events-none transition-all duration-300"
                    style={{
                      transform: 'translateY(9px) scale(0.95)',
                      opacity: 0.65,
                      zIndex: 2,
                      background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(13,15,18,0.98) 100%)',
                      boxShadow: '0 15px 40px -20px rgba(0,0,0,0.8)'
                    }}
                  />
                )}
                
                <Flashcard3D 
                  atual={atual}
                  idx={idx}
                  virado={virado}
                  onVirar={virar}
                  onResponder={responder}
                  exitDirection={exitDirection}
                  accent={params.get('cor') || "#10b981"}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {escolhendo && <FlashcardsBottomNav />}

      {/* Sheets de Categorias */}
      {areaSheet && (
        <AreaTemasSheet area={areaSheet} open={!!areaSheet} onOpenChange={(v) => !v && setAreaSheet(null)} />
      )}
    </div>
  );
};

export default FlashcardsEstudo;
