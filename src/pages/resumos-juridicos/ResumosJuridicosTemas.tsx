import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Search,
  ChevronRight,
  Heart,
  FileText
} from "lucide-react";
import { PageHeader } from "@/components/vademecum/PageHeader";
import { Input } from "@/components/ui/input";
import ResumoJuridicoReaderSheet, { ResumoRow } from "@/components/resumos-juridicos/ResumoJuridicoReaderSheet";
import { resumosLocal } from "@/lib/resumosLocal";

type Row = { tema: string; ordem_tema: number | null; total: number };

// ---- Cache em memória entre navegações ----
const temasCache = new Map<string, Row[]>();
const subtemasCache = new Map<string, ResumoRow[]>();

/** Vermelho oficial do app */
const RED = "hsl(348 78% 45%)";

type Ordem = "crono" | "alpha" | "fav";

export default function ResumosJuridicosTemas() {
  const { area } = useParams<{ area: string }>();
  const decodedArea = decodeURIComponent(area || "");
  const navigate = useNavigate();
  
  const [rows, setRows] = useState<Row[]>(() => temasCache.get(decodedArea) || []);
  const [loading, setLoading] = useState(!temasCache.has(decodedArea));
  const [q, setQ] = useState("");

  const [activeTema, setActiveTema] = useState<string | null>(null);
  const [subtemas, setSubtemas] = useState<ResumoRow[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const [selected, setSelected] = useState<ResumoRow | null>(null);
  const [ordem, setOrdem] = useState<Ordem>("crono");
  const [favs, setFavs] = useState<string[]>(() => resumosLocal.favoritos().map((f) => f.id));

  const chipsRef = useRef<HTMLDivElement>(null);

  const refreshFavs = () => setFavs(resumosLocal.favoritos().map((f) => f.id));

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
            if (!activeTema) setActiveTema(parsed[0]?.tema || null);
            setLoading(false);
          }
        }
      } catch {}
    } else {
      const cached = temasCache.get(decodedArea)!;
      setRows(cached);
      if (!activeTema) setActiveTema(cached[0]?.tema || null);
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
        if (!activeTema) setActiveTema(list[0]?.tema || null);
        try {
          localStorage.setItem(cacheKey, JSON.stringify(list));
        } catch {}
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [decodedArea]);

  // 2. Carregar Subtemas quando o Tema Ativo muda
  useEffect(() => {
    if (!activeTema) return;
    let cancelled = false;

    const loadSubtemas = async () => {
      setQ(""); // reseta a busca ao trocar de tema
      setOrdem("crono"); // reseta a ordenação
      const key = `${decodedArea}::${activeTema}`;
      if (subtemasCache.has(key)) {
        setSubtemas(subtemasCache.get(key)!);
        setSubLoading(false);
        return;
      }
      setSubLoading(true);
      setSubtemas([]);
      const { data } = await (supabase as any)
        .from("resumos_juridicos")
        .select("id, area, tema, subtema, ordem_subtema, markdown, exemplos, termos")
        .eq("area", decodedArea)
        .eq("tema", activeTema)
        .order("ordem_subtema", { ascending: true, nullsFirst: false })
        .order("subtema", { ascending: true })
        .limit(5000);
      let list = (data || []) as ResumoRow[];
      if (list.length === 0) {
        const { bundle } = await import("@/services/offlineBundle");
        const all = await bundle.resumos<ResumoRow>();
        list = all
          .filter((r) => r.area === decodedArea && r.tema === activeTema)
          .sort((a, b) => (a.ordem_subtema ?? 9999) - (b.ordem_subtema ?? 9999));
      }
      if (cancelled) return;
      subtemasCache.set(key, list);
      setSubtemas(list);
      setSubLoading(false);
    };

    loadSubtemas();
    return () => { cancelled = true; };
  }, [decodedArea, activeTema]);

  // 3. Filtrar Subtemas (por busca, ordem e favoritos)
  const subtemasOrdenados = useMemo(() => {
    let result = subtemas;
    
    // Busca por termo
    if (q.trim()) {
      const qLower = q.toLowerCase();
      result = result.filter(s => 
        (s.subtema || s.tema).toLowerCase().includes(qLower)
      );
    }

    // Ordenação e Favoritos
    if (ordem === "alpha") {
      result = [...result].sort((a, b) => (a.subtema || "").localeCompare(b.subtema || ""));
    } else if (ordem === "fav") {
      result = result.filter((s) => favs.includes(s.id));
    }
    
    return result;
  }, [subtemas, ordem, favs, q]);

  // Rolar suavemente para o chip clicado
  const handleChipClick = (tema: string, index: number) => {
    setActiveTema(tema);
    if (chipsRef.current) {
      const chipElement = chipsRef.current.children[index] as HTMLElement;
      if (chipElement) {
        const containerWidth = chipsRef.current.offsetWidth;
        const scrollPos = chipElement.offsetLeft - containerWidth / 2 + chipElement.offsetWidth / 2;
        chipsRef.current.scrollTo({ left: scrollPos, behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="min-h-dvh bg-background pb-24">
      {/* HEADER FIXO E CHIPS (Glassmorphism) */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border shadow-sm">
        <PageHeader
          title={decodedArea.replace(/^DIREITO\s+/i, '')}
          subtitle="Área"
          onBack={() => navigate("/resumos-juridicos")}
          className="border-b-0"
        />

        {/* Busca */}
        <div className="max-w-5xl lg:max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 pb-3 mt-1">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
              placeholder={activeTema ? `Pesquisar em ${activeTema}...` : "Pesquisar resumo..."} 
              className="pl-9 bg-secondary/50 border-transparent focus:border-primary/50" 
            />
          </div>
        </div>

        {/* Chips de Tema */}
        <div 
          ref={chipsRef}
          className="flex overflow-x-auto gap-2 px-4 pb-3 no-scrollbar max-w-5xl lg:max-w-7xl 2xl:max-w-[1600px] mx-auto scroll-smooth items-center"
        >
          {loading && rows.length === 0 ? (
            <div className="flex gap-2 w-full">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-9 w-24 bg-muted animate-pulse rounded-full shrink-0" />
              ))}
            </div>
          ) : (
            rows.map((r, i) => {
              const isActive = activeTema === r.tema;
              return (
                <button
                  key={r.tema}
                  onClick={() => handleChipClick(r.tema, i)}
                  className={`
                    flex items-center justify-center px-4 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all select-none border shrink-0
                    ${isActive 
                      ? 'bg-[hsl(348,78%,45%)] text-white border-[hsl(348,78%,45%)] shadow-md shadow-red-900/20 scale-105 mx-1' 
                      : 'bg-secondary/60 text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground active:scale-95'}
                  `}
                >
                  {r.tema}
                  {!isActive && <span className="ml-1.5 opacity-60 text-[10px] font-bold">({r.total})</span>}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL (Subtemas) */}
      <div className="max-w-5xl lg:max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 pt-4">
        
        {/* Controles de Ordenação */}
        {activeTema && !loading && subtemas.length > 0 && (
          <div className="flex w-full bg-secondary/40 rounded-xl p-1 gap-1 mb-4 md:w-[320px]">
            {([
              { id: "crono", label: "Cronológica" },
              { id: "alpha", label: "Alfabética" },
              { id: "fav", label: "Favoritos" },
            ] as { id: Ordem; label: string }[]).map((o) => {
              const ativo = ordem === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => setOrdem(o.id)}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] uppercase tracking-wider font-bold transition-all ${
                    ativo ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Lista de Cards */}
        {subLoading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando resumos...
          </div>
        ) : subtemasOrdenados.length === 0 && !loading ? (
          <div className="text-center py-24 text-muted-foreground flex flex-col items-center">
            <FileText className="w-10 h-10 opacity-20 mb-3" />
            <p className="font-semibold text-lg">{ordem === "fav" ? "Nenhum favorito" : "Nenhum resumo encontrado"}</p>
            <p className="text-sm opacity-70">Tente buscar por outro termo ou trocar o tema.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence mode="popLayout">
              {subtemasOrdenados.map((r, i) => {
                const numero = String(
                  ordem === "crono" ? i + 1 : subtemas.findIndex((s) => s.id === r.id) + 1
                ).padStart(2, "0");
                const isFav = favs.includes(r.id);
                
                return (
                  <motion.button
                    layout
                    key={r.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => {
                      resumosLocal.registrarRecente({
                        id: r.id,
                        area: r.area,
                        tema: r.tema,
                        subtema: r.subtema,
                      });
                      setSelected(r);
                    }}
                    className="flex items-center gap-3 px-4 py-3 min-h-[76px] rounded-2xl bg-card border border-border hover:border-primary/40 hover:bg-secondary/20 transition-all text-left shadow-sm group relative overflow-hidden"
                  >
                    <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#7A1220] to-[#b31b2e] opacity-20 group-hover:opacity-100 transition-opacity" />
                    <span
                      className="font-display font-bold text-[22px] shrink-0 w-8 tabular-nums opacity-80 group-hover:opacity-100 transition-opacity ml-1"
                      style={{ color: RED }}
                    >
                      {numero}
                    </span>
                    
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="font-body font-semibold text-[15px] text-foreground leading-snug line-clamp-2">
                        {r.subtema || r.tema}
                      </h3>
                      <div className="flex gap-2 mt-1.5 flex-wrap">
                        {r.markdown && <span className="text-[9px] uppercase tracking-wider font-bold text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded-sm">Resumo</span>}
                        {r.exemplos && <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-500/80 bg-emerald-500/10 px-1.5 py-0.5 rounded-sm">Exemplos</span>}
                        {r.termos && <span className="text-[9px] uppercase tracking-wider font-bold text-amber-500/80 bg-amber-500/10 px-1.5 py-0.5 rounded-sm">Termos</span>}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {isFav ? (
                        <Heart className="w-4 h-4" style={{ fill: RED, color: RED }} />
                      ) : (
                        <div className="w-4 h-4" />
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <ResumoJuridicoReaderSheet
        resumo={selected}
        onClose={() => setSelected(null)}
        onFavoritoChange={refreshFavs}
      />
    </div>
  );
}
