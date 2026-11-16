import React, { memo } from 'react';
import { ArrowLeft, Bookmark, History, BarChart3, Flame } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { AudiobookQuickActionType } from './AudiobooksQuickActionSheet';
import { AudiobooksHeroWave } from './AudiobooksHeroWave';
import heroCoverWebp from '@/assets/covers/audiobooks-hero-cover.webp';
import heroCoverJpg from '@/assets/covers/audiobooks-hero-cover.jpg';

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
    <div className="relative w-full bg-[#0D0D0D] overflow-hidden select-none">
      {/* ── Imagem de Fundo (Pintura Histórica Ilustrada dos Pensadores Jurídicos) ── */}
      <div className="absolute inset-0 z-0">
        <picture>
          <source srcSet={heroCoverWebp} type="image/webp" />
          <img
            src={heroCoverJpg}
            alt="Audiobooks Clássicos do Direito — Grandes Pensadores"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover object-[center_28%] filter brightness-[0.92] contrast-[1.08] sm:object-[center_22%]"
          />
        </picture>

        {/* Gradiente escuro para legibilidade perfeita dos textos à esquerda */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to right, rgba(10, 10, 12, 0.95) 0%, rgba(10, 10, 12, 0.78) 42%, rgba(10, 10, 12, 0.35) 70%, rgba(10, 10, 12, 0.15) 100%)',
          }}
        />

        {/* Vinheta superior e inferior para transição suave com a tela */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, rgba(10, 10, 12, 0.7) 0%, transparent 22%, transparent 65%, rgba(13, 13, 13, 1) 100%)',
          }}
        />
      </div>

      {/* ── Barra Superior com Botão de Voltar (Sem título duplicado no centro) ── */}
      <header className="relative z-20 px-4 sm:px-6 md:px-8 pt-3 sm:pt-4 flex items-center justify-between pointer-events-none">
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

        <div className="w-12 sm:w-[52px]" />
      </header>

      {/* ── Conteúdo Central do Painel (Marca e Conceito à Esquerda com Alto Contraste) ── */}
      <div className="relative z-10 px-4 sm:px-6 md:px-8 pt-2 sm:pt-3 pb-3 flex flex-col justify-start min-h-[120px] sm:min-h-[130px]">
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

      {/* ── 4 Botões de Ação Rápida com Ícones Roxos Unificados (#C084FC) ── */}
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
              className="w-5 h-5 text-[#C084FC] fill-[#C084FC]/25 group-hover:fill-[#C084FC] transition-all duration-200 group-hover:scale-110 drop-shadow-md"
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
              className="w-5 h-5 text-[#C084FC] group-hover:scale-110 transition-transform duration-200 drop-shadow-md"
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
              className="w-5 h-5 text-[#C084FC] group-hover:scale-110 transition-transform duration-200 drop-shadow-md"
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
              className="w-5 h-5 text-[#C084FC] fill-[#C084FC]/25 group-hover:fill-[#C084FC] transition-all duration-200 group-hover:scale-110 drop-shadow-md"
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
