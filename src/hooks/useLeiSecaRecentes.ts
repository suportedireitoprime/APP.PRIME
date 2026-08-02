import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/** Retorna trilha_slugs ordenadas pelo progresso mais recente do usuário. */
export function useLeiSecaRecentes() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  return useQuery({
    queryKey: ["lei-seca-recentes", userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data: prog } = await supabase
        .from("lei_seca_progresso")
        .select("licao_id,updated_at")
        .eq("user_id", userId!)
        .order("updated_at", { ascending: false })
        .limit(80);
      const ids = (prog ?? []).map((p: any) => p.licao_id);
      if (!ids.length) return [] as string[];
      const { data: licoes } = await supabase
        .from("lei_seca_licoes")
        .select("id,trilha_slug")
        .in("id", ids);
      const slugByLicao = new Map<string, string>();
      (licoes ?? []).forEach((l: any) => slugByLicao.set(l.id, l.trilha_slug));
      const seen = new Set<string>();
      const ordered: string[] = [];
      for (const p of prog ?? []) {
        const s = slugByLicao.get((p as any).licao_id);
        if (s && !seen.has(s)) {
          seen.add(s);
          ordered.push(s);
        }
      }
      return ordered;
    },
  });
}
