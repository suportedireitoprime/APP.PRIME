import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HardDrive } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { useTotalLivrosCount } from '@/hooks/useTotalLivrosCount';
import bibliotecaFilosofoCover from '@/assets/biblioteca-filosofo-cover.webp';
import BibliotecaHeroWave from './BibliotecaHeroWave';
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
    <div
      className="bg-hero-panel relative overflow-hidden rounded-b-[36px] shadow-2xl shadow-black/60 pt-[var(--sai-top,env(safe-area-inset-top,0px))] flex flex-col z-20 min-h-[310px] xs:min-h-[325px] sm:min-h-[345px]"
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

      {/* Imagem de Capa da Biblioteca Clássica ao Crepúsculo */}
      <img
        src={bibliotecaFilosofoCover}
        alt="Biblioteca Jurídica"
        aria-hidden="true"
        loading="eager"
        decoding="async"
        fetchPriority="high"
        className="absolute inset-0 w-full h-full object-cover object-[68%_38%] md:object-[center_35%] z-0 pointer-events-none transform-gpu will-change-transform"
      />

      {/* Onda Roxa / Púrpura Crepúsculo 3D em Seda Pura */}
      <BibliotecaHeroWave />

      {/* Cabeçalho Superior Transparente (Botões de Voltar e Meus PDFs / Offline) */}
      <header className="absolute top-0 right-0 left-0 z-20 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] md:pt-[calc(1rem+var(--sai-top,env(safe-area-inset-top,0px)))] lg:pt-[calc(1.5rem+var(--sai-top,env(safe-area-inset-top,0px)))] pointer-events-none">
        <div className="pointer-events-auto px-4 pb-2 pt-2 flex items-center justify-between">
          <button
            onClick={() => {
              haptic.light();
              if (onBack) {
                onBack();
              } else {
                navigate('/');
              }
            }}
            aria-label="Voltar para o início"
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

      {/* Conteúdo: Altura calibrada, desobstruindo o botão voltar */}
      <div className="relative z-10 pt-5 sm:pt-6 flex-1 flex flex-col justify-start min-h-[130px] sm:min-h-[140px]">
        {/* Espaçamento vertical para livrar os botões superiores */}
        <div className="h-[46px] sm:h-[50px] mb-1 shrink-0 w-full" aria-hidden="true" />

        <div className="flex items-start justify-between gap-3 px-3 sm:px-4">
          <div className="flex flex-col items-start text-left gap-1 z-10 relative ml-2 sm:ml-4 max-w-[250px]">
            {/* Tipografia de Marca: Biblioteca (branco) + Jurídica (púrpura crepúsculo luminoso) */}
            <h1 className="tracking-tight leading-[1.02] drop-shadow-[0_3px_8px_rgba(0,0,0,0.95)]">
              <span className="font-serif text-[22px] sm:text-[26px] font-medium text-white block">
                Biblioteca
              </span>
              <span className="font-serif italic text-[24px] sm:text-[28px] font-semibold text-[#D8B4FE] block drop-shadow-[0_2px_16px_rgba(168,85,247,0.85)] -mt-0.5">
                Jurídica
              </span>
            </h1>

            {/* Traço vertical púrpura e subtítulo oficial */}
            <div className="mt-2 flex items-start text-left gap-2">
              <div className="w-[3px] h-8 bg-gradient-to-b from-[#C084FC] via-[#7C3AED] to-[#4C1D95] rounded-full shrink-0 mt-0.5 shadow-[0_0_12px_rgba(168,85,247,0.7)]" />
              <p className="font-serif italic text-white/90 text-[11px] sm:text-[12px] leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                Acervo permanente com{' '}
                <span className="text-[#E9D5FF] font-bold not-italic">
                  +{isLoading ? '...' : totalCount} livros
                </span>{' '}
                ao seu dispor.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Atalhos Rápidos flutuando sobre a onda */}
      <div className="relative z-10 px-4 sm:px-6 pt-2.5 pb-5 sm:pb-6">
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