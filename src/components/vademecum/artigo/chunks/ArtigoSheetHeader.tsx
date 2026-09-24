import React, { memo, useMemo } from 'react';
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
  Zap,
  AlignJustify,
  ScanLine,
} from 'lucide-react';
import HighlightColorBar from '@/components/vademecum/grifos_ocr/HighlightColorBar';
import ShareButtons from '@/components/vademecum/navigation/ShareButtons';
import { MAGIC_COLORS, type VadeMecumFontFamily, type VadeMecumLineHeight } from '../artigoConstants';
import { BreadcrumbData, toTitleCase } from '../artigoBreadcrumbs';

interface ArtigoData {
  numero: string | number;
  titulo?: string | null;
  capitulo?: string | null;
  caput?: string;
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
  fontFamily?: VadeMecumFontFamily;
  setFontFamily?: (f: VadeMecumFontFamily) => void;
  lineHeight?: VadeMecumLineHeight;
  setLineHeight?: (lh: VadeMecumLineHeight) => void;
  bionicReading?: boolean;
  setBionicReading?: React.Dispatch<React.SetStateAction<boolean>>;
  readingGuide?: boolean;
  setReadingGuide?: React.Dispatch<React.SetStateAction<boolean>>;
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
  magicHighlights: Array<{ id?: string; cor: string; [key: string]: any }>;
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
  fontFamily = 'sans',
  setFontFamily,
  lineHeight = '1.8',
  setLineHeight,
  bionicReading = false,
  setBionicReading,
  readingGuide = false,
  setReadingGuide,
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
  const timelineItems = useMemo(() => {
    const items: Array<{ label: string }> = [];

    if (breadcrumb?.parte) {
      items.push({ label: toTitleCase(breadcrumb.parte) });
    }
    if (breadcrumb?.livro) {
      items.push({ label: toTitleCase(breadcrumb.livro) });
    }
    if (breadcrumb?.titulo) {
      items.push({ label: toTitleCase(breadcrumb.titulo) });
      if (breadcrumb.tituloDesc) {
        items.push({ label: toTitleCase(breadcrumb.tituloDesc) });
      }
    } else if (!breadcrumb && artigo.titulo && /^(T[IÍ]TULO|PARTE|LIVRO)\b/i.test(artigo.titulo)) {
      const cleaned = artigo.titulo.replace(/[()]/g, '');
      const parts = cleaned.split(/\s*[-—–:]\s*/).filter(Boolean);
      parts.forEach(p => items.push({ label: toTitleCase(p) }));
    }

    if (breadcrumb?.capitulo) {
      items.push({ label: toTitleCase(breadcrumb.capitulo) });
      if (breadcrumb.capituloDesc) {
        items.push({ label: toTitleCase(breadcrumb.capituloDesc) });
      }
    } else if (!breadcrumb && artigo.capitulo && /^CAP[ÍI]TULO\b/i.test(artigo.capitulo)) {
      const cleaned = artigo.capitulo.replace(/[()]/g, '');
      const parts = cleaned.split(/\s*[-—–:]\s*/).filter(Boolean);
      parts.forEach(p => items.push({ label: toTitleCase(p) }));
    }

    if (breadcrumb?.secao) {
      items.push({ label: toTitleCase(breadcrumb.secao) });
    }
    if (breadcrumb?.subsecao) {
      items.push({ label: toTitleCase(breadcrumb.subsecao) });
    }

    // Se nenhum nível pai for detectado e temos nome da tabela/lei
    if (items.length === 0 && tabelaNome && !/^resenha_/i.test(tabelaNome)) {
      items.push({ label: toTitleCase(tabelaNome.replace(/_/g, ' ')) });
    }

    return items;
  }, [breadcrumb, artigo.titulo, artigo.capitulo, tabelaNome]);

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

      {/* Painel expansível de ajuste de tipografia e leitura (Itens 01 e 02) */}
      <AnimatePresence>
        {showFontControls && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden px-4 pb-2.5"
          >
            <div className="flex flex-col gap-2.5 p-3 rounded-2xl bg-secondary/90 border border-border/80 backdrop-blur-md shadow-lg">
              {/* Linha 1: Tamanho da Fonte + Espaçamento (Leading) */}
              <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                {/* Stepper Tamanho */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Type className="w-3.5 h-3.5 text-primary" /> Fonte
                  </span>
                  <div className="flex items-center gap-1.5 bg-background/60 p-0.5 rounded-xl border border-border/50">
                    <button
                      onClick={() => setFontSize((prev) => Math.max(prev - 1, 12))}
                      className="w-7 h-7 rounded-lg bg-card hover:bg-card/80 flex items-center justify-center text-foreground active:scale-95 transition"
                      aria-label="Diminuir fonte"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-foreground min-w-[32px] text-center">
                      {fontSize}px
                    </span>
                    <button
                      onClick={() => setFontSize((prev) => Math.min(prev + 1, 26))}
                      className="w-7 h-7 rounded-lg bg-card hover:bg-card/80 flex items-center justify-center text-foreground active:scale-95 transition"
                      aria-label="Aumentar fonte"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Leading / Entrelinha */}
                {setLineHeight && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <AlignJustify className="w-3.5 h-3.5 text-primary" /> Linhas
                    </span>
                    <div className="flex items-center gap-1 bg-background/60 p-0.5 rounded-xl border border-border/50">
                      {(['1.6', '1.8', '2.1'] as const).map((lh) => (
                        <button
                          key={lh}
                          onClick={() => setLineHeight(lh)}
                          className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all ${
                            lineHeight === lh
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {lh}x
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Linha 2: Família Tipográfica (Sans, Serif Editorial, Mono) */}
              {setFontFamily && (
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Estilo
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 w-full max-w-[280px]">
                    {([
                      { id: 'sans', label: 'Sans', fontClass: 'font-sans' },
                      { id: 'serif', label: 'Serif Clássica', fontClass: 'font-vademecum-serif' },
                      { id: 'mono', label: 'Mono', fontClass: 'font-vademecum-mono' },
                    ] as const).map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFontFamily(f.id)}
                        className={`px-2 py-1.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                          fontFamily === f.id
                            ? 'bg-primary/15 border-primary text-primary shadow-sm'
                            : 'bg-background/40 border-border/40 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span className={`text-[12px] block ${f.fontClass}`}>Aa {f.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Linha 3: Toggles Leitura Fluida (Bionic) & Guia Óptico */}
              {(setBionicReading || setReadingGuide) && (
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40">
                  {setBionicReading && (
                    <button
                      onClick={() => setBionicReading((prev) => !prev)}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                        bionicReading
                          ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-sm'
                          : 'bg-background/40 border-border/40 text-muted-foreground hover:text-foreground'
                      }`}
                      title="Destaca as primeiras sílabas para acelerar a leitura cognitiva"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <Zap className={`w-3.5 h-3.5 ${bionicReading ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'}`} />
                        <span className="truncate">Leitura Fluida</span>
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ml-1 ${bionicReading ? 'bg-amber-500/30 text-amber-200' : 'bg-muted/40 text-muted-foreground'}`}>
                        {bionicReading ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  )}

                  {setReadingGuide && (
                    <button
                      onClick={() => setReadingGuide((prev) => !prev)}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                        readingGuide
                          ? 'bg-sky-500/15 border-sky-500/50 text-sky-300 shadow-sm'
                          : 'bg-background/40 border-border/40 text-muted-foreground hover:text-foreground'
                      }`}
                      title="Linha de foco suave que acompanha os olhos e reduz a fadiga visual"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <ScanLine className={`w-3.5 h-3.5 ${readingGuide ? 'text-sky-400' : 'text-muted-foreground'}`} />
                        <span className="truncate">Guia Óptico</span>
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ml-1 ${readingGuide ? 'bg-sky-500/30 text-sky-200' : 'bg-muted/40 text-muted-foreground'}`}>
                        {readingGuide ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Big Art. Nº + Ver no Planalto */}
      <div className="px-5 pt-1 pb-1.5 flex items-center justify-between gap-3">
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
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
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

      {/* Linha do tempo hierárquica cronológica (Parte > Livro > Título > Capítulo > Seção) */}
      {timelineItems.length > 0 && (
        <div className="px-5 pb-3 flex items-center flex-wrap gap-1.5 text-[11px] font-medium leading-relaxed">
          {timelineItems.map((item, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-zinc-500/80 shrink-0" strokeWidth={2.2} />
              )}
              <span className="text-zinc-300 font-medium tracking-wide">
                {item.label}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}

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
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
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
