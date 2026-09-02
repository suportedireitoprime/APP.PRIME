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
  LayoutGrid,
  List,
} from "lucide-react";
import ShapeGrid from "@/components/ui/ShapeGrid";
import ResumosHero from "@/components/resumos/ResumosHero";
import { LazyCircularGallery } from "@/components/ui/LazyCircularGallery";
import { haptic } from "@/lib/nativeHaptics";
import { AnimatedDivider } from "@/components/ui/AnimatedDivider";

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
  const [viewMode, setViewMode] = useState<"lista" | "cards">("cards");

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
            <button
              onClick={() => {
                haptic.selection();
                setViewMode(viewMode === "lista" ? "cards" : "lista");
              }}
              className="h-10 px-4 rounded-xl bg-secondary/50 border border-border/50 flex items-center justify-center gap-2 text-sm font-medium hover:bg-secondary/70 transition-colors shrink-0"
            >
              {viewMode === "lista" ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
              <span className="hidden sm:inline">{viewMode === "lista" ? "Cards" : "Lista"}</span>
            </button>
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
          ) : viewMode === "lista" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map((r, i) => {
                const s = styleForArea(r.area);
                const Icon = s.icon;
                return (
                  <motion.button
                    key={r.area}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    onClick={() => navigate(`/resumos-juridicos/${encodeURIComponent(r.area)}`)}
                    className="flex items-center gap-4 p-5 sm:p-6 rounded-3xl bg-secondary/30 border border-white/5 hover:bg-secondary/50 hover:border-[#38bdf8]/40 transition-all text-left group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[#38bdf8]/5 border border-[#38bdf8]/10 flex items-center justify-center group-hover:bg-[#38bdf8]/15 transition-colors">
                      <Icon className="w-7 h-7 shrink-0" style={{ color: s.color }} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-bold text-[15px] uppercase text-white truncate">
                        {r.area.replace(/^DIREITO\s+/i, "")}
                      </div>
                      <div className="text-[12px] text-white/50 mt-1">
                        {r.total} {r.total === 1 ? "resumo" : "resumos"}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-[#38bdf8] transition-colors shrink-0" />
                  </motion.button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col pb-16">
              {filtered.map((r, i) => {
                const displayArea = r.area.replace(/^DIREITO\s+/i, "");
                
                return (
                  <div key={r.area} className="space-y-2 mb-8">
                    {i > 0 && <AnimatedDivider text={displayArea} />}
                    
                    <div className="flex items-start justify-between px-1 mb-4 gap-4">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-[22px] font-black text-white uppercase tracking-widest mb-1">
                          {displayArea}
                        </h2>
                        <p className="text-[13px] text-zinc-400 truncate">
                          Matérias de {displayArea}
                        </p>
                      </div>

                      <button
                        onClick={() => { 
                          haptic.selection(); 
                          navigate(`/resumos-juridicos/${encodeURIComponent(r.area)}`); 
                        }}
                        className="shrink-0 flex items-center justify-center h-[38px] px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold whitespace-nowrap transition-all active:scale-[0.98]"
                      >
                        Ver em lista
                      </button>
                    </div>

                    <div className="h-[360px] -mx-4 sm:mx-0">
                      <LazyCircularGallery
                        items={(r.temas || []).map((tema, idx) => ({
                          image: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas_fixas/cp_artigos_v2.jpg',
                          text: tema,
                          fullName: r.area,
                          position: 'inside-bottom',
                          showPlayButton: false,
                          badgeText: String(idx + 1),
                          raw: { area: r.area, tema }
                        }))}
                        bend={1.5}
                        textColor="#ffffff"
                        borderRadius={0.05}
                        scrollEase={0.08}
                        onItemClick={(item) => {
                          haptic.selection();
                          navigate(`/resumos-juridicos/${encodeURIComponent(item.raw.area)}/${encodeURIComponent(item.raw.tema)}`);
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
