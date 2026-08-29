import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import cicero from '@/assets/filosofos/cicero.webp';
import aquino from '@/assets/filosofos/aquino.webp';
import montesquieu from '@/assets/filosofos/montesquieu.webp';
import kant from '@/assets/filosofos/kant.webp';
import kelsen from '@/assets/filosofos/kelsen.webp';
import platao from '@/assets/filosofos/platao.webp';
import aristoteles from '@/assets/filosofos/aristoteles.webp';
import rousseau from '@/assets/filosofos/rousseau.webp';
import locke from '@/assets/filosofos/locke.webp';
import beccaria from '@/assets/filosofos/beccaria.webp';
import ruibarbosa from '@/assets/filosofos/ruibarbosa.webp';
import hegel from '@/assets/filosofos/hegel.webp';

type Filosofo = { nome: string; img: string };

const FILOSOFOS: Filosofo[] = [
  { nome: 'Platão', img: platao },
  { nome: 'Aristóteles', img: aristoteles },
  { nome: 'Cícero', img: cicero },
  { nome: 'Tomás de Aquino', img: aquino },
  { nome: 'John Locke', img: locke },
  { nome: 'Montesquieu', img: montesquieu },
  { nome: 'Cesare Beccaria', img: beccaria },
  { nome: 'Jean-Jacques Rousseau', img: rousseau },
  { nome: 'Immanuel Kant', img: kant },
  { nome: 'Georg Hegel', img: hegel },
  { nome: 'Rui Barbosa', img: ruibarbosa },
  { nome: 'Hans Kelsen', img: kelsen },
];

if (typeof window !== 'undefined') {
  FILOSOFOS.forEach((f) => {
    const im = new Image();
    im.src = f.img;
  });
}

interface Props {
  typingHint?: string;
  onSearchClick?: () => void;
}

const DesktopBibliotecaHero = ({ typingHint = 'Procurar por autor, livro ou coleção...', onSearchClick }: Props) => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % FILOSOFOS.length), 5000);
    return () => clearInterval(id);
  }, []);

  const atual = FILOSOFOS[idx];

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        minHeight: '260px',
        background: 'linear-gradient(135deg, hsl(28 35% 22%) 0%, hsl(24 40% 30%) 50%, hsl(20 45% 18%) 100%)',
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,220,180,0.18),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.45),transparent_65%)]" />

      <svg aria-hidden viewBox="0 0 200 200" className="pointer-events-none absolute -left-3 -top-2 w-24 h-24 text-amber-300/25">
        <g fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="30" y="140" width="140" height="24" rx="3" />
          <rect x="45" y="112" width="120" height="24" rx="3" />
          <rect x="35" y="84" width="130" height="24" rx="3" />
          <line x1="55" y1="152" x2="55" y2="158" />
          <line x1="70" y1="124" x2="70" y2="130" />
          <line x1="60" y1="96" x2="60" y2="102" />
        </g>
      </svg>
      <svg aria-hidden viewBox="0 0 200 200" className="pointer-events-none absolute right-12 top-6 w-20 h-20 text-amber-300/20">
        <g fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="30" y="40" width="90" height="30" rx="4" transform="rotate(-25 75 55)" />
          <line x1="95" y1="95" x2="160" y2="160" />
          <rect x="120" y="150" width="60" height="14" rx="3" />
        </g>
      </svg>

      <div className="absolute right-[5%] bottom-0 h-full w-[40%] max-w-[400px] pointer-events-none opacity-40 mix-blend-luminosity">
        <AnimatePresence mode="popLayout">
          <motion.img
            key={atual.nome}
            src={atual.img}
            alt={atual.nome}
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 1.05 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="absolute right-0 bottom-0 h-[130%] min-h-[300px] w-auto object-contain object-bottom drop-shadow-2xl"
            style={{
              maskImage: 'linear-gradient(to right, transparent, black 20%, black 80%, transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 20%, black 80%, transparent)',
            }}
          />
        </AnimatePresence>
      </div>

      <div className="relative z-10 flex items-center h-full min-h-[260px] px-12 xl:px-20 2xl:px-28 py-8">
        <div className="flex w-full items-center justify-between gap-12">
          
          <div className="flex-1 max-w-3xl space-y-6">
            <div className="space-y-3">
              <h2 className="font-serif italic text-4xl xl:text-5xl font-bold text-white leading-[1.05] tracking-tight drop-shadow-md">
                Biblioteca Jurídica
              </h2>
              <p className="text-white/80 text-base xl:text-lg font-body leading-relaxed max-w-2xl">
                O seu acervo definitivo de obras, guias práticos, clássicos do Direito e coleções de desenvolvimento profissional.
              </p>
            </div>

            {/* Search bar */}
            <button
              onClick={onSearchClick}
              className="group relative w-full max-w-3xl flex items-center h-16 pl-6 pr-24 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 shadow-2xl hover:bg-black/50 hover:border-white/40 transition-colors text-left"
            >
              <Search className="w-5 h-5 text-amber-500 shrink-0 mr-3" />
              <span className="text-white/80 text-base xl:text-lg font-body truncate">
                {typingHint}
                <span className="animate-pulse text-amber-500">|</span>
              </span>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 h-12 px-5 rounded-xl bg-amber-600 text-white font-display font-bold text-sm flex items-center gap-2 shadow-lg shadow-black/40 group-hover:bg-amber-500 transition-colors">
                Pesquisar
              </span>
            </button>
            
            <p className="text-white/60 text-sm font-body flex items-center gap-2">
              <span className="text-amber-500">★</span> +2.000 livros em acervo permanente
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DesktopBibliotecaHero;
