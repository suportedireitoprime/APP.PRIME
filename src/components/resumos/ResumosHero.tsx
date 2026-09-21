import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, NotebookText, ChevronRight } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import HeroMotifs from '@/components/vademecum/home/HeroMotifs';
import { motion, AnimatePresence } from 'framer-motion';

// Carrega dinamicamente qualquer imagem .webp que estiver na pasta docs/filosofos
const modules = import.meta.glob('../../../docs/filosofos/*.webp', { eager: true, import: 'default' });

const QUOTES_DB: Record<string, {name: string, quote: string}> = {
  'aristoteles': { name: 'Aristóteles', quote: 'A lei é a razão livre da paixão.' },
  'friedrich nietzsche': { name: 'Friedrich Nietzsche', quote: 'Aquele que tem um porquê para viver pode suportar quase qualquer como.' },
  'nietzsche': { name: 'Friedrich Nietzsche', quote: 'Aquele que tem um porquê para viver pode suportar quase qualquer como.' },
  'immanuel kant': { name: 'Immanuel Kant', quote: 'Age como se a máxima de tua ação devesse tornar-se uma lei universal.' },
  'kant': { name: 'Immanuel Kant', quote: 'Age como se a máxima de tua ação devesse tornar-se uma lei universal.' },
  'platao': { name: 'Platão', quote: 'O que faz a justiça é que cada um faça a sua parte.' },
  'rene descartes': { name: 'René Descartes', quote: 'Penso, logo existo.' },
  'descartes': { name: 'René Descartes', quote: 'Penso, logo existo.' },
  'santo agostinho': { name: 'Santo Agostinho', quote: 'Uma lei injusta não é lei alguma.' },
  'agostinho': { name: 'Santo Agostinho', quote: 'Uma lei injusta não é lei alguma.' },
  'simone de beauvoir': { name: 'Simone de Beauvoir', quote: 'Que a liberdade seja a nossa própria substância.' },
  'beauvoir': { name: 'Simone de Beauvoir', quote: 'Que a liberdade seja a nossa própria substância.' },
  'seneca': { name: 'Sêneca', quote: 'Nenhuma lei agrada a todos.' },
  'socrates': { name: 'Sócrates', quote: 'É melhor sofrer uma injustiça do que cometê-la.' },
  'tomas de aquino': { name: 'Tomás de Aquino', quote: 'A lei é uma ordenação da razão para o bem comum.' },
  'aquino': { name: 'Tomás de Aquino', quote: 'A lei é uma ordenação da razão para o bem comum.' },
};

const normalizeName = (name: string) => {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

const PHILOSOPHERS = Object.entries(modules).map(([path, img]) => {
  const filename = path.split('/').pop()?.replace('.webp', '') || '';
  const normalizedKey = normalizeName(filename);
  const info = QUOTES_DB[normalizedKey] || { 
    name: filename.replace(/_/g, ' '), 
    quote: 'A sabedoria começa na reflexão.' 
  };
  return { ...info, img: img as string };
});

if (PHILOSOPHERS.length === 0) {
  PHILOSOPHERS.push({
    name: 'Resumos Jurídicos',
    quote: 'O conhecimento destilado.',
    img: ''
  });
}

const HINTS = [
  'Pesquise qualquer matéria...',
  'Pesquise uma lei...',
  'Pesquise súmulas...',
  'Pesquise conceitos...',
  'Pesquise por voz...',
];

const TypingHint = () => {
  const [text, setText] = useState('');
  const [hintIndex, setHintIndex] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'paused' | 'erasing'>('typing');

  useEffect(() => {
    const current = HINTS[hintIndex];
    let timer: ReturnType<typeof setTimeout>;

    if (phase === 'typing') {
      if (text.length < current.length) {
        timer = setTimeout(() => setText(current.slice(0, text.length + 1)), 90);
      } else {
        timer = setTimeout(() => setPhase('paused'), 1500);
      }
    } else if (phase === 'paused') {
      timer = setTimeout(() => setPhase('erasing'), 100);
    } else if (phase === 'erasing') {
      if (text.length > 0) {
        timer = setTimeout(() => setText(text.slice(0, text.length - 1)), 50);
      } else {
        setHintIndex((i) => (i + 1) % HINTS.length);
        setPhase('typing');
      }
    }

    return () => clearTimeout(timer);
  }, [text, hintIndex, phase]);

  return (
    <span className="inline-flex items-center">
      {text}
      <span className="ml-0.5 inline-block w-[2px] h-[14px] bg-white/80 animate-pulse" />
    </span>
  );
};

interface Props {
  onBuscar?: () => void;
  q?: string;
  setQ?: (val: string) => void;
  totalResumos?: number;
  totalAreas?: number;
  totalTemas?: number;
}

const ResumosHero = ({
  onBuscar,
  q,
  setQ,
  totalResumos = 4359,
  totalAreas = 29,
  totalTemas = 527,
}: Props) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const nextIndex = (currentIndex + 1) % PHILOSOPHERS.length;
    if (PHILOSOPHERS[nextIndex]?.img) {
      const img = new Image();
      img.src = PHILOSOPHERS[nextIndex].img;
    }

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PHILOSOPHERS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [currentIndex]);

  const currentPhil = PHILOSOPHERS[currentIndex];

  return (
    <div
      className="bg-hero-panel relative overflow-hidden rounded-b-[36px] shadow-2xl shadow-black/60 pt-[var(--sai-top)] flex flex-col z-20"
      style={{
        transform: 'translateZ(0)',
        backgroundColor: '#050505',
      }}
    >
      {/* Blindagem de overscroll superior contra vazamento do fundo */}
      <div
        className="pointer-events-none absolute -top-[1200px] left-0 right-0 h-[1200px] z-0"
        style={{ backgroundColor: '#050505' }}
        aria-hidden="true"
      />

      {/* Imagem de Fundo (Carrossel) */}
      <AnimatePresence>
        {currentPhil?.img && (
          <motion.img
            key={currentPhil.img}
            src={currentPhil.img}
            alt={currentPhil.name}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="absolute top-0 bottom-0 right-0 h-full w-auto object-contain object-right-bottom z-0 pointer-events-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
          />
        )}
      </AnimatePresence>

      {/* Overlay vermelho com gradiente estilo menu e sombra */}
      <div 
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{ filter: 'drop-shadow(25px 0 25px rgba(0,0,0,0.8)) drop-shadow(8px 0 10px rgba(0,0,0,0.95))' }}
      >
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: 'polygon(0 0, 47% 0, 36% 100%, 0% 100%)' }}
        >
          <div className="absolute inset-0 bg-hero-panel" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,180,180,0.22),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.5),transparent_65%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

          <HeroMotifs />

          {/* Grid Pattern Background */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }} />
        </div>
      </div>

      {/* Botões do topo absolutos */}
      <header className="absolute top-0 right-0 left-0 z-30 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] pointer-events-none">
        <div className="pointer-events-auto px-4 pb-2 pt-2 flex items-center justify-between">
          <button
            onClick={() => { haptic.selection(); navigate('/'); }}
            aria-label="Voltar"
            className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:scale-95"
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
          </button>
        </div>
      </header>

      {/* Conteúdo idêntico à altura da Home (Textos animando) */}
      <div className="relative z-10 pt-8 sm:pt-10 flex-1 flex flex-col justify-start min-h-[100px]">
        <div className="flex flex-col items-center text-center gap-1 z-[10] relative w-[48%] max-w-[200px] ml-2 sm:ml-4">
          <div className="h-[20px] sm:h-[40px] mb-1 w-full" />
          
          <div className="w-full flex flex-col items-center">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-3 flex items-center justify-center rounded-[20px] bg-white/15 backdrop-blur-md border border-white/20 shadow-xl">
              <NotebookText className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-md" strokeWidth={1.5} />
            </div>
            <h1 className="font-display text-white text-[18px] sm:text-[22px] leading-[1.05] font-black tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] uppercase text-center w-full max-w-[160px] sm:max-w-[200px]">
              Resumos Jurídicos
            </h1>
            <p className="mt-1.5 font-body text-white/90 text-[10px] sm:text-[11px] font-semibold tracking-wide uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
              Inteligentes e Estruturados
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-3 sm:px-5 pt-6 pb-2">
         {/* Estatísticas (Total Resumos, Áreas, Temas) */}
         <div className="relative mt-1 rounded-[20px] bg-[#0A0A0A] text-white shadow-xl ring-1 ring-white/5 overflow-hidden mx-1">
          <div className="grid grid-cols-3 divide-x divide-white/5">
            {/* Box 1: Total Resumos */}
            <div className="flex flex-col items-center justify-center px-1.5 py-3.5 transition-colors hover:bg-white/5 active:scale-95 group select-none relative overflow-hidden">
              <div className="flex items-center gap-0.5">
                <span className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-widest text-white/50 group-hover:text-white transition-colors">
                  Total Resumos
                </span>
                <ChevronRight className="w-2.5 h-2.5 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
              </div>
              <span className="mt-1 font-display text-[15px] sm:text-[17px] font-black leading-none text-white [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]">
                {totalResumos.toLocaleString('pt-BR')}
              </span>
              <NotebookText className="pointer-events-none absolute -bottom-1 -left-1 h-8 w-8 text-white/5" />
            </div>

            {/* Box 2: Total Áreas */}
            <div className="flex flex-col items-center justify-center px-1.5 py-3.5 transition-colors hover:bg-white/5 active:scale-95 group select-none">
              <div className="flex items-center gap-0.5">
                <span className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-widest text-white/50 group-hover:text-white transition-colors">
                  Total Áreas
                </span>
                <ChevronRight className="w-2.5 h-2.5 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
              </div>
              <span className="mt-1 font-display text-[15px] sm:text-[17px] font-black leading-none text-white [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]">
                {totalAreas.toLocaleString('pt-BR')}
              </span>
            </div>

            {/* Box 3: Total Temas */}
            <div className="flex flex-col items-center justify-center px-1.5 py-3.5 transition-colors hover:bg-white/5 active:scale-95 group select-none">
              <div className="flex items-center gap-0.5">
                <span className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-widest text-white/50 group-hover:text-white transition-colors">
                  Total Temas
                </span>
                <ChevronRight className="w-2.5 h-2.5 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
              </div>
              <span className="mt-1 font-display text-[15px] sm:text-[17px] font-black leading-none text-white [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]">
                {totalTemas.toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-4 sm:px-6 w-full pb-5">
        {/* Search bar */}
        {setQ ? (
          <div className="relative w-full flex items-center h-[56px] pl-[52px] pr-[104px] rounded-[18px] bg-[#0A0A0A]/90 backdrop-blur-md border border-white/5 shadow-xl focus-within:border-primary/50 transition-colors search-bar-shine">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[22px] h-[22px] text-primary shrink-0" strokeWidth={2.2} />
            <input
              value={q || ''}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Pesquise uma lei..."
              className="w-full h-full bg-transparent text-white font-body text-[14.5px] font-medium outline-none placeholder:text-white/40"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 h-11 px-4 rounded-[14px] bg-hero-panel text-white font-display text-[12px] font-bold tracking-wider flex items-center justify-center shadow-md shadow-black/40">
              PESQUISAR
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onBuscar}
            aria-label="Pesquisar resumos"
            className="relative w-full flex items-center h-[56px] pl-[52px] pr-[104px] rounded-[18px] bg-[#0A0A0A]/90 backdrop-blur-md border border-white/5 shadow-xl active:scale-[0.99] transition search-bar-shine"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[22px] h-[22px] text-primary shrink-0" strokeWidth={2.2} />
            <span className="relative z-[2] font-body text-white/70 text-[14.5px] font-medium truncate text-left">
              <TypingHint />
            </span>
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 h-11 px-4 rounded-[14px] bg-hero-panel text-white font-display text-[12px] font-bold tracking-wider flex items-center justify-center shadow-md shadow-black/40 active:scale-95 transition">
              PESQUISAR
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default ResumosHero;
