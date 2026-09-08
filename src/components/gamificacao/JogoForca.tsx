import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GamificacaoJogo, JogoForcaState } from '@/types/gamificacao';
import { gamificacaoService } from '@/services/gamificacaoService';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RefreshCw, Play, Trophy, XCircle, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface JogoForcaProps {
  onBack?: () => void;
}

const MAX_CHANCES = 6;

export function JogoForca({ onBack }: JogoForcaProps) {
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
      const novoJogo = await gamificacaoService.getRandomForca('Código Penal');
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
  }, []);

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

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto p-4 animate-in fade-in zoom-in duration-300">
      <div className="flex justify-between items-center w-full mb-6">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="w-12 h-12 rounded-full hover:bg-zinc-800">
            <ChevronRight className="w-6 h-6 rotate-180" />
          </Button>
        )}
        <div className="text-center flex-1">
          <h2 className="text-2xl font-black tracking-wider text-white">JOGO DA FORCA</h2>
          <div className="text-zinc-400 text-sm mt-1 uppercase tracking-widest">{jogoAtual?.disciplina || 'CARREGANDO...'}</div>
        </div>
        <div className="w-12" /> {/* Espaçador para centralizar */}
      </div>

      <div className="w-full bg-[#0d0f12] border border-zinc-800/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
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
