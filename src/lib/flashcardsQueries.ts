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
        const mockDeck = offlineDecks.find(d => d.id === params.deckId && d.filtros?.source) 
          || (params.deckId === '1' ? { nome: 'Resumo PDF Penal' } : null)
          || (params.deckId === '2' ? { nome: 'Aula Youtube - Direitos Políticos' } : null);

        if (mockDeck) {
          await new Promise(r => setTimeout(r, 600)); // fake delay
          return Array.from({ length: 15 }).map((_, i) => ({
            id: `mock-ai-card-${params.deckId}-${i}`,
            area: 'Conteúdo Personalizado',
            tema: mockDeck.nome,
            subtema: `Tópico Abordado ${i+1}`,
            pergunta: `Explique o conceito ou a regra principal do Tópico ${i+1} e como ele se aplica na prática.`,
            resposta: `O conceito principal é a aplicação prática das regras relacionadas ao tópico, garantindo que você entenda não apenas a teoria, mas também o contexto apresentado na fonte original.`,
            exemplo: `Exemplo prático abordado no material: Situação que demonstra a aplicação dessa regra.`,
            base_legal: null,
            dica: `Dica de IA: Tente focar nas palavras-chave do Tópico ${i+1} para memorizar mais rápido.`,
            reforco_conteudo: null,
            artigo_numero: null,
            status: null
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
