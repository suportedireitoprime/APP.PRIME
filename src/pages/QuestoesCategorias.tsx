import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronRight, ChevronDown, Sparkles, Scale, Landmark, ShieldCheck, Gavel,
} from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import QuestoesBottomNav from '@/components/questoes/QuestoesBottomNav';
import { useQuestoesCargos, type Cargo } from '@/hooks/useQuestoes';
import { haptic } from '@/lib/nativeHaptics';

const normalizar = (t: string) =>
  t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const POLICIAIS = ['polic', 'delegad', 'agente', 'escriv', 'papilosc', 'perit', 'investigador', 'prf', 'penal', 'bombeir', 'militar'];
const SUPERIOR = ['juiz', 'promotor', 'procurador', 'defensor', 'analista', 'delegado', 'advogado', 'auditor', 'magistrat'];
const MEDIO = ['tecnic', 'técnic', 'escrevente', 'oficial', 'auxiliar', 'assistente', 'estagi'];

function contem(nome: string, chaves: string[]) {
  const n = normalizar(nome);
  return chaves.some((k) => n.includes(normalizar(k)));
}

type Grupo = {
  id: string;
  titulo: string;
  desc: string;
  icon: typeof Scale;
  cor: string;
  /** Quando existir, o grupo abre direto na prática com esse filtro. */
  rota?: string;
  subgrupos?: { id: string; titulo: string; cargos: Cargo[] }[];
  cargos?: Cargo[];
};

/** Categorias de questões: iniciante, OAB, concursos jurídicos e carreiras policiais. */
const QuestoesCategorias = () => {
  const navigate = useNavigate();
  const { cargos, loading } = useQuestoesCargos();
  const [aberto, setAberto] = useState<string | null>(null);

  const grupos = useMemo<Grupo[]>(() => {
    const oab = cargos.filter((c) => contem(c.nome, ['oab', 'exame de ordem']));
    const policiais = cargos.filter((c) => !oab.includes(c) && contem(c.nome, POLICIAIS));
    const resto = cargos.filter((c) => !oab.includes(c) && !policiais.includes(c));
    const medio = resto.filter((c) => contem(c.nome, MEDIO));
    const superior = resto.filter((c) => !medio.includes(c));

    return [
      {
        id: 'iniciante',
        titulo: 'Iniciante',
        desc: 'Comece pelo básico, sem pressa',
        icon: Sparkles,
        cor: '#A78BFA',
        rota: '/questoes/praticar?nivel=iniciante',
      },
      {
        id: 'oab',
        titulo: 'OAB',
        desc: 'Exame de Ordem, 1ª fase',
        icon: Scale,
        cor: '#F0ABFC',
        cargos: oab,
        rota: oab.length === 0 ? '/questoes/praticar?nivel=oab' : undefined,
      },
      {
        id: 'concursos',
        titulo: 'Concursos jurídicos',
        desc: 'Separados por escolaridade exigida',
        icon: Landmark,
        cor: '#60A5FA',
        subgrupos: [
          { id: 'medio', titulo: 'Nível médio', cargos: medio },
          { id: 'superior', titulo: 'Nível superior', cargos: superior },
        ],
      },
      {
        id: 'policiais',
        titulo: 'Carreiras policiais',
        desc: 'Polícia Civil, Federal, PRF e afins',
        icon: ShieldCheck,
        cor: '#34D399',
        cargos: policiais,
      },
    ];
  }, [cargos]);

  const irCargo = (c: Cargo) => {
    haptic.selection();
    navigate(`/questoes/praticar?cargo=${c.id}`);
  };

  const ListaCargos = ({ lista }: { lista: Cargo[] }) => {
    if (!lista.length) {
      return <p className="px-4 pb-3 text-[12px] text-muted-foreground">Nenhum cargo disponível ainda.</p>;
    }
    return (
      <div className="space-y-2 px-3 pb-3">
        {lista.map((c) => (
          <button
            key={c.id}
            onClick={() => irCargo(c)}
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-background p-3 text-left transition-colors hover:border-primary/50"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${c.cor}22` }}>
              <Gavel className="h-4.5 w-4.5" style={{ color: c.cor }} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold text-foreground">{c.nome}</span>
              <span className="block text-[11px] text-muted-foreground">
                {c.total_questoes.toLocaleString('pt-BR')} questões
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="theme-questoes min-h-screen bg-background pb-32">
      <div className="mx-auto w-full max-w-3xl">
        <PageHeader title="Categorias" subtitle="Escolha por onde praticar" onBack={() => navigate('/questoes')} />

        <div className="space-y-3 px-4 py-5">
          {loading && (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />)}
            </div>
          )}

          {!loading && grupos.map((g, i) => {
            const Icon = g.icon;
            const expansivel = !g.rota;
            const expandido = aberto === g.id;
            return (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                <button
                  onClick={() => {
                    haptic.selection();
                    if (g.rota) navigate(g.rota);
                    else setAberto(expandido ? null : g.id);
                  }}
                  className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/40"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: `${g.cor}22` }}>
                    <Icon className="h-6 w-6" style={{ color: g.cor }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold text-foreground">{g.titulo}</span>
                    <span className="block text-[12px] leading-snug text-muted-foreground">{g.desc}</span>
                  </span>
                  {expansivel ? (
                    <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${expandido ? 'rotate-180' : ''}`} />
                  ) : (
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                  )}
                </button>

                {expansivel && expandido && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="border-t border-border">
                    {g.subgrupos
                      ? g.subgrupos.map((s) => (
                          <div key={s.id} className="pt-3">
                            <p className="px-4 pb-2 text-[11px] font-bold uppercase tracking-widest text-primary">
                              {s.titulo}
                            </p>
                            <ListaCargos lista={s.cargos} />
                          </div>
                        ))
                      : <div className="pt-3"><ListaCargos lista={g.cargos ?? []} /></div>}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <QuestoesBottomNav />
    </div>
  );
};

export default QuestoesCategorias;
