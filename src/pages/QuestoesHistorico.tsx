import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { getSessoes, removeSessao, type SessaoHistorico } from '@/lib/questoesSessoes';
import { haptic } from '@/lib/nativeHaptics';
import { Layers, PlayCircle, Trash2, Calendar, Target, CheckCircle2 } from 'lucide-react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useGoBack } from '@/hooks/useGoBack';
import { motion } from 'framer-motion';

export default function QuestoesHistorico() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [sessoes, setSessoes] = useState<SessaoHistorico[]>(getSessoes());

  const handleExcluir = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.selection();
    removeSessao(id);
    setSessoes(getSessoes());
  };

  const handleContinuar = (id: string) => {
    haptic.selection();
    navigate(`/questoes/praticar?sessao=${id}`);
  };

  // Agrupar sessões por data
  const agrupado = useMemo(() => {
    const grupos: Record<string, SessaoHistorico[]> = {};
    for (const s of sessoes) {
      const data = parseISO(s.dataInicio);
      let chave = format(data, "dd 'de' MMMM", { locale: ptBR });
      if (isToday(data)) chave = 'Hoje';
      else if (isYesterday(data)) chave = 'Ontem';

      if (!grupos[chave]) grupos[chave] = [];
      grupos[chave].push(s);
    }
    return grupos;
  }, [sessoes]);

  return (
    <div className="theme-questoes min-h-screen bg-background pb-safe">
      <PageHeader title="Histórico de Sessões" onBack={() => goBack()} />

      <div className="mx-auto w-full max-w-3xl px-4 py-6 space-y-8">
        {sessoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 opacity-60">
            <Layers className="w-16 h-16 mb-4" />
            <p className="text-lg font-bold">Nenhum histórico</p>
            <p className="text-sm mt-1 max-w-[250px]">
              Seus exercícios salvos e sessões iniciadas aparecerão aqui.
            </p>
          </div>
        ) : (
          Object.entries(agrupado).map(([chave, itens]) => (
            <div key={chave} className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">{chave}</h3>
              </div>

              <motion.div 
                className="space-y-3"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
                }}
              >
                {itens.map((sessao) => {
                  const respondidas = Object.keys(sessao.respostas).length;
                  const total = sessao.questoes.length;
                  const finalizada = respondidas === total;
                  const pct = total > 0 ? Math.round((respondidas / total) * 100) : 0;
                  
                  return (
                    <motion.div 
                      key={sessao.id}
                      variants={{
                        hidden: { opacity: 0, scale: 0.95 },
                        show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
                      }}
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleContinuar(sessao.id)}
                      className="group relative flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 transition-colors hover:border-primary/50 hover:shadow-md cursor-pointer focus-visible:outline-none"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-foreground text-base leading-tight pr-8 group-hover:text-primary transition-colors">
                            {sessao.filtroAplicado}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-1 font-semibold flex items-center gap-1.5">
                            <Target className="w-3 h-3" />
                            Progresso: {respondidas} de {total} ({pct}%)
                          </p>
                        </div>
                        <motion.button 
                          whileTap={{ scale: 0.8 }}
                          onClick={(e) => handleExcluir(sessao.id, e)}
                          className="absolute right-4 top-4 p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors focus-visible:outline-none"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>

                      {/* Barra de progresso visual */}
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-500" 
                          style={{ width: `${pct}%` }} 
                        />
                      </div>

                      <div className="flex justify-between items-center pt-1 border-t border-border/50">
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {format(parseISO(sessao.dataUltimoAcesso), "HH:mm", { locale: ptBR })}
                        </span>
                        
                        <div className="flex items-center gap-1.5 font-bold text-xs text-primary group-hover:scale-105 transition-transform">
                          {finalizada ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" /> Finalizado
                            </>
                          ) : (
                            <>
                              <PlayCircle className="w-4 h-4" /> Continuar
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
