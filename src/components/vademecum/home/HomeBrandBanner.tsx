import { useState, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HomeBrandBannerProps {
  perfilLabel?: string;
}

const DEFAULT_SUBTITLES = [
  'Para Concurseiros',
  'Para Estudantes',
  'Para Advogados',
  'Uso Profissional',
  'Para Professores',
  'Para Servidores',
  'Para Magistrados',
];

const formatPerfilSubtitle = (label?: string): string | null => {
  if (!label) return null;
  const l = label.trim();
  if (/oab/i.test(l)) return 'Estudos para OAB';
  if (/concurs/i.test(l)) return 'Para Concurseiros';
  if (/advogad/i.test(l)) return 'Para Advogados';
  if (/faculdade|estudante/i.test(l)) return 'Para Estudantes de Direito';
  if (/magistrad|juiz/i.test(l)) return 'Para Magistrados';
  if (/servidor/i.test(l)) return 'Para Servidores';
  if (l.length <= 25) return l.startsWith('Para ') ? l : `Para ${l}`;
  return null;
};

const HomeBrandBanner = () => {
  return (
    <div className="flex flex-col items-center text-center gap-1 z-[10] relative w-[42%] max-w-[160px] ml-2 sm:ml-4">
      <div className="relative h-[75px] mb-1">
        <picture>
          <source srcSet="/logo-prime.webp" type="image/webp" />
          <img
            src="/logo-prime.png"
            alt="Direito Prime"
            loading="eager"
            decoding="async"
            width={75}
            height={75}
            fetchPriority="high"
            className="w-auto h-[75px] object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]"
          />
        </picture>
      </div>
      <h1 className="font-serif italic text-white text-[18px] sm:text-[20px] leading-[1.05] font-semibold tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] whitespace-nowrap">
        Estudos Jurídicos
      </h1>
      <p className="font-body text-white/95 text-[9px] sm:text-[10px] font-bold tracking-[0.25em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-1">
        USO PROFISSIONAL
      </p>
      
      <div className="mt-3 flex items-center text-left gap-2 w-full justify-center">
        <div className="w-[2px] h-7 bg-white/40 rounded-full" />
        <p className="font-serif italic text-white/80 text-[11px] sm:text-[12px] leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          Domine as leis,<br/>alcance seus objetivos.
        </p>
      </div>
    </div>
  );
};

export default memo(HomeBrandBanner);
