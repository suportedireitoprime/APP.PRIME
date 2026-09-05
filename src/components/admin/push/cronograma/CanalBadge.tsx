import React from "react";
import { Badge } from "@/components/ui/badge";
import { Smartphone, MessageCircle, Sparkles } from "lucide-react";
import type { Canal } from "./pushCronogramaConstants";

export function CanalBadge({ canal }: { canal: Canal }) {
  const map: Record<Canal, { label: string; cls: string; icon: any }> = {
    app: { label: "Push App", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: Smartphone },
    horus: { label: "Hórus WhatsApp", cls: "bg-purple-500/15 text-purple-400 border-purple-500/30", icon: MessageCircle },
    ambos: { label: "App + WhatsApp", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: Sparkles },
    sistema: { label: "Sistema", cls: "bg-muted text-muted-foreground border-border", icon: Sparkles },
  };
  const m = map[canal] || map.app;
  const Icon = m.icon;
  return (
    <Badge variant="outline" className={`text-[10px] border ${m.cls} gap-1 py-0.5 px-2 font-medium`}>
      <Icon className="w-3 h-3" /> {m.label}
    </Badge>
  );
}
