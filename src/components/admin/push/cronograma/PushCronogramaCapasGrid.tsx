import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { PUSH_DEFAULT_COVERS } from "./pushCronogramaConstants";

export function PushCronogramaCapasGrid() {
  function copiarTexto(texto: string, label: string) {
    navigator.clipboard.writeText(texto);
    toast.success(`${label} copiado para a área de transferência!`);
  }

  return (
    <div className="bg-card/70 backdrop-blur-md p-4 rounded-2xl border border-border/70 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
            3 Capas Oficiais Padrão (16:9 Widescreen)
          </h3>
        </div>
        <span className="text-[11px] text-muted-foreground">Otimizadas para FCM e Notificações Ricas</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {PUSH_DEFAULT_COVERS.map((capa) => (
          <div
            key={capa.id}
            className="group relative overflow-hidden rounded-xl border border-border/80 bg-zinc-950 p-2 space-y-2 hover:border-primary/60 transition-all"
          >
            <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10 bg-black/40">
              <img
                src={capa.url}
                alt={capa.nome}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <Badge className="absolute top-2 left-2 bg-black/80 backdrop-blur-md text-[9px] text-white border-white/20">
                {capa.tag}
              </Badge>
            </div>
            <div className="flex items-start justify-between gap-1">
              <div>
                <h4 className="text-xs font-bold text-foreground leading-tight">{capa.nome}</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{capa.descricao}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => copiarTexto(window.location.origin + capa.url, "Link da Capa")}
                title="Copiar URL pública da imagem"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
