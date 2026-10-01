import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import PushCronogramaTab from "@/components/admin/PushCronogramaTab";
import PushAutomacoesTab from "@/components/admin/PushAutomacoesTab";
import { Campaign } from "./pushTypes";

interface PushProgramadasSectionProps {
  campaigns: Campaign[];
  onRefresh: () => void;
}

export function PushProgramadasSection({ campaigns, onRefresh }: PushProgramadasSectionProps) {
  const scheduledCampaigns = campaigns.filter(
    (c) => c.status === "scheduled" || c.status === "sending"
  );

  async function cancelCampaign(id: string) {
    await supabase.from("push_campaigns").update({ status: "cancelled" }).eq("id", id);
    onRefresh();
  }

  async function runNow(id: string) {
    await supabase.from("push_campaigns").update({ next_run_at: new Date().toISOString() }).eq("id", id);
    toast.success("Marcada para envio no próximo ciclo");
    onRefresh();
  }

  return (
    <div className="space-y-6">
      {/* 1. Cronograma Timeline (Minimalista) */}
      <PushCronogramaTab />

      {/* 2. Campanhas Agendadas (Timeline do que está programado) */}
      <div className="space-y-4 pt-4 border-t border-border/40">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Campanhas Agendadas</div>
          <Button size="sm" variant="ghost" onClick={onRefresh}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Atualizar
          </Button>
        </div>
        
        {scheduledCampaigns.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">Nenhuma campanha agendada manualmente</p>
        )}
        
        <div className="grid gap-3">
          {scheduledCampaigns.map((c) => (
            <Card key={c.id} className="p-3 bg-muted/20 border-border/50">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground">{c.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{c.body}</div>
                  <div className="flex items-center gap-2 text-xs mt-2">
                    <Badge variant="outline" className="bg-background">{c.status}</Badge>
                    <span className="text-muted-foreground">
                      {c.next_run_at && new Date(c.next_run_at).toLocaleString("pt-BR")}
                      {c.recurrence?.type && ` · ${c.recurrence.type}`}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button size="sm" variant="secondary" onClick={() => runNow(c.id)} className="text-xs h-7">
                    Rodar agora
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => cancelCampaign(c.id)} className="text-xs h-7">
                    Cancelar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
