import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import videoaulasHeroCover from '@/assets/videoaulas-hero-cover.webp';
import VideoaulasActionShortcuts, { type VideoaulasHeroTab } from './VideoaulasActionShortcuts';
import type { ResumoVideoaulas } from '@/lib/videoaulasResumo';

interface VideoaulasHeroProps {
  data: ResumoVideoaulas;
  heroIdx?: number;
  emAndamentoCount?: number;
  areasDireitoLength: number;
  setShowDesempenho: (v: boolean) => void;
  horasAssistidas: number;
  c: number;
  dash: number;
  activeHeroTab: VideoaulasHeroTab;
  onSelectHeroTab: (tab: VideoaulasHeroTab) => void;
  onOpenSearch?: () => void;
  onBack?: () => void;
  favoritosCount?: number;
}

export const VideoaulasHero = memo(function VideoaulasHero({
  data,
  activeHeroTab,
  onSelectHeroTab,
  onOpenSearch,
  onBack,
  favoritosCount = 0,
}: VideoaulasHeroProps) {
  const navigate = useNavigate();

  return (
    <div
      className="bg-hero-panel relative overflow-hidden rounded-b-[32px] shadow-2xl shadow-black/90 pt-[var(--sai-top,env(safe-area-inset-top,0px))] flex flex-col z-20 min-h-[260px] xs:min-h-[275px] sm:min-h-[295px] touch-pan-y"
      style={{
        transform: 'translateZ(0)',
        backgroundColor: '#0D0D0D',
        touchAction: 'pan-y',
      }}
    >
      {/* Blindagem de overscroll superior */}
      <div
        className="pointer-events-none absolute -top-[1200px] left-0 right-0 h-[1200px] z-0"
        style={{ backgroundColor: '#0D0D0D' }}
        aria-hidden="true"
      />

      {/* Imagem Oficial de Capa da Biblioteca Jurídica */}
      <img
        src={videoaulasHeroCover}
        alt="Videoaulas Jurídicas"
        aria-hidden="true"
        loading="eager"
        decoding="async"
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover object-[70%_25%] md:object-[center_25%] z-0 pointer-events-none select-none transform-gpu will-change-transform opacity-75"
      />

      {/* Gradiente Minimalista e Elegante de Transição para o Fundo Escuro */}
      <div 
        className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/65 to-black/35 pointer-events-none z-[1]" 
        aria-hidden="true" 
      />
      <div 
        className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent pointer-events-none z-[2]" 
        aria-hidden="true" 
      />

      {/* Cabeçalho Superior Transparente (Botão Voltar Padrão Ouro 52px e Busca) */}
      <header className="absolute top-0 right-0 left-0 z-20 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] md:pt-[calc(1rem+var(--sai-top,env(safe-area-inset-top,0px)))] pointer-events-none">
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
            className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/50 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/70 active:opacity-70 cursor-pointer shadow-xl"
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
          </button>

          {onOpenSearch && (
            <button
              onClick={() => {
                haptic.light();
                onOpenSearch();
              }}
              aria-label="Buscar videoaulas"
              className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/50 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/70 active:opacity-70 cursor-pointer shadow-xl"
            >
              <Search className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.4} />
            </button>
          )}
        </div>
      </header>

      {/* Conteúdo Tipográfico Editorial Minimalista */}
      <div className="relative z-10 pt-4 sm:pt-5 flex-1 flex flex-col justify-start">
        <div className="flex items-start justify-between gap-3 px-4 sm:px-6">
          <div className="flex flex-col items-start text-left gap-1 z-10 relative max-w-[320px]">
            {/* Espaçamento vertical para livrar o botão de voltar */}
            <div className="h-[52px] sm:h-[60px] mb-2 shrink-0 w-full pointer-events-none" aria-hidden="true" />

            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-md mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-zinc-300 font-sans">
                Trilhas de Estudo
              </span>
            </div>

            <h1 className="tracking-tight leading-tight">
              <span className="font-serif text-[26px] sm:text-[30px] font-medium text-white block">
                Videoaulas
              </span>
            </h1>

            <p className="font-sans text-zinc-300 text-xs sm:text-[13px] leading-relaxed mt-0.5">
              Aulas esquematizadas por área do Direito.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Funções Rápidas Minimalistas: Favoritos, Em Alta, Recentes e Playlist */}
      <div className="relative z-10 px-4 sm:px-6 pt-3 pb-4 sm:pb-5">
        <VideoaulasActionShortcuts
          activeTab={activeHeroTab}
          onSelectTab={onSelectHeroTab}
          favoritosCount={favoritosCount}
        />
      </div>
    </div>
  );
});

export default VideoaulasHero;
