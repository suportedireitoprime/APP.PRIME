import { useCallback } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ItemDrive {
  id: string;
  nome: string;
  pasta: boolean;
  mime: string;
  tamanho: number | null;
  modificadoEm: string | null;
  webViewLink: string | null;
}

interface Pagina {
  itens: ItemDrive[];
  nextPageToken: string | null;
}

const SUPABASE_URL = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const FN_URL = `${SUPABASE_URL}/functions/v1/documentos-listar`;

async function autorizacao(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function listar(pastaId: string | null, busca: string, pageToken?: string): Promise<Pagina> {
  const params = new URLSearchParams();
  if (pastaId) params.set('pasta', pastaId);
  if (busca.trim()) params.set('q', busca.trim());
  if (pageToken) params.set('pageToken', pageToken);
  const url = params.toString() ? `${FN_URL}?${params}` : FN_URL;
  const res = await fetch(url, { headers: await autorizacao() });
  const texto = await res.text();
  if (!res.ok) throw new Error(`documentos-listar [${res.status}]: ${texto.slice(0, 200)}`);
  const json = JSON.parse(texto);
  return { itens: (json.itens ?? []) as ItemDrive[], nextPageToken: json.nextPageToken ?? null };
}

/** Categorias = subpastas do 1º nível da pasta de documentos no Drive. */
export function usePastasDocumentos() {
  const query = useQuery({
    queryKey: ['documentos-drive', 'raiz'],
    staleTime: 5 * 60_000,
    queryFn: async () => (await listar(null, '')).itens.filter((i) => i.pasta),
  });
  return { ...query, pastas: query.data ?? [] };
}

/** Conteúdo paginado de uma pasta (subpastas + arquivos), com busca por nome. */
export function useConteudoPasta(pastaId: string | null, busca: string) {
  const query = useInfiniteQuery({
    queryKey: ['documentos-drive', 'pasta', pastaId, busca.trim()],
    enabled: !!pastaId,
    staleTime: 60_000,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => listar(pastaId, busca, pageParam),
    getNextPageParam: (ultima) => ultima.nextPageToken ?? undefined,
  });
  const itens = (query.data?.pages ?? []).flatMap((p) => p.itens);
  return { ...query, itens };
}

/** Baixa os bytes do documento (a pasta do Drive é privada). */
export function useDownloadDocumento() {
  return useCallback(async (id: string): Promise<Blob> => {
    const res = await fetch(`${FN_URL}?arquivo=${encodeURIComponent(id)}`, {
      headers: await autorizacao(),
    });
    if (!res.ok) {
      const detalhe = await res.text();
      throw new Error(`download [${res.status}]: ${detalhe.slice(0, 200)}`);
    }
    return await res.blob();
  }, []);
}
