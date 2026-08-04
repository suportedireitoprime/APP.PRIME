import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Heart, Star, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeiSecaTrilha } from "@/lib/leiSeca";
import { corIcone, type LeiSecaMateria } from "@/lib/leiSecaMaterias";
import type { ResumoGlobal } from "@/hooks/useLeiSecaResumoGlobal";
import { getLeiSecaIcon } from "@/components/lei-seca/LeiSecaTrilhaIcons";
import { useLeiSecaFavoritos } from "@/hooks/useLeiSecaFavoritos";
import { prefetchHandlers, prefetchTrilha } from "@/lib/leiSecaPrefetch";
import { useEffect } from "react";


interface Props {
  materia: LeiSecaMateria | null;
  trilhas: LeiSecaTrilha[];
  resumo: ResumoGlobal | undefined;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function LeiSecaMateriaSheet({ materia, trilhas, resumo, open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isFav, toggle } = useLeiSecaFavoritos();

  const trilhasMap = new Map(trilhas.map((t) => [t.slug, t]));
  const lista = materia?.trilhas.map((slug) => trilhasMap.get(slug)).filter(Boolean) as LeiSecaTrilha[] | undefined;

  // Quando a sheet abre, prefetcha todas as leis dela em paralelo.
  useEffect(() => {
    if (!open || !lista) return;
    lista.forEach((t) => prefetchTrilha(qc, t.slug));
  }, [open, lista, qc]);



  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-t border-violet-500/20 max-h-[85vh] flex flex-col bg-card p-0"
      >
        {materia && (
          <>
            <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 grid place-items-center" style={{ color: corIcone(materia.cor), filter: "saturate(1.3) brightness(1.1)" }}>
                  <materia.icone width={30} height={30} strokeWidth={1.9} />
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <SheetTitle className="text-[17px] leading-tight">{materia.nome}</SheetTitle>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    {lista?.length ?? 0} {(lista?.length ?? 0) === 1 ? "lei" : "leis"} · toque para começar
                  </p>
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-4 py-4 pb-[calc(1.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] grid grid-cols-1 md:grid-cols-2 gap-3">
              {lista?.map((t, idx) => {
                const r = resumo?.porTrilha.get(t.slug);
                const pct = r?.pct ?? 0;
                const concluido = pct === 100 && (r?.total ?? 0) > 0;
                const Icon = getLeiSecaIcon(t.slug);
                const fav = isFav(t.slug);
                const handlers = prefetchHandlers(qc, t.slug);
                return (
                  <div
                    key={t.id}
                    style={{ animationDelay: `${Math.min(idx, 6) * 28}ms` }}
                    className="min-h-[80px] h-auto py-3.5 rounded-2xl bg-background border border-border/60 hover:border-violet-500/40 transition-all flex items-center gap-3 px-3.5 group animate-stagger-in touch-manipulation"
                  >
                    <button
                      {...handlers}
                      onClick={() => {
                        onOpenChange(false);
                        navigate(`/lei-seca/${t.slug}`);
                      }}
                      className="flex-1 flex items-center gap-3 text-left min-w-0 active:scale-[0.99] touch-manipulation"
                    >
                      <div className="h-11 w-11 grid place-items-center shrink-0" style={{ color: corIcone(materia.cor), filter: "saturate(1.3) brightness(1.1)" }}>
                        <Icon width={28} height={28} strokeWidth={1.9} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-violet-500/90">{t.sigla}</span>
                          {concluido && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5">
                              <Check className="h-2.5 w-2.5" strokeWidth={4} /> Concluído
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-[14px] leading-tight truncate text-foreground">{t.nome}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-violet-400 to-violet-600 transition-[width] duration-700"
                              style={{ width: `${Math.max(pct === 0 ? 0 : 4, pct)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold tabular-nums text-muted-foreground shrink-0 inline-flex items-center gap-0.5">
                            {r ? `${r.concluidas}/${r.total}` : `${t.partes.length}p`}
                            {r && r.estrelas > 0 && (
                              <>
                                <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400 ml-1" /> {r.estrelas}
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-violet-500 transition-all shrink-0" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(t.slug);
                      }}
                      className="h-10 w-10 min-h-[40px] rounded-full grid place-items-center hover:bg-rose-500/10 active:scale-90 transition-all shrink-0 touch-manipulation"
                      aria-label={fav ? "Desfavoritar" : "Favoritar"}
                    >
                      <Heart
                        className={cn(
                          "h-[18px] w-[18px] transition-all",
                          fav ? "fill-rose-500 text-rose-500 scale-110" : "text-muted-foreground/60"
                        )}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
