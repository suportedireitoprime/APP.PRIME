import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PushCronogramaReportSheetProps {
  type: "enviadas" | "abertas" | "entregues" | "falhas" | null;
  date: Date;
  onClose: () => void;
}

export function PushCronogramaReportSheet({ type, date, onClose }: PushCronogramaReportSheetProps) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (!type) return;
    setLoading(true);
    (async () => {
      const inicio = new Date(date);
      inicio.setHours(0, 0, 0, 0);
      const fim = new Date(date);
      fim.setHours(23, 59, 59, 999);

      let eventFilter = "";
      if (type === "enviadas") eventFilter = "sent";
      else if (type === "abertas") eventFilter = "opened";
      else if (type === "entregues") eventFilter = "delivered";
      else if (type === "falhas") eventFilter = "failed";

      const { data, error } = await supabase
        .from("push_events")
        .select("id, user_id, campaign_id, platform, event_type, error, created_at, metadata")
        .eq("event_type", eventFilter)
        .gte("created_at", inicio.toISOString())
        .lte("created_at", fim.toISOString())
        .order("created_at", { ascending: false })
        .limit(300);

      if (error) toast.error(error.message);

      let list = data ?? [];

      // Deduplica eventos para a mesma campanha e usuário (evita duplicatas na UI se o usuário tiver múltiplos tokens FCM)
      const uniqueKeys = new Set();
      list = list.filter((item) => {
        if (!item.campaign_id || !item.user_id) return true;
        const k = `${item.campaign_id}-${item.user_id}`;
        if (uniqueKeys.has(k)) return false;
        uniqueKeys.add(k);
        return true;
      });

      if (type === "abertas") {
        // Buscar jornadas de abertura para calcular rotas e tempo em tela
        const campaignIds = Array.from(new Set(list.filter((x) => x.campaign_id).map((x) => x.campaign_id)));
        if (campaignIds.length > 0) {
          const { data: journeys } = await supabase
            .from("push_open_journey")
            .select("campaign_id, user_id, route, created_at")
            .in("campaign_id", campaignIds)
            .gte("created_at", inicio.toISOString())
            .lte("created_at", fim.toISOString())
            .order("created_at", { ascending: true });

          if (journeys && journeys.length > 0) {
            list.forEach((item) => {
              const j = journeys.filter((x) => x.campaign_id === item.campaign_id && x.user_id === item.user_id);
              if (j.length > 0) {
                const first = new Date(j[0].created_at).getTime();
                const last = new Date(j[j.length - 1].created_at).getTime();
                const timeS = Math.round((last - first) / 1000);
                const routes = Array.from(new Set(j.map((x) => x.route?.split("?")[0] || ""))).filter(Boolean);
                if (!item.metadata) item.metadata = {};
                item.metadata.time_on_screen = timeS;
                item.metadata.routes = routes;
              }
            });
          }
        }
      }

      const userIds = Array.from(new Set(list.filter((x) => x.user_id).map((x) => x.user_id)));
      if (userIds.length > 0) {
        const [{ data: profs }, { data: acts }] = await Promise.all([
          supabase.from("profiles").select("id, display_name, avatar_url").in("id", userIds),
          supabase.from("user_activity_log").select("user_id, email, display_name").in("user_id", userIds),
        ]);

        const pMap = new Map(profs?.map((p) => [p.id, p]) ?? []);
        const actMap = new Map(acts?.map((a) => [a.user_id, a]) ?? []);

        list.forEach((item) => {
          const p = pMap.get(item.user_id);
          const act = actMap.get(item.user_id);

          let n = p?.display_name;
          if (!n && act?.display_name) n = act.display_name;
          if (!n && act?.email) n = act.email.split("@")[0];

          (item as any).display_name = n;
          (item as any).email = act?.email;
          (item as any).avatar_url = p?.avatar_url;
        });
      }

      setRows(list);
      setLoading(false);
    })();
  }, [type, date]);

  const titles = {
    enviadas: "Disparos Realizados pelo App",
    abertas: "Notificações Abertas pelos Usuários",
    entregues: "Confirmações de Entrega FCM",
    falhas: "Relatório Detalhado de Falhas & Rejeições",
  };

  return (
    <Sheet open={!!type} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-border/80 bg-background/95 backdrop-blur-xl"
      >
        <SheetHeader>
          <SheetTitle className="text-base">{type ? titles[type] : ""}</SheetTitle>
          <SheetDescription>Histórico e diagnóstico dos eventos em {date.toLocaleDateString("pt-BR")}</SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-2 mt-4 pb-12">
            {rows.length === 0 && (
              <div className="text-center py-8 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
                <p className="text-muted-foreground text-sm font-medium">
                  Nenhum evento desta categoria registrado para este dia.
                </p>
              </div>
            )}
            {rows.map((r, i) => (
              <div
                key={i}
                className={`p-3.5 border rounded-xl bg-card/80 text-sm flex flex-col gap-1.5 transition-all ${
                  type === "falhas" ? "border-red-500/30 bg-red-500/5" : "border-border/70"
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {r.avatar_url ? (
                      <img src={r.avatar_url} alt={r.display_name || "Usuário"} className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-border/50" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-secondary text-muted-foreground flex items-center justify-center font-bold text-[11px] shrink-0 ring-1 ring-border/50 uppercase">
                        {r.display_name ? r.display_name.slice(0, 2) : (r.user_id ? "US" : "?")}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-foreground truncate text-[13px] leading-tight">
                        {r.display_name || (r.user_id ? "Usuário Sem Nome" : "Aparelho Anônimo")}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                        {r.email || (r.user_id ? "Sem e-mail" : "Não autenticado")}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-mono shrink-0">
                    {new Date(r.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                  <span className="capitalize px-2 py-0.5 rounded-md bg-secondary text-[10px] font-bold text-foreground shrink-0">
                    {r.platform || "android"}
                  </span>
                  {type === "falhas" && (
                    <span className="text-red-400 font-mono text-xs truncate text-right flex-1 ml-2 font-medium">
                      {r.error || "Token inválido ou notificação desabilitada"}
                    </span>
                  )}
                  {type === "abertas" && (
                    <span
                      className={`flex items-center justify-end gap-1 font-medium ml-2 truncate flex-1 text-right ${
                        r.metadata?.time_on_screen ? "text-emerald-400" : "text-muted-foreground"
                      }`}
                    >
                      <Clock className="w-3 h-3 shrink-0" />
                      <span className="truncate">
                        {r.metadata?.time_on_screen ? `+${r.metadata.time_on_screen}s em tela` : "Saiu logo em seguida"}
                      </span>
                    </span>
                  )}
                </div>

                {type === "abertas" && r.metadata?.routes && r.metadata.routes.length > 0 && (
                  <div className="mt-2 text-[10.5px] text-muted-foreground flex items-center gap-1.5 flex-wrap px-1">
                    <span className="font-semibold text-foreground/80">Jornada:</span>
                    {r.metadata.routes.map((route: string, idx: number) => (
                      <React.Fragment key={idx}>
                        {idx > 0 && <span className="text-muted-foreground/40">➔</span>}
                        <span className="bg-background/50 px-1.5 py-0.5 rounded border border-border/50 text-[10px] font-mono">
                          {route === "/" ? "Início" : route.replace("/", "")}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
