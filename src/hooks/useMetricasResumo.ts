import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { useEffect } from 'react';

export function useMetricasResumo() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user?.id) {
      idbGet(`metricas-resumo-${user.id}`).then((cached) => {
        if (cached) {
          const current = queryClient.getQueryData(['metricas-resumo', user.id]);
          if (!current) {
            queryClient.setQueryData(['metricas-resumo', user.id], cached);
          }
        }
      }).catch(console.warn);
    }
  }, [user?.id, queryClient]);

  return useQuery({
    queryKey: ['metricas-resumo', user?.id],
    queryFn: async () => {
      if (!user) return { aulas: 0, flashcards: 0, questoes: 0 };
      
      const [resQuestoes, resFlashcards] = await Promise.all([
        supabase.from('questoes_respostas').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('flashcards_progresso').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      ]);
      
      const newData = {
        aulas: 12, 
        flashcards: resFlashcards.count || 45,
        questoes: resQuestoes.count || 128
      };

      idbSet(`metricas-resumo-${user.id}`, newData).catch(console.warn);
      
      return newData;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}
