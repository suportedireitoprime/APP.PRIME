import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { LEIS_CATALOG } from '@/data/leisCatalog';
import { leiPath } from '@/lib/legislacaoSlugs';
import { pushRecente } from '@/lib/leisRecentes';
import VadeMecumSubpage from '@/components/vademecum/VadeMecumSubpage';

const norm = (v: string) => v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const GRUPOS = [
  { id: 'constituicao', label: 'Constituição' },
  { id: 'codigo', label: 'Códigos' },
  { id: 'estatuto', label: 'Estatutos' },
];

const VadeMecumCodigos = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const grupos = useMemo(() => {
    const query = norm(q.trim());
    return GRUPOS.map((g) => ({
      ...g,
      leis: LEIS_CATALOG.filter(
        (l) =>
          l.tipo === g.id &&
          (!query || norm(`${l.nome} ${l.sigla} ${l.descricao}`).includes(query)),
      ),
    })).filter((g) => g.leis.length > 0);
  }, [q]);

  return (
    <VadeMecumSubpage titulo="Códigos" descricao="Constituição, códigos e estatutos na íntegra">
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar código ou estatuto…"
          className="w-full h-12 pl-11 pr-4 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <motion.div 
        className="space-y-6"
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.1 } }
        }}
      >
        {grupos.map((g) => (
          <motion.section 
            key={g.id}
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
            }}
          >
            <h2 className="font-display text-foreground text-[17px] font-bold mb-3">{g.label}</h2>
            <div className="space-y-2">
              {g.leis.map((l) => (
                <motion.button
                  key={l.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    pushRecente({
                      tipo: l.tipo,
                      leiId: l.id,
                      nome: l.nome,
                      descricao: l.descricao,
                      tabela_nome: l.tabela_nome,
                    });
                    navigate(leiPath(l));
                  }}
                  className="w-full group flex items-center gap-3 p-4 rounded-2xl bg-card border border-border text-left hover:border-primary/50 transition-colors focus-visible:outline-none"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground font-semibold text-sm truncate group-hover:text-primary transition-colors">{l.nome}</p>
                    <p className="text-muted-foreground text-xs truncate">{l.descricao}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
                </motion.button>
              ))}
            </div>
          </motion.section>
        ))}
        {grupos.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-10">Nenhum resultado.</p>
        )}
      </motion.div>
    </VadeMecumSubpage>
  );
};

export default VadeMecumCodigos;
