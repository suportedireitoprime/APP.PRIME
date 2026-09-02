import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/vademecum/PageHeader";
import { Input } from "@/components/ui/input";
import { haptic } from "@/lib/nativeHaptics";

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
    <div className="min-h-dvh bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 border-b border-border shadow-sm pb-3">
        <PageHeader
          title={decodedArea.replace(/^DIREITO\s+(DO\s+|DA\s+|DE\s+)?/i, '')}
          subtitle="Área"
          onBack={() => navigate("/resumos-juridicos")}
          className="border-b-0 pb-1"
        />
        
        <div className="max-w-5xl mx-auto px-4 mt-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
              placeholder={`Pesquisar matéria de ${decodedArea.replace(/^DIREITO\s+(DO\s+|DA\s+|DE\s+)?/i, '')}...`}
              className="pl-9 bg-secondary/50 border-transparent focus:border-primary/50" 
            />
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
          <div className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md divide-y divide-white/10 overflow-hidden shadow-xl">
            {filteredTemas.map((r) => {
              return (
                <button
                  key={r.tema}
                  onClick={() => {
                    haptic.selection();
                    navigate(`/resumos-juridicos/${encodeURIComponent(decodedArea)}/${encodeURIComponent(r.tema)}`);
                  }}
                  className="w-full flex items-center gap-4 px-4 py-4 min-h-[96px] text-left hover:bg-white/5 active:bg-white/10 transition-colors"
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
                    <div className="font-body text-[13px] text-zinc-400 truncate mt-1.5">
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
  );
}
