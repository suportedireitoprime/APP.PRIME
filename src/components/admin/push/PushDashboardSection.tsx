import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { Smartphone, RefreshCw, Eye, TrendingUp, MessageCircle } from "lucide-react";
import { Campaign } from "./pushTypes";
import { Metric } from "./PushStatCard";

interface PushDashboardSectionProps {
  campaigns: Campaign[];
  loading: boolean;
  tipoFiltro: string;
  setTipoFiltro: (v: string) => void;
  onRefresh: () => void;
  onOpenDetail: (c: Campaign) => void;
  onOpenOpensToday: () => void;
}

export function PushDashboardSection({
  campaigns,
  loading,
  tipoFiltro,
  setTipoFiltro,
  onRefresh,
  onOpenDetail,
  onOpenOpensToday,
}: PushDashboardSectionProps) {
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayCampaigns = campaigns.filter((c) => new Date(c.created_at) >= todayStart);

  const totals = todayCampaigns.reduce(
    (acc, c) => {
      acc.sent += c.sent_count || 0;
      acc.delivered += c.delivered_count || 0;
      acc.opened += c.opened_count || 0;
      acc.converted += c.converted_count || 0;
      return acc;
    },
    { sent: 0, delivered: 0, opened: 0, converted: 0 }
  );

  // Série dos últimos 7 dias
  const chartData = useMemo(() => {
    const days: { key: string; label: string; enviadas: number; abertas: number; convertidas: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({
        key,
        label: d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" }),
        enviadas: 0,
        abertas: 0,
        convertidas: 0,
      });
    }
    const byKey = new Map(days.map((d) => [d.key, d]));
    for (const c of campaigns) {
      const k = new Date(c.created_at).toISOString().slice(0, 10);
      const bucket = byKey.get(k);
      if (!bucket) continue;
      bucket.enviadas += c.sent_count || 0;
      bucket.abertas += c.opened_count || 0;
      bucket.convertidas += c.converted_count || 0;
    }
    return days;
  }, [campaigns]);

  // Breakdown por canal (App vs Horus)
  const canalStats = useMemo(() => {
    const stats = { app: { sent: 0, opened: 0 }, horus: { sent: 0, opened: 0 } };
    for (const c of todayCampaigns) {
      const isHorus = c.tipo?.includes("horus") || (c as any).platform === "horus";
      const bucket = isHorus ? stats.horus : stats.app;
      bucket.sent += c.sent_count || 0;
      bucket.opened += c.opened_count || 0;
    }
    return stats;
  }, [todayCampaigns]);

  const filtered = campaigns.filter((c) => {
    if (tipoFiltro === "todas") return true;
    if (tipoFiltro === "manual") return !c.tipo || c.tipo === "manual";
    return c.tipo === tipoFiltro;
  });

  const openRateToday = totals.sent ? Math.round((totals.opened / totals.sent) * 100) : 0;
  const convRateToday = totals.sent ? Math.round((totals.converted / totals.sent) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Métricas de hoje — cards grandes */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Enviadas hoje</div>
          <div className="text-3xl font-bold text-blue-500 mt-1">{totals.sent}</div>
          <div className="text-[11px] text-muted-foreground mt-1">{todayCampaigns.length} campanha(s)</div>
        </Card>
        <button
          type="button"
          onClick={onOpenOpensToday}
          className="text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/40 rounded-xl"
          aria-label="Ver quem abriu"
        >
          <Card className="p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 hover:from-emerald-500/20 transition h-full">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Abertas hoje</div>
            <div className="text-3xl font-bold text-emerald-500 mt-1">{totals.opened}</div>
            <div className="text-[11px] text-muted-foreground mt-1">{openRateToday}% · toque para ver</div>
          </Card>
        </button>
        <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Convertidas</div>
          <div className="text-3xl font-bold text-amber-600 mt-1">{totals.converted}</div>
          <div className="text-[11px] text-muted-foreground mt-1">{convRateToday}% conversão</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-sky-500/10 to-sky-500/5 border-sky-500/20">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Entregues</div>
          <div className="text-3xl font-bold text-sky-600 mt-1">{totals.delivered}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Alcance efetivo</div>
        </Card>
      </div>

      {/* Gráfico grande — 7 dias */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-semibold flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-primary" /> Últimos 7 dias
            </div>
            <div className="text-[11px] text-muted-foreground">Enviadas · Abertas · Convertidas</div>
          </div>
        </div>
        <div className="h-64 -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
              <Line type="monotone" dataKey="enviadas" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="abertas" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="convertidas" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Canal: App vs Horus */}
      <Card className="p-4">
        <div className="text-sm font-semibold mb-3">Por canal · hoje</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <Smartphone className="w-3.5 h-3.5 text-primary" /> App (Push)
            </div>
            <div className="text-2xl font-bold">{canalStats.app.sent}</div>
            <div className="text-[11px] text-muted-foreground">
              {canalStats.app.opened} abertas ·{" "}
              {canalStats.app.sent ? Math.round((canalStats.app.opened / canalStats.app.sent) * 100) : 0}%
            </div>
          </div>
          <div className="rounded-lg border p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> Horus (WhatsApp)
            </div>
            <div className="text-2xl font-bold">{canalStats.horus.sent}</div>
            <div className="text-[11px] text-muted-foreground">
              {canalStats.horus.opened} cliques ·{" "}
              {canalStats.horus.sent ? Math.round((canalStats.horus.opened / canalStats.horus.sent) * 100) : 0}%
            </div>
          </div>
        </div>
      </Card>

      {/* Lista */}
      <div className="flex items-center justify-between gap-2">
        <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
          <SelectTrigger className="w-52 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            <SelectItem value="radar_leis">Radar de Leis</SelectItem>
            <SelectItem value="blog_edicao">Blog</SelectItem>
            <SelectItem value="manual">Manual / Outras</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" variant="ghost" onClick={onRefresh}>
          <RefreshCw className="w-3 h-3 mr-1" />
          Atualizar
        </Button>
      </div>

      {filtered.map((c) => {
        const openRate = c.sent_count ? Math.round((c.opened_count / c.sent_count) * 100) : 0;
        const convRate = c.sent_count ? Math.round((c.converted_count / c.sent_count) * 100) : 0;
        const tipoLabel =
          c.tipo === "radar_leis" ? "Radar de Leis" : c.tipo === "blog_edicao" ? "Blog" : c.tipo ? c.tipo : "Manual";
        const tipoClass =
          c.tipo === "radar_leis"
            ? "bg-primary/15 text-primary border-primary/30"
            : c.tipo === "blog_edicao"
            ? "bg-copper/15 text-copper border-copper/30"
            : "bg-muted text-muted-foreground border-border";
        return (
          <Card
            key={c.id}
            className="p-3 space-y-2 cursor-pointer hover:bg-muted/30 transition"
            onClick={() => onOpenDetail(c)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{c.title}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
                  <Badge className={`text-[10px] border ${tipoClass}`}>{tipoLabel}</Badge>
                  <span>{new Date(c.created_at).toLocaleString("pt-BR")}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {c.status}
                  </Badge>
                </div>
              </div>
              <Eye className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-5 gap-1 text-center text-xs">
              <Metric label="Enviado" value={c.sent_count} />
              <Metric label="Falhou" value={c.failed_count} tone="warn" />
              <Metric label="Entregue" value={c.delivered_count} />
              <Metric label="Aberto" value={c.opened_count} sub={`${openRate}%`} tone="ok" />
              <Metric label="Convertido" value={c.converted_count} sub={`${convRate}%`} tone="ok" />
            </div>
          </Card>
        );
      })}
      {!loading && filtered.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-8">Nenhuma campanha</p>
      )}
    </div>
  );
}
