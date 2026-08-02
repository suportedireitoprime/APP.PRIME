import { useNavigate } from 'react-router-dom';
import { Loader2, Target, CheckCircle2, Timer, CalendarDays } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import QuestoesBottomNav from '@/components/questoes/QuestoesBottomNav';
import { useQuestoesDesempenho } from '@/hooks/useQuestoes';
import { visualDaArea } from '@/lib/questoesVisual';

const QuestoesDesempenho = () => {
  const navigate = useNavigate();
  const { dados, loading } = useQuestoesDesempenho();

  const total = dados?.total ?? 0;
  const acertos = dados?.acertos ?? 0;
  const pct = total ? Math.round((acertos / total) * 100) : 0;
  const areas: { area: string; total: number; acertos: number }[] = dados?.por_area ?? [];

  const CARDS = [
    { label: 'Respondidas', valor: total, icon: Target },
    { label: 'Acertos', valor: acertos, icon: CheckCircle2 },
    { label: 'Hoje', valor: dados?.hoje ?? 0, icon: CalendarDays },
    { label: 'Simulados', valor: dados?.simulados ?? 0, icon: Timer },
  ];

  return (
    <div className="theme-questoes min-h-screen bg-background pb-32">
      <PageHeader title="Desempenho" subtitle="Seus números por área" onBack={() => navigate('/questoes')} />

      <div className="mx-auto w-full max-w-3xl px-4 py-5">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <>
            <div
              className="rounded-3xl p-5 text-white"
              style={{ background: 'linear-gradient(135deg, #4C1D95 0%, #6D28D9 55%, #8B5CF6 100%)' }}
            >
              <p className="text-[13px] font-semibold uppercase tracking-wider opacity-80">Aproveitamento</p>
              <p className="mt-1 text-4xl font-extrabold tabular-nums">{pct}%</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {CARDS.map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.label} className="rounded-2xl border border-border bg-card p-4">
                    <Icon className="h-5 w-5 text-primary" />
                    <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
                      {Number(c.valor).toLocaleString('pt-BR')}
                    </p>
                    <p className="text-[12px] text-muted-foreground">{c.label}</p>
                  </div>
                );
              })}
            </div>

            <h2 className="mt-7 mb-3 text-[15px] font-bold text-foreground">Por área</h2>
            {areas.length === 0 ? (
              <p className="py-6 text-center text-[14px] text-muted-foreground">
                Responda algumas questões para ver seu desempenho por área.
              </p>
            ) : (
              <div className="space-y-2">
                {areas.map((a) => {
                  const { icon: Icon, color } = visualDaArea(a.area);
                  const p = a.total ? Math.round((a.acertos / a.total) * 100) : 0;
                  return (
                    <div key={a.area} className="rounded-2xl border border-border bg-card p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${color}22` }}>
                          <Icon className="h-5 w-5" style={{ color }} />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-foreground">{a.area}</span>
                        <span className="text-[13px] font-bold tabular-nums text-foreground">{p}%</span>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full" style={{ width: `${p}%`, background: color }} />
                      </div>
                      <p className="mt-2 text-[12px] text-muted-foreground">{a.acertos} de {a.total} corretas</p>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <QuestoesBottomNav />
    </div>
  );
};

export default QuestoesDesempenho;
