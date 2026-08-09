import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ForcaProgresso {
  user_id: string;
  xp_total: number;
  level: number;
  best_combo: number;
  games_played: number;
  games_won: number;
}

export function useForcaProgresso() {
  const [progresso, setProgresso] = useState<ForcaProgresso | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carrega o progresso inicial do usuário logado
  useEffect(() => {
    async function loadProgress() {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.user) {
          setIsLoading(false);
          return;
        }

        const userId = session.session.user.id;
        const { data, error } = await supabase
          .from('forca_progresso')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error("Erro ao carregar progresso da forca:", error);
        }

        if (data) {
          setProgresso(data as ForcaProgresso);
        }
      } catch (err) {
        console.error("Exceção ao carregar progresso:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadProgress();
  }, []);

  // Sincroniza o XP ganho e o combo no Supabase usando a RPC
  const saveProgress = async (xpGained: number, highestCombo: number, isWin: boolean) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return;

      const userId = session.session.user.id;

      // Chama a função RPC segura
      const { error } = await supabase.rpc('increment_forca_stats', {
        p_user_id: userId,
        p_xp_gained: xpGained,
        p_highest_combo: highestCombo,
        p_is_win: isWin
      });

      if (error) {
        console.error("Erro ao salvar stats da forca:", error);
        return;
      }

      // Atualiza o estado local otimista ou refetch (fazendo um simples cálculo otimista aqui)
      setProgresso(prev => {
        if (!prev) {
          return {
            user_id: userId,
            xp_total: xpGained,
            level: Math.max(1, Math.floor(Math.sqrt(xpGained / 100)) + 1),
            best_combo: highestCombo,
            games_played: 1,
            games_won: isWin ? 1 : 0
          };
        }

        const newXp = prev.xp_total + xpGained;
        return {
          ...prev,
          xp_total: newXp,
          level: Math.max(1, Math.floor(Math.sqrt(newXp / 100)) + 1),
          best_combo: Math.max(prev.best_combo, highestCombo),
          games_played: prev.games_played + 1,
          games_won: prev.games_won + (isWin ? 1 : 0)
        };
      });

    } catch (err) {
      console.error("Exceção ao salvar progresso:", err);
    }
  };

  return { progresso, isLoading, saveProgress };
}
