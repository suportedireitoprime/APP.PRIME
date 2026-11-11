import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { withBundleFallback, bundle } from '@/services/offlineBundle';
import { saveOfflinePackage, getOfflinePackage } from '@/services/downloadManager';
import { FALLBACK_FLASHCARDS_AREAS, FALLBACK_FLASHCARDS_DASH, type FlashcardsDash, type FlashcardsAreaRow } from './flashcardsConstants';
export type { FlashcardsDash, FlashcardsAreaRow };

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
  tipo: string | null;
  resumo_ia?: string | null;
};

export const useFlashcardsDashboard = () => {
  return useQuery({
    queryKey: ['flashcards_dashboard'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('flashcards_dashboard');
        if (error) throw error;
        return (data || null) as unknown as FlashcardsDash | null;
      } catch {
        return FALLBACK_FLASHCARDS_DASH;
      }
    },
    placeholderData: FALLBACK_FLASHCARDS_DASH,
    staleTime: 5 * 60 * 1000,
  });
};

export const useFlashcardsResumoAreas = () => {
  return useQuery({
    queryKey: ['flashcards_resumo_areas'],
    queryFn: async () => {
      const onlineFn = async () => {
        try {
          const { data, error } = await supabase.rpc('flashcards_resumo_areas');
          if (error) throw error;
          
          let result = [...(data || [])] as FlashcardsAreaRow[];
          if (!result || result.length === 0) {
            result = [...FALLBACK_FLASHCARDS_AREAS];
          }
          
          const hasTermos = result.find(r => r.area === 'Termos Jurídicos');
          if (!hasTermos) {
            try {
              const { data: areaRow } = await supabase
                .from('flashcards_areas')
                .select('total_cards')
                .eq('area', 'Termos Jurídicos')
                .maybeSingle();
              const count = areaRow?.total_cards;
              if (count && count > 0) {
                result.push({
                  area: 'Termos Jurídicos',
                  slug: 'termos-juridicos',
                  ordem: 99,
                  total_cards: count,
                  compreendidos: 0,
                  a_revisar: 0
                });
              }
            } catch {}
          }
          
          if (result && result.length > 0) {
            void saveOfflinePackage('flashcards-resumo-areas', 'Flashcards Áreas', result);
          }
          return result;
        } catch {
          const local = await getOfflinePackage<FlashcardsAreaRow>('flashcards-resumo-areas');
          if (local && local.length > 0) return local;
          return FALLBACK_FLASHCARDS_AREAS;
        }
      };

      const offlineFn = async () => {
        const local = await getOfflinePackage<FlashcardsAreaRow>('flashcards-resumo-areas');
        if (local && local.length > 0) return local;
        return FALLBACK_FLASHCARDS_AREAS;
      };

      return withBundleFallback(onlineFn(), offlineFn);
    },
    placeholderData: FALLBACK_FLASHCARDS_AREAS,
    staleTime: 5 * 60 * 1000,
  });
};

function toCanonicalAreaName(rawArea?: string | null): string {
  if (!rawArea) return '';
  const s = rawArea.trim().toLowerCase();
  const match = FALLBACK_FLASHCARDS_AREAS.find(a => 
    a.area.toLowerCase() === s || 
    a.slug === s || 
    a.slug === s.replace(/^direito-/, '') || 
    `direito-${a.slug}` === s ||
    a.area.toLowerCase().replace(/^direito\s+/, '') === s.replace(/^direito\s+/, '')
  );
  if (match) return match.area;
  return rawArea.trim();
}

export const useFlashcardsSessao = (params: {
  areas: string[] | null;
  temas: string[] | null;
  modo: string;
  deckId: string | null;
  limit: number;
  tipos?: string[] | null;
}, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['flashcards_sessao', params],
    queryFn: async () => {
      // --- MOCK INTERCEPT FOR AI GENERATED DECKS ---
      if (params.deckId) {
        const { getOfflineDecks, getOfflineCards } = await import('@/lib/flashcardsOfflineManager');
        const offlineDecks = getOfflineDecks();
        const mockDeck = offlineDecks.find(d => d.id === params.deckId && d.filtros?.source);

        if (mockDeck) {
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
            status: c.status || null,
            tipo: 'Pergunta e Resposta'
          })) as unknown as FlashcardCard[];
        }
      }
      // --- END MOCK INTERCEPT ---

      const effectiveLimit = params.limit && params.limit > 0 ? params.limit : 10000;
      const onlineFn = async () => {
        // 1. Normaliza áreas com case sensitivity resiliente
        const normalizedAreas = params.areas && params.areas.length > 0
          ? Array.from(new Set(params.areas.flatMap(a => {
              const canonical = toCanonicalAreaName(a);
              return [canonical, a, a.trim()];
            }).filter(Boolean)))
          : null;

        // 2. Resolve temas oficiais do banco
        let effectiveTemas = params.temas;
        if (params.temas && params.temas.length > 0 && normalizedAreas && normalizedAreas.length > 0) {
          try {
            const canonicalArea = toCanonicalAreaName(params.areas?.[0]);
            const { data: dbTemas } = await supabase.rpc('flashcards_temas', { _area: canonicalArea });
            const allDbTemas = (dbTemas || []) as Array<{ tema: string }>;
            
            if (allDbTemas.length > 0) {
              const matchedTemas = new Set<string>();
              for (const tParam of params.temas) {
                const cleanParam = tParam.replace(/^\d+[\.\-\s_:]+/, '').trim().toLowerCase();
                for (const dbT of allDbTemas) {
                  const dbTema = dbT.tema || '';
                  const cleanDb = dbTema.replace(/^\d+[\.\-\s_:]+/, '').trim().toLowerCase();
                  if (
                    cleanDb === cleanParam || 
                    dbTema.toLowerCase() === tParam.toLowerCase() ||
                    cleanDb.includes(cleanParam) ||
                    cleanParam.includes(cleanDb)
                  ) {
                    matchedTemas.add(dbTema);
                  }
                }
              }
              if (matchedTemas.size > 0) {
                effectiveTemas = Array.from(matchedTemas);
              } else {
                // Parâmetro não bate com tema do banco (ex: é um subtema/aula específica)
                effectiveTemas = null;
              }
            }
          } catch (e) {
            console.warn('Erro ao resolver temas expandidos:', e);
          }
        }

        let { data, error } = await supabase.rpc('flashcards_sessao', {
          _areas: normalizedAreas,
          _temas: effectiveTemas,
          _modo: params.modo,
          _deck_id: params.deckId,
          _limit: effectiveLimit,
          _tipos: params.tipos && params.tipos.length > 0 ? params.tipos : null,
        });

        // Fallback seguro: se com o filtro de temas retornou 0 cards, tenta sem filtro de temas
        if ((!data || data.length === 0) && effectiveTemas && effectiveTemas.length > 0) {
          const retry = await supabase.rpc('flashcards_sessao', {
            _areas: normalizedAreas,
            _temas: null,
            _modo: params.modo,
            _deck_id: params.deckId,
            _limit: effectiveLimit,
            _tipos: params.tipos && params.tipos.length > 0 ? params.tipos : null,
          });
          if (!retry.error && retry.data && retry.data.length > 0) {
            data = retry.data;
          }
        }

        if (error) throw error;
        const list = (data || []).map((c: any) => ({
          ...c,
          tipo: c.tipo || c.resumo_ia || 'Pergunta e Resposta'
        })) as unknown as FlashcardCard[];
        if (list.length > 0 && params.areas && params.areas.length > 0) {
          // Persiste cartões baixados por área no IndexedDB para estudo offline
          const byArea = new Map<string, FlashcardCard[]>();
          for (const card of list) {
            if (card.area) {
              const arr = byArea.get(card.area) || [];
              arr.push(card);
              byArea.set(card.area, arr);
            }
          }
          for (const [area, cards] of byArea.entries()) {
            const safeName = area.replace(/[^a-zA-Z0-9_-]/g, '_');
            void saveOfflinePackage(`flashcards-cards_${safeName}`, `Flashcards ${area}`, cards);
          }
        }
        return list;
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
        if (params.tipos && params.tipos.length > 0) {
          allCards = allCards.filter(c => params.tipos!.includes(c.tipo || c.resumo_ia || ''));
        }
        return allCards.sort(() => 0.5 - Math.random()).slice(0, effectiveLimit);
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
      const rows = (data || []) as unknown as FlashcardsAreaRow[];
      if (rows && rows.length > 0) {
        void saveOfflinePackage('flashcards-resumo-areas', 'Flashcards Áreas', rows);
      }
      return rows;
    },
  });
};
