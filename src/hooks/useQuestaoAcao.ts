import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type AcaoTipo =
  | 'comentario' | 'lei-erradas' | 'aula' | 'flashcards'
  | 'lei' | 'pegadinhas' | 'mapa' | 'cornell' | 'termos';

export interface QuestaoInline {
  enunciado: string;
  alt_a?: string | null; alt_b?: string | null; alt_c?: string | null;
  alt_d?: string | null; alt_e?: string | null;
  gabarito?: string | null;
  comentario?: string | null;
  disciplina?: string | null;
  assunto?: string | null;
  subtema?: string | null;
  banca?: string | null;
  ano?: number | string | null;
  texto_associado?: string | null;
}

function hashKey(q: QuestaoInline) {
  const s = q.enunciado ?? '';
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return String(h);
}

async function fetchAcao(body: Record<string, any>) {
  const { data, error } = await supabase.functions.invoke('questao-acao-ia', { body });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  return (data as any)?.payload;
}

function chaveDe(source: string | QuestaoInline) {
  return typeof source === 'string' ? `id:${source}` : `inline:${hashKey(source)}`;
}

function corpoDe(source: string | QuestaoInline, tipo: AcaoTipo) {
  return typeof source === 'string' ? { questaoId: source, tipo } : { questao: source, tipo };
}

/** Busca (com cache local + cache no servidor) um recurso de IA da questão. */
export function useQuestaoAcao(
  source: string | QuestaoInline | null | undefined,
  tipo: AcaoTipo,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['questao-acao', source ? chaveDe(source) : 'nulo', tipo],
    queryFn: () => fetchAcao(corpoDe(source as string | QuestaoInline, tipo)),
    enabled: !!source && enabled,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
    retry: 1,
  });
}

/** Pré-gera em segundo plano os recursos das próximas questões. */
export function usePrefetchQuestoesAcoes(
  fontes: Array<string | QuestaoInline>,
  indexAtual: number,
  lookahead = 2,
  tipos: AcaoTipo[] = ['comentario'],
  ativo = false,
) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!ativo) return;
    const alvos = fontes.slice(indexAtual + 1, indexAtual + 1 + lookahead);
    alvos.forEach((source) => {
      tipos.forEach((tipo) => {
        qc.prefetchQuery({
          queryKey: ['questao-acao', chaveDe(source), tipo],
          queryFn: () => fetchAcao(corpoDe(source, tipo)),
          staleTime: 1000 * 60 * 60,
        });
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativo, indexAtual, lookahead, fontes.length]);
}
