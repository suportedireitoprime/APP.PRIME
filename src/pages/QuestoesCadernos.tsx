import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, NotebookPen, Trash2, ChevronRight, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { useCadernos } from '@/hooks/useQuestoesExtras';
import QuestoesFiltroSheet, { FILTRO_KEY, FILTRO_VAZIO, type QuestoesFiltro } from '@/components/questoes/QuestoesFiltroSheet';
import { toast } from 'sonner';
import { useGoBack } from '@/hooks/useGoBack';

type Modelo = { nome: string; descricao: string; cor: string; filtros: Partial<QuestoesFiltro> };

const MODELOS: Modelo[] = [
  { nome: 'Meu caderno de Penal', descricao: 'Direito Penal do zero ao avançado', cor: '#EF4444', filtros: { disciplinas: ['Direito Penal'] } },
  { nome: 'Caderno da faculdade', descricao: 'Só questões conceituais da matéria', cor: '#22C55E', filtros: { segmentos: ['conceituais'] } },
  { nome: 'Caderno de concurso', descricao: 'Questões de concursos de todas as bancas', cor: '#3B82F6', filtros: { segmentos: ['concursos'] } },
  { nome: 'Caderno da OAB', descricao: 'Exame de Ordem (FGV)', cor: '#8B5CF6', filtros: { segmentos: ['oab'] } },
  { nome: 'Meus erros', descricao: 'Volte no que você errou', cor: '#F59E0B', filtros: { status: 'errei' } },
];

const QuestoesCadernos = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { cadernos, loading, criar, remover } = useCadernos();
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [nomeNovo, setNomeNovo] = useState('');

  const abrirCaderno = (filtros: QuestoesFiltro) => {
    try { sessionStorage.setItem(FILTRO_KEY, JSON.stringify({ ...FILTRO_VAZIO, ...filtros })); } catch { /* noop */ }
    navigate('/questoes/praticar?filtro=1');
  };

  const criarDeModelo = async (m: Modelo) => {
    await criar({ nome: m.nome, descricao: m.descricao, cor: m.cor, filtros: { ...FILTRO_VAZIO, ...m.filtros } as QuestoesFiltro });
    toast.success('Caderno criado');
  };

  return (
    <div className="theme-questoes min-h-screen bg-background pb-24">
      <div className="mx-auto w-full max-w-3xl">
        <PageHeader title="Cadernos" subtitle="Monte seus blocos de estudo" onBack={() => goBack()} />

        <div className="px-4 py-5">
          {/* Novo caderno */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <p className="text-[15px] font-bold text-foreground">Novo caderno</p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">Dê um nome e escolha os filtros.</p>
            <input
              value={nomeNovo}
              onChange={(e) => setNomeNovo(e.target.value)}
              placeholder="Ex.: Meu caderno de Constitucional"
              className="mt-3 h-11 w-full rounded-xl border border-border bg-background px-3 text-[14px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50 transition-colors"
            />
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (!nomeNovo.trim()) { toast.error('Dê um nome ao caderno'); return; }
                setFiltroAberto(true);
              }}
              className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-bold text-primary-foreground focus-visible:outline-none"
            >
              <Plus className="h-5 w-5" /> Escolher filtros e salvar
            </motion.button>
          </motion.div>

          {/* Modelos */}
          <div className="pt-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary/90">Prontos</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="h-6 w-1 rounded-full bg-primary" />
              <h2 className="text-xl font-bold leading-tight text-foreground">Modelos</h2>
            </div>
            <motion.div 
              className="mt-3 grid grid-cols-2 gap-3"
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
              }}
            >
              {MODELOS.map((m, i) => (
                <motion.button
                  key={m.nome}
                  variants={{
                    hidden: { opacity: 0, scale: 0.95 },
                    show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => criarDeModelo(m)}
                  className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50 focus-visible:outline-none"
                >
                  <Sparkles className="h-6 w-6" style={{ color: m.cor }} strokeWidth={1.8} />
                  <span className="text-[14px] font-bold leading-tight text-foreground">{m.nome}</span>
                  <span className="text-[11px] leading-snug text-muted-foreground">{m.descricao}</span>
                </motion.button>
              ))}
            </motion.div>
          </div>

          {/* Meus cadernos */}
          <div className="pt-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary/90">Seus</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="h-6 w-1 rounded-full bg-primary" />
              <h2 className="text-xl font-bold leading-tight text-foreground">Meus cadernos</h2>
            </div>

            <motion.div 
              className="mt-3 space-y-3"
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.2 } }
              }}
            >
              {loading && <p className="text-sm text-muted-foreground">Carregando…</p>}
              {!loading && cadernos.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Você ainda não tem cadernos. Crie um do zero ou use um modelo.
                </p>
              )}
              {cadernos.map((c) => (
                <motion.div 
                  key={c.id} 
                  variants={{
                    hidden: { opacity: 0, x: -10 },
                    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
                  }}
                  whileHover={{ scale: 1.01 }}
                  className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
                >
                  <NotebookPen className="h-6 w-6 shrink-0" style={{ color: c.cor }} strokeWidth={1.8} />
                  <button onClick={() => abrirCaderno(c.filtros)} className="min-w-0 flex-1 text-left focus-visible:outline-none">
                    <span className="block truncate text-[15px] font-bold text-foreground group-hover:text-primary transition-colors">{c.nome}</span>
                    <span className="block truncate text-[12px] text-muted-foreground">{c.descricao ?? 'Caderno personalizado'}</span>
                  </button>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => remover(c.id)} aria-label="Excluir caderno" className="p-2 text-muted-foreground hover:text-destructive focus-visible:outline-none">
                    <Trash2 className="h-4 w-4" />
                  </motion.button>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      <QuestoesFiltroSheet
        aberto={filtroAberto}
        onFechar={() => setFiltroAberto(false)}
        onAplicar={async () => {
          setFiltroAberto(false);
          let filtros: QuestoesFiltro = FILTRO_VAZIO;
          try {
            const raw = sessionStorage.getItem(FILTRO_KEY);
            if (raw) filtros = { ...FILTRO_VAZIO, ...JSON.parse(raw) };
          } catch { /* noop */ }
          await criar({ nome: nomeNovo.trim(), filtros });
          setNomeNovo('');
          toast.success('Caderno salvo');
        }}
      />
    </div>
  );
};

export default QuestoesCadernos;
