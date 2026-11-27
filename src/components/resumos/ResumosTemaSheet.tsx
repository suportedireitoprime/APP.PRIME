import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Bookmark, ChevronRight, Crown, Loader2, X, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cleanTitulo } from "@/components/resumos-juridicos/resumoMarkdownNormalizer";
import ResumoJuridicoReaderSheet, { type ResumoRow } from "@/components/resumos-juridicos/ResumoJuridicoReaderSheet";
import PremiumGate from "@/components/PremiumGate";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useSubscription } from "@/hooks/useSubscription";
import { haptic } from "@/lib/nativeHaptics";
import { resumosLocal } from "@/lib/resumosLocal";
import { cn } from "@/lib/utils";

type Metodo = "conceitos" | "cornell" | "feynman";

export interface SelectedTemaInfo {
  tema: string;
  ordemStr: string;
  total: number;
}

interface ResumosTemaSheetProps {
  area: string;
  tema: SelectedTemaInfo | null;
  metodo?: string | null;
  accentColor: string;
  onClose: () => void;
}

const temaSheetCache = new Map<string, ResumoRow[]>();

export function ResumosTemaSheet({
  area,
  tema,
  metodo,
  accentColor,
  onClose,
}: ResumosTemaSheetProps) {
  const prefersReducedMotion = useReducedMotion();
  const { isPremium } = useSubscription();

  useBodyScrollLock(Boolean(tema), "resumos-tema-sheet");

  const resolvedMetodo: Metodo =
    metodo === "cornell" || metodo === "feynman" ? metodo : "conceitos";

  const cacheKey = useMemo(
    () => (tema ? `${area}:${tema.tema}` : ""),
    [area, tema]
  );

  const [rows, setRows] = useState<ResumoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedResumo, setSelectedResumo] = useState<ResumoRow | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [favs, setFavs] = useState<string[]>(() =>
    resumosLocal.favoritos().map((f) => f.id)
  );
  const [recentesIds, setRecentesIds] = useState<Set<string>>(() =>
    new Set(resumosLocal.recentes().map((r) => r.id))
  );

  const refreshLocalState = () => {
    setFavs(resumosLocal.favoritos().map((f) => f.id));
    setRecentesIds(new Set(resumosLocal.recentes().map((r) => r.id)));
  };

  // Fecha com Esc no desktop quando não há leitor/gate aberto por cima
  useEffect(() => {
    if (!tema) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !selectedResumo && !gateOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [tema, selectedResumo, gateOpen, onClose]);

  useEffect(() => {
    if (!tema || !area) {
      setRows([]);
      return;
    }

    let cancelled = false;
    const cached = temaSheetCache.get(cacheKey);
    if (cached && cached.length > 0) {
      setRows(cached);
      setLoading(false);
    } else {
      setRows([]);
      setLoading(true);
    }

    (async () => {
      // 1. Catálogo offline (0ms) + pré-carregamento do conteúdo completo
      try {
        const {
          getResumosCatalog,
          matchAreaInCatalog,
          matchTemaInArea,
          getOrFetchMateriaContent,
        } = await import("@/services/resumosCatalog");
        const catalog = await getResumosCatalog();
        const areaObj = matchAreaInCatalog(catalog, area);
        const temaObj = areaObj
          ? matchTemaInArea(areaObj.temas, tema.tema)
          : undefined;

        if (temaObj?.subtemas && temaObj.subtemas.length > 0) {
          const list: ResumoRow[] = temaObj.subtemas.map((s, idx) => ({
            id: s.id,
            area: areaObj?.area || area,
            tema: temaObj.tema || tema.tema,
            subtema: s.subtema,
            ordem_subtema: s.ordem ?? idx + 1,
            markdown: s.markdown || null,
            exemplos: s.exemplos || null,
            termos: s.termos || null,
            audio_url: s.audio_url || null,
            imageUrl: s.imageUrl || null,
          }));
          if (!cancelled) {
            temaSheetCache.set(cacheKey, list);
            setRows(list);
            setLoading(false);
          }

          void getOrFetchMateriaContent(area).then((fullArea) => {
            if (cancelled || !fullArea) return;
            const fullTema = matchTemaInArea(fullArea.temas, tema.tema);
            if (fullTema?.subtemas && fullTema.subtemas.length > 0) {
              const fullList: ResumoRow[] = fullTema.subtemas.map((s, idx) => ({
                id: s.id,
                area: fullArea.area || area,
                tema: fullTema.tema || tema.tema,
                subtema: s.subtema,
                ordem_subtema: s.ordem ?? idx + 1,
                markdown: s.markdown || null,
                exemplos: s.exemplos || null,
                termos: s.termos || null,
                audio_url: s.audio_url || null,
                imageUrl: s.imageUrl || null,
              }));
              temaSheetCache.set(cacheKey, fullList);
              if (!cancelled) setRows(fullList);
            }
          });
          return;
        }
      } catch {}

      // 2. Fallback Supabase caso não exista no catálogo offline
      try {
        const { data } = await (supabase as any)
          .from("resumos_juridicos")
          .select("id, area, tema, subtema, ordem_subtema")
          .eq("area", area)
          .eq("tema", tema.tema)
          .order("ordem_subtema", { ascending: true, nullsFirst: false })
          .order("subtema", { ascending: true })
          .limit(500);

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
          temaSheetCache.set(cacheKey, list);
          setRows(list);
        }
      } catch {}

      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [area, tema, cacheKey]);

  const areaCurta = area.replace(/^DIREITO\s+(DO\s+|DA\s+|DE\s+)?/i, "");

  return (
    <>
      <AnimatePresence>
        {tema && (
          <div
            className="fixed inset-0 z-50 flex flex-col justify-end"
            role="dialog"
            aria-modal="true"
            aria-label={`Tópicos de ${tema.tema}`}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
              onClick={() => {
                haptic.selection();
                onClose();
              }}
              className="fixed inset-0 bg-black/75 backdrop-blur-[2px]"
            />

            {/* Gaveta minimalista de baixo para cima */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 0 } : { y: "100%" }}
              animate={prefersReducedMotion ? { opacity: 1 } : { y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { y: "100%" }}
              transition={{
                type: "spring",
                damping: 32,
                stiffness: 360,
                mass: 0.85,
              }}
              className="relative z-10 w-full max-w-3xl mx-auto max-h-[85dvh] rounded-t-3xl bg-[#111114] border-t border-x border-white/10 shadow-[0_-20px_60px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden"
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-2.5 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Cabeçalho do tema selecionado */}
              <div className="flex items-start justify-between gap-3 px-4 sm:px-5 pt-2 pb-3.5 border-b border-white/10 shrink-0">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl border flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5"
                    style={{
                      backgroundColor: `${accentColor}1A`,
                      borderColor: `${accentColor}40`,
                      color: accentColor,
                    }}
                  >
                    {tema.ordemStr}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-zinc-400 truncate">
                      {areaCurta} • {rows.length || tema.total}{" "}
                      {(rows.length || tema.total) === 1 ? "tópico" : "tópicos"}
                    </p>
                    <h2 className="text-[15px] sm:text-base font-bold text-white leading-snug line-clamp-2 mt-0.5">
                      {tema.tema}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    onClose();
                  }}
                  aria-label="Fechar tópicos do tema"
                  className="w-10 h-10 shrink-0 rounded-full bg-white/5 hover:bg-white/15 active:scale-95 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Lista minimalista de tópicos */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 py-3.5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]">
                {loading && rows.length === 0 ? (
                  <div className="flex items-center justify-center py-16 text-zinc-400 text-sm">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Carregando tópicos...
                  </div>
                ) : rows.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-center text-zinc-400">
                    <FileText className="w-8 h-8 opacity-30 mb-2" />
                    <p className="text-sm font-medium">
                      Nenhum tópico encontrado neste tema.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rows.map((r, i) => {
                      const numStr = String(i + 1).padStart(2, "0");
                      const isFav = favs.includes(r.id);
                      const isLido = recentesIds.has(r.id);
                      const isLocked = !isPremium && i >= 2;

                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => {
                            if (isLocked) {
                              haptic.impact("medium");
                              setGateOpen(true);
                              return;
                            }
                            haptic.selection();
                            resumosLocal.registrarRecente({
                              id: r.id,
                              area: r.area,
                              tema: r.tema,
                              subtema: r.subtema,
                            });
                            refreshLocalState();
                            setSelectedResumo(r);
                          }}
                          className={cn(
                            "w-full min-h-[56px] group flex items-center gap-3 px-3.5 py-3 rounded-2xl border transition-all text-left cursor-pointer active:scale-[0.99]",
                            isLocked
                              ? "border-amber-500/25 bg-amber-500/[0.04] hover:border-amber-400/45"
                              : "border-white/10 bg-zinc-900/75 hover:border-white/25 hover:bg-zinc-900"
                          )}
                        >
                          <div
                            className="w-8 h-8 rounded-lg border flex items-center justify-center font-mono font-bold text-[11px] shrink-0"
                            style={{
                              backgroundColor: isLocked
                                ? "rgba(251, 191, 36, 0.12)"
                                : `${accentColor}15`,
                              borderColor: isLocked
                                ? "rgba(251, 191, 36, 0.35)"
                                : `${accentColor}38`,
                              color: isLocked ? "#fbbf24" : accentColor,
                            }}
                          >
                            {isLocked ? (
                              <Crown className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              numStr
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-[13.5px] sm:text-sm font-semibold text-zinc-100 leading-snug group-hover:text-white transition-colors line-clamp-2">
                              {cleanTitulo(r.subtema || r.tema)}
                            </p>
                            {(isLido || isLocked) && (
                              <p className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1.5">
                                {isLocked ? (
                                  <span className="text-amber-400/90 font-medium">
                                    Exclusivo Prime
                                  </span>
                                ) : (
                                  <span>Lido</span>
                                )}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {!isLocked && (
                              <span
                                role="button"
                                tabIndex={0}
                                aria-label={
                                  isFav
                                    ? "Remover dos favoritos"
                                    : "Salvar tópico"
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  haptic.selection();
                                  resumosLocal.toggleFavorito({
                                    id: r.id,
                                    area: r.area,
                                    tema: r.tema,
                                    subtema: r.subtema,
                                  });
                                  refreshLocalState();
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    resumosLocal.toggleFavorito({
                                      id: r.id,
                                      area: r.area,
                                      tema: r.tema,
                                      subtema: r.subtema,
                                    });
                                    refreshLocalState();
                                  }
                                }}
                                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                              >
                                <Bookmark
                                  className={cn(
                                    "w-4 h-4 transition-colors",
                                    isFav
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-zinc-500 hover:text-zinc-300"
                                  )}
                                />
                              </span>
                            )}
                            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ResumoJuridicoReaderSheet
        resumo={selectedResumo}
        initialMetodo={resolvedMetodo}
        todosSubtemas={rows}
        onSelectSubtema={(sub) => {
          setSelectedResumo(sub);
        }}
        onClose={() => {
          setSelectedResumo(null);
          refreshLocalState();
        }}
        onFavoritoChange={refreshLocalState}
      />

      <PremiumGate
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        feature="resumo"
        usageLabel="Os 2 primeiros resumos deste tema são gratuitos. Assine o Prime para acessar todos os resumos!"
      />
    </>
  );
}
