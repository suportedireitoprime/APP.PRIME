import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader2, StopCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { SessaoMeExplique, type StatusLive } from '@/lib/meExplique/liveClient';
import { useSubscription } from '@/hooks/useSubscription';
import { haptic } from '@/lib/nativo';

type Props = {
  questao: any;
  onClose: () => void;
};

const LIMITE_PREMIUM_SEG = 300; // 5 min
const LIMITE_FREE_SEG = 60; // 1 min

export const ProfessoraInline = ({ questao, onClose }: Props) => {
  const { isPremium } = useSubscription();
  const sessaoRef = useRef<SessaoMeExplique | null>(null);

  const [status, setStatus] = useState<StatusLive>('conectando');
  const [erro, setErro] = useState<string | null>(null);
  const [micAtivo, setMicAtivo] = useState(true);
  const [iniciando, setIniciando] = useState(true);
  const [falaAtual, setFalaAtual] = useState<string>('');

  const hojeKey = new Date().toISOString().slice(0, 10);
  const storageKey = `me_explique_uso_${hojeKey}`;
  const [tempoUsadoHoje, setTempoUsadoHoje] = useState<number>(() => {
    const val = localStorage.getItem(storageKey);
    return val ? parseInt(val, 10) : 0;
  });

  const limiteSegundos = isPremium ? LIMITE_PREMIUM_SEG : LIMITE_FREE_SEG;
  const tempoRestante = Math.max(0, limiteSegundos - tempoUsadoHoje);
  const aoVivo = status === 'ouvindo' || status === 'falando';

  const encerrar = useCallback(() => {
    sessaoRef.current?.encerrar();
    sessaoRef.current = null;
    setStatus('inativo');
    setIniciando(false);
    onClose();
  }, [onClose]);

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
  }, [aoVivo, limiteSegundos, storageKey, encerrar]);

  useEffect(() => {
    let montado = true;
    
    const iniciar = async () => {
      if (sessaoRef.current) return;
      if (tempoRestante <= 0) {
        setErro('Tempo esgotado.');
        setStatus('erro');
        setIniciando(false);
        return;
      }

      setErro(null);
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

        if (!montado) return;

        const sessao = new SessaoMeExplique({
          token,
          modelo,
          setup: resposta?.setup ?? null,
          onStatus: (s) => setStatus(s),
          onTranscricaoParcial: (fala) => setFalaAtual(fala.texto),
          onTranscricao: (fala) => setFalaAtual(fala.texto),
          onErro: (msg) => setErro(msg),
        });

        sessaoRef.current = sessao;
        await sessao.iniciar();
        setMicAtivo(true);

        // Passar a questão como contexto!
        if (questao && montado) {
          const textoQuestao = `Abaixo está a questão que o aluno está resolvendo agora:\n\nEnunciado: ${questao.enunciado}\n\nAlternativas:\nA) ${questao.alternativa_a}\nB) ${questao.alternativa_b}\nC) ${questao.alternativa_c}\nD) ${questao.alternativa_d}\n${questao.alternativa_e ? `E) ${questao.alternativa_e}` : ''}\n\nGabarito Correto: ${questao.gabarito}\nComentário do professor: ${questao.comentario ?? 'Nenhum'}\n\nInstruções: O aluno vai te perguntar sobre essa questão. Explique com base nos dados acima. Comece dizendo 'Estou vendo a questão, trata-se de...'.`;
          
          setTimeout(() => {
            if (montado && sessaoRef.current) {
              sessaoRef.current.enviarTexto(textoQuestao, true);
            }
          }, 1500);
        }
      } catch (e) {
        if (!montado) return;
        const msg = e instanceof Error ? e.message : 'Falha ao iniciar.';
        setErro(msg);
        setStatus('erro');
        sessaoRef.current?.encerrar();
        sessaoRef.current = null;
      } finally {
        if (montado) setIniciando(false);
      }
    };

    iniciar();

    return () => {
      montado = false;
      sessaoRef.current?.encerrar();
    };
  }, [questao, tempoRestante]);

  const alternarMic = () => {
    const sessao = sessaoRef.current;
    if (!sessao) return;
    void haptic.light();
    setMicAtivo(sessao.alternarMicrofone());
  };

  const getRotulo = () => {
    if (erro) return erro;
    if (tempoRestante <= 0) return 'Tempo esgotado.';
    if (status === 'conectando' || iniciando) return 'Conectando...';
    if (status === 'ouvindo') return 'Ouvindo...';
    if (status === 'falando') return 'Explicando...';
    return 'Inativo';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col gap-3 rounded-2xl bg-[#0a111a] border border-blue-500/20 p-4 shadow-lg shadow-blue-500/5 w-full"
    >
      <div className="flex items-center gap-4">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 shadow-lg shadow-blue-600/30">
          {status === 'conectando' || iniciando ? (
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          ) : status === 'falando' ? (
            <div className="flex items-center gap-1">
              <span className="h-3 w-1 bg-white rounded-full animate-bounce" />
              <span className="h-5 w-1 bg-white rounded-full animate-bounce [animation-delay:0.1s]" />
              <span className="h-3 w-1 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
            </div>
          ) : (
            <Mic className={cn("h-6 w-6 text-white", status === 'ouvindo' && "animate-pulse")} />
          )}
          
          {(status === 'ouvindo' || status === 'falando') && (
            <span className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-20" />
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p className="text-[15px] font-bold text-white flex items-center gap-2">
            Professora
            <span className="text-[11px] font-semibold tracking-wider text-blue-400 uppercase bg-blue-500/10 px-2 py-0.5 rounded-full">Ao Vivo</span>
          </p>
          <p className="text-[13px] text-white/60 truncate">
            {getRotulo()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {aoVivo && (
            <button
              onClick={alternarMic}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                micAtivo ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
              )}
            >
              {micAtivo ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>
          )}
          <button
            onClick={encerrar}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-400 transition-colors"
          >
            <StopCircle className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {falaAtual && (
        <div className="mt-1 bg-black/20 rounded-xl p-3 text-[14px] text-white/80 leading-relaxed border border-white/5">
          {falaAtual}
        </div>
      )}
    </motion.div>
  );
};
