import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, History, Calendar, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import VadeMecumSubpage from '@/components/vademecum/outros/VadeMecumSubpage';
import { supabase } from '@/integrations/supabase/client';
import { tipoToSlug, leiToSlug } from '@/lib/legislacaoSlugs';

type HistoricoAlteracao = {
  id: string;
  lei_id: string;
  resumo_ia: string;
  data_alteracao: string;
  criado_em: string;
  lei: {
    nome: string;
    tipo: string;
    tabela_nome: string;
  };
};

const VadeMecumRecentes = () => {
  const navigate = useNavigate();
  const [alteracoes, setAlteracoes] = useState<HistoricoAlteracao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('vademecum_historico_alteracoes')
        .select(`
          id,
          lei_id,
          resumo_ia,
          data_alteracao,
          criado_em,
          lei:vade_mecum_leis(nome, tipo, tabela_nome)
        `)
        .order('criado_em', { ascending: false })
        .limit(30);

      if (!error && data) {
        setAlteracoes(data as any);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <VadeMecumSubpage titulo="Histórico" descricao="Últimas leis que sofreram atualizações legislativas">
      {loading ? (
        <div className="flex justify-center p-8">
          <Sparkles className="w-6 h-6 animate-pulse text-muted-foreground" />
        </div>
      ) : alteracoes.length === 0 ? (
        <div className="text-center py-16">
          <History className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Nenhuma lei alterada recentemente.</p>
        </div>
      ) : (
        <motion.div 
          className="space-y-3"
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
          }}
        >
          {alteracoes.map((alt) => (
            <motion.button
              key={alt.id}
              variants={{
                hidden: { opacity: 0, x: -10 },
                show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
              }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                navigate(`/legislacao/${tipoToSlug(alt.lei.tipo)}/${leiToSlug({ id: alt.lei_id, nome: alt.lei.nome })}`);
              }}
              className="w-full group flex flex-col p-4 rounded-2xl bg-card border border-border text-left hover:border-primary/50 transition-colors focus-visible:outline-none"
            >
              <div className="w-full flex items-center justify-between mb-2">
                <span className="font-display font-bold text-[15px] text-foreground truncate max-w-[85%] group-hover:text-primary transition-colors">{alt.lei.nome}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-yellow-500 mt-1 shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {alt.resumo_ia}
                </p>
              </div>
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/50 text-[11px] text-muted-foreground/70 font-semibold tracking-wide uppercase">
                <Calendar className="w-3.5 h-3.5" />
                <span>Atualizado em {new Date(alt.data_alteracao || alt.criado_em).toLocaleDateString('pt-BR')}</span>
              </div>
            </motion.button>
          ))}
        </motion.div>
      )}
    </VadeMecumSubpage>
  );
};

export default VadeMecumRecentes;
