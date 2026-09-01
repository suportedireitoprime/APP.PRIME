import { useState, useEffect, startTransition } from 'react';
import { ArtigoLei } from '@/types/legislacao';
import {
  getCachedArtigos,
  setCachedArtigos,
  fetchArtigosPaginado,
  loadPersistedArtigos,
  fetchArtigosInstant
} from '@/services/legislacaoService';

export function useLeiArtigos(selectedLeiId: string | null, selectedTabelaNome: string | null) {
  const [artigos, setArtigos] = useState<ArtigoLei[]>([]);
  const [loadingArtigos, setLoadingArtigos] = useState(false);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedLeiId || !selectedTabelaNome) return;
    let cancelled = false;
    const tabelaAtual = selectedTabelaNome;

    // 1) Cache em memória — instant, sem spinner (bundle prime já rodou no boot).
    const cached = getCachedArtigos(tabelaAtual);
    if (cached && cached.length > 0) {
      setArtigos(cached);
      setLoadedKey(tabelaAtual);
      setLoadingArtigos(false);
      // Revalida em background (sem bloquear UI).
      fetchArtigosPaginado(tabelaAtual, 0, 10000).then((fresh) => {
        if (!cancelled && fresh.length > 0) {
          startTransition(() => setArtigos(fresh));
        }
      }).catch(() => {});
      return () => { cancelled = true; };
    }

    // 2) Corrida: bundle JSON local vs Dexie persistido — quem vier primeiro renderiza.
    //    Ambos são "instantâneos" no Android (bundle vem do APK, Dexie da IDB local).
    let settled = false;
    const settle = (arts: ArtigoLei[]) => {
      if (cancelled || settled || !arts || arts.length === 0) return;
      settled = true;
      setArtigos(arts);
      setLoadedKey(tabelaAtual);
      setLoadingArtigos(false);
      // Revalida silenciosamente
      fetchArtigosPaginado(tabelaAtual, 0, 10000).then((fresh) => {
        if (!cancelled && fresh.length > 0) startTransition(() => setArtigos(fresh));
      }).catch(() => {});
    };

    // Bundle nativo (rápido em Android — arquivo do APK).
    import('@/services/lawsBundle').then(async ({ loadManifest, loadBundledLei, getBundleSlugForTabela }) => {
      const manifest = await loadManifest();
      if (!manifest || cancelled || settled) return;
      const slug = getBundleSlugForTabela(tabelaAtual);
      if (!slug) return;
      const bundled = await loadBundledLei(slug);
      if (bundled && bundled.length > 0) {
        setCachedArtigos(tabelaAtual, bundled);
        settle(bundled);
      }
    }).catch(() => {});

    // Dexie (subsequent visits).
    loadPersistedArtigos(tabelaAtual).then((persisted) => {
      if (persisted && persisted.length > 0) settle(persisted);
    }).catch(() => {});

    // 3) Fallback com skeleton apenas se nada aparecer em 180ms.
    const skeletonTimer = setTimeout(() => {
      if (cancelled || settled) return;
      setLoadingArtigos(true);
      fetchArtigosInstant(tabelaAtual, 10)
        .then((first) => {
          if (cancelled) return;
          if (first.length > 0) {
            settle(first);
          } else {
            setArtigos([]);
            setLoadedKey(tabelaAtual);
            setLoadingArtigos(false);
          }
        })
        .catch(() => {
          if (cancelled) return;
          setArtigos([]);
          setLoadedKey(tabelaAtual);
          setLoadingArtigos(false);
        });
    }, 280);

    return () => { cancelled = true; clearTimeout(skeletonTimer); };
  }, [selectedLeiId, selectedTabelaNome]);

  return {
    artigos,
    setArtigos,
    loadingArtigos,
    setLoadingArtigos,
    loadedKey,
    setLoadedKey
  };
}
