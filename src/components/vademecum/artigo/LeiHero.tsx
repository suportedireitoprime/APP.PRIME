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
            style={{ clipPath: 'polygon(0 0, 65% 0, 45% 100%, 0% 100%)' }}
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
            {selectedLeiEmenta && (
              <button
                type="button"
                onClick={() => setShowEmentaDialog(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3 min-h-[48px] text-xs text-white/90 hover:text-white transition-all font-semibold bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full border border-white/20 active:opacity-70 shadow-lg"
              >
                <ScrollText className="w-3.5 h-3.5" />
                <span className="font-bold">Ementa</span>
              </button>
            )}

            {onOpenSobre && (
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  onOpenSobre();
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3 min-h-[48px] text-xs text-white/90 hover:text-white transition-all font-semibold bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full border border-white/20 active:opacity-70 shadow-lg"
              >
                <Info className="w-3.5 h-3.5" />
                <span className="font-bold">Sobre</span>
              </button>
            )}

            {planaltoUrl && (
              <a
                href={planaltoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 min-h-[48px] text-xs sm:text-sm text-white hover:text-white transition-all font-bold bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full border border-white/25 active:opacity-70 shadow-xl hover:border-white/40"
              >
                <ExternalLink className="w-3.5 h-3.5 text-zinc-300" />
                <span className="font-bold">Planalto</span>
              </a>
            )}
          </div>
        </header>

        {/* Conteúdo do Painel: Título e Identificação da Lei à Esquerda (sobre a área vermelha, alinhado à Home) */}
        <div className="relative z-10 px-3 sm:px-4 ml-1 sm:ml-2 pt-1 sm:pt-2 pb-3.5 sm:pb-4 flex flex-col justify-start w-[65%] sm:w-[55%] max-w-[320px]">
          {/* Brasão watermark sutil atrás do texto */}
          <img
            src={brasaoImg}
            alt=""
            aria-hidden
            className="absolute left-2 top-0 pointer-events-none select-none w-[100px] sm:w-[130px] opacity-[0.14] mix-blend-luminosity z-[-1]"
          />

          <p className="text-[11px] sm:text-[12px] font-extrabold tracking-[0.25em] uppercase text-white/90 drop-shadow">
            {config?.label || 'Códigos'}
          </p>

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
        <div className="relative z-10 px-3 sm:px-6 pt-2.5 pb-6 sm:pb-7 w-full max-w-lg mx-auto">
          <div className="relative rounded-2xl bg-black/45 backdrop-blur-md border border-white/10 shadow-xl overflow-hidden">
            <div className="grid grid-cols-4 divide-x divide-white/10">
              {/* FAVORITOS DE ARTIGOS */}
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  onOpenOverlay?.('fav');
                }}
                className="group flex flex-col items-center justify-center py-3 px-1 hover:bg-white/10 transition-colors active:opacity-70 gap-1.5 text-center min-h-[56px] select-none cursor-pointer relative"
              >
                {favCount > 0 && (
                  <span className="absolute top-1 right-2 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[9px] font-bold leading-none flex items-center justify-center border border-[#050505] shadow-lg z-20 bg-[#F43F5E] pointer-events-none">
                    {favCount > 99 ? '99+' : favCount}
                  </span>
                )}
                <Heart
                  className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-all group-hover:scale-110 text-[#F43F5E]"
                  fill="none"
                  strokeWidth={2}
                />
                <span className="text-[8.5px] sm:text-[10px] font-extrabold text-white/90 leading-tight uppercase tracking-wider">
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
                className="group flex flex-col items-center justify-center py-3 px-1 hover:bg-white/10 transition-colors active:opacity-70 gap-1.5 text-center min-h-[56px] select-none cursor-pointer relative"
              >
                <Feather
                  className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-all group-hover:scale-110 text-[#FACC15]"
                  strokeWidth={2}
                />
                <span className="text-[8.5px] sm:text-[10px] font-extrabold text-white/90 leading-tight uppercase tracking-wider text-center block">
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
                className="group flex flex-col items-center justify-center py-3 px-1 hover:bg-white/10 transition-colors active:opacity-70 gap-1.5 text-center min-h-[56px] select-none cursor-pointer relative"
              >
                {radarCount > 0 && (
                  <span className="absolute top-1 right-2 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[9px] font-bold leading-none flex items-center justify-center border border-[#050505] shadow-lg z-20 bg-[#38BDF8] pointer-events-none">
                    {radarCount > 99 ? '99+' : radarCount}
                  </span>
                )}
                <Radar
                  className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-all group-hover:scale-110 text-[#38BDF8]"
                  strokeWidth={2}
                />
                <span className="text-[8.5px] sm:text-[10px] font-extrabold text-white/90 leading-tight uppercase tracking-wider">
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
                className="group flex flex-col items-center justify-center py-3 px-1 hover:bg-white/10 transition-colors active:opacity-70 gap-1.5 text-center min-h-[56px] select-none cursor-pointer relative"
              >
                {playlistCount > 0 && (
                  <span className="absolute top-1 right-2 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[9px] font-bold leading-none flex items-center justify-center border border-[#050505] shadow-lg z-20 bg-[#A855F7] pointer-events-none">
                    {playlistCount > 99 ? '99+' : playlistCount}
                  </span>
                )}
                <ListMusic
                  className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-all group-hover:scale-110 text-[#A855F7]"
                  strokeWidth={2}
                />
                <span className="text-[8.5px] sm:text-[10px] font-extrabold text-white/90 leading-tight uppercase tracking-wider">
                  Playlist
                </span>
              </button>
            </div>
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
