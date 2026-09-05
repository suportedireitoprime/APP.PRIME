import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { resumosLocal } from "@/lib/resumosLocal";
import { useTypewriter } from "@/hooks/useTypewriter";
import type { ResumoRow } from "@/components/resumos-juridicos/ResumoJuridicoReaderSheet";
import { normalizeAreaText, type AreaRow, type TemaRow, type Ordem } from "../resumosStyles";

let areasThemesCache: AreaRow[] | null = null;
const temasCache = new Map<string, TemaRow[]>();

export function useResumosDesktopData() {
  const { area, tema } = useParams<{ area?: string; tema?: string }>();
  const decodedArea = decodeURIComponent(area || "");
  const decodedTema = decodeURIComponent(tema || "");
  const navigate = useNavigate();

  // --- COL 1: ÁREAS ---
  const [areas, setAreas] = useState<AreaRow[]>(() => areasThemesCache || []);
  const [loadingAreas, setLoadingAreas] = useState(!areasThemesCache);
  const [qArea, setQArea] = useState("");

  useEffect(() => {
    if (!areasThemesCache || (areasThemesCache.length > 0 && !areasThemesCache[0].temas)) {
      try {
        const stored = localStorage.getItem("resumos_areas_temas_cache");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].temas) {
            areasThemesCache = parsed;
            setAreas(parsed);
            setLoadingAreas(false);
          }
        }
      } catch {}
    } else {
      setAreas(areasThemesCache);
      setLoadingAreas(false);
    }

    (async () => {
      if (!areasThemesCache || (areasThemesCache.length > 0 && !areasThemesCache[0].temas)) {
        setLoadingAreas(true);
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
          const rows = await bundle.resumos<{ area: string; tema: string }>();
          for (const r of rows) {
            if (!r.area) continue;
            if (!map.has(r.area)) map.set(r.area, new Set());
            if (r.tema) map.get(r.area)!.add(r.tema);
            totalMap.set(r.area, (totalMap.get(r.area) || 0) + 1);
          }
        } catch {}
      }

      const list = Array.from(map.entries())
        .map(([areaName, temasSet]) => ({
          area: areaName,
          total: totalMap.get(areaName) || 0,
          temas: Array.from(temasSet).sort((a, b) => a.localeCompare(b)),
        }))
        .sort((a, b) => a.area.localeCompare(b.area));

      if (list.length > 0) {
        areasThemesCache = list;
        setAreas(list);
        try {
          localStorage.setItem("resumos_areas_temas_cache", JSON.stringify(list));
        } catch {}
      }
      setLoadingAreas(false);
    })();
  }, []);

  const filteredAreas = useMemo(() => {
    if (!qArea.trim()) return areas;
    const t = normalizeAreaText(qArea.trim());
    return areas.filter((r) => normalizeAreaText(r.area).includes(t));
  }, [areas, qArea]);

  // --- COL 2: TEMAS ---
  const [temas, setTemas] = useState<TemaRow[]>(() =>
    decodedArea && temasCache.has(decodedArea) ? temasCache.get(decodedArea)! : [],
  );
  const [loadingTemas, setLoadingTemas] = useState(false);
  const [qTema, setQTema] = useState("");
  const [ordemTema, setOrdemTema] = useState<Ordem>("crono");
  const [favoritosGlobais, setFavoritosGlobais] = useState<Array<{ id: string; tema?: string; area?: string }>>(() =>
    resumosLocal.favoritos(),
  );

  useEffect(() => {
    if (!decodedArea) {
      setTemas([]);
      return;
    }

    if (temasCache.has(decodedArea)) {
      setTemas(temasCache.get(decodedArea)!);
      setLoadingTemas(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadingTemas(true);
      const cacheKey = `resumos_temas_v3_${decodedArea}`;
      let list: TemaRow[] = [];

      try {
        const stored = localStorage.getItem(cacheKey);
        if (stored) {
          list = JSON.parse(stored);
        } else if (areasThemesCache) {
          const areaObj = areasThemesCache.find((a) => a.area === decodedArea);
          if (areaObj && areaObj.temas) {
            list = areaObj.temas.map((t, idx) => ({
              tema: t,
              ordem_tema: idx + 1,
              total: 1,
            }));
          }
        }
      } catch {}

      if (list.length === 0) {
        const map = new Map<string, { ordem: number | null; total: number }>();
        let from = 0;
        const step = 1000;
        let gotAny = false;
        while (true) {
          const { data, error } = await (supabase as any)
            .from("resumos_juridicos")
            .select("tema, ordem_tema")
            .eq("area", decodedArea)
            .range(from, from + step - 1);
          if (error) break;
          if (!data || data.length === 0) break;
          gotAny = true;
          for (const r of data as { tema: string; ordem_tema: number | null }[]) {
            const prev = map.get(r.tema);
            map.set(r.tema, {
              ordem: prev?.ordem ?? r.ordem_tema,
              total: (prev?.total || 0) + 1,
            });
          }
          if (data.length < step) break;
          from += step;
        }
        if (!gotAny) {
          const { bundle } = await import("@/services/offlineBundle");
          const bundleRows = await bundle.resumos<{ area: string; tema: string; ordem_tema: number | null }>();
          for (const r of bundleRows) {
            if (r.area !== decodedArea) continue;
            const prev = map.get(r.tema);
            map.set(r.tema, {
              ordem: prev?.ordem ?? r.ordem_tema,
              total: (prev?.total || 0) + 1,
            });
          }
        }
        list = Array.from(map.entries())
          .map(([t, v]) => ({ tema: t, ordem_tema: v.ordem, total: v.total }))
          .sort((a, b) => {
            if (a.ordem_tema != null && b.ordem_tema != null) return a.ordem_tema - b.ordem_tema;
            if (a.ordem_tema != null) return -1;
            if (b.ordem_tema != null) return 1;
            return a.tema.localeCompare(b.tema);
          });
      }

      if (cancelled) return;
      if (list.length > 0) {
        temasCache.set(decodedArea, list);
        setTemas(list);
        try {
          localStorage.setItem(cacheKey, JSON.stringify(list));
        } catch {}
      }
      setLoadingTemas(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [decodedArea]);

  const filteredTemas = useMemo(() => {
    let result = temas;
    if (qTema.trim()) {
      const t = qTema.toLowerCase();
      result = result.filter((r) => r.tema.toLowerCase().includes(t));
    }

    if (ordemTema === "alpha") {
      result = [...result].sort((a, b) => a.tema.localeCompare(b.tema));
    } else if (ordemTema === "fav") {
      result = result.filter((r) =>
        favoritosGlobais.some((f) => f.tema === r.tema && f.area === decodedArea),
      );
    }
    return result;
  }, [temas, qTema, ordemTema, favoritosGlobais, decodedArea]);

  const placeholderWordsTemas = useMemo(() => {
    const areaName = decodedArea.replace(/^DIREITO\s+(DO\s+|DA\s+|DE\s+)?/i, "");
    if (temas.length === 0) return [`Pesquisar matéria de ${areaName}...`];
    return temas.map((r) => `Pesquisar ${r.tema.toLowerCase()}...`);
  }, [temas, decodedArea]);
  const placeholderTextTemas = useTypewriter(placeholderWordsTemas, 50, 20, 2500);

  // --- COL 3: SUBTEMAS E LEITOR ---
  const [subtemas, setSubtemas] = useState<ResumoRow[]>([]);
  const [loadingSubtemas, setLoadingSubtemas] = useState(false);
  const [qSubtema, setQSubtema] = useState("");
  const [ordemSubtema, setOrdemSubtema] = useState<Ordem>("crono");
  const [selectedSubtema, setSelectedSubtema] = useState<ResumoRow | null>(null);

  useEffect(() => {
    setSelectedSubtema(null);
    if (!decodedArea || !decodedTema) {
      setSubtemas([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingSubtemas(true);
      const { data } = await (supabase as any)
        .from("resumos_juridicos")
        .select("id, area, tema, subtema, ordem_subtema, markdown, exemplos, termos")
        .eq("area", decodedArea)
        .eq("tema", decodedTema)
        .order("ordem_subtema", { ascending: true, nullsFirst: false })
        .order("subtema", { ascending: true })
        .limit(5000);
      let list = (data || []) as ResumoRow[];
      if (list.length === 0) {
        const { bundle } = await import("@/services/offlineBundle");
        const all = await bundle.resumos<ResumoRow>();
        list = all
          .filter((r) => r.area === decodedArea && r.tema === decodedTema)
          .sort((a, b) => (a.ordem_subtema ?? 9999) - (b.ordem_subtema ?? 9999));
      }
      if (cancelled) return;
      setSubtemas(list);
      setLoadingSubtemas(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [decodedArea, decodedTema]);

  const subtemasOrdenados = useMemo(() => {
    let result = subtemas;

    if (qSubtema.trim()) {
      const qLower = qSubtema.toLowerCase();
      result = result.filter((s) => (s.subtema || s.tema).toLowerCase().includes(qLower));
    }

    if (ordemSubtema === "alpha") {
      result = [...result].sort((a, b) => (a.subtema || "").localeCompare(b.subtema || ""));
    } else if (ordemSubtema === "fav") {
      result = result.filter((s) => favoritosGlobais.some((f) => f.id === s.id));
    }

    return result;
  }, [subtemas, ordemSubtema, favoritosGlobais, qSubtema]);

  const toggleFavorito = useCallback(() => {
    if (!selectedSubtema) return;
    resumosLocal.toggleFavorito({
      id: selectedSubtema.id,
      area: selectedSubtema.area,
      tema: selectedSubtema.tema,
      subtema: selectedSubtema.subtema,
    });
    setFavoritosGlobais(resumosLocal.favoritos());
  }, [selectedSubtema]);

  const navigateToArea = useCallback(
    (targetArea: string) => {
      navigate(`/resumos-juridicos/${encodeURIComponent(targetArea)}`);
    },
    [navigate],
  );

  const navigateToTema = useCallback(
    (targetTema: string) => {
      navigate(
        `/resumos-juridicos/${encodeURIComponent(decodedArea)}/${encodeURIComponent(targetTema)}`,
      );
    },
    [navigate, decodedArea],
  );

  const navigateToHome = useCallback(() => {
    navigate("/");
  }, [navigate]);

  return {
    decodedArea,
    decodedTema,
    areas,
    loadingAreas,
    qArea,
    setQArea,
    filteredAreas,
    temas,
    loadingTemas,
    qTema,
    setQTema,
    ordemTema,
    setOrdemTema,
    filteredTemas,
    placeholderTextTemas,
    subtemas,
    loadingSubtemas,
    qSubtema,
    setQSubtema,
    ordemSubtema,
    setOrdemSubtema,
    subtemasOrdenados,
    selectedSubtema,
    setSelectedSubtema,
    favoritosGlobais,
    toggleFavorito,
    navigateToArea,
    navigateToTema,
    navigateToHome,
  };
}
