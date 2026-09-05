import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { COLECOES, findColecao, normalizeLivro, type LivroNormalizado } from '@/lib/bibliotecaColecoes';
import { useVisibleColecoes } from '@/hooks/useVisibleColecoes';
import { withBundleFallback, bundle } from '@/services/offlineBundle';
import { getPersistedColecao, setPersistedColecao } from '@/services/offlineDb';
import { scheduleWarmBiblioteca } from '@/services/bibliotecaWarmup';
import { startCapasPrefetch } from '@/services/bibliotecaCapasPrefetch';
import { startLeituraNativaPrefetch } from '@/services/leituraNativaPrefetch';

const PERFORMANCE_IDS = ['fora-da-toga', 'oratoria', 'lideranca', 'portugues', 'pesquisa'];

export type AbaBiblioteca = 'performance' | 'acervos' | 'materias';

export function useBibliotecasData() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const abaUrl = searchParams.get('aba') as AbaBiblioteca;
  const materiaUrl = searchParams.get('materia');

  const [livroAberto, setLivroAberto] = useState<LivroNormalizado | null>(null);
  const [customPdfUrl, setCustomPdfUrl] = useState<string | null>(null);
  const [customPdfTitle, setCustomPdfTitle] = useState<string>('');
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchCounts = async () => {
      const newCounts = { ...counts };
      await Promise.all(
        COLECOES.map(async (c) => {
          if (!newCounts[c.id]) {
            const { count } = await supabase.from(c.table).select('id', { count: 'exact', head: true });
            newCounts[c.id] = count || 0;
          }
        }),
      );
      setCounts(newCounts);
    };
    fetchCounts();
  }, []);

  const location = useLocation();

  useEffect(() => {
    if (location.state?.openLivro) {
      setLivroAberto(location.state.openLivro as LivroNormalizado);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Ponte nativa Capacitor
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      let isMounted = true;
      let closeHandler: { remove: () => void } | null = null;

      (async () => {
        try {
          const { NativeBiblioteca } = await import('@/plugins/NativeBibliotecaPlugin');
          const { data: auth } = await supabase.auth.getSession();
          const token = auth.session?.access_token || '';

          if (!isMounted) return;

          closeHandler = await NativeBiblioteca.addListener('onClose', () => {
            navigate(-1);
          });

          await NativeBiblioteca.openBiblioteca({
            aba: abaUrl || 'acervos',
            materia: materiaUrl || '',
            accessToken: token,
          });
        } catch (e) {
          console.warn('Fallback para interface web da biblioteca:', e);
        }
      })();

      return () => {
        isMounted = false;
        closeHandler?.remove();
      };
    }
  }, [abaUrl, materiaUrl, navigate]);

  const aba: AbaBiblioteca =
    abaUrl && ['performance', 'acervos', 'materias'].includes(abaUrl) ? abaUrl : 'acervos';
  const materiaAberta = materiaUrl || null;

  const setAba = (newAba: AbaBiblioteca) => {
    setSearchParams(
      (prev) => {
        prev.set('aba', newAba);
        prev.delete('materia');
        return prev;
      },
      { replace: true },
    );
  };

  const setMateriaAberta = (novaMateria: string | null) => {
    setSearchParams(
      (prev) => {
        if (novaMateria) prev.set('materia', novaMateria);
        else prev.delete('materia');
        return prev;
      },
      { replace: true },
    );
  };

  const colecoesVisiveis = useVisibleColecoes();

  useEffect(() => {
    getPersistedColecao('areas').then((cached) => {
      if (cached && cached.length > 0) {
        const current = queryClient.getQueryData(['biblioteca-colecao', 'areas']);
        if (!current) {
          queryClient.setQueryData(['biblioteca-colecao', 'areas'], cached);
        }
      }
    });
  }, [queryClient]);

  const colecoesPerformance = useMemo(
    () => colecoesVisiveis.filter((c) => PERFORMANCE_IDS.includes(c.id)),
    [colecoesVisiveis],
  );
  const colecoesAcervos = colecoesVisiveis;

  const colecaoAreas = findColecao('areas');
  const { data: livrosAreas = [] } = useQuery({
    queryKey: ['biblioteca-colecao', 'areas'],
    staleTime: 10 * 60 * 1000,
    placeholderData: (prev: LivroNormalizado[] | undefined) => prev,
    queryFn: async () => {
      if (!colecaoAreas) return [] as LivroNormalizado[];
      try {
        let q = supabase.from(colecaoAreas.table as any).select(colecaoAreas.select);
        if (colecaoAreas.orderBy) {
          q = q.order(colecaoAreas.orderBy, { ascending: true, nullsFirst: false }) as any;
        }

        const data = await withBundleFallback(
          q.limit(2000).then((res: any) => {
            if (res.error) throw res.error;
            return res.data;
          }),
          async () => {
            const rows = await bundle.bibliotecaEstudos();
            return rows || [];
          },
        );

        const normalized = Array.isArray(data)
          ? data.map((r: any) => normalizeLivro(r, colecaoAreas))
          : [];
        setPersistedColecao('areas', normalized).catch(() => {});
        return normalized;
      } catch (err) {
        const cached = await getPersistedColecao<LivroNormalizado>('areas');
        if (cached && cached.length > 0) return cached;
        throw err;
      }
    },
  });

  const materias = useMemo(() => {
    const map = new Map<string, { name: string; capa?: string; count: number }>();
    for (const l of livrosAreas) {
      const a = l.area || 'Outros';
      const cur = map.get(a);
      if (cur) cur.count++;
      else map.set(a, { name: a, capa: l.capa || undefined, count: 1 });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [livrosAreas]);

  // SEO & Título dinâmico por aba da biblioteca
  useEffect(() => {
    const rotulos = {
      acervos: 'Biblioteca - Acervos | Vade Mecum PRIME',
      performance: 'Biblioteca - Performance & Desenvolvimento | Vade Mecum PRIME',
      materias: 'Biblioteca - Matérias do Direito | Vade Mecum PRIME',
    };
    document.title = rotulos[aba] || 'Biblioteca Jurídica | Vade Mecum PRIME';
  }, [aba]);

  useEffect(() => {
    const cancel = scheduleWarmBiblioteca(queryClient);
    if (!Capacitor.isNativePlatform()) return cancel;
    startCapasPrefetch({ wifiOnly: false }).catch(() => {});
    startLeituraNativaPrefetch({ wifiOnly: true }).catch(() => {});
    return cancel;
  }, [queryClient]);

  return {
    navigate,
    aba,
    setAba,
    materiaAberta,
    setMateriaAberta,
    counts,
    livrosAreas,
    materias,
    livroAberto,
    setLivroAberto,
    customPdfUrl,
    setCustomPdfUrl,
    customPdfTitle,
    setCustomPdfTitle,
    colecoesPerformance,
    colecoesAcervos,
  };
}
