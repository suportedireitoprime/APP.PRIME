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
  const [programadasView, setProgramadasView] = useState<"cronograma" | "funcoes">("cronograma");

  async function cancelCampaign(id: string) {
    await supabase.from("push_campaigns").update({ status: "cancelled" }).eq("id", id);
    onRefresh();
  }

  async function runNow(id: string) {
    await supabase.from("push_campaigns").update({ next_run_at: new Date().toISOString() }).eq("id", id);
    toast.success("Marcada para envio no próximo ciclo");
    onRefresh();
  }

  const scheduledCampaigns = campaigns.filter(
    (c) => c.status === "scheduled" || c.status === "sending"
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-1 p-1 bg-muted/40 rounded-lg">
        <button
          onClick={() => setProgramadasView("cronograma")}
          className={`text-xs font-medium py-2 rounded-md transition-colors ${
            programadasView === "cronograma"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Cronograma
        </button>
        <button
          onClick={() => setProgramadasView("funcoes")}
          className={`text-xs font-medium py-2 rounded-md transition-colors ${
            programadasView === "funcoes"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Funções
        </button>
      </div>

      {programadasView === "cronograma" && <PushCronogramaTab />}

      {programadasView === "funcoes" && (
        <>
          <div className="text-xs uppercase tracking-wider text-muted-foreground pt-2">Automações padrão</div>
          <PushAutomacoesTab />
          <div className="flex items-center justify-between pt-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Campanhas agendadas</div>
            <Button size="sm" variant="ghost" onClick={onRefresh}>
              <RefreshCw className="w-3 h-3 mr-1" />
              Atualizar
            </Button>
          </div>
          {scheduledCampaigns.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">Nenhuma campanha agendada</p>
          )}
          {scheduledCampaigns.map((c) => (
            <Card key={c.id} className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{c.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{c.body}</div>
                  <div className="text-xs mt-1">
                    <Badge variant="outline">{c.status}</Badge>{" "}
                    {c.next_run_at && new Date(c.next_run_at).toLocaleString("pt-BR")}
                    {c.recurrence?.type && ` · ${c.recurrence.type}`}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Button size="sm" variant="secondary" onClick={() => runNow(c.id)}>
                    Rodar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => cancelCampaign(c.id)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
