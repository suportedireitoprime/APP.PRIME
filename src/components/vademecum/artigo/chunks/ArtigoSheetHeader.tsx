import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Eye,
  EyeOff,
  Type,
  Minus,
  Plus,
  ChevronRight,
  ExternalLink,
  X,
} from 'lucide-react';
import HighlightColorBar from '@/components/vademecum/grifos_ocr/HighlightColorBar';
import ShareButtons from '@/components/vademecum/navigation/ShareButtons';
import { MAGIC_COLORS } from '../artigoConstants';

interface ArtigoData {
  numero: string | number;
  titulo?: string | null;
  capitulo?: string | null;
  caput?: string;
}

interface BreadcrumbData {
  parte?: string;
  livro?: string;
  titulo?: string;
  tituloDesc?: string;
  capitulo?: string;
  capituloDesc?: string;
  secao?: string;
}

interface ArtigoSheetHeaderProps {
  artigo: ArtigoData;
  tabelaNome?: string;
  breadcrumb?: BreadcrumbData;
  isFavorito: boolean;
  onToggleFavorito?: () => void;
  isPremium: boolean;
  openPremiumGate: (feature: any) => void;
  showRedacao: boolean;
  setShowRedacao: React.Dispatch<React.SetStateAction<boolean>>;
  showFontControls: boolean;
  setShowFontControls: React.Dispatch<React.SetStateAction<boolean>>;
  fontSize: number;
  setFontSize: React.Dispatch<React.SetStateAction<number>>;
  onlineCount: number;
  highlightMode: boolean;
  voiceGrifoActive: boolean;
  onClose: () => void;
  planaltoUrl?: string | null;
  showSharePanel: boolean;
  selectedColor: string;
  setSelectedColor: (c: string) => void;
  clearAll: () => void;
  magicMode: boolean;
  magicHighlights: Array<{ id: string; cor: string }>;
}

export const ArtigoSheetHeader = memo(function ArtigoSheetHeader({
  artigo,
  tabelaNome,
  breadcrumb,
  isFavorito,
  onToggleFavorito,
  isPremium,
  openPremiumGate,
  showRedacao,
  setShowRedacao,
  showFontControls,
  setShowFontControls,
  fontSize,
  setFontSize,
  onlineCount,
  highlightMode,
  voiceGrifoActive,
  onClose,
  planaltoUrl,
  showSharePanel,
  selectedColor,
  setSelectedColor,
  clearAll,
  magicMode,
  magicHighlights,
}: ArtigoSheetHeaderProps) {
  return (
    <>
      {/* Top bar: heart/eye (left) + online count + close (right) */}
      <div className="px-4 pt-1 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!highlightMode && (
            <>
              <motion.button
                onClick={() => {
                  if (!isPremium) {
                    openPremiumGate('favorito');
                    return;
                  }
                  import('@/lib/appEvents')
                    .then(({ appEvents }) =>
                      appEvents.favoritarArtigo({
                        tabela: tabelaNome || '',
                        numero: artigo.numero,
                        on: !isFavorito,
                      })
                    )
                    .catch(() => {});
                  onToggleFavorito?.();
                }}
                whileTap={{ scale: 0.85 }}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                  isFavorito ? 'bg-rose-500/15' : 'hover:bg-secondary active:bg-secondary'
                }`}
                title={isFavorito ? 'Remover favorito' : 'Favoritar'}
                aria-label={isFavorito ? 'Remover favorito' : 'Favoritar'}
              >
                <motion.span
                  key={isFavorito ? 'on' : 'off'}
                  initial={{ scale: isFavorito ? 0.6 : 1 }}
                  animate={{ scale: isFavorito ? [0.6, 1.35, 1] : 1 }}
                  transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
                  className="inline-flex"
                >
                  <Heart
                    className={`w-6 h-6 transition-colors ${
                      isFavorito
                        ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.55)]'
                        : 'text-muted-foreground'
                    }`}
                    strokeWidth={2}
                  />
                </motion.span>
              </motion.button>

              <motion.button
                onClick={() => setShowRedacao((prev) => !prev)}
                whileTap={{ scale: 0.9 }}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                  showRedacao ? 'bg-primary/20' : 'hover:bg-secondary active:bg-secondary'
                }`}
                title={showRedacao ? 'Ocultar redações' : 'Mostrar redações'}
                aria-label={showRedacao ? 'Ocultar redações' : 'Mostrar redações'}
              >
                {showRedacao ? (
                  <Eye className="w-6 h-6 text-primary" />
                ) : (
                  <EyeOff className="w-6 h-6 text-muted-foreground" />
                )}
              </motion.button>

              <motion.button
                onClick={() => setShowFontControls((v) => !v)}
                whileTap={{ scale: 0.9 }}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                  showFontControls
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'hover:bg-secondary active:bg-secondary text-muted-foreground'
                }`}
                title="Tamanho da fonte"
                aria-label="Tamanho da fonte"
              >
                <Type className="w-5 h-5" />
              </motion.button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onlineCount > 1 && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-400/10 rounded-full px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {onlineCount}
            </span>
          )}
          {!highlightMode && (
            <button
              onClick={onClose}
              className="w-11 h-11 rounded-full bg-primary hover:bg-primary/90 transition-colors flex items-center justify-center"
              aria-label="Fechar"
            >
              <X className="w-5 h-5 text-primary-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Painel expansível de ajuste de tamanho de fonte */}
      <AnimatePresence>
        {showFontControls && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden px-4 pb-2"
          >
            <div className="flex items-center justify-between gap-3 px-4 py-2 rounded-2xl bg-secondary/80 border border-border backdrop-blur-md">
              <span className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-primary" /> Tamanho do texto
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFontSize((prev) => Math.max(prev - 1, 12))}
                  className="w-8 h-8 rounded-full bg-card hover:bg-card/80 border border-border flex items-center justify-center text-foreground active:scale-95 transition"
                  aria-label="Diminuir fonte"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold text-foreground min-w-[36px] text-center">
                  {fontSize}px
                </span>
                <button
                  onClick={() => setFontSize((prev) => Math.min(prev + 1, 26))}
                  className="w-8 h-8 rounded-full bg-card hover:bg-card/80 border border-border flex items-center justify-center text-foreground active:scale-95 transition"
                  aria-label="Aumentar fonte"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breadcrumb: PARTE > TÍTULO / descrição */}
      {(breadcrumb?.parte || breadcrumb?.titulo) && (
        <div className="px-5 pb-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {breadcrumb?.parte && <span>{breadcrumb.parte}</span>}
            {breadcrumb?.parte && breadcrumb?.titulo && <ChevronRight className="w-3 h-3" />}
            {breadcrumb?.titulo && <span>{breadcrumb.titulo}</span>}
          </div>
          {breadcrumb?.tituloDesc && (
            <p className="text-[11px] uppercase tracking-wide text-foreground/70 font-body leading-snug mt-0.5">
              {breadcrumb.tituloDesc}
            </p>
          )}
        </div>
      )}

      {/* Big Art. Nº + Ver no Planalto */}
      <div className="px-5 pt-1 pb-3 flex items-center justify-between gap-3">
        <h3 className="font-display text-3xl font-bold text-foreground">
          {/^\d/.test(String(artigo.numero)) ? `Art. ${artigo.numero}` : artigo.numero}
        </h3>
        {planaltoUrl && !highlightMode && (
          <a
            href={planaltoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 pl-3.5 pr-4 py-2 rounded-full bg-neutral-900/85 border border-white/10 shadow-lg shadow-black/40 text-white/90 hover:text-white hover:bg-neutral-800 active:scale-95 transition shrink-0"
            aria-label="Ver no Planalto"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="text-[13px] font-medium whitespace-nowrap">Ver no Planalto</span>
          </a>
        )}
      </div>

      {/* Share panel */}
      <AnimatePresence>
        {showSharePanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 pb-2 overflow-hidden"
          >
            <ShareButtons
              artigoNumero={String(artigo.numero)}
              artigoTexto={artigo.caput || ''}
              leiNome={tabelaNome}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Título (fallback if no breadcrumb prop) */}
      {!breadcrumb &&
        artigo.titulo &&
        (() => {
          const parts = artigo.titulo.match(/^(T[IÍ]TULO\s+[IVXLC\d]+)\s*[-–]?\s*(.*)/i);
          if (parts) {
            return (
              <div className="px-5 pb-1">
                <p className="text-[11px] text-foreground/70 font-body uppercase tracking-wide">
                  {parts[1]}
                </p>
                <p className="text-[11px] text-foreground font-body leading-snug">{parts[2]}</p>
              </div>
            );
          }
          return (
            <div className="px-5 pb-1">
              <p className="text-[11px] text-foreground font-body leading-snug">{artigo.titulo}</p>
            </div>
          );
        })()}

      {/* Capítulo (fallback if no breadcrumb prop) */}
      {!breadcrumb &&
        artigo.capitulo &&
        (() => {
          const parts = artigo.capitulo.match(/^(CAP[IÍ]TULO\s+[IVXLC\d]+)\s*[-–]?\s*(.*)/i);
          if (parts) {
            return (
              <div className="px-5 pb-2">
                <p className="text-[11px] text-foreground/70 font-body uppercase tracking-wide">
                  {parts[1]}
                </p>
                <p className="text-[11px] text-foreground font-body leading-snug">{parts[2]}</p>
              </div>
            );
          }
          return (
            <div className="px-5 pb-2">
              <p className="text-[11px] text-foreground font-body leading-snug">{artigo.capitulo}</p>
            </div>
          );
        })()}

      <AnimatePresence>
        {(highlightMode || voiceGrifoActive) && (
          <HighlightColorBar
            selectedColor={selectedColor}
            onSelectColor={setSelectedColor}
            onClearAll={clearAll}
          />
        )}
      </AnimatePresence>

      {/* Magic Highlights Legend */}
      <AnimatePresence>
        {magicMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 pb-2 overflow-hidden"
          >
            <div className="flex items-center gap-3 flex-wrap py-1.5">
              {(() => {
                const LABELS: Record<string, string> = {
                  amarelo: 'Chave',
                  verde: 'Exceção',
                  azul: 'Efeito',
                  rosa: 'Termo',
                  laranja: 'Pegadinha',
                };
                const ORDER = ['amarelo', 'verde', 'azul', 'rosa', 'laranja'];
                const present = new Set(magicHighlights.map((g) => g.cor));
                return ORDER.filter((c) => present.has(c as any)).map((cor) => (
                  <span
                    key={cor}
                    className="flex items-center gap-1 text-[10px] text-foreground/70"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor: MAGIC_COLORS[cor],
                        boxShadow: `0 0 0 1px ${MAGIC_COLORS[cor]}`,
                      }}
                    />
                    {LABELS[cor]}
                  </span>
                ));
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});
