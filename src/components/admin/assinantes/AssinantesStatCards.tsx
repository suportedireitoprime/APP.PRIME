import React from 'react';

export function StatCard({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: any;
  label: string;
  value: number | string;
  tint: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className={`w-3.5 h-3.5 ${tint}`} /> {label}
      </div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}

export function RevenueCard({
  label,
  value,
  hint,
  accent,
  onClick,
}: {
  label: string;
  value: string;
  hint: string;
  accent: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-border/50 bg-card p-3 relative overflow-hidden group ${
        onClick ? 'cursor-pointer hover:border-border transition-colors' : ''
      }`}
    >
      <div className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r ${accent} opacity-50`} />
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1">
        {label}
      </div>
      <div className="text-lg font-bold tracking-tight text-foreground">{value}</div>
      <div className="text-[10px] text-muted-foreground mt-1">{hint}</div>
    </div>
  );
}
