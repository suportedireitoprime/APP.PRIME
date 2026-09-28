import { useQuery } from "@tanstack/react-query";

export interface DicionarioTermo {
  letra: string;
  palavra: string;
  significado: string;
  exemplo_pratico: string | null;
}

import dicionarioData from "@/data/dicionario_fallback.json";

export function useDicionarioJuridico() {
  return useQuery({
    queryKey: ["dicionario_juridico"],
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async (): Promise<DicionarioTermo[]> => {
      return dicionarioData as DicionarioTermo[];
    },
  });
}