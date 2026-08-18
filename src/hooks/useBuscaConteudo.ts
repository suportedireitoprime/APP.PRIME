import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { localDb } from '@/services/localDb';

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

function getCacheKey(termo: string, tipo: string, buscaIA: boolean = false): string {
  return `${tipo}:${buscaIA ? 'ia' : 'normal'}:${termo.trim().toLowerCase()}`;
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
  buscaIA: boolean = false
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

    const cacheKey = getCacheKey(q, tipo, buscaIA);
    if (searchCache.has(cacheKey)) {
      setResultados(searchCache.get(cacheKey)!);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    async function buscar() {
      try {
        let resultsOnline: ConteudoResultado[] = [];
        let errorOnline = null;

        // 1. Tenta Supabase (online ou Edge Function)
        if (navigator.onLine !== false) {
          if (buscaIA) {
            // Busca Semântica
            const { data, error } = await supabase.functions.invoke('semantic-search', {
              body: { query: q }
            });
            errorOnline = error;
            if (!error && data?.results) {
              resultsOnline = data.results.map((r: any) => ({
                entity_type: 'artigo',
                entity_id: r.id,
                entity_table: r.lei_id || 'vade_mecum_artigos',
                title: `Art. ${r.numero}`,
                subtitle: `Busca IA ${(r.similarity * 100).toFixed(1)}% match`,
                snippet: r.texto,
                thumb_url: null,
                route: `/vademecum/${r.lei_id}?art=${r.numero}`,
                score: r.similarity * 100,
              }));
            }
          } else {
            // Busca textual padrão
            const { data, error } = await supabase.rpc('buscar_conteudo', {
              _termo: q,
              _tipo: tipo === 'tudo' ? null : tipo,
              _limit: 60,
            });
            errorOnline = error;
            if (!error && Array.isArray(data)) {
              resultsOnline = data as ConteudoResultado[];
            }
          }
        }

        // 2. Tenta localDb (offline)
        let resultsOffline: ConteudoResultado[] = [];
        if (localDb.available && (tipo === 'tudo' || tipo === 'conteudo' || tipo === 'artigo')) {
          const res = await localDb.searchArtigos(q, 15);
          resultsOffline = res.map((r: any) => ({
            entity_type: 'artigo',
            entity_id: r.id,
            entity_table: r.lei, // O nome da tabela que foi salvo no sqlite
            title: `${r.lei.toUpperCase()} - Art. ${r.numero}`,
            subtitle: r.titulo || null,
            snippet: r.texto,
            thumb_url: null,
            route: `/vademecum/${r.lei}?art=${r.numero}`,
            score: 100,
          }));
        }

        if (!isMounted) return;

        // 3. Mescla os resultados priorizando online, preenchendo com offline se faltar
        const combined = [...resultsOnline];
        for (const off of resultsOffline) {
          if (!combined.some(c => c.entity_type === 'artigo' && c.entity_id === off.entity_id)) {
            combined.push(off);
          }
        }

        if (!errorOnline || combined.length > 0) {
          if (searchCache.size >= MAX_CACHE_SIZE) {
            const firstKey = searchCache.keys().next().value;
            if (firstKey) searchCache.delete(firstKey);
          }
          searchCache.set(cacheKey, combined);
          setResultados(combined);

          if (navigator.onLine !== false) {
            supabase.from('search_hits').insert({
              termo: q,
              termo_norm: q.toLowerCase(),
              tipo: tipo === 'tudo' ? null : tipo,
            }).then(() => {});

            import('@/lib/appEvents')
              .then(({ appEvents }) => appEvents.search(q, combined.length))
              .catch(() => {});
          }
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
  }, [termo, tipo, buscaIA]);

  return { resultados, loading };
}
