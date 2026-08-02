import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, NotebookText } from 'lucide-react';
import res1 from '@/assets/resumos-hero/res-1.png.asset.json';
import res2 from '@/assets/resumos-hero/res-2.png.asset.json';
import res3 from '@/assets/resumos-hero/res-3.png.asset.json';
import { srcOf } from '@/lib/assetUrl';

const FIGURAS = [srcOf(res1), srcOf(res2), srcOf(res3)];
const POSICOES = ['right', 'left', 'center'] as const;

const SUBTITULOS = [
  'Resumos por Área',
  'Temas e Subtemas',
  'Estudo Rápido',
  'Direto ao Ponto',
];

interface Props {
  onBuscar: () => void;
  titulo?: string;
  voltarPara?: string;
}

const ResumosHero = ({ onBuscar, titulo = 'Resumos Jurídicos', voltarPara = '/' }: Props) => {
  const navigate = useNavigate();
  const [figIndex, setFigIndex] = useState(() => Math.floor(Math.random() * FIGURAS.length));
  const [subIndex, setSubIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setFigIndex((i) => (i + 1) % FIGURAS.length), 7000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSubIndex((i) => (i + 1) % SUBTITULOS.length), 3200);
    return () => clearInterval(t);
  }, []);

  const pos = POSICOES[figIndex % POSICOES.length];
  const posClass =
    pos === 'right'
      ? 'right-[4%] left-auto'
      : pos === 'left'
      ? 'left-[4%] right-auto'
      : 'left-1/2 -translate-x-1/2';

  return (
    <div
      className="bg-hero-panel-cyan relative overflow-hidden rounded-b-[36px] border-b border-white/10 shadow-2xl shadow-black/60 pt-[var(--sai-top,env(safe-area-inset-top,0px))]"
      style={{ transform: 'translateZ(0)', isolation: 'isolate', contain: 'paint' }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(190,245,255,0.22),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.5),transparent_65%)]" />

      {/* Figuras vazadas */}
      <div className="pointer-events-none absolute inset-0 select-none overflow-hidden">
        <AnimatePresence initial={false}>
          <motion.img
            key={figIndex}
            src={FIGURAS[figIndex]}
            alt=""
            aria-hidden
            width={1024}
            height={1024}
            loading="eager"
            decoding="async"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 0.16, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className={`absolute bottom-0 h-[85%] w-auto object-contain ${posClass}`}
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </AnimatePresence>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

      <header className="relative px-3 pt-3 md:px-6 md:pt-6 flex items-center gap-2">
        <button
          onClick={() => navigate(voltarPara)}
          aria-label="Voltar"
          className="w-11 h-11 rounded-full bg-black/40 border border-white/20 backdrop-blur-md flex items-center justify-center active:scale-95 transition"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <p className="font-display text-white text-[15px] font-bold tracking-wide drop-shadow">
          Resumos
        </p>
      </header>

      <div className="relative px-4 pt-4 pb-5 min-h-[240px] flex flex-col gap-4">
        <div className="flex flex-col items-center text-center gap-2 pt-1">
          <div className="relative w-20 h-20 rounded-full border border-white/90 bg-white/10 backdrop-blur-sm flex items-center justify-center overflow-hidden shadow-[0_6px_18px_rgba(0,0,0,0.45)] logo-shine">
            <NotebookText className="w-9 h-9 text-white" strokeWidth={1.6} />
          </div>
          <h1 className="font-display text-white text-[28px] leading-none font-black tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
            {titulo}
          </h1>
          <div className="relative h-[16px] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={subIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="font-body text-white/85 text-[12.5px] font-medium tracking-wide uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] whitespace-nowrap"
              >
                {SUBTITULOS[subIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <button
          type="button"
          onClick={onBuscar}
          aria-label="Pesquisar resumos"
          className="mt-auto relative w-full flex items-center h-16 pl-14 pr-[112px] rounded-2xl bg-black/45 backdrop-blur-md border border-white/25 shadow-lg shadow-black/30 active:scale-[0.99] transition search-bar-shine"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-white shrink-0" strokeWidth={2.2} />
          <span className="relative z-[2] font-body text-white/70 text-[15px] font-medium truncate text-left">
            Pesquise o resumo...
          </span>
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 h-12 px-5 rounded-xl bg-hero-panel-cyan text-white font-display text-[13px] font-bold tracking-wider flex items-center justify-center shadow-md">
            PESQUISAR
          </div>
        </button>
      </div>

      <NotebookText className="pointer-events-none absolute bottom-3 left-3 w-8 h-8 text-white/15" />
    </div>
  );
};

export default ResumosHero;
