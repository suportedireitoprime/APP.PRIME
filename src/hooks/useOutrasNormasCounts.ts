import { useQuery } from '@tanstack/react-query';
import { resenhaSelect } from '@/lib/resenhaBackend';

export type OutrasNormasCounts = Record<string, number>;

const TIPOS = ['Lei', 'Lei Complementar', 'Decreto', 'Medida Provisória'];

export function useOutrasNormasCounts() {
  const { data: counts = {}, isLoading: loading } = useQuery({
    queryKey: ['outras-normas-counts'],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 7);
      const sinceISO = since.toISOString().slice(0, 10);
      const data = await resenhaSelect<{ tipo_ato: string; data_dou: string }>({
        select: 'tipo_ato,data_dou',
        data_dou: `gte.${sinceISO}`,
        limit: '1000',
      });
      const acc: OutrasNormasCounts = {};
      TIPOS.forEach((t) => (acc[t] = 0));
      (data as any[] | null)?.forEach((r) => {
        if (r.tipo_ato && acc[r.tipo_ato] !== undefined) acc[r.tipo_ato] += 1;
      });
      return acc;
    },
    staleTime: 1000 * 60 * 60 * 6, // 6 hours
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  return { counts, loading };
}
