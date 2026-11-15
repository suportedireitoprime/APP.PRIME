// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ScrollText, Heart, Radar, ListMusic, Feather } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getLeiCover, getLeiColor } from '@/lib/leiTheme';
import { haptic } from '@/lib/nativeHaptics';
import HeroAnimatedWave from '@/components/vademecum/home/HeroAnimatedWave';
import fallbackTrilhas from '@/data/lei-seca-trilhas.json';
import { LEIS_CATALOG } from '@/data/leisCatalog';

interface LeiHeroProps {
  isDesktop: boolean;
  selectedLeiId: string;
  tipo: string | undefined;
  leis: any[];
  selectedLeiNome: string;
  selectedLeiDescricao: string;
  config: { label: string; bg: string } | null;
  goBack: () => void;
  leiFavToggle: number;
  setLeiFavToggle: React.Dispatch<React.SetStateAction<number>>;
  selectedLeiEmenta: string | null;
  onOpenOverlay?: (panel: 'fav' | 'playlist' | 'anotacoes' | 'radar' | 'novidades') => void;
  favCount?: number;
  anotacoesCount?: number;
  radarCount?: number;
  novidadesCount?: number;
  playlistCount?: number;
  hideBackButton?: boolean;
  onOpenSobre?: () => void;
}

const LeiHero: React.FC<LeiHeroProps> = ({
  isDesktop,
  selectedLeiId,
  tipo,
  leis,
  selectedLeiNome,
  selectedLeiDescricao,
  config,
  goBack,
  leiFavToggle,
  setLeiFavToggle,
  selectedLeiEmenta,
  onOpenOverlay,
  favCount = 0,
  anotacoesCount = 0,
  radarCount = 0,
  novidadesCount = 0,
  playlistCount = 0,
  hideBackButton = false,
  onOpenSobre,
}) => {
  const navigate = useNavigate();
  const [showEmentaDialog, setShowEmentaDialog] = useState(false);

  const cover = getLeiCover(selectedLeiId, tipo);
  const leiColor = getLeiColor(selectedLeiId, tipo);

  return (
    <>
      {/* Shell sólido com cantos inferiores arredondados idêntico ao painel do Vade Mecum */}
      <div
        className="bg-hero-panel relative overflow-hidden rounded-b-[36px] shadow-2xl shadow-black/80 pt-[var(--sai-top)] flex flex-col z-20 min-h-[300px] xs:min-h-[315px] sm:min-h-[330px]"
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

        {/* Imagem de Capa Temática à Direita */}
        <img
          src={cover}
          alt={`Capa — ${selectedLeiNome}`}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover object-right z-0 pointer-events-none"
        />

        {/* Onda Fluida e Animada em Cetim 3D na Cor do Tema da Lei (idêntica à do Vade Mecum) */}
        <HeroAnimatedWave themeColor={leiColor} />

        {/* Barra superior de navegação: Botão Voltar */}
        <header className="relative z-20 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] px-4 pb-1.5 flex items-center justify-between min-h-[64px]">
          <div>
            {!hideBackButton && (
              <button
                type="button"
                onClick={goBack}
                aria-label="Voltar"
                className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full flex items-center justify-center bg-black/45 backdrop-blur-md border border-white/10 text-white shadow-xl transition-all hover:bg-black/60 active:opacity-70 cursor-pointer"
              >
                <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2" />
        </header>

        {/* Conteúdo do Painel: Título e Identificação da Lei à Esquerda alinhado ao padrão Vade Mecum */}
        <div className="relative z-10 pt-4 sm:pt-6 flex-1 flex flex-col justify-start px-4 sm:px-5 ml-1 sm:ml-2 min-h-[110px] w-[55%] max-w-[240px]">
          <h1 className="font-display text-white text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight leading-tight mt-1 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            {selectedLeiNome}
          </h1>

          {selectedLeiDescricao && (
            <p className="text-white/90 text-xs sm:text-sm mt-1.5 leading-snug line-clamp-2 font-medium drop-shadow">
              {selectedLeiDescricao}
            </p>
          )}

          {/* Traço de destaque da marca na cor temática da lei */}
          <div 
            className="w-10 h-1 rounded-full mt-2.5 transition-all duration-300" 
            style={{ 
              backgroundColor: leiColor,
              boxShadow: `0 0 10px ${leiColor}99`
            }} 
          />
        </div>

        {/* Atalhos Rápidos na Base do Painel: FAVORITO, LIÇÕES, RADAR, PLAYLIST com ícones e badges na cor do tema da lei */}
        <div className="relative z-10 px-3 sm:px-5 pt-2 pb-3 w-full max-w-lg mx-auto">
          <div className="flex items-center justify-between gap-2 mx-1 mt-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl p-2 shadow-2xl">
            {/* 1. FAVORITOS DE ARTIGOS */}
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                onOpenOverlay?.('fav');
              }}
              className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-[14px] hover:bg-white/5 active:bg-white/10 transition-all duration-200 active:scale-95 gap-1.5 text-center select-none cursor-pointer overflow-hidden"
            >
              {favCount > 0 && (
                <span 
                  className="absolute top-1 right-2 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[9px] font-bold leading-none flex items-center justify-center border border-[#050505] shadow-lg z-20 pointer-events-none"
                  style={{ backgroundColor: leiColor }}
                >
                  {favCount > 99 ? '99+' : favCount}
                </span>
              )}
              <Heart
                className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110"
                style={{ 
                  color: leiColor, 
                  filter: `drop-shadow(0 2px 6px ${leiColor}99) drop-shadow(0 1px 2px rgba(0,0,0,0.8))` 
                }}
                strokeWidth={2.2}
              />
              <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight capitalize tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
                Favorito
              </span>
            </button>

            {/* 2. LIÇÕES (LEI SECA) */}
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                const catalogItem = LEIS_CATALOG.find((l) => l.id === selectedLeiId);
                const trilha = fallbackTrilhas.find(
                  (t) => t.sigla.toLowerCase() === catalogItem?.sigla.toLowerCase()
                );
                const targetSlug = trilha ? trilha.slug : selectedLeiId;
                navigate(`/lei-seca/${targetSlug}`, { state: { returnToLei: selectedLeiId } });
              }}
              className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-[14px] hover:bg-white/5 active:bg-white/10 transition-all duration-200 active:scale-95 gap-1.5 text-center select-none cursor-pointer overflow-hidden"
            >
              <Feather
                className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110"
                style={{ 
                  color: leiColor, 
                  filter: `drop-shadow(0 2px 6px ${leiColor}99) drop-shadow(0 1px 2px rgba(0,0,0,0.8))` 
                }}
                strokeWidth={2.2}
              />
              <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight capitalize tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
                Lições
              </span>
            </button>

            {/* 3. RADAR */}
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                onOpenOverlay?.('radar');
              }}
              className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-[14px] hover:bg-white/5 active:bg-white/10 transition-all duration-200 active:scale-95 gap-1.5 text-center select-none cursor-pointer overflow-hidden"
            >
              {radarCount > 0 && (
                <span 
                  className="absolute top-1 right-2 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[9px] font-bold leading-none flex items-center justify-center border border-[#050505] shadow-lg z-20 pointer-events-none"
                  style={{ backgroundColor: leiColor }}
                >
                  {radarCount > 99 ? '99+' : radarCount}
                </span>
              )}
              <Radar
                className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110"
                style={{ 
                  color: leiColor, 
                  filter: `drop-shadow(0 2px 6px ${leiColor}99) drop-shadow(0 1px 2px rgba(0,0,0,0.8))` 
                }}
                strokeWidth={2.2}
              />
              <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight capitalize tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
                Radar
              </span>
            </button>

            {/* 4. PLAYLIST */}
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                onOpenOverlay?.('playlist');
              }}
              className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-[14px] hover:bg-white/5 active:bg-white/10 transition-all duration-200 active:scale-95 gap-1.5 text-center select-none cursor-pointer overflow-hidden"
            >
              {playlistCount > 0 && (
                <span 
                  className="absolute top-1 right-2 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[9px] font-bold leading-none flex items-center justify-center border border-[#050505] shadow-lg z-20 pointer-events-none"
                  style={{ backgroundColor: leiColor }}
                >
                  {playlistCount > 99 ? '99+' : playlistCount}
                </span>
              )}
              <ListMusic
                className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110"
                style={{ 
                  color: leiColor, 
                  filter: `drop-shadow(0 2px 6px ${leiColor}99) drop-shadow(0 1px 2px rgba(0,0,0,0.8))` 
                }}
                strokeWidth={2.2}
              />
              <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight capitalize tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
                Playlist
              </span>
            </button>
          </div>
        </div>
      </div>

      <Dialog open={showEmentaDialog} onOpenChange={setShowEmentaDialog}>
        <DialogContent className="max-w-lg border-white/10 bg-gradient-to-b from-zinc-950/95 to-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white" style={{ color: leiColor }}>
              <ScrollText className="w-4 h-4" />
              Ementa
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm md:text-[15px] italic leading-relaxed text-zinc-200 whitespace-pre-line">
            {selectedLeiEmenta}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LeiHero;
