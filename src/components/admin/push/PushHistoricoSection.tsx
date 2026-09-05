import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Eye } from "lucide-react";
import { Campaign } from "./pushTypes";

interface PushHistoricoSectionProps {
  campaigns: Campaign[];
  onRefresh: () => void;
  onOpenDetail: (c: Campaign) => void;
}

export function PushHistoricoSection({ campaigns, onRefresh, onOpenDetail }: PushHistoricoSectionProps) {
  const historyCampaigns = campaigns.filter(
    (c) => c.status === "sent" || c.status === "cancelled" || c.status === "failed"
  );

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button size="sm" variant="ghost" onClick={onRefresh}>
          <RefreshCw className="w-3 h-3 mr-1" />
          Atualizar
        </Button>
      </div>

      {historyCampaigns.map((c) => (
        <Card key={c.id} className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{c.title}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(c.created_at).toLocaleString("pt-BR")} ·{" "}
                <Badge variant="outline" className="text-[10px]">
                  {c.status}
                </Badge>
              </div>
              <div className="text-xs mt-1 text-muted-foreground">
                Enviado {c.sent_count} · Aberto {c.opened_count} · Convertido {c.converted_count}
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => onOpenDetail(c)}>
              <Eye className="w-3 h-3" />
            </Button>
          </div>
        </Card>
      ))}

      {historyCampaigns.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-8">Nenhum envio ainda</p>
      )}
    </div>
  );
}
