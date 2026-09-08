import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GamificacaoJogo, JogoForcaState } from '@/types/gamificacao';
import { gamificacaoService } from '@/services/gamificacaoService';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RefreshCw, Play, Trophy, XCircle, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface JogoForcaProps {
  disciplina?: string;
  artigo?: string;
  onBack?: () => void;
}

const MAX_CHANCES = 6;

const playBeep = (type: 'success' | 'error') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {
    // ignora se o navegador não suportar ou bloquear autoplay (normalmente exige interação antes, que é o click)
  }
};

export function JogoForca({ disciplina = 'Código Penal', artigo, onBack }: JogoForcaProps) {
  const [jogoAtual, setJogoAtual] = useState<GamificacaoJogo | null>(null);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<JogoForcaState>({
    palavraOculta: '',
    letrasCorretas: [],
    letrasErradas: [],
    chancesRestantes: MAX_CHANCES,
    status: 'jogando'
  });

  const carregarNovoJogo = useCallback(async () => {
    setLoading(true);
    try {
      const novoJogo = await gamificacaoService.getRandomForca(disciplina, undefined, artigo);
      if (novoJogo) {
        setJogoAtual(novoJogo);
        setState({
          palavraOculta: novoJogo.resposta.toUpperCase(),
          letrasCorretas: [],
          letrasErradas: [],
          chancesRestantes: MAX_CHANCES,
          status: 'jogando'
        });
      } else {
        toast.error('Nenhum jogo da forca encontrado no banco de dados.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar o jogo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [disciplina, artigo]);

  useEffect(() => {
    carregarNovoJogo();
  }, [carregarNovoJogo]);

  const handleTentativa = (letra: string) => {
    if (state.status !== 'jogando') return;
    
    const l = letra.toUpperCase();
    if (state.letrasCorretas.includes(l) || state.letrasErradas.includes(l)) {
      return; // Já tentou essa letra
    }

    const palavra = state.palavraOculta;
    const isCorreta = palavra.includes(l);
    
    // Toca som baseado no acerto/erro
    playBeep(isCorreta ? 'success' : 'error');

    setState(prev => {
      const novasCorretas = isCorreta ? [...prev.letrasCorretas, l] : prev.letrasCorretas;
      const novasErradas = !isCorreta ? [...prev.letrasErradas, l] : prev.letrasErradas;
      const chances = prev.chancesRestantes - (isCorreta ? 0 : 1);
      
      // Verifica vitória (todas as letras da palavra foram descobertas)
      const letrasUnicas = new Set(palavra.split('').filter(char => /[A-Z]/.test(char)));
      const venceu = Array.from(letrasUnicas).every(char => novasCorretas.includes(char));
      const perdeu = chances <= 0;

      const novoStatus = venceu ? 'venceu' : perdeu ? 'perdeu' : 'jogando';
      
      if (venceu) {
        // Reproduz haptic se possível
        if (typeof window !== 'undefined' && (window as any).navigator?.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
      } else if (perdeu) {
        if (typeof window !== 'undefined' && (window as any).navigator?.vibrate) {
          navigator.vibrate(200);
        }
      }

      return {
        ...prev,
        letrasCorretas: novasCorretas,
        letrasErradas: novasErradas,
        chancesRestantes: chances,
        status: novoStatus
      };
    });
  };

  // Teclado virtual
  const alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const renderPalavraOculta = () => {
    if (!state.palavraOculta) return null;
    
    return (
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {state.palavraOculta.split('').map((char, index) => {
          const isLetra = /[A-Z]/.test(char);
          if (!isLetra) {
            return (
              <span key={index} className="flex items-end justify-center w-6 h-10 text-2xl font-bold text-gray-500">
                {char}
              </span>
            );
          }

          const revelada = state.letrasCorretas.includes(char) || state.status === 'perdeu';
          
          return (
            <motion.div
              key={index}
              initial={false}
              animate={{ 
                scale: revelada ? [1, 1.2, 1] : 1,
                color: state.status === 'perdeu' && !state.letrasCorretas.includes(char) ? '#ef4444' : 'inherit'
              }}
              className="flex items-center justify-center w-10 h-12 sm:w-12 sm:h-14 bg-zinc-900 border-b-4 border-primary text-2xl sm:text-3xl font-bold uppercase rounded-t shadow-sm"
            >
              {revelada ? char : ''}
            </motion.div>
          );
        })}
      </div>
    );
  };

  const processTextoPergunta = (texto: string) => {
    if (state.status === 'jogando') {
      // Oculta a resposta no texto substituindo por underscores
      const regex = new RegExp(`\\b${state.palavraOculta}\\b`, 'gi');
      return texto.replace(regex, '_'.repeat(state.palavraOculta.length));
    }
    // Mostra o texto com a resposta destacada
    const regex = new RegExp(`\\b${state.palavraOculta}\\b`, 'gi');
    return texto.replace(regex, `<span class="text-primary font-bold bg-primary/10 px-1 rounded">${state.palavraOculta}</span>`);
  };

  const renderHangman = () => {
    const mistakes = state.letrasErradas.length;
    const strokeColor = mistakes >= MAX_CHANCES ? '#ef4444' : '#e2e8f0'; 
    const gallowsColor = '#334155';
    const ropeColor = '#8b5cf6';
    
    return (
      <div className="flex justify-center mb-8 relative">
        {mistakes >= MAX_CHANCES && (
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

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto p-4 animate-in fade-in zoom-in duration-300">
      <div className="flex justify-between items-center w-full mb-6 relative">
        {onBack && (
          <div className="absolute left-0">
            <Button variant="ghost" size="icon" onClick={onBack} className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full hover:bg-zinc-800">
              <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
            </Button>
          </div>
        )}
        <div className="text-center w-full">
          <h2 className="text-2xl font-black tracking-wider text-white">JOGO DA FORCA</h2>
          <div className="text-zinc-400 text-sm mt-1 uppercase tracking-widest">{jogoAtual?.disciplina || 'CARREGANDO...'}</div>
        </div>
      </div>

      <div className="w-full rounded-3xl p-4 sm:p-8 relative z-10">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-3/4 mx-auto bg-zinc-800" />
            <Skeleton className="h-24 w-full bg-zinc-800 rounded-xl mt-8" />
            <div className="flex gap-2 justify-center mt-12">
              <Skeleton className="h-12 w-10 bg-zinc-800" />
              <Skeleton className="h-12 w-10 bg-zinc-800" />
              <Skeleton className="h-12 w-10 bg-zinc-800" />
            </div>
          </div>
        ) : !jogoAtual ? (
          <div className="text-center py-12 text-zinc-400">
            Nenhum jogo disponível.
          </div>
        ) : (
          <>
            {/* Header / Info */}
            <div className="flex justify-between items-center mb-6 text-sm font-semibold">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs uppercase tracking-wider ${
                  jogoAtual.dificuldade === 'facil' ? 'bg-green-500/20 text-green-400' :
                  jogoAtual.dificuldade === 'medio' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {jogoAtual.dificuldade}
                </span>
                <span className="text-zinc-500 px-2 py-1 bg-zinc-900 rounded border border-zinc-800">
                  {jogoAtual.artigo}
                </span>
              </div>
              <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full ${
                state.chancesRestantes <= 2 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-zinc-900 text-zinc-300'
              }`}>
                ❤️ {state.chancesRestantes} chances
              </div>
            </div>

            {/* Pergunta (Texto do Artigo) */}
            <div className="mb-10 text-center">
              <p 
                className="text-lg sm:text-xl text-zinc-200 font-medium leading-relaxed"
                dangerouslySetInnerHTML={{ __html: processTextoPergunta(jogoAtual.pergunta) }}
              />
            </div>

            {/* Boneco da Forca */}
            {renderHangman()}

            {/* Palavra a ser adivinhada */}
            {renderPalavraOculta()}

            {/* Teclado ou Resultado */}
            <AnimatePresence mode="wait">
              {state.status === 'jogando' ? (
                <motion.div
                  key="teclado"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="grid grid-cols-7 sm:grid-cols-9 gap-2 mt-8"
                >
                  {alfabeto.map(letra => {
                    const correta = state.letrasCorretas.includes(letra);
                    const errada = state.letrasErradas.includes(letra);
                    const isUsada = correta || errada;

                    return (
                      <Button
                        key={letra}
                        variant={correta ? "default" : errada ? "destructive" : "outline"}
                        className={`h-12 text-lg font-bold ${
                          isUsada ? 'opacity-50 cursor-not-allowed scale-95' : 'hover:scale-105 transition-transform bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300'
                        }`}
                        onClick={() => handleTentativa(letra)}
                        disabled={isUsada}
                      >
                        {letra}
                      </Button>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div
                  key="resultado"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center p-8 bg-zinc-900/50 rounded-2xl border border-zinc-800 mt-8"
                >
                  {state.status === 'venceu' ? (
                    <>
                      <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                        <Trophy className="w-10 h-10 text-green-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-green-400 mb-2">Excelente!</h3>
                      <p className="text-zinc-400 mb-6">Você memorizou esse termo perfeitamente.</p>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                        <XCircle className="w-10 h-10 text-red-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-red-400 mb-2">Fim de Jogo</h3>
                      <p className="text-zinc-400 mb-6">A palavra correta era: <span className="font-bold text-white">{state.palavraOculta}</span></p>
                    </>
                  )}
                  
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto px-8 py-6 rounded-full text-lg font-bold"
                    onClick={carregarNovoJogo}
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Jogar Novamente
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
