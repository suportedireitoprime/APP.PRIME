import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  DESAFIOS_DECKS_CATALOGO,
  TODOS_DESAFIOS_DECKS,
  DesafioDeckPronto,
  getDecksPorArea,
  TOTAL_DESAFIOS_COUNT,
  AREA_TEMAS_COUNT_MAP,
} from '@/config/flashcardsDesafiosDecks';

const STORAGE_KEY = 'vade_desafios_decks_concluidos_v1';

function getStoredConcluidos(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredConcluidos(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {}
}

export function useFlashcardsDesafiosStore() {
  const { user } = useAuth();
  const [concluidos, setConcluidos] = useState<string[]>(getStoredConcluidos);
  const [loading, setLoading] = useState(true);

  // Sincroniza com Supabase ao autenticar
  useEffect(() => {
    let alive = true;
    const sync = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await (supabase as any)
          .from('flashcards_desafios_progresso')
          .select('desafio_id, status')
          .eq('user_id', user.id)
          .eq('status', 'concluido');

        if (alive && data) {
          const dbIds = data.map((d: any) => d.desafio_id).filter(Boolean);
          const localIds = getStoredConcluidos();
          const merged = Array.from(new Set([...localIds, ...dbIds]));
          setConcluidos(merged);
          saveStoredConcluidos(merged);
        }
      } catch (e) {
        console.warn('[flashcards-desafios-store] Falha ao sincronizar com nuvem:', e);
      } finally {
        if (alive) setLoading(false);
      }
    };
    sync();
    return () => { alive = false; };
  }, [user]);

  const concluirDeck = useCallback(async (deckId: string) => {
    setConcluidos(prev => {
      if (prev.includes(deckId)) return prev;
      const next = [...prev, deckId];
      saveStoredConcluidos(next);
      return next;
    });

    if (user) {
      try {
        await (supabase as any).from('flashcards_desafios_progresso').upsert({
          user_id: user.id,
          desafio_id: deckId,
          status: 'concluido',
          dias_concluidos: 1,
          concluido_em: new Date().toISOString(),
        }, { onConflict: 'user_id,desafio_id' });
      } catch (e) {
        console.warn('[flashcards-desafios-store] Erro ao salvar progresso no banco:', e);
      }
    }
  }, [user]);

  const isDeckConcluido = useCallback((deckId: string) => {
    return concluidos.includes(deckId);
  }, [concluidos]);

  const isDeckDesbloqueado = useCallback((deck: DesafioDeckPronto, decksDaArea: DesafioDeckPronto[]) => {
    if (deck.ordem === 1) return true;
    const anterior = decksDaArea.find(d => d.ordem === deck.ordem - 1);
    if (!anterior) return true;
    return concluidos.includes(anterior.id);
  }, [concluidos]);

  const totalDecks = TOTAL_DESAFIOS_COUNT;
  const totalConcluidos = useMemo(() => {
    return concluidos.length;
  }, [concluidos]);

  const porcentagemGlobal = useMemo(() => {
    if (totalDecks === 0) return 0;
    return Math.min(100, Math.round((totalConcluidos / totalDecks) * 100));
  }, [totalConcluidos, totalDecks]);

  const obterProgressoArea = useCallback((areaNome: string) => {
    const decks = getDecksPorArea(areaNome);
    const total = AREA_TEMAS_COUNT_MAP[areaNome] ?? (decks.length || 1);
    const conc = concluidos.filter(id => 
      id.toLowerCase().includes(areaNome.toLowerCase()) || 
      decks.some(d => d.id === id)
    ).length;
    const pct = total > 0 ? Math.min(100, Math.round((conc / total) * 100)) : 0;
    const proximo = decks.find(d => !concluidos.includes(d.id)) || null;
    return {
      total,
      concluidos: conc,
      porcentagem: pct,
      proximoDeck: proximo,
    };
  }, [concluidos]);

  // Primeiro deck pendente em ordem de áreas para o destaque "Seu Desafio Atual"
  const desafioAtualGlobal = useMemo(() => {
    for (const cat of DESAFIOS_DECKS_CATALOGO) {
      for (const d of cat.decks) {
        if (!concluidos.includes(d.id)) {
          return d;
        }
      }
    }
    return TODOS_DESAFIOS_DECKS[0];
  }, [concluidos]);

  return {
    concluidos,
    loading,
    totalDecks,
    totalConcluidos,
    porcentagemGlobal,
    concluirDeck,
    isDeckConcluido,
    isDeckDesbloqueado,
    obterProgressoArea,
    desafioAtualGlobal,
  };
}
