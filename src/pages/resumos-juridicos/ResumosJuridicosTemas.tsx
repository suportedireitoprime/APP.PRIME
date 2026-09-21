import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, ChevronRight, Mic, Layers, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Input } from "@/components/ui/input";
import { haptic } from "@/lib/nativeHaptics";
import { resumosLocal } from "@/lib/resumosLocal";
import ShapeGrid from "@/components/ui/ShapeGrid";
import { toast } from "@/hooks/use-toast";
import { useTypewriter } from "@/hooks/useTypewriter";
import { PrimeImage } from '@/components/ui/PrimeImage';
import { getAreaCover } from "@/lib/areasDireitoCovers";
import { cn } from "@/lib/utils";
import { getAreaThemePalette } from "@/lib/areasDireitoIcons";

type Row = { tema: string; ordem_tema: number | null; total: number };
type Ordem = "crono" | "alpha" | "fav";

// ---- Cache em memória entre navegações ----
const temasCache = new Map<string, Row[]>();

export default function ResumosJuridicosTemas() {
  const { area } = useParams<{ area: string }>();
  const decodedArea = decodeURIComponent(area || "");
  const navigate = useNavigate();
  
  const areaCover = useMemo(() => {
    return getAreaCover(decodedArea)?.cover || "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas_fixas/cp_artigos_v2.jpg";
  }, [decodedArea]);

  const palette = useMemo(() => getAreaThemePalette(decodedArea), [decodedArea]);

  const [rows, setRows] = useState<Row[]>(() => temasCache.get(decodedArea) || []);
  const [loading, setLoading] = useState(!temasCache.has(decodedArea));
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
      // 1. Tentar catálogo offline imediatamente (0ms)
      try {
        const { getResumosCatalog } = await import("@/services/resumosCatalog");
        const catalog = await getResumosCatalog();
        const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        const areaObj = catalog.find((c) => norm(c.area) === norm(decodedArea));
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

  const placeholderWords = useMemo(() => {
    const areaName = decodedArea.replace(/^DIREITO\s+(DO\s+|DA\s+|DE\s+)?/i, '');
    if (rows.length === 0) return [`Pesquisar matéria de ${areaName}...`];
    return rows.map(r => `Pesquisar ${r.tema.toLowerCase()}...`);
  }, [rows, decodedArea]);

  const placeholderText = useTypewriter(placeholderWords, 50, 20, 2500);

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
    <div className="min-h-dvh bg-[#0D0D0D] text-white pb-20 relative overflow-x-hidden flex flex-col">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.15]">
        <ShapeGrid />
      </div>

      <div className="relative z-10">
        <div className="sticky top-0 z-10 bg-[#0D0D0D]/90 backdrop-blur-md border-b border-white/10 shadow-sm pb-3">
          <PageHeader
            title={decodedArea.replace(/^DIREITO\s+(DO\s+|DA\s+|DE\s+)?/i, '')}
            subtitle={rows.length > 0 ? `Área • ${rows.reduce((acc, row) => acc + row.total, 0)} resumos` : "Área"}
            onBack={() => navigate("/resumos-juridicos")}
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
                  <span className={cn("relative z-10 transition-transform duration-300", ativo ? "scale-105" : "scale-100")} style={{ color: ativo ? palette.primary : undefined }}>{o.label}</span>
                  {ativo && (
                    <motion.div 
                      layoutId="activeFolderTabTemas"
                      className="absolute inset-0 rounded-t-2xl border-x border-t pointer-events-none"
                      style={{
                        borderColor: `${palette.primary}80`,
                        boxShadow: `inset 0 2px 10px ${palette.primary}26`
                      }}
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
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
                className="px-6 py-2.5 rounded-xl text-white font-bold text-sm active:scale-95 transition-all shadow-md"
                style={{ backgroundColor: palette.primary, boxShadow: `0 4px 14px ${palette.primary}4D` }}
              >
                Limpar Pesquisa
              </button>
            )}
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

            <div className="w-full min-w-0 relative z-[2] flex flex-col">
              {filteredTemas.map((r, i) => {
                const isLeft = i % 2 === 0;
                
                const lidosCount = recentes.filter(x => x.area === decodedArea && x.tema === r.tema).length;
                const pct = r.total > 0 ? Math.min(100, Math.round((lidosCount / r.total) * 100)) : 0;
                const ordemStr = String(i + 1).padStart(2, '0');
                const badgeLabel = `Módulo ${ordemStr}`;

                return (
                  <div key={r.tema} className="w-full flex flex-col">
                    <div
                      className={cn(
                        "relative z-10 flex w-full items-center justify-between gap-2 xs:gap-3 sm:gap-6 md:gap-8 px-2 sm:px-6 md:px-10 max-w-3xl lg:max-w-4xl mx-auto group",
                        isLeft ? "flex-row" : "flex-row-reverse"
                      )}
                    >
                      <div
                        onClick={() => {
                          haptic.selection();
                          navigate(`/resumos-juridicos/${encodeURIComponent(decodedArea)}/${encodeURIComponent(r.tema)}`);
                        }}
                        className="relative shrink-0 w-[140px] xs:w-[155px] sm:w-[185px] md:w-[210px] h-[215px] xs:h-[235px] sm:h-[265px] md:h-[290px] cursor-pointer select-none transition-transform duration-300 active:scale-[0.97] hover:-translate-y-1.5"
                      >
                        <div
                          className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center rounded-full w-8 h-8 sm:w-8.5 sm:h-8.5 border-2 border-white/70 text-white font-bold text-xs shadow-xl transition-transform duration-300 group-hover:scale-110"
                          style={{
                            backgroundColor: palette.primary,
                            boxShadow: palette.nodeBoxShadow,
                          }}
                        >
                          <span className="font-sans font-bold text-[11px] sm:text-xs">
                            {ordemStr}
                          </span>
                        </div>

                        <div
                          className={cn(
                            "absolute inset-0 rounded-2xl border border-white/10 opacity-40 transition-all duration-400 origin-bottom z-0 shadow-lg overflow-hidden",
                            isLeft
                              ? "scale-[0.88] rotate-[6deg] translate-x-3 sm:translate-x-5 -translate-y-2 group-hover:scale-[0.92] group-hover:rotate-[8deg] group-hover:translate-x-5 group-hover:-translate-y-3"
                              : "scale-[0.88] -rotate-[6deg] -translate-x-3 sm:-translate-x-5 -translate-y-2 group-hover:scale-[0.92] group-hover:-rotate-[8deg] group-hover:-translate-x-5 group-hover:-translate-y-3"
                          )}
                          style={{
                            background: palette.cardGradient,
                            boxShadow: `0 10px 24px -5px rgba(0,0,0,0.65), inset 0 0 0 1px rgba(255,255,255,0.1)`,
                          }}
                        >
                          <div className="absolute inset-0 bg-black/50 pointer-events-none z-[1]" />
                          <div className="absolute inset-1.5 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden z-[2]">
                            <div
                              className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center opacity-30"
                              style={{ borderColor: palette.primary }}
                            >
                              <Layers className="w-4 h-4 text-white/60" />
                            </div>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:8px_8px] pointer-events-none" />
                          </div>
                        </div>

                        <div
                          className={cn(
                            "absolute inset-0 rounded-2xl border border-white/15 opacity-75 transition-all duration-400 origin-bottom z-0 shadow-lg overflow-hidden",
                            isLeft
                              ? "scale-[0.94] rotate-[3deg] translate-x-1.5 sm:translate-x-2.5 -translate-y-1 group-hover:scale-[0.96] group-hover:rotate-[4deg] group-hover:translate-x-3 group-hover:-translate-y-2"
                              : "scale-[0.94] -rotate-[3deg] -translate-x-1.5 sm:-translate-x-2.5 -translate-y-1 group-hover:scale-[0.96] group-hover:-rotate-[4deg] group-hover:-translate-x-3 group-hover:-translate-y-2"
                          )}
                          style={{
                            background: palette.cardGradient,
                            boxShadow: `0 10px 24px -5px rgba(0,0,0,0.65), inset 0 0 0 1px rgba(255,255,255,0.1)`,
                          }}
                        >
                          <div className="absolute inset-0 bg-black/25 pointer-events-none z-[1]" />
                          <div className="absolute inset-1.5 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden z-[2]">
                            <div
                              className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center opacity-30"
                              style={{ borderColor: palette.primary }}
                            >
                              <Layers className="w-4 h-4 text-white/60" />
                            </div>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:8px_8px] pointer-events-none" />
                          </div>
                        </div>

                        <div
                          className={cn(
                            "relative w-full h-full p-2.5 sm:p-3.5 rounded-2xl flex flex-col justify-between overflow-hidden box-border z-20 border border-white/30 hover:border-amber-400/60 transition-all duration-300 origin-bottom",
                            isLeft
                              ? "group-hover:-rotate-[1deg] group-hover:-translate-x-1 group-hover:-translate-y-1 shadow-[0_16px_36px_rgba(0,0,0,0.75)] group-hover:shadow-[0_22px_45px_rgba(0,0,0,0.85)]"
                              : "group-hover:rotate-[1deg] group-hover:translate-x-1 group-hover:-translate-y-1 shadow-[0_16px_36px_rgba(0,0,0,0.75)] group-hover:shadow-[0_22px_45px_rgba(0,0,0,0.85)]"
                          )}
                          style={{
                            background: palette.cardGradient,
                            boxShadow: palette.shadow,
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none z-20" />
                          <div className="absolute inset-1 rounded-[14px] border border-white/15 pointer-events-none z-10" />
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.12] pointer-events-none z-10" />
                          <img
                            src={areaCover}
                            alt=""
                            aria-hidden="true"
                            loading="lazy"
                            decoding="async"
                            className="pointer-events-none absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 z-0 select-none"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f12]/90 via-black/10 to-[#0d0f12]/50 pointer-events-none z-0" />

                          <div className="flex items-center justify-start z-[1] w-full pt-1">
                            <span className="inline-flex items-center text-[9.5px] sm:text-[11px] font-bold uppercase tracking-wider px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full backdrop-blur-md bg-black/50 text-white/95 border border-white/20 shadow-sm whitespace-nowrap">
                              <span>{badgeLabel}</span>
                            </span>
                          </div>

                          <div className="my-auto py-2 z-[1] w-full flex items-center justify-center">
                            <div className="relative flex items-center justify-center">
                              <div
                                className="absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-125 pointer-events-none"
                                style={{ backgroundColor: `${palette.primary}50` }}
                              />
                              <div className="relative w-10 h-10 xs:w-11 xs:h-11 sm:w-13 sm:h-13 rounded-full bg-black/50 backdrop-blur-md border border-white/30 flex items-center justify-center text-white/90 shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:border-amber-300 group-hover:bg-amber-500 group-hover:text-black group-hover:shadow-[0_0_22px_rgba(245,158,11,0.6)]">
                                <Play className="w-4 h-4 xs:w-5 xs:h-5 sm:w-5.5 sm:h-5.5 fill-current translate-x-0.5 transition-colors" />
                              </div>
                            </div>
                          </div>

                          <div className="z-[1] pt-1.5 sm:pt-2 border-t border-white/20 w-full px-0.5">
                            <div>
                              <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-normal text-white/95 mb-1 sm:mb-1.5">
                                <span className="truncate">
                                  {r.total} resumos
                                </span>
                                <span className="font-semibold font-sans ml-1">{pct}%</span>
                              </div>
                              <div className="w-full bg-black/50 h-1.5 sm:h-2 rounded-full overflow-hidden border border-white/20">
                                <div
                                  className="h-full rounded-full transition-all duration-500 shadow-sm"
                                  style={{
                                    width: `${Math.max(pct, r.total > 0 ? 8 : 0)}%`,
                                    backgroundColor: palette.primary,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div
                        onClick={() => {
                          haptic.selection();
                          navigate(`/resumos-juridicos/${encodeURIComponent(decodedArea)}/${encodeURIComponent(r.tema)}`);
                        }}
                        className={cn(
                          "flex-1 min-w-0 flex items-center cursor-pointer select-none py-2 transition-all",
                          isLeft ? "flex-row pl-1.5 xs:pl-2 sm:pl-3" : "flex-row-reverse pr-1.5 xs:pr-2 sm:pr-3"
                        )}
                      >
                        <div className={cn("flex items-center shrink-0 w-6 xs:w-8 sm:w-12 md:w-16", isLeft ? "flex-row" : "flex-row-reverse")}>
                          <div
                            className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full border border-white/70 shrink-0 transition-transform duration-300 group-hover:scale-125"
                            style={{ backgroundColor: palette.primary, boxShadow: `0 0 8px ${palette.primary}` }}
                          />
                          <div
                            className="flex-1 h-[1px] transition-all duration-300 group-hover:h-[1.5px]"
                            style={{
                              background: isLeft
                                ? `linear-gradient(to right, ${palette.primary}, rgba(255,255,255,0.3), transparent)`
                                : `linear-gradient(to left, ${palette.primary}, rgba(255,255,255,0.3), transparent)`,
                            }}
                          />
                        </div>

                        <div className={cn("flex-1 min-w-0 flex flex-col justify-center px-1.5 xs:px-2.5 sm:px-4 transition-transform duration-300 group-hover:-translate-y-0.5", isLeft ? "items-start text-left" : "items-end text-right")}>
                          <div className={cn("flex items-center gap-1.5 mb-1 opacity-80", isLeft ? "justify-start" : "justify-end")}>
                            <span className="text-[9.5px] sm:text-[11px] font-normal uppercase tracking-wider" style={{ color: palette.primary }}>
                              {badgeLabel}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-white/25" />
                            <span className="text-[9.5px] sm:text-[11px] font-light text-zinc-400">
                              {r.total} resumos
                            </span>
                          </div>
                          <h3 className="font-sans font-light text-[13.5px] xs:text-[15px] sm:text-[17px] md:text-[19px] lg:text-[20px] leading-snug break-words text-zinc-100 group-hover:text-amber-200 transition-colors drop-shadow-sm line-clamp-3 sm:line-clamp-4">
                            {r.tema}
                          </h3>
                        </div>
                      </div>
                    </div>

                    {i < filteredTemas.length - 1 && (
                      <div className="relative w-full max-w-3xl lg:max-w-4xl mx-auto h-16 sm:h-20 -my-1.5 sm:-my-2 pointer-events-none z-[5] overflow-visible">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <defs>
                            <filter id={`trail-glow-${i}`} x="-20%" y="-20%" width="140%" height="140%">
                              <feGaussianBlur stdDeviation="3" result="blur" />
                              <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                              </feMerge>
                            </filter>
                          </defs>
                          <path
                            d={isLeft ? "M 30 0 C 30 65, 70 35, 70 100" : "M 70 0 C 70 65, 30 35, 30 100"}
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.08)"
                            strokeWidth="4"
                            strokeLinecap="round"
                            vectorEffect="non-scaling-stroke"
                          />
                          <path
                            d={isLeft ? "M 30 0 C 30 65, 70 35, 70 100" : "M 70 0 C 70 65, 30 35, 30 100"}
                            fill="none"
                            stroke={palette.primary}
                            strokeWidth="2.5"
                            strokeDasharray="5 7"
                            strokeLinecap="round"
                            vectorEffect="non-scaling-stroke"
                            filter={`url(#trail-glow-${i})`}
                          />
                        </svg>
                        <div
                          className="absolute w-2.5 h-2.5 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none border border-white/70 bg-white shadow-lg"
                          style={{ left: '50%', top: '50%', boxShadow: `0 0 10px ${palette.primary}` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
