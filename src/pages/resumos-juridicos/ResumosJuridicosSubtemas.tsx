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
  const [modalResumo, setModalResumo] = useState<ResumoRow | null>(null);
  
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
                
                return (
                  <motion.div
                    layout
                    key={r.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col rounded-2xl bg-card border border-border hover:border-[#ef4444]/40 transition-colors duration-300 shadow-sm group relative overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        setModalResumo(r);
                      }}
                      className="flex items-center gap-3 px-4 py-3 min-h-[84px] hover:bg-secondary/20 transition-all text-left w-full relative group"
                    >
                      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#ef4444] to-[#7f1d1d] opacity-20 group-hover:opacity-100 transition-opacity" />
                      
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
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-transform duration-300 group-hover:translate-x-0.5" />
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
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

              {/* 3 Métodos com Cores Oficiais e Descrições */}
              <div className="flex flex-col gap-3 relative z-10">
                {/* 1. Conceitos (Vermelho) */}
                <button
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    const r = modalResumo;
                    setModalResumo(null);
                    openReader(r, "conceitos");
                  }}
                  className="group relative flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl border border-white/10 hover:border-[#ef4444]/60 bg-white/[0.03] hover:bg-[#ef4444]/10 transition-all active:scale-[0.98] text-left cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#ef4444]/15 border border-[#ef4444]/30 flex items-center justify-center text-[#ef4444] shrink-0 group-hover:scale-105 group-hover:bg-[#ef4444] group-hover:text-white transition-all shadow-md">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm sm:text-[15px] font-black uppercase tracking-wider text-white group-hover:text-[#ef4444] transition-colors">
                        Conceitos
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30">
                        Tradicional
                      </span>
                    </div>
                    <p className="text-[12.5px] sm:text-[13px] text-zinc-300 leading-relaxed mt-1">
                      Visão aprofundada e completa da matéria, com fundamentação jurídica, exemplos práticos e termos-chave.
                    </p>
                  </div>
                </button>

                {/* 2. Método Cornell (Azul) */}
                <button
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    const r = modalResumo;
                    setModalResumo(null);
                    openReader(r, "cornell");
                  }}
                  className="group relative flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl border border-white/10 hover:border-[#38bdf8]/60 bg-white/[0.03] hover:bg-[#38bdf8]/10 transition-all active:scale-[0.98] text-left cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#38bdf8]/15 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8] shrink-0 group-hover:scale-105 group-hover:bg-[#38bdf8] group-hover:text-zinc-950 transition-all shadow-md">
                    <NotebookText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm sm:text-[15px] font-black uppercase tracking-wider text-white group-hover:text-[#38bdf8] transition-colors">
                        Método Cornell
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/30">
                        Fixação Ativa
                      </span>
                    </div>
                    <p className="text-[12.5px] sm:text-[13px] text-zinc-300 leading-relaxed mt-1">
                      Organização em tópicos, palavras-chave e perguntas de revisão para autoavaliação e retenção acelerada.
                    </p>
                  </div>
                </button>

                {/* 3. Método Feynman (Amarelo) */}
                <button
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    const r = modalResumo;
                    setModalResumo(null);
                    openReader(r, "feynman");
                  }}
                  className="group relative flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl border border-white/10 hover:border-[#fbbf24]/60 bg-white/[0.03] hover:bg-[#fbbf24]/10 transition-all active:scale-[0.98] text-left cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#fbbf24]/15 border border-[#fbbf24]/30 flex items-center justify-center text-[#fbbf24] shrink-0 group-hover:scale-105 group-hover:bg-[#fbbf24] group-hover:text-zinc-950 transition-all shadow-md">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm sm:text-[15px] font-black uppercase tracking-wider text-white group-hover:text-[#fbbf24] transition-colors">
                        Método Feynman
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/30">
                        Simplificação
                      </span>
                    </div>
                    <p className="text-[12.5px] sm:text-[13px] text-zinc-300 leading-relaxed mt-1">
                      Explicação em 4 passos com linguagem simples do dia a dia e analogias para eliminar lacunas de entendimento.
                    </p>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
