import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/vademecum/PageHeader";
import {
  BellRing,
  MapPin,
  BookOpen,
  ListChecks,
  Scale,
  ChevronRight,
  BellOff,
  Loader2,
  Clock,
  Plus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type Item = {
  id: string;
  grupo: string;
  titulo: string;
  detalhe: string;
  horario?: string;
  ativo: boolean;
  rota: string;
};

const GRUPOS: Record<
  string,
  { label: string; icon: LucideIcon; cor: string; rota: string; desc: string }
> = {
  estudo: { label: "Estudo diário", icon: BellRing, cor: "#F59E0B", rota: "/ajustes/lembretes", desc: "Alarmes de estudo" },
  local: { label: "Geolocalização", icon: MapPin, cor: "#22C55E", rota: "/lembretes/local", desc: "Lembretes por local" },
  leitura: { label: "Leitura", icon: BookOpen, cor: "#3B82F6", rota: "/meus-lembretes", desc: "Livros e biblioteca" },
  questoes: { label: "Questões", icon: ListChecks, cor: "#EC4899", rota: "/questoes/lembretes", desc: "Metas diárias" },
  leiseca: { label: "Lei Seca", icon: Scale, cor: "#F97316", rota: "/lei-seca/lembretes", desc: "Prática da lei seca" },
};

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function fmtDias(dias?: number[] | null) {
  if (!dias?.length) return "Todos os dias";
  if (dias.length === 7) return "Todos os dias";
  return dias.map((d) => DIAS[d] ?? "").filter(Boolean).join(", ");
}

export default function CentralLembretes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [itens, setItens] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"todos" | "ativos" | "inativos">("todos");
  const [criarAberto, setCriarAberto] = useState(false);

  useEffect(() => {
    let vivo = true;
    if (!user?.id) {
      setLoading(false);
      return;
    }
    (async () => {
      const uid = user.id;
      const [est, loc, lei, que, ls] = await Promise.all([
        supabase.from("user_reminders").select("*").eq("user_id", uid),
        supabase.from("location_reminders").select("*").eq("user_id", uid),
        supabase.from("reading_reminders").select("*").eq("user_id", uid),
        supabase.from("questoes_lembretes").select("*").eq("user_id", uid),
        supabase.from("lei_seca_lembretes").select("*").eq("user_id", uid).maybeSingle(),
      ]);

      const out: Item[] = [];

      (est.data ?? []).forEach((r: any) => {
        out.push({
          id: `est-${r.id}`,
          grupo: "estudo",
          titulo: "Lembrete de estudo",
          detalhe: fmtDias(r.dias),
          horario: (r.horario ?? "").slice(0, 5),
          ativo: !!r.ativo,
          rota: "/ajustes/lembretes",
        });
      });

      (loc.data ?? []).forEach((r: any) => {
        out.push({
          id: `loc-${r.id}`,
          grupo: "local",
          titulo: r.label || "Lembrete por local",
          detalhe: [r.address, r.radius_m ? `raio ${r.radius_m}m` : null].filter(Boolean).join(" · ") || "Sem endereço",
          ativo: !!r.active,
          rota: "/lembretes/local",
        });
      });

      (lei.data ?? []).forEach((r: any) => {
        out.push({
          id: `lei-${r.id}`,
          grupo: "leitura",
          titulo: r.title || r.livro_titulo || "Lembrete de leitura",
          detalhe: fmtDias(r.days_of_week),
          horario: (r.time_of_day ?? "").slice(0, 5),
          ativo: !!r.enabled,
          rota: "/meus-lembretes",
        });
      });

      (que.data ?? []).forEach((r: any) => {
        out.push({
          id: `que-${r.id}`,
          grupo: "questoes",
          titulo: `Meta de ${r.meta_questoes ?? 10} questões`,
          detalhe: fmtDias(r.dias),
          horario: (r.horario ?? "").slice(0, 5),
          ativo: !!r.ativo,
          rota: "/questoes/lembretes",
        });
      });

      if (ls.data) {
        const d: any = ls.data;
        if (d.diario_ativo !== null && d.diario_ativo !== undefined) {
          out.push({
            id: "ls-diario",
            grupo: "leiseca",
            titulo: "Prática diária da Lei Seca",
            detalhe: "Lembrete diário",
            horario: (d.diario_hora ?? "").slice(0, 5),
            ativo: !!d.diario_ativo,
            rota: "/lei-seca/lembretes",
          });
        }
        if (d.retomada_ativa) {
          out.push({
            id: "ls-retomada",
            grupo: "leiseca",
            titulo: "Retomar de onde parei",
            detalhe: d.ultima_trilha ? `Última lei: ${d.ultima_trilha}` : "Lei Seca",
            ativo: true,
            rota: "/lei-seca/lembretes",
          });
        }
      }

      if (vivo) {
        setItens(out);
        setLoading(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [user?.id]);

  const visiveis = useMemo(
    () => itens.filter((i) => (filtro === "todos" ? true : filtro === "ativos" ? i.ativo : !i.ativo)),
    [itens, filtro]
  );

  const porGrupo = useMemo(() => {
    const m = new Map<string, Item[]>();
    visiveis.forEach((i) => {
      const arr = m.get(i.grupo) ?? [];
      arr.push(i);
      m.set(i.grupo, arr);
    });
    return Array.from(m.entries());
  }, [visiveis]);

  const totalAtivos = itens.filter((i) => i.ativo).length;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Lembretes"
        subtitle={
          loading
            ? "Carregando seus lembretes…"
            : `${totalAtivos} ativo${totalAtivos === 1 ? "" : "s"} de ${itens.length} no total`
        }
        onBack={() => navigate("/", { replace: true })}
      />

      <div className="max-w-3xl mx-auto px-4 py-5">
        <div className="grid grid-cols-3 gap-2 mb-5">
          {(["todos", "ativos", "inativos"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={cn(
                "h-10 rounded-xl text-[12.5px] font-semibold capitalize border transition",
                filtro === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border/60"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 grid place-items-center text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>
        ) : porGrupo.length === 0 ? (
          <div className="py-10 text-center">
            <BellOff className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-body text-foreground font-semibold">Nenhum lembrete por aqui</p>
            <p className="text-[13px] text-muted-foreground mt-1 mb-5">
              Crie lembretes de estudo, leitura, questões ou por localização.
            </p>
            <div className="space-y-2.5 text-left">
              {Object.entries(GRUPOS).map(([k, g]) => {
                const Icon = g.icon;
                return (
                  <button
                    key={k}
                    onClick={() => navigate(g.rota)}
                    className="w-full min-h-[76px] flex items-center gap-3 px-4 rounded-2xl bg-card border border-border/60 active:scale-[0.99] transition"
                  >
                    <Icon className="w-7 h-7 shrink-0" style={{ color: g.cor }} strokeWidth={1.3} />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-body text-foreground text-[15px] font-semibold">{g.label}</p>
                      <p className="text-[12px] text-muted-foreground">{g.desc}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-6 pb-28">
            {porGrupo.map(([grupo, lista]) => {
              const g = GRUPOS[grupo];
              const Icon = g.icon;
              return (
                <section key={grupo}>
                  <div className="flex items-center gap-2 mb-2.5 px-1">
                    <Icon className="w-5 h-5 shrink-0" style={{ color: g.cor }} strokeWidth={1.6} />
                    <h2 className="font-body text-foreground text-[15px] font-bold truncate">{g.label}</h2>
                    <span className="text-[11px] text-muted-foreground shrink-0">({lista.length})</span>
                    <button
                      onClick={() => navigate(g.rota)}
                      className="ml-auto shrink-0 text-[12px] font-semibold text-primary"
                    >
                      Gerenciar
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {lista.map((i) => (
                      <button
                        key={i.id}
                        onClick={() => navigate(i.rota)}
                        className="w-full min-h-[76px] flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border/60 active:scale-[0.99] transition text-left"
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ background: i.ativo ? "hsl(142 70% 45%)" : "hsl(var(--muted-foreground))" }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-foreground text-[15px] font-semibold leading-tight truncate">
                            {i.titulo}
                          </p>
                          <p className="text-[12px] text-muted-foreground mt-1 truncate">{i.detalhe}</p>
                          {i.horario && (
                            <span className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold text-foreground tabular-nums">
                              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                              {i.horario}
                            </span>
                          )}
                        </div>
                        <span
                          className={cn(
                            "shrink-0 text-[10.5px] font-semibold px-2 py-0.5 rounded-full border",
                            i.ativo
                              ? "bg-primary/15 text-primary border-primary/25"
                              : "bg-muted text-muted-foreground border-border"
                          )}
                        >
                          {i.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <button
        onClick={() => setCriarAberto(true)}
        aria-label="Novo lembrete"
        className="fixed right-5 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 grid place-items-center active:scale-95 transition"
        style={{ bottom: "calc(1.25rem + var(--sai-bottom, env(safe-area-inset-bottom, 0px)))" }}
      >
        <Plus className="h-7 w-7" />
      </button>

      <Sheet open={criarAberto} onOpenChange={setCriarAberto}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="text-left">
            <SheetTitle>Novo lembrete</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-2.5 pb-4">
            {Object.entries(GRUPOS).map(([k, g]) => {
              const Icon = g.icon;
              return (
                <button
                  key={k}
                  onClick={() => {
                    setCriarAberto(false);
                    navigate(g.rota);
                  }}
                  className="w-full min-h-[72px] flex items-center gap-3 px-4 rounded-2xl bg-card border border-border/60 active:scale-[0.99] transition text-left"
                >
                  <Icon className="w-7 h-7 shrink-0" style={{ color: g.cor }} strokeWidth={1.3} />
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-foreground text-[15px] font-semibold">{g.label}</p>
                    <p className="text-[12px] text-muted-foreground">{g.desc}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
