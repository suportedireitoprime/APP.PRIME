import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useLeiSecaFavoritos() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["lei-seca-favoritos", userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lei_seca_favoritos")
        .select("trilha_slug")
        .eq("user_id", userId!);
      if (error) throw error;
      return new Set<string>((data ?? []).map((r: any) => r.trilha_slug));
    },
  });

  const toggle = useMutation({
    mutationFn: async (trilhaSlug: string) => {
      if (!userId) return;
      const isFav = query.data?.has(trilhaSlug);
      if (isFav) {
        await supabase
          .from("lei_seca_favoritos")
          .delete()
          .eq("user_id", userId)
          .eq("trilha_slug", trilhaSlug);
      } else {
        await supabase.from("lei_seca_favoritos").insert({ user_id: userId, trilha_slug: trilhaSlug });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lei-seca-favoritos", userId] }),
  });

  return {
    favoritos: query.data ?? new Set<string>(),
    isFav: (slug: string) => !!query.data?.has(slug),
    toggle: (slug: string) => toggle.mutate(slug),
    isLoading: query.isLoading,
  };
}
