import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type VideoaulaTabela =
  | "videoaulas_areas_direito"
  | "videoaulas_iniciante"
  | "videoaulas_oab_primeira_fase"
  | "videoaulas_oab_segunda_fase";

export type AulaAcaoTipo =
  | "flashcards" | "lacunas" | "conceito"
  | "pegadinhas" | "mapa" | "cornell"
  | "feynman" | "topicos" | "tradicional" | "fichamento" | "comparativa"
  | "lei" | "questoes" | "termos";

export interface AulaCtxInput {
  videoId: string;
  titulo: string;
  tabela?: VideoaulaTabela;
  area?: string;
  conteudo?: string | null;
  descricao?: string | null;
}

async function fetchAcao(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("videoaula-acao-ia", { body });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data?.payload as unknown;
}

export function useVideoaulaAcao(
  input: AulaCtxInput | null,
  tipo: AulaAcaoTipo,
  enabled: boolean,
) {
  const tabela = input?.tabela ?? "videoaulas_areas_direito";
  return useQuery({
    queryKey: ["videoaula-acao", "v2", tabela, input?.videoId, tipo],
    queryFn: () =>
      fetchAcao({
        tipo,
        tabela,
        videoId: input!.videoId,
        titulo: input!.titulo,
        area: input!.area ?? "",
        conteudo: input!.conteudo ?? "",
        descricao: input!.descricao ?? "",
      }),
    enabled: !!input && enabled,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
    retry: 1,
  });
}

export function useVideoaulaResumo(
  input: { videoId: string; titulo: string; area?: string; tabela?: VideoaulaTabela } | null,
) {
  const tabela = input?.tabela ?? "videoaulas_areas_direito";
  return useQuery({
    queryKey: ["videoaula-resumo", tabela, input?.videoId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("videoaula-resumo", {
        body: { tabela, videoId: input!.videoId, titulo: input!.titulo, area: input!.area ?? "" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { area: string; tema: string; resumo: string };
    },
    enabled: !!input?.videoId,
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });
}
