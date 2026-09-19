import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Send,
  ArrowLeft,
  Sparkles,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Crown,
  Volume2,
  MessageSquare,
  BookOpen,
  BookA,
  Scale,
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { SessaoMeExplique, type FalaTranscrita, type StatusLive } from '@/lib/meExplique/liveClient';
import { useMeExpliqueCota } from '@/hooks/useMeExpliqueCota';
import { haptic, telaAcesa } from '@/lib/nativo';
import PremiumGate from '@/components/PremiumGate';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { FaceYellow } from '@/components/laboratorio/avatars/FaceYellow';

interface Props {
  modo: 'livro' | 'termo' | 'lei' | 'livre';
  contexto: string;
  subtitulo?: string;
  capa?: string;
  promptInicialPersonalizado?: string;
  onVoltar: () => void;
}

const SUGESTOES_POR_MODO: Record<string, string[]> = {
  livro: [
    'Me dê um exemplo prático desse livro',
    'Explique o primeiro capítulo como para 6 anos',
    'Como essa obra cai na OAB?',
    'Qual a frase mais famosa do autor?',
  ],
  termo: [
    'Me dê um exemplo bem simples do dia a dia',
    'Como a OAB tenta confundir esse termo?',
    'Explique para uma criança de 6 anos',
    'Qual a diferença para o termo oposto?',
  ],
  lei: [
    'Qual a pegadinha desse artigo na prova?',
    'Por que essa lei foi criada?',
    'Me dê um exemplo prático real',
    'Explique como para 6 anos',
  ],
  livre: [
    'Me explique a diferença entre roubo e furto',
    'O que é legítima defesa na prática?',
    'Comprei e me arrependi, posso devolver?',
    'Como estudar Direito sem travar?',
  ],
};

export const MeExpliqueLiveChatView: React.FC<Props> = ({
  modo,
  contexto,
  subtitulo,
  capa,
  promptInicialPersonalizado,
  onVoltar,
}) => {
  const cota = useMeExpliqueCota();
  const [gateAberto, setGateAberto] = useState(false);

  const [status, setStatus] = useState<StatusLive>('conectando');
  const [erro, setErro] = useState<string | null>(null);
  const [micAtivo, setMicAtivo] = useState(true);
  const [falas, setFalas] = useState<FalaTranscrita[]>([]);
  const [falaParcial, setFalaParcial] = useState<FalaTranscrita | null>(null);
  const [inputTexto, setInputTexto] = useState('');
  
  const [viseme, setViseme] = useState('X');
  const [volume, setVolume] = useState(0);

  const sessaoRef = useRef<SessaoMeExplique | null>(null);
  const isMounted = useRef(true);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const iniciandoRef = useRef(false);

  const formatarTempo = (segundos: number) => {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${min}:${seg < 10 ? '0' : ''}${seg}`;
  };

  // Simulação de Visemes + Extração de Volume em Tempo Real
  useEffect(() => {
    if (status !== 'falando') {
      setViseme('X');
      setVolume(0);
      return;
    }

    let animationFrameId: number;
    let lastTime = 0;

    const update = (time: number) => {
      if (!sessaoRef.current) return;
      const currentVolume = sessaoRef.current.getVolume();
      setVolume(currentVolume);

      if (time - lastTime > 100) {
        lastTime = time;
        if (currentVolume > 0.05) {
          const visemes = ['A', 'E', 'I', 'O', 'U', 'C', 'D', 'F', 'L', 'M', 'P', 'S'];
          setViseme(visemes[Math.floor(Math.random() * visemes.length)]);
        } else {
          setViseme('X');
        }
      }

      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [status]);

  // Mantém a tela acesa durante a conversa ao vivo
  useEffect(() => {
    isMounted.current = true;
    void telaAcesa('me-explique-live-chat', true);
    return () => {
      isMounted.current = false;
      void telaAcesa('me-explique-live-chat', false);
      sessaoRef.current?.encerrar();
      sessaoRef.current = null;
      cota.pararTimer();
    };
  }, []);

  // Monitora cota de tempo
  useEffect(() => {
    if (status === 'falando' || status === 'ouvindo') {
      cota.iniciarTimer();
    } else {
      cota.pararTimer();
    }
  }, [status, cota]);

  // Se cota atingida, encerra a sessão
  useEffect(() => {
    if (cota.limiteAtingido) {
      sessaoRef.current?.encerrar();
      sessaoRef.current = null;
      setStatus('encerrado');
      cota.pararTimer();
      void haptic.heavy();
    }
  }, [cota.limiteAtingido, cota]);

  // Auto scroll do chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [falas, falaParcial]);

  // Iniciar sessão Gemini Live
  const conectar = useCallback(async () => {
    if (cota.limiteAtingido) {
      cota.setLimiteModalAberto(true);
      return;
    }

    if (iniciandoRef.current || sessaoRef.current) return;
    iniciandoRef.current = true;

    sessaoRef.current?.encerrar();
    sessaoRef.current = null;

    setErro(null);
    setStatus('conectando');
    setFalas([]);
    setFalaParcial(null);

    try {
      // 1) Solicita ephemeral token ao backend com instrução customizada para o modo
      const chamador = supabase.functions.invoke('me-explique-token', {
        body: {
          modo,
          contexto,
          formatoRelatorio: 'didática 6 anos ao vivo',
        },
      });

      const timeoutPromise = new Promise<{ data: any, error: any }>((_, reject) => {
        setTimeout(() => reject(new Error('A conexão demorou demais. Verifique sua internet.')), 12000);
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
      if (!token || !modelo) throw new Error('Não foi possível autorizar a sessão ao vivo com o professor.');

      // 2) Constrói prompt inicial
      let promptInicial = promptInicialPersonalizado;
      if (!promptInicial) {
        if (modo === 'livro') {
          promptInicial = `Olá professor! Estou estudando o livro "${contexto}". Pode me cumprimentar com entusiasmo e me explicar a grande ideia desse livro de forma bem simples como se eu tivesse 6 anos?`;
        } else if (modo === 'termo') {
          promptInicial = `Olá professor! Quero entender o que significa "${contexto}". Pode me explicar usando uma historinha ou exemplo do dia a dia como para uma criança de 6 anos?`;
        } else if (modo === 'lei') {
          promptInicial = `Olá professor! Estou analisando "${contexto}". Me explique por que essa regra existe e como ela funciona na vida real de um jeito bem simples!`;
        } else {
          promptInicial = `Olá professor! Pode se apresentar calorosamente como meu tutor do Me Explique e me perguntar qual assunto jurídico eu gostaria de desvendar hoje?`;
        }
      }

      // 3) Inicializa a sessão com a Gemini Live API
      const sessao = new SessaoMeExplique({
        token,
        modelo,
        ephemeral: resposta?.ephemeral ?? false,
        setup: resposta?.setup ?? null,
        promptInicial,

        onStatus: (s) => {
          if (isMounted.current) {
            setStatus(s);
            if (s === 'falando') void haptic.light();
          }
        },
        onTranscricaoParcial: (fala) => {
          if (isMounted.current) setFalaParcial(fala);
        },
        onTranscricao: (fala) => {
          if (!isMounted.current) return;
          setFalas((prev) => [...prev, fala]);
          setFalaParcial(null);
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
      const msg = err instanceof Error ? err.message : 'Falha ao iniciar áudio ao vivo.';
      setErro(msg);
      setStatus('erro');
    } finally {
      iniciandoRef.current = false;
    }
  }, [cota, modo, contexto, promptInicialPersonalizado]);

  useEffect(() => {
    void conectar();
  }, [conectar]);

  const alternarMic = () => {
    if (!sessaoRef.current) return;
    const novoEstado = sessaoRef.current.alternarMicrofone();
    setMicAtivo(novoEstado);
    void haptic.selection();
  };

  const handleEnviarMensagem = (msgTexto?: string) => {
    const txt = (msgTexto || inputTexto).trim();
    if (!txt || !sessaoRef.current) return;

    void haptic.medium();
    setInputTexto('');
    setFalas((prev) => [...prev, { quem: 'aluno', texto: txt }]);
    sessaoRef.current.enviarTexto(txt);
  };

  const sugestoes = SUGESTOES_POR_MODO[modo] || SUGESTOES_POR_MODO.livre;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0D0D0D] text-white overflow-hidden select-none">
      {/* Fundo Oficial Animado ShapeGrid */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <ShapeGrid
          borderColor="rgba(255, 255, 255, 0.03)"
          squareSize={38}
          speed={0.6}
          direction="diagonal"
          className="w-full h-full"
        />
      </div>

      {/* Header Superior com Tempo e Botão Voltar */}
      <header className="relative z-20 flex items-center justify-between px-4 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-3 bg-transparent">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => {
              void haptic.light();
              sessaoRef.current?.encerrar();
              onVoltar();
            }}
            className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white active:scale-95 transition-all cursor-pointer shrink-0"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Título Removido conforme solicitação */}
        </div>

        {/* Cota Diária de Tempo Restante */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold shadow-inner backdrop-blur-md">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatarTempo(cota.tempoRestante)}</span>
          </div>

          {!cota.isPremium && (
            <button
              type="button"
              onClick={() => setGateAberto(true)}
              className="p-2 rounded-xl bg-amber-500 text-black active:scale-95 transition-all shadow"
              title="Liberar 5 min diários"
            >
              <Crown className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* ÁREA CENTRAL: O AVATAR E EFEITOS SONOROS */}
      <section className="relative z-10 flex flex-col items-center justify-end px-4 shrink-0 mt-auto pb-4">
        <div className="relative flex items-end justify-center w-52 h-52 sm:w-60 sm:h-60 translate-y-4">
          {/* Anéis de Ondas Sonoras Expansivas (Somente quando falando) */}
          <AnimatePresence>
            {status === 'falando' && (
              <>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0.8 }}
                  animate={{ scale: [1, 1.45, 1.8], opacity: [0.8, 0.35, 0] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-full border-2 border-amber-400/50 pointer-events-none"
                />
                <motion.div
                  initial={{ scale: 0.9, opacity: 0.8 }}
                  animate={{ scale: [1, 1.35, 1.6], opacity: [0.7, 0.25, 0] }}
                  transition={{ repeat: Infinity, duration: 1.8, delay: 0.5, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-full border border-rose-500/40 pointer-events-none"
                />
              </>
            )}
          </AnimatePresence>

          {/* Anel de Respiração Suave (Quando ouvindo o usuário) */}
          {status === 'ouvindo' && (
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full border-2 border-emerald-400/40 pointer-events-none"
            />
          )}

          {/* Halo Glow com Blur Dinâmico */}
          <div
            className={`absolute -inset-4 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${
              status === 'falando'
                ? 'bg-gradient-to-tr from-amber-500/40 via-rose-600/40 to-purple-600/40 opacity-70 scale-110'
                : status === 'ouvindo'
                ? 'bg-emerald-500/30 opacity-50 scale-100'
                : status === 'conectando'
                ? 'bg-amber-500/25 opacity-40 animate-pulse'
                : 'bg-zinc-700/20 opacity-20'
            }`}
          />

          {/* O AVATAR FACEYELLOW */}
          <div className="relative w-full h-full z-10 flex items-end justify-center overflow-visible pb-2">
            <FaceYellow viseme={viseme} volume={volume} />
            
            {/* Botão de Microfone Centralizado na Toga do Avatar */}
            <button
              type="button"
              onClick={alternarMic}
              className={`absolute bottom-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xl active:scale-95 transition-all cursor-pointer z-50 backdrop-blur-md ${
                micAtivo
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-zinc-800/80 text-zinc-400 border-zinc-700'
              }`}
              title={micAtivo ? 'Microfone Ativo (toque para silenciar)' : 'Microfone Mutado (toque para abrir)'}
              aria-label="Microfone"
            >
              {micAtivo ? <Mic className="w-5 h-5 animate-pulse" /> : <MicOff className="w-5 h-5 text-red-400" />}
            </button>

            {/* Ícone sobreposto para status conectando/ouvindo */}
            {status !== 'falando' && (
              <div className="absolute top-4 left-4 bg-zinc-900/80 backdrop-blur border border-white/10 p-2 rounded-full shadow-xl">
                {status === 'ouvindo' ? (
                  <MessageSquare className="w-4 h-4 text-emerald-400 animate-bounce" />
                ) : status === 'conectando' ? (
                  <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                ) : (
                  <Volume2 className="w-4 h-4 text-zinc-500" />
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ÁREA DO CHAT: Transcrição em Tempo Real e Histórico de Conversa */}
      <section
        ref={chatScrollRef}
        className="relative z-10 flex-1 px-4 py-2 overflow-y-auto space-y-3 scroll-smooth max-h-[35vh] w-full md:max-w-xl md:mx-auto"
      >
        {falas.length === 0 && !falaParcial && status === 'conectando' && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2 text-zinc-500">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500/70" />
            <p className="text-xs">Estabelecendo canal de áudio ultrarrápido com a IA...</p>
          </div>
        )}

        {/* Balões de conversa anteriores */}
        {falas.map((f, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${f.quem === 'aluno' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-md ${
                f.quem === 'aluno'
                  ? 'bg-amber-500 text-black font-semibold rounded-br-none ml-6'
                  : 'bg-zinc-900 border border-white/10 text-white rounded-bl-none mr-6'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold uppercase tracking-wider opacity-60">
                {f.quem === 'aluno' ? 'Você' : 'Professor Prime (Ao Vivo)'}
              </div>
              <p className="whitespace-pre-wrap">{f.texto}</p>
            </div>
          </motion.div>
        ))}

        {/* Transcrição Parcial (streaming de texto em tempo real enquanto fala) */}
        {falaParcial && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${falaParcial.quem === 'aluno' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-lg border ${
                falaParcial.quem === 'aluno'
                  ? 'bg-amber-500/90 text-black font-semibold rounded-br-none border-amber-300'
                  : 'bg-zinc-900/95 border-amber-500/40 text-white rounded-bl-none shadow-amber-500/10'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                {falaParcial.quem === 'aluno' ? 'Você falando...' : 'Falando em tempo real...'}
              </div>
              <p className="whitespace-pre-wrap">{falaParcial.texto}</p>
            </div>
          </motion.div>
        )}

        {/* Alerta de erro com botão de reconexão */}
        {erro && (
          <div className="rounded-2xl border border-red-500/30 bg-red-950/40 p-3 text-center space-y-2">
            <p className="text-xs text-red-300">{erro}</p>
            <button
              type="button"
              onClick={conectar}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold active:scale-95 transition-all shadow cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Tentar Novamente
            </button>
          </div>
        )}
      </section>

      {/* RODAPÉ: Chips com Sugestões, Microfone e Input de Texto */}
      <footer className="relative z-20 bg-zinc-950/90 border-t border-white/10 px-3 pt-2 pb-[calc(0.75rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] backdrop-blur-md">
        <div className="w-full md:max-w-xl md:mx-auto space-y-2">
          {/* Sugestões Rápidas em Carrossel Horizontal */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {sugestoes.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleEnviarMensagem(sug)}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-[11px] font-medium text-zinc-300 hover:text-white hover:border-amber-500/40 active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3 h-3 inline mr-1 text-amber-400" />
                {sug}
              </button>
            ))}
          </div>

          {/* Linha de Controle: Campo de Digitação */}
          <div className="flex items-center gap-2">
            {/* Input de Texto para quem prefere digitar ou enviar pergunta complementar */}
            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                value={inputTexto}
                onChange={(e) => setInputTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEnviarMensagem();
                }}
                placeholder="Fale no microfone ou digite aqui..."
                className="w-full h-12 rounded-2xl bg-zinc-900 border border-white/10 pl-4 pr-12 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
              />
              <button
                type="button"
                onClick={() => handleEnviarMensagem()}
                disabled={!inputTexto.trim()}
                className="absolute right-2 w-8 h-8 rounded-xl bg-amber-500 disabled:opacity-30 text-black flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                aria-label="Enviar"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal de Limite de Tempo Compartilhado */}
      <AnimatePresence>
        {cota.limiteModalAberto && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md rounded-3xl border border-amber-500/30 bg-zinc-900 p-6 text-center space-y-4 shadow-2xl"
            >
              <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-black text-white">Tempo Limite Atingido</h3>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  {cota.isPremium
                    ? 'Você utilizou seus 5 minutos diários com o professor ao vivo. Volte amanhã para mais explicações!'
                    : 'Você concluiu a demonstração gratuita de 1 minuto. Assine o PRIME para liberar 5 minutos diários de Gemini Live!'}
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                {!cota.isPremium && (
                  <button
                    type="button"
                    onClick={() => {
                      cota.setLimiteModalAberto(false);
                      setGateAberto(true);
                    }}
                    className="w-full h-12 rounded-2xl bg-amber-500 text-black font-black text-sm shadow hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Crown className="w-4 h-4" /> Assinar o PRIME
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    cota.setLimiteModalAberto(false);
                    onVoltar();
                  }}
                  className="w-full h-11 rounded-2xl border border-white/20 text-white font-bold text-xs hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Voltar ao Hub
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PremiumGate
        open={gateAberto}
        onClose={() => setGateAberto(false)}
        feature="explicacao"
        title="Me Explique Ilimitado Diário"
        description="Libere 5 minutos diários de conversação ao vivo com Gemini Live em todas as modalidades."
      />
    </div>
  );
};
