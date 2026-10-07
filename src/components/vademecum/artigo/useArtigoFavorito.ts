import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { listNumerosFavoritosByTabela, toggleArtigoFavorito, ARTIGOS_FAV_EVENT } from '@/lib/artigosFavoritos';
import { haptic } from '@/lib/nativeHaptics';



interface UseArtigoFavoritoProps {
  artigo: any;
  tabelaNome: string;
  propIsFavorito?: boolean;
  propOnToggleFavorito?: () => void;
}

export function useArtigoFavorito({
  artigo,
  tabelaNome,
  propIsFavorito,
  propOnToggleFavorito,
}: UseArtigoFavoritoProps) {
  const [internalIsFav, setInternalIsFav] = useState<boolean>(false);

  useEffect(() => {
    if (propIsFavorito !== undefined) {
      setInternalIsFav(propIsFavorito);
      return;
    }
    if (!tabelaNome || !artigo?.numero) return;
    let cancelled = false;
    const cleanNum = String(artigo.numero).replace(/^art\.?\s*/i, '').trim();
    const loadFav = () => {
      listNumerosFavoritosByTabela(tabelaNome)
        .then((nums) => {
          if (!cancelled) {
            setInternalIsFav(nums.includes(cleanNum) || nums.includes(String(artigo.numero)));
          }
        })
        .catch(() => {});
    };
    loadFav();
    const handleFavChange = () => loadFav();
    window.addEventListener(ARTIGOS_FAV_EVENT, handleFavChange);
    return () => {
      cancelled = true;
      window.removeEventListener(ARTIGOS_FAV_EVENT, handleFavChange);
    };
  }, [propIsFavorito, tabelaNome, artigo?.numero]);

  const effectiveIsFavorito = propIsFavorito !== undefined ? propIsFavorito : internalIsFav;

  const handleToggleFavoritoInternal = useCallback(async () => {
    if (propOnToggleFavorito) {
      propOnToggleFavorito();
      return;
    }
    if (!tabelaNome || !artigo?.numero) return;
    const cleanNum = String(artigo.numero).replace(/^art\.?\s*/i, '').trim();
    
    // Fallback safe for haptic execution
    try {
      haptic.impact();
    } catch {}

    try {
      const nowFav = await toggleArtigoFavorito({
        tabela_codigo: tabelaNome,
        numero_artigo: cleanNum,
        conteudo_preview: artigo.caput?.slice(0, 140) || null,
      });
      setInternalIsFav(nowFav);
      if (nowFav) {
        toast.success(`Artigo ${cleanNum} salvo nos favoritos (Supabase)!`);
      } else {
        toast.info(`Artigo ${cleanNum} removido dos favoritos.`);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao sincronizar favorito com o Supabase');
    }
  }, [propOnToggleFavorito, tabelaNome, artigo]);

  return {
    effectiveIsFavorito,
    handleToggleFavoritoInternal,
  };
}
