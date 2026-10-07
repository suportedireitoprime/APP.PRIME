import { useState, useEffect, useMemo } from 'react';
import { extractArtigoDispositivos } from './artigoTextUtils';

interface UseArtigoIncisosCollapseProps {
  artigoId?: string;
  displayLines: string[];
}

export function useArtigoIncisosCollapse({ artigoId, displayLines }: UseArtigoIncisosCollapseProps) {
  const [collapsedIncisos, setCollapsedIncisos] = useState(false);

  useEffect(() => {
    setCollapsedIncisos(false);
  }, [artigoId]);

  const dispositivosLandmarks = useMemo(() => {
    return extractArtigoDispositivos(displayLines);
  }, [displayLines]);

  const totalIncisosCount = useMemo(() => {
    return dispositivosLandmarks.filter((d) => d.type === 'inciso').length;
  }, [dispositivosLandmarks]);

  const incisoLineIndices = useMemo(() => {
    return new Set(dispositivosLandmarks.filter((d) => d.type === 'inciso').map((d) => d.lineIndex));
  }, [dispositivosLandmarks]);

  const visibleLineIndices = useMemo(() => {
    if (!collapsedIncisos || totalIncisosCount <= 4) return null;
    const allowed = new Set<number>();
    let count = 0;
    displayLines.forEach((_, idx) => {
      if (incisoLineIndices.has(idx)) {
        if (count < 3) allowed.add(idx);
        count++;
      } else {
        allowed.add(idx); // Sempre exibe caput, parágrafos, etc.
      }
    });
    return allowed;
  }, [collapsedIncisos, totalIncisosCount, displayLines, incisoLineIndices]);

  return {
    collapsedIncisos,
    setCollapsedIncisos,
    totalIncisosCount,
    visibleLineIndices,
    incisoLineIndices,
    dispositivosLandmarks,
  };
}
