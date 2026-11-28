import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useResumosLocal } from "@/hooks/useResumosLocal";
import { useResumosSubtemas } from "@/hooks/useResumosSubtemas";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Bookmark, ChevronRight, Crown, Search, X, FileText } from "lucide-react";
import { toast } from "sonner";
import { formatJuridicoTitle } from "@/lib/text/formatJuridicoTitle";
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
  inline?: boolean;
  onProgressChange?: () => void;
  onClose: () => void;
}

export function ResumosTemaSheet({
  area,
  tema,
  metodo,
  accentColor,
  inline = false,
  onProgressChange,
  onClose,
}: ResumosTemaSheetProps) {
  const prefersReducedMotion = useReducedMotion();
  const { isPremium } = useSubscription();

  useBodyScrollLock(Boolean(tema) && !inline, "resumos-tema-sheet");

  const resolvedMetodo: Metodo =
    metodo === "cornell" || metodo === "feynman" ? metodo : "conceitos";

  const cacheKey = useMemo(
    () => (tema ? `${area}:${tema.tema}` : ""),
    [area, tema]
  );

  const { rows, loading } = useResumosSubtemas(area, tema?.tema);
  const [localSearch, setLocalSearch] = useState("");
  const deferredSearch = useDeferredValue(localSearch);
  const [selectedResumo, setSelectedResumo] = useState<ResumoRow | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const { favoritos: favList, recentes: recList, refresh: refreshBase } = useResumosLocal();
  const favs = useMemo(() => favList.map((f) => f.id), [favList]);
  const recentesIds = useMemo(() => new Set(recList.map((r) => r.id)), [recList]);

  const refreshLocalState = () => {
    refreshBase();
    onProgressChange?.();
  };

  useEffect(() => {
    setLocalSearch("");
  }, [cacheKey]);

  // Fecha com Esc no desktop quando em modo gaveta e sem leitor/gate por cima
  useEffect(() => {
    if (!tema || inline) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !selectedResumo && !gateOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [tema, inline, selectedResumo, gateOpen, onClose]);

  const filteredRows = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) =>
      formatJuridicoTitle(r.subtema || r.tema).toLowerCase().includes(term)
    );
  }, [rows, deferredSearch]);

  const areaCurta = area.replace(/^DIREITO\s+(DO\s+|DA\s+|DE\s+)?/i, "");

  const bodyContent = tema ? (
    <>
      {!inline && (
        <div className="flex justify-center pt-2.5 pb-1 shrink-0 cursor-grab active:cursor-grabbing">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
      )}

      {/* Cabeçalho do tema selecionado */}
      <div className="flex items-start justify-between gap-3 px-4 sm:px-5 pt-3 pb-3.5 border-b border-white/10 shrink-0">
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
              {formatJuridicoTitle(tema.tema)}
            </h2>
          </div>
        </div>

        {!inline && (
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
        )}
      </div>

      {/* Busca interna quando há mais de 8 tópicos */}
      {rows.length > 8 && (
        <div className="px-4 sm:px-5 pt-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Filtrar tópicos deste tema..."
              className="w-full h-10 rounded-xl bg-zinc-900/90 border border-white/10 pl-9 pr-9 text-xs sm:text-[13px] text-white placeholder:text-zinc-500 outline-none focus:border-white/25"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => setLocalSearch("")}
                aria-label="Limpar filtro"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Lista minimalista de tópicos */}
      <div
        className={cn(
          "flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 py-3.5",
          !inline && "pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]"
        )}
      >
        {localSearch.trim() && (
          <div className="sr-only" aria-live="polite">
            {filteredRows.length} {filteredRows.length === 1 ? "tópico encontrado" : "tópicos encontrados"}
          </div>
        )}
        {loading && rows.length === 0 ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((sk) => (
              <div
                key={sk}
                className="h-[58px] rounded-2xl border border-white/5 bg-zinc-900/60 animate-pulse px-3.5 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-3/4 rounded bg-white/10" />
                  <div className="h-2.5 w-1/3 rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-400 gap-3">
            <FileText className="w-8 h-8 opacity-30" />
            <p className="text-sm font-medium">
              {localSearch
                ? `Nenhum tópico encontrado para "${localSearch}".`
                : "Nenhum tópico encontrado neste tema."}
            </p>
            {localSearch && (
              <button
                type="button"
                onClick={() => setLocalSearch("")}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition"
              >
                Limpar filtro
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRows.map((r) => {
              const originalIndex = rows.findIndex((item) => item.id === r.id);
              const numStr = String((originalIndex >= 0 ? originalIndex : 0) + 1).padStart(2, "0");
              const isFav = favs.includes(r.id);
              const isLido = recentesIds.has(r.id);
              const isLocked = !isPremium && originalIndex >= 2;

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
                      {formatJuridicoTitle(r.subtema || r.tema)}
                    </p>
                    {(isLido || isLocked || Boolean(r.markdown)) && (
                      <p className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1.5">
                        {isLocked ? (
                          <span className="text-amber-400/90 font-medium">
                            Exclusivo Prime
                          </span>
                        ) : (
                          <>
                            {isLido && <span>Lido</span>}
                            {Boolean(r.markdown) && (
                              <span className="text-emerald-400/80">
                                {isLido ? "• Offline" : "Offline"}
                              </span>
                            )}
                          </>
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
                          isFav ? "Remover dos favoritos" : "Salvar tópico"
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          haptic.selection();
                          const payload = {
                            id: r.id,
                            area: r.area,
                            tema: r.tema,
                            subtema: r.subtema,
                          };
                          const estavaFav = favs.includes(r.id);
                          resumosLocal.toggleFavorito(payload);
                          refreshLocalState();
                          if (estavaFav) {
                            toast("Removido dos favoritos", {
                              action: {
                                label: "Desfazer",
                                onClick: () => {
                                  resumosLocal.toggleFavorito(payload);
                                  refreshLocalState();
                                },
                              },
                            });
                          }
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
    </>
  ) : null;

  return (
    <>
      {inline ? (
        tema ? (
          <div className="rounded-3xl bg-[#111114] border border-white/10 shadow-2xl flex flex-col max-h-[calc(100dvh-13rem)] overflow-hidden">
            {bodyContent}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/10 bg-zinc-900/30 p-8 text-center text-zinc-400 flex flex-col items-center justify-center min-h-[280px]">
            <FileText className="w-8 h-8 opacity-30 mb-2.5" />
            <p className="text-sm font-semibold text-zinc-300">
              Selecione um tema ao lado
            </p>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs">
              Os tópicos do tema escolhido aparecerão aqui para leitura rápida.
            </p>
          </div>
        )
      ) : (
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

              {/* Gaveta minimalista com gesto de arrastar para baixo */}
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
                drag={prefersReducedMotion ? false : "y"}
                dragConstraints={{ top: 0 }}
                dragElastic={{ top: 0, bottom: 0.35 }}
                onDragEnd={(_ev, info) => {
                  if (info.offset.y > 90 || info.velocity.y > 500) {
                    haptic.selection();
                    onClose();
                  }
                }}
                className="relative z-10 w-full max-w-3xl mx-auto max-h-[85dvh] rounded-t-3xl bg-[#111114] border-t border-x border-white/10 shadow-[0_-20px_60px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden"
              >
                {bodyContent}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      )}

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
