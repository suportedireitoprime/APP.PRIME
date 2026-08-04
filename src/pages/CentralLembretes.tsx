import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing, BellOff, ChevronRight, Clock, Loader2, Plus } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import LembretesBottomNav from '@/components/lembretes/LembretesBottomNav';
import LembreteCard from '@/components/lembretes/LembreteCard';
import NovoLembreteSheet from '@/components/lembretes/NovoLembreteSheet';
import { useLembretes, type LembreteItem } from '@/hooks/useLembretes';
import { TIPOS, type LembreteTipo } from '@/lib/lembretes/tipos';
import { cn } from '@/lib/utils';

const ORDEM: LembreteTipo[] = [
  'geral',
  'leitura',
  'videoaulas',
  'resumos',
  'questoes',
  'leiseca',
  'local',
  'estudo',
];

export default function CentralLembretes() {
  const navigate = useNavigate();
  const { itens, loading, totais, proximo, recarregar, alternar, remover } = useLembretes();
  const [filtro, setFiltro] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [criar, setCriar] = useState(false);

  const visiveis = useMemo(
    () =>
      itens.filter((i) => (filtro === 'todos' ? true : filtro === 'ativos' ? i.ativo : !i.ativo)),
    [itens, filtro],
  );

  const porTipo = useMemo(() => {
    const m = new Map<LembreteTipo, LembreteItem[]>();
    visiveis.forEach((i) => {
      const arr = m.get(i.tipo) ?? [];
      arr.push(i);
      m.set(i.tipo, arr);
    });
    return ORDEM.filter((t) => m.has(t)).map((t) => [t, m.get(t)!] as const);
  }, [visiveis]);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Lembretes"
        subtitle="Sua central de avisos de estudo"
        onBack={() => navigate('/', { replace: true })}
      />

      <div className="max-w-3xl mx-auto px-4 py-4 pb-40">
        {/* Resumo */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card border border-border/60 px-4 py-3.5">
            <p className="text-[11.5px] font-semibold text-muted-foreground uppercase tracking-wide">
              Ativos
            </p>
            <p className="text-2xl font-bold text-foreground tabular-nums mt-0.5">
              {loading ? '—' : totais.ativos}
            </p>
          </div>
          <div className="rounded-2xl bg-card border border-border/60 px-4 py-3.5">
            <p className="text-[11.5px] font-semibold text-muted-foreground uppercase tracking-wide">
              No total
            </p>
            <p className="text-2xl font-bold text-foreground tabular-nums mt-0.5">
              {loading ? '—' : totais.total}
            </p>
          </div>
        </div>

        {/* Próximo lembrete */}
        {!loading && proximo && (
          <div className="mt-3 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3.5 flex items-center gap-3">
            <span className="h-11 w-11 shrink-0 rounded-xl bg-primary/20 grid place-items-center">
              <BellRing className="w-6 h-6 text-primary" strokeWidth={1.7} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11.5px] font-bold uppercase tracking-wide text-primary">
                Próximo lembrete
              </p>
              <p className="text-[15px] font-semibold text-foreground truncate">{proximo.titulo}</p>
              <p className="text-[12px] text-muted-foreground truncate">{proximo.detalhe}</p>
            </div>
            <span className="shrink-0 inline-flex items-center gap-1 text-[14px] font-bold text-foreground tabular-nums">
              <Clock className="w-4 h-4 text-muted-foreground" />
              {proximo.quando || proximo.horario}
            </span>
          </div>
        )}

        {/* Filtros */}
        <div className="grid grid-cols-3 gap-2 mt-4 mb-4">
          {(['todos', 'ativos', 'inativos'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={cn(
                'h-11 rounded-xl text-[12.5px] font-semibold capitalize border transition',
                filtro === f
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border/60',
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 grid place-items-center text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>
        ) : porTipo.length === 0 ? (
          <div className="py-8 text-center">
            <BellOff className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-body text-foreground font-semibold">Nenhum lembrete por aqui</p>
            <p className="text-[13px] text-muted-foreground mt-1 mb-5">
              Escolha uma função e crie o seu primeiro aviso.
            </p>
            <div className="space-y-2.5 text-left">
              {ORDEM.map((t) => {
                const g = TIPOS[t];
                const Icon = g.icon;
                return (
                  <button
                    key={t}
                    onClick={() => navigate(g.rota)}
                    className="w-full min-h-[76px] flex items-center gap-3 px-4 rounded-2xl bg-card border border-border/60 active:scale-[0.99] transition"
                  >
                    <span
                      className="h-11 w-11 shrink-0 rounded-xl grid place-items-center"
                      style={{ background: `${g.cor}1f` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: g.cor }} strokeWidth={1.5} />
                    </span>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-body text-foreground text-[15px] font-semibold">{g.label}</p>
                      <p className="text-[12px] text-muted-foreground">{g.desc}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {porTipo.map(([tipo, lista]) => {
              const g = TIPOS[tipo];
              const Icon = g.icon;
              return (
                <section key={tipo}>
                  <div className="flex items-center gap-2 mb-2.5 px-1">
                    <Icon className="w-5 h-5 shrink-0" style={{ color: g.cor }} strokeWidth={1.7} />
                    <h2 className="font-body text-foreground text-[15px] font-bold truncate">
                      {g.label}
                    </h2>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      ({lista.length})
                    </span>
                    <button
                      onClick={() => navigate(g.rota)}
                      className="ml-auto shrink-0 h-9 px-3 rounded-lg text-[12px] font-semibold text-primary"
                    >
                      Gerenciar
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {lista.map((i) => (
                      <LembreteCard
                        key={i.id}
                        item={i}
                        onAbrir={() => navigate(i.rota)}
                        onAlternar={() => alternar(i)}
                        onRemover={() => remover(i)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <button
        onClick={() => setCriar(true)}
        aria-label="Novo lembrete"
        className="fixed right-5 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 grid place-items-center active:scale-95 transition"
        style={{ bottom: 'calc(6.25rem + var(--sai-bottom, env(safe-area-inset-bottom, 0px)))' }}
      >
        <Plus className="h-7 w-7" />
      </button>

      <NovoLembreteSheet open={criar} onOpenChange={setCriar} onSalvo={recarregar} />

      <LembretesBottomNav />
    </div>
  );
}
