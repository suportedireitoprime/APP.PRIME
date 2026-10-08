import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Heart, ScrollText, StickyNote, Radar, ListMusic, History, Feather, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getLeiCover, getLeiColor, shade } from '@/lib/leiTheme';
import { isFavorito as isLeiFavorita } from '@/lib/leisFavoritos';
import { haptic } from '@/lib/nativeHaptics';
import brasaoImgAsset from '@/assets/brasao-republica.webp';
import ShapeGrid from '@/components/ui/ShapeGrid';
import fallbackTrilhas from '@/data/lei-seca-trilhas.json';
import { LEIS_CATALOG } from '@/data/leisCatalog';

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
  const bgGradient = `linear-gradient(135deg, ${shade(leiColor, -0.85)} 0%, ${shade(leiColor, -0.6)} 40%, ${leiColor} 100%)`;
  
  const selectedLei = leis.find((l) => l.id === selectedLeiId);
  const planaltoUrl = selectedLei?.url_planalto;

  return (
    <>
      {/* Shell sólido com cantos inferiores arredondados idêntico ao painel do Vade Mecum */}
      <div
        className="bg-hero-panel relative overflow-hidden rounded-b-[36px] shadow-2xl shadow-black/80 pt-[var(--sai-top)] flex flex-col z-20"
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

        {/* Imagem de Capa à Direita sem degradê cobrindo a arte */}
        <img
          src={cover}
          alt={`Capa — ${selectedLeiNome}`}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover object-right z-0 pointer-events-none"
        />

        {/* Overlay vermelho com gradiente de marca e corte diagonal poligonal idêntico ao Vade Mecum */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            filter:
              'drop-shadow(25px 0 25px rgba(0,0,0,0.85)) drop-shadow(8px 0 10px rgba(0,0,0,0.95))',
          }}
        >
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: 'polygon(0 0, 47% 0, 36% 100%, 0% 100%)' }}
          >
            <div className="absolute inset-0" style={{ backgroundImage: bgGradient }} />
            <div className="absolute inset-0 opacity-15 mix-blend-overlay">
              <ShapeGrid />
            </div>
          </div>
        </div>

        {/* Barra superior de navegação: Botão Voltar à esquerda e Planalto à direita */}
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

          <div className="flex items-center gap-2">
            {/* Botões movidos para LeiDetailView */}
          </div>
        </header>

        {/* Conteúdo do Painel: Título e Identificação da Lei à Esquerda (sobre a área vermelha, alinhado à Home) */}
        <div className="relative z-10 pt-8 sm:pt-10 flex-1 flex flex-col justify-start px-3 sm:px-4 ml-1 sm:ml-2 min-h-[120px] w-[48%] max-w-[190px]">
          {/* Brasão watermark sutil atrás do texto */}
          <img
            src={brasaoImg}
            alt=""
            aria-hidden
            className="absolute left-2 top-0 pointer-events-none select-none w-[90px] sm:w-[110px] opacity-[0.14] mix-blend-luminosity z-[-1]"
          />



          <h1 className="font-display text-white text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight leading-tight mt-1 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            {selectedLeiNome}
          </h1>

          {selectedLeiDescricao && (
            <p className="text-white/90 text-xs sm:text-sm mt-1.5 leading-snug line-clamp-2 font-medium drop-shadow">
              {selectedLeiDescricao}
            </p>
          )}
        </div>

        {/* Atalhos Rápidos na Base do Painel: FAVORITO, ANOTAÇÕES, RADAR, PLAYLIST com altura ampliada e badges sem corte */}
        <div className="relative z-10 px-3 sm:px-5 pt-3 pb-3 w-full max-w-lg mx-auto">
          <div className="flex items-center justify-between gap-2 mx-1 mt-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl p-2 shadow-2xl">
              {/* FAVORITOS DE ARTIGOS */}
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  onOpenOverlay?.('fav');
                }}
                className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-[14px] hover:bg-white/5 active:bg-white/10 transition-all duration-200 active:scale-95 gap-1.5 text-center select-none cursor-pointer overflow-hidden"
              >
                {favCount > 0 && (
                  <span className="absolute top-1 right-2 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[9px] font-bold leading-none flex items-center justify-center border border-[#050505] shadow-lg z-20 bg-[#F43F5E] pointer-events-none">
                    {favCount > 99 ? '99+' : favCount}
                  </span>
                )}
                <Heart
                  className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110"
                  style={{ color: '#F43F5E', filter: 'saturate(1.25) drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
                  strokeWidth={2}
                />
                <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight capitalize tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
                  Favorito
                </span>
              </button>

              {/* LIÇÕES (LEI SECA) */}
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
                  style={{ color: '#FACC15', filter: 'saturate(1.25) drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
                  strokeWidth={2}
                />
                <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight capitalize tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
                  Lições
                </span>
              </button>

              {/* RADAR */}
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  onOpenOverlay?.('radar');
                }}
                className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-[14px] hover:bg-white/5 active:bg-white/10 transition-all duration-200 active:scale-95 gap-1.5 text-center select-none cursor-pointer overflow-hidden"
              >
                {radarCount > 0 && (
                  <span className="absolute top-1 right-2 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[9px] font-bold leading-none flex items-center justify-center border border-[#050505] shadow-lg z-20 bg-[#38BDF8] pointer-events-none">
                    {radarCount > 99 ? '99+' : radarCount}
                  </span>
                )}
                <Radar
                  className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110"
                  style={{ color: '#38BDF8', filter: 'saturate(1.25) drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
                  strokeWidth={2}
                />
                <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight capitalize tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
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
                className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-[14px] hover:bg-white/5 active:bg-white/10 transition-all duration-200 active:scale-95 gap-1.5 text-center select-none cursor-pointer overflow-hidden"
              >
                {playlistCount > 0 && (
                  <span className="absolute top-1 right-2 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[9px] font-bold leading-none flex items-center justify-center border border-[#050505] shadow-lg z-20 bg-[#A855F7] pointer-events-none">
                    {playlistCount > 99 ? '99+' : playlistCount}
                  </span>
                )}
                <ListMusic
                  className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110"
                  style={{ color: '#A855F7', filter: 'saturate(1.25) drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
                  strokeWidth={2}
                />
                <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight capitalize tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
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
