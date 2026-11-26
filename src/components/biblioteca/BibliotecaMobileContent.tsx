import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useQueries } from '@tanstack/react-query';
import { haptic } from '@/lib/nativeHaptics';
import { supabase } from '@/integrations/supabase/client';
import { withBundleFallback, bundle } from '@/services/offlineBundle';
import { setPersistedColecao, getPersistedColecao } from '@/services/offlineDb';
import { normalizeLivro, type LivroNormalizado } from '@/lib/bibliotecaColecoes';
import { useVisibleColecoes } from '@/hooks/useVisibleColecoes';
import {
  getFavoritos,
  toggleFavorito,
  subscribeTracking,
  type LivroSnapshot,
} from '@/lib/bibliotecaTracking';
import BibliotecaHero, { type BibliotecaMode } from './BibliotecaHero';
import BibliotecaAtalhosBar from './BibliotecaAtalhosBar';
import BibliotecaContinuarLeituraBanner from './BibliotecaContinuarLeituraBanner';
import { BibliotecaAudiobooksView } from './BibliotecaAudiobooksView';
import { BibliotecaAcervosSection } from './BibliotecaAcervosSection';
import { BibliotecaMateriasSection } from './BibliotecaMateriasSection';

interface BibliotecaMobileContentProps {
  counts: Record<string, number>;
  onAbrirLivro: (livro: LivroNormalizado, modoInicial?: 'nativa' | 'pdf' | 'pdf-clara' | 'pdf-escura') => void;
  onAbrirCustomPdf: (titulo: string, url: string) => void;
  onAbrirMateria: (materia: string) => void;
  onBack?: () => void;
}

export const BibliotecaMobileContent: React.FC<BibliotecaMobileContentProps> = ({
  counts,
  onAbrirLivro,
  onAbrirCustomPdf,
  onBack,
}) => {
  const navigate = useNavigate();
  const [favoriteSnapshots, setFavoriteSnapshots] = useState<LivroSnapshot[]>(() => getFavoritos());
  const colecoesVisiveis = useVisibleColecoes();

  useEffect(() => {
    const syncFavs = () => setFavoriteSnapshots(getFavoritos());
    const unsub = subscribeTracking(syncFavs);
    window.addEventListener('storage', syncFavs);
    return () => {
      unsub();
      window.removeEventListener('storage', syncFavs);
    };
  }, []);

  const favoriteIds = useMemo(
    () => new Set(favoriteSnapshots.map((f) => `${f.colecaoId}:${f.id}`)),
    [favoriteSnapshots],
  );

  const collectionQueries = useQueries({
    queries: colecoesVisiveis.map((colecao) => ({
      queryKey: ['biblioteca-colecao', colecao.id],
      staleTime: 10 * 60 * 1000,
      placeholderData: (prev: LivroNormalizado[] | undefined) => prev,
      queryFn: async () => {
        try {
          let q = supabase.from(colecao.table as never).select(colecao.select);
          if (colecao.orderBy) {
            q = q.order(colecao.orderBy, { ascending: true, nullsFirst: false });
          }

          const data = await withBundleFallback(
            (async () => {
              const res = await q.limit(2000);
              if (res.error) throw res.error;
              return res.data ?? [];
            })(),
            async () => {
              const bundleFnName =
                'biblioteca' +
                colecao.id
                  .split('-')
                  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                  .join('');
              const fn = (bundle as unknown as Record<string, (() => Promise<unknown[]>) | undefined>)[bundleFnName];
              return fn ? await fn() : [];
            },
          );

          const list = (data as Record<string, unknown>[]).map((r) => normalizeLivro(r, colecao));
          setPersistedColecao(colecao.id, list).catch(() => {});
          return list;
        } catch {
          const cached = await getPersistedColecao<LivroNormalizado>(colecao.id);
          return cached?.length ? cached : [];
        }
      },
    })),
  });

  const booksByColecao = useMemo(() => {
    const map: Record<string, LivroNormalizado[]> = {};
    colecoesVisiveis.forEach((c, idx) => {
      map[c.id] = (collectionQueries[idx]?.data as LivroNormalizado[] | undefined) || [];
    });
    return map;
  }, [colecoesVisiveis, collectionQueries]);

  const handleToggleFavorite = useCallback((livro: LivroNormalizado) => {
    haptic.selection();
    const now = toggleFavorito(livro);
    setFavoriteSnapshots(getFavoritos());
    toast.success(now ? 'Livro salvo na sua estante!' : 'Livro removido dos salvos');
  }, []);

  const [activeMode, setActiveMode] = useState<BibliotecaMode>(() => {
    if (typeof window !== 'undefined') {
      const tab = new URLSearchParams(window.location.search).get('tab');
      if (tab === 'audiobooks') return 'audiobooks';
    }
    return 'livros';
  });

  return (
    <div className="relative w-full">
      <BibliotecaAtalhosBar
        onAbrirLivro={onAbrirLivro}
        onAbrirCustomPdf={onAbrirCustomPdf}
      />

      <BibliotecaHero
        onAbrirCustomPdf={() => onAbrirCustomPdf('Meus PDFs', '')}
        onBack={onBack ?? (() => navigate('/'))}
        activeMode={activeMode}
        onModeChange={setActiveMode}
      />

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7 pb-[calc(7.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] space-y-8 sm:space-y-10">
        {activeMode === 'audiobooks' ? (
          <BibliotecaAudiobooksView />
        ) : (
          <>
            <BibliotecaContinuarLeituraBanner onAbrirLivro={onAbrirLivro} />

            <BibliotecaAcervosSection
              booksByColecao={booksByColecao}
              counts={counts}
              onAbrirLivro={onAbrirLivro}
            />

            <BibliotecaMateriasSection
              areasLivros={booksByColecao['areas'] || []}
              favoriteIds={favoriteIds}
              onAbrirLivro={onAbrirLivro}
              onToggleFavorite={handleToggleFavorite}
            />
          </>
        )}
      </main>
    </div>
  );
};
