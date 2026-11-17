import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  return (
    <div className="relative mb-6">
      {/* Shell sólido, opaco e com blindagem contra culling e overscroll (mesma altura e proporção do Início do App) */}
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

        {/* ── Imagem de Fundo (Pintura Histórica Ilustrada dos Pensadores Jurídicos) ── */}
        <picture>
          <source srcSet={heroCoverWebp} type="image/webp" />
          <img
            src={heroCoverJpg}
            alt="Audiobooks Direito Prime — Grandes Obras e Pensadores"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover object-[center_28%] filter brightness-[0.92] contrast-[1.08] sm:object-[center_22%] z-0 pointer-events-none transform-gpu will-change-transform"
          />
        </picture>

        {/* Onda Roxo Imperial 3D Animada */}
        <AudiobooksHeroWave />

        {/* ── Cabeçalho Superior Transparente com Botão de Voltar Padrão Ouro ── */}
        <header className="absolute top-0 right-0 left-0 z-20 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] md:pt-[calc(1rem+var(--sai-top,env(safe-area-inset-top,0px)))] lg:pt-[calc(1.5rem+var(--sai-top,env(safe-area-inset-top,0px)))] pointer-events-none">
          <div className="pointer-events-auto px-4 pb-2 pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                if (onBack) {
                  onBack();
                } else {
                  navigate('/');
                }
              }}
              className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/50 border border-white/15 text-white backdrop-blur-md transition-colors hover:bg-black/70 active:opacity-70 cursor-pointer shadow-lg"
              aria-label="Voltar para o início"
            >
              <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
            </button>
          </div>
        </header>

        {/* ── Conteúdo Central do Painel (Marca e Conceito à Esquerda com Alto Contraste abaixo do Botão Voltar) ── */}
        <div className="relative z-10 pt-5 sm:pt-6 flex-1 flex flex-col justify-start min-h-[130px] sm:min-h-[140px] px-4 sm:px-6">
          <div className="flex flex-col items-start text-left z-10 relative ml-0 sm:ml-2 max-w-[280px]">
            {/* Espaçador calibrado para o botão de voltar padrão ouro (desce o título com folga elegante) */}
            <div className="h-[58px] sm:h-[64px] mb-2 shrink-0 w-full" aria-hidden="true" />

            <h2 className="tracking-tight leading-[1.02] drop-shadow-[0_3px_8px_rgba(0,0,0,0.95)]">
              <span className="font-serif text-[24px] sm:text-[28px] font-medium text-white block">
                Audiobooks
              </span>
              <span className="font-serif italic text-[24px] sm:text-[28px] font-semibold text-[#c084fc] block drop-shadow-[0_2px_14px_rgba(192,132,252,0.65)] -mt-0.5">
                Direito Prime
              </span>
            </h2>

            <div className="mt-2 flex items-start text-left gap-2">
              <div className="w-[3px] h-8 bg-gradient-to-b from-[#c084fc] via-[#9333ea] to-[#4c1d95] rounded-full shrink-0 mt-0.5 shadow-[0_0_10px_rgba(192,132,252,0.6)]" />
              <p className="font-serif italic text-white/95 text-[11px] sm:text-[12px] leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                As grandes obras e pensadores,
                <br />
                narrados para o seu estudo.
              </p>
            </div>
          </div>
        </div>

        {/* ── 4 Botões de Ação Rápida no Rodapé do Painel (Ícones Roxos Unificados #C084FC) ── */}
        <div className="relative z-10 px-4 sm:px-6 md:px-8 pt-2.5 pb-5 sm:pb-6">
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
    </div>
  );
};

export default memo(AudiobooksHeroPanel);
