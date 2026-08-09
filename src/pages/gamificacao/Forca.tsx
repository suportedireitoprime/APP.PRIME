import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, Lightbulb, RefreshCw, ChevronRight, BookOpenText, Flame, Star, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { forcaCatalog, ForcaArea, ForcaLaw, ForcaArticle, ForcaWord } from '@/data/forcaCatalog';
import { useGameSounds } from '@/hooks/useGameSounds';
import { useForcaProgresso } from '@/hooks/useForcaProgresso';

const MAX_MISTAKES = 6;
const MAX_HINTS = 3;

const ForcaPage = () => {
  const navigate = useNavigate();
  const { playClick, playCorrect, playWrong, playWin, playLose, playHint, playTriumph } = useGameSounds();
  const { progresso, saveProgress } = useForcaProgresso();
  
  const [selectedArea, setSelectedArea] = useState<ForcaArea | null>(null);
  const [selectedLaw, setSelectedLaw] = useState<ForcaLaw | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<ForcaArticle | null>(null);
  
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [currentWord, setCurrentWord] = useState<ForcaWord | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  
  const currentComboRef = useRef(0);
  const highestComboRef = useRef(0);
  const phaseXpRef = useRef(0);
  const [currentCombo, setCurrentCombo] = useState(0); // for visual
  
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<'playing' | 'won' | 'lost' | 'article_completed'>('playing');

  const normalizeString = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const startPhase = useCallback((article: ForcaArticle, phaseIndex: number) => {
    if (phaseIndex >= article.phases.length) {
      setStatus('article_completed');
      return;
    }
    setCurrentWord(article.phases[phaseIndex]);
    setCurrentPhaseIndex(phaseIndex);
    setGuessedLetters(new Set());
    setHintsUsed(0);
    currentComboRef.current = 0;
    highestComboRef.current = 0;
    phaseXpRef.current = 0;
    setCurrentCombo(0);
    setStatus('playing');
  }, []);

  const handleArticleSelect = (article: ForcaArticle) => {
    setSelectedArticle(article);
    startPhase(article, 0);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guessedLetters, mistakes, normalizedTarget, status, currentWord]);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, guessedLetters, normalizedTarget]);

  // Keyboard support
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
    } else if (selectedArea) {
      setSelectedArea(null);
    } else {
      navigate('/ferramentas');
    }
  };

  /** Reveal one random unguessed letter as a hint */
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
    guessLetter(randomChar); // Use guessLetter so it counts for combos and XP!
  };

  const renderHangman = () => {
    const strokeColor = mistakes >= MAX_MISTAKES ? '#FF4444' : '#FF6B6B';
    const gallowsColor = '#555';
    
    return (
      <div className="flex justify-center mb-6">
        <svg width="200" height="220" viewBox="0 0 200 220" className="scale-[0.85] md:scale-100 origin-center">
          {/* Platform */}
          <line x1="20" y1="210" x2="180" y2="210" stroke={gallowsColor} strokeWidth="4" strokeLinecap="round" />
          {/* Vertical pole */}
          <line x1="60" y1="210" x2="60" y2="20" stroke={gallowsColor} strokeWidth="4" strokeLinecap="round" />
          {/* Top beam */}
          <line x1="58" y1="22" x2="140" y2="22" stroke={gallowsColor} strokeWidth="4" strokeLinecap="round" />
          {/* Support brace */}
          <line x1="60" y1="55" x2="90" y2="22" stroke={gallowsColor} strokeWidth="3" strokeLinecap="round" />
          {/* Rope */}
          <line x1="140" y1="22" x2="140" y2="46" stroke="#8B7355" strokeWidth="3" strokeLinecap="round" />

          {/* Head */}
          {mistakes > 0 && (
            <g>
              <motion.circle
                cx="140" cy="62" r="16"
                fill="none" stroke={strokeColor} strokeWidth="3"
                initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              />
              {/* Face - alive */}
              {mistakes < MAX_MISTAKES ? (
                <>
                  <circle cx="134" cy="58" r="2" fill={strokeColor} />
                  <circle cx="146" cy="58" r="2" fill={strokeColor} />
                  <path d="M134 68 Q140 72 146 68" fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
                </>
              ) : (
                /* Face - dead (X eyes + tongue) */
                <>
                  <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <line x1="131" y1="55" x2="137" y2="61" stroke="#FF4444" strokeWidth="2" strokeLinecap="round" />
                    <line x1="137" y1="55" x2="131" y2="61" stroke="#FF4444" strokeWidth="2" strokeLinecap="round" />
                    <line x1="143" y1="55" x2="149" y2="61" stroke="#FF4444" strokeWidth="2" strokeLinecap="round" />
                    <line x1="149" y1="55" x2="143" y2="61" stroke="#FF4444" strokeWidth="2" strokeLinecap="round" />
                    <path d="M136 69 Q140 76 144 69" fill="#FF4444" stroke="#FF4444" strokeWidth="1" />
                  </motion.g>
                </>
              )}
            </g>
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

  const keyboard = "QWERTYUIOPASDFGHJKLZXCVBNM".split('');

  const renderFunnel = () => {
    if (!selectedArea) {
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-bold px-1 text-foreground mb-4">Escolha a Área</h2>
          {forcaCatalog.map(area => (
            <motion.button
              key={area.id}
              onClick={() => setSelectedArea(area)}
              className="w-full flex items-center justify-between p-5 rounded-2xl bg-card border border-border/50 shadow-sm hover:border-primary/50 transition-all active:scale-[0.98]"
            >
              <span className="font-display font-bold text-[17px] text-foreground">{area.name}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          ))}
        </div>
      );
    }

    if (!selectedLaw) {
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-bold px-1 text-foreground mb-4">Leis de {selectedArea.name}</h2>
          {selectedArea.laws.map(law => (
            <motion.button
              key={law.id}
              onClick={() => setSelectedLaw(law)}
              className="w-full flex items-center justify-between p-5 rounded-2xl bg-card border border-border/50 shadow-sm hover:border-primary/50 transition-all active:scale-[0.98]"
            >
              <span className="font-display font-bold text-[17px] text-foreground">{law.name}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          ))}
        </div>
      );
    }

    if (!selectedArticle) {
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-bold px-1 text-foreground mb-4">Artigos ({selectedLaw.name})</h2>
          {selectedLaw.articles.map(article => (
            <motion.button
              key={article.id}
              onClick={() => handleArticleSelect(article)}
              className="w-full flex flex-col items-start p-5 rounded-2xl bg-card border border-border/50 shadow-sm hover:border-primary/50 transition-all active:scale-[0.98] gap-2"
            >
              <div className="flex w-full items-center justify-between">
                <span className="font-display font-bold text-[17px] text-foreground">{article.title}</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="text-sm text-muted-foreground text-left">{article.description}</span>
            </motion.button>
          ))}
        </div>
      );
    }

    return null;
  };

  const renderGame = () => {
    if (!currentWord || !selectedArticle) return null;

    if (status === 'article_completed') {
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onAnimationStart={() => playTriumph()}
          className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-6"
        >
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-4">
            <Trophy className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-emerald-400 uppercase">
            Artigo Dominado!
          </h2>
          <p className="text-muted-foreground font-medium max-w-sm">
            Você concluiu todas as fases deste artigo com excelência e faturou um caminhão de XP.
          </p>
          <button 
            onClick={() => {
              setSelectedArticle(null);
            }}
            className="mt-8 px-8 py-4 bg-primary text-primary-foreground rounded-full font-bold shadow-lg hover:bg-primary/90 transition-all"
          >
            Escolher outro Artigo
          </button>
        </motion.div>
      );
    }

    return (
      <div className="flex flex-col items-center w-full max-w-2xl mx-auto relative pt-4">
        {/* Gamification Header */}
        <div className="w-full bg-zinc-900/60 border border-zinc-800 rounded-2xl p-3 flex flex-wrap gap-2 items-center justify-between shadow-sm mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-amber-500/20 text-amber-400 rounded-full border border-amber-400/30">
              <Star className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Lvl {progresso?.level || 1}</span>
              <span className="text-sm font-black text-zinc-100">{progresso?.xp_total || 0} XP</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-bold">COMBO</span>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-sm transition-all ${
              currentCombo >= 5 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse' : 
              currentCombo >= 3 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 
              'bg-zinc-800 text-zinc-500'
            }`}>
              <Flame className={`w-4 h-4 ${currentCombo >= 3 ? 'fill-current' : ''}`} />
              x{currentCombo >= 5 ? '2.0' : currentCombo >= 3 ? '1.5' : '1.0'}
            </div>
          </div>
        </div>

        {/* Floating Hint Button */}
        <button
          onClick={useHintAction}
          disabled={hintsUsed >= MAX_HINTS || status !== 'playing'}
          className={`absolute -top-2 right-0 z-10 flex items-center justify-center w-12 h-12 rounded-full transition-all group shadow-lg
            ${hintsUsed >= MAX_HINTS || status !== 'playing'
              ? 'bg-zinc-800 text-zinc-600 border border-zinc-700 cursor-not-allowed'
              : 'bg-yellow-400 text-yellow-950 hover:bg-yellow-300 hover:scale-105 active:scale-95 shadow-yellow-400/20 cursor-pointer'
            }`}
        >
          <Lightbulb className={`w-6 h-6 ${hintsUsed < MAX_HINTS && status === 'playing' ? 'group-hover:animate-pulse' : ''}`} />
          
          {hintsUsed < MAX_HINTS && status === 'playing' && (
            <span className="absolute -bottom-1 -right-1 bg-zinc-950 text-yellow-400 border border-yellow-400/50 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md">
              {MAX_HINTS - hintsUsed}
            </span>
          )}
        </button>

        <div className="w-full flex items-center justify-between mb-2 pr-14">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            FASE {currentPhaseIndex + 1} DE {selectedArticle.phases.length}
          </span>
          <div className="flex items-center gap-2 text-red-400 font-mono font-bold text-sm">
            <Skull className="w-4 h-4" />
            <span>{mistakes} / {MAX_MISTAKES}</span>
          </div>
        </div>
        
        <div className="w-full h-2 bg-zinc-800/50 rounded-full mb-8 overflow-hidden">
          <motion.div 
            className="h-full bg-primary" 
            initial={{ width: 0 }}
            animate={{ width: `${((currentPhaseIndex) / selectedArticle.phases.length) * 100}%` }}
          />
        </div>

        {renderHangman()}

        {/* Text Hint */}
        <div className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl p-4 flex items-center justify-center shadow-sm mb-8 px-4">
          <span className="text-[15px] md:text-[16px] leading-snug font-medium text-zinc-300 text-center">{currentWord.hint}</span>
        </div>

        <div className="flex flex-wrap justify-center gap-1.5 md:gap-3 mb-10 w-full px-2">
          {normalizedTarget.split('').map((char, index) => {
            if (char === ' ') {
              return <div key={index} className="w-4 md:w-8 h-10 md:h-12" />;
            }
            const isRevealed = guessedLetters.has(char) || status === 'lost';
            return (
              <div 
                key={index} 
                className={`flex items-center justify-center w-8 h-12 md:w-12 md:h-16 text-xl md:text-2xl font-black uppercase rounded-xl border-b-[3px] md:border-b-4 
                  ${isRevealed 
                    ? status === 'lost' && !guessedLetters.has(char) ? 'text-red-400 border-red-400/40 bg-red-400/15' : 'text-foreground border-emerald-400/50 bg-emerald-400/10' 
                    : 'text-transparent border-zinc-600/60 bg-zinc-800/60'}`}
              >
                {isRevealed ? currentWord.word[index] : ''}
              </div>
            );
          })}
        </div>

        {status !== 'playing' ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-5 w-full"
          >
            <h2 className={`text-3xl font-black ${status === 'won' ? 'text-emerald-400' : 'text-red-400'}`}>
              {status === 'won' ? 'CORRETO!' : 'FALHOU!'}
            </h2>
            
            {/* Gamification Result */}
            <div className="flex gap-4 items-center bg-zinc-900/80 px-4 py-2 rounded-xl border border-zinc-800 text-sm font-bold text-zinc-300">
              <span className="flex gap-1 items-center">
                <Star className="w-4 h-4 text-amber-400" />
                +{status === 'won' ? phaseXpRef.current + 50 : phaseXpRef.current} XP
              </span>
              <div className="w-px h-4 bg-zinc-700" />
              <span className="flex gap-1 items-center">
                <Flame className="w-4 h-4 text-rose-400" />
                Máx Combo: {highestComboRef.current}
              </span>
            </div>

            <div className="flex items-center gap-3 w-full max-w-sm mt-2">
              {status === 'won' ? (
                <button 
                  onClick={() => startPhase(selectedArticle, currentPhaseIndex + 1)}
                  className="flex-1 px-6 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                >
                  Próxima Fase <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button 
                  onClick={() => startPhase(selectedArticle, currentPhaseIndex)} // retry
                  className="flex-1 px-6 py-4 bg-red-400/20 text-red-400 border border-red-400/30 rounded-2xl font-bold hover:bg-red-400/30 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" /> Tentar Novamente
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-wrap justify-center gap-1.5 md:gap-2 w-full">
            {keyboard.map(key => {
              const isGuessed = guessedLetters.has(key);
              const isCorrect = isGuessed && normalizedTarget.includes(key);
              const isWrong = isGuessed && !normalizedTarget.includes(key);

              return (
                <button
                  key={key}
                  disabled={isGuessed}
                  onClick={() => guessLetter(key)}
                  className={`flex items-center justify-center w-8 h-10 sm:w-10 sm:h-12 md:w-12 md:h-14 rounded-lg md:rounded-xl font-bold text-sm md:text-lg transition-all
                    ${isCorrect ? 'bg-emerald-400/20 text-emerald-400 border-emerald-400/30 border' : ''}
                    ${isWrong ? 'bg-red-400/25 text-red-400 border-red-400/30 border opacity-50' : ''}
                    ${!isGuessed ? 'bg-zinc-800 text-white hover:bg-zinc-700 active:scale-90 border border-zinc-600 shadow-sm' : ''}
                  `}
                >
                  {key}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const title = selectedArticle ? selectedArticle.title : 'Jogo da Forca';
  const subtitle = selectedArticle ? `Fase ${currentPhaseIndex + 1}/${selectedArticle.phases.length}` : 'Trilha de Aprendizado';

  const mobileHeader = (
    <PageHeader
      title={title}
      subtitle={subtitle}
      onBack={handleBack}
    />
  );

  return (
    <DesktopPageLayout
      activeId="forca"
      title={title}
      subtitle={subtitle}
      mobileHeader={mobileHeader}
    >
      <div className="px-4 md:px-8 py-6 pb-24 md:pb-12 max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedArea ? (selectedLaw ? (selectedArticle ? 'game' : 'article') : 'law') : 'area'}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {selectedArticle ? renderGame() : renderFunnel()}
          </motion.div>
        </AnimatePresence>
      </div>
    </DesktopPageLayout>
  );
};

export default ForcaPage;
