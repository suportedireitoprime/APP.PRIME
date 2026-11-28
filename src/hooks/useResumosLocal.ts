import { useCallback, useEffect, useState } from "react";
import { resumosLocal, type ResumoRef } from "@/lib/resumosLocal";

/**
 * Hook reativo centralizado para favoritos e recentes de resumos.
 * Sincroniza automaticamente qualquer componente inscrito via evento `resumos-local-change`.
 */
export function useResumosLocal() {
  const [favoritos, setFavoritos] = useState<ResumoRef[]>(() => resumosLocal.favoritos());
  const [recentes, setRecentes] = useState<ResumoRef[]>(() => resumosLocal.recentes());

  const refresh = useCallback(() => {
    setFavoritos(resumosLocal.favoritos());
    setRecentes(resumosLocal.recentes());
  }, []);

  useEffect(() => {
    window.addEventListener("resumos-local-change", refresh);
    return () => window.removeEventListener("resumos-local-change", refresh);
  }, [refresh]);

  return { favoritos, recentes, refresh };
}
