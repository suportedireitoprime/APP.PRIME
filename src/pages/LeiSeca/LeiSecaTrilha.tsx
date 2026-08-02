import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate, useParams } from "react-router-dom";
import { getTrilha, type LeiSecaTrilha } from "@/lib/leiSeca";
import { hydrateLeiSecaFromSession, trilhaKey } from "@/lib/leiSecaPrefetch";
import { persistedInitial, savePersisted } from "@/lib/queryPersist";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function LeiSecaTrilha() {
  const { slug = "" } = useParams();
  const qc = useQueryClient();

  // Tenta hidratar do sessionStorage antes do primeiro render.
  if (slug && !qc.getQueryData(trilhaKey(slug))) {
    hydrateLeiSecaFromSession(qc, slug);
  }

  const { data, isLoading } = useQuery({
    queryKey: trilhaKey(slug),
    queryFn: () => getTrilha(slug),
    enabled: !!slug,
    staleTime: 10 * 60_000,
    ...persistedInitial<LeiSecaTrilha>(`lei-seca-trilha:${slug}`),
  });
  useEffect(() => { if (data) savePersisted(`lei-seca-trilha:${slug}`, data); }, [data, slug]);

  // Caminho rápido: cache já tem trilha — redireciona imediatamente, sem pintar nada.
  const cached = qc.getQueryData<LeiSecaTrilha>(trilhaKey(slug)) ?? data;
  if (cached?.partes?.[0]?.slug) {
    return <Navigate to={`/lei-seca/${slug}/${cached.partes[0].slug}`} replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background animate-fade-in-fast">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Fallback (sem partes): vai pra "geral".
  return <Navigate to={`/lei-seca/${slug}/geral`} replace />;
}
