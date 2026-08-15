import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { SessaoMeExplique, type FalaTranscrita, type StatusLive } from '@/lib/meExplique/liveClient';
import { useSubscription } from '@/hooks/useSubscription';
import { haptic } from '@/lib/nativo';

type Props = {
  aberto: boolean;
  onClose: () => void;
  questao: any;
};

const LIMITE_PREMIUM_SEG = 300; // 5 min
const LIMITE_FREE_SEG = 60; // 1 min

export const MeExpliqueSheet = ({ aberto, onClose, questao }: Props) => {
  const { isPremium } = useSubscription();
  const sessaoRef = useRef<SessaoMeExplique | null>(null);

  const [status, setStatus] = useState<StatusLive>('inativo');
  const [erro, setErro] = useState<string | null>(null);
  const [micAtivo, setMicAtivo] = useState(true);
  const [falas, setFalas] = useState<FalaTranscrita[]>([]);
  const [falaParcial, setFalaParcial] = useState<FalaTranscrita | null>(null);
  const [iniciando, setIniciando] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const hojeKey = new Date().toISOString().slice(0, 10);
  const storageKey = `me_explique_uso_${hojeKey}`;
  const [tempoUsadoHoje, setTempoUsadoHoje] = useState<number>(() => {
    const val = localStorage.getItem(storageKey);
    return val ? parseInt(val, 10) : 0;
  });

  const limiteSegundos = isPremium ? LIMITE_PREMIUM_SEG : LIMITE_FREE_SEG;
  const tempoRestante = Math.max(0, limiteSegundos - tempoUsadoHoje);
  const aoVivo = status === 'ouvindo' || status === 'falando';

  useEffect(() => {
    if (!aoVivo) return;
    const interval = setInterval(() => {
      setTempoUsadoHoje((prev) => {
        const novo = prev + 1;
        localStorage.setItem(storageKey, String(novo));
        if (novo >= limiteSegundos) {
          encerrar();
          haptic.heavy();
        }
        return novo;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [aoVivo, limiteSegundos, storageKey]);

  useEffect(() => {
    if (aberto) {
      if (tempoRestante > 0 && status === 'inativo') {
        void iniciar();
      }
    } else {
      encerrar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [falas, falaParcial]);

  const encerrar = useCallback(() => {
    sessaoRef.current?.encerrar();
    sessaoRef.current = null;
    setStatus('inativo');
    setFalaParcial(null);
    setIniciando(false);
  }, []);

  const iniciar = useCallback(async () => {
    if (sessaoRef.current || iniciando) return;

    setErro(null);
    setFalas([]);
    setIniciando(true);
    setStatus('conectando');
    void haptic.medium();

    try {
      const { data, error } = await supabase.functions.invoke('me-explique-token');
      if (error) throw new Error(error.message);
      const resposta = data as { token?: string; modelo?: string; setup?: Record<string, unknown> | null } | null;
      const token = resposta?.token;
      const modelo = resposta?.modelo;
      if (!token || !modelo) throw new Error('Não foi possível autorizar a sessão ao vivo.');

      const sessao = new SessaoMeExplique({
        token,
        modelo,
        setup: resposta?.setup ?? null,
        // SEM VÍDEO / CÂMERA
        onStatus: (s) => setStatus(s),
        onTranscricaoParcial: (fala) => setFalaParcial(fala),
        onTranscricao: (fala) => {
          setFalas((atual) => [...atual, fala]);
          setFalaParcial(null);
        },
        onErro: (msg) => setErro(msg),
      });

      sessaoRef.current = sessao;
      await sessao.iniciar();
      setMicAtivo(true);

      // Passar a questão como contexto!
      if (questao) {
        const textoQuestao = `
Abaixo está a questão que o aluno está resolvendo agora:

Enunciado: ${questao.enunciado}

Alternativas:
A) ${questao.alternativa_a}
B) ${questao.alternativa_b}
C) ${questao.alternativa_c}
D) ${questao.alternativa_d}
${questao.alternativa_e ? `E) ${questao.alternativa_e}` : ''}

Gabarito Correto: ${questao.gabarito}
Comentário do professor: ${questao.comentario ?? 'Nenhum'}

Instruções: O aluno vai te perguntar sobre essa questão. Explique com base nos dados acima.
`;
        // Timeout para garantir que o WS está ouvindo
        setTimeout(() => sessao.enviarTexto(textoQuestao, true), 1500);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha ao iniciar.';
      setErro(msg);
      setStatus('erro');
      sessaoRef.current?.encerrar();
      sessaoRef.current = null;
    } finally {
      setIniciando(false);
    }
  }, [iniciando, questao]);

  const alternarMic = () => {
    const sessao = sessaoRef.current;
    if (!sessao) return;
    void haptic.light();
    setMicAtivo(sessao.alternarMicrofone());
  };

  const getRotulo = () => {
    if (erro) return erro;
    if (tempoRestante <= 0) return 'Tempo esgotado.';
    if (status === 'conectando' || iniciando) return 'Conectando à Professora...';
    if (status === 'ouvindo') return 'Professora ouvindo...';
    if (status === 'falando') return 'Professora explicando...';
    return 'Inativo';
  };

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="flex max-h-[85vh] min-h-[50vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[32px] bg-[#111] shadow-2xl"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/5 p-4 pl-6">
              <div className="flex flex-col">
                <h3 className="text-lg font-bold text-white">Professora (Ao Vivo)</h3>
                <span className={cn("text-sm font-medium", status === 'ouvindo' ? 'text-green-400' : status === 'falando' ? 'text-blue-400' : 'text-white/50')}>
                  {getRotulo()}
                </span>
              </div>
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Transcrições */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {falas.map((fala, idx) => (
                <div key={idx} className={cn("max-w-[85%] rounded-2xl px-4 py-3", fala.quem === 'aluno' ? "self-end bg-blue-600 text-white" : "self-start bg-white/10 text-white/90")}>
                  <p className="text-[15px] leading-relaxed">{fala.texto}</p>
                </div>
              ))}
              
              {falaParcial && (
                <div className={cn("max-w-[85%] rounded-2xl px-4 py-3 opacity-70", falaParcial.quem === 'aluno' ? "self-end bg-blue-600 text-white" : "self-start bg-white/10 text-white/90")}>
                  <p className="text-[15px] leading-relaxed flex items-center gap-2">
                    {falaParcial.texto}
                    <span className="flex gap-1"><span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" /><span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:0.2s]" /><span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:0.4s]" /></span>
                  </p>
                </div>
              )}
              
              {falas.length === 0 && !falaParcial && !iniciando && status === 'ouvindo' && (
                <div className="flex-1 flex flex-col items-center justify-center text-white/30 gap-4 mt-8">
                  <div className="h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Mic className="h-8 w-8 text-blue-500 animate-pulse" />
                  </div>
                  <p className="text-center font-medium">Estou ouvindo. Pode fazer a sua pergunta sobre a questão!</p>
                </div>
              )}
            </div>

            {/* Controles Base */}
            <div className="shrink-0 border-t border-white/5 bg-[#0a0a0a] p-4 pb-safe-nav">
              <div className="flex flex-col items-center gap-4">
                {status === 'conectando' && (
                  <div className="flex items-center gap-3 text-blue-400">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="font-medium">Conectando...</span>
                  </div>
                )}
                
                {aoVivo && (
                  <button
                    onClick={alternarMic}
                    className={cn(
                      "flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition-all",
                      micAtivo ? "bg-blue-600 shadow-blue-600/30 text-white" : "bg-red-500 shadow-red-500/30 text-white opacity-80"
                    )}
                  >
                    {micAtivo ? <Mic className="h-7 w-7" /> : <MicOff className="h-7 w-7" />}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
