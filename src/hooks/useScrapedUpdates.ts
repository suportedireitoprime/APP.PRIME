import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScrapedArticleUpdate } from '@/data/leiAlteracoesScraped';

export function useScrapedUpdates(leiId?: string | null) {
  return useQuery({
    queryKey: ['scraped_updates', leiId],
    queryFn: async () => {
      if (!leiId) return [] as ScrapedArticleUpdate[];
      
      const { data, error } = await supabase
        .from('scraped_article_updates')
        .select('*')
        .eq('lei_id', leiId.toLowerCase());
        
      if (error) {
        console.error("Erro ao buscar atualizacoes:", error);
        return [] as ScrapedArticleUpdate[];
      }
      
      return (data || []) as ScrapedArticleUpdate[];
    },
    enabled: !!leiId,
    staleTime: 1000 * 60 * 60 * 24, // Cache de 24 horas na memoria
    networkMode: 'always', // Evita travamento no mobile se o status de rede falhar
  });
}
