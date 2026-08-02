import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import QuestoesBottomNav from '@/components/questoes/QuestoesBottomNav';
import { useQuestoesAreas } from '@/hooks/useQuestoes';
import { visualDaArea } from '@/lib/questoesVisual';

const QuestoesAreas = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const nivel = params.get('nivel');
  const cargo = params.get('cargo');
  const { areas, loading } = useQuestoesAreas(nivel, cargo);

  return (
    <div className="theme-questoes min-h-screen bg-background pb-32">
      <PageHeader
        title="Áreas"
        subtitle={nivel === 'iniciante' ? 'Questões para iniciantes' : 'Escolha a disciplina'}
        onBack={() => navigate('/questoes')}
      />

      <div className="mx-auto w-full max-w-3xl px-4 py-5">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : areas.length === 0 ? (
          <p className="py-12 text-center text-[14px] text-muted-foreground">
            Nenhuma questão importada ainda.
          </p>
        ) : (
          <div className="space-y-2">
            {areas.map((a) => {
              const { icon: Icon, color } = visualDaArea(a.area);
              const qs = new URLSearchParams({ area: a.area });
              if (nivel) qs.set('nivel', nivel);
              if (cargo) qs.set('cargo', cargo);
              return (
                <button
                  key={a.area}
                  onClick={() => navigate(`/questoes/praticar?${qs.toString()}`)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: `${color}22` }}>
                    <Icon className="h-6 w-6" style={{ color }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-foreground">{a.area}</span>
                    <span className="block text-[12px] text-muted-foreground">
                      {Number(a.total).toLocaleString('pt-BR')} questões
                    </span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <QuestoesBottomNav />
    </div>
  );
};

export default QuestoesAreas;
