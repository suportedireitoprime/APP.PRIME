import React, { useState } from 'react';
import { ArrowLeft, ExternalLink, Heart, ScrollText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getLeiColor, getLeiCover, shade } from '@/lib/leiTheme';
import { isFavorito as isLeiFavorita, toggleFavorito as toggleLeiFavorito } from '@/lib/leisFavoritos';
import brasaoImgAsset from '@/assets/brasao-republica.webp';

const brasaoImg = brasaoImgAsset;

interface LeiHeroProps {
  isDesktop: boolean;
  selectedLeiId: string;
  tipo: string | undefined;
  leis: any[]; // The generic law type array
  selectedLeiNome: string;
  selectedLeiDescricao: string;
  config: { label: string; bg: string } | null;
  goBack: () => void;
  leiFavToggle: number;
  setLeiFavToggle: React.Dispatch<React.SetStateAction<number>>;
  selectedLeiEmenta: string | null;
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
}) => {
  const [showEmentaDialog, setShowEmentaDialog] = useState(false);

  const leiColor = getLeiColor(selectedLeiId, tipo);
  const cover = getLeiCover(selectedLeiId, tipo);
  const selectedLei = leis.find((l) => l.id === selectedLeiId);
  const planaltoUrl = selectedLei?.url_planalto;

  return (
    <>
      <div
        className="relative overflow-hidden w-full pt-[var(--sai-top)]"
        style={{
          aspectRatio: isDesktop ? '21 / 7' : '16 / 10',
          ...(isDesktop ? { maxHeight: 300, minHeight: 200 } : null),
        }}
      >
        <img
          src={cover}
          alt={`Capa — ${selectedLeiNome}`}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Suave tint colorido — deixa os desenhos laterais aparecerem */}
        <div
          className="absolute inset-0 mix-blend-multiply"
          style={{ background: `linear-gradient(135deg, ${leiColor}80 0%, ${shade(leiColor, -0.4)}60 100%)` }}
        />
        {/* Brasão watermark centralizado atrás do título */}
        <img
          src={brasaoImg}
          alt=""
          aria-hidden
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none w-[180px] md:w-[240px] opacity-[0.14] mix-blend-luminosity"
        />
        {/* Degradê inferior — funde com o fundo preto da página */}
        <div
          className="absolute inset-x-0 bottom-0 h-2/3"
          style={{ background: `linear-gradient(180deg, transparent 0%, hsl(var(--background) / 0.55) 55%, hsl(var(--background)) 100%)` }}
        />
        
        {/* Botão flutuante em vidro — voltar para a rota anterior */}
        <button
          type="button"
          onClick={goBack}
          aria-label="Voltar"
          className="absolute left-4 top-[calc(var(--sai-top)+12px)] z-20 w-12 h-12 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-xl border border-white/25 shadow-[0_8px_24px_rgba(0,0,0,0.35)] active:scale-95 transition touch-manipulation select-none"
        >
          <ArrowLeft className="w-6 h-6 text-white drop-shadow" />
        </button>

        {/* Botão de favoritar a lei — mesma linha do voltar, à direita */}
        {selectedLei && (() => {
          const fav = isLeiFavorita(selectedLei.id);
          void leiFavToggle; // força re-render em mudanças externas
          return (
            <button
              type="button"
              onClick={() => {
                toggleLeiFavorito({
                  tipo: selectedLei.tipo,
                  leiId: selectedLei.id,
                  nome: selectedLei.nome,
                  descricao: selectedLei.descricao,
                  tabela_nome: selectedLei.tabela_nome,
                });
                setLeiFavToggle((n) => n + 1);
              }}
              aria-label={fav ? 'Remover dos favoritos' : 'Favoritar lei'}
              className={`absolute right-4 top-[calc(var(--sai-top)+12px)] z-20 w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl border shadow-[0_8px_24px_rgba(0,0,0,0.35)] active:scale-95 transition touch-manipulation select-none ${fav ? 'bg-rose-500/25 border-rose-300/50' : 'bg-white/10 border-white/25'}`}
            >
              <Heart className={`w-6 h-6 drop-shadow ${fav ? 'text-rose-400 fill-rose-400' : 'text-white'}`} />
            </button>
          );
        })()}

        {/* Texto */}
        <div className="absolute inset-0 flex flex-col items-center justify-end text-center px-6 pb-5 lg:pb-4">
          <p
            className="text-[10px] font-semibold tracking-[0.35em] uppercase mb-2 lg:mb-1 opacity-80"
            style={{ color: '#ffffff' }}
          >
            {config?.label || 'Legislação'}
          </p>
          <h1 className="font-display text-white text-2xl md:text-4xl lg:text-3xl font-bold uppercase tracking-wide leading-tight drop-shadow-lg">
            {selectedLeiNome}
          </h1>
          {selectedLeiDescricao && (
            <p className="text-white/85 text-xs md:text-sm mt-2 lg:mt-1 max-w-2xl leading-snug line-clamp-2">
              {selectedLeiDescricao}
            </p>
          )}
          <div
            className="mt-3 lg:mt-2 h-0.5 w-16 rounded-full"
            style={{ background: `linear-gradient(90deg, transparent, #ffffff, transparent)` }}
          />
          <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
            {planaltoUrl && (
              <a
                href={planaltoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 w-32 h-9 text-[11px] text-white/90 hover:text-white transition-colors font-medium bg-black/30 backdrop-blur-sm rounded-full border border-white/20 shrink-0"
              >
                <ExternalLink className="w-3 h-3" />
                <span>{/^(estadual|municipal)_/.test(tipo || '') ? 'Ver legislação' : 'Ver no Planalto'}</span>
              </a>
            )}

            {selectedLeiEmenta && (
              <button
                type="button"
                onClick={() => setShowEmentaDialog(true)}
                className="inline-flex items-center justify-center gap-1.5 w-32 h-9 text-[11px] text-red-100 hover:text-white transition-colors font-medium bg-red-950/40 hover:bg-red-900/50 backdrop-blur-sm rounded-full border border-red-400/40 shrink-0"
              >
                <ScrollText className="w-3 h-3" />
                <span>Ver ementa</span>
              </button>
            )}
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
