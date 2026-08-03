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
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('buscar_conteudo', {
        _termo: q,
        _tipo: tipo === 'tudo' ? null : tipo,
        _limit: 60,
      });
      if (!error && Array.isArray(data)) {
        setResultados(data as ConteudoResultado[]);
        // fire-and-forget log de hit
        supabase.from('search_hits').insert({
          termo: q,
          termo_norm: q.toLowerCase(),
          tipo: tipo === 'tudo' ? null : tipo,
        }).then(() => {});
        // GA4 `search` + Meta `Search`
        import('@/lib/appEvents')
          .then(({ appEvents }) => appEvents.search(q, (data as unknown[]).length))
          .catch(() => {});
      } else {
        setResultados([]);
      }
      setLoading(false);
    }, 280);
    return () => clearTimeout(t);
  }, [termo, tipo]);

  return { resultados, loading };
}
