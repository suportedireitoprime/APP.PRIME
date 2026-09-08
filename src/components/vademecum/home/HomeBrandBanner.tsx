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
    <div className="flex flex-col items-start text-left gap-1 z-[10] relative w-3/5 pl-3 sm:pl-6">
      <div className="relative h-[80px] mb-1">
        <picture>
          <source srcSet="/logo-prime.webp" type="image/webp" />
          <img
            src="/logo-prime.png"
            alt="Direito Prime"
            loading="eager"
            decoding="async"
            width={80}
            height={80}
            fetchPriority="high"
            className="w-auto h-[80px] object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]"
          />
        </picture>
      </div>
      <h1 className="font-serif italic text-white text-[22px] sm:text-[26px] leading-[1.05] font-semibold tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
        Estudos Jurídicos
      </h1>
      <p className="font-body text-white/95 text-[10px] sm:text-[11px] font-bold tracking-[0.25em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
        PARA ESTUDANTES
      </p>
      
      <div className="mt-2 flex items-center gap-2.5">
        <div className="w-[3px] h-8 bg-[#e11d48] rounded-full" />
        <p className="font-serif italic text-white/90 text-[13px] sm:text-[14px] leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] max-w-[150px]">
          Disciplina hoje,<br/>liberdade amanhã.
        </p>
      </div>
    </div>
  );
};

export default memo(HomeBrandBanner);
