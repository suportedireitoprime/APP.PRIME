import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, ChevronRight, Mic, Layers, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Input } from "@/components/ui/input";
import { haptic } from "@/lib/nativeHaptics";
import { resumosLocal } from "@/lib/resumosLocal";
import ResumosBreadcrumbTimeline, { getMetodoLabel } from "@/components/resumos/ResumosBreadcrumbTimeline";
import { toast } from "@/hooks/use-toast";
import { PrimeImage } from '@/components/ui/PrimeImage';
import { getAreaCover } from "@/lib/areasDireitoCovers";
import { getDisciplinaVisualTheme } from "@/lib/disciplinasTheme";
import { cn } from "@/lib/utils";
import { getAreaThemePalette } from "@/lib/areasDireitoIcons";
import { recordAreaActivity } from "@/lib/continuity";

type Row = { tema: string; ordem_tema: number | null; total: number };
type Ordem = "crono" | "alpha" | "fav";

// ---- Cache em memória entre navegações ----
const temasCache = new Map<string, Row[]>();

export default function ResumosJuridicosTemas() {
  const { area } = useParams<{ area: string }>();
  const decodedArea = decodeURIComponent(area || "");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const metodo = searchParams.get("metodo") || "";
  const metodoQuery = metodo ? `?metodo=${encodeURIComponent(metodo)}` : "";
  
  const areaCover = useMemo(() => {
    const visualTheme = getDisciplinaVisualTheme(decodedArea);
    const coverObj = getAreaCover(decodedArea);
    return visualTheme?.fundoAssetUrl || coverObj?.cover || "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas_fixas/cp_artigos_v2.webp";
  }, [decodedArea]);

  const palette = useMemo(() => getAreaThemePalette(decodedArea), [decodedArea]);

  // Registra acesso por área para continuidade (BottomNav → Resumos)
  useEffect(() => {
    if (!decodedArea) return;
    recordAreaActivity({
      path: `/resumos-juridicos/${encodeURIComponent(decodedArea)}`,
      label: `Resumos — ${decodedArea}`,
      sublabel: 'Sínteses e anotações jurídicas',
      kind: 'resumos',
    });
  }, [decodedArea]);

  const [rows, setRows] = useState<Row[]>(() => {
    if (temasCache.has(decodedArea)) return temasCache.get(decodedArea)!;
    try {
      const stored = localStorage.getItem(`resumos_temas_cache:${decodedArea}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          temasCache.set(decodedArea, parsed);
          return parsed;
        }
      }
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState(() => !temasCache.has(decodedArea));
  const [q, setQ] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("crono");
  const [recentes, setRecentes] = useState(() => resumosLocal.recentes());
  const [favoritosGlobais, setFavoritosGlobais] = useState(() => resumosLocal.favoritos());

  useEffect(() => {
    const onEvt = () => {
      setRecentes(resumosLocal.recentes());
      setFavoritosGlobais(resumosLocal.favoritos());
    };
    window.addEventListener("resumos-local-change", onEvt);
    return () => window.removeEventListener("resumos-local-change", onEvt);
  }, []);

  // 1. Carregar Temas Instantaneamente
  useEffect(() => {
    let cancelled = false;
    const cacheKey = `resumos_temas_cache_v7:${decodedArea}`;

    try {
      localStorage.removeItem(`resumos_temas_cache:${decodedArea}`);
    } catch {}

    if (!temasCache.has(decodedArea)) {
      try {
        const stored = localStorage.getItem(cacheKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            temasCache.set(decodedArea, parsed);
            setRows(parsed);
            setLoading(false);
          }
        }
      } catch {}
    } else {
      setRows(temasCache.get(decodedArea)!);
      setLoading(false);
    }

    (async () => {
      // 1. Tentar catálogo offline imediatamente (0ms)
      try {
        const { getResumosCatalog, matchAreaInCatalog, getOrFetchMateriaContent } = await import("@/services/resumosCatalog");
        // Pré-carrega a matéria completa (com markdowns) em segundo plano
        void getOrFetchMateriaContent(decodedArea);

        const catalog = await getResumosCatalog();
        const areaObj = matchAreaInCatalog(catalog, decodedArea);
        if (areaObj && areaObj.temas && areaObj.temas.length > 0) {
          const list: Row[] = areaObj.temas.map((t, idx) => ({
            tema: t.tema,
            ordem_tema: idx + 1,
            total: t.total || (t.subtemas?.length || 1),
          }));
          if (!cancelled) {
            temasCache.set(decodedArea, list);
            setRows(list);
            setLoading(false);
            try {
              localStorage.setItem(cacheKey, JSON.stringify(list));
            } catch {}
            return;
          }
        }
      } catch {}

      // 2. Se não encontrar no catálogo offline, consultar RPC ou Supabase
      let list: Row[] = [];
      try {
        const { data: rpcData, error: rpcErr } = await (supabase as any).rpc("get_resumos_temas_counts", {
          p_area: decodedArea,
        });
        if (!rpcErr && Array.isArray(rpcData) && rpcData.length > 0) {
          list = rpcData.map((r: any) => ({
            tema: r.tema,
            ordem_tema: r.ordem_tema != null ? Number(r.ordem_tema) : null,
            total: Number(r.total) || 0,
          }));
        }
      } catch {}

      if (list.length === 0) {
        try {
          const { data } = await (supabase as any)
            .from("resumos_juridicos")
            .select("tema, ordem_tema")
            .eq("area", decodedArea)
            .limit(2000);
          if (data && data.length > 0) {
            const map = new Map<string, { ordem: number | null; total: number }>();
            for (const r of data as { tema: string; ordem_tema: number | null }[]) {
              const prev = map.get(r.tema);
              map.set(r.tema, {
                ordem: prev?.ordem ?? r.ordem_tema,
                total: (prev?.total || 0) + 1,
              });
            }
            list = Array.from(map.entries())
              .map(([tema, v]) => ({ tema, ordem_tema: v.ordem, total: v.total }))
              .sort((a, b) => {
                if (a.ordem_tema != null && b.ordem_tema != null) return a.ordem_tema - b.ordem_tema;
                if (a.ordem_tema != null) return -1;
                if (b.ordem_tema != null) return 1;
                return a.tema.localeCompare(b.tema);
              });
          }
        } catch {}
      }

      if (cancelled) return;
      if (list.length > 0) {
        temasCache.set(decodedArea, list);
        setRows(list);
        try {
          localStorage.setItem(cacheKey, JSON.stringify(list));
        } catch {}
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [decodedArea]);

  const filteredTemas = useMemo(() => {
    let result = rows;
    if (q.trim()) {
      const t = q.toLowerCase();
      result = result.filter(r => r.tema.toLowerCase().includes(t));
    }
    
    if (ordem === "alpha") {
      result = [...result].sort((a, b) => a.tema.localeCompare(b.tema));
    } else if (ordem === "fav") {
      result = result.filter(r => favoritosGlobais.some(f => f.tema === r.tema && f.area === decodedArea));
    }
    return result;
  }, [rows, q, ordem, favoritosGlobais, decodedArea]);

  return (
    <div className="min-h-dvh bg-[#09090B] text-white pb-20 relative overflow-x-hidden flex flex-col">
      <div className="relative z-10">
        <div className="sticky top-0 z-10 bg-[#09090B]/95 backdrop-blur-md border-b border-white/10 shadow-sm pb-3">
          <PageHeader
            title={decodedArea.replace(/^DIREITO\s+(DO\s+|DA\s+|DE\s+)?/i, '')}
            subtitle={rows.length > 0 ? `Área • ${rows.reduce((acc, row) => acc + row.total, 0)} tópicos` : "Área"}
            onBack={() => navigate(`/resumos-juridicos${metodoQuery}`)}
            className="border-b-0 pb-1"
          />
          
          <div className="max-w-5xl mx-auto px-4 mt-2 space-y-3">
          <ResumosBreadcrumbTimeline
            accentColor={palette.primary}
            steps={[
              { label: getMetodoLabel(metodo), to: `/resumos-juridicos${metodoQuery}` },
              { label: decodedArea.replace(/^DIREITO\s+(DO\s+|DA\s+|DE\s+)?/i, '') },
              { label: "Temas" },
            ]}
          />
          <div className="relative flex items-center group">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" style={{ color: palette.primary }} />
            <Input 
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
              placeholder="Pesquisar"
              style={{
                backgroundColor: `${palette.primary}14`,
                borderColor: `${palette.primary}55`,
              }}
              className="pl-12 pr-12 h-14 rounded-2xl backdrop-blur-md text-[15px] font-medium text-white placeholder:text-zinc-400 shadow-sm transition-all focus:border-primary/80" 
            />
            <button
              onClick={() => { haptic.selection(); toast({ title: 'Em breve: Pesquisa por Voz' }); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 active:opacity-70 transition-all text-white/70 hover:text-white"
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>

          <div className="flex w-full relative px-1 sm:px-2 h-11 sm:h-12 mt-3 items-end">
            {([
              { id: "crono", label: "Cronológica" },
              { id: "alpha", label: "Alfabética" },
              { id: "fav", label: "Favoritos" },
            ] as const).map((o, index) => {
              const ativo = ordem === o.id;
              // Efeito 3D de pastas: aba ativa vem para frente, inativas respeitam a ordem visual
              const zIndex = ativo ? 30 : 20 - index;
              return (
                <button
                  key={o.id}
                  onClick={() => {
                    haptic.selection();
                    setOrdem(o.id);
                  }}
                  className={cn(
                    "relative flex-1 h-full flex justify-center items-center rounded-t-2xl border-x border-t font-bold text-[9px] sm:text-[10px] uppercase tracking-wider cursor-pointer select-none transition-colors duration-200",
                    ativo 
                      ? "bg-[#1A1A1A] text-white shadow-[0_-8px_20px_rgba(0,0,0,0.5)] border-white/10" 
                      : "bg-[#0A0A0A] text-muted-foreground hover:bg-[#121212] shadow-[inset_0_-4px_10px_rgba(0,0,0,0.8)] hover:text-white border-white/5 opacity-80"
                  )}
                  style={{
                    zIndex,
                    marginLeft: index > 0 ? "-12px" : "0",
                  }}
                >
                  <div className="absolute inset-0 rounded-t-2xl overflow-hidden pointer-events-none">
                    {ativo && <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/10 opacity-50" />}
                  </div>
                  <span className={cn("relative z-10 transition-transform duration-200", ativo ? "scale-105 font-black" : "scale-100")} style={{ color: ativo ? palette.primary : undefined }}>{o.label}</span>
                  {ativo && (
                    <motion.div 
                      layoutId="activeFolderTabTemas"
                      className="absolute inset-0 rounded-t-2xl border-x border-t pointer-events-none"
                      style={{
                        borderColor: `${palette.primary}99`,
                        boxShadow: `inset 0 2px 10px ${palette.primary}33`
                      }}
                      initial={false}
                      transition={{ type: "spring", stiffness: 480, damping: 36, mass: 0.8 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
          <div className="w-full h-px bg-[#1A1A1A] relative z-20" style={{ boxShadow: `0 -1px 0 ${palette.primary}4D` }} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-0 pt-4">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando matérias...
          </div>
        ) : filteredTemas.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground flex flex-col items-center">
            <p className="font-semibold text-lg mb-4">Nenhuma matéria encontrada</p>
            {q && (
              <button 
                onClick={() => { haptic.selection(); setQ(""); }}
                className="px-6 py-2.5 rounded-xl text-white font-bold text-sm active:opacity-70 transition-all shadow-md"
                style={{ backgroundColor: palette.primary, boxShadow: `0 4px 14px ${palette.primary}4D` }}
              >
                Limpar Pesquisa
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5 py-4 max-w-4xl mx-auto">
            {filteredTemas.map((r, i) => {
              const lidosCount = recentes.filter(x => x.area === decodedArea && x.tema === r.tema).length;
              const pct = r.total > 0 ? Math.min(100, Math.round((lidosCount / r.total) * 100)) : 0;
              const ordemStr = String(i + 1).padStart(2, '0');

              return (
                <button
                  key={r.tema}
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    navigate(`/resumos-juridicos/${encodeURIComponent(decodedArea)}/${encodeURIComponent(r.tema)}${metodoQuery}`);
                  }}
                  className="w-full group flex items-center gap-3.5 p-4 rounded-2xl bg-zinc-900/75 border border-white/10 hover:border-white/25 hover:bg-zinc-900 transition-all text-left cursor-pointer active:scale-[0.98]"
                >
                  <div
                    className="w-9 h-9 rounded-xl border flex items-center justify-center font-mono font-bold text-xs shrink-0"
                    style={{
                      backgroundColor: `${palette.primary}1A`,
                      borderColor: `${palette.primary}40`,
                      color: palette.primary,
                    }}
                  >
                    {ordemStr}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-[15px] font-bold text-white leading-snug group-hover:text-zinc-100 transition-colors">
                      {r.tema}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {r.total} {r.total === 1 ? 'tópico' : 'tópicos'}
                      {pct > 0 ? ` • ${pct}% lido` : ''}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white shrink-0 transition-transform group-hover:translate-x-0.5" />
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

