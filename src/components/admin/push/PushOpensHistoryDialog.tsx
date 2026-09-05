import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, MousePointerClick } from "lucide-react";
import { toast } from "sonner";
import { OpenRow, JourneyStep, initialsFrom, colorFromId, normalizePlatform } from "./pushTypes";
import { PlatformBadge } from "./PushStatCard";

interface PushOpensHistoryDialogProps {
  open: boolean;
  onClose: () => void;
}

export function PushOpensHistoryDialog({ open, onClose }: PushOpensHistoryDialogProps) {
  const [rows, setRows] = useState<OpenRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [journey, setJourney] = useState<Record<string, { loading: boolean; steps: JourneyStep[] }>>({});

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase.rpc("admin_list_opens_recent");
      if (error && error.message.includes("could not find the function")) {
        // Fallback for when the migration hasn't propagated yet
        const res = await supabase.rpc("admin_list_opens_today");
        if (res.error) toast.error("Falha ao carregar aberturas: " + res.error.message);
        else setRows((res.data ?? []) as OpenRow[]);
        setLoading(false);
        return;
      }
      if (error) toast.error("Falha ao carregar aberturas: " + error.message);
      let list = ((data ?? []) as OpenRow[]).slice();

      // Fallback: for rows without platform, look up the most-recent device_token per user
      const missingUserIds = Array.from(new Set(
        list.filter((r) => !normalizePlatform(r.platform) && r.user_id).map((r) => r.user_id as string)
      ));
      if (missingUserIds.length > 0) {
        const { data: toks } = await supabase
          .from("device_tokens")
          .select("user_id, platform, created_at")
          .in("user_id", missingUserIds)
          .order("created_at", { ascending: false });
        const byUser = new Map<string, string>();
        for (const t of (toks ?? []) as any[]) {
          if (!byUser.has(t.user_id)) byUser.set(t.user_id, t.platform);
        }
        list = list.map((r) => {
          if (!normalizePlatform(r.platform) && r.user_id && byUser.has(r.user_id)) {
            return { ...r, platform: byUser.get(r.user_id) ?? r.platform };
          }
          return r;
        });
      }

      setRows(list);
      setLoading(false);
    })();
  }, [open]);

  async function toggle(row: OpenRow) {
    if (expanded === row.event_id) {
      setExpanded(null);
      return;
    }
    setExpanded(row.event_id);
    if (journey[row.event_id]) return;
    setJourney((j) => ({ ...j, [row.event_id]: { loading: true, steps: [] } }));
    const { data, error } = await supabase.rpc("admin_get_open_journey", {
      _campaign_id: row.campaign_id,
      _user_id: row.user_id,
      _install_id: row.install_id,
    });
    if (error) toast.error("Falha ao carregar jornada");
    setJourney((j) => ({ ...j, [row.event_id]: { loading: false, steps: (data ?? []) as JourneyStep[] } }));
  }

  const grouped = useMemo(() => {
    const map = new Map<string, { title: string; items: OpenRow[] }>();
    for (const r of rows) {
      const key = r.campaign_id ?? "sem-campanha";
      if (!map.has(key)) map.set(key, { title: r.campaign_title || "(sem título)", items: [] });
      map.get(key)!.items.push(r);
    }
    return Array.from(map.entries());
  }, [rows]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <MousePointerClick className="w-4 h-4 text-emerald-600" /> Aberturas (últimos 7 dias)
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        )}

        {!loading && rows.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">Nenhuma abertura registrada recentemente.</p>
        )}

        <div className="space-y-4">
          {grouped.map(([cid, group]) => (
            <div key={cid}>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2 flex items-center gap-2">
                <span className="truncate">{group.title}</span>
                <Badge variant="outline" className="text-[10px]">{group.items.length}</Badge>
              </div>
              <div className="space-y-1">
                {group.items.map((row) => {
                  const isOpen = expanded === row.event_id;
                  const j = journey[row.event_id];
                  const initials = initialsFrom(row.display_name, row.email);
                  const bg = colorFromId(row.user_id || row.install_id);
                  const nameLabel = row.display_name && row.display_name !== "—"
                    ? row.display_name
                    : row.email || (row.install_id ? `install ${row.install_id.slice(0, 6)}…` : "Anônimo");
                  return (
                    <div key={row.event_id} className="rounded-lg border border-border/60 bg-card">
                      <button
                        type="button"
                        onClick={() => toggle(row)}
                        className="w-full flex items-center gap-3 p-2.5 text-left hover:bg-muted/40 rounded-lg"
                      >
                        <div
                          className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                          style={{ background: bg }}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{nameLabel}</div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {row.email && row.display_name && row.display_name !== "—" ? row.email : row.user_id ? row.user_id.slice(0, 8) + "…" : "sessão anônima"}
                          </div>
                          <div className="mt-1">
                            <PlatformBadge platform={row.platform} />
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[11px] font-mono">
                            {(() => {
                              const d = new Date(row.opened_at);
                              const isToday = new Date().toDateString() === d.toDateString();
                              const timeStr = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false });
                              return isToday ? `Hoje, ${timeStr}` : `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}, ${timeStr}`;
                            })()}
                          </div>
                        </div>
                      </button>

                      {isOpen && (
                        <div className="border-t border-border/50 px-3 py-2 bg-muted/20 rounded-b-lg">
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                            Jornada após o clique
                          </div>
                          {j?.loading && <Loader2 className="w-4 h-4 animate-spin" />}
                          {j && !j.loading && j.steps.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                              Nenhuma rota registrada. (a jornada só é gravada em aberturas feitas depois desta atualização)
                            </p>
                          )}
                          {j && !j.loading && j.steps.length > 0 && (
                            <ol className="relative border-l border-emerald-500/40 ml-2 space-y-2 pl-4 py-1">
                              {j.steps.map((s, i) => {
                                const prev = i > 0 ? new Date(j.steps[i - 1].at).getTime() : new Date(row.opened_at).getTime();
                                const delta = Math.max(0, Math.round((new Date(s.at).getTime() - prev) / 1000));
                                return (
                                  <li key={i} className="relative">
                                    <span className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
                                    <div className="text-xs font-mono truncate">{s.route}</div>
                                    {s.title && <div className="text-[11px] text-muted-foreground truncate">{s.title}</div>}
                                    <div className="text-[10px] text-muted-foreground">+{delta}s</div>
                                  </li>
                                );
                              })}
                            </ol>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
