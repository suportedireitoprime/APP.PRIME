import React, { useState } from 'react';
import { ArrowLeft, ExternalLink, Heart, ScrollText, StickyNote, Radar, ListMusic } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getLeiColor, getLeiCover } from '@/lib/leiTheme';
import { isFavorito as isLeiFavorita, toggleFavorito as toggleLeiFavorito } from '@/lib/leisFavoritos';
import { haptic } from '@/lib/nativeHaptics';
import brasaoImgAsset from '@/assets/brasao-republica.webp';

const brasaoImg = brasaoImgAsset;

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
  onOpenOverlay?: (panel: 'fav' | 'playlist' | 'anotacoes' | 'radar') => void;
  favCount?: number;
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
}) => {
  const [showEmentaDialog, setShowEmentaDialog] = useState(false);

  const cover = getLeiCover(selectedLeiId, tipo);
  const selectedLei = leis.find((l) => l.id === selectedLeiId);
  const planaltoUrl = selectedLei?.url_planalto;
  const isFav = selectedLei ? isLeiFavorita(selectedLei.id) : false;

  return (
    <>
      {/* Shell sólido com cantos inferiores arredondados idêntico ao painel inicial do aplicativo */}
      <div
        className="bg-hero-panel relative overflow-hidden rounded-b-[36px] shadow-2xl shadow-black/70 pt-[var(--sai-top)] flex flex-col z-20"
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

        {/* Imagem de Capa real sem degradê */}
        <img
          src={cover}
          alt={`Capa — ${selectedLeiNome}`}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover object-center z-0 pointer-events-none"
        />

        {/* Brasão watermark centralizado atrás do título */}
        <img
          src={brasaoImg}
          alt=""
          aria-hidden
          className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none w-[180px] md:w-[240px] opacity-[0.10] mix-blend-luminosity z-[1]"
        />

        {/* Barra superior de navegação: Botão Voltar */}
        <header className="relative z-20 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] px-4 pb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            aria-label="Voltar"
            className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full flex items-center justify-center bg-black/45 backdrop-blur-md border border-white/10 text-white shadow-xl transition-all hover:bg-black/60 active:scale-95"
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
          </button>
        </header>

        {/* Conteúdo Central: Título e Identificação da Lei */}
        <div className="relative z-10 px-4 pt-1 sm:pt-2 pb-2 flex flex-col items-center justify-center text-center">
          <p className="text-[10px] sm:text-xs font-bold tracking-[0.35em] uppercase text-white/75 mb-1">
            {config?.label || 'Códigos'}
          </p>

          <h1 className="font-display text-white text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase tracking-wide leading-tight drop-shadow-xl">
            {selectedLeiNome}
          </h1>

          {selectedLeiDescricao && (
            <p className="text-white/80 text-xs sm:text-sm mt-1 max-w-xl leading-snug line-clamp-2 px-2">
              {selectedLeiDescricao}
            </p>
          )}

          <div
            className="my-2.5 h-0.5 w-16 rounded-full"
            style={{ background: 'linear-gradient(90deg, transparent, #ffffff, transparent)' }}
          />

          <div className="flex items-center justify-center gap-2 flex-wrap">
            {planaltoUrl && (
              <a
                href={planaltoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] text-white/90 hover:text-white transition-colors font-medium bg-black/40 backdrop-blur-sm rounded-full border border-white/20 active:scale-95"
              >
                <ExternalLink className="w-3 h-3" />
                <span>{/^(estadual|municipal)_/.test(tipo || '') ? 'Ver legislação' : 'Ver no Planalto'}</span>
              </a>
            )}

            {selectedLeiEmenta && (
              <button
                type="button"
                onClick={() => setShowEmentaDialog(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] text-red-100 hover:text-white transition-colors font-medium bg-red-950/40 hover:bg-red-900/50 backdrop-blur-sm rounded-full border border-red-400/40 active:scale-95"
              >
                <ScrollText className="w-3 h-3" />
                <span>Ver ementa</span>
              </button>
            )}
          </div>
        </div>

        {/* Atalhos Rápidos dentro do Painel: FAVORITO, ANOTAÇÕES, RADAR, PLAYLIST */}
        <div className="relative z-10 px-3 sm:px-6 pt-2 pb-5 w-full max-w-lg mx-auto">
          <div className="grid grid-cols-4 gap-2">
            {/* FAVORITOS DE ARTIGOS */}
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                onOpenOverlay?.('fav');
              }}
              className="group flex flex-col items-center justify-center py-3 px-1 rounded-2xl bg-black/45 backdrop-blur-md border border-white/10 shadow-xl hover:bg-black/60 transition-all active:scale-95 gap-1.5 text-center min-h-[48px] select-none cursor-pointer overflow-hidden relative"
            >
              {favCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-bold leading-none flex items-center justify-center border border-white/20 shadow z-10 bg-[#F43F5E]">
                  {favCount > 99 ? '99+' : favCount}
                </span>
              )}
              <Heart
                className="w-5 h-5 shrink-0 transition-all group-hover:scale-110 text-[#F43F5E]"
                fill={favCount > 0 ? '#F43F5E' : 'none'}
                strokeWidth={2}
              />
              <span className="text-[9px] sm:text-[10px] font-extrabold text-white/90 leading-tight uppercase tracking-wider">
                Favorito
              </span>
            </button>

            {/* ANOTAÇÕES */}
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                onOpenOverlay?.('anotacoes');
              }}
              className="group flex flex-col items-center justify-center py-3 px-1 rounded-2xl bg-black/45 backdrop-blur-md border border-white/10 shadow-xl hover:bg-black/60 transition-all active:scale-95 gap-1.5 text-center min-h-[48px] select-none cursor-pointer overflow-hidden relative"
            >
              <StickyNote className="w-5 h-5 shrink-0 transition-all group-hover:scale-110 text-[#FACC15]" strokeWidth={2} />
              <span className="text-[9px] sm:text-[10px] font-extrabold text-white/90 leading-tight uppercase tracking-wider">
                Anotações
              </span>
            </button>

            {/* RADAR */}
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                onOpenOverlay?.('radar');
              }}
              className="group flex flex-col items-center justify-center py-3 px-1 rounded-2xl bg-black/45 backdrop-blur-md border border-white/10 shadow-xl hover:bg-black/60 transition-all active:scale-95 gap-1.5 text-center min-h-[48px] select-none cursor-pointer overflow-hidden relative"
            >
              <Radar className="w-5 h-5 shrink-0 transition-all group-hover:scale-110 text-[#38BDF8]" strokeWidth={2} />
              <span className="text-[9px] sm:text-[10px] font-extrabold text-white/90 leading-tight uppercase tracking-wider">
                Radar
              </span>
            </button>

            {/* PLAYLIST */}
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                onOpenOverlay?.('playlist');
              }}
              className="group flex flex-col items-center justify-center py-3 px-1 rounded-2xl bg-black/45 backdrop-blur-md border border-white/10 shadow-xl hover:bg-black/60 transition-all active:scale-95 gap-1.5 text-center min-h-[48px] select-none cursor-pointer overflow-hidden relative"
            >
              <ListMusic className="w-5 h-5 shrink-0 transition-all group-hover:scale-110 text-[#A855F7]" strokeWidth={2} />
              <span className="text-[9px] sm:text-[10px] font-extrabold text-white/90 leading-tight uppercase tracking-wider">
                Playlist
              </span>
            </button>
          </div>
        </div>
      </div>

      <Dialog open={showEmentaDialog} onOpenChange={setShowEmentaDialog}>
        <DialogContent className="max-w-lg border-red-400/30 bg-gradient-to-b from-red-950/40 to-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-200">
              <ScrollText className="w-4 h-4" />
              Ementa
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm md:text-[15px] italic leading-relaxed text-red-100/95 whitespace-pre-line">
            {selectedLeiEmenta}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LeiHero;
