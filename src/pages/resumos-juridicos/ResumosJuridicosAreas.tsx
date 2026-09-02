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

  const [activeTab, setActiveTab] = useState("Todos");

  const filteredAreas = useMemo(() => {
    if (!q) return rows;
    const t = normalize(q.trim());
    return rows.filter((r) => normalize(r.area).includes(t));
  }, [rows, q]);

  const activeAreaRow = useMemo(() => {
    if (activeTab === "Todos") return null;
    return rows.find((r) => r.area === activeTab) || null;
  }, [rows, activeTab]);

  const filteredTemas = useMemo(() => {
    if (!activeAreaRow) return [];
    if (!q) return activeAreaRow.temas;
    const t = normalize(q.trim());
    return activeAreaRow.temas.filter((tema) => normalize(tema).includes(t));
  }, [activeAreaRow, q]);

  return (
    <div className="min-h-dvh bg-[#0D0D0D] text-white overflow-x-hidden relative flex flex-col">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.15]">
        <ShapeGrid />
      </div>

      <div className="relative z-10 flex flex-col min-h-dvh">
        <ResumosHero q={q} setQ={setQ} />

        <div className="px-4 pb-4 overflow-x-auto no-scrollbar flex items-center gap-2 -mt-2">
          <button
            onClick={() => { haptic.selection(); setActiveTab("Todos"); }}
            className={`px-5 h-9 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors shadow-sm ${
              activeTab === "Todos"
                ? "bg-[#ef4444] text-white"
                : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
            }`}
          >
            Todos
          </button>
          {rows.map((r) => {
            const displayArea = r.area.replace(/^DIREITO\s+(DO\s+|DA\s+|DE\s+)?/i, "");
            const isActive = activeTab === r.area;
            return (
              <button
                key={r.area}
                onClick={() => { haptic.selection(); setActiveTab(r.area); }}
                className={`px-4 h-9 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors shadow-sm ${
                  isActive
                    ? "bg-[#ef4444] text-white"
                    : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                }`}
              >
                {displayArea}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-[calc(2rem+var(--sai-bottom))]">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-white/50">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando...
            </div>
          ) : activeTab === "Todos" ? (
            filteredAreas.length === 0 ? (
              <div className="text-center py-16 text-white/50 text-sm space-y-3">
                <p>Nenhuma matéria encontrada para "{q}".</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md divide-y divide-white/10 overflow-hidden shadow-xl mt-1">
                {filteredAreas.map((r, i) => {
                  const displayArea = r.area.replace(/^DIREITO\s+(DO\s+|DA\s+|DE\s+)?/i, "");
                  
                  return (
                    <button
                      key={r.area}
                      onClick={() => {
                        haptic.selection();
                        navigate(`/resumos-juridicos/${encodeURIComponent(r.area)}`);
                      }}
                      className="w-full flex items-center gap-4 px-4 py-3 min-h-[76px] text-left hover:bg-white/5 active:bg-white/10 transition-colors"
                    >
                      <div className="w-[42px] h-[58px] rounded-lg bg-white/5 border border-white/10 shrink-0 overflow-hidden shadow-md">
                        <img 
                          src="https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas_fixas/cp_artigos_v2.jpg" 
                          alt="Capa" 
                          className="w-full h-full object-cover" 
                          loading="lazy" 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-body text-[16px] font-bold text-white truncate">
                          {displayArea}
                        </div>
                        <div className="font-body text-[13px] text-zinc-400 truncate mt-0.5">
                          {r.total} {r.total === 1 ? "resumo" : "resumos"} disponíveis
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-zinc-500 shrink-0" />
                    </button>
                  );
                })}
              </div>
            )
          ) : (
            filteredTemas.length === 0 ? (
              <div className="text-center py-16 text-white/50 text-sm space-y-3">
                <p>Nenhum resumo encontrado para "{q}".</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md divide-y divide-white/10 overflow-hidden shadow-xl mt-1">
                {filteredTemas.map((tema) => {
                  return (
                    <button
                      key={tema}
                      onClick={() => {
                        haptic.selection();
                        navigate(`/resumos-juridicos/${encodeURIComponent(activeTab)}/${encodeURIComponent(tema)}`);
                      }}
                      className="w-full flex items-center gap-4 px-4 py-3 min-h-[76px] text-left hover:bg-white/5 active:bg-white/10 transition-colors"
                    >
                      <div className="w-[42px] h-[58px] rounded-lg bg-white/5 border border-white/10 shrink-0 overflow-hidden shadow-md">
                        <img 
                          src="https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas_fixas/cp_artigos_v2.jpg" 
                          alt="Capa" 
                          className="w-full h-full object-cover" 
                          loading="lazy" 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-body text-[15px] font-bold text-white line-clamp-2 leading-snug">
                          {tema}
                        </div>
                        <div className="font-body text-[12px] text-[#ef4444] font-bold mt-1">
                          LER RESUMO
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-zinc-500 shrink-0" />
                    </button>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
