// @ts-nocheck
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { animate } from 'framer-motion';
import { areaIconFor } from '@/lib/areasDireitoIcons';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import Flashcard3D from '@/components/flashcards/Flashcard3D';
import {
  CheckCircle2, Shuffle, ArrowDownNarrowWide, BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { haptic } from '@/lib/nativeHaptics';
import { resetBodyScrollLock } from '@/hooks/useBodyScrollLock';
import ContagemRegressiva from '@/components/questoes/ContagemRegressiva';
import { useFlashcardsEngine } from '@/hooks/useFlashcardsEngine';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { Capacitor } from '@capacitor/core';
import { NativeFlashcards } from '@/plugins/NativeFlashcardsPlugin';
import { supabase } from '@/integrations/supabase/client';
import { getDisciplinaVisualTheme } from '@/lib/disciplinasTheme';

function AnimatedNumber({ value }: { value: number }) {
  const numRef = useRef<HTMLSpanElement>(null);
  
  useEffect(() => {
    if (numRef.current) {
      const prev = parseFloat(numRef.current.innerText) || 0;
      const controls = animate(prev, value, {
        duration: 0.4,
        ease: 'easeOut',
        onUpdate: (latest) => {
          if (numRef.current) numRef.current.innerText = Math.round(latest).toString();
        }
      });
      return () => controls.stop();
    }
  }, [value]);

  return <span ref={numRef}>{value}</span>;
}

const FlashcardsEstudo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const fromPath = (location.state as any)?.from;

  const handleBack = () => {
    // Invalida cache das trilhas de flashcards ao sair
    queryClient.invalidateQueries({ queryKey: ['area_flashcards_temas'] });
    queryClient.invalidateQueries({ queryKey: ['flashcards_areas_resumo'] });
    
    if (fromPath) {
      navigate(fromPath);
    } else if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/flashcards');
    }
  };

  // Engine Hook que concentra lógica
  const {
    params, loading,
    emContagem, setEmContagem,
    cards, idx, feitos, atual,
    virado, virar, responder,
    sessionCompreendidos, sessionRevisar,
    exitDirection, sessionPerTitle,
    ordemParam, toggleOrdem,
    gateFlashcards, refetchCards,
    areaParam, temasParam, setFeitos,
    savedIndexToResume, confirmResume,
  } = useFlashcardsEngine();

  const corParam = params.get('cor');
  const areaNome = atual?.area || areaParam || (cards[0]?.area ?? null);
  const theme = getDisciplinaVisualTheme(areaNome);
  const cardAccent = corParam || (areaNome ? areaIconFor(areaNome).color : theme.accent);

  useEffect(() => {
    document.title = 'Sessão de Prática de Flashcards | Vade Mecum PRIME';
    resetBodyScrollLock();
  }, [loading]);

  // Ponte 100% Nativa (Jetpack Compose / SwiftUI) no mobile
  useEffect(() => {
    if (!emContagem && cards.length > 0 && Capacitor.isNativePlatform()) {
      const title = areaParam || temasParam || 'Flashcards';
      const sessionData = {
        titulo: title,
        cards: cards.map(c => ({
          id: c.id,
          pergunta: c.pergunta,
          resposta: c.resposta,
          area: c.area,
          tema: c.tema,
          subtema: c.subtema,
          exemplo: c.exemplo,
          base_legal: c.base_legal,
          dica: c.dica,
          artigo_numero: c.artigo_numero,
        })),
        startIndex: idx,
      };

      const subCard = NativeFlashcards.addListener('onCardAnswered', async ({ cardId, status, area, tema }) => {
        const { data: auth } = await supabase.auth.getUser();
        if (auth.user) {
          await supabase.from('flashcards_progresso').upsert({
            user_id: auth.user.id,
            card_id: cardId,
            area: area,
            tema: tema,
            status: status,
            ultima_resposta_em: new Date().toISOString(),
          }, { onConflict: 'user_id,card_id' });
        }
      });

      const subClose = NativeFlashcards.addListener('onClose', () => {
        handleBack();
      });

      NativeFlashcards.openSession(sessionData).catch((err) => {
        console.warn('[NativeFlashcards] Erro ao abrir sessão nativa, usando web:', err);
      });

      return () => {
        subCard.then(h => h.remove()).catch(() => {});
        subClose.then(h => h.remove()).catch(() => {});
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emContagem, cards.length]);

  return (
    <div className="min-h-dvh overflow-x-hidden bg-background pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))]">
      {/* Imagem de Fundo Temática da Disciplina com Ofuscamento Mínimo e Escurecimento Suave */}
      {theme?.fundoAssetUrl && (
        <div className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden">
          <img
            src={theme.fundoAssetUrl}
            alt=""
            aria-hidden="true"
            loading="eager"
            fetchpriority="high"
            decoding="async"
            className="w-full h-full object-cover select-none pointer-events-none filter blur-[0.5px] brightness-[0.96] contrast-[1.05] scale-105 transition-opacity duration-700"
          />
          {/* Escurecimento suave */}
          <div className="absolute inset-0 bg-black/10 pointer-events-none" />
        </div>
      )}

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

      {/* Imagem Majestosa da Deusa Têmis Vazada de Fundo Central */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-hidden z-0 select-none">
        <img
          src="/images/gamificacao/deusa_temis_vazada.webp"
          alt=""
          aria-hidden="true"
          loading="eager"
          fetchpriority="high"
          decoding="async"
          className="w-[320px] sm:w-[440px] md:w-[520px] max-w-[88vw] h-auto object-contain opacity-25 filter drop-shadow-[0_0_55px_rgba(234,179,8,0.25)] pointer-events-none"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
          }}
        />
      </div>

      <div className="relative z-10">
        {gateFlashcards.gateNode}
      </div>

      <div className="relative z-10 mx-auto w-full max-w-3xl px-3.5 sm:px-6">
        <PageHeader
          title={areaNome || 'Flashcards'}
          onBack={handleBack}
          rightAction={
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
                              strokeDashoffset={`-${(sessionCompreendidos / Math.max(feitos, 1)) * 251.3}`}
                            />
                          </>
                        )}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-black text-foreground">{feitos}</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Cards</span>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        <span className="text-muted-foreground">Compreendidos:</span>
                        <span className="font-bold text-foreground">{sessionCompreendidos}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                        <span className="text-muted-foreground">Para revisar:</span>
                        <span className="font-bold text-foreground">{sessionRevisar}</span>
                      </div>
                    </div>
                  </div>

                  {/* Detalhamento por Tema */}
                  {Object.keys(sessionPerTitle).length > 0 && (
                    <div className="space-y-3 pt-2 border-t border-border/60">
                      <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Por Matéria / Tema</p>
                      <div className="space-y-2">
                        {Object.entries(sessionPerTitle).map(([title, stats]) => (
                          <div key={title} className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-foreground truncate max-w-[200px]">{title}</span>
                              <span className="text-muted-foreground">{stats.feitos} feitos</span>
                            </div>
                            <div className="flex gap-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                              <div style={{ width: `${stats.feitos ? (stats.compreendidos / stats.feitos) * 100 : 0}%` }} className="bg-emerald-500" />
                              <div style={{ width: `${stats.feitos ? (stats.revisar / stats.feitos) * 100 : 0}%` }} className="bg-amber-500" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ordem de Apresentação */}
                  <div className="pt-2 border-t border-border/60">
                    <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">Ordem dos Flashcards</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => toggleOrdem('sequencial')}
                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                          ordemParam === 'sequencial'
                            ? 'bg-[#36AF85]/15 border-[#36AF85] text-[#36AF85]'
                            : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:bg-zinc-900/80'
                        }`}
                      >
                        <ArrowDownNarrowWide className="h-4 w-4" />
                        Por Artigos
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleOrdem('embaralhado')}
                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                          ordemParam === 'embaralhado'
                            ? 'bg-[#36AF85]/15 border-[#36AF85] text-[#36AF85]'
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
          }
        />

        <div className="pt-4 space-y-4">
          {emContagem && (
            <ContagemRegressiva onFim={() => setEmContagem(false)} subtitulo="Preparando seus flashcards…" solido />
          )}

          <div className="flex items-center gap-3">
            <div className="relative h-2 flex-1 rounded-full bg-zinc-800/60 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${cards.length ? ((idx + 1) / cards.length) * 100 : 0}%`,
                  backgroundColor: cardAccent,
                  boxShadow: `0 0 10px ${cardAccent}60`,
                }}
              />
            </div>
            <span className="text-xs font-black tabular-nums text-muted-foreground">
              <AnimatedNumber value={cards.length ? Math.min(idx + 1, cards.length) : 0} />/<AnimatedNumber value={cards.length} />
            </span>
          </div>

          {loading && !emContagem && (
            <div className="relative w-full min-h-[380px] sm:min-h-[440px] h-[54dvh] max-h-[540px] rounded-[32px] border border-border/80 bg-card p-6 md:p-8 flex items-center justify-center shadow-lg animate-pulse">
              <div className="flex flex-col items-center gap-4">
                <div 
                  className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"
                  style={{ borderColor: cardAccent, borderTopColor: 'transparent' }}
                />
              </div>
            </div>
          )}

          {!loading && !emContagem && cards.length === 0 && (
            <div className="rounded-3xl border border-border bg-card p-10 text-center">
              <p className="text-base font-extrabold text-foreground">Nenhum card encontrado neste filtro.</p>
              <Button className="mt-4 rounded-xl" onClick={handleBack}>Voltar</Button>
            </div>
          )}

          {!loading && cards.length > 0 && !atual && (
            <div className="rounded-3xl border border-border bg-card p-10 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-12 w-12" style={{ color: cardAccent }} />
              <h3 className="text-xl font-black text-foreground">Sessão Concluída!</h3>
              <p className="mt-1 text-sm text-muted-foreground">{feitos} flashcards estudados com sucesso.</p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <Button variant="outline" className="rounded-2xl px-5 font-bold" onClick={handleBack}>
                  Voltar para a Trilha
                </Button>
                <Button className="rounded-2xl px-6 font-bold" style={{ backgroundColor: cardAccent }} onClick={() => { setFeitos(0); setEmContagem(true); refetchCards(); }}>
                  Nova sessão
                </Button>
              </div>
            </div>
          )}

          {atual && (
            <div className="relative w-full min-h-[380px] sm:min-h-[440px] h-[54dvh] max-h-[540px]">
              {/* Efeito de pilha em estilo pergaminho (cards no fundo) */}
              {cards[idx + 2] && (
                <div 
                  className="absolute inset-0 rounded-[32px] border pointer-events-none transition-all duration-300"
                  style={{
                    borderColor: 'rgba(212, 185, 150, 0.3)',
                    transform: 'translateY(18px) scale(0.91)',
                    opacity: 0.45,
                    zIndex: 1,
                    background: 'linear-gradient(160deg, #231b12 0%, #17120c 60%, #0d0a07 100%)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.85)',
                  }}
                />
              )}
              {cards[idx + 1] && (
                <div 
                  className="absolute inset-0 rounded-[32px] border pointer-events-none transition-all duration-300"
                  style={{
                    borderColor: 'rgba(212, 185, 150, 0.45)',
                    transform: 'translateY(10px) scale(0.955)',
                    opacity: 0.75,
                    zIndex: 2,
                    background: 'linear-gradient(160deg, #2a2016 0%, #1c150e 60%, #110d08 100%)',
                    boxShadow: '0 14px 40px rgba(0,0,0,0.85), inset 0 0 20px rgba(0,0,0,0.5)',
                  }}
                />
              )}

              <Flashcard3D
                key={atual.id}
                atual={atual}
                idx={idx}
                virado={virado}
                onVirar={virar}
                onResponder={responder}
                exitDirection={exitDirection}
                accent={cardAccent}
                areaNome={areaNome}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modal Minimalista de Retomada */}
      {savedIndexToResume !== null && !emContagem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-300">
          <div className="bg-[#0d0f12] border border-white/10 p-6 rounded-3xl w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-[19px] font-extrabold text-white mb-2">Retomar Estudo?</h3>
            <p className="text-sm text-zinc-400 mb-6">
              Você parou no flashcard <strong className="text-white">{savedIndexToResume + 1}</strong>. Deseja continuar ou recomeçar?
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => { haptic.selection(); confirmResume(true); }}
                className="w-full h-12 rounded-2xl font-bold bg-amber-500 hover:bg-amber-600 text-black border-none"
              >
                Continuar de onde parei
              </Button>
              <Button 
                variant="outline"
                onClick={() => { haptic.selection(); confirmResume(false); }}
                className="w-full h-12 rounded-2xl font-bold border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white"
              >
                Começar do zero
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashcardsEstudo;
