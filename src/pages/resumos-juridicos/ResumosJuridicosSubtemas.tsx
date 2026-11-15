// @ts-nocheck
import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, FileText, Bookmark, Loader2, Search, ChevronRight, NotebookText, BookOpen, Mic, X, Brain, Crown, Headphones } from "lucide-react";
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Input } from "@/components/ui/input";
import ResumoJuridicoReaderSheet, { ResumoRow } from "@/components/resumos-juridicos/ResumoJuridicoReaderSheet";
import { resumosLocal } from "@/lib/resumosLocal";
import { haptic } from "@/lib/nativeHaptics";
import ShapeGrid from "@/components/ui/ShapeGrid";
import { toast } from "@/hooks/use-toast";
import { getAreaCover } from "@/lib/areasDireitoCovers";
import { getAreaThemePalette } from "@/lib/areasDireitoIcons";
import { ResumosMetodosDeck } from "@/components/resumos/ResumosMetodosDeck";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/useSubscription";
import PremiumGate from "@/components/PremiumGate";

const RED = "#ef4444";

type Ordem = "crono" | "alpha" | "fav";
type Metodo = "conceitos" | "cornell" | "feynman";

// Cache em memória para subtemas
const subtemasCache = new Map<string, ResumoRow[]>();

/** Remove prefixos numéricos redundantes ("01. ", "02 - ", etc.) já exibidos no nó lateral */
const cleanTitulo = (raw?: string | null): string => {
  if (!raw) return '';
  return raw.replace(/^\d+[\.\-\s_]+\s*/i, '').trim();
};

export default function ResumosJuridicosSubtemas() {
  const { area, tema } = useParams<{ area: string; tema: string }>();
  const decodedArea = decodeURIComponent(area || "");
  const decodedTema = decodeURIComponent(tema || "");
  const navigate = useNavigate();
  
  const palette = useMemo(() => getAreaThemePalette(decodedArea), [decodedArea]);
  const materiaColor = useMemo(() => {
    const norm = (decodedArea || "").toLowerCase();
    if (norm.includes("admin")) return "#fb923c"; // Laranja para Direito Administrativo
    if (norm.includes("penal")) return "#fb7185";
    if (norm.includes("civil")) return "#60a5fa";
    if (norm.includes("const")) return "#38bdf8";
    if (norm.includes("amb")) return "#4ade80";
    if (norm.includes("trab")) return "#f59e0b";
    if (norm.includes("trib")) return "#a78bfa";
    return palette?.primary || "#fb923c";
  }, [decodedArea, palette]);
  const { isPremium } = useSubscription();
  const [gateOpen, setGateOpen] = useState(false);
  
  const cacheKey = useMemo(() => `${decodedArea}:${decodedTema}`, [decodedArea, decodedTema]);
  const [rows, setRows] = useState<ResumoRow[]>(() => {
    const cached = subtemasCache.get(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0 && cached.every((c) => c.id && String(c.id).includes('_cap'))) {
      return cached;
    }
    return [];
  });
  const [loading, setLoading] = useState(() => rows.length === 0);
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
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(modalResumo.id || ''));
    if (!isUuid) {
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
    const localKey = `resumos_subtemas_v7_cap:${cacheKey}`;

    // Purga imediata de caches legados
    try {
      localStorage.removeItem(`resumos_subtemas:${cacheKey}`);
      localStorage.removeItem(`resumos_subtemas_v5:${cacheKey}`);
    } catch {}

    // 1. Checar cache local se ainda não estiver em memória
    if (!subtemasCache.has(cacheKey) || !subtemasCache.get(cacheKey)?.every((c) => c.id && String(c.id).includes('_cap'))) {
      try {
        const stored = localStorage.getItem(localKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const isOfficial = parsed.every((p: any) => p.id && String(p.id).includes('_cap'));
            if (isOfficial) {
              subtemasCache.set(cacheKey, parsed);
              setRows(parsed);
              setLoading(false);
            }
          }
        }
      } catch {}
    }

    (async () => {
      // 2. Carregar instantaneamente (0ms) do catálogo offline
      try {
        const { getResumosCatalog, matchAreaInCatalog, matchTemaInArea } = await import("@/services/resumosCatalog");
        const catalog = await getResumosCatalog();
        const areaObj = matchAreaInCatalog(catalog, decodedArea);
        const temaObj = areaObj ? matchTemaInArea(areaObj.temas, decodedTema) : undefined;
        if (temaObj?.subtemas && temaObj.subtemas.length > 0) {
          const list: ResumoRow[] = temaObj.subtemas.map((s, idx) => ({
            id: s.id,
            area: areaObj?.area || decodedArea,
            tema: temaObj.tema || decodedTema,
            subtema: s.subtema,
            ordem_subtema: s.ordem ?? idx + 1,
            markdown: s.markdown || null,
            exemplos: s.exemplos || null,
            termos: s.termos || null,
            audio_url: s.audio_url || null,
            imageUrl: s.imageUrl || null,
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
      <div className="fixed inset-0 z-0 pointer-events-none opacity-35">
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
              placeholder="Pesquisar"
              className="pl-12 pr-12 h-14 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 focus:border-primary/50 text-[15px] font-medium text-white placeholder:text-zinc-400 shadow-sm transition-all" 
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
                    "relative flex-1 flex justify-center items-center rounded-t-2xl transition-all duration-300 ease-out border-x border-t border-white/5 font-bold text-[9px] sm:text-[10px] uppercase tracking-wider",
                    "relative flex-1 h-full flex justify-center items-center rounded-t-2xl border-x border-t font-bold text-[9px] sm:text-[10px] uppercase tracking-wider cursor-pointer select-none transition-colors duration-200",
                    ativo 
                      ? "h-full bg-[#1A1A1A] text-white shadow-[0_-8px_20px_rgba(0,0,0,0.5)]" 
                      : "h-[75%] bg-[#0A0A0A] text-muted-foreground hover:bg-[#121212] shadow-[inset_0_-4px_10px_rgba(0,0,0,0.8)] hover:text-white"
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
                  <span className={cn("relative z-10 transition-transform duration-200", ativo ? "scale-105 font-black" : "scale-100")} style={{ color: ativo ? materiaColor : undefined }}>{o.label}</span>
                  {ativo && (
                    <motion.div 
                      layoutId="activeFolderTabSubtemas"
                      className="absolute inset-0 rounded-t-2xl border-x border-t pointer-events-none"
                      style={{
                        borderColor: `${materiaColor}99`,
                        boxShadow: `inset 0 2px 10px ${materiaColor}33`
                      }}
                      initial={false}
                      transition={{ type: "spring", stiffness: 480, damping: 36, mass: 0.8 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
          <div className="w-full h-px bg-[#1A1A1A] relative z-20" style={{ boxShadow: `0 -1px 0 ${materiaColor}4D` }} />
          <div className="w-full h-px bg-[#1A1A1A] relative z-20" style={{ boxShadow: `0 -1px 0 ${materiaColor}4D` }} />
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
            <p className="font-semibold text-lg mb-4">{ordem === "fav" ? "Nenhum favorito" : "Nenhum resumo encontrado"}</p>
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
          <div className="relative py-6 sm:py-10 w-full min-w-0 max-w-full overflow-hidden">
            <div className="relative space-y-4 ml-3 sm:ml-4 pb-20 z-[2]">
              <AnimatePresence mode="popLayout">
                {subtemasOrdenados.map((r, i) => {
                const numero = String(
                  ordem === "crono" ? i + 1 : rows.findIndex((s) => s.id === r.id) + 1
                ).padStart(2, "0");
                const isFav = favs.includes(r.id);
                const isLocked = !isPremium && i >= 2;
                
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
                    {/* Nó da Linha do Tempo: Fundo Cinza da cor da lista e Número na cor da Matéria (Laranja para ADM) */}
                    <div
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border bg-[#141416] flex items-center justify-center text-xs font-bold shrink-0 transition-all z-10"
                      style={{
                        borderColor: isLocked ? 'rgba(251, 191, 36, 0.45)' : `${materiaColor}66`,
                        boxShadow: `0 0 10px ${isLocked ? 'rgba(251, 191, 36, 0.25)' : `${materiaColor}33`}`,
                      }}
                    >
                      {isLocked ? (
                        <Crown className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                      ) : (
                        <span 
                          className="font-mono font-black text-xs sm:text-[13px] tracking-tight"
                          style={{ color: materiaColor }}
                        >
                          {numero}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (isLocked) {
                          haptic.impact('medium');
                          setGateOpen(true);
                          return;
                        }
                        haptic.selection();
                        openReader(r, "conceitos");
                      }}
                      className={cn(
                        'relative h-[76px] sm:h-[82px] overflow-hidden flex-1 min-w-0 flex items-center gap-3 sm:gap-3.5 px-3.5 sm:px-4 rounded-2xl border transition-all text-left group shadow-md active:scale-[0.99] cursor-pointer select-none',
                        isLocked
                          ? 'border-amber-500/30 bg-[#161410] hover:border-amber-400/50'
                          : isFav
                          ? 'border-amber-500/40 bg-[#141416] hover:border-amber-400/60'
                          : 'border-white/10 bg-[#141416] hover:border-white/20 hover:bg-[#19191d]'
                      )}
                    >
                      {/* Risco lateral elegante que acompanha a curvatura rounded-2xl do card */}
                      <div 
                        className="absolute inset-y-0 left-0 w-1 rounded-l-2xl pointer-events-none opacity-90 transition-opacity" 
                        style={{ 
                          background: isLocked 
                            ? 'linear-gradient(to bottom, #fde047 0%, rgba(253, 224, 71, 0.4) 70%, transparent 100%)' 
                            : isFav 
                            ? 'linear-gradient(to bottom, #fde047 0%, rgba(253, 224, 71, 0.4) 70%, transparent 100%)' 
                            : `linear-gradient(to bottom, ${materiaColor} 0%, ${materiaColor}66 70%, transparent 100%)`,
                          boxShadow: `0 0 8px ${isLocked ? 'rgba(253, 224, 71, 0.3)' : `${materiaColor}33`}`,
                        }} 
                      />

                      {/* Ícone de resumo elegante e compacto */}
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-400 group-hover:text-zinc-200 group-hover:border-white/20 transition-all shrink-0">
                        {isLocked ? (
                          <Crown className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                        ) : (
                          <FileText className="w-4 h-4 text-zinc-400 group-hover:text-zinc-100 transition-colors" strokeWidth={1.6} />
                        )}
                      </div>
                      
                      {/* Título com tamanho uniforme e alinhamento perfeito */}
                      <div className="min-w-0 flex-1 flex flex-col justify-center h-full py-1 pr-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-[14.5px] sm:text-[15.5px] font-normal font-sans text-zinc-100 group-hover:text-white break-words line-clamp-2 leading-snug transition-colors">
                            {cleanTitulo(r.subtema || r.tema)}
                          </h3>
                          {isLocked && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase text-amber-300 bg-amber-500/20 border border-amber-400/40 shrink-0">
                              <Crown className="w-2.5 h-2.5 text-amber-400" />
                              PREMIUM
                            </span>
                          )}
                          {(r.audio_url || (r.markdown && r.markdown.includes("audio:"))) && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase text-rose-400 bg-rose-500/15 border border-rose-500/30 shrink-0">
                              <Headphones className="w-2.5 h-2.5 text-rose-400" />
                              ÁUDIO
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2.5 shrink-0 pr-1">
                        {!isLocked && (
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
                            className="p-1.5 -mr-1 rounded-full hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                            aria-label={isFav ? "Remover dos favoritos" : "Salvar resumo"}
                          >
                            <Bookmark
                              className={cn(
                                "w-4 h-4 sm:w-[18px] sm:h-[18px] transition-colors",
                                isFav ? "fill-amber-400 text-amber-400" : "text-zinc-500 hover:text-zinc-300"
                              )}
                            />
                          </div>
                        )}
                        <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
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
              className="fixed inset-0 bg-black/80"
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
                  className="w-9 h-9 shrink-0 rounded-full bg-white/10 hover:bg-white/20 active:opacity-70 flex items-center justify-center text-white/70 hover:text-white transition-all"
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
                    // Pequeno atraso para a animação do Modal não piscar instantaneamente
                    setTimeout(() => {
                      setModalResumo(null);
                      setMetodosGerados([]);
                      openReader(r, metodoId);
                    }, 150);
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

      <PremiumGate
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        feature="resumo"
        usageLabel="Os 2 primeiros resumos deste tema são gratuitos. Assine o Prime para acessar todos os resumos!"
      />
      </div>
    </div>
  );
}
