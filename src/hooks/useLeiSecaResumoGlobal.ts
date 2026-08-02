import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ResumoTrilha {
  total: number;
  concluidas: number;
  estrelas: number;
  pct: number;
}

export interface ResumoGlobal {
  porTrilha: Map<string, ResumoTrilha>;
  totalLicoes: number;
  totalConcluidas: number;
  totalEstrelas: number;
  trilhasIniciadas: number;
  pctGlobal: number;
}

export function useLeiSecaResumoGlobal() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["lei-seca-resumo-global", user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async (): Promise<ResumoGlobal> => {
      const [{ data: licoes }, { data: prog }] = await Promise.all([
        supabase.from("lei_seca_licoes").select("id,trilha_slug"),
        supabase.from("lei_seca_progresso").select("licao_id,estrelas,concluida").eq("user_id", user!.id),
      ]);

      const licoesPorTrilha = new Map<string, string[]>();
      (licoes ?? []).forEach((l: any) => {
        const arr = licoesPorTrilha.get(l.trilha_slug) ?? [];
        arr.push(l.id);
        licoesPorTrilha.set(l.trilha_slug, arr);
      });

      const progMap = new Map<string, { estrelas: number; concluida: boolean }>();
      (prog ?? []).forEach((p: any) => progMap.set(p.licao_id, { estrelas: p.estrelas ?? 0, concluida: !!p.concluida }));

      const porTrilha = new Map<string, ResumoTrilha>();
      let totalLicoes = 0, totalConcluidas = 0, totalEstrelas = 0, trilhasIniciadas = 0;

      licoesPorTrilha.forEach((ids, slug) => {
        let conc = 0, est = 0;
        ids.forEach((id) => {
          const p = progMap.get(id);
          if (p?.concluida) conc++;
          est += p?.estrelas ?? 0;
        });
        const pct = ids.length ? Math.round((conc / ids.length) * 100) : 0;
        porTrilha.set(slug, { total: ids.length, concluidas: conc, estrelas: est, pct });
        totalLicoes += ids.length;
        totalConcluidas += conc;
        totalEstrelas += est;
        if (conc > 0) trilhasIniciadas++;
      });

      return {
        porTrilha,
        totalLicoes,
        totalConcluidas,
        totalEstrelas,
        trilhasIniciadas,
        pctGlobal: totalLicoes ? Math.round((totalConcluidas / totalLicoes) * 100) : 0,
      };
    },
  });
}
