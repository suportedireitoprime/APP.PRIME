import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RotateCcw, BarChart3, ChevronRight, ListChecks, NotebookPen, Trophy } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import QuestoesHero from '@/components/questoes/QuestoesHero';
import QuestoesBottomNav from '@/components/questoes/QuestoesBottomNav';
import QuestoesFiltroSheet from '@/components/questoes/QuestoesFiltroSheet';
import DesafiosStrip from '@/components/questoes/DesafiosStrip';
import { useQuestoesCargos, useQuestoesDesempenho } from '@/hooks/useQuestoes';

const ATALHOS = [
  { id: 'desempenho', label: 'Desempenho', desc: 'Seus números por área', icon: BarChart3, route: '/questoes/desempenho' },
  { id: 'revisar', label: 'Revisar', desc: 'Volte no que você errou', icon: RotateCcw, route: '/questoes/revisar' },
  { id: 'cadernos', label: 'Cadernos', desc: 'Monte seus blocos de estudo', icon: NotebookPen, route: '/questoes/cadernos' },
  { id: 'desafios', label: 'Desafios', desc: 'Metas diárias por 7 dias', icon: Trophy, route: '/questoes/desafios' },
];


const Questoes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cargos } = useQuestoesCargos();
  const { dados } = useQuestoesDesempenho();
  const [filtroAberto, setFiltroAberto] = useState(false);

  const pct = dados?.total ? Math.round((dados.acertos / dados.total) * 100) : 0;


  const disponiveis = cargos.reduce((s, c) => s + (c.total_questoes ?? 0), 0);

  return (
    <div className="theme-questoes min-h-screen bg-background pb-32">
      <div className="mx-auto w-full max-w-3xl">
        <PageHeader title="Questões" onBack={() => navigate('/')} />

        <QuestoesHero
          pct={pct}
          total={dados?.total ?? 0}
          hoje={dados?.hoje ?? 0}
          acertos={dados?.acertos ?? 0}
          disponiveis={disponiveis}
        />

        <div className="px-4">
          {/* Ação principal */}
          <div className="mt-5">
            <div className="flex items-center gap-2">
              <span className="h-6 w-1 rounded-full bg-primary" />
              <h2 className="text-xl font-bold leading-tight text-foreground sm:text-2xl">Praticar questões</h2>
            </div>
            <p className="ml-3 mt-1 text-sm leading-5 text-muted-foreground">
              Escolha filtros e comece.
            </p>


            <button
              key={location.key}
              onClick={() => setFiltroAberto(true)}
              className="btn-attention-shine group mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[16px] font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:brightness-110 active:scale-[0.99]"
            >
              <ListChecks className="h-5 w-5" strokeWidth={2.2} />
              Praticar agora
              <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Desafios */}
          <DesafiosStrip />




          {/* Título */}
          <div className="pt-6 mb-4">
            <div className="flex items-center gap-2">
              <span className="h-6 w-1 rounded-full bg-primary" />
              <h2 className="text-xl font-bold leading-tight text-foreground sm:text-2xl">Seu desempenho</h2>
            </div>
            <p className="ml-3 mt-1 text-sm leading-5 text-muted-foreground">
              Veja seus números e revise o que ainda não domina.
            </p>
          </div>

          {/* Atalhos */}
          <div className="grid grid-cols-2 gap-3">
            {ATALHOS.map((a, i) => {
              const Icon = a.icon;
              return (
                <motion.button
                  key={a.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => navigate(a.route)}
                  className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50"
                >
                  <Icon className="h-7 w-7" style={{ color: '#A78BFA' }} strokeWidth={1.8} />

                  <span className="text-[15px] font-bold text-foreground">{a.label}</span>
                  <span className="text-[12px] leading-snug text-muted-foreground">{a.desc}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

      </div>

      <QuestoesBottomNav />

      {/* Filtro completo */}
      <QuestoesFiltroSheet
        aberto={filtroAberto}
        onFechar={() => setFiltroAberto(false)}
        onAplicar={() => {
          setFiltroAberto(false);
          navigate('/questoes/praticar?filtro=1');
        }}
      />

    </div>
  );
};

export default Questoes;
