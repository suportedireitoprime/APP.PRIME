import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HardDrive } from 'lucide-react';
import { useGoBack } from '@/hooks/useGoBack';
import { haptic } from '@/lib/nativeHaptics';
import BibliotecaActionShortcuts from './BibliotecaActionShortcuts';
import { motion, AnimatePresence } from 'framer-motion';
import { useTotalLivrosCount } from '@/hooks/useTotalLivrosCount';

import bibliotecaCoverImg from '@/assets/biblioteca-cover.webp';

interface Props {
  onBuscar?: () => void;
  onAbrirCustomPdf?: () => void;
  children?: React.ReactNode;
}

const BibliotecaHero = ({ onAbrirCustomPdf, children }: Props) => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { data: totalCount = 2000, isLoading } = useTotalLivrosCount();

  return (
    <div
      className="relative overflow-hidden rounded-b-[36px] shadow-2xl shadow-black/80 pt-[var(--sai-top)] flex flex-col z-20 bg-[#09090b]"
      style={{
        transform: 'translateZ(0)',
      }}
    >
      {/* Blindagem de overscroll superior contra vazamento do fundo */}
      <div
        className="pointer-events-none absolute -top-[1200px] left-0 right-0 h-[1200px] z-0 bg-[#09090b]"
        aria-hidden="true"
      />

      {/* Imagem de Fundo Completa com Tratamento Editorial Clássico */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <AnimatePresence>
          <motion.img
            key="biblioteca-cover"
            src={bibliotecaCoverImg}
            alt="Biblioteca Jurídica"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.0 }}
            className="w-full h-full object-cover object-center filter brightness-[0.82] contrast-[1.08] saturate-[1.05]"
          />
        </AnimatePresence>
        {/* Vinheta cinematográfica suave para contraste perfeito dos textos e botões */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/60 pointer-events-none" />
        <div className="absolute inset-0 bg-radial-gradient pointer-events-none" style={{
          background: 'radial-gradient(circle at 50% 38%, transparent 20%, rgba(0,0,0,0.65) 100%)'
        }} />
      </div>

      {/* Botões do topo absolutos */}
      <header className="relative z-30 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] pointer-events-none">
        <div className="pointer-events-auto px-4 pb-2 pt-2 flex items-center justify-between">
          <button
            onClick={() => { haptic.selection(); goBack(); }}
            aria-label="Voltar"
            className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/50 border border-white/15 text-white backdrop-blur-md transition-all hover:bg-black/70 active:scale-95 cursor-pointer shadow-lg"
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
          </button>
          <button
            onClick={() => {
              haptic.selection();
              if (onAbrirCustomPdf) {
                onAbrirCustomPdf();
              } else {
                navigate('/modo-offline/livros');
              }
            }}
            aria-label="Meus PDFs ou Armazenamento Offline"
            className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/50 border border-white/15 text-white backdrop-blur-md transition-all hover:bg-black/70 active:scale-95 cursor-pointer shadow-lg"
          >
            <HardDrive className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* Título Centralizado com Tipografia Nobre de Biblioteca */}
      <div className="relative z-10 pt-4 sm:pt-6 pb-2 px-4 flex flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key="biblioteca-hero-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center max-w-[340px] sm:max-w-[420px]"
          >
            {/* Pill dourada clássica */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] sm:text-[11px] font-sans font-bold tracking-[0.2em] uppercase backdrop-blur-md shadow-sm mb-2">
              Acervo Oficial
            </span>

            <h1 className="font-serif text-2xl sm:text-3xl text-white font-normal tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
              Biblioteca Jurídica
            </h1>

            <p className="mt-1.5 font-sans text-xs sm:text-[13px] text-zinc-300/90 leading-relaxed drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
              Acervo permanente com{' '}
              <span className="text-amber-400 font-bold">
                +{isLoading ? '...' : totalCount} livros
              </span>{' '}
              ao seu dispor.
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Barra de Ações Rápidas (Leitura, Trilhas, Favoritos, Meus PDFs) */}
      <div className="relative z-10 px-3 sm:px-5 pt-3 pb-5">
        <BibliotecaActionShortcuts />
      </div>

      {children && (
        <div className="relative z-10 px-4 sm:px-6 w-full pb-5">
          {children}
        </div>
      )}
    </div>
  );
};

export default BibliotecaHero;