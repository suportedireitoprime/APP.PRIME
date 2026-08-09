import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, Lightbulb, RefreshCw, ChevronRight, BookOpenText, Flame, Star, Trophy, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { useGameSounds } from '@/hooks/useGameSounds';
import { useForcaProgresso } from '@/hooks/useForcaProgresso';
import { ForcaRanking } from '@/components/gamificacao/ForcaRanking';
import { supabase } from '@/integrations/supabase/client';

const MAX_MISTAKES = 6;
const MAX_HINTS = 3;

interface ForcaWord {
  word: string;
  hint: string;
}

const ForcaPage = () => {
  const navigate = useNavigate();
  const { playClick, playCorrect, playWrong, playWin, playLose, playHint, playTriumph } = useGameSounds();
  const { progresso, saveProgress } = useForcaProgresso();
  
  const [laws, setLaws] = useState<any[]>([]);
  const [selectedLaw, setSelectedLaw] = useState<any | null>(null);
  
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
  const [currentCombo, setCurrentCombo] = useState(0); 
  
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<'playing' | 'won' | 'lost' | 'article_completed'>('playing');
  const [isRankingOpen, setIsRankingOpen] = useState(false);

  // Fetch Laws on Mount
  useEffect(() => {
    const fetchLaws = async () => {
      const { data: cf } = await supabase.from('vade_mecum_leis').select('id, nome, nome_curto, slug').eq('slug', 'cf');
      const { data: codigos } = await supabase.from('vade_mecum_leis').select('id, nome, nome_curto, slug').eq('categoria', 'codigo').order('nome');
      
      const combined = [...(cf || []), ...(codigos || [])];
      // deduplicate if CF is already in codigos
      const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
      setLaws(unique);
    };
    fetchLaws();
  }, []);

  const fetchArticles = async (lawId: string) => {
    const { data } = await supabase.from('vade_mecum_artigos').select('id, nome, hierarquia_completa').eq('lei_id', lawId).order('ordem');
    setArticles(data || []);
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
      return;
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
        alert("Erro ao gerar as palavras para este artigo.");
        setSelectedArticle(null);
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao conectar com a IA.");
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
    const strokeColor = mistakes >= MAX_MISTAKES ? '#FF4444' : '#FF6B6B';
    const gallowsColor = '#555';
    
    return (
      <div className="flex justify-center mb-6">
        <svg width="200" height="220" viewBox="0 0 200 220" className="scale-[0.85] md:scale-100 origin-center">
          {/* Base */}
          <line x1="20" y1="200" x2="180" y2="200" stroke={gallowsColor} strokeWidth="6" strokeLinecap="round" />
          {/* Main pillar */}
          <line x1="60" y1="200" x2="60" y2="20" stroke={gallowsColor} strokeWidth="6" strokeLinecap="round" />
          {/* Top bar */}
          <line x1="57" y1="20" x2="140" y2="20" stroke={gallowsColor} strokeWidth="6" strokeLinecap="round" />
          {/* Rope */}
          <line x1="140" y1="20" x2="140" y2="40" stroke={gallowsColor} strokeWidth="4" strokeLinecap="round" />

          {/* Head */}
          {mistakes > 0 && (
            <motion.circle
              cx="140" cy="58" r="18" fill="none"
              stroke={strokeColor} strokeWidth="3"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            />
          )}

          {/* Body */}
          {mistakes > 1 && (
            <motion.line
              x1="140" y1="78" x2="140" y2="140"
              stroke={strokeColor} strokeWidth="3" strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            />
          )}

          {/* Left Arm */}
          {mistakes > 2 && (
            <motion.line
              x1="140" y1="95" x2="115" y2="120"
              stroke={strokeColor} strokeWidth="3" strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            />
          )}

          {/* Right Arm */}
          {mistakes > 3 && (
            <motion.line
              x1="140" y1="95" x2="165" y2="120"
              stroke={strokeColor} strokeWidth="3" strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            />
          )}

          {/* Left Leg */}
          {mistakes > 4 && (
            <motion.line
              x1="140" y1="140" x2="115" y2="175"
              stroke={strokeColor} strokeWidth="3" strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            />
          )}

          {/* Right Leg */}
          {mistakes > 5 && (
            <motion.line
              x1="140" y1="140" x2="165" y2="175"
              stroke={strokeColor} strokeWidth="3" strokeLinecap="round"
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
      <div className="flex flex-col gap-2 md:gap-3 max-w-[500px] mx-auto pb-[calc(1.25rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]">
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
              <p className="text-sm text-muted-foreground mb-2">Selecione o artigo para jogar. Palavras geradas por Inteligência Artificial sob demanda.</p>
              <div className="grid gap-3 h-[60vh] overflow-y-auto pr-2">
                {articles.length === 0 && (
                   <div className="py-10 flex flex-col items-center justify-center gap-3">
                     <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                     <span className="text-sm text-muted-foreground">Carregando artigos...</span>
                   </div>
                )}
                {articles.map(article => (
                  <button
                    key={article.id}
                    onClick={() => handleArticleSelect(article)}
                    className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border/40 hover:border-primary/50 transition-all text-left group"
                  >
                    <div>
                      <h3 className="font-display font-bold text-[15px]">{article.nome}</h3>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                  </button>
                ))}
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
                  A Inteligência Artificial está analisando o <strong>{selectedArticle.nome}</strong> para criar 5 palavras essenciais deste artigo para você jogar.
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
                  <h2 className="font-display font-black text-2xl text-foreground leading-none">{selectedArticle.nome}</h2>
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

              {status === 'playing' ? (
                <>
                  <div className="mb-6 flex justify-center">
                    <button
                      onClick={useHintAction}
                      disabled={hintsUsed >= MAX_HINTS}
                      className="flex items-center gap-2 bg-card border border-border/50 hover:border-primary/50 disabled:opacity-50 disabled:pointer-events-none px-5 py-2.5 rounded-full transition-all text-sm font-bold shadow-sm"
                    >
                      <Lightbulb className={`w-4 h-4 ${hintsUsed < MAX_HINTS ? 'text-yellow-400' : 'text-muted-foreground'}`} />
                      Dica ({MAX_HINTS - hintsUsed} restantes)
                    </button>
                  </div>
                  
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
                  <Trophy className="w-16 h-16 text-yellow-500 mb-4" />
                  <h2 className="text-3xl font-black text-foreground mb-2">ARTIGO CONCLUÍDO!</h2>
                  <p className="text-muted-foreground mb-8">Você dominou todas as palavras chave deste artigo.</p>
                  
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
