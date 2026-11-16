import React, { memo } from 'react';
import {
  Headphones,
  ArrowLeft,
  Bookmark,
  History,
  BarChart3,
  Flame,
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import audiobooksHeroImg from '@/assets/covers/audiobooks-hero-cover.webp';
import { AudiobooksHeroWave } from './AudiobooksHeroWave';
import type { AudiobookQuickActionType } from '@/components/audiobooks/AudiobooksQuickActionSheet';

interface AudiobooksHeroPanelProps {
  onBack?: () => void;
  onSelectAction: (action: AudiobookQuickActionType) => void;
  activeAction?: AudiobookQuickActionType | null;
}

export const AudiobooksHeroPanel: React.FC<AudiobooksHeroPanelProps> = ({
  onBack,
  onSelectAction,
}) => {
  return (
    <div
      className="relative overflow-hidden rounded-b-[36px] shadow-2xl shadow-black/80 flex flex-col z-20 border-b border-white/10 w-full min-h-[310px] xs:min-h-[325px] sm:min-h-[345px]"
      style={{
        backgroundColor: '#07060A',
        transform: 'translateZ(0)',
      }}
    >
      {/* ── Blindagem de overscroll superior contra vazamento do fundo ── */}
      <div
        className="pointer-events-none absolute -top-[1200px] left-0 right-0 h-[1200px] z-0"
        style={{ backgroundColor: '#07060A' }}
        aria-hidden="true"
      />

      {/* ── Imagem de Capa Oficial Completa (Filósofos / Biblioteca Clássica) ── */}
      <img
        src={audiobooksHeroImg}
        alt="Clássicos do Direito e Grandes Pensadores"
        aria-hidden="true"
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover object-[center_35%] z-0 pointer-events-none transform-gpu will-change-transform opacity-95 scale-100"
      />

      {/* ── Onda Hiper-Realista 3D em Tom Roxo Imperial / Violeta Nobre ── */}
      <AudiobooksHeroWave />

      {/* ── Vinheta suave e contraste lateral para legibilidade do texto (sem sombras coloridas) ── */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/60 pointer-events-none z-[1]" />
      <div className="absolute inset-y-0 left-0 w-[65%] sm:w-[50%] bg-gradient-to-r from-black/90 via-black/55 to-transparent pointer-events-none z-[2]" />

      {/* ── Cabeçalho Superior Embutido no Topo do Painel com Botão de Voltar Padrão Premium ── */}
      <header className="relative z-20 px-4 sm:px-6 md:px-8 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-1 flex items-center justify-between pointer-events-none">
        <button
          type="button"
          onClick={() => {
            haptic.selection();
            if (onBack) onBack();
          }}
          className="pointer-events-auto w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-black/60 hover:bg-black/80 active:scale-95 border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-lg shadow-black/80 backdrop-blur-md"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.4} />
        </button>

        <div className="flex flex-col items-center text-center">
          <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-widest text-white/80 flex items-center gap-1.5 drop-shadow-md">
            <Headphones className="w-3.5 h-3.5 text-purple-300" />
            Direito Prime Audiobooks
          </span>
          <h1 className="font-sans font-bold text-base sm:text-lg text-white drop-shadow-md">
            Audiobooks Clássicos
          </h1>
        </div>

        <div className="w-12 sm:w-[52px]" />
      </header>

      {/* ── Conteúdo Central do Painel (Marca e Conceito à Esquerda com Alto Contraste) ── */}
      <div className="relative z-10 px-4 sm:px-6 md:px-8 pt-3 sm:pt-4 pb-3 flex flex-col justify-start min-h-[120px] sm:min-h-[130px]">
        <div className="flex flex-col items-start text-left z-10 max-w-[300px]">
          <h2 className="tracking-tight leading-[1.02] drop-shadow-[0_3px_8px_rgba(0,0,0,0.95)]">
            <span className="font-serif text-[24px] sm:text-[28px] font-medium text-white block">
              Audiobooks
            </span>
            <span className="font-serif italic text-[24px] sm:text-[28px] font-semibold text-[#c084fc] block drop-shadow-[0_2px_14px_rgba(192,132,252,0.65)] -mt-0.5">
              Clássicos do Direito
            </span>
          </h2>

          <div className="mt-2.5 flex items-start text-left gap-2">
            <div className="w-[3px] h-8 bg-gradient-to-b from-[#c084fc] via-[#9333ea] to-[#4c1d95] rounded-full shrink-0 mt-0.5" />
            <p className="font-serif italic text-white/95 text-[11.5px] sm:text-[12.5px] leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
              A voz dos grandes pensadores,
              <br />
              narrados para o seu estudo.
            </p>
          </div>
        </div>
      </div>

      {/* ── 4 Botões de Ação Rápida no Padrão Vade Mecum: Favoritos, Recentes, Estatísticas e Resumos ── */}
      <div className="relative z-10 px-4 sm:px-6 md:px-8 pt-2 pb-5 sm:pb-6">
        <div className="flex items-center justify-between gap-2 sm:gap-3 bg-black/60 backdrop-blur-md border border-white/15 rounded-[32px] sm:rounded-[36px] py-2.5 sm:py-3 px-3 sm:px-4 shadow-[0_8px_30px_rgba(0,0,0,0.7)]">
          {/* Botão 1: Favoritos */}
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              onSelectAction('favoritos');
            }}
            className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-2xl hover:bg-white/10 active:bg-white/15 transition-all active:scale-95 gap-1 text-center cursor-pointer select-none"
            aria-label="Abrir Favoritos"
          >
            <Bookmark
              className="w-5 h-5 text-amber-400 fill-amber-400/20 group-hover:fill-amber-400 transition-all duration-200 group-hover:scale-110 drop-shadow-md"
              strokeWidth={2}
            />
            <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight capitalize tracking-wide drop-shadow-sm">
              Favoritos
            </span>
          </button>

          {/* Botão 2: Recentes */}
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              onSelectAction('recentes');
            }}
            className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-2xl hover:bg-white/10 active:bg-white/15 transition-all active:scale-95 gap-1 text-center cursor-pointer select-none"
            aria-label="Abrir Recentes"
          >
            <History
              className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform duration-200 drop-shadow-md"
              strokeWidth={2}
            />
            <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight capitalize tracking-wide drop-shadow-sm">
              Recentes
            </span>
          </button>

          {/* Botão 3: Estatísticas */}
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              onSelectAction('estatisticas');
            }}
            className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-2xl hover:bg-white/10 active:bg-white/15 transition-all active:scale-95 gap-1 text-center cursor-pointer select-none"
            aria-label="Abrir Estatísticas"
          >
            <BarChart3
              className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform duration-200 drop-shadow-md"
              strokeWidth={2}
            />
            <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight capitalize tracking-wide drop-shadow-sm">
              Estatísticas
            </span>
          </button>

          {/* Botão 4: Em Alta */}
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              onSelectAction('em_alta');
            }}
            className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-2xl hover:bg-white/10 active:bg-white/15 transition-all active:scale-95 gap-1 text-center cursor-pointer select-none"
            aria-label="Abrir Obras em Alta"
          >
            <Flame
              className="w-5 h-5 text-orange-400 fill-orange-400/20 group-hover:fill-orange-400 transition-all duration-200 group-hover:scale-110 drop-shadow-md"
              strokeWidth={2}
            />
            <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight capitalize tracking-wide drop-shadow-sm">
              Em Alta
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(AudiobooksHeroPanel);
