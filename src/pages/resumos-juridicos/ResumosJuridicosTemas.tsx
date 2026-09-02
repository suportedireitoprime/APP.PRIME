import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, ChevronRight, Mic } from "lucide-react";
import { PageHeader } from "@/components/vademecum/PageHeader";
import { Input } from "@/components/ui/input";
import { haptic } from "@/lib/nativeHaptics";
import { resumosLocal } from "@/lib/resumosLocal";
import ShapeGrid from "@/components/ui/ShapeGrid";
import { toast } from "@/hooks/use-toast";

type Row = { tema: string; ordem_tema: number | null; total: number };

// ---- Cache em memória entre navegações ----
const temasCache = new Map<string, Row[]>();

export default function ResumosJuridicosTemas() {
  const { area } = useParams<{ area: string }>();
  const decodedArea = decodeURIComponent(area || "");
  const navigate = useNavigate();
  
  const [rows, setRows] = useState<Row[]>(() => temasCache.get(decodedArea) || []);
  const [loading, setLoading] = useState(!temasCache.has(decodedArea));
  const [q, setQ] = useState("");
  const [recentes, setRecentes] = useState(() => resumosLocal.recentes());

  useEffect(() => {
    const onEvt = () => setRecentes(resumosLocal.recentes());
    window.addEventListener("resumos-local-change", onEvt);
    return () => window.removeEventListener("resumos-local-change", onEvt);
  }, []);

  // 1. Carregar Temas
  useEffect(() => {
    let cancelled = false;
    const cacheKey = `resumos_temas_cache:${decodedArea}`;

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
      if (!temasCache.has(decodedArea)) setLoading(true);
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
          const rows = await bundle.resumos<{ area: string; tema: string; ordem_tema: number | null }>();
          for (const r of rows) {
            if (r.area !== decodedArea) continue;
            const prev = map.get(r.tema);
            map.set(r.tema, {
              ordem: prev?.ordem ?? r.ordem_tema,
              total: (prev?.total || 0) + 1,
            });
          }
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
    if (!q) return rows;
    const t = q.toLowerCase();
    return rows.filter(r => r.tema.toLowerCase().includes(t));
  }, [rows, q]);

  return (
    <div className="min-h-dvh bg-[#0D0D0D] text-white pb-20 relative overflow-x-hidden flex flex-col">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.15]">
        <ShapeGrid />
      </div>

      <div className="relative z-10">
        <div className="sticky top-0 z-10 bg-[#0D0D0D]/90 backdrop-blur-md border-b border-white/10 shadow-sm pb-3">
          <PageHeader
            title={decodedArea.replace(/^DIREITO\s+(DO\s+|DA\s+|DE\s+)?/i, '')}
            subtitle="Área"
            onBack={() => navigate("/resumos-juridicos")}
            className="border-b-0 pb-1"
          />
          
          <div className="max-w-5xl mx-auto px-4 mt-2">
          <div className="relative flex items-center group">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-primary transition-colors" />
            <Input 
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
              placeholder={`Pesquisar matéria de ${decodedArea.replace(/^DIREITO\s+(DO\s+|DA\s+|DE\s+)?/i, '')}...`}
              className="pl-12 pr-12 h-14 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 focus:border-primary/50 text-[15px] font-medium text-white placeholder:text-white/40 shadow-sm transition-all" 
            />
            <button
              onClick={() => { haptic.selection(); toast({ title: 'Em breve: Pesquisa por Voz' }); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 active:scale-95 transition-all text-white/70 hover:text-white"
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-4">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando matérias...
          </div>
        ) : filteredTemas.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <p className="font-semibold text-lg">Nenhuma matéria encontrada</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTemas.map((r) => {
              return (
                <button
                  key={r.tema}
                  onClick={() => {
                    haptic.selection();
                    navigate(`/resumos-juridicos/${encodeURIComponent(decodedArea)}/${encodeURIComponent(r.tema)}`);
                  }}
                  className="w-full flex items-center gap-4 px-4 py-4 min-h-[96px] text-left hover:bg-secondary/20 active:scale-[0.98] transition-all rounded-2xl bg-card border border-border hover:border-[#ef4444]/40 shadow-sm group overflow-hidden relative"
                >
                  <div className="w-16 h-[88px] rounded-lg bg-white/5 border border-white/10 shrink-0 overflow-hidden shadow-md">
                    <img 
                      src="https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas_fixas/cp_artigos_v2.jpg" 
                      alt="Capa" 
                      className="w-full h-full object-cover" 
                      loading="lazy" 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-body text-[16px] font-bold text-white leading-snug line-clamp-2">
                      {r.tema}
                    </div>
                    {(() => {
                      const lidosCount = recentes.filter(x => x.area === decodedArea && x.tema === r.tema).length;
                      const pct = r.total > 0 ? Math.min(100, Math.round((lidosCount / r.total) * 100)) : 0;
                      return (
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="font-body text-[13px] text-zinc-400 truncate">
                            {r.total} resumos
                          </div>
                          {r.total > 0 && (
                            <>
                              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-rose-500 to-red-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                              </div>
                              {pct > 0 && (
                                <div className="text-[11px] font-bold text-rose-500 tabular-nums">{pct}%</div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
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
