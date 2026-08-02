import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, PlayCircle } from 'lucide-react';

type Aula = {
  id: string;
  titulo: string;
  objetivo: string | null;
  duracao_est_min: number;
  ordem: number;
};

type Progresso = { concluida: boolean; pct: number };

type Props = {
  aulas: Aula[];
  progresso: Record<string, Progresso>;
  onNavigate: () => void;
};

const TeoriaTab = ({ aulas, progresso, onNavigate }: Props) => {
  const navigate = useNavigate();
  if (aulas.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
        Nenhuma aula publicada neste tema ainda.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {aulas.map((au, idx) => {
        const p = progresso[au.id] ?? { concluida: false, pct: 0 };
        return (
          <li key={au.id}>
            <button
              onClick={() => {
                onNavigate();
                setTimeout(() => navigate(`/aprender/aula/${au.id}`), 120);
              }}
              className="group relative flex w-full items-start gap-3 overflow-hidden rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent/40 active:scale-[0.995] sm:p-5"
            >
              <div
                className="absolute left-0 top-0 h-full w-1.5 rounded-l-2xl bg-primary"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1 pl-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[13px] font-black uppercase tracking-wider tabular-nums text-foreground"
                      style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}
                    >
                      Aula {String(idx + 1).padStart(2, '0')}
                    </span>
                    {p.concluida ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : p.pct > 0 ? (
                      <PlayCircle className="h-4 w-4 text-primary" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                    )}
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 text-[12px] text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> {au.duracao_est_min} min
                  </span>
                </div>
                <p
                  className="mt-2.5 line-clamp-2 text-[15px] font-normal leading-snug text-foreground sm:text-base"
                  style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}
                >
                  {au.titulo}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${p.concluida ? 100 : p.pct}%`, background: 'hsl(348 78% 38%)' }}
                    />
                  </div>
                  <span className="shrink-0 text-[12px] tabular-nums text-muted-foreground">
                    {p.concluida ? 100 : p.pct}%
                  </span>
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export default TeoriaTab;
