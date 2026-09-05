import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { normalizeAreaText, type AreaRow } from "../resumosStyles";

let areasThemesCache: AreaRow[] | null = null;

export function useResumosAreasData() {
  const [rows, setRows] = useState<AreaRow[]>(() => {
    if (areasThemesCache && areasThemesCache.length > 0) return areasThemesCache;
    try {
      const stored = localStorage.getItem("resumos_areas_temas_cache");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].temas) {
          areasThemesCache = parsed;
          return parsed;
        }
      }
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState(() => !areasThemesCache || areasThemesCache.length === 0);
  const [q, setQ] = useState("");
  const [activeTab, setActiveTab] = useState("Todos");

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    if (!areasThemesCache || (areasThemesCache.length > 0 && !areasThemesCache[0].temas)) {
      try {
        const stored = localStorage.getItem("resumos_areas_temas_cache");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].temas) {
            areasThemesCache = parsed;
            setRows(parsed);
            setLoading(false);
          }
        }
      } catch {}
    } else {
      setRows(areasThemesCache);
      setLoading(false);
    }

    (async () => {
      if (!areasThemesCache || (areasThemesCache.length > 0 && !areasThemesCache[0].temas)) {
        setLoading(true);
      }

      const map = new Map<string, Set<string>>();
      const totalMap = new Map<string, number>();
      let from = 0;
      const step = 1000;
      let gotAny = false;

      while (true) {
        const { data, error } = await (supabase as any)
          .from("resumos_juridicos")
          .select("area, tema")
          .not("area", "is", null)
          .range(from, from + step - 1);

        if (error) break;
        if (!data || data.length === 0) break;

        gotAny = true;
        for (const r of data as { area: string; tema: string }) {
          if (!map.has(r.area)) map.set(r.area, new Set());
          if (r.tema) map.get(r.area)!.add(r.tema);
          totalMap.set(r.area, (totalMap.get(r.area) || 0) + 1);
        }

        if (data.length < step) break;
        from += step;
      }

      if (!gotAny) {
        try {
          const { bundle } = await import("@/services/offlineBundle");
          const bundleRows = await bundle.resumos<{ area: string; tema: string }>();
          for (const r of bundleRows) {
            if (!r.area) continue;
            if (!map.has(r.area)) map.set(r.area, new Set());
            if (r.tema) map.get(r.area)!.add(r.tema);
            totalMap.set(r.area, (totalMap.get(r.area) || 0) + 1);
          }
        } catch {}
      }

      const list = Array.from(map.entries())
        .map(([area, temasSet]) => ({
          area,
          total: totalMap.get(area) || 0,
          temas: Array.from(temasSet).sort((a, b) => a.localeCompare(b)),
        }))
        .sort((a, b) => a.area.localeCompare(b.area));

      if (list.length > 0) {
        areasThemesCache = list;
        setRows(list);
        try {
          localStorage.setItem("resumos_areas_temas_cache", JSON.stringify(list));
        } catch {}
      }
      setLoading(false);
    })();
  }, []);

  const filteredAreas = useMemo(() => {
    if (!q) return rows;
    const t = normalizeAreaText(q.trim());
    return rows.filter((r) => normalizeAreaText(r.area).includes(t));
  }, [rows, q]);

  const activeAreaRow = useMemo(() => {
    if (activeTab === "Todos") return null;
    return rows.find((r) => r.area === activeTab) || null;
  }, [rows, activeTab]);

  const filteredTemas = useMemo(() => {
    if (!activeAreaRow) return [];
    if (!q) return activeAreaRow.temas;
    const t = normalizeAreaText(q.trim());
    return activeAreaRow.temas.filter((tema) => normalizeAreaText(tema).includes(t));
  }, [activeAreaRow, q]);

  const totalCalculatedResumos = useMemo(() => {
    const sum = rows.reduce((acc, r) => acc + (r.total || 0), 0);
    return sum > 0 ? sum : 4359;
  }, [rows]);

  const totalCalculatedAreas = useMemo(() => {
    return rows.length > 0 ? rows.length : 29;
  }, [rows]);

  const totalCalculatedTemas = useMemo(() => {
    const sum = rows.reduce((acc, r) => acc + (r.temas ? r.temas.length : 0), 0);
    return sum > 0 ? sum : 527;
  }, [rows]);

  return {
    rows,
    loading,
    q,
    setQ,
    activeTab,
    setActiveTab,
    filteredAreas,
    filteredTemas,
    totalCalculatedResumos,
    totalCalculatedAreas,
    totalCalculatedTemas,
  };
}
