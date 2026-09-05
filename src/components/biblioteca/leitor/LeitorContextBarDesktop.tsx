import React from 'react';
import { motion } from 'framer-motion';
import type { Pagina } from '@/hooks/domain/useLeitorPaginas';

interface LeitorContextBarDesktopProps {
  currentPage: Pagina;
  currentIndex: number;
  paginasLength: number;
  tocRailW: number;
  fnRailW: number;
  tema: {
    bg: string;
    text: string;
    border: string;
  };
  dark: boolean;
}

export const LeitorContextBarDesktop: React.FC<LeitorContextBarDesktopProps> = ({
  currentPage,
  currentIndex,
  paginasLength,
  tocRailW,
  fnRailW,
  tema,
  dark,
}) => {
  return (
    <div
      className="hidden md:flex items-center gap-4 shrink-0 border-t px-6 text-[12px] backdrop-blur"
      style={{
        height: 40,
        marginLeft: tocRailW,
        marginRight: fnRailW,
        background: dark ? 'rgba(0,0,0,0.28)' : `${tema.bg}cc`,
        borderColor: tema.border,
        color: tema.text,
      }}
    >
      <span className="truncate opacity-70 max-w-[38%]">{currentPage.chapterTitulo}</span>
      <span className="opacity-40">·</span>
      <span className="tabular-nums opacity-70">
        pág. {currentIndex + 1} de {paginasLength}
      </span>
      <div
        className={`flex-1 h-1 rounded-full overflow-hidden ${dark ? 'bg-white/10' : 'bg-black/10'}`}
      >
        <motion.div
          className="h-full w-full bg-primary"
          style={{ transformOrigin: 'left' }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: (currentIndex + 1) / paginasLength }}
          transition={{ type: 'tween', ease: 'easeOut', duration: 0.15 }}
        />
      </div>
      <span className="tabular-nums opacity-70">
        {Math.round(((currentIndex + 1) / paginasLength) * 100)}% lido
      </span>
      <span className="opacity-40">·</span>
      <span className="tabular-nums opacity-70">
        ≈ {Math.max(1, Math.round((paginasLength - currentIndex - 1) * 1.5))} min restantes
      </span>
      <span className="opacity-40 hidden xl:inline">·</span>
      <span className="opacity-45 hidden xl:inline">
        ← → páginas · T sumário · A ajustes · F foco
      </span>
    </div>
  );
};
