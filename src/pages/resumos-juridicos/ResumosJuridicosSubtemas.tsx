import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, FileText, Heart, Loader2, Search, ChevronRight, NotebookText, BookOpen, Mic } from "lucide-react";
import { PageHeader } from "@/components/vademecum/PageHeader";
import { Input } from "@/components/ui/input";
import ResumoJuridicoReaderSheet, { ResumoRow } from "@/components/resumos-juridicos/ResumoJuridicoReaderSheet";
import { resumosLocal } from "@/lib/resumosLocal";
import { haptic } from "@/lib/nativeHaptics";
import ShapeGrid from "@/components/ui/ShapeGrid";
import { toast } from "@/hooks/use-toast";
import { useTypewriter } from "@/hooks/useTypewriter";

const RED = "#ef4444";

type Ordem = "crono" | "alpha" | "fav";
type Metodo = "conceitos" | "cornell" | "feynman";

export default function ResumosJuridicosSubtemas() {
  const { area, tema } = useParams<{ area: string; tema: string }>();
  const decodedArea = decodeURIComponent(area || "");
  const decodedTema = decodeURIComponent(tema || "");
  const navigate = useNavigate();
  
  const [rows, setRows] = useState<ResumoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  
  const [selected, setSelected] = useState<ResumoRow | null>(null);
  const [selectedMetodo, setSelectedMetodo] = useState<Metodo>("conceitos");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [ordem, setOrdem] = useState<Ordem>("crono");
  const [favs, setFavs] = useState<string[]>(() => resumosLocal.favoritos().map((f) => f.id));

  const refreshFavs = () => setFavs(resumosLocal.favoritos().map((f) => f.id));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
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
      setRows(list);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [decodedArea, decodedTema]);

  const subtemasOrdenados = useMemo(() => {
    let result = rows;
    
    if (q.trim()) {
      const qLower = q.toLowerCase();
      result = result.filter(s => 
        (s.subtema || s.tema).toLowerCase().includes(qLower)
      );
    }

    if (ordem === "alpha") {
      result = [...result].sort((a, b) => (a.subtema || "").localeCompare(b.subtema || ""));
    } else if (ordem === "fav") {
      result = result.filter((s) => favs.includes(s.id));
    }
    
    return result;
  }, [rows, ordem, favs, q]);

  const placeholderWords = useMemo(() => {
    if (rows.length === 0) return [`Pesquisar em ${decodedTema}...`];
    // Pegamos alguns subtemas para exibir no placeholder
    return rows.slice(0, 10).map(r => `Pesquisar ${r.subtema ? r.subtema.toLowerCase() : r.tema.toLowerCase()}...`);
  }, [rows, decodedTema]);

  const placeholderText = useTypewriter(placeholderWords, 50, 20, 2500);

  const openReader = (r: ResumoRow, metodoId: Metodo) => {
    resumosLocal.registrarRecente({
      id: r.id,
      area: r.area,
      tema: r.tema,
      subtema: r.subtema,
    });
    setSelectedMetodo(metodoId);
    setSelected(r);
  };

  return (
    <div className="min-h-dvh bg-[#0D0D0D] text-white pb-20 relative overflow-x-hidden flex flex-col">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.15]">
        <ShapeGrid />
      </div>

      <div className="relative z-10">
        <div className="sticky top-0 z-10 bg-[#0D0D0D]/90 backdrop-blur-md border-b border-white/10 shadow-sm pb-3">
          <PageHeader
            title={decodedTema}
            subtitle={decodedArea.replace(/^DIREITO\s+(DO\s+|DA\s+|DE\s+)?/i, '')}
            onBack={() => navigate(`/resumos-juridicos/${encodeURIComponent(decodedArea)}`)}
            className="border-b-0 pb-1"
          />
          
          <div className="max-w-5xl mx-auto px-4 mt-2 space-y-3">
          <div className="relative flex items-center group">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" />
            <Input 
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
              placeholder={placeholderText || "Pesquisar..."}
              className="pl-12 pr-12 h-14 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 focus:border-primary/50 text-[15px] font-medium text-white placeholder:text-zinc-400 shadow-sm transition-all" 
            />
            <button
              onClick={() => { haptic.selection(); toast({ title: 'Em breve: Pesquisa por Voz' }); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 active:scale-95 transition-all text-white/70 hover:text-white"
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>

          <div className="flex w-full bg-secondary/80 rounded-full p-1 gap-1">
            {([
              { id: "crono", label: "Cronológica" },
              { id: "alpha", label: "Alfabética" },
              { id: "fav", label: "Favoritos" },
            ] as { id: Ordem; label: string }[]).map((o) => {
              const ativo = ordem === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => {
                    haptic.selection();
                    setOrdem(o.id);
                  }}
                  className={`flex-1 py-1.5 rounded-full text-[10px] sm:text-[11px] uppercase tracking-wider font-bold transition-all ${
                    ativo ? 'bg-[#ef4444] text-white shadow-md scale-105' : 'text-muted-foreground hover:text-foreground active:scale-95'
                  }`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-4">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando resumos...
          </div>
        ) : subtemasOrdenados.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground flex flex-col items-center">
            <FileText className="w-10 h-10 opacity-20 mb-3" />
            <p className="font-semibold text-lg">{ordem === "fav" ? "Nenhum favorito" : "Nenhum resumo encontrado"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence mode="popLayout">
              {subtemasOrdenados.map((r, i) => {
                const numero = String(
                  ordem === "crono" ? i + 1 : rows.findIndex((s) => s.id === r.id) + 1
                ).padStart(2, "0");
                const isFav = favs.includes(r.id);
                const isExpanded = expandedId === r.id;
                const isAnyExpanded = expandedId !== null;
                
                return (
                  <motion.div
                    layout
                    key={r.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ 
                      opacity: isExpanded ? 1 : isAnyExpanded ? 0.3 : 1, 
                      scale: isExpanded ? 1 : isAnyExpanded ? 0.98 : 1,
                      filter: isExpanded ? "blur(0px)" : isAnyExpanded ? "blur(0.5px)" : "blur(0px)"
                    }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`flex flex-col rounded-2xl bg-card border transition-colors duration-300 shadow-sm group relative overflow-hidden ${
                      isExpanded ? 'border-[#ef4444]/40 z-10' :
                      isAnyExpanded ? 'border-border/50' : 'border-border hover:border-[#ef4444]/40'
                    }`}
                  >
                    <button
                      onClick={() => {
                        haptic.selection();
                        setExpandedId(isExpanded ? null : r.id);
                      }}
                      className="flex items-center gap-3 px-4 py-3 min-h-[84px] hover:bg-secondary/20 transition-all text-left w-full relative"
                    >
                      <div className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#ef4444] to-[#7f1d1d] opacity-20 group-hover:opacity-100 transition-opacity ${isExpanded ? 'opacity-100' : ''}`} />
                      
                      <span
                        className="font-display font-bold text-[22px] shrink-0 w-8 tabular-nums opacity-80 group-hover:opacity-100 transition-opacity ml-1"
                        style={{ color: RED }}
                      >
                        {numero}
                      </span>
                      
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="font-sans font-semibold text-[15px] tracking-normal text-foreground leading-snug line-clamp-2">
                          {r.subtema || r.tema}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            haptic.selection();
                            resumosLocal.toggleFavorito({
                              id: r.id,
                              area: r.area,
                              tema: r.tema,
                              subtema: r.subtema,
                            });
                            refreshFavs();
                          }}
                          className="p-1 -mr-1 rounded-full hover:bg-secondary/50 active:scale-90 transition-transform"
                        >
                          {isFav ? (
                            <Heart className="w-5 h-5" style={{ fill: RED, color: RED }} />
                          ) : (
                            <Heart className="w-5 h-5 text-muted-foreground/50" />
                          )}
                        </div>
                        <ChevronRight className={`w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-border/50 bg-secondary/10"
                        >
                          <div className="flex gap-2 p-3">
                            <button
                              onClick={() => { haptic.selection(); openReader(r, "conceitos"); }}
                              className="flex-1 flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-xl bg-secondary/80 border border-border/50 text-foreground shadow-sm hover:border-[#ef4444]/50 transition-all active:scale-95"
                            >
                              <FileText className="w-5 h-5 text-[#ef4444]" />
                              <span className="font-bold text-[10px] uppercase tracking-wider text-[#ef4444]">Conceitos</span>
                            </button>
                            <button
                              onClick={() => { haptic.selection(); openReader(r, "cornell"); }}
                              className="flex-1 flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-xl bg-secondary/80 border border-border/50 text-foreground shadow-sm hover:border-[#38bdf8]/50 transition-all active:scale-95"
                            >
                              <NotebookText className="w-5 h-5 text-[#38bdf8]" />
                              <span className="font-bold text-[10px] uppercase tracking-wider text-[#38bdf8]">Cornell</span>
                            </button>
                            <button
                              onClick={() => { haptic.selection(); openReader(r, "feynman"); }}
                              className="flex-1 flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-xl bg-secondary/80 border border-border/50 text-foreground shadow-sm hover:border-[#fbbf24]/50 transition-all active:scale-95"
                            >
                              <BookOpen className="w-5 h-5 text-[#fbbf24]" />
                              <span className="font-bold text-[10px] uppercase tracking-wider text-[#fbbf24]">Feynman</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <ResumoJuridicoReaderSheet
        resumo={selected}
        initialMetodo={selectedMetodo}
        onClose={() => setSelected(null)}
        onFavoritoChange={refreshFavs}
      />
      </div>
    </div>
  );
}
