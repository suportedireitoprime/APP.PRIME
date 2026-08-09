import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ForcaArticleStar {
  artigo_id: string;
  stars: number;
}

export function useForcaEstrelas(leiId: string | null) {
  const [estrelas, setEstrelas] = useState<Record<string, number>>({});
  const [isLoadingEstrelas, setIsLoadingEstrelas] = useState(false);

  const carregarEstrelas = useCallback(async () => {
    if (!leiId) {
      setEstrelas({});
      return;
    }
    
    try {
      setIsLoadingEstrelas(true);
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return;

      // To avoid fetching the whole table, we could fetch stars for all articles
      // But since we don't have lei_id in forca_artigos_progresso, we just fetch all for the user
      const { data, error } = await supabase
        .from('forca_artigos_progresso')
        .select('artigo_id, stars')
        .eq('user_id', session.session.user.id);

      if (error) throw error;

      if (data) {
        const starMap: Record<string, number> = {};
        data.forEach((item: ForcaArticleStar) => {
          starMap[item.artigo_id] = item.stars;
        });
        setEstrelas(starMap);
      }
    } catch (err) {
      console.error("Erro ao carregar estrelas:", err);
    } finally {
      setIsLoadingEstrelas(false);
    }
  }, [leiId]);

  useEffect(() => {
    carregarEstrelas();
  }, [carregarEstrelas]);

  const saveStars = async (artigoId: string, stars: number) => {
    if (stars < 1 || stars > 3) return;
    
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return;

      const userId = session.session.user.id;

      // Chama a função RPC segura
      const { error } = await supabase.rpc('upsert_forca_article_stars', {
        p_user_id: userId,
        p_artigo_id: artigoId,
        p_stars: stars
      });

      if (error) {
        console.error("Erro ao salvar estrelas do artigo:", error);
        return;
      }

      // Atualiza o estado local otimista
      setEstrelas(prev => {
        const current = prev[artigoId] || 0;
        if (stars > current) {
          return { ...prev, [artigoId]: stars };
        }
        return prev;
      });

    } catch (err) {
      console.error("Exceção ao salvar estrelas:", err);
    }
  };

  return { estrelas, isLoadingEstrelas, saveStars, carregarEstrelas };
}
