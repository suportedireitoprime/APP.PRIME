import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { BookOpen, Radar, MessageCircle, Bell, Sparkles, ArrowRight, Layers } from 'lucide-react';

type Props = {
  nome: string;
  onDone: () => void;
  playSfx?: (k: 'tap' | 'whoosh' | 'ding') => void;
};

type Scene = {
  id: string;
  duration: number; // ms
  glow: string;
  eyebrow: string;
  title: React.ReactNode;
  body: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const SERIF = 'Georgia, "Times New Roman", serif';

function build(nome: string): Scene[] {
  const primeiro = (nome.trim().split(' ')[0] || '').slice(0, 14);
  return [
    {
      id: 'saudacao',
      duration: 1700,
      glow: 'rgba(242, 96, 96, 0.55)',
      eyebrow: 'PRAZER EM TE CONHECER',
      title: primeiro ? (
        <>
          Olá, <span className="italic">{primeiro}</span>.
        </>
      ) : (
        <>Bem-vindo(a).</>
      ),
      body: 'Em 10 segundos você vê tudo que o Direito Prime faz por você.',
      Icon: Sparkles,
    },
    {
      id: 'biblioteca',
      duration: 1900,
      glow: 'rgba(242, 96, 96, 0.45)',
      eyebrow: '01 · BIBLIOTECA',
      title: (
        <>
          Milhares de livros
          <br />
          <span className="italic">num só lugar.</span>
        </>
      ),
      body: 'Códigos comentados, doutrina clássica e resumos, sempre à mão.',
      Icon: BookOpen,
    },
    {
      id: 'flashcards',
      duration: 1900,
      glow: 'rgba(255, 128, 96, 0.45)',
      eyebrow: '02 · FLASHCARDS',
      title: (
        <>
          Mais de 100 mil cards
          <br />
          <span className="italic">pra fixar de vez.</span>
        </>
      ),
      body: 'Estude por área, monte decks e acompanhe seu progresso.',
      Icon: Layers,
    },
    {
      id: 'radar',
      duration: 1900,
      glow: 'rgba(226, 74, 74, 0.5)',
      eyebrow: '03 · RADAR DE LEIS',
      title: (
        <>
          Toda lei nova,
          <br />
          <span className="italic">com resumo pronto.</span>
        </>
      ),
      body: 'A gente monitora Diários e o Congresso — você lê só o que importa.',
      Icon: Radar,
    },
    {
      id: 'horus',
      duration: 1900,
      glow: 'rgba(255, 110, 110, 0.5)',
      eyebrow: '04 · HORUS NO WHATSAPP',
      title: (
        <>
          Seu assistente
          <br />
          <span className="italic">24h no bolso.</span>
        </>
      ),
      body: 'Tira dúvidas por texto, foto ou áudio direto no WhatsApp.',
      Icon: MessageCircle,
    },
    {
      id: 'notificacoes',
      duration: 1800,
      glow: 'rgba(200, 60, 60, 0.5)',
      eyebrow: '05 · NOTIFICAÇÕES',
      title: (
        <>
          Só o que interessa,
          <br />
          <span className="italic">nada de spam.</span>
        </>
      ),
      body: 'Alertas da sua área, no seu ritmo. Você escolhe o que chega.',
      Icon: Bell,
    },
    {
      id: 'final',
      duration: 2400,
      glow: 'rgba(242, 96, 96, 0.6)',
      eyebrow: 'TUDO PRONTO',
      title: primeiro ? (
        <>
          Bora estudar,
          <br />
          <span className="italic">{primeiro}!</span>
        </>
      ) : (
        <>Bora estudar!</>
      ),
      body: 'Seu Direito Prime já está personalizado.',
      Icon: Sparkles,
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
    setI((v) => (v > 0 ? v - 1 : v));
  }, []);

  useEffect(() => {
    if (saindo) return;
    const s = scenes[i];
    if (!s) return;
    const t = setTimeout(proximo, s.duration);
    return () => clearTimeout(t);
  }, [i, scenes, proximo, saindo]);

  const cur = scenes[i];
  const Icon = cur.Icon;
  const ultima = i === scenes.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] overflow-hidden bg-[#0B0B0C] text-white select-none"
    >
      {/* Glow de fundo — muda de intensidade a cada cena */}
      <motion.div
        className="pointer-events-none absolute inset-0 transition-colors duration-700 ease-in-out"
        style={{
          background: `radial-gradient(ellipse 80% 55% at 50% 26%, ${cur.glow} 0%, rgba(20,8,8,0.55) 45%, #0B0B0C 78%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.6) 1px, transparent 1px, transparent 3px)',
        }}
      />

      {/* Zonas de toque: esquerda volta, direita avança */}
      <button
        aria-label="Voltar"
        onClick={anterior}
        className="absolute left-0 top-0 z-20 h-full w-1/3"
        tabIndex={-1}
      />
      <button
        aria-label="Avançar"
        onClick={proximo}
        className="absolute right-0 top-0 z-20 h-full w-2/3"
        tabIndex={-1}
      />

      {/* Barra de progresso */}
      <div
        className="absolute inset-x-0 z-30 flex items-center gap-1.5 px-4"
        style={{ top: 'calc(env(safe-area-inset-top,0px) + 14px)' }}
      >
        {scenes.map((s, idx) => (
          <div key={s.id} className="flex-1 h-[3px] rounded-full bg-white/15 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: 'hsl(var(--primary))',
                width: idx < i ? '100%' : undefined,
              }}
              initial={idx === i ? { width: '0%' } : false}
              animate={{ width: idx <= i ? '100%' : '0%' }}
              transition={
                idx === i && !reduce
                  ? { duration: s.duration / 1000, ease: 'linear' }
                  : { duration: 0.2 }
              }
              key={idx === i ? `${s.id}-run-${i}` : `${s.id}-static`}
            />
          </div>
        ))}
      </div>

      {/* Pular */}
      <button
        onClick={finalizar}
        disabled={saindo}
        className="absolute z-40 right-4 h-9 px-4 rounded-full bg-white/10 border border-white/15 backdrop-blur text-white/90 text-[11px] font-bold tracking-[0.2em] active:scale-95 disabled:opacity-50"
        style={{ top: 'calc(env(safe-area-inset-top,0px) + 30px)' }}
      >
        {saindo ? 'ABRINDO…' : 'PULAR'}
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={cur.id}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -14 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 h-full flex flex-col pointer-events-none"
        >
          {/* Ícone */}
          <div
            className="relative flex-1 flex items-end justify-center"
            style={{
              paddingTop: 'calc(env(safe-area-inset-top,0px) + 80px)',
              paddingBottom: '24px',
            }}
          >
            <motion.div
              initial={reduce ? {} : { scale: 0.82, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="rounded-[34px] flex items-center justify-center"
              style={{
                width: 'min(40vw, 168px)',
                height: 'min(40vw, 168px)',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid hsl(var(--primary) / 0.45)',
                boxShadow: '0 24px 60px rgba(0,0,0,0.5), inset 0 0 40px hsl(var(--primary) / 0.18)',
              }}
            >
              <Icon className="w-[42%] h-[42%] text-primary" />
            </motion.div>
          </div>

          {/* Texto */}
          <div
            className="relative flex-1 px-7 flex flex-col justify-start"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 32px)' }}
          >
            <motion.div
              initial={reduce ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06, duration: 0.3 }}
              className="text-[10px] font-black tracking-[0.4em] mb-3 text-primary"
            >
              {cur.eyebrow}
            </motion.div>
            <motion.h2
              initial={reduce ? {} : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.34 }}
              className="font-black leading-[0.95] tracking-tight text-foreground"
              style={{ fontFamily: SERIF, fontSize: 'clamp(2.1rem, 7.6vw, 3.2rem)' }}
            >
              {cur.title}
            </motion.h2>
            <motion.p
              initial={reduce ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.32 }}
              className="mt-4 max-w-md text-white/70"
              style={{ fontSize: 'clamp(0.92rem, 3.5vw, 1.05rem)', lineHeight: 1.45 }}
            >
              {cur.body}
            </motion.p>

            {ultima && (
              <motion.button
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                onClick={finalizar}
                disabled={saindo}
                className="pointer-events-auto mt-7 h-14 w-full max-w-md rounded-2xl bg-primary text-primary-foreground font-black tracking-wide flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60"
              >
                {saindo ? 'Abrindo o app…' : 'Entrar no app'}
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
