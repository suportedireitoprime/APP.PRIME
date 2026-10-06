import { useState, useEffect, startTransition } from 'react';
import { ArtigoLei } from '@/types/legislacao';
import {
  getCachedArtigos,
  setCachedArtigos,
  fetchArtigosPaginado,
  loadPersistedArtigos,
  fetchArtigosInstant
} from '@/services/legislacaoService';
import { getBundleSlugForTabela, loadBundledLei } from '@/services/lawsBundle';

export function useLeiArtigos(selectedLeiId: string | null, selectedTabelaNome: string | null) {
  const [artigos, setArtigos] = useState<ArtigoLei[]>([]);
  const [loadingArtigos, setLoadingArtigos] = useState(false);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedLeiId || !selectedTabelaNome) return;
    let cancelled = false;
    const tabelaAtual = selectedTabelaNome;

    // 1) Cache em memória — instant, sem spinner (bundle prime já rodou no boot ou lei já foi aberta).
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
    //    Ambos são instantâneos no Android nativo (bundle embutido no APK, Dexie em IDB local).
    let settled = false;
    const settle = (arts: ArtigoLei[]) => {
      if (cancelled || settled || !arts || arts.length === 0) return;
      settled = true;
      setArtigos(arts);
      setLoadedKey(tabelaAtual);
      setLoadingArtigos(false);
      // Revalida silenciosamente no background se online
      fetchArtigosPaginado(tabelaAtual, 0, 10000).then((fresh) => {
        if (!cancelled && fresh.length > 0) startTransition(() => setArtigos(fresh));
      }).catch(() => {});
    };

    // ⚡ Resolução estática do bundle nativo em 0ms (CDC, CC, CPC, etc.)
    const slug = getBundleSlugForTabela(tabelaAtual);
    if (slug) {
      loadBundledLei(slug).then((bundled) => {
        if (!cancelled && !settled && bundled && bundled.length > 0) {
          setCachedArtigos(tabelaAtual, bundled);
          settle(bundled);
        }
      }).catch(() => {});
    }

    // Dexie persistido (visitas subsequentes / cache local)
    loadPersistedArtigos(tabelaAtual).then((persisted) => {
      if (!cancelled && !settled && persisted && persisted.length > 0) {
        settle(persisted);
      }
    }).catch(() => {});

    // 3) Ativa skeleton suave caso nada apareça em 200ms
    const skeletonTimer = setTimeout(() => {
      if (cancelled || settled) return;
      setLoadingArtigos(true);
      fetchArtigosInstant(tabelaAtual, 10)
        .then((first) => {
          if (cancelled || settled) return;
          if (first && first.length > 0) {
            settle(first);
          }
        })
        .catch(() => {});
    }, 200);

    // 4) Timeout final de segurança (2.5s) apenas se nenhuma fonte local/remota responder
    const safetyTimer = setTimeout(() => {
      if (cancelled || settled) return;
      setLoadingArtigos(false);
      setLoadedKey(tabelaAtual);
    }, 2500);

    return () => {
      cancelled = true;
      clearTimeout(skeletonTimer);
      clearTimeout(safetyTimer);
    };
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
