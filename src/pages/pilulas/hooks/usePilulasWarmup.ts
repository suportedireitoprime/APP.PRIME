import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export function usePilulasWarmup() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Atraso leve para evitar competir com a animação de montagem inicial
    const t = setTimeout(() => {
      const slugs = ['cp', 'cf', 'cc', 'cpp', 'clt'];
      
      slugs.forEach((slug) => {
        // 1. Prefetch Leis (Artigos)
        queryClient.prefetchQuery({
          queryKey: ['pilulas', 'lei', slug],
          queryFn: async () => {
            const { data: leiData, error: leiError } = await supabase
              .from('vade_mecum_leis')
              .select('id')
              .eq('slug', slug)
              .single();
              
            if (leiError || !leiData) return [];
            
            const { data, error } = await supabase
              .from('vade_mecum_artigos')
              .select('id, numero, texto, audio_pilula_url, ordem')
              .eq('lei_id', leiData.id)
              .ilike('texto', 'Art.%')
              .order('ordem', { ascending: true });

            if (error) throw error;
            return data || [];
          },
          staleTime: 1000 * 60 * 60, // 1h
        });

        // 2. Prefetch Decks/Cards (Visualizador de Pílulas)
        queryClient.prefetchQuery({
          queryKey: ['pilulas', 'deck', slug],
          queryFn: async () => {
            const { data: deck, error: deckErr } = await supabase
              .from('pilulas_decks')
              .select('id')
              .eq('slug', slug)
              .single();
              
            if (deck && !deckErr) {
              const { data: cards, error: cardsErr } = await supabase
                .from('pilulas_cards')
                .select('*')
                .eq('deck_id', deck.id)
                .order('ordem', { ascending: true });
              
              if (cards && !cardsErr) {
                // Background image prefetch (Warmup em memória 0ms)
                cards.forEach(card => {
                  if (card.imagem) {
                    const img = new Image();
                    img.src = card.imagem;
                  }
                });
                return cards;
              }
            }
            return [];
          },
          staleTime: 1000 * 60 * 60, // 1h
        });
      });
    }, 1200);

    return () => clearTimeout(t);
  }, [queryClient]);
}
