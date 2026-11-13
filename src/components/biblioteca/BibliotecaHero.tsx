import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HardDrive } from 'lucide-react';
import { useGoBack } from '@/hooks/useGoBack';
import { haptic } from '@/lib/nativeHaptics';
import { useTotalLivrosCount } from '@/hooks/useTotalLivrosCount';
import bibliotecaFilosofoCover from '@/assets/biblioteca-filosofo-cover.jpg';
import BibliotecaHeroWave from './BibliotecaHeroWave';
import BibliotecaActionShortcuts from './BibliotecaActionShortcuts';

interface Props {
  onBuscar?: () => void;
  onAbrirCustomPdf?: () => void;
  children?: React.ReactNode;
}

const BibliotecaHero: React.FC<Props> = ({ onAbrirCustomPdf, children }) => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { data: totalCount = 2000, isLoading } = useTotalLivrosCount();

  return (
    <div
      className="bg-hero-panel relative overflow-hidden rounded-b-[36px] shadow-2xl shadow-black/60 pt-[var(--sai-top,env(safe-area-inset-top,0px))] flex flex-col z-20"
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

      {/* Imagem de Capa do Filósofo lendo ao Alvorecer no Parthenon */}
      <img
        src={bibliotecaFilosofoCover}
        alt="Biblioteca Jurídica"
        aria-hidden="true"
        loading="eager"
        decoding="async"
        fetchPriority="high"
        className="absolute inset-0 w-full h-full object-cover object-[52%_20%] md:object-[center_20%] z-0 pointer-events-none transform-gpu will-change-transform"
      />

      {/* Onda Dourada Animada da Cor do Céu ao Alvorecer */}
      <BibliotecaHeroWave />

      {/* Cabeçalho Superior Transparente (Botões de Voltar e Meus PDFs / Offline) */}
      <header className="absolute top-0 right-0 left-0 z-20 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] md:pt-[calc(1rem+var(--sai-top,env(safe-area-inset-top,0px)))] lg:pt-[calc(1.5rem+var(--sai-top,env(safe-area-inset-top,0px)))] pointer-events-none">
        <div className="pointer-events-auto px-4 pb-2 pt-2 flex items-center justify-between">
          <button
            onClick={() => {
              haptic.light();
              goBack();
            }}
            aria-label="Voltar"
            className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:opacity-70 cursor-pointer shadow-lg"
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
            className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:opacity-70 cursor-pointer shadow-lg"
          >
            <HardDrive className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* Conteúdo: Tipografia de Marca Biblioteca Jurídica no padrão ouro da Home */}
      <div className="relative z-10 pt-10 sm:pt-12 flex-1 flex flex-col justify-start min-h-[115px]">
        <div className="flex items-start justify-between gap-3 px-3 sm:px-4">
          <div className="flex flex-col items-start text-left gap-1 z-10 relative ml-2 sm:ml-4 max-w-[240px]">
            {/* Tipografia de Marca: Biblioteca (branco) + Jurídica (âmbar dourado itálico) */}
            <h1 className="tracking-tight leading-[1.02] drop-shadow-[0_3px_8px_rgba(0,0,0,0.95)]">
              <span className="font-serif text-[22px] sm:text-[26px] font-medium text-white block">
                Biblioteca
              </span>
              <span className="font-serif italic text-[24px] sm:text-[28px] font-semibold text-amber-400 block drop-shadow-[0_2px_14px_rgba(245,158,11,0.65)] -mt-0.5">
                Jurídica
              </span>
            </h1>

            {/* Traço vertical âmbar e subtítulo oficial */}
            <div className="mt-2 flex items-start text-left gap-2">
              <div className="w-[3px] h-8 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full shrink-0 mt-0.5 shadow-[0_0_10px_rgba(245,158,11,0.55)]" />
              <p className="font-serif italic text-white/90 text-[11px] sm:text-[12px] leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                Acervo permanente com{' '}
                <span className="text-amber-300 font-bold not-italic">
                  +{isLoading ? '...' : totalCount} livros
                </span>{' '}
                ao seu dispor.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Atalhos Rápidos flutuando sobre a onda (Padrão Início do App) */}
      <div className="relative z-10 px-3 sm:px-5 pt-3 pb-3">
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

export default memo(BibliotecaHero);
