import React from 'react';
import { ArrowLeft, Share2 } from 'lucide-react';

interface LeitorHeaderProps {
  titulo: string;
  headerSub: string | null;
  onClose: () => void;
  onShare: () => void;
  isDesktop: boolean;
  focoOn: boolean;
  dark: boolean;
  status: string;
  tocRailW: number;
  fnRailW: number;
  tema: {
    bg: string;
    text: string;
    border: string;
  };
}

export const LeitorHeader: React.FC<LeitorHeaderProps> = ({
  titulo,
  headerSub,
  onClose,
  onShare,
  isDesktop,
  focoOn,
  dark,
  status,
  tocRailW,
  fnRailW,
  tema,
}) => {
  return (
    <header
      className="flex items-center gap-3 px-4 py-3.5 md:py-2 shrink-0 border-b backdrop-blur"
      style={{
        paddingTop: isDesktop ? '0.5rem' : 'calc(var(--sai-top) + 0.875rem)',
        minHeight: isDesktop ? '3.5rem' : 'calc(5rem + var(--sai-top))',
        display: focoOn ? 'none' : undefined,
        paddingLeft:
          isDesktop && status === 'pronto' && tocRailW
            ? `calc(${tocRailW}px + 1rem)`
            : undefined,
        paddingRight:
          isDesktop && status === 'pronto' && fnRailW
            ? `calc(${fnRailW}px + 1rem)`
            : undefined,
        background: dark ? 'rgba(0,0,0,0.28)' : `${tema.bg}cc`,
        borderColor: tema.border,
        color: tema.text,
      }}
    >
      <button
        onClick={onClose}
        aria-label="Voltar"
        className="w-12 h-12 md:w-11 md:h-11 rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-transform border"
        style={{
          background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
          borderColor: tema.border,
          color: tema.text,
        }}
      >
        <ArrowLeft className="w-[22px] h-[22px]" />
      </button>
      <div className="flex-1 min-w-0 text-center md:text-left">
        <h1 className="font-display text-[15px] md:text-[16px] font-semibold tracking-wide line-clamp-2 leading-tight">
          {titulo}
        </h1>
        {headerSub && (
          <p className="text-[11px] md:text-[12px] font-body opacity-70 line-clamp-1 mt-0.5 leading-tight">
            {headerSub}
          </p>
        )}
      </div>
      <div className="w-12 md:w-11 shrink-0 flex items-center justify-center">
        <button
          onClick={onShare}
          aria-label="Compartilhar"
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform"
          style={{ color: dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)' }}
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
