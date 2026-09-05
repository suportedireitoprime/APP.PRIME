import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, Lightbulb, RefreshCw, ChevronRight, BookOpenText, Flame, Star, Trophy, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { useGameSounds } from '@/hooks/useGameSounds';
import { useForcaProgresso } from '@/hooks/useForcaProgresso';
import { ForcaRanking } from '@/components/gamificacao/ForcaRanking';
import { supabase } from '@/integrations/supabase/client';
import { useForcaEstrelas } from '@/hooks/useForcaEstrelas';

const MAX_MISTAKES = 6;
const MAX_HINTS = 3;

interface ForcaWord {
  word: string;
  hint: string;
}

interface FaseTrilha {
  id: string;
  title: string;
  articles: any[];
}

const ForcaPage = () => {
  const navigate = useNavigate();
  const { playClick, playCorrect, playWrong, playWin, playLose, playHint, playTriumph } = useGameSounds();
  const { progresso, saveProgress } = useForcaProgresso();
  
  const [laws, setLaws] = useState<any[]>([]);
  const [selectedLaw, setSelectedLaw] = useState<any | null>(null);
  const { estrelas, saveStars } = useForcaEstrelas(selectedLaw?.id || null);
  
  const [phasesTrilha, setPhasesTrilha] = useState<FaseTrilha[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPhases, setCurrentPhases] = useState<ForcaWord[]>([]);
  
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [currentWord, setCurrentWord] = useState<ForcaWord | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  
  const currentComboRef = useRef(0);
  const highestComboRef = useRef(0);
  const phaseXpRef = useRef(0);
  const totalMistakesRef = useRef(0);
  const [currentCombo, setCurrentCombo] = useState(0); 
  
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<'playing' | 'won' | 'lost' | 'article_completed'>('playing');
  const [isRankingOpen, setIsRankingOpen] = useState(false);
  const [completedStars, setCompletedStars] = useState(0);

  // Fetch Laws on Mount
  useEffect(() => {
    const fetchLaws = async () => {
      const [{ data: cf }, { data: codigos }] = await Promise.all([
        supabase.from('vade_mecum_leis').select('id, nome, nome_curto, slug').eq('slug', 'cf'),
        supabase.from('vade_mecum_leis').select('id, nome, nome_curto, slug').eq('categoria', 'codigo').order('nome'),
      ]);
      
      const combined = [...(cf || []), ...(codigos || [])];
      // deduplicate if CF is already in codigos
      const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
      setLaws(unique);
    };
    fetchLaws();
  }, []);

  const fetchArticles = async (lawId: string) => {
    const { data } = await supabase.from('vade_mecum_artigos').select('id, numero, epigrafe').eq('lei_id', lawId).order('ordem');
    const arts = data || [];
    setArticles(arts);

    // Group into phases
    const groupedPhases: FaseTrilha[] = [];
    let currentPhase: FaseTrilha = { id: 'default', title: 'Introdução', articles: [] };

    for (const art of arts) {
      const num = art.numero.toUpperCase();
      const isHeader = num.startsWith('TÍTULO') || num.startsWith('LIVRO') || num.startsWith('PARTE') || num.startsWith('CAPÍTULO') || num.startsWith('SEÇÃO') || num.startsWith('SUBSEÇÃO');
      
      if (isHeader) {
        if (currentPhase.articles.length > 0) groupedPhases.push(currentPhase);
        currentPhase = { id: art.id, title: `${art.numero}${art.epigrafe ? ` - ${art.epigrafe}` : ''}`, articles: [] };
      } else {
        currentPhase.articles.push(art);
      }
    }
    if (currentPhase.articles.length > 0) groupedPhases.push(currentPhase);
    setPhasesTrilha(groupedPhases);
  };

  const handleLawSelect = (law: any) => {
    setSelectedLaw(law);
    setArticles([]);
    fetchArticles(law.id);
  };

  const normalizeString = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const startPhase = useCallback((phases: ForcaWord[], phaseIndex: number) => {
    if (phaseIndex >= phases.length) {
      setStatus('article_completed');
      playTriumph();
      
      // Calculate and save stars
      let earnedStars = 1;
      if (totalMistakesRef.current === 0) earnedStars = 3;
      else if (totalMistakesRef.current <= 3) earnedStars = 2;
      
      setCompletedStars(earnedStars);
      if (selectedArticle) {
        saveStars(selectedArticle.id, earnedStars);
      }
      return;
    }
    if (phaseIndex === 0) {
       totalMistakesRef.current = 0;
    }
    setCurrentWord(phases[phaseIndex]);
    setCurrentPhaseIndex(phaseIndex);
    setGuessedLetters(new Set());
    setHintsUsed(0);
    currentComboRef.current = 0;
    highestComboRef.current = 0;
    phaseXpRef.current = 0;
    setCurrentCombo(0);
    setStatus('playing');
  }, [playTriumph]);

  const handleArticleSelect = async (article: any) => {
    playClick();
    setSelectedArticle(article);
    setIsGenerating(true);
    setCurrentPhases([]);
    
    try {
      const { data, error } = await supabase.functions.invoke('forca-gerar-artigo', {
        body: { artigo_id: article.id }
      });
      if (data?.phases) {
        setCurrentPhases(data.phases);
        startPhase(data.phases, 0);
      } else {
        alert("Erro ao gerar: " + (error?.message || JSON.stringify(error) || "Desconhecido"));
        setSelectedArticle(null);
      }
    } catch (e: any) {
      console.error(e);
      alert("Erro ao conectar com a IA: " + e.message);
      setSelectedArticle(null);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    document.title = "Jogo da Forca | Direito Prime";
  }, []);

  const normalizedTarget = currentWord ? normalizeString(currentWord.word.toUpperCase()) : '';
  const mistakes = Array.from(guessedLetters).filter(letter => !normalizedTarget.includes(letter)).length;

  useEffect(() => {
    if (status !== 'playing' || !currentWord) return;
    
    const isWon = normalizedTarget.replace(/\s/g, '').split('').every(char => guessedLetters.has(char));
    if (isWon) {
      setStatus('won');
      playWin();
      saveProgress(phaseXpRef.current + 50, highestComboRef.current, true);
    } else if (mistakes >= MAX_MISTAKES) {
      setStatus('lost');
      playLose();
      saveProgress(phaseXpRef.current, highestComboRef.current, false);
    }
  }, [guessedLetters, mistakes, normalizedTarget, status, currentWord, playWin, playLose, saveProgress]);

  const guessLetter = useCallback((letter: string) => {
    if (status !== 'playing' || guessedLetters.has(letter)) return;
    playClick();
    
    const isCorrect = normalizedTarget.includes(letter);
    
    if (isCorrect) {
      currentComboRef.current += 1;
      highestComboRef.current = Math.max(highestComboRef.current, currentComboRef.current);
      const mult = currentComboRef.current >= 5 ? 2.0 : currentComboRef.current >= 3 ? 1.5 : 1.0;
      phaseXpRef.current += Math.round(10 * mult);
      setCurrentCombo(currentComboRef.current);
    } else {
      currentComboRef.current = 0;
      setCurrentCombo(0);
      totalMistakesRef.current += 1;
    }
    
    setGuessedLetters(prev => {
      const next = new Set(prev).add(letter);
      setTimeout(() => {
        if (isCorrect) playCorrect();
        else playWrong();
      }, 50);
      return next;
    });
  }, [status, guessedLetters, normalizedTarget, playClick, playCorrect, playWrong]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== 'playing') return;
      const key = e.key.toUpperCase();
      if (/^[A-Z]$/.test(key)) {
        guessLetter(key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, guessLetter]);

  const handleBack = () => {
    if (selectedArticle) {
      setSelectedArticle(null);
      setCurrentWord(null);
    } else if (selectedLaw) {
      setSelectedLaw(null);
    } else {
      navigate('/ferramentas');
    }
  };

  const useHintAction = () => {
    if (hintsUsed >= MAX_HINTS || status !== 'playing' || !normalizedTarget) return;
    
    const unguessedChars = normalizedTarget
      .replace(/\s/g, '')
      .split('')
      .filter((char, i, arr) => !guessedLetters.has(char) && arr.indexOf(char) === i);
    
    if (unguessedChars.length === 0) return;
    
    const randomChar = unguessedChars[Math.floor(Math.random() * unguessedChars.length)];
    playHint();
    setHintsUsed(prev => prev + 1);
    guessLetter(randomChar);
  };

  const renderHangman = () => {
    const strokeColor = mistakes >= MAX_MISTAKES ? '#ef4444' : '#e2e8f0'; 
    const gallowsColor = '#334155';
    const ropeColor = '#8b5cf6';
    
    return (
      <div className="flex justify-center mb-6 relative">
        {mistakes >= MAX_MISTAKES && (
          <div className="absolute inset-0 bg-red-900/20 blur-xl rounded-full" />
        )}
        <svg width="200" height="220" viewBox="0 0 200 220" className="scale-[0.85] md:scale-100 origin-center z-10 drop-shadow-md">
          {/* Base */}
          <line x1="20" y1="200" x2="180" y2="200" stroke={gallowsColor} strokeWidth="6" strokeLinecap="round" />
          {/* Main pillar */}
          <line x1="60" y1="200" x2="60" y2="20" stroke={gallowsColor} strokeWidth="6" strokeLinecap="round" />
          {/* Top bar */}
          <line x1="57" y1="20" x2="140" y2="20" stroke={gallowsColor} strokeWidth="6" strokeLinecap="round" />
          {/* Rope */}
          <line x1="140" y1="20" x2="140" y2="42" stroke={ropeColor} strokeWidth="3" strokeDasharray="4 2" />

          {/* Head - Grim Skull */}
          {mistakes > 0 && (
            <motion.g
              initial={{ opacity: 0, scale: 0.5, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              stroke={strokeColor} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="140" cy="56" r="14" />
              <path d="M 133 66 L 133 72 M 140 66 L 140 72 M 147 66 L 147 72 M 129 66 L 151 66" />
              <circle cx="134" cy="54" r="2" fill={strokeColor} />
              <circle cx="146" cy="54" r="2" fill={strokeColor} />
              <path d="M 140 59 L 140 61" strokeWidth="1.5" />
            </motion.g>
          )}

          {/* Spine & Ribcage */}
          {mistakes > 1 && (
            <motion.g
              stroke={strokeColor} strokeWidth="3" strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            >
              <line x1="140" y1="74" x2="140" y2="120" />
              <line x1="130" y1="84" x2="150" y2="84" strokeWidth="2.5" />
              <line x1="132" y1="94" x2="148" y2="94" strokeWidth="2.5" />
              <line x1="134" y1="104" x2="146" y2="104" strokeWidth="2.5" />
            </motion.g>
          )}

          {/* Left Arm */}
          {mistakes > 2 && (
            <motion.path
              d="M 140 84 Q 120 95 115 115"
              stroke={strokeColor} strokeWidth="3" strokeLinecap="round" fill="none"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            />
          )}

          {/* Right Arm */}
          {mistakes > 3 && (
            <motion.path
              d="M 140 84 Q 160 95 165 115"
              stroke={strokeColor} strokeWidth="3" strokeLinecap="round" fill="none"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            />
          )}

          {/* Left Leg */}
          {mistakes > 4 && (
            <motion.path
              d="M 140 120 Q 130 140 120 165"
              stroke={strokeColor} strokeWidth="3" strokeLinecap="round" fill="none"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            />
          )}

          {/* Right Leg */}
          {mistakes > 5 && (
            <motion.path
              d="M 140 120 Q 150 140 160 165"
              stroke={strokeColor} strokeWidth="3" strokeLinecap="round" fill="none"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            />
          )}
        </svg>
      </div>
    );
  };

  const renderWord = () => {
    if (!currentWord) return null;
    const words = currentWord.word.toUpperCase().split(' ');

    return (
      <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-8">
        {words.map((w, wIdx) => (
          <div key={wIdx} className="flex gap-1.5 md:gap-2">
            {w.split('').map((char, i) => {
              const isRevealed = guessedLetters.has(char) || status !== 'playing';
              const isMissed = !guessedLetters.has(char) && status !== 'playing';
              return (
                <div 
                  key={i}
                  className={`w-8 h-10 md:w-11 md:h-14 flex items-center justify-center border-b-[3px] text-2xl md:text-3xl font-black font-display transition-colors
                    ${isRevealed ? (isMissed ? 'border-red-500/50 text-red-400' : 'border-primary text-foreground') : 'border-border text-transparent'}`}
                >
                  <AnimatePresence>
                    {isRevealed && (
                      <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {char}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const renderKeyboard = () => {
    const rows = [
      ['Q','W','E','R','T','Y','U','I','O','P'],
      ['A','S','D','F','G','H','J','K','L'],
      ['Z','X','C','V','B','N','M']
    ];

    return (
      <div className="flex flex-col gap-2 md:gap-3 max-w-[500px] mx-auto pb-[calc(1.25rem+var(--sai-bottom))]">
        {rows.map((row, i) => (
          <div key={i} className="flex justify-center gap-1.5 md:gap-2">
            {row.map(char => {
              const isGuessed = guessedLetters.has(char);
              const isCorrect = isGuessed && normalizedTarget.includes(char);
              
              let btnClass = "flex-1 max-w-[44px] h-[52px] md:h-[58px] rounded-xl font-display font-bold text-lg md:text-xl transition-all shadow-sm active:scale-95";
              if (!isGuessed) {
                btnClass += " bg-card text-foreground border border-border/50 hover:bg-muted";
              } else if (isCorrect) {
                btnClass += " bg-emerald-500 text-emerald-950 border-emerald-600 opacity-90";
              } else {
                btnClass += " bg-zinc-800 text-zinc-500 border-zinc-700 opacity-50";
              }

              return (
                <button
                  key={char}
                  onClick={() => guessLetter(char)}
                  disabled={isGuessed || status !== 'playing'}
                  className={btnClass}
                >
                  {char}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <DesktopPageLayout>
      <PageHeader 
        title="JOGO DA FORCA" 
        subtitle="Trilha de Aprendizado"
        onBack={handleBack}
        actions={
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsRankingOpen(true)}
              className="flex items-center gap-2 bg-[#F59E0B]/20 text-[#F59E0B] px-3 py-1.5 rounded-xl border border-[#F59E0B]/30 hover:bg-[#F59E0B]/30 transition-colors"
            >
              <Trophy className="w-4 h-4" />
              <span className="font-display font-bold text-sm hidden md:inline">Ranking Elite</span>
            </button>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5 text-primary">
                <Star className="w-4 h-4 fill-primary" />
                <span className="font-display font-black leading-none">{progresso?.xp_total ?? 0} XP</span>
              </div>
              <div className="flex items-center gap-1.5 text-orange-500">
                <Flame className="w-3.5 h-3.5 fill-orange-500" />
                <span className="text-[11px] font-bold leading-none uppercase">Combo Max: {progresso?.highest_combo ?? 0}</span>
              </div>
            </div>
          </div>
        }
      />
      
      <div className="max-w-[700px] mx-auto px-4 md:px-0 pb-20 pt-4">
        <AnimatePresence mode="wait">
          {!selectedLaw ? (
            <motion.div
              key="laws"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-display font-black text-foreground uppercase tracking-wide">CÓDIGOS E LEIS</h2>
              <div className="grid gap-3">
                {laws.length === 0 && (
                   <div className="py-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
                )}
                {laws.map(law => (
                  <button
                    key={law.id}
                    onClick={() => handleLawSelect(law)}
                    className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border/40 hover:border-primary/50 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <BookOpenText className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-display font-bold text-lg leading-tight">{law.nome}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary shrink-0" />
                  </button>
                ))}
              </div>
            </motion.div>
          ) : !selectedArticle ? (
            <motion.div
              key="articles"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-display font-black text-foreground uppercase tracking-wide">{selectedLaw.nome}</h2>
              <p className="text-sm text-muted-foreground mb-4">Selecione o nível para jogar. Complete sem errar para ganhar 3 estrelas!</p>
              
              <div className="pr-2 pb-6">
                {phasesTrilha.length === 0 && (
                   <div className="py-10 flex flex-col items-center justify-center gap-3">
                     <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                     <span className="text-sm text-muted-foreground">Carregando trilha...</span>
                   </div>
                )}
                <div className="space-y-12">
                  {phasesTrilha.map(phase => (
                    <div key={phase.id} className="relative">
                      <div className="relative bg-[#0D0D0D] py-4 border-b border-primary/20 mb-8 rounded-b-3xl mx-2">
                        <h3 className="font-display font-black text-lg text-primary text-center px-4 leading-tight">{phase.title}</h3>
                      </div>
                      <div className="flex flex-col items-center gap-8 py-2">
                        {phase.articles.map((article, i) => {
                           const earnedStars = estrelas[article.id] || 0;
                           // Zig-zag pattern
                           const offset = i % 4 === 0 ? '-translate-x-12' : i % 4 === 1 ? 'translate-x-0' : i % 4 === 2 ? 'translate-x-12' : 'translate-x-0';
                           const isCompleted = earnedStars > 0;
                           
                           return (
                             <div key={article.id} className={`relative flex justify-center ${offset} transition-all duration-300`}>
                               <button
                                 onClick={() => handleArticleSelect(article)}
                                 className={`relative flex flex-col items-center justify-center w-[72px] h-[72px] rounded-full border-4 shadow-xl hover:scale-105 active:scale-95 transition-transform z-10
                                   ${isCompleted ? 'bg-primary border-primary/20 shadow-primary/20' : 'bg-card border-border hover:border-primary/50'}`}
                               >
                                  <span className={`font-display font-black text-xl leading-none ${isCompleted ? 'text-primary-foreground' : 'text-foreground'}`}>
                                    {article.numero.replace('º', '')}
                                  </span>
                                  {isCompleted && <span className="text-[10px] font-bold text-primary-foreground/70 uppercase mt-0.5">Artigo</span>}
                               </button>

                               {/* Star Rating Badge */}
                               <div className="absolute -top-3.5 flex items-center justify-center gap-0.5 bg-background/95 backdrop-blur-sm px-2.5 py-1 rounded-full border border-border shadow-md z-20">
                                 {[1,2,3].map(s => (
                                   <Star 
                                     key={s} 
                                     className={`w-3.5 h-3.5 ${s <= earnedStars ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]' : 'text-muted-foreground/30 fill-transparent'}`} 
                                   />
                                 ))}
                               </div>
                             </div>
                           )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : isGenerating ? (
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 gap-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <div>
                <h3 className="font-display font-black text-2xl mb-2 text-foreground">Gerando Palavras...</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  A Inteligência Artificial está analisando o <strong>{selectedArticle.numero}</strong> para criar 5 palavras essenciais deste artigo para você jogar.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="game"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col min-h-[70vh]"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col gap-1">
                  <h3 className="font-display font-bold text-muted-foreground text-sm uppercase tracking-wider">{selectedLaw.nome}</h3>
                  <h2 className="font-display font-black text-2xl text-foreground leading-none">
                    {selectedArticle.numero} {selectedArticle.epigrafe ? `- ${selectedArticle.epigrafe}` : ''}
                  </h2>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 bg-card border border-border/50 px-3 py-1.5 rounded-full">
                    <BookOpenText className="w-4 h-4 text-primary" />
                    <span className="font-bold text-sm">{currentPhaseIndex + 1}/{currentPhases.length}</span>
                  </div>
                </div>
              </div>

              {renderHangman()}
              {renderWord()}

              <div className="flex justify-between items-center mb-6 md:mb-8">
                <div className="flex items-center gap-2">
                  {Array.from({ length: MAX_HINTS }).map((_, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      i < (MAX_HINTS - hintsUsed) ? 'bg-yellow-500/20 text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'bg-white/5 text-white/20'
                    }`}>
                      <Lightbulb className="w-4 h-4" />
                    </div>
                  ))}
                </div>
                <button
                  onClick={useHintAction}
                  disabled={hintsUsed >= MAX_HINTS || status !== 'playing'}
                  className="flex items-center gap-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-4 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-all active:scale-95"
                >
                  <Lightbulb className="w-4 h-4" />
                  Usar Dica
                </button>
              </div>

              {status === 'playing' ? (
                <>
                  {hintsUsed > 0 && currentWord && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-primary/10 border border-primary/20 text-primary-foreground p-3 rounded-xl mb-6 text-center text-sm font-medium mx-auto max-w-sm"
                    >
                      💡 {currentWord.hint}
                    </motion.div>
                  )}

                  {renderKeyboard()}
                </>
              ) : status === 'article_completed' ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center p-8 bg-card border border-primary/30 rounded-3xl text-center shadow-lg"
                >
                  <div className="flex gap-2 mb-6">
                    {[1, 2, 3].map(s => (
                      <motion.div
                        key={s}
                        initial={{ opacity: 0, y: 20, scale: 0.5 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: s * 0.15, type: "spring" }}
                      >
                        <Star className={`w-16 h-16 ${s <= completedStars ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]' : 'text-muted-foreground/30 fill-transparent'}`} />
                      </motion.div>
                    ))}
                  </div>
                  
                  <h2 className="text-3xl font-black text-foreground mb-2">ARTIGO CONCLUÍDO!</h2>
                  <p className="text-muted-foreground mb-8">
                    {completedStars === 3 ? "Perfeito! Você dominou o artigo." : completedStars === 2 ? "Muito bem! Quase perfeito." : "Bom trabalho! Continue praticando."}
                  </p>
                  
                  <button
                    onClick={handleBack}
                    className="bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-bold font-display tracking-wide shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:scale-105 transition-all"
                  >
                    ESCOLHER OUTRO ARTIGO
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center p-6 bg-card border border-border/50 rounded-3xl text-center mx-auto max-w-sm mt-4 shadow-lg"
                >
                  <div className="mb-4">
                    {status === 'won' ? (
                      <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Star className="w-8 h-8 fill-current" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Skull className="w-8 h-8" />
                      </div>
                    )}
                    <h2 className={`text-3xl font-black ${status === 'won' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {status === 'won' ? 'CORRETO!' : 'FALHOU!'}
                    </h2>
                    
                    <div className="flex justify-center mt-3 mb-2 gap-4">
                       <div className="bg-background rounded-xl px-4 py-2 border border-border/50">
                         <span className="block text-[11px] font-bold text-muted-foreground uppercase tracking-widest">XP Ganho</span>
                         <span className="text-xl font-black text-primary">+{status === 'won' ? phaseXpRef.current + 50 : phaseXpRef.current}</span>
                       </div>
                       <div className="bg-background rounded-xl px-4 py-2 border border-border/50">
                         <span className="block text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Combo Max</span>
                         <span className="text-xl font-black text-orange-500">{highestComboRef.current}x</span>
                       </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-foreground mb-1 font-bold">A palavra era:</p>
                  <p className="text-xl font-display font-black text-primary mb-6 tracking-widest">{currentWord?.word}</p>

                  <button
                    onClick={() => {
                      if (status === 'won') {
                        startPhase(currentPhases, currentPhaseIndex + 1);
                      } else {
                        startPhase(currentPhases, currentPhaseIndex);
                      }
                    }}
                    className={`flex items-center justify-center gap-2 w-full px-6 py-4 rounded-2xl font-bold font-display tracking-wide transition-all shadow-md active:scale-95
                      ${status === 'won' ? 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400' : 'bg-red-500 text-red-950 hover:bg-red-400'}`}
                  >
                    {status === 'won' ? (
                      <>PRÓXIMA FASE <ChevronRight className="w-5 h-5" /></>
                    ) : (
                      <><RefreshCw className="w-5 h-5" /> TENTAR NOVAMENTE</>
                    )}
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <ForcaRanking isOpen={isRankingOpen} onClose={() => setIsRankingOpen(false)} />
    </DesktopPageLayout>
  );
};

export default ForcaPage;
