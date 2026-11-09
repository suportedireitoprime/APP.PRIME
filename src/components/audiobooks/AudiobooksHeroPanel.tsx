import React, { memo } from 'react';
import {
  Headphones,
  ArrowLeft,
  Heart,
  History,
  BarChart3,
  BookOpen,
} from 'lucide-react';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { haptic } from '@/lib/nativeHaptics';
import audiobooksHeroImg from '@/assets/covers/resumos-philosophers-hero.webp';
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
      className="relative overflow-hidden rounded-b-[36px] shadow-2xl shadow-black/80 flex flex-col z-20 border-b border-purple-500/25 w-full"
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

      {/* ── Imagem de Fundo (Filósofos / Clássicos) ── */}
      <img
        src={audiobooksHeroImg}
        alt=""
        aria-hidden="true"
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover object-right sm:object-center z-0 opacity-40 mix-blend-luminosity scale-105"
      />

      {/* ── Overlay Roxo com corte diagonal idêntico ao Vade Mecum ── */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          filter:
            'drop-shadow(25px 0 25px rgba(0,0,0,0.85)) drop-shadow(8px 0 10px rgba(0,0,0,0.95))',
        }}
      >
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: 'polygon(0 0, 56% 0, 38% 100%, 0% 100%)' }}
        >
          {/* Degradê Roxo / Violeta Oficial */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED] via-[#6D28D9] to-[#4C1D95]" />
          {/* Fundo Padrão ShapeGrid animado embutido */}
          <div className="absolute inset-0 opacity-20 mix-blend-overlay">
            <ShapeGrid />
          </div>
        </div>
      </div>

      {/* Glow Roxo de Atmosfera */}
      <div className="absolute -top-16 -left-16 w-72 h-72 bg-[#7C3AED]/35 rounded-full blur-3xl pointer-events-none z-[2]" />

      {/* ── Cabeçalho Superior Embutido no Topo do Painel com Botão de Voltar Padrão Premium ── */}
      <header className="relative z-20 px-4 sm:px-6 md:px-8 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-1 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            haptic.selection();
            if (onBack) onBack();
          }}
          className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-purple-950/60 hover:bg-purple-900/60 active:scale-95 border border-purple-500/30 flex items-center justify-center transition-all cursor-pointer shadow-[0_0_20px_rgba(124,58,237,0.3)] backdrop-blur-md"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.4} />
        </button>

        <div className="flex flex-col items-center text-center">
          <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-widest text-purple-200 flex items-center gap-1.5 drop-shadow-md">
            <Headphones className="w-3.5 h-3.5 text-white" />
            Direito Prime Audiobooks
          </span>
          <h1 className="font-sans font-bold text-base sm:text-lg text-white drop-shadow-md">
            Audiobooks Clássicos
          </h1>
        </div>

        <div className="w-12 sm:w-[52px]" />
      </header>

      {/* ── Conteúdo Central do Painel (Marca e Conceito à Esquerda) ── */}
      <div className="relative z-10 px-4 sm:px-6 md:px-8 pt-3 sm:pt-4 pb-3 flex flex-col justify-start min-h-[115px]">
        {/* Marca à Esquerda (dentro da área roxa com o fundo dos filósofos respirando à direita) */}
        <div className="flex flex-col items-start text-left z-10 w-[50%] max-w-[280px]">
          <h2 className="font-serif italic text-white text-2xl sm:text-3xl leading-[1.05] font-black tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
            Audiobooks
          </h2>

          <p className="font-body text-white/95 text-[9.5px] sm:text-[10.5px] font-bold tracking-[0.25em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-1">
            CLÁSSICOS DO DIREITO
          </p>

          <div className="mt-2 flex items-center gap-2">
            <div className="w-[2.5px] h-7 bg-white/50 rounded-full" />
            <p className="font-serif italic text-white/90 text-xs sm:text-[12.5px] leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              A voz dos grandes pensadores,
              <br />
              narrados para o seu estudo.
            </p>
          </div>
        </div>
      </div>

      {/* ── 4 Botões de Ação Rápida no Padrão Vade Mecum: Favoritos, Recentes, Estatísticas e Outros ── */}
      <div className="relative z-10 px-3 sm:px-6 md:px-8 pb-3.5 pt-1">
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 bg-[#120B24]/80 backdrop-blur-md border border-purple-500/25 rounded-2xl p-1.5 shadow-[0_8px_30px_rgba(124,58,237,0.25)]">
          {/* Botão 1: Favoritos */}
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              onSelectAction('favoritos');
            }}
            className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl hover:bg-white/10 active:bg-white/15 transition-all active:scale-95 gap-1 text-center cursor-pointer select-none"
            aria-label="Abrir Favoritos"
          >
            <Heart
              className="w-5 h-5 text-rose-500 fill-rose-500/20 group-hover:fill-rose-500 transition-all duration-200 group-hover:scale-110 drop-shadow-md"
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
            className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl hover:bg-white/10 active:bg-white/15 transition-all active:scale-95 gap-1 text-center cursor-pointer select-none"
            aria-label="Abrir Recentes"
          >
            <History
              className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform duration-200 drop-shadow-md"
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
            className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl hover:bg-white/10 active:bg-white/15 transition-all active:scale-95 gap-1 text-center cursor-pointer select-none"
            aria-label="Abrir Estatísticas"
          >
            <BarChart3
              className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform duration-200 drop-shadow-md"
              strokeWidth={2}
            />
            <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight capitalize tracking-wide drop-shadow-sm">
              Estatísticas
            </span>
          </button>

          {/* Botão 4: Resumos (Substitui Outros) */}
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              onSelectAction('resumos');
            }}
            className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl hover:bg-white/10 active:bg-white/15 transition-all active:scale-95 gap-1 text-center cursor-pointer select-none"
            aria-label="Abrir Trilha de Resumos"
          >
            <BookOpen
              className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform duration-200 drop-shadow-md"
              strokeWidth={2}
            />
            <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight capitalize tracking-wide drop-shadow-sm">
              Resumos
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(AudiobooksHeroPanel);
