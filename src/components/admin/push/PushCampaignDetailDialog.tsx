import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, MousePointerClick } from "lucide-react";
import { Campaign } from "./pushTypes";
import { Metric } from "./PushStatCard";

interface PushCampaignDetailDialogProps {
  campaign: Campaign | null;
  onClose: () => void;
}

export function PushCampaignDetailDialog({ campaign, onClose }: PushCampaignDetailDialogProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { name: string; email: string }>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!campaign) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("push_events")
        .select("id, event_type, user_id, platform, error, created_at, metadata")
        .eq("campaign_id", campaign.id)
        .order("created_at", { ascending: false })
        .limit(500);
      const evts = data ?? [];
      setEvents(evts);
      const ids = Array.from(new Set(evts.map((e: any) => e.user_id).filter(Boolean)));
      if (ids.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", ids);
        const map: Record<string, { name: string; email: string }> = {};
        (profs ?? []).forEach((p: any) => {
          map[p.id] = { name: p.full_name || "—", email: p.email || "—" };
        });
        setProfiles(map);
      } else {
        setProfiles({});
      }
      setLoading(false);
    })();
  }, [campaign]);

  const byType = events.reduce((acc: Record<string, any[]>, e: any) => {
    acc[e.event_type] = acc[e.event_type] || [];
    acc[e.event_type].push(e);
    return acc;
  }, {});

  const byPlatform = events.reduce((acc: Record<string, number>, e: any) => {
    if (e.event_type === "sent") acc[e.platform || "?"] = (acc[e.platform || "?"] || 0) + 1;
    return acc;
  }, {});

  const opens = byType["opened"] || [];

  return (
    <Dialog open={!!campaign} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">{campaign?.title}</DialogTitle>
        </DialogHeader>
        {campaign && (
          <div className="space-y-4 text-sm">
            <div className="text-xs text-muted-foreground">{campaign.body}</div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <Metric label="Enviado" value={campaign.sent_count} />
              <Metric label="Entregue" value={campaign.delivered_count} />
              <Metric label="Aberto" value={campaign.opened_count} tone="ok" />
              <Metric label="Falhou" value={campaign.failed_count} tone="warn" />
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Por plataforma</div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <Metric label="Android" value={byPlatform["android"] || 0} />
                <Metric label="iOS" value={byPlatform["ios"] || 0} />
                <Metric label="Web" value={byPlatform["web"] || 0} />
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                <MousePointerClick className="w-3 h-3" />
                Usuários que abriram ({opens.length})
              </div>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {!loading && opens.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhuma abertura registrada.</p>
              )}
              <div className="space-y-1">
                {opens.map((e: any) => {
                  const p = e.user_id ? profiles[e.user_id] : null;
                  return (
                    <div key={e.id} className="flex items-center justify-between text-xs border-b border-border/40 py-1">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{p?.name || "Anônimo"}</div>
                        <div className="text-muted-foreground truncate">{p?.email || e.user_id || "—"}</div>
                      </div>
                      <div className="text-[10px] text-muted-foreground text-right">
                        <div>{e.platform || "—"}</div>
                        <div>{new Date(e.created_at).toLocaleString("pt-BR")}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {(byType["failed"] || byType["error"])?.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Falhas</div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {(byType["failed"] || byType["error"]).slice(0, 50).map((e: any) => (
                    <div key={e.id} className="text-[11px] border-b border-border/30 py-1">
                      <div className="text-amber-500">{e.error || "erro"}</div>
                      <div className="text-muted-foreground">{e.platform || "—"} · {new Date(e.created_at).toLocaleString("pt-BR")}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
