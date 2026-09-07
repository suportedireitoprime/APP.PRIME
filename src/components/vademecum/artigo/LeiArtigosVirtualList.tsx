import React, { useRef, useState, useLayoutEffect } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
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

  useLayoutEffect(() => {
    if (!shouldVirtualizeArtigos) return;

    const measureOffset = () => {
      const next = artigosListRef.current
        ? artigosListRef.current.getBoundingClientRect().top + window.scrollY
        : 0;
      setArtigosListOffset(next);
    };

    measureOffset();
    const element = artigosListRef.current;
    const resizeObserver = element && typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(measureOffset)
      : null;

    if (element && resizeObserver) resizeObserver.observe(element);
    window.addEventListener('resize', measureOffset);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', measureOffset);
    };
  }, [shouldVirtualizeArtigos, visibleArtigos.length]);

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
    overscan: 20,
    scrollMargin: artigosListOffset,
    initialOffset: () => virtualOffsetCache.get(listKey) ?? (typeof window !== 'undefined' ? window.scrollY : 0),
  });

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

  return (
    <div ref={artigosListRef} className={shouldVirtualizeArtigos ? 'pb-8' : 'space-y-2 pb-8'}>
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
                  onClick={() => openArtigoWithRecent(artigo)}
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
            onClick={() => openArtigoWithRecent(artigo)}
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
