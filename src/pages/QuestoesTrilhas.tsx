import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Route as RouteIcon, ChevronRight, Loader2, Flame } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import QuestoesBottomNav from '@/components/questoes/QuestoesBottomNav';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuestoesAreas } from '@/hooks/useQuestoes';
import { visualDaArea } from '@/lib/questoesVisual';

const db = supabase as any;

type Trilha = {
  id: string; titulo: string; descricao: string | null; tipo: string;
  area: string | null; meta_diaria: number; cor: string;
};

const QuestoesTrilhas = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { areas } = useQuestoesAreas();
  const [trilhas, setTrilhas] = useState<Trilha[]>([]);
  const [progresso, setProgresso] = useState<Record<string, { respondidas: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await db.from('questoes_trilhas').select('*').eq('ativo', true).order('ordem');
      setTrilhas(data ?? []);
      if (user) {
        const hoje = new Date().toISOString().slice(0, 10);
        const { data: p } = await db.from('questoes_trilha_progresso')
          .select('trilha_id, respondidas').eq('user_id', user.id).eq('dia', hoje);
        setProgresso(Object.fromEntries((p ?? []).map((r: any) => [r.trilha_id, r])));
      }
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="theme-questoes min-h-screen bg-background pb-32">
      <PageHeader title="Trilhas" subtitle="Meta diária ou por área" onBack={() => navigate('/questoes')} />

      <div className="mx-auto w-full max-w-3xl px-4 py-5">
        {/* Trilha diária padrão */}
        <button
          onClick={() => navigate('/questoes/praticar')}
          className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left hover:border-primary/50"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
            <Flame className="h-6 w-6 text-primary" />
          </span>
          <span className="flex-1">
            <span className="block text-[15px] font-bold text-foreground">Trilha diária</span>
            <span className="block text-[12px] text-muted-foreground">10 questões novas por dia, variando as áreas</span>
          </span>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : trilhas.length > 0 && (
          <>
            <h2 className="mt-7 mb-3 text-[15px] font-bold text-foreground">Trilhas do app</h2>
            <div className="space-y-2">
              {trilhas.map((t) => {
                const feitas = progresso[t.id]?.respondidas ?? 0;
                const pct = Math.min(100, Math.round((feitas / Math.max(1, t.meta_diaria)) * 100));
                return (
                  <button
                    key={t.id}
                    onClick={() => navigate(t.area ? `/questoes/praticar?area=${encodeURIComponent(t.area)}` : '/questoes/praticar')}
                    className="w-full rounded-2xl border border-border bg-card p-4 text-left hover:border-primary/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${t.cor}22` }}>
                        <RouteIcon className="h-5 w-5" style={{ color: t.cor }} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-bold text-foreground">{t.titulo}</span>
                        <span className="block text-[12px] text-muted-foreground">{t.descricao}</span>
                      </span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: t.cor }} />
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">{feitas} / {t.meta_diaria} hoje</p>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Trilhas por área */}
        {areas.length > 0 && (
          <>
            <h2 className="mt-7 mb-3 text-[15px] font-bold text-foreground">Trilhas por área</h2>
            <div className="grid grid-cols-2 gap-3">
              {areas.slice(0, 12).map((a) => {
                const { icon: Icon, color } = visualDaArea(a.area);
                return (
                  <button
                    key={a.area}
                    onClick={() => navigate(`/questoes/praticar?area=${encodeURIComponent(a.area)}`)}
                    className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4 text-left hover:border-primary/50"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${color}22` }}>
                      <Icon className="h-5 w-5" style={{ color }} />
                    </span>
                    <span className="line-clamp-2 text-[14px] font-bold text-foreground">{a.area}</span>
                    <span className="text-[11px] text-muted-foreground">{Number(a.total).toLocaleString('pt-BR')} questões</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      <QuestoesBottomNav />
    </div>
  );
};

export default QuestoesTrilhas;
