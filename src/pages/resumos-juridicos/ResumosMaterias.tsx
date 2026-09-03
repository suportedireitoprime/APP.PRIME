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
import { PageHeader } from "@/components/vademecum/PageHeader";
import CircularGallery from "@/components/ui/CircularGallery";
import { haptic } from "@/lib/nativeHaptics";

type AreaRow = { area: string; total: number };

// ?cone e cor (hex) por ǭrea
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

let areasCache: AreaRow[] | null = null;

export default function ResumosMaterias() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<AreaRow[]>(() => areasCache || []);
  const [loading, setLoading] = useState(!areasCache);
  const [q, setQ] = useState("");
  const [viewMode, setViewMode] = useState<"lista" | "cards">("cards");

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    if (!areasCache) {
      try {
        const stored = localStorage.getItem("resumos_areas_cache");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            areasCache = parsed;
            setRows(parsed);
            setLoading(false);
          }
        }
      } catch {}
    } else {
      setRows(areasCache);
      setLoading(false);
    }

    (async () => {
      if (!areasCache) setLoading(true);
      let list: AreaRow[] = [];

      try {
        const { data: rpcData, error: rpcErr } = await (supabase as any).rpc("get_resumos_areas_counts");
        if (!rpcErr && Array.isArray(rpcData) && rpcData.length > 0) {
          list = rpcData.map((r: any) => ({ area: r.area, total: Number(r.total) || 0 }));
        }
      } catch {}

      if (list.length === 0) {
        const map = new Map<string, number>();
        let from = 0;
        const step = 1000;
        let gotAny = false;
        while (true) {
          const { data, error } = await (supabase as any)
            .from("resumos_juridicos")
            .select("area")
            .not("area", "is", null)
            .range(from, from + step - 1);
          if (error) break;
          if (!data || data.length === 0) break;
          gotAny = true;
          for (const r of data as { area: string }[]) {
            map.set(r.area, (map.get(r.area) || 0) + 1);
          }
          if (data.length < step) break;
          from += step;
        }

        if (!gotAny) {
          const { bundle } = await import("@/services/offlineBundle");
          const rows = await bundle.resumos<{ area: string }>();
          for (const r of rows) {
            if (!r.area) continue;
            map.set(r.area, (map.get(r.area) || 0) + 1);
          }
        }

        list = Array.from(map.entries())
          .map(([area, total]) => ({ area, total }))
          .sort((a, b) => a.area.localeCompare(b.area));
      }

      if (list.length > 0) {
        areasCache = list;
        setRows(list);
        try {
          localStorage.setItem("resumos_areas_cache", JSON.stringify(list));
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
        <PageHeader title="Matérias" onBack={() => navigate(-1)} rightAction={<div className="w-8" />} />

        <div className="px-4 py-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
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
            /* MODO CARROSSEL */
            <div className="flex flex-col gap-6">
              <div style={{ height: '350px', position: 'relative' }} className="-mx-4 sm:mx-0">
                <CircularGallery
                  items={filtered.map(r => ({
                    image: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas_fixas/cp_artigos_v2.jpg', // Placeholder for now
                    text: r.area.replace(/^DIREITO\s+/i, ""),
                    fullName: `${r.total} resumo${r.total === 1 ? '' : 's'}`,
                    raw: r // store raw row to navigate correctly
                  }))}
                  bend={1.5}
                  textColor="#ffffff"
                  borderRadius={0.05}
                  scrollEase={0.08}
                  onItemClick={(item) => {
                    haptic.selection();
                    navigate(`/resumos-juridicos/${encodeURIComponent(item.raw.area)}`);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
