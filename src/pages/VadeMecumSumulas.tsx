import { useNavigate } from 'react-router-dom';
import { ChevronRight, ScrollText, Gavel, Scale, Newspaper, ListChecks } from 'lucide-react';
import { motion } from 'framer-motion';
import VadeMecumSubpage from '@/components/vademecum/VadeMecumSubpage';

const ITENS = [
  { label: 'Súmulas Vinculantes', desc: 'Efeito vinculante para o Judiciário', to: '/jurisprudencia/sumulas-vinculantes', icon: Gavel },
  { label: 'Súmulas do STF', desc: 'Supremo Tribunal Federal', to: '/jurisprudencia/sumulas-stf', icon: Scale },
  { label: 'Súmulas do STJ', desc: 'Superior Tribunal de Justiça', to: '/jurisprudencia/sumulas-stj', icon: ScrollText },
  { label: 'Teses do STJ', desc: 'Teses firmadas em repetitivos', to: '/jurisprudencia/teses-stj', icon: ListChecks },
  { label: 'Informativos do STF', desc: 'Julgados recentes comentados', to: '/jurisprudencia/informativos-stf', icon: Newspaper },
  { label: 'Informativos do STJ', desc: 'Julgados recentes comentados', to: '/jurisprudencia/informativos-stj', icon: Newspaper },
];

const VadeMecumSumulas = () => {
  const navigate = useNavigate();

  return (
    <VadeMecumSubpage titulo="Súmulas" descricao="Súmulas, teses e informativos dos tribunais">
      <motion.div 
        className="space-y-2"
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
        }}
      >
        {ITENS.map((i) => {
          const Icon = i.icon;
          return (
            <motion.button
              key={i.to}
              variants={{
                hidden: { opacity: 0, x: -10 },
                show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
              }}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(i.to)}
              className="w-full group flex items-center gap-3 p-4 rounded-2xl bg-card border border-border text-left hover:border-primary/50 transition-colors focus-visible:outline-none"
            >
              <span className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-foreground font-semibold text-sm group-hover:text-primary transition-colors">{i.label}</span>
                <span className="block text-muted-foreground text-xs">{i.desc}</span>
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
            </motion.button>
          );
        })}
      </motion.div>
    </VadeMecumSubpage>
  );
};

export default VadeMecumSumulas;
