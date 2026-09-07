import { useState, useEffect } from 'react';
import { isFavorito, toggleFavorito, subscribeTracking } from '@/lib/bibliotecaTracking';
import type { LivroNormalizado } from '@/lib/bibliotecaColecoes';
import { haptic } from '@/lib/nativeHaptics';
import { toast } from 'sonner';

export function useBibliotecaFav(livro: LivroNormalizado | null) {
  const [fav, setFav] = useState(false);

  useEffect(() => {
    if (!livro) return;
    setFav(isFavorito(livro));
    const unsub = subscribeTracking(() => {
      setFav(isFavorito(livro));
    });
    return unsub;
  }, [livro?.id, livro?.colecaoId]);

  const handleToggleFav = () => {
    if (!livro) return;
    haptic.selection();
    const now = toggleFavorito(livro);
    setFav(now);
    toast.success(now ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
  };

  return { fav, handleToggleFav };
}
