import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ConteudoTipo =
  | 'videoaula'
  | 'livro'
  | 'blog'
  | 'resumo'
  | 'noticia'
  | 'obra'
  | 'dicionario'
  | 'artigo'
  | 'sumula'
  | 'tese'
  | 'informativo'
  | 'pesquisa';

/** Grupos de busca: abas "Conteúdo" e "Jurisprudência". */
export type ConteudoGrupo = 'conteudo' | 'jurisprudencia';

export const TIPOS_CONTEUDO: ConteudoTipo[] = [
  'videoaula', 'livro', 'blog', 'resumo', 'noticia', 'obra', 'dicionario', 'artigo',
];

export const TIPOS_JURISPRUDENCIA: ConteudoTipo[] = [
  'sumula', 'tese', 'informativo', 'pesquisa',
];

export interface ConteudoResultado {
  entity_type: ConteudoTipo;
  entity_id: string;
  entity_table: string;
  title: string;
  subtitle: string | null;
  snippet: string | null;
  thumb_url: string | null;
  route: string;
  score: number;
}

const searchCache = new Map<string, ConteudoResultado[]>();
const MAX_CACHE_SIZE = 50;

function getCacheKey(termo: string, tipo: string): string {
  return `${tipo}:${termo.trim().toLowerCase()}`;
}

export function prefetchBusca(termo: string, tipo: ConteudoTipo | ConteudoGrupo | 'tudo' = 'tudo') {
  const q = termo.trim();
  if (q.length < 2) return;
  const cacheKey = getCacheKey(q, tipo);
  if (searchCache.has(cacheKey)) return;

  (async () => {
    try {
      const { data, error } = await supabase.rpc('buscar_conteudo', {
        _termo: q,
        _tipo: tipo === 'tudo' ? null : tipo,
        _limit: 60,
      });
      if (!error && Array.isArray(data)) {
        if (searchCache.size >= MAX_CACHE_SIZE) {
          const firstKey = searchCache.keys().next().value;
          if (firstKey) searchCache.delete(firstKey);
        }
        searchCache.set(cacheKey, data as ConteudoResultado[]);
      }
    } catch {
      // ignora erros no prefetch
    }
  })();
}

export function useBuscaConteudo(
  termo: string,
  tipo: ConteudoTipo | ConteudoGrupo | 'tudo' = 'tudo',
) {
  const [resultados, setResultados] = useState<ConteudoResultado[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = termo.trim();
    if (q.length < 2) {
      setResultados([]);
      setLoading(false);
      return;
    }

    const cacheKey = getCacheKey(q, tipo);
    if (searchCache.has(cacheKey)) {
      setResultados(searchCache.get(cacheKey)!);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    async function buscar() {
      try {
        const { data, error } = await supabase.rpc('buscar_conteudo', {
          _termo: q,
          _tipo: tipo === 'tudo' ? null : tipo,
          _limit: 60,
        });

        if (!isMounted) return;

        if (!error && Array.isArray(data)) {
          const res = data as ConteudoResultado[];
          if (searchCache.size >= MAX_CACHE_SIZE) {
            const firstKey = searchCache.keys().next().value;
            if (firstKey) searchCache.delete(firstKey);
          }
          searchCache.set(cacheKey, res);
          setResultados(res);

          // fire-and-forget log de hit
          supabase.from('search_hits').insert({
            termo: q,
            termo_norm: q.toLowerCase(),
            tipo: tipo === 'tudo' ? null : tipo,
          }).then(() => {});

          // GA4 `search` + Meta `Search`
          import('@/lib/appEvents')
            .then(({ appEvents }) => appEvents.search(q, res.length))
            .catch(() => {});
        } else {
          setResultados([]);
        }
      } catch (e) {
        if (isMounted) setResultados([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    buscar();

    return () => {
      isMounted = false;
    };
  }, [termo, tipo]);

  return { resultados, loading };
}
