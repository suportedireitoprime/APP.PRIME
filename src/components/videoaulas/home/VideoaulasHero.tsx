import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Video, Award } from 'lucide-react';
import { useGoBack } from '@/hooks/useGoBack';
import { haptic } from '@/lib/nativeHaptics';
import videoaulasHeroCover from '@/assets/videoaulas-hero-cover.jpg';
import { VideoaulasHeroWave } from './VideoaulasHeroWave';
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
}

export const VideoaulasHero = memo(function VideoaulasHero({
  data,
  areasDireitoLength,
  setShowDesempenho,
  horasAssistidas,
}: VideoaulasHeroProps) {
  const goBack = useGoBack();

  return (
    <div
      className="bg-hero-panel relative overflow-hidden rounded-b-[36px] shadow-2xl shadow-black/80 pt-[var(--sai-top,env(safe-area-inset-top,0px))] flex flex-col z-20 min-h-[310px] xs:min-h-[325px] sm:min-h-[345px]"
      style={{
        transform: 'translateZ(0)',
        backgroundColor: '#0c0704',
      }}
    >
      {/* Blindagem de overscroll superior contra vazamento do fundo */}
      <div
        className="pointer-events-none absolute -top-[1200px] left-0 right-0 h-[1200px] z-0"
        style={{ backgroundColor: '#0c0704' }}
        aria-hidden="true"
      />

      {/* Imagem Oficial da Cena de Videoaulas na Biblioteca */}
      <img
        src={videoaulasHeroCover}
        alt="Videoaulas Jurídicas"
        aria-hidden="true"
        loading="eager"
        decoding="async"
        fetchPriority="high"
        className="absolute inset-0 w-full h-full object-cover object-[62%_20%] md:object-[center_25%] z-0 pointer-events-none transform-gpu will-change-transform"
      />

      {/* Onda Hiper-Realista em Seda 3D Harmonizada com a Paleta Predominante */}
      <VideoaulasHeroWave />

      {/* Cabeçalho Superior Transparente (Botão Voltar Padrão Ouro 52px) */}
      <header className="absolute top-0 right-0 left-0 z-20 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] md:pt-[calc(1rem+var(--sai-top,env(safe-area-inset-top,0px)))] pointer-events-none">
        <div className="pointer-events-auto px-4 pb-2 pt-2 flex items-center justify-between">
          <button
            onClick={() => {
              haptic.light();
              goBack();
            }}
            aria-label="Voltar"
            className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/45 border border-white/15 text-white backdrop-blur-md transition-colors hover:bg-black/70 active:opacity-70 cursor-pointer shadow-xl"
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
          </button>
        </div>
      </header>

      {/* Conteúdo Tipográfico Editorial no Estilo Biblioteca */}
      <div className="relative z-10 pt-5 sm:pt-6 flex-1 flex flex-col justify-start min-h-[130px] sm:min-h-[140px]">
        {/* Espaçamento vertical para livrar o botão de voltar */}
        <div className="h-[46px] sm:h-[50px] mb-1 shrink-0 w-full" aria-hidden="true" />

        <div className="flex items-start justify-between gap-3 px-3 sm:px-4">
          <div className="flex flex-col items-start text-left gap-1 z-10 relative ml-2 sm:ml-4 max-w-[260px]">
            {/* Tipografia de Marca: Videoaulas (branco serif) + em Trilhas (ouro âmbar itálico) */}
            <h1 className="tracking-tight leading-[1.02] drop-shadow-[0_3px_8px_rgba(0,0,0,0.95)]">
              <span className="font-serif text-[22px] sm:text-[26px] font-medium text-white block">
                Videoaulas
              </span>
              <span className="font-serif italic text-[24px] sm:text-[28px] font-semibold text-[#fbbf24] block drop-shadow-[0_2px_14px_rgba(251,191,36,0.65)] -mt-0.5">
                em Trilhas
              </span>
            </h1>

            {/* Traço vertical âmbar e subtítulo oficial */}
            <div className="mt-2 flex items-start text-left gap-2">
              <div className="w-[3px] h-8 bg-gradient-to-b from-[#fbbf24] to-[#b45309] rounded-full shrink-0 mt-0.5 shadow-[0_0_10px_rgba(251,191,36,0.55)]" />
              <p className="font-serif italic text-white/95 text-[11px] sm:text-[12px] leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                Acervo completo com{' '}
                <span className="text-[#fef3c7] font-bold not-italic">
                  +{data.totalAulas} aulas
                </span>{' '}
                organizadas por área jurídica.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Métricas Flutuando Harmoniosamente sobre a Onda */}
      <div className="relative z-10 px-4 sm:px-6 pt-2 pb-4">
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 max-w-md mx-auto">
          {/* Áreas */}
          <div className="flex flex-col items-center justify-center py-2 px-2.5 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-md shadow-lg">
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-amber-200/80 font-sans flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-amber-300" />
              Áreas
            </span>
            <span className="font-sans text-base sm:text-lg font-black text-white mt-0.5">
              {areasDireitoLength}
            </span>
          </div>

          {/* Aulas */}
          <div className="flex flex-col items-center justify-center py-2 px-2.5 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-md shadow-lg">
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-amber-200/80 font-sans flex items-center gap-1">
              <Video className="w-3 h-3 text-amber-300" />
              Aulas
            </span>
            <span className="font-sans text-base sm:text-lg font-black text-white mt-0.5">
              {data.totalAulas}
            </span>
          </div>

          {/* Horas Assistidas */}
          <div
            onClick={() => {
              haptic.selection();
              setShowDesempenho(true);
            }}
            className="flex flex-col items-center justify-center py-2 px-2.5 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-md shadow-lg cursor-pointer active:scale-95 transition-transform"
          >
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-amber-200/80 font-sans flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-300" />
              Tempo
            </span>
            <span className="font-sans text-base sm:text-lg font-black text-amber-300 mt-0.5">
              {horasAssistidas}h
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default VideoaulasHero;
