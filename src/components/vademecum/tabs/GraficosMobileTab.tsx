import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Layers, CheckCircle2, Sparkles, ChevronRight } from 'lucide-react';
import { DominioRadarChart } from '@/components/graficos/DominioRadarChart';
import { useMetricasResumo } from '@/hooks/useMetricasResumo';

export default function GraficosMobileTab() {
  const navigate = useNavigate();
  const { data: metricas } = useMetricasResumo();

  return (
    <motion.div
      key="graficos"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
      className="space-y-6 px-1 pb-8 pt-2"
    >
      {/* Cards Superiores */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border/60 bg-secondary/30 p-4 text-center relative overflow-hidden">
          <PlayCircle className="w-6 h-6 text-muted-foreground/70 mb-1" strokeWidth={1.5} />
          <span className="font-display font-bold text-xl text-foreground leading-none">{metricas?.aulas || 0}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Aulas</span>
        </div>
        
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border/60 bg-secondary/30 p-4 text-center relative overflow-hidden">
          <Layers className="w-6 h-6 text-muted-foreground/70 mb-1" strokeWidth={1.5} />
          <span className="font-display font-bold text-xl text-foreground leading-none">{metricas?.flashcards || 0}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Flashcards</span>
        </div>

        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border/60 bg-secondary/30 p-4 text-center relative overflow-hidden">
          <CheckCircle2 className="w-6 h-6 text-muted-foreground/70 mb-1" strokeWidth={1.5} />
          <span className="font-display font-bold text-xl text-foreground leading-none">{metricas?.questoes || 0}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Questões</span>
        </div>
      </div>

      {/* Radar Chart */}
      <div>
        <h3 className="font-display text-foreground text-[18px] font-bold mb-3 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-primary" />
          Domínio por Área
        </h3>
        <DominioRadarChart />
      </div>

      {/* Inteligência / Quiz Placeholder */}
      <div>
        <h3 className="font-display text-foreground text-[18px] font-bold mb-3 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-primary" />
          Avaliação Inteligente
        </h3>
        <button onClick={() => navigate('/graficos/avaliacao')} className="w-full text-left rounded-3xl border border-primary/20 bg-primary/5 p-5 relative overflow-hidden group hover:border-primary/40 transition-colors active:scale-[0.98]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          <div className="flex flex-col gap-4 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="font-display font-bold text-foreground text-[16px] mb-1">Descobrir meu Nível</h4>
                <p className="text-sm text-muted-foreground leading-relaxed pr-2">
                  A IA fará perguntas dinâmicas do fácil ao difícil para mapear exatamente onde estão suas lacunas.
                </p>
              </div>
            </div>
            <div className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2">
              Iniciar Agora <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </button>
      </div>
    </motion.div>
  );
}
