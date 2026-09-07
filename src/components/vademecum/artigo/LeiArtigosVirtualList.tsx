import React, { useRef, useState, useLayoutEffect, useEffect, useMemo } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { Bookmark, X as XCloseIcon } from 'lucide-react';
import ArtigoCard from '@/components/vademecum/artigo/ArtigoCard';
import type { ArtigoLei } from '@/data/mockData';

interface LeiArtigosVirtualListProps {
  visibleArtigos: ArtigoLei[];
  shouldVirtualizeArtigos: boolean;
  loadedKey: string | null;
  selectedTabelaNome: string | null;
  loadingArtigos: boolean;
  openArtigoWithRecent: (artigo: ArtigoLei) => void;
  highlightedArtigoId: string | null;
  searchQuery: string;
  leiAccent: string;
  isArtigoFav: (a: { id: string; numero: string | number }) => boolean;
  grifadoNumeros: Set<string>;
  anotadoNumeros: Set<string>;
}

// Cache de offset para restauração de posição na virtualização (Item 37)
const virtualOffsetCache = new Map<string, number>();

const LeiArtigosVirtualList: React.FC<LeiArtigosVirtualListProps> = ({
  visibleArtigos,
  shouldVirtualizeArtigos,
  loadedKey,
  selectedTabelaNome,
  loadingArtigos,
  openArtigoWithRecent,
  highlightedArtigoId,
  searchQuery,
  leiAccent,
  isArtigoFav,
  grifadoNumeros,
  anotadoNumeros,
}) => {
  const artigosListRef = useRef<HTMLDivElement | null>(null);
  const [artigosListOffset, setArtigosListOffset] = useState(0);
  const listKey = loadedKey || selectedTabelaNome || 'artigos-vade-mecum';

  // Item 30: Restauração do último artigo lido
  const [lastReadArtigo, setLastReadArtigo] = useState<{ numero: string; id: string } | null>(null);
  const [dismissedLastRead, setDismissedLastRead] = useState(false);

  useEffect(() => {
    if (!selectedTabelaNome) return;
    try {
      const raw = localStorage.getItem(`last_artigo_${selectedTabelaNome}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.numero) setLastReadArtigo(parsed);
      }
    } catch {}
  }, [selectedTabelaNome]);

  const handleOpenArtigo = (artigo: ArtigoLei) => {
    if (selectedTabelaNome) {
      try {
        localStorage.setItem(`last_artigo_${selectedTabelaNome}`, JSON.stringify({
          numero: artigo.numero,
          id: String(artigo.id),
        }));
      } catch {}
    }
    openArtigoWithRecent(artigo);
  };

  // Item 22: Real highlight implementation for search terms in article cards
  const highlightText = (text: string) => {
    if (!searchQuery || !searchQuery.trim()) return text;
    try {
      const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'gi');
      const parts = text.split(regex);
      if (parts.length <= 1) return text;
      return parts.map((part, i) =>
        regex.test(part)
          ? React.createElement('mark', {
              key: i,
              className: 'bg-amber-400/30 text-amber-200 rounded-sm px-0.5',
            }, part)
          : part
      );
    } catch {
      return text;
    }
  };

  // Item 24: Previne layout thrashing limitando getBoundingClientRect a RAF no mount/resize
  useLayoutEffect(() => {
    if (!shouldVirtualizeArtigos) return;

    let rafId: number | null = null;
    const measureOffset = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const next = artigosListRef.current
          ? artigosListRef.current.getBoundingClientRect().top + window.scrollY
          : 0;
        setArtigosListOffset(next);
      });
    };

    measureOffset();
    window.addEventListener('resize', measureOffset, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', measureOffset);
    };
  }, [shouldVirtualizeArtigos]);

  // Item 29: Overscan dinâmico calibrado por dispositivo e largura de tela
  const dynamicOverscan = useMemo(() => {
    if (typeof window === 'undefined') return 12;
    const w = window.innerWidth;
    if (w >= 1280) return 20; // Desktop widescreen
    if (w >= 768) return 14;  // Tablet
    const nav = typeof navigator !== 'undefined' ? (navigator as unknown as { deviceMemory?: number }) : null;
    if (nav?.deviceMemory && nav.deviceMemory <= 4) return 6; // Mobile modesto
    return 10; // Mobile moderno
  }, []);

  const artigosVirtualizer = useWindowVirtualizer({
    count: shouldVirtualizeArtigos ? visibleArtigos.length : 0,
    // Item 21: Dynamic estimateSize based on article text length for smoother scrollbar
    estimateSize: (index) => {
      const artigo = visibleArtigos[index];
      if (!artigo) return 116;
      const caputLen = (artigo.caput || '').length;
      const paragrafosLen = (artigo.paragrafos || []).reduce((acc, p) => acc + p.length, 0);
      const incisosLen = (artigo.incisos || []).reduce((acc, inc) => acc + inc.length, 0);
      const totalLen = caputLen + paragrafosLen + incisosLen;
      return Math.max(64, Math.min(600, Math.round(totalLen / 3)));
    },
    overscan: dynamicOverscan,
    scrollMargin: artigosListOffset,
    // Item 25: Validate restored offset against total list height to prevent blank screen
    initialOffset: () => {
      const saved = virtualOffsetCache.get(listKey);
      if (saved === undefined) return typeof window !== 'undefined' ? window.scrollY : 0;
      const approxTotal = visibleArtigos.length * 120;
      const winHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
      const maxAllowed = Math.max(0, approxTotal - winHeight);
      return Math.min(saved, maxAllowed);
    },
  });

  // Item 28: Manter artigo do centro visível na mudança de orientação (tablet portrait <-> landscape)
  useEffect(() => {
    if (!shouldVirtualizeArtigos) return;
    const handleOrientation = () => {
      const virtualItems = artigosVirtualizer.getVirtualItems();
      if (virtualItems.length > 0) {
        const midItem = virtualItems[Math.floor(virtualItems.length / 2)];
        if (midItem) {
          setTimeout(() => {
            artigosVirtualizer.scrollToIndex(midItem.index, { align: 'center', behavior: 'auto' });
          }, 150);
        }
      }
    };
    window.addEventListener('orientationchange', handleOrientation);
    return () => window.removeEventListener('orientationchange', handleOrientation);
  }, [shouldVirtualizeArtigos, artigosVirtualizer]);

  // Salva periodicamente o scroll offset da lista para restaurar na navegação de volta (Item 37)
  useLayoutEffect(() => {
    if (!shouldVirtualizeArtigos) return;
    const saveOffset = () => {
      virtualOffsetCache.set(listKey, window.scrollY);
    };
    window.addEventListener('scroll', saveOffset, { passive: true });
    return () => {
      saveOffset();
      window.removeEventListener('scroll', saveOffset);
    };
  }, [shouldVirtualizeArtigos, listKey]);

  const handleResumeLastRead = () => {
    if (!lastReadArtigo) return;
    const idx = visibleArtigos.findIndex(
      (a) => String(a.numero).trim() === String(lastReadArtigo.numero).trim() || String(a.id) === String(lastReadArtigo.id)
    );
    if (idx !== -1) {
      artigosVirtualizer.scrollToIndex(idx, { align: 'center', behavior: 'smooth' });
    }
  };

  return (
    <div ref={artigosListRef} className={shouldVirtualizeArtigos ? 'pb-8' : 'space-y-2 pb-8'}>
      {/* Item 30: Banner discreto para continuar leitura anterior */}
      {lastReadArtigo && !dismissedLastRead && !searchQuery && (
        <div className="mb-4 flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm backdrop-blur-md">
          <div className="flex items-center gap-2 min-w-0">
            <Bookmark className="w-4 h-4 shrink-0 text-amber-400" />
            <span className="truncate">
              Continuar leitura do <strong className="font-semibold text-amber-200">Art. {lastReadArtigo.numero}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResumeLastRead}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500 text-zinc-950 hover:bg-amber-400 transition-colors"
            >
              Ir para artigo
            </button>
            <button
              type="button"
              onClick={() => setDismissedLastRead(true)}
              className="p-1 text-amber-400/60 hover:text-amber-300 rounded-md transition-colors"
              aria-label="Fechar"
            >
              <XCloseIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {shouldVirtualizeArtigos ? (
        <div
          style={{
            height: `${artigosVirtualizer.getTotalSize()}px`,
            position: 'relative',
            width: '100%',
          }}
        >
          {artigosVirtualizer.getVirtualItems().map((virtualItem) => {
            const artigo = visibleArtigos[virtualItem.index];
            if (!artigo) return null;
            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={artigosVirtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start - artigosVirtualizer.options.scrollMargin}px)`,
                  paddingBottom: '0.5rem',
                  // Item 26: CSS containment for layout isolation in virtualized items
                  contain: 'layout style paint',
                }}
              >
                <ArtigoCard
                  artigo={artigo}
                  index={virtualItem.index}
                  onClick={() => handleOpenArtigo(artigo)}
                  highlightText={searchQuery ? highlightText : undefined}
                  isHighlighted={highlightedArtigoId === String(artigo.id)}
                  accentColor={leiAccent}
                  withShine={virtualItem.index < 6}
                  tags={{ favorito: isArtigoFav(artigo), grifado: grifadoNumeros.has(artigo.numero), anotado: anotadoNumeros.has(artigo.numero) }}
                />
              </div>
            );
          })}
        </div>
      ) : (
        visibleArtigos.map((artigo, i) => (
          <ArtigoCard
            key={artigo.id}
            artigo={artigo}
            index={i}
            onClick={() => handleOpenArtigo(artigo)}
            highlightText={searchQuery ? highlightText : undefined}
            isHighlighted={highlightedArtigoId === String(artigo.id)}
            accentColor={leiAccent}
            withShine={i < 6}
            tags={{ favorito: isArtigoFav(artigo), grifado: grifadoNumeros.has(artigo.numero), anotado: anotadoNumeros.has(artigo.numero) }}
          />
        ))
      )}
      {visibleArtigos.length === 0 && loadedKey === selectedTabelaNome && !loadingArtigos && (
        <p className="text-center text-muted-foreground py-8">Nenhum artigo encontrado.</p>
      )}
    </div>
  );
};

export default LeiArtigosVirtualList;
