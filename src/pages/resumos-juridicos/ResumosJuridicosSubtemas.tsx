import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, FileText, Heart, Loader2, Search, ChevronRight, NotebookText, BookOpen, Mic, X, Brain } from "lucide-react";
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Input } from "@/components/ui/input";
import ResumoJuridicoReaderSheet, { ResumoRow } from "@/components/resumos-juridicos/ResumoJuridicoReaderSheet";
import { resumosLocal } from "@/lib/resumosLocal";
import { haptic } from "@/lib/nativeHaptics";
import ShapeGrid from "@/components/ui/ShapeGrid";
import { toast } from "@/hooks/use-toast";
import { useTypewriter } from "@/hooks/useTypewriter";
import { getAreaCover } from "@/lib/areasDireitoCovers";
import { ResumosMetodosDeck } from "@/components/resumos/ResumosMetodosDeck";
import { cn } from "@/lib/utils";

const RED = "#ef4444";

type Ordem = "crono" | "alpha" | "fav";
type Metodo = "conceitos" | "cornell" | "feynman";

// Cache em memória para subtemas
const subtemasCache = new Map<string, ResumoRow[]>();

export default function ResumosJuridicosSubtemas() {
  const { area, tema } = useParams<{ area: string; tema: string }>();
  const decodedArea = decodeURIComponent(area || "");
  const decodedTema = decodeURIComponent(tema || "");
  const navigate = useNavigate();
  
  const cacheKey = useMemo(() => `${decodedArea}:${decodedTema}`, [decodedArea, decodedTema]);
  const [rows, setRows] = useState<ResumoRow[]>(() => subtemasCache.get(cacheKey) || []);
  const [loading, setLoading] = useState(() => !subtemasCache.has(cacheKey));
  const [q, setQ] = useState("");
  
  const [selected, setSelected] = useState<ResumoRow | null>(null);
  const [selectedMetodo, setSelectedMetodo] = useState<Metodo>("conceitos");
  const [modalResumo, setModalResumo] = useState<ResumoRow | null>(null);
  
  const [ordem, setOrdem] = useState<Ordem>("crono");
  const [favs, setFavs] = useState<string[]>(() => resumosLocal.favoritos().map((f) => f.id));
  const [metodosGerados, setMetodosGerados] = useState<Metodo[]>([]);
  const [autoStartMetodo, setAutoStartMetodo] = useState<Metodo | null>(null);

  useEffect(() => {
    if (!modalResumo?.id) {
      setMetodosGerados([]);
      return;
    }
    let ativo = true;
    supabase
      .from('resumo_metodologias')
      .select('metodo')
      .eq('resumo_id', modalResumo.id)
      .then(({ data }) => {
        if (ativo && data) {
          setMetodosGerados(data.map((d) => d.metodo as Metodo));
        }
      });
    return () => {
      ativo = false;
    };
  }, [modalResumo?.id]);

  const refreshFavs = () => setFavs(resumosLocal.favoritos().map((f) => f.id));

  useEffect(() => {
    let cancelled = false;
    const localKey = `resumos_subtemas:${cacheKey}`;

    // 1. Checar cache local se ainda não estiver em memória
    if (!subtemasCache.has(cacheKey)) {
      try {
        const stored = localStorage.getItem(localKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            subtemasCache.set(cacheKey, parsed);
            setRows(parsed);
            setLoading(false);
          }
        }
      } catch {}
    }

    (async () => {
      // 2. Carregar instantaneamente (0ms) do catálogo offline
      try {
        const { getResumosCatalog } = await import("@/services/resumosCatalog");
        const catalog = await getResumosCatalog();
        const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        const areaObj = catalog.find((c) => norm(c.area) === norm(decodedArea));
        const temaObj = areaObj?.temas.find((t) => norm(t.tema) === norm(decodedTema));
        if (temaObj?.subtemas && temaObj.subtemas.length > 0) {
          const list: ResumoRow[] = temaObj.subtemas.map((s, idx) => ({
            id: s.id,
            area: decodedArea,
            tema: decodedTema,
            subtema: s.subtema,
            ordem_subtema: s.ordem ?? idx + 1,
            markdown: s.markdown || null,
            exemplos: s.exemplos || null,
            termos: s.termos || null,
          }));
          if (!cancelled) {
            subtemasCache.set(cacheKey, list);
            setRows(list);
            setLoading(false);
            try {
              localStorage.setItem(localKey, JSON.stringify(list));
            } catch {}
            return;
          }
        }
      } catch {}

      // 3. Fallback: buscar dados leves no Supabase sem carregar o markdown pesado na listagem
      try {
        const { data } = await (supabase as any)
          .from("resumos_juridicos")
          .select("id, area, tema, subtema, ordem_subtema")
          .eq("area", decodedArea)
          .eq("tema", decodedTema)
          .order("ordem_subtema", { ascending: true, nullsFirst: false })
          .order("subtema", { ascending: true })
          .limit(1000);

        if (!cancelled && data && data.length > 0) {
          const list: ResumoRow[] = data.map((d: any) => ({
            id: d.id,
            area: d.area,
            tema: d.tema,
            subtema: d.subtema,
            ordem_subtema: d.ordem_subtema,
            markdown: null,
            exemplos: null,
            termos: null,
          }));
          subtemasCache.set(cacheKey, list);
          setRows(list);
          try {
            localStorage.setItem(localKey, JSON.stringify(list));
          } catch {}
        }
      } catch {}

      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [cacheKey, decodedArea, decodedTema]);

  useEffect(() => {
    if (!modalResumo) {
      setMetodosGerados([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await (supabase as any)
          .from("resumo_metodologias")
          .select("metodo")
          .eq("resumo_id", modalResumo.id);
        if (!cancelled && data) {
          setMetodosGerados(data.map((d: any) => d.metodo));
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [modalResumo]);

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

  const openReader = (r: ResumoRow, metodo: Metodo, deveGerar?: boolean) => {
    resumosLocal.registrarRecente({
      id: r.id,
      area: r.area,
      tema: r.tema,
      subtema: r.subtema,
    });
    setSelected(r);
    setSelectedMetodo(metodo);
    setAutoStartMetodo(deveGerar ? metodo : null);
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
                    "relative flex-1 flex justify-center items-center rounded-t-2xl transition-all duration-300 ease-out border-x border-t border-white/5 font-bold text-[9px] sm:text-[10px] uppercase tracking-wider",
                    ativo 
                      ? "h-full bg-[#1A1A1A] text-white shadow-[0_-8px_20px_rgba(0,0,0,0.5)]" 
                      : "h-[75%] bg-[#0A0A0A] text-muted-foreground hover:bg-[#121212] shadow-[inset_0_-4px_10px_rgba(0,0,0,0.8)] hover:text-white"
                  )}
                  style={{
                    zIndex,
                    marginLeft: index > 0 ? "-12px" : "0",
                  }}
                >
                  <div className="absolute inset-0 rounded-t-2xl overflow-hidden pointer-events-none">
                    {ativo && <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/10 opacity-50" />}
                  </div>
                  <span className={cn("relative z-10 transition-transform duration-300", ativo ? "scale-105 text-[#ef4444]" : "scale-100")}>{o.label}</span>
                  {ativo && (
                    <motion.div 
                      layoutId="activeFolderTabSubtemas"
                      className="absolute inset-0 rounded-t-2xl border-x border-t border-[#ef4444]/50 pointer-events-none shadow-[inset_0_2px_10px_rgba(239,68,68,0.15)]"
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
          <div className="w-full h-px bg-[#1A1A1A] relative z-20" style={{ boxShadow: "0 -1px 0 rgba(239,68,68,0.3)" }} />
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
          <div className="relative py-6 sm:py-10 w-full min-w-0 max-w-full overflow-hidden">
            <div className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-hidden z-0 select-none">
              <img
                src="/images/gamificacao/deusa_temis_vazada.webp"
                alt=""
                aria-hidden="true"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="w-[320px] sm:w-[440px] md:w-[500px] max-w-[88vw] h-auto object-contain opacity-25 filter drop-shadow-[0_0_55px_rgba(234,179,8,0.28)] pointer-events-none"
                style={{
                  maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
                }}
              />
            </div>

            <div className="relative space-y-4 ml-3 sm:ml-4 pb-20 z-[2]">
              <AnimatePresence mode="popLayout">
                {subtemasOrdenados.map((r, i) => {
                const numero = String(
                  ordem === "crono" ? i + 1 : rows.findIndex((s) => s.id === r.id) + 1
                ).padStart(2, "0");
                const isFav = favs.includes(r.id);
                
                return (
                  <motion.div
                    layout
                    key={r.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3 sm:gap-4"
                  >
                    {/* Nó da Linha do Tempo */}
                    <div
                      className={cn(
                        'w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 transition-all shadow-md',
                        isFav
                          ? 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]'
                          : 'bg-card text-muted-foreground border-border/80'
                      )}
                    >
                      <span>{numero}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        openReader(r, "conceitos");
                      }}
                      className={cn(
                        'relative min-h-[88px] sm:min-h-[104px] h-auto overflow-hidden flex-1 min-w-0 flex items-center gap-3 sm:gap-4 p-3 sm:p-3.5 rounded-2xl border transition-all text-left group shadow-sm active:scale-[0.99] cursor-pointer select-none',
                        isFav
                          ? 'border-[#ef4444]/60 bg-card hover:border-[#ef4444] shadow-[#ef4444]/5'
                          : 'border-border/50 bg-card/40 hover:border-[#ef4444]/50'
                      )}
                    >
                      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#ef4444] to-[#7f1d1d] opacity-20 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="flex flex-col items-center justify-center gap-2 shrink-0 w-[56px] sm:w-[64px] pl-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-white/5 border border-white/10 overflow-hidden shadow-inner shrink-0">
                          <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white/80 group-hover:text-white transition-colors select-none" strokeWidth={1.8} aria-hidden="true" />
                        </div>
                      </div>
                      
                      <div className="min-w-0 flex-1 flex flex-col justify-center h-full py-1 pr-2">
                        <h3 className="text-sm sm:text-base font-medium font-sans text-foreground break-words leading-snug line-clamp-3 group-hover:text-[#ef4444] transition-colors">
                          {r.subtema || r.tema}
                        </h3>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0 pr-1">
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
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-[#ef4444] transition-transform duration-300 group-hover:translate-x-0.5" />
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* ── Card Flutuante Centralizado: Escolha de Método (Abre da Direita para a Esquerda) ── */}
      <AnimatePresence>
        {modalResumo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop com Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setModalResumo(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Card Flutuante Centralizado */}
            <motion.div
              initial={{ x: 80, opacity: 0, scale: 0.95 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: 80, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="relative z-10 w-full max-w-lg rounded-3xl bg-[#121215] border border-white/15 p-5 sm:p-6 overflow-hidden flex flex-col gap-4 text-left shadow-[0_25px_60px_rgba(0,0,0,0.9)]"
            >
              {/* Brilhos decorativos */}
              <div className="pointer-events-none absolute -top-16 -right-16 w-44 h-44 bg-[#ef4444]/10 rounded-full blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 -left-16 w-44 h-44 bg-[#38bdf8]/10 rounded-full blur-3xl" />

              {/* Cabeçalho */}
              <div className="flex items-start justify-between gap-3 relative z-10 border-b border-white/10 pb-3.5">
                <div className="space-y-1 min-w-0 pr-2">
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-[#ef4444]">
                    {modalResumo.area}
                  </span>
                  <h2 className="font-display text-lg sm:text-xl font-black text-white leading-tight line-clamp-2">
                    {modalResumo.subtema || modalResumo.tema}
                  </h2>
                  <p className="text-xs sm:text-[13px] text-white/50 font-medium">
                    Escolha o método de estudo ideal para você:
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalResumo(null)}
                  className="w-9 h-9 shrink-0 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-white/70 hover:text-white transition-all"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Deck 3D de Metodologias (Estilo Pílulas com Swipe e Efeito em Leque) */}
              <div className="relative z-10 w-full pt-1 pb-2">
                <ResumosMetodosDeck
                  coverUrl={getAreaCover(modalResumo.area)?.cover}
                  initialMetodo="conceitos"
                  metodosGerados={metodosGerados}
                  onSelectMetodo={(metodoId) => {
                    const r = modalResumo;
                    setModalResumo(null);
                    setMetodosGerados([]);
                    openReader(r, metodoId);
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ResumoJuridicoReaderSheet
        resumo={selected}
        initialMetodo={selectedMetodo}
        autoStartMetodo={autoStartMetodo}
        onClose={() => {
          setSelected(null);
          setAutoStartMetodo(null);
        }}
        onFavoritoChange={refreshFavs}
      />
      </div>
    </div>
  );
}
