import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { BookOpen, Radar, MessageCircle, Bell, Sparkles, ArrowRight, Layers, FileText } from 'lucide-react';
import { FILOSOFOS } from './versoes/triagemShared';

type Props = {
  nome: string;
  onDone: () => void;
  playSfx?: (k: 'tap' | 'whoosh' | 'ding') => void;
};

type Scene = {
  id: string;
  duration: number; // ms
  eyebrow: string;
  title: React.ReactNode;
  body: string;
  mock: React.ReactNode;
  bgImage: string;
};

const SERIF = 'Georgia, "Times New Roman", serif';
const YELLOW = '#F5C518';
const INK = '#0A0A0A';
const CREAM = '#FAF7EF';

// Componente visual: Raio rotativo sutil de fundo
function BackdropRays() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#0A0A0A]">
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ repeat: Infinity, duration: 40, ease: 'linear' }}
        className="absolute w-[200vw] h-[200vw] -top-[50vw] -left-[50vw] opacity-40 blur-[50px]"
        style={{
          background: `conic-gradient(from 0deg at 50% 50%,
            transparent 0deg,
            rgba(201, 76, 76, 0.15) 40deg,
            transparent 90deg,
            rgba(201, 76, 76, 0.12) 160deg,
            transparent 220deg,
            rgba(201, 76, 76, 0.18) 300deg,
            transparent 360deg)`,
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,_rgba(201,76,76,0.25)_0%,_transparent_60%)]" />
    </div>
  );
}

// Componente visual: Partículas
function Sparkles({ count = 30 }: { count?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-10">
      {Array.from({ length: count }).map((_, i) => {
        const size = 2 + (i % 4);
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${5 + (i * 13) % 90}%`,
              width: size,
              height: size,
              background: '#FFDD57',
              boxShadow: `0 0 ${size * 2}px ${YELLOW}`,
            }}
            initial={{ y: '110vh', opacity: 0 }}
            animate={{ y: '-20vh', opacity: [0, 1, 1, 0] }}
            transition={{
              repeat: Infinity,
              duration: 4 + (i % 5),
              delay: i * 0.2,
              ease: 'linear',
            }}
          />
        );
      })}
    </div>
  );
}

// Componente visual: Eyebrow igual do Hórus
function Eyebrow({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
      className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-[#C94C4C]/40 bg-[#C94C4C]/10 self-start shadow-xl"
    >
      <div className="w-2.5 h-2.5 rounded-full bg-[#F5C518] shadow-[0_0_12px_#F5C518]" />
      <span className="font-bold text-[11px] text-[#F5C518] tracking-[0.2em] uppercase">
        {text}
      </span>
    </motion.div>
  );
}

// Mock: Icone Estilizado
function IconMock({ Icon }: { Icon: any }) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.3 }}
      className="w-32 h-32 rounded-3xl bg-white/[0.04] border border-[#C94C4C]/30 flex items-center justify-center shadow-[0_24px_60px_rgba(0,0,0,0.5),inset_0_0_40px_rgba(201,76,76,0.15)] relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
      <Icon className="w-12 h-12 text-[#F5C518] drop-shadow-[0_0_15px_rgba(245,197,24,0.5)] relative z-10" />
    </motion.div>
  );
}

// Mock: Chat Hórus (simplificado)
function ChatMock() {
  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.3 }}
      className="w-64 rounded-3xl bg-[#0b141a] border-[4px] border-[#222] shadow-[0_40px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(201,76,76,0.3)] overflow-hidden"
    >
      <div className="bg-[#202c33] p-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#F5C518] text-[#0A0A0A] flex items-center justify-center font-bold text-sm">H</div>
        <div>
          <div className="text-white text-xs font-bold">Horus</div>
          <div className="text-[#25D366] text-[9px]">online</div>
        </div>
      </div>
      <div className="p-4 space-y-3 flex flex-col">
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} className="self-end bg-[#005c4b] text-white text-[11px] p-2 rounded-lg rounded-tr-sm max-w-[85%]">
          O que é usucapião?
        </motion.div>
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 }} className="self-start bg-[#202c33] text-white text-[11px] p-2 rounded-lg rounded-tl-sm max-w-[85%]">
          Quando alguém vira dono pelo uso prolongado...
        </motion.div>
      </div>
    </motion.div>
  );
}

function build(nome: string): Scene[] {
  const primeiro = (nome.trim().split(' ')[0] || '').slice(0, 14);
  return [
    {
      id: 'saudacao',
      duration: 3500,
      eyebrow: 'PRAZER EM TE CONHECER',
      title: primeiro ? <>Olá, <span className="italic" style={{ color: YELLOW }}>{primeiro}</span>.</> : <>Bem-vindo(a).</>,
      body: 'Em poucos segundos você vê tudo que o Direito Prime faz por você.',
      mock: <IconMock Icon={Sparkles} />,
      bgImage: FILOSOFOS[0].src,
    },
    {
      id: 'biblioteca',
      duration: 4000,
      eyebrow: '01 · BIBLIOTECA',
      title: <>Milhares de livros <span className="italic" style={{ color: YELLOW }}>num só lugar.</span></>,
      body: 'Códigos comentados, doutrina clássica e resumos, sempre à mão.',
      mock: <IconMock Icon={BookOpen} />,
      bgImage: FILOSOFOS[1].src,
    },
    {
      id: 'flashcards',
      duration: 4000,
      eyebrow: '02 · FLASHCARDS',
      title: <>Repetição <span className="italic" style={{ color: YELLOW }}>espaçada.</span></>,
      body: 'Mais de 100 mil cards pra você fixar o que importa de vez.',
      mock: <IconMock Icon={Layers} />,
      bgImage: FILOSOFOS[2].src,
    },
    {
      id: 'radar',
      duration: 4000,
      eyebrow: '03 · RADAR DE LEIS',
      title: <>Toda lei nova,<br /><span className="italic" style={{ color: YELLOW }}>já resumida.</span></>,
      body: 'Nós monitoramos Diários e o Congresso — você lê só o que cai.',
      mock: <IconMock Icon={Radar} />,
      bgImage: FILOSOFOS[3].src,
    },
    {
      id: 'horus',
      duration: 5000,
      eyebrow: '04 · HORUS NO WHATSAPP',
      title: <>Seu assistente <span className="italic" style={{ color: YELLOW }}>24h no bolso.</span></>,
      body: 'Tira dúvidas por texto, áudio ou foto direto no WhatsApp.',
      mock: <ChatMock />,
      bgImage: FILOSOFOS[4].src,
    },
    {
      id: 'final',
      duration: 999999, // Fica parado aguardando o usuário clicar
      eyebrow: 'TUDO PRONTO',
      title: primeiro ? <>Bora estudar, <span className="italic" style={{ color: YELLOW }}>{primeiro}!</span></> : <>Bora estudar!</>,
      body: 'Seu Direito Prime já está personalizado e pronto.',
      mock: <IconMock Icon={Sparkles} />,
      bgImage: FILOSOFOS[5].src,
    },
  ];
}

function CadastroFeaturesReelInner({ nome, onDone, playSfx }: Props) {
  const scenes = useMemo(() => build(nome), [nome]);
  const [i, setI] = useState(0);
  const [saindo, setSaindo] = useState(false);
  const reduce = useReducedMotion();

  const finalizar = useCallback(() => {
    setSaindo((prev) => {
      if (prev) return prev;
      playSfx?.('ding');
      onDone();
      return true;
    });
  }, [onDone, playSfx]);

  const proximo = useCallback(() => {
    setI((v) => {
      if (v >= scenes.length - 1) {
        finalizar();
        return v;
      }
      playSfx?.('whoosh');
      return v + 1;
    });
  }, [scenes.length, finalizar, playSfx]);

  const anterior = useCallback(() => {
    setI((v) => {
      if (v > 0) playSfx?.('whoosh');
      return v > 0 ? v - 1 : v;
    });
  }, [playSfx]);

  // Avanço automático das cenas (exceto a última que aguarda clique)
  useEffect(() => {
    if (saindo || i === scenes.length - 1) return;
    const s = scenes[i];
    if (!s) return;
    const t = setTimeout(proximo, s.duration);
    return () => clearTimeout(t);
  }, [i, scenes, proximo, saindo]);

  const cur = scenes[i];
  const ultima = i === scenes.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] overflow-hidden bg-[#0A0A0A] text-[#FAF7EF] select-none font-sans"
    >
      <BackdropRays />

      {/* Imagem de Fundo Vazada (Filósofos) */}
      <div className="absolute inset-0 z-0 overflow-hidden opacity-[0.08] pointer-events-none flex items-center justify-center">
        <AnimatePresence mode="wait">
          {cur && (
            <motion.img
              key={cur.bgImage}
              src={cur.bgImage}
              initial={{ opacity: 0, scale: 1.05, x: 15 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: -15 }}
              transition={{ duration: 2.5, ease: "easeOut" }}
              className="w-auto h-[120%] object-contain"
            />
          )}
        </AnimatePresence>
      </div>

      <Sparkles />

      {/* Touch zones */}
      <button aria-label="Voltar" onClick={anterior} className="absolute left-0 top-0 z-20 h-full w-1/3" tabIndex={-1} />
      <button aria-label="Avançar" onClick={proximo} className="absolute right-0 top-0 z-20 h-full w-2/3" tabIndex={-1} />

      {/* Barra de progresso superior */}
      <div className="absolute inset-x-0 z-30 flex items-center gap-1.5 px-6" style={{ top: 'calc(env(safe-area-inset-top,0px) + 20px)' }}>
        {scenes.map((s, idx) => (
          <div key={s.id} className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[#F5C518]"
              style={{ width: idx < i ? '100%' : '0%' }}
              initial={idx === i ? { width: '0%' } : false}
              animate={{ width: idx < i ? '100%' : idx === i ? (ultima ? '100%' : '100%') : '0%' }}
              transition={idx === i && !ultima ? { duration: s.duration / 1000, ease: 'linear' } : { duration: 0.3 }}
            />
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={cur.id}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 h-full flex flex-col pointer-events-none px-8"
        >
          {/* Mock visual no topo */}
          <div
            className="relative flex-[1.2] flex items-end justify-center"
            style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 60px)', paddingBottom: '30px' }}
          >
            {cur.mock}
          </div>

          {/* Textos embaixo */}
          <div className="relative flex-1 flex flex-col justify-start pb-8">
            <Eyebrow text={cur.eyebrow} />
            
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mt-6 font-black leading-[1.05] tracking-tight text-[#FAF7EF]"
              style={{ fontFamily: SERIF, fontSize: 'clamp(2.2rem, 8vw, 3.5rem)' }}
            >
              {cur.title}
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="mt-4 text-[#FAF7EF]/70 font-medium max-w-sm"
              style={{ fontSize: 'clamp(1rem, 4vw, 1.15rem)', lineHeight: 1.5 }}
            >
              {cur.body}
            </motion.p>

            {ultima && (
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: 'spring' }}
                onClick={finalizar}
                disabled={saindo}
                className="pointer-events-auto mt-8 h-14 w-full max-w-sm rounded-2xl bg-[#C94C4C] text-[#150C05] font-black tracking-wide flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60 shadow-2xl"
              >
                {saindo ? 'Preparando...' : 'Entrar no App'}
                {!saindo && <ArrowRight className="w-5 h-5" />}
              </motion.button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

export default memo(CadastroFeaturesReelInner);
