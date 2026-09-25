import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Search, PocketKnife } from 'lucide-react';
import { motion } from 'framer-motion';
import { LEIS_CATALOG } from '@/data/leisCatalog';
import { leiPath } from '@/lib/legislacaoSlugs';
import { pushRecente } from '@/lib/leisRecentes';
import VadeMecumSubpage from '@/components/vademecum/outros/VadeMecumSubpage';

const norm = (v: string) => v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const VadeMecumEspeciais = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const leisEspeciais = useMemo(() => {
    const query = norm(q.trim());
    return LEIS_CATALOG.filter(
      (l) =>
        l.tipo === 'lei-especial' &&
        (!query || norm(`${l.nome} ${l.sigla} ${l.descricao} ${(l.tags || []).join(' ')}`).includes(query)),
    );
  }, [q]);

  return (
    <VadeMecumSubpage titulo="Legislação Especial" descricao="Leis penais especiais, extravagantes e normas regulatórias federais">
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar lei especial (ex: Maria da Penha, Drogas, LEP)…"
          className="w-full h-12 pl-11 pr-4 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 text-sm"
        />
      </div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3"
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.03 } }
        }}
      >
        {leisEspeciais.map((l) => (
          <motion.button
            key={l.id}
            variants={{
              hidden: { opacity: 0, y: 8 },
              show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 26 } }
            }}
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
            className="w-full group flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-card border border-border/70 text-left hover:border-primary/50 hover:bg-card/90 transition-all focus-visible:outline-none shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 font-bold text-xs font-display">
              {l.sigla || <PocketKnife className="w-5 h-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-foreground font-semibold text-sm truncate group-hover:text-primary transition-colors">
                {l.nome}
              </p>
              <p className="text-muted-foreground text-xs truncate">
                {l.descricao}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
          </motion.button>
        ))}

        {leisEspeciais.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <PocketKnife className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Nenhuma lei especial encontrada para a busca.</p>
          </div>
        )}
      </motion.div>
    </VadeMecumSubpage>
  );
};

export default VadeMecumEspeciais;
