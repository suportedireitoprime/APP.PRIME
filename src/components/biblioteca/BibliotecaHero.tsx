import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HardDrive } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { useTotalLivrosCount } from '@/hooks/useTotalLivrosCount';
import BibliotecaActionShortcuts from './BibliotecaActionShortcuts';

interface Props {
  onBuscar?: () => void;
  onAbrirCustomPdf?: () => void;
  onBack?: () => void;
  children?: React.ReactNode;
}

const BibliotecaHero: React.FC<Props> = ({ onAbrirCustomPdf, onBack, children }) => {
  const navigate = useNavigate();
  const { data: totalCount = 2000, isLoading } = useTotalLivrosCount();

  return (
    <header className="sticky top-0 z-30 bg-[#0D0F12]/90 backdrop-blur-xl border-b border-white/10 pt-[var(--sai-top,env(safe-area-inset-top,0px))]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-3 pb-3 space-y-3">
        {/* Barra Superior Minimalista */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                haptic.light();
                if (onBack) {
                  onBack();
                } else {
                  navigate('/');
                }
              }}
              aria-label="Voltar para o início"
              className="grid w-11 h-11 sm:w-12 sm:h-12 shrink-0 place-items-center rounded-full bg-zinc-900/90 border border-white/10 text-white hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.2} />
            </button>

            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-white leading-tight truncate">
                Biblioteca
              </h1>
              <p className="text-xs text-zinc-400 truncate">
                +{isLoading ? '...' : totalCount} obras jurídicas
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              haptic.selection();
              if (onAbrirCustomPdf) {
                onAbrirCustomPdf();
              } else {
                navigate('/modo-offline/livros');
              }
            }}
            aria-label="Meus PDFs e armazenamento offline"
            className="inline-flex items-center gap-2 h-11 px-3.5 rounded-full bg-zinc-900/90 border border-white/10 text-zinc-200 hover:text-white hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer shrink-0 text-xs font-medium"
          >
            <HardDrive className="w-4 h-4 shrink-0" strokeWidth={2} />
            <span className="hidden xs:inline">Meus PDFs</span>
          </button>
        </div>

        {/* 4 Atalhos Rápidos Minimalistas */}
        <BibliotecaActionShortcuts />

        {children && <div className="w-full pt-1">{children}</div>}
      </div>
    </header>
  );
};

export default memo(BibliotecaHero);