import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { listarTrilhas } from "@/lib/leiSeca";
import { persistedInitial, savePersisted } from "@/lib/queryPersist";
import { useEffect } from "react";
import { prefetchHandlers, prefetchTrilha } from "@/lib/leiSecaPrefetch";
import { BookOpen, Sparkles, Trophy, Star, ChevronRight, Heart, Clock, LayoutGrid, Check, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeiSecaResumoGlobal } from "@/hooks/useLeiSecaResumoGlobal";
import { useLeiSecaFavoritos } from "@/hooks/useLeiSecaFavoritos";
import { useLeiSecaRecentes } from "@/hooks/useLeiSecaRecentes";
import { getLeiSecaIcon } from "@/components/lei-seca/LeiSecaTrilhaIcons";
import { LEI_SECA_MATERIAS, getMateriaByTrilha, corIcone, type LeiSecaMateria } from "@/lib/leiSecaMaterias";
import { LeiSecaMateriaSheet } from "@/components/lei-seca/LeiSecaMateriaSheet";
import { cn } from "@/lib/utils";
import LeiSecaBottomNav from "@/components/lei-seca/LeiSecaBottomNav";

type Filtro = "todos" | "recentes" | "favoritos";


export default function LeiSecaIndex({ modo = "todos" }: { modo?: Filtro }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: trilhas, isLoading } = useQuery({
    queryKey: ["lei-seca-trilhas"],
    queryFn: listarTrilhas,
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    ...persistedInitial<Awaited<ReturnType<typeof listarTrilhas>>>("lei-seca-trilhas"),
  });
  useEffect(() => { if (trilhas) savePersisted("lei-seca-trilhas", trilhas); }, [trilhas]);
  const { data: resumo } = useLeiSecaResumoGlobal();
  const { favoritos, isFav, toggle } = useLeiSecaFavoritos();
  const { data: recentes } = useLeiSecaRecentes();
  const filtro: Filtro = modo;
  const [materiaAberta, setMateriaAberta] = useState<LeiSecaMateria | null>(null);



  const pctGlobal = resumo?.pctGlobal ?? 0;

  // Trilhas mapeadas por slug
  const trilhasMap = useMemo(() => new Map((trilhas ?? []).map((t) => [t.slug, t])), [trilhas]);

  // Lista plana p/ filtros Recentes/Favoritos
  const listaRecentes = useMemo(
    () => (recentes ?? []).map((s) => trilhasMap.get(s)).filter(Boolean) as NonNullable<ReturnType<typeof trilhasMap.get>>[],
    [recentes, trilhasMap]
  );
  const listaFavoritos = useMemo(
    () =>
      Array.from(favoritos)
        .map((s) => trilhasMap.get(s))
        .filter(Boolean) as NonNullable<ReturnType<typeof trilhasMap.get>>[],
    [favoritos, trilhasMap]
  );

  // Matérias com pelo menos uma trilha existente
  const materias = useMemo(
    () =>
      LEI_SECA_MATERIAS.map((m) => ({
        ...m,
        disponiveis: m.trilhas.filter((s) => trilhasMap.has(s)).length,
      })).filter((m) => m.disponiveis > 0),
    [trilhasMap]
  );

  return (
    <div className="min-h-screen bg-background animate-ls-enter">



      {/* HERO PAINEL */}
      <section
        className="w-full text-white px-4 pt-5 pb-6"
        style={{ background: "radial-gradient(120% 90% at 0% 0%, #4c1d95 0%, #2e1065 45%, #0f0a1f 100%)" }}
      >
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate("/", { replace: true })}
            aria-label="Voltar"
            className="w-10 h-10 rounded-full bg-white/15 ring-1 ring-white/25 backdrop-blur-sm flex items-center justify-center text-white mb-3 active:scale-95 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-white/70 mb-1">
            <Sparkles className="h-3 w-3" /> Lei Seca · seu painel
          </div>

          <h1 className="font-semibold text-[22px] sm:text-2xl tracking-tight leading-[1.05] drop-shadow">
            Domine o texto da lei
          </h1>
          <p className="text-[12.5px] text-white/70 mt-0.5">
            {resumo
              ? `${resumo.totalConcluidas}/${resumo.totalLicoes} lições · ${resumo.totalEstrelas} estrelas`
              : "Carregando seu progresso…"}
          </p>

          <div className="mt-4 flex items-center gap-4">
            <div className="relative h-[88px] w-[88px] shrink-0">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="9" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke="url(#leiSecaRing)" strokeWidth="9" strokeLinecap="round"
                  strokeDasharray={`${(2 * Math.PI * 42 * pctGlobal) / 100} ${2 * Math.PI * 42}`}
                  className="transition-[stroke-dasharray] duration-700"
                />
                <defs>
                  <linearGradient id="leiSecaRing" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#c4b5fd" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 grid place-items-center text-center">
                {pctGlobal === 100 ? (
                  <Trophy className="h-7 w-7 text-amber-300 drop-shadow" />
                ) : (
                  <div className="leading-none">
                    <p className="font-black text-[22px] tabular-nums">{pctGlobal}<span className="text-[10px] align-top ml-0.5 opacity-80">%</span></p>
                    <p className="text-[8px] uppercase tracking-[0.2em] text-white/70 font-bold mt-0.5">Progresso</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 grid grid-cols-3 gap-2">
              <MiniStat label="Matérias" valor={materias.length} />
              <MiniStat label="Leis" valor={trilhas?.length ?? 0} />
              <MiniStat label="Estrelas" valor={resumo?.totalEstrelas ?? 0} icon={<Star className="h-3 w-3 fill-amber-300 text-amber-300" />} />
            </div>
          </div>
        </div>
      </section>

      {/* TEXTO PERSUASIVO */}
      <div className="max-w-5xl mx-auto px-4 pt-7 pb-1">
        <p className="text-center text-[13px] sm:text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          A Lei Seca transforma cada artigo em desafios rápidos. Escolha uma matéria, abra as leis e ganhe estrelas a cada acerto.
        </p>
      </div>

      {/* CONTEÚDO */}
      <div className="max-w-5xl mx-auto px-4 py-5 pb-32">

        {filtro === "todos" && (
          <>
            <SectionLabel icon={<BookOpen className="h-4 w-4 text-violet-500" />} label="Matérias" />
            <div className="space-y-2.5">
              {isLoading && Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[78px] rounded-2xl" />)}
              {!isLoading &&
                materias.map((m, idx) => {
                  const prefetchMateria = () => {
                    // Prefetcha as primeiras 4 trilhas da matéria — suficiente p/ a sheet abrir cheia.
                    m.trilhas.slice(0, 4).forEach((s) => trilhasMap.has(s) && prefetchTrilha(qc, s));
                  };
                  return (
                    <button
                      key={m.slug}
                      onPointerDown={prefetchMateria}
                      onMouseEnter={prefetchMateria}
                      onTouchStart={prefetchMateria}
                      onFocus={prefetchMateria}
                      onClick={() => setMateriaAberta(m)}
                      style={{ animationDelay: `${Math.min(idx, 8) * 24}ms` }}
                      className="w-full h-[78px] rounded-2xl bg-card border border-border/60 hover:border-violet-500/40 hover:bg-card/80 hover:shadow-md transition-all flex items-center gap-3 px-3.5 text-left group active:scale-[0.985] animate-stagger-in"
                    >
                      <div className="h-12 w-12 grid place-items-center shrink-0" style={{ color: corIcone(m.cor), filter: "saturate(1.3) brightness(1.1)" }}>
                        <m.icone width={30} height={30} strokeWidth={1.9} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[15px] leading-tight truncate text-foreground">{m.nome}</div>
                        <p className="text-[11.5px] text-muted-foreground mt-0.5 truncate">{m.descricao}</p>
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-violet-500/80 mt-1">
                          {m.disponiveis} {m.disponiveis === 1 ? "lei" : "leis"}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  );
                })}

            </div>
          </>
        )}

        {filtro === "recentes" && (
          <>
            <SectionLabel icon={<Clock className="h-4 w-4 text-violet-500" />} label="Recentes" />
            {listaRecentes.length === 0 ? (
              <EstadoVazio
                icon={<Clock className="h-7 w-7 text-violet-500/70" />}
                titulo="Sem atividades ainda"
                texto="Comece uma trilha para ela aparecer aqui."
              />
            ) : (
              <ListaLeis trilhas={listaRecentes} resumo={resumo} isFav={isFav} toggle={toggle} onOpen={(slug) => navigate(`/lei-seca/${slug}`)} />
            )}
          </>
        )}

        {filtro === "favoritos" && (
          <>
            <SectionLabel icon={<Heart className="h-4 w-4 text-rose-500" />} label="Favoritos" />
            {listaFavoritos.length === 0 ? (
              <EstadoVazio
                icon={<Heart className="h-7 w-7 text-rose-500/70" />}
                titulo="Nenhum favorito"
                texto="Toque no ♡ ao lado de qualquer lei para favoritar."
              />
            ) : (
              <ListaLeis trilhas={listaFavoritos} resumo={resumo} isFav={isFav} toggle={toggle} onOpen={(slug) => navigate(`/lei-seca/${slug}`)} />
            )}
          </>
        )}
      </div>

      <LeiSecaMateriaSheet
        open={!!materiaAberta}
        onOpenChange={(v) => !v && setMateriaAberta(null)}
        materia={materiaAberta}
        trilhas={trilhas ?? []}
        resumo={resumo}
      />

      <LeiSecaBottomNav />
    </div>

  );
}

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-1">
      {icon}
      <h2 className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">{label}</h2>
    </div>
  );
}

function MiniStat({ label, valor, sub, icon }: { label: string; valor: number | string; sub?: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/[0.06] border border-white/10 px-2.5 py-2 backdrop-blur-sm">
      <div className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-white/65">
        {icon} {label}
      </div>
      <div className="mt-0.5 flex items-baseline gap-0.5">
        <span className="font-black text-base tabular-nums leading-none">{valor}</span>
        {sub && <span className="text-[10px] text-white/55 font-bold">{sub}</span>}
      </div>
    </div>
  );
}

function FiltroPill({ ativo, onClick, icon, label, badge }: { ativo: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full text-[12.5px] font-bold transition-all",
        ativo
          ? "bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-md"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      {label}
      {badge !== undefined && badge > 0 && (
        <span className={cn("ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-extrabold", ativo ? "bg-white/25" : "bg-violet-500/15 text-violet-500")}>
          {badge}
        </span>
      )}
    </button>
  );
}

function EstadoVazio({ icon, titulo, texto }: { icon: React.ReactNode; titulo: string; texto: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 px-6 py-10 grid place-items-center text-center">
      <div className="h-14 w-14 rounded-full bg-violet-500/10 grid place-items-center mb-3">{icon}</div>
      <p className="font-bold text-[15px] text-foreground">{titulo}</p>
      <p className="text-[12.5px] text-muted-foreground mt-1 max-w-xs">{texto}</p>
    </div>
  );
}

function ListaLeis({
  trilhas,
  resumo,
  isFav,
  toggle,
  onOpen,
}: {
  trilhas: any[];
  resumo: ReturnType<typeof useLeiSecaResumoGlobal>["data"];
  isFav: (s: string) => boolean;
  toggle: (s: string) => void;
  onOpen: (slug: string) => void;
}) {
  const qc = useQueryClient();
  return (
    <div className="space-y-2.5">
      {trilhas.map((t: any) => {
        const r = resumo?.porTrilha.get(t.slug);
        const pct = r?.pct ?? 0;
        const concluido = pct === 100 && (r?.total ?? 0) > 0;
        const Icon = getLeiSecaIcon(t.slug);
        const fav = isFav(t.slug);
        const materia = getMateriaByTrilha(t.slug);
        const handlers = prefetchHandlers(qc, t.slug);
        return (
          <div key={t.id} className="h-[80px] rounded-2xl bg-card border border-border/60 hover:border-violet-500/40 transition-all flex items-center gap-3 px-3.5 group animate-stagger-in">
            <button {...handlers} onClick={() => onOpen(t.slug)} className="flex-1 flex items-center gap-3 text-left min-w-0 active:scale-[0.99]">

              <div className="h-11 w-11 grid place-items-center shrink-0" style={{ color: corIcone(materia?.cor), filter: "saturate(1.3) brightness(1.1)" }}>
                <Icon width={28} height={28} strokeWidth={1.9} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-violet-500/90">{t.sigla}</span>
                  {materia && <span className="text-[9.5px] text-muted-foreground/80 font-bold">· {materia.nome}</span>}
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
                  <span className="text-[10px] font-bold tabular-nums text-muted-foreground shrink-0">
                    {r ? `${r.concluidas}/${r.total}` : `${t.partes.length}p`}
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
              className="h-9 w-9 rounded-full grid place-items-center hover:bg-rose-500/10 transition-colors shrink-0"
              aria-label={fav ? "Desfavoritar" : "Favoritar"}
            >
              <Heart className={cn("h-[18px] w-[18px] transition-all", fav ? "fill-rose-500 text-rose-500 scale-110" : "text-muted-foreground/60")} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
