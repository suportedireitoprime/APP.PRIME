import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { withBundleFallback, bundle } from '@/services/offlineBundle';
import { getOfflineDecks } from '@/lib/flashcardsOfflineManager';

export type FlashcardsDash = {
  total_cards: number;
  estudados: number;
  compreendidos: number;
  a_revisar: number;
  hoje: number;
  streak: number;
  atividade_30d: { dia: string; total: number }[];
  temas_criticos: { area: string; tema: string; total: number }[];
};

export type FlashcardsAreaRow = {
  area: string;
  slug: string;
  ordem: number;
  total_cards: number;
  compreendidos: number;
  a_revisar: number;
};

export type FlashcardCard = {
  id: string;
  area: string;
  tema: string | null;
  subtema: string | null;
  pergunta: string;
  resposta: string;
  exemplo: string | null;
  base_legal: string | null;
  dica: string | null;
  reforco_conteudo: string | null;
  artigo_numero: string | null;
  status: string | null;
};

export const useFlashcardsDashboard = () => {
  return useQuery({
    queryKey: ['flashcards_dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('flashcards_dashboard');
      if (error) throw error;
      return (data || null) as unknown as FlashcardsDash | null;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useFlashcardsResumoAreas = () => {
  return useQuery({
    queryKey: ['flashcards_resumo_areas'],
    queryFn: async () => {
      const onlineFn = async () => {
        const { data, error } = await supabase.rpc('flashcards_resumo_areas');
        if (error) throw error;
        return (data || []) as unknown as FlashcardsAreaRow[];
      };
      return withBundleFallback(onlineFn(), () => bundle.flashcardsResumoAreas<FlashcardsAreaRow>());
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useFlashcardsSessao = (params: {
  areas: string[] | null;
  temas: string[] | null;
  modo: string;
  deckId: string | null;
  limit: number;
}, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['flashcards_sessao', params],
    queryFn: async () => {
      // --- MOCK INTERCEPT FOR AI GENERATED DECKS ---
      if (params.deckId) {
        const offlineDecks = getOfflineDecks();
        const mockDeck = offlineDecks.find(d => d.id === params.deckId && d.filtros?.source);

        if (mockDeck) {
          const { getOfflineCards } = await import('@/lib/flashcardsOfflineManager');
          await new Promise(r => setTimeout(r, 600)); // fake delay
          
          let cards = getOfflineCards(params.deckId);
          
          if (params.modo === 'revisar') {
            cards = cards.filter(c => c.status === 'errou' || c.status === 'dificil');
          } else if (params.modo === 'compreendidos') {
            cards = cards.filter(c => c.status === 'memorizado');
          } else if (params.modo === 'novos') {
            cards = cards.filter(c => !c.status);
          }
          
          // Randomize cards a bit
          cards = cards.sort(() => 0.5 - Math.random()).slice(0, params.limit || 15);
          
          return cards.map(c => ({
            id: c.id,
            area: 'Conteúdo Personalizado',
            tema: mockDeck.nome,
            subtema: null,
            pergunta: c.pergunta,
            resposta: c.resposta,
            exemplo: c.exemplo || null,
            base_legal: null,
            dica: c.dica || null,
            reforco_conteudo: null,
            artigo_numero: null,
            status: c.status || null
          })) as unknown as FlashcardCard[];
        }
      }
      // --- END MOCK INTERCEPT ---

      const onlineFn = async () => {
        const { data, error } = await supabase.rpc('flashcards_sessao', {
          _areas: params.areas,
          _temas: params.temas,
          _modo: params.modo,
          _deck_id: params.deckId,
          _limit: params.limit,
        });
        if (error) throw error;
        return (data || []) as unknown as FlashcardCard[];
      };
      
      const offlineFn = async () => {
        if (!params.areas || params.areas.length === 0) return [];
        let allCards: FlashcardCard[] = [];
        for (const area of params.areas) {
          const cards = await bundle.flashcardsCardsPorArea<FlashcardCard>(area);
          allCards = allCards.concat(cards);
        }
        if (params.temas && params.temas.length > 0) {
          allCards = allCards.filter(c => params.temas!.includes(c.tema || ''));
        }
        return allCards.sort(() => 0.5 - Math.random()).slice(0, params.limit);
      };

      return withBundleFallback(onlineFn(), offlineFn);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes for session cards to stay cached
    enabled,
  });
};

export const prefetchFlashcardsDashboard = async (queryClient: any) => {
  queryClient.prefetchQuery({
    queryKey: ['flashcards_dashboard'],
    queryFn: async () => {
      const { data } = await supabase.rpc('flashcards_dashboard');
      return (data || null) as unknown as FlashcardsDash | null;
    },
  });
  queryClient.prefetchQuery({
    queryKey: ['flashcards_resumo_areas'],
    queryFn: async () => {
      const { data } = await supabase.rpc('flashcards_resumo_areas');
      return (data || []) as unknown as FlashcardsAreaRow[];
    },
  });
};
