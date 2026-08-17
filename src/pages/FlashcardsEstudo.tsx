import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/vademecum/PageHeader';
import FlashcardsBottomNav from '@/components/flashcards/FlashcardsBottomNav';
import AreaTemasSheet from '@/components/flashcards/AreaTemasSheet';
import {
  CheckCircle2, RotateCcw, SlidersHorizontal, BookOpen, Scale, Lightbulb, ChevronRight, Layers,
  Shuffle, ArrowDownNarrowWide, BarChart3, Volume2, VolumeX, Shuffle as ShuffleIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { haptic } from '@/lib/nativeHaptics';
import { playFlipSound } from '@/lib/flipSound';
import { getAreaVisual } from '@/lib/flashcardsAreaVisual';
import { useFlashcardsSessao, useFlashcardsResumoAreas, FlashcardCard } from '@/lib/flashcardsQueries';
import { saveFlashcardsSessao, getFlashcardsSessoes } from '@/lib/flashcardsSessoes';
import { getOfflineCards, saveOfflineCards, getOfflineDecks, saveOfflineDecks } from '@/lib/flashcardsOfflineManager';
import { useGatedFeature } from '@/hooks/useGatedFeature';
import { resetBodyScrollLock } from '@/hooks/useBodyScrollLock';
import ContagemRegressiva from '@/components/questoes/ContagemRegressiva';
import laurel from '@/assets/landing-tribunal/laurel-leaf.png';
import scales from '@/assets/landing-tribunal/scales.png';

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

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function ConfettiShower() {
  const pieces = Array.from({ length: 80 });
  return (
    <div className="absolute inset-0 pointer-events-none z-[100] overflow-hidden flex justify-center">
      {pieces.map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: -20, x: 0, rotate: Math.random() * 360, opacity: 1, scale: Math.random() * 0.5 + 0.5 }}
          animate={{
            y: 500,
            x: `+=${(Math.random() - 0.5) * 600}`,
            rotate: Math.random() * 720,
            opacity: [1, 1, 0]
          }}
          transition={{ duration: 1.5 + Math.random() * 2, ease: 'easeIn', delay: Math.random() * 0.4 }}
          className="absolute top-0 w-2.5 h-2.5 rounded-sm"
          style={{ backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][i % 6] }}
        />
      ))}
    </div>
  );
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

/** Transforma "Código Penal - TÍTULO I DA APLICAÇÃO DA LEI PENAL" em
 *  ["Código Penal", "Título I", "Da Aplicação da Lei Penal"] */
function formatTemaBreadcrumb(raw: string): string[] {
  // Separa pela primeira ocorrência de " - " ou " – "
  const dashIdx = raw.search(/\s[-–]\s/);
  if (dashIdx === -1) return [toSentence(raw)];

  const leiName = raw.slice(0, dashIdx).trim();
  let remaining = raw.slice(dashIdx).replace(/^\s*[-–]\s*/, '').trim();

  // Match para extrair rótulos estruturais em sequência (Ex: TÍTULO I - CAPÍTULO II - SEÇÃO III)
  const badges: string[] = [];
  const structRegex = /^(?:PARTE|LIVRO|T[ÍI]TULO|CAP[ÍI]TULO|SE[ÇC][ÃA]O|SUBSE[ÇC][ÃA]O)\s+[\wºª]+(?:-[\wºª]+)?/i;
  
  while (true) {
    const match = remaining.match(structRegex);
    if (!match) break;
    
    badges.push(toSentence(match[0]));
    remaining = remaining.slice(match[0].length).trim();
    
    // Remove hifens/dois pontos subsequentes
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

/** "DA APLICAÇÃO DA LEI PENAL" → "Da Aplicação da Lei Penal" */
function toSentence(s: string): string {
  const minors = new Set(['da', 'de', 'do', 'das', 'dos', 'e', 'em', 'no', 'na', 'nos', 'nas', 'ao', 'à', 'às', 'por', 'para', 'com', 'sem', 'sob', 'ou']);
  return s.toLowerCase().split(/\s+/).map((word, i) => {
    if (i === 0 || !minors.has(word)) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return word;
  }).join(' ');
}

const FlashcardsEstudo = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  // SEO & Prevenção de bug de scroll/pointer events (Radix UI Sheet unmount)
  useEffect(() => {
    document.title = 'Sessão de Prática de Flashcards | Vade Mecum PRIME';
    resetBodyScrollLock();
  }, []);

  const areaParam = params.get('area');
  const areasParam = params.get('areas');
  const temasParam = params.get('temas') || params.get('tema');
  const deckId = params.get('deck');
  const modo = params.get('modo') || 'todos';
  const ordemParam = params.get('ordem') || 'embaralhado';
  const editalId = params.get('editalId');
  const quantidadeParam = params.get('quantidade');

  // Sem nenhum filtro escolhido → tela de categorias.
  const escolhendo = !areaParam && !areasParam && !temasParam && !deckId && modo !== 'edital';

  const limitParam = parseInt(params.get('limite') || '30', 10);
  const listaAreas = areasParam ? areasParam.split('|').filter(Boolean) : areaParam ? [areaParam] : null;
  const temasList = temasParam ? temasParam.split('|').filter(Boolean) : null;
  const artigosParam = params.get('artigos');
  const artigosList = artigosParam ? artigosParam.split('|').filter(Boolean) : null;
  const modoAtual = modo;
  
  const [sessaoId] = useState(() => params.get('sessaoId') || Date.now().toString());

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
  const [feitos, setFeitos] = useState(0);
  const [sessionCompreendidos, setSessionCompreendidos] = useState(0);
  const [sessionRevisar, setSessionRevisar] = useState(0);
  const [areaSheet, setAreaSheet] = useState<string | null>(null);
  const [exitDirection, setExitDirection] = useState<'left' | 'down'>('left');
  const [emContagem, setEmContagem] = useState(!escolhendo);
  const [modoAudio, setModoAudio] = useState(false);
  const [modoReverso, setModoReverso] = useState(false);
  const audioTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const salvando = useRef(false);
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const gateFlashcards = useGatedFeature('flashcards', 'flashcards');
  
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotateX = useTransform(tiltY, [-200, 200], [12, -12]);
  const rotateY = useTransform(tiltX, [-200, 200], [-12, 12]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    tiltX.set(e.clientX - rect.left - rect.width / 2);
    tiltY.set(e.clientY - rect.top - rect.height / 2);
  };
  const handleMouseLeave = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  const loading = (loadingCards || emContagem) && !escolhendo;

  useEffect(() => {
    if (cardsRaw) {
      let finalCards = [...cardsRaw];
      
      // Filtro de artigos no frontend (compatível com números e textos)
      const artigosList = artigosParam ? artigosParam.split('|').filter(Boolean) : null;
      if (artigosList && artigosList.length > 0) {
        finalCards = finalCards.filter(c => {
          if (!c.artigo_numero) return false;
          const numCard = c.artigo_numero.replace(/\D/g, '');
          return artigosList.includes(c.artigo_numero) || (numCard !== '' && artigosList.some(a => a.replace(/\D/g, '') === numCard));
        });
      }
      
      if (ordemParam === 'sequencial') {
        finalCards.sort((a,b) => (a.artigo_numero || '').localeCompare(b.artigo_numero || '', undefined, {numeric: true}));
      }

      if (quantidadeParam) {
        const q = parseInt(quantidadeParam, 10);
        if (!isNaN(q) && q > 0) {
          finalCards = finalCards.slice(0, q);
        }
      }

      setCards(finalCards);
      setIdx(0);
      setVirado(false);
    }
  }, [cardsRaw, ordemParam, artigosParam, quantidadeParam]);

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

  // Se retomou, puxa "feitos" do storage (se existir)
  useEffect(() => {
    const s = getFlashcardsSessoes().find(s => s.id === sessaoId);
    if (s && s.cardsRevisados > 0 && feitos === 0) {
      setFeitos(s.cardsRevisados);
    }
  }, [sessaoId, feitos]);

  // Se retomou, puxa "feitos" do storage (se existir)
  useEffect(() => {
    const s = getFlashcardsSessoes().find(s => s.id === sessaoId);
    if (s && s.cardsRevisados > 0 && feitos === 0) {
      setFeitos(s.cardsRevisados);
    }
  }, [sessaoId, feitos]);

  const atual = cards[idx];
  const progresso = cards.length ? Math.round((feitos / cards.length) * 100) : 0;

  const virar = () => {
    haptic.selection();
    playFlipSound();
    setVirado((v) => !v);
  };

  useEffect(() => {
    if (!modoAudio) {
      window.speechSynthesis.cancel();
      if (audioTimeoutRef.current) clearTimeout(audioTimeoutRef.current);
      return;
    }
    
    if (cards.length > 0 && idx < cards.length) {
      const card = cards[idx];
      window.speechSynthesis.cancel();
      if (audioTimeoutRef.current) clearTimeout(audioTimeoutRef.current);

      const utPergunta = new SpeechSynthesisUtterance(card.pergunta);
      utPergunta.lang = 'pt-BR';
      utPergunta.rate = 1.0;
      
      utPergunta.onend = () => {
        audioTimeoutRef.current = setTimeout(() => {
          setVirado(true);
          const utResposta = new SpeechSynthesisUtterance(card.resposta);
          utResposta.lang = 'pt-BR';
          utResposta.rate = 1.0;
          utResposta.onend = () => {
            audioTimeoutRef.current = setTimeout(() => {
              if (idx + 1 < cards.length) {
                setVirado(false);
                setIdx(i => i + 1);
                setFeitos(f => f + 1);
              } else {
                setModoAudio(false);
                toast.success('Sessão concluída em áudio!');
              }
            }, 3000); // 3 segundos antes do próximo
          };
          window.speechSynthesis.speak(utResposta);
        }, 1500); // 1.5s pra pensar antes da resposta
      };
      
      window.speechSynthesis.speak(utPergunta);
    }

    return () => {
      window.speechSynthesis.cancel();
      if (audioTimeoutRef.current) clearTimeout(audioTimeoutRef.current);
    };
  }, [modoAudio, idx, cards]);

  const responder = (status: 'compreendido' | 'revisar') => {
    if (!atual || salvando.current) return;
    if (gateFlashcards.blocked) { gateFlashcards.openGate(); return; }
    
    // Configura a direção da animação baseada na resposta
    setExitDirection(status === 'revisar' ? 'down' : 'left');
    if (status === 'compreendido') {
      setSessionCompreendidos(c => c + 1);
    } else {
      setSessionRevisar(c => c + 1);
      if (cardContainerRef.current) {
        gsap.fromTo(cardContainerRef.current, {x: -8}, {x: 8, clearProps: "x", repeat: 5, yoyo: true, duration: 0.05, ease: 'sine.inOut'});
      }
    }
    
    salvando.current = true;
    haptic.light();

    // OPTIMISTIC UI: Avança o card imediatamente
    setFeitos((f) => f + 1);
    setVirado(false);
    
    if (idx + 1 >= cards.length) {
      toast.success('Sessão concluída!');
      setIdx(cards.length);
    } else {
      setIdx((i) => i + 1);
    }

    // Salvar no histórico local geral
    const novoFeitos = feitos + 1;
    const titleParts = [];
    if (areaParam || areasParam) titleParts.push(areaParam || 'Geral');
    if (temasParam) titleParts.push(temasParam.split('|')[0]);
    if (deckId) titleParts.push(`Deck ${deckId}`);
    
    saveFlashcardsSessao({
      id: sessaoId,
      dataInicio: new Date().toISOString(),
      dataUltimoAcesso: new Date().toISOString(),
      queryString: params.toString() + (params.has('sessaoId') ? '' : `&sessaoId=${sessaoId}`),
      filtroAplicado: titleParts.join(' • ') || 'Sessão Personalizada',
      cardsRevisados: novoFeitos,
      totalCards: cards.length,
    });

    // Tracking de Erros em Decks Personalizados Offline
    if (deckId) {
      const offlineDecks = getOfflineDecks();
      const deckIndex = offlineDecks.findIndex(d => d.id === deckId);
      if (deckIndex >= 0) {
        const deck = offlineDecks[deckIndex];
        const cardsOffline = getOfflineCards(deckId);
        const cardIndex = cardsOffline.findIndex(c => c.id === atual.id);
        
        if (cardIndex >= 0) {
          const oldStatus = cardsOffline[cardIndex].status;
          const newStatus = status === 'compreendido' ? 'memorizado' : 'errou';
          
          if (oldStatus !== newStatus) {
            cardsOffline[cardIndex].status = newStatus;
            saveOfflineCards(deckId, cardsOffline);
            
            const compreendidos = cardsOffline.filter(c => c.status === 'memorizado').length;
            const a_revisar = cardsOffline.filter(c => c.status === 'errou' || c.status === 'dificil').length;
            
            offlineDecks[deckIndex].cards_compreendidos = compreendidos;
            offlineDecks[deckIndex].cards_a_revisar = a_revisar;
            saveOfflineDecks(offlineDecks);
          }
        }
      }
    }

    // FIRE AND FORGET: Salva no banco em background (somente se não for deck offline gerado, ou salva assim mesmo para Analytics global)
    supabase.auth.getUser().then(({ data: auth }) => {
      if (auth.user) {
        supabase.from('flashcards_progresso').upsert(
          {
            user_id: auth.user.id,
            card_id: atual.id,
            area: atual.area,
            tema: atual.tema,
            status,
            ultima_resposta_em: new Date().toISOString(),
          },
          { onConflict: 'user_id,card_id' },
        ).then(({ error }) => {
          if (error) toast.error('Não foi possível salvar o progresso');
        });
      }
    });

    gateFlashcards.run();
    
    // Libera para o próximo clique após a animação de saída (250ms)
    setTimeout(() => {
      salvando.current = false;
    }, 250);
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

  // Dados de performance por título para o gráfico
  const sessionPerTitle = useMemo(() => {
    if (!cards.length) return [];
    const map: Record<string, { total: number; done: number }> = {};
    cards.forEach(c => {
      const key = c.tema || c.area || 'Geral';
      if (!map[key]) map[key] = { total: 0, done: 0 };
      map[key].total++;
    });
    // Marca os cards já feitos
    cards.slice(0, idx).forEach(c => {
      const key = c.tema || c.area || 'Geral';
      if (map[key]) map[key].done++;
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name, ...v, pct: v.total ? Math.round((v.done / v.total) * 100) : 0 }))
      .sort((a, b) => b.total - a.total);
  }, [cards, idx]);

  const toggleOrdem = () => {
    const next = new URLSearchParams(params);
    const newOrdem = ordemParam === 'sequencial' ? 'embaralhado' : 'sequencial';
    next.set('ordem', newOrdem);
    setParams(next, { replace: true });
    haptic.selection();
  };

  return (
    <div className={`min-h-dvh overflow-x-hidden bg-background ${escolhendo ? 'pb-[calc(8rem+env(safe-area-inset-bottom,0px))]' : 'pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))]'}`}>
      {gateFlashcards.gateNode}
      <div className="mx-auto w-full max-w-3xl px-3.5 sm:px-6">
        <PageHeader
          title={escolhendo ? 'Categorias de Flashcards' : ''}
          onBack={() => navigate('/flashcards')}
          rightAction={
            !escolhendo && (
              <div className="flex gap-2">
                {deckId && (
                  <>
                    <button 
                      onClick={() => {
                        haptic.selection();
                        setModoAudio(!modoAudio);
                      }} 
                      title="Estudo por Áudio"
                      className={`flex h-10 w-10 items-center justify-center rounded-full border border-border/80 shadow-sm transition-colors ${modoAudio ? 'bg-[#36AF85] text-white border-[#36AF85]' : 'bg-card text-foreground hover:bg-muted'}`}
                    >
                      {modoAudio ? <Volume2 className="h-4.5 w-4.5" /> : <VolumeX className="h-4.5 w-4.5 opacity-50" />}
                    </button>
                    <button 
                      onClick={() => {
                        haptic.selection();
                        setModoReverso(!modoReverso);
                      }} 
                      title="Modo Jeopardy (Reverso)"
                      className={`flex h-10 w-10 items-center justify-center rounded-full border border-border/80 shadow-sm transition-colors ${modoReverso ? 'bg-[#36AF85] text-white border-[#36AF85]' : 'bg-card text-foreground hover:bg-muted'}`}
                    >
                      <ShuffleIcon className="h-4.5 w-4.5" />
                    </button>
                  </>
                )}
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
              </div>
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
            {emContagem && !escolhendo && (
              <ContagemRegressiva onFim={() => setEmContagem(false)} subtitulo="Preparando seus flashcards…" solido />
            )}

            {/* Barra de progresso */}
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 bg-secondary rounded-full overflow-hidden relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${cards.length ? ((idx + 1) / cards.length) * 100 : 0}%` }}
                  transition={{ type: 'spring', bounce: 0.5, duration: 0.8 }}
                  className="absolute inset-y-0 left-0 bg-emerald-500"
                />
              </div>
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
              <div className="rounded-3xl border border-border bg-card p-10 text-center relative overflow-hidden">
                <ConfettiShower />
                <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
                <h3 className="text-xl font-black text-foreground">Sessão Concluída!</h3>
                <p className="mt-1 text-sm text-muted-foreground">{feitos} flashcards estudados com sucesso.</p>
                <Button className="mt-5 rounded-2xl px-6 font-bold relative z-10" onClick={() => { setFeitos(0); refetchCards(); }}>Nova sessão</Button>
              </div>
            )}

            {atual && (() => {
              const corParam = params.get('cor');
              const accent = corParam || "#10b981";
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
                    <motion.div
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                      style={{ rotateX, rotateY }}
                      className="w-full h-full"
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
                        ref={cardContainerRef}
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

                          <div className="relative z-10 mb-4 flex items-start justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 min-w-0 flex-1">
                              {formatTemaBreadcrumb(atual.tema ?? atual.area ?? 'Flashcard').map((part, i, arr) => (
                                <span key={i} className="flex items-center gap-1">
                                  <span className="text-[11px] md:text-xs font-medium leading-snug" style={{ color: `color-mix(in oklab, ${accent} 60%, white)`, textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>
                                    {part}
                                  </span>
                                  {i < arr.length - 1 && (
                                    <ChevronRight className="h-2.5 w-2.5 shrink-0 opacity-50" style={{ color: `color-mix(in oklab, ${accent} 50%, white)` }} />
                                  )}
                                </span>
                              ))}
                            </div>
                            <Scale className="h-4 w-4 shrink-0 mt-0.5" style={{ color: `${accent}`, opacity: 0.6 }} aria-hidden />
                          </div>
                          
                          <div className="relative z-10 flex-1 flex items-center justify-center text-center">
                            <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3 }} className={`leading-snug font-medium ${modoReverso && atual.resposta.length > 80 ? 'text-lg md:text-xl' : 'text-xl md:text-2xl'}`} style={{ fontFamily: "'Merriweather','Georgia',serif", textShadow: "0 2px 16px rgba(0,0,0,0.6)" }}>
                              {modoReverso ? atual.resposta : atual.pergunta}
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
                              {modoReverso ? 'Pergunta Original' : 'Resposta Explicada'}
                            </p>
                            <div className="flex-1 flex flex-col items-center justify-center space-y-4 pb-4">
                              <p className={`whitespace-pre-wrap font-medium leading-relaxed text-foreground text-center max-w-prose ${
                                (modoReverso ? atual.pergunta : atual.resposta).length < 40 ? 'text-2xl sm:text-3xl' :
                                (modoReverso ? atual.pergunta : atual.resposta).length < 80 ? 'text-xl sm:text-2xl' :
                                (modoReverso ? atual.pergunta : atual.resposta).length < 150 ? 'text-lg sm:text-xl' :
                                'text-base sm:text-lg'
                              }`}>
                                {modoReverso ? atual.pergunta : atual.resposta}
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
                  </motion.div>
                </AnimatePresence>
                </div>

                {/* Botões de Ação — só aparecem após virar o card */}
                <AnimatePresence>
                  {virado && (
                    <motion.div
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 24 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="pt-2 pb-[calc(6.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] grid grid-cols-2 gap-3"
                    >
                      <Button
                        variant="outline"
                        className="h-14 sm:h-16 rounded-2xl text-base font-bold gap-2 border-border/80 hover:border-emerald-500/50 hover:bg-emerald-500/10 active:scale-95 transition-all shadow-sm"
                        onClick={() => responder('revisar')}
                      >
                        <RotateCcw className="h-5 w-5 text-emerald-500" />
                        <span>Revisar</span>
                      </Button>
                      <Button
                        className="h-14 sm:h-16 rounded-2xl text-base font-black gap-2 active:scale-95 transition-all shadow-md hover:opacity-90 border-0"
                        style={{ backgroundColor: accent, color: '#ffffff', boxShadow: `0 4px 14px 0 ${accent}40` }}
                        onClick={() => responder('compreendido')}
                      >
                        <CheckCircle2 className="h-5 w-5 text-white" />
                        <span>Compreendi</span>
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
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

function Tags({ card }: { card: FlashcardCard }) {
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
