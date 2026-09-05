import React from "react";
import { Card } from "@/components/ui/card";
import { Smartphone, Globe } from "lucide-react";
import { normalizePlatform } from "./pushTypes";

export function StatCard({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) {
  return (
    <Card className="p-2 text-center">
      <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
        {icon}
        {label}
      </div>
      <div className="text-lg font-bold">{value}</div>
    </Card>
  );
}

export function Metric({ label, value, sub, tone }: { label: string; value: number; sub?: string; tone?: "ok" | "warn" }) {
  const color = tone === "ok" ? "text-emerald-500" : tone === "warn" ? "text-amber-500" : "";
  return (
    <div className="rounded bg-muted/40 py-1">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={`font-bold ${color}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function PlatformBadge({ platform }: { platform: string | null | undefined }) {
  const p = normalizePlatform(platform);
  if (p === "android") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
        <Smartphone className="w-3 h-3" /> Android
      </span>
    );
  }
  if (p === "ios") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
        <Smartphone className="w-3 h-3" /> iOS
      </span>
    );
  }
  if (p === "web") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/15 text-violet-400 border border-violet-500/30">
        <Globe className="w-3 h-3" /> Web
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
      Desconhecido
    </span>
  );
}
