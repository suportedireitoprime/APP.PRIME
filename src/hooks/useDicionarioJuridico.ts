import { useQuery } from "@tanstack/react-query";

export interface DicionarioTermo {
  letra: string;
  palavra: string;
  significado: string;
  exemplo_pratico: string | null;
}

export function useDicionarioJuridico() {
  return useQuery({
    queryKey: ["dicionario_juridico"],
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async (): Promise<DicionarioTermo[]> => {
      const { default: data } = await import("@/data/dicionario_fallback.json");
      return data as DicionarioTermo[];
    },
  });
}