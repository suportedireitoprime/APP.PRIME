import React from 'react';
import {
  CircleDollarSign,
  TrendingUp,
  Users,
  Crown,
  FlaskConical,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { fmtBRL } from './assinantesTypes';
import { StatCard, RevenueCard } from './AssinantesStatCards';

interface RevenueData {
  mrr: number;
  arr: number;
  paying: number;
  avgTicket: number;
  lifetimeGross: number;
  byPlan: Array<{ plan: string; count: number; mrr: number; gross: number }>;
  mrrUsers: any[];
  grossUsers: any[];
}

interface AssinantesRevenueChartsProps {
  revenue: RevenueData;
  grossAccumulated: number;
  setModalDetails: (m: 'mrr' | 'gross') => void;
  timeline: Array<{
    date: string;
    label: string;
    ativos: number;
    novos: number;
    cancelados: number;
    renovacoes: number;
  }>;
  viewMode: 'dashboard' | 'asaas' | 'play' | 'apple';
  loading: boolean;
  platformRowsCount: number;
  testsCount: number;
  activeChart: 'mrr' | 'gross' | 'sales' | 'subs';
  setActiveChart: (chart: 'mrr' | 'gross' | 'sales' | 'subs') => void;
  currentMonthData: {
    monthId: string;
    label: string;
    total: number;
  } | null;
  selectedMonthId: string;
  setSelectedMonthId: (id: string) => void;
  monthlyRevenueData: Array<{ monthId: string; label: string; total: number }>;
  currentMonthChartData: Array<{ plan: string; gross: number }>;
  subsByMonth: Array<{ month: string; count?: number; total?: number }>;
}

export function AssinantesRevenueCharts({
  revenue,
  grossAccumulated,
  setModalDetails,
  timeline,
  viewMode,
  loading,
  platformRowsCount,
  testsCount,
  activeChart,
  setActiveChart,
  currentMonthData,
  selectedMonthId,
  setSelectedMonthId,
  monthlyRevenueData,
  currentMonthChartData,
  subsByMonth,
}: AssinantesRevenueChartsProps) {
  return (
    <>
      <section className="rounded-2xl overflow-hidden border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-transparent p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <CircleDollarSign className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Receita recorrente estimada
              </div>
              <div className="text-xs text-muted-foreground">
                com base em {revenue.paying} assinante(s) pagante(s)
              </div>
            </div>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-full bg-background/60 text-muted-foreground">
            BRL
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <RevenueCard
            label="MRR"
            value={fmtBRL(revenue.mrr)}
            hint="mensal"
            accent="from-amber-500 to-orange-500"
            onClick={() => setModalDetails('mrr')}
          />
          <RevenueCard
            label="ARR"
            value={fmtBRL(revenue.arr)}
            hint="anualizado"
            accent="from-emerald-500 to-teal-500"
          />
          <RevenueCard
            label="Ticket médio"
            value={fmtBRL(revenue.avgTicket)}
            hint="por assinante/mês"
            accent="from-blue-500 to-cyan-500"
          />
          <RevenueCard
            label="Bruto acumulado"
            value={fmtBRL(grossAccumulated)}
            hint="ciclos vendidos"
            accent="from-purple-500 to-fuchsia-500"
            onClick={() => setModalDetails('gross')}
          />
        </div>
      </section>

      {/* Gráfico timeline (Apenas Play Billing) */}
      {timeline.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Evolução Play (últimos 30 dias)</h2>
          </div>
          <div className="h-56 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id="gNovos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(217 91% 60%)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gCanc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(346 87% 60%)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(346 87% 60%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gAtivos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(160 84% 45%)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(160 84% 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="label"
                  fontSize={10}
                  stroke="hsl(var(--muted-foreground))"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  fontSize={10}
                  stroke="hsl(var(--muted-foreground))"
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area
                  type="monotone"
                  dataKey="ativos"
                  name="Ativos"
                  stroke="hsl(160 84% 45%)"
                  fill="url(#gAtivos)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="novos"
                  name="Novos"
                  stroke="hsl(217 91% 60%)"
                  fill="url(#gNovos)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="cancelados"
                  name="Cancelados"
                  stroke="hsl(346 87% 60%)"
                  fill="url(#gCanc)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Métricas locais */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
          Visão Geral{' '}
          {viewMode !== 'dashboard' &&
            `(${viewMode === 'asaas' ? 'Asaas' : viewMode === 'play' ? 'Google Play' : 'Apple'})`}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <StatCard
            icon={Users}
            label="Total registradas"
            value={loading ? '…' : platformRowsCount}
            tint="text-primary"
          />
          <StatCard
            icon={Crown}
            label="Premium agora"
            value={loading ? '…' : revenue.paying}
            tint="text-amber-500"
          />
          <StatCard
            icon={FlaskConical}
            label="Testes"
            value={loading ? '…' : testsCount}
            tint="text-purple-500"
          />
          <StatCard
            icon={TrendingUp}
            label="SKUs ativos"
            value={loading ? '…' : revenue.byPlan.length}
            tint="text-cyan-500"
          />
        </div>

        {revenue.byPlan.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">Análise de Assinaturas</h3>
              </div>
              <div className="flex items-center rounded-lg bg-muted p-1 text-xs">
                <button
                  onClick={() => setActiveChart('mrr')}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    activeChart === 'mrr'
                      ? 'bg-background shadow-sm font-medium text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  MRR
                </button>
                <button
                  onClick={() => setActiveChart('gross')}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    activeChart === 'gross'
                      ? 'bg-background shadow-sm font-medium text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Faturamento
                </button>
                <button
                  onClick={() => setActiveChart('sales')}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    activeChart === 'sales'
                      ? 'bg-background shadow-sm font-medium text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Vendas Mês
                </button>
                <button
                  onClick={() => setActiveChart('subs')}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    activeChart === 'subs'
                      ? 'bg-background shadow-sm font-medium text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Volume
                </button>
              </div>
            </div>

            {activeChart === 'sales' && currentMonthData && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <select
                    value={selectedMonthId || currentMonthData.monthId}
                    onChange={(e) => setSelectedMonthId(e.target.value)}
                    className="text-xs bg-muted border border-border rounded-md px-2 py-1 outline-none"
                  >
                    {monthlyRevenueData.map((m) => (
                      <option key={m.monthId} value={m.monthId}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs font-bold text-primary">
                    Faturamento Total: {fmtBRL(currentMonthData.total)}
                  </span>
                </div>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={currentMonthChartData} layout="vertical" margin={{ left: 4, right: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis
                        type="number"
                        fontSize={10}
                        stroke="hsl(var(--muted-foreground))"
                        tickFormatter={(v) => `R$${v.toFixed(0)}`}
                      />
                      <YAxis
                        type="category"
                        dataKey="plan"
                        fontSize={10}
                        width={110}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        formatter={(v: any) => fmtBRL(Number(v))}
                      />
                      <Bar dataKey="gross" name="Vendas (Bruto)" radius={[0, 6, 6, 0]}>
                        {currentMonthChartData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={
                              [
                                'hsl(280 65% 60%)',
                                'hsl(217 91% 60%)',
                                'hsl(160 84% 45%)',
                                'hsl(0 96% 56%)',
                              ][i % 4]
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeChart === 'mrr' && (
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={revenue.byPlan.filter((p) => p.mrr > 0)}
                    layout="vertical"
                    margin={{ left: 4, right: 12 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis
                      type="number"
                      fontSize={10}
                      stroke="hsl(var(--muted-foreground))"
                      tickFormatter={(v) => `R$${v.toFixed(0)}`}
                    />
                    <YAxis
                      type="category"
                      dataKey="plan"
                      fontSize={10}
                      width={110}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(v: any) => fmtBRL(Number(v))}
                    />
                    <Bar dataKey="mrr" name="MRR Mensal" radius={[0, 6, 6, 0]}>
                      {revenue.byPlan.map((_, i) => (
                        <Cell
                          key={i}
                          fill={
                            [
                              'hsl(0 96% 56%)',
                              'hsl(160 84% 45%)',
                              'hsl(217 91% 60%)',
                              'hsl(280 65% 60%)',
                            ][i % 4]
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {activeChart === 'gross' && (
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={revenue.byPlan.filter((p) => p.gross > 0)}
                    layout="vertical"
                    margin={{ left: 4, right: 12 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis
                      type="number"
                      fontSize={10}
                      stroke="hsl(var(--muted-foreground))"
                      tickFormatter={(v) => `R$${v.toFixed(0)}`}
                    />
                    <YAxis
                      type="category"
                      dataKey="plan"
                      fontSize={10}
                      width={110}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(v: any) => fmtBRL(Number(v))}
                    />
                    <Bar dataKey="gross" name="Faturamento Total" radius={[0, 6, 6, 0]}>
                      {revenue.byPlan.map((_, i) => (
                        <Cell
                          key={i}
                          fill={
                            [
                              'hsl(217 91% 60%)',
                              'hsl(160 84% 45%)',
                              'hsl(280 65% 60%)',
                              'hsl(0 96% 56%)',
                            ][i % 4]
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {activeChart === 'subs' && (
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subsByMonth} margin={{ left: 4, right: 4, top: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" fontSize={10} stroke="hsl(var(--muted-foreground))" />
                    <YAxis fontSize={10} stroke="hsl(var(--muted-foreground))" width={24} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="total" name="Total Ativas" fill="hsl(160 84% 45%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
}
