import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { loadLimits } from '@/hooks/useFeatureLimit';
import { inicioCiclo, fimCiclo, diasParaRenovar, percentualTotal, contarUsos } from '@/lib/cotaCiclo';

export type CotaItem = { key: string; label: string; description: string | null; category: string; used: number; limit: number };

export function useMinhaCota() {
  const { user } = useAuth();
  const { isPremium, loading: carregandoPlano } = useSubscription();
  const q = useQuery({
    queryKey: ['minha-cota', user?.id, isPremium],
    enabled: !!user && !carregandoPlano,
    staleTime: 60_000,
    queryFn: async () => {
      const limits = (await loadLimits()).filter((l) => l.enabled && l.period === 'monthly' && l.limit_value > 0);
      if (isPremium) return limits.sort((a, b) => a.sort_order - b.sort_order).map((l) => ({ key: l.feature_key, label: l.label, description: l.description, category: l.category, limit: l.limit_value, used: 0 }));
      const since = inicioCiclo(user!.created_at).toISOString();
      const { data } = await supabase.from('feature_usage' as any)
        .select('feature_key, scope_value, ref_key').eq('user_id', user!.id).gte('used_at', since).limit(2000);
      const rows = (data || []) as any[];
      const itens: CotaItem[] = limits
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((l) => ({ key: l.feature_key, label: l.label, description: l.description, category: l.category, limit: l.limit_value, used: contarUsos(rows.filter((r) => r.feature_key === l.feature_key)) }));
      return itens;
    },
  });
  const itens = q.data || [];
  return {
    loading: carregandoPlano || q.isLoading,
    isPremium,
    itens,
    percentual: percentualTotal(itens),
    renovaEm: user ? fimCiclo(user.created_at) : null,
    diasParaRenovar: user ? diasParaRenovar(user.created_at) : 0,
  };
}
