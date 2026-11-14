import React, { memo } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { useGoBack } from '@/hooks/useGoBack';
import { haptic } from '@/lib/nativeHaptics';
import videoaulasHeroCover from '@/assets/videoaulas-hero-cover.webp';
import { VideoaulasHeroWave } from './VideoaulasHeroWave';
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
  favoritosCount?: number;
}

export const VideoaulasHero = memo(function VideoaulasHero({
  data,
  activeHeroTab,
  onSelectHeroTab,
  onOpenSearch,
  favoritosCount = 0,
}: VideoaulasHeroProps) {
  const goBack = useGoBack();

  return (
    <div
      className="bg-hero-panel relative overflow-hidden rounded-b-[36px] shadow-2xl shadow-black/80 pt-[var(--sai-top,env(safe-area-inset-top,0px))] flex flex-col z-20 min-h-[310px] xs:min-h-[325px] sm:min-h-[345px]"
      style={{
        transform: 'translateZ(0)',
        backgroundColor: '#050505',
      }}
    >
      {/* Blindagem de overscroll superior */}
      <div
        className="pointer-events-none absolute -top-[1200px] left-0 right-0 h-[1200px] z-0"
        style={{ backgroundColor: '#050505' }}
        aria-hidden="true"
      />

      {/* Imagem Oficial de Capa da Biblioteca Jurídica ao Pôr do Sol Carmesim */}
      <img
        src={videoaulasHeroCover}
        alt="Videoaulas Jurídicas"
        aria-hidden="true"
        loading="eager"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover object-[70%_25%] md:object-[center_25%] z-0 pointer-events-none transform-gpu will-change-transform"
      />

      {/* Onda Hiper-Realista em Seda Dourada Idêntica à de Pílulas */}
      <VideoaulasHeroWave />

      {/* Cabeçalho Superior Transparente (Botão Voltar Padrão Ouro 52px e Busca) */}
      <header className="absolute top-0 right-0 left-0 z-20 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] md:pt-[calc(1rem+var(--sai-top,env(safe-area-inset-top,0px)))] pointer-events-none">
        <div className="pointer-events-auto px-4 pb-2 pt-2 flex items-center justify-between">
          <button
            onClick={() => {
              haptic.light();
              goBack();
            }}
            aria-label="Voltar"
            className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:opacity-70 cursor-pointer shadow-xl"
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
              className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:opacity-70 cursor-pointer shadow-xl"
            >
              <Search className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.4} />
            </button>
          )}
        </div>
      </header>

      {/* Conteúdo Tipográfico Editorial Estilo Pílulas */}
      <div className="relative z-10 pt-5 sm:pt-6 flex-1 flex flex-col justify-start min-h-[130px] sm:min-h-[140px]">
        <div className="flex items-start justify-between gap-3 px-3 sm:px-4">
          <div className="flex flex-col items-start text-left gap-1 z-10 relative ml-2 sm:ml-4 max-w-[260px]">
            {/* Espaçamento vertical para livrar o botão de voltar */}
            <div className="h-[46px] sm:h-[50px] mb-1 shrink-0 w-full" aria-hidden="true" />

            {/* Tipografia de Marca: Videoaulas (branco) + em Trilhas (vermelho carmesim nobre) */}
            <h1 className="tracking-tight leading-[1.02] drop-shadow-[0_3px_8px_rgba(0,0,0,0.95)]">
              <span className="font-serif text-[24px] sm:text-[28px] font-medium text-white block">
                Videoaulas
              </span>
              <span className="font-serif italic text-[26px] sm:text-[30px] font-semibold text-[#FF4D6D] block drop-shadow-[0_2px_14px_rgba(225,29,72,0.75)] -mt-0.5">
                em Trilhas
              </span>
            </h1>

            {/* Traço vertical vermelho carmesim e slogan */}
            <div className="mt-2 flex items-start text-left gap-2">
              <div className="w-[3px] h-8 bg-gradient-to-b from-rose-400 via-red-500 to-red-950 rounded-full shrink-0 mt-0.5 shadow-[0_0_10px_rgba(225,29,72,0.7)]" />
              <p className="font-serif italic text-white/90 text-[11px] sm:text-[12px] leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                Aulas esquematizadas por área.
                <br />
                Domine o Direito com maestria.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Funções Rápidas: Favoritos, Em Alta, Recentes e Playlist */}
      <div className="relative z-10 px-3 sm:px-5 pt-3 pb-3">
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
