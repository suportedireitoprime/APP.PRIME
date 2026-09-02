import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Loader2,
  Search,
  Landmark,
  Leaf,
  Users,
  Building2,
  Scale,
  Trophy,
  Briefcase,
  Vote,
  Globe,
  Gavel,
  Shield,
  HeartPulse,
  Receipt,
  Baby,
  Car,
  Home,
  ScrollText,
  Wallet,
  Handshake,
  FileText,
} from "lucide-react";
import ShapeGrid from "@/components/ui/ShapeGrid";
import ResumosHero from "@/components/resumos/ResumosHero";
import { haptic } from "@/lib/nativeHaptics";

type AreaRow = { area: string; total: number; temas: string[] };

const AREA_STYLE: Record<string, { icon: any; color: string }> = {
  administrativo: { icon: Landmark, color: "#38bdf8" },
  ambiental: { icon: Leaf, color: "#34d399" },
  civil: { icon: Users, color: "#60a5fa" },
  concorrencial: { icon: Building2, color: "#22d3ee" },
  constitucional: { icon: Scale, color: "#c2274a" },
  desportivo: { icon: Trophy, color: "#fb923c" },
  trabalho: { icon: Briefcase, color: "#fb7185" },
  eleitoral: { icon: Vote, color: "#a78bfa" },
  internacional: { icon: Globe, color: "#2dd4bf" },
  penal: { icon: Gavel, color: "#f87171" },
  processo: { icon: ScrollText, color: "#818cf8" },
  processual: { icon: ScrollText, color: "#818cf8" },
  previdenciario: { icon: Shield, color: "#c2274a" },
  tributario: { icon: Receipt, color: "#a3e635" },
  empresarial: { icon: Building2, color: "#e879f9" },
  consumidor: { icon: Wallet, color: "#f472b6" },
  familia: { icon: Baby, color: "#f472b6" },
  transito: { icon: Car, color: "#fb923c" },
  imobiliario: { icon: Home, color: "#c2274a" },
  saude: { icon: HeartPulse, color: "#fb7185" },
  humanos: { icon: Handshake, color: "#34d399" },
};

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function styleForArea(area: string) {
  const n = normalize(area);
  for (const key of Object.keys(AREA_STYLE)) {
    if (n.includes(key)) return AREA_STYLE[key];
  }
  return { icon: FileText, color: "#e5c34a" };
}

let areasThemesCache: AreaRow[] | null = null;

export default function ResumosJuridicosAreas() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<AreaRow[]>(() => areasThemesCache || []);
  const [loading, setLoading] = useState(!areasThemesCache);
  const [q, setQ] = useState("");

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
      if (!areasThemesCache || (areasThemesCache.length > 0 && !areasThemesCache[0].temas)) setLoading(true);

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

  const filtered = useMemo(() => {
    if (!q) return rows;
    const t = normalize(q.trim());
    return rows.filter((r) => normalize(r.area).includes(t));
  }, [rows, q]);

  return (
    <div className="min-h-dvh bg-[#0D0D0D] text-white overflow-x-hidden relative flex flex-col">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.15]">
        <ShapeGrid />
      </div>

      <div className="relative z-10 flex flex-col min-h-dvh">
        <ResumosHero onBuscar={() => {
          haptic.selection();
          document.getElementById('search-areas')?.focus();
        }} />

        <div className="px-4 py-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="search-areas"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar matéria..."
                className="w-full h-10 pl-9 pr-4 rounded-xl bg-secondary/50 border border-border/50 text-sm focus:outline-none focus:border-[#38bdf8]/50 transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-[calc(2rem+var(--sai-bottom))]">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-white/50">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando matérias...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-white/50 text-sm space-y-3">
              <p>Nenhuma matéria encontrada para "{q}".</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md divide-y divide-white/10 overflow-hidden shadow-xl mt-1">
              {filtered.map((r, i) => {
                const s = styleForArea(r.area);
                const Icon = s.icon;
                const displayArea = r.area.replace(/^DIREITO\s+/i, "");
                
                return (
                  <button
                    key={r.area}
                    onClick={() => {
                      haptic.selection();
                      navigate(`/resumos-juridicos/${encodeURIComponent(r.area)}`);
                    }}
                    className="w-full flex items-center gap-4 px-4 py-4 min-h-[76px] text-left hover:bg-white/5 active:bg-white/10 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <Icon className="w-[26px] h-[26px]" style={{ color: s.color }} strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-body text-[16px] font-semibold text-white truncate">
                        {displayArea}
                      </div>
                      <div className="font-body text-[12.5px] text-zinc-400 truncate mt-0.5">
                        {r.total} {r.total === 1 ? "resumo" : "resumos"} disponíveis
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-500 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
