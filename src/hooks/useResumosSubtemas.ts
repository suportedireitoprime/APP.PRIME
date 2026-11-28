import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ResumoRow } from "@/components/resumos-juridicos/ResumoJuridicoReaderSheet";
import { readCacheJson, writeCacheJson } from "@/lib/cacheStorage";

interface SupabaseSubtemaRow {
  id: string;
  area: string;
  tema: string;
  subtema: string | null;
  ordem_subtema: number | null;
}

const subtemasMemoryCache = new Map<string, ResumoRow[]>();

function isOfficialSubtemaList(list: unknown): list is ResumoRow[] {
  return (
    Array.isArray(list) &&
    list.length > 0 &&
    list.every(
      (c): c is ResumoRow =>
        Boolean(c && typeof c === "object" && "id" in c && String((c as { id?: unknown }).id).includes("_cap"))
    )
  );
}

/**
 * Hook compartilhado para carregar subtemas/tópicos de um tema em 3 camadas:
 * 1) Cache em memória / localStorage oficial
 * 2) Catálogo offline (0ms) + pré-carregamento do conteúdo completo R2/IndexedDB
 * 3) Fallback leve no Supabase
 */
export function useResumosSubtemas(area: string, tema: string | null | undefined, persistLocal = false) {
  const cacheKey = useMemo(() => (area && tema ? `${area}:${tema}` : ""), [area, tema]);

  const [rows, setRows] = useState<ResumoRow[]>(() => {
    if (!cacheKey) return [];
    const cached = subtemasMemoryCache.get(cacheKey);
    return isOfficialSubtemaList(cached) ? cached : [];
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (!cacheKey) return false;
    const cached = subtemasMemoryCache.get(cacheKey);
    return !isOfficialSubtemaList(cached);
  });

  useEffect(() => {
    if (!cacheKey || !area || !tema) {
      setRows([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const localKey = `resumos_subtemas_v7_cap:${cacheKey}`;

    const mem = subtemasMemoryCache.get(cacheKey);
    if (isOfficialSubtemaList(mem)) {
      setRows(mem);
      setLoading(false);
    } else {
      if (persistLocal) {
        const stored = readCacheJson<ResumoRow[]>(localKey);
        if (isOfficialSubtemaList(stored)) {
          subtemasMemoryCache.set(cacheKey, stored);
          setRows(stored);
          setLoading(false);
        } else {
          setRows([]);
          setLoading(true);
        }
      } else {
        setRows([]);
        setLoading(true);
      }
    }

    (async () => {
      try {
        const {
          getResumosCatalog,
          matchAreaInCatalog,
          matchTemaInArea,
          getOrFetchMateriaContent,
        } = await import("@/services/resumosCatalog");
        const catalog = await getResumosCatalog();
        const areaObj = matchAreaInCatalog(catalog, area);
        const temaObj = areaObj ? matchTemaInArea(areaObj.temas, tema) : undefined;

        if (temaObj?.subtemas && temaObj.subtemas.length > 0) {
          const list: ResumoRow[] = temaObj.subtemas.map((s, idx) => ({
            id: s.id,
            area: areaObj?.area || area,
            tema: temaObj.tema || tema,
            subtema: s.subtema,
            ordem_subtema: s.ordem ?? idx + 1,
            markdown: s.markdown || null,
            exemplos: s.exemplos || null,
            termos: s.termos || null,
            audio_url: s.audio_url || null,
            imageUrl: s.imageUrl || null,
          }));

          if (!cancelled) {
            subtemasMemoryCache.set(cacheKey, list);
            setRows(list);
            setLoading(false);
            if (persistLocal) writeCacheJson(localKey, list);
          }

          void getOrFetchMateriaContent(area).then((fullArea) => {
            if (cancelled || !fullArea) return;
            const fullTemaObj = matchTemaInArea(fullArea.temas, tema);
            if (fullTemaObj?.subtemas && fullTemaObj.subtemas.length > 0) {
              const fullList: ResumoRow[] = fullTemaObj.subtemas.map((s, idx) => ({
                id: s.id,
                area: fullArea.area || area,
                tema: fullTemaObj.tema || tema,
                subtema: s.subtema,
                ordem_subtema: s.ordem ?? idx + 1,
                markdown: s.markdown || null,
                exemplos: s.exemplos || null,
                termos: s.termos || null,
                audio_url: s.audio_url || null,
                imageUrl: s.imageUrl || null,
              }));
              subtemasMemoryCache.set(cacheKey, fullList);
              if (!cancelled) setRows(fullList);
            }
          });

          return;
        }
      } catch {
        // Segue para fallback Supabase
      }

      try {
        const { data } = await supabase
          .from("resumos_juridicos")
          .select("id, area, tema, subtema, ordem_subtema")
          .eq("area", area)
          .eq("tema", tema)
          .order("ordem_subtema", { ascending: true, nullsFirst: false })
          .order("subtema", { ascending: true })
          .limit(1000);

        const typed = (data ?? []) as unknown as SupabaseSubtemaRow[];
        if (!cancelled && typed.length > 0) {
          const list: ResumoRow[] = typed.map((d) => ({
            id: d.id,
            area: d.area,
            tema: d.tema,
            subtema: d.subtema,
            ordem_subtema: d.ordem_subtema,
            markdown: null,
            exemplos: null,
            termos: null,
          }));
          subtemasMemoryCache.set(cacheKey, list);
          setRows(list);
          if (persistLocal) writeCacheJson(localKey, list);
        }
      } catch {
        // Sem conexão
      }

      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [cacheKey, area, tema, persistLocal]);

  return { rows, loading };
}
