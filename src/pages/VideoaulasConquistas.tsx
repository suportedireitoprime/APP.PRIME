import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Flame, Lock, Trophy, Video } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import VideoaulasBottomNav from '@/components/videoaulas/VideoaulasBottomNav';
import { CATALOGOS } from '@/lib/videoaulasCatalogos';
import {
  carregarResumoVideoaulas,
  RESUMO_VAZIO,
  type ResumoVideoaulas,
} from '@/lib/videoaulasResumo';

const MEDALHAS = [
  { alvo: 1, titulo: 'Primeira aula', desc: 'Você começou sua jornada em vídeo.' },
  { alvo: 10, titulo: 'Aquecendo', desc: '10 videoaulas assistidas.' },
  { alvo: 25, titulo: 'Ritmo de estudo', desc: '25 videoaulas assistidas.' },
  { alvo: 50, titulo: 'Meio caminho', desc: '50 videoaulas assistidas.' },
  { alvo: 100, titulo: 'Maratonista', desc: '100 videoaulas assistidas.' },
  { alvo: 250, titulo: 'Fora de série', desc: '250 videoaulas assistidas.' },
  { alvo: 500, titulo: 'Lenda do Direito', desc: '500 videoaulas assistidas.' },
];

const VideoaulasConquistas = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<ResumoVideoaulas>(RESUMO_VAZIO);

  useEffect(() => {
    let alive = true;
    carregarResumoVideoaulas().then((r) => alive && setData(r));
    return () => {
      alive = false;
    };
  }, []);

  const assistidas = data.totalConcluidas;
  const trilhasConcluidas = useMemo(
    () => data.areas.filter((a) => a.total > 0 && a.pct === 100).length,
    [data.areas],
  );
  const trilhasIniciadas = useMemo(
    () => data.areas.filter((a) => a.pct > 0).length,
    [data.areas],
  );
  const proxima = MEDALHAS.find((m) => assistidas < m.alvo);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Conquistas"
        subtitle="Seu progresso em videoaulas"
        onBack={() => navigate('/videoaulas')}
      />

      <div className="mx-auto w-full max-w-3xl px-4 pb-32 pt-4 sm:px-6">
        {/* Resumo */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Assistidas', valor: assistidas, Icon: Video },
            { label: 'Trilhas iniciadas', valor: trilhasIniciadas, Icon: Flame },
            { label: 'Trilhas 100%', valor: trilhasConcluidas, Icon: Trophy },
          ].map(({ label, valor, Icon }) => (
            <div key={label} className="rounded-2xl border border-border bg-card p-3 text-center">
              <Icon className="mx-auto h-5 w-5 text-primary" />
              <p className="mt-1 font-display text-xl font-black leading-none text-foreground">{valor}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
            </div>
          ))}
        </div>

        {proxima && (
          <div className="mt-3 rounded-2xl border border-border bg-card p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Próxima conquista
            </p>
            <p className="mt-1 text-[15px] font-bold text-foreground">{proxima.titulo}</p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-[hsl(var(--aprender-accent))] transition-all"
                style={{ width: `${Math.min(100, Math.round((assistidas / proxima.alvo) * 100))}%` }}
              />
            </div>
            <p className="mt-1.5 text-[12px] text-muted-foreground">
              Faltam {proxima.alvo - assistidas} aula{proxima.alvo - assistidas === 1 ? '' : 's'} para desbloquear.
            </p>
          </div>
        )}

        {/* Por categoria */}
        <p className="mb-2 mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Por categoria
        </p>
        <div className="space-y-2">
          {CATALOGOS.map((c) => {
            const info = data.porCatalogo[c.id] ?? { total: 0, concluidas: 0, pct: 0 };
            return (
              <div key={c.id} className="rounded-2xl border border-border bg-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[14px] font-semibold text-foreground">{c.titulo}</p>
                  <span className="shrink-0 text-[12px] font-bold tabular-nums text-primary">
                    {info.concluidas}/{info.total}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-[hsl(var(--aprender-accent))]"
                    style={{ width: `${info.pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Medalhas */}
        <p className="mb-2 mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Medalhas
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {MEDALHAS.map((m) => {
            const ganha = assistidas >= m.alvo;
            return (
              <div
                key={m.alvo}
                className={[
                  'rounded-2xl border p-3 text-center transition-colors',
                  ganha
                    ? 'border-[hsl(var(--aprender-accent)/0.5)] bg-[hsl(var(--aprender-accent)/0.12)]'
                    : 'border-border bg-card',
                ].join(' ')}
              >
                {ganha ? (
                  <Award className="mx-auto h-6 w-6 text-[hsl(var(--aprender-accent))]" />
                ) : (
                  <Lock className="mx-auto h-6 w-6 text-muted-foreground" />
                )}
                <p className="mt-1 text-[13px] font-bold text-foreground">{m.titulo}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{m.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      <VideoaulasBottomNav />
    </div>
  );
};

export default VideoaulasConquistas;
