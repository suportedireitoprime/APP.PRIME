import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, PhoneOff, Volume2, AlertTriangle, Loader2 } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { SessaoMeExplique, type StatusLive } from '@/lib/meExplique/liveClient';
import { useMeExpliqueCota } from '@/hooks/useMeExpliqueCota';
import { haptic, telaAcesa } from '@/lib/nativo';
import PremiumGate from '@/components/PremiumGate';
import { useAuth } from '@/hooks/useAuth';

import horusOwlAsset from '@/assets/horus/horus-owl.webp.asset.json';
import horusOwlBundled from '@/assets/horus/horus-owl.webp';
import { pickAsset, srcOf } from '@/lib/assetUrl';
const horusOwl = pickAsset(horusOwlBundled, srcOf(horusOwlAsset));
import chamadaAudioSrc from '@/assets/horus/CHAMADA.mp3';

interface Props {
  onEncerrar: () => void;
}

export const HorusCallView: React.FC<Props> = ({ onEncerrar }) => {
  const cota = useMeExpliqueCota();
  const { user } = useAuth();
  const [gateAberto, setGateAberto] = useState(false);

  const [status, setStatus] = useState<StatusLive>('conectando');
  const [micAtivo, setMicAtivo] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [transcricao, setTranscricao] = useState('');
  
  const [volume, setVolume] = useState(0);

  const sessaoRef = useRef<SessaoMeExplique | null>(null);
  const isMounted = useRef(true);
  const iniciandoRef = useRef(false);
  const [callDuration, setCallDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Toca o som de chamada enquanto conecta
  useEffect(() => {
    if (status === 'conectando') {
      const audio = new Audio(chamadaAudioSrc);
      audio.loop = true;
      audio.play().catch((e) => console.warn('Auto-play evitado pelo navegador', e));
      audioRef.current = audio;
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [status]);

  // Timer da ligaÃ§Ã£o (para exibir na tela)
  useEffect(() => {
    if (status === 'falando' || status === 'ouvindo') {
      const interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [status]);

  const formatarTempo = (segundos: number) => {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${min < 10 ? '0' : ''}${min}:${seg < 10 ? '0' : ''}${seg}`;
  };

  // Monitora o volume para a animaÃ§Ã£o do avatar da coruja
  useEffect(() => {
    if (status !== 'falando') {
      setVolume(0);
      return;
    }

    let animationFrameId: number;
    const update = () => {
      if (!sessaoRef.current) return;
      const currentVolume = sessaoRef.current.getVolume();
      setVolume(currentVolume);
      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [status]);

  // MantÃ©m a tela acesa
  useEffect(() => {
    isMounted.current = true;
    void telaAcesa('horus-live-call', true);
    return () => {
      isMounted.current = false;
      void telaAcesa('horus-live-call', false);
      sessaoRef.current?.encerrar();
      sessaoRef.current = null;
      cota.pararTimer();
    };
  }, []);

  // Monitora cota
  useEffect(() => {
    if (status === 'falando' || status === 'ouvindo') {
      cota.iniciarTimer();
    } else {
      cota.pararTimer();
    }
  }, [status, cota]);

  // Cota atingida
  useEffect(() => {
    if (cota.limiteAtingido) {
      sessaoRef.current?.encerrar();
      sessaoRef.current = null;
      setStatus('encerrado');
      cota.pararTimer();
      void haptic.heavy();
      setGateAberto(true);
    }
  }, [cota.limiteAtingido, cota]);

  const conectar = useCallback(async () => {
    if (cota.limiteAtingido) {
      setGateAberto(true);
      return;
    }

    if (iniciandoRef.current || sessaoRef.current) return;
    iniciandoRef.current = true;

    setErro(null);
    setStatus('conectando');

    try {
      // Chama a nova edge function dedicada ao Horus
      const chamador = supabase.functions.invoke('horus-live-token', {
        body: {},
      });

      const timeoutPromise = new Promise<{ data: any, error: any }>((_, reject) => {
        setTimeout(() => reject(new Error('A conexÃ£o demorou muito. Verifique a internet.')), 12000);
      });

      const { data, error } = await Promise.race([chamador, timeoutPromise]);

      if (error) throw new Error(error.message);
      
      const resposta = data as {
        token?: string;
        modelo?: string;
        setup?: Record<string, unknown> | null;
        ephemeral?: boolean;
      } | null;

      const token = resposta?.token;
      const modelo = resposta?.modelo;
      if (!token || !modelo) throw new Error('NÃ£o foi possÃ­vel autorizar a ligaÃ§Ã£o com o Horus.');

      const sessao = new SessaoMeExplique({
        token,
        modelo,
        ephemeral: resposta?.ephemeral ?? false,
        setup: resposta?.setup ?? null,
        promptInicial: `Inicie a conversa cumprimentando o usuário chamado '${user?.user_metadata?.full_name || user?.user_metadata?.name || 'Aluno'}'. Aja como o assistente Horus, seja conciso e proativo.`,

        onStatus: (s) => {
          if (isMounted.current) {
            setStatus(s);
            if (s === 'falando') void haptic.light();
          }
        },
        onTranscricaoParcial: (fala: any) => {
          if (isMounted.current && fala?.texto?.trim()) setTranscricao(fala.texto);
        },
        onTranscricao: (fala: any) => {
          if (isMounted.current && fala?.texto?.trim()) setTranscricao(fala.texto);
        },
        onErro: (msg) => {
          if (isMounted.current) {
            setErro(msg);
            setStatus('erro');
          }
        },
      });

      sessaoRef.current = sessao;
      await sessao.iniciar();
      if (isMounted.current) setMicAtivo(true);
    } catch (err: any) {
      if (!isMounted.current) return;
      const msg = err instanceof Error ? err.message : 'Falha na ligaÃ§Ã£o.';
      setErro(msg);
      setStatus('erro');
    } finally {
      iniciandoRef.current = false;
    }
  }, [cota]);

  useEffect(() => {
    void conectar();
  }, [conectar]);

  const alternarMic = () => {
    if (!sessaoRef.current) return;
    const novoEstado = sessaoRef.current.alternarMicrofone();
    setMicAtivo(novoEstado);
    void haptic.selection();
  };

  const desligar = () => {
    void haptic.medium();
    sessaoRef.current?.encerrar();
    onEncerrar();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#050505] text-white overflow-hidden select-none">
      {/* Background Desfocado para simular tela de chamada rica */}
      <div 
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url(${horusOwl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(60px) saturate(2)',
          transform: 'scale(1.2)'
        }}
      />
      
      {/* Gradiente de escurecimento sobre o fundo */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/60 via-transparent to-[#050505] z-0 pointer-events-none" />

      {/* Header da Chamada */}
      <div className="relative z-10 flex flex-col items-center justify-center pt-[max(env(safe-area-inset-top,0px),3rem)] pb-4">
        <h1 className="text-3xl font-display font-light text-white tracking-widest uppercase opacity-90">
          Horus
        </h1>
        <div className="mt-2 text-zinc-400 font-mono text-sm tracking-widest flex items-center gap-2">
          {status === 'conectando' && (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Ligando...</span>
            </>
          )}
          {status === 'erro' && (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              <span className="text-red-400">Falha na chamada</span>
            </>
          )}
          {(status === 'ouvindo' || status === 'falando') && (
            <span className="text-emerald-400 font-bold">{formatarTempo(callDuration)}</span>
          )}
        </div>
      </div>

      {/* TranscriÃ§Ã£o de texto */}
      <div className="relative z-10 px-8 py-2 h-20 flex items-end justify-center text-center">
        <AnimatePresence>
          {transcricao && (
            <motion.p 
              key={transcricao}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-white/90 font-body text-[15px] max-w-sm line-clamp-3 leading-snug drop-shadow-md"
            >
              {transcricao}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Centro: Avatar da Coruja com AnimaÃ§Ãµes */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center -mt-8">
        <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center">
          
          {/* Animação de Onda Sonora Atrás do Logo */}
          <AnimatePresence>
            {status === 'falando' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-1.5 sm:gap-2.5 z-0 pointer-events-none"
              >
                {[0.4, 0.7, 1.2, 1.5, 1.2, 0.7, 0.4].map((mult, i) => (
                  <motion.div
                    key={i}
                    className="w-3 sm:w-4 bg-emerald-500/30 rounded-full"
                    animate={{
                      height: 120 + (volume * 160 * mult)
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 20
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Anel de respiraÃ§Ã£o quando ouvindo */}
          {status === 'ouvindo' && (
            <motion.div
              animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full border-2 border-emerald-400/30 pointer-events-none"
            />
          )}

          {/* Efeito de escala do avatar baseado no volume da voz */}
          <motion.div 
            className="w-full h-full rounded-full overflow-hidden bg-black/40 border border-white/20 shadow-2xl relative z-10 flex items-center justify-center backdrop-blur-sm"
            animate={{ scale: status === 'falando' ? 1 + (volume * 0.1) : 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <img 
              src={horusOwl} 
              alt="Horus" 
              className={`w-[85%] h-[85%] object-contain mt-4 transition-transform duration-700 ${status === 'conectando' ? 'opacity-50 grayscale scale-95' : 'opacity-100'}`} 
            />
          </motion.div>
        </div>
      </div>

      {/* Controles da Chamada (Bottom) */}
      <div className="relative z-10 pb-[max(env(safe-area-inset-bottom,0px),3rem)] pt-8 flex flex-col items-center">
        {erro && (
          <p className="text-red-400 text-sm mb-6 max-w-xs text-center">{erro}</p>
        )}
        
        <div className="flex items-center justify-center gap-10 w-full max-w-sm px-8">
          
          {/* BotÃ£o Speaker (fictÃ­cio, sÃ³ para compor UI de chamada) */}
          <button 
            type="button"
            className="w-16 h-16 rounded-full bg-zinc-800/80 border border-zinc-700/50 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all text-zinc-400"
          >
            <Volume2 className="w-7 h-7" />
          </button>

          {/* BotÃ£o Microfone */}
          <button 
            type="button"
            onClick={alternarMic}
            className={`w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all border ${
              micAtivo 
                ? 'bg-zinc-800 border-zinc-700 text-white' 
                : 'bg-white border-white text-zinc-900'
            }`}
          >
            {micAtivo ? <Mic className="w-8 h-8" /> : <MicOff className="w-8 h-8" />}
          </button>

          {/* BotÃ£o Desligar */}
          <button 
            type="button"
            onClick={desligar}
            className="w-16 h-16 rounded-full bg-red-600 border border-red-500 flex flex-col items-center justify-center shadow-lg shadow-red-600/30 active:scale-95 transition-all text-white"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
          
        </div>
      </div>

      {/* Gate para limite da ligaÃ§Ã£o */}
      <AnimatePresence>
        {gateAberto && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
            <PremiumGate
              open={gateAberto}
              onClose={() => { setGateAberto(false); onEncerrar(); }}
              feature="explicacao"
              title="Chamada com Horus ConcluÃ­da"
              description="Sua ligaÃ§Ã£o teste com o Horus foi finalizada. Torne-se um assinante PRIME para liberar ligaÃ§Ãµes diÃ¡rias estendidas!"
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

