import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Rocket, Star, ShieldCheck, Zap, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useGoBack } from '@/hooks/useGoBack';

interface AppUpdate {
  version: string;
  title: string;
  date: string;
  description: string;
  features: string[];
}

export default function NovidadesApp() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [updates, setUpdates] = useState<AppUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUpdates() {
      try {
        const { data, error } = await supabase.functions.invoke('app-updates');
        if (error) throw error;
        setUpdates(data.updates || []);
      } catch (err) {
        console.error('Erro ao buscar novidades do app:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchUpdates();
  }, []);

  const getIconForFeature = (feature: string) => {
    const text = feature.toLowerCase();
    if (text.includes('desempenho') || text.includes('rápida') || text.includes('rápido')) return <Zap className="w-4 h-4 text-amber-500" />;
    if (text.includes('segurança') || text.includes('correção') || text.includes('falha')) return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
    if (text.includes('novo') || text.includes('nova') || text.includes('inédito')) return <Star className="w-4 h-4 text-blue-500" />;
    return <ArrowRight className="w-4 h-4 text-primary" />;
  };

  return (
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
      {/* Header Fixo */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5 pt-[calc(env(safe-area-inset-top,0px)+0.5rem)] pb-3 px-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={goBack}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">Atualizações do App</h1>
            <p className="text-xs text-muted-foreground font-medium">Veja tudo que construímos para você</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
            <Rocket className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-black text-white uppercase tracking-wider">Histórico de Versões</h2>
            <p className="text-sm text-white/50 mt-0.5">Estamos sempre evoluindo.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
            <p className="text-sm font-medium">Buscando atualizações...</p>
          </div>
        ) : (
          <div className="relative pl-6 border-l-2 border-white/10 space-y-12 pb-12">
            {updates.map((update, index) => (
              <motion.div 
                key={update.version}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="relative"
              >
                {/* Ponto na timeline */}
                <div className="absolute -left-[35px] top-1 w-4 h-4 rounded-full bg-background border-2 border-primary z-10 shadow-[0_0_12px_rgba(var(--primary-rgb),0.5)]" />
                
                {/* Card de versão */}
                <div className="bg-[#121417] border border-white/5 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden group">
                  {/* Gradiente sutil no fundo */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-opacity group-hover:bg-primary/20" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 relative z-10">
                    <div className="flex items-center gap-3">
                      <span className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-xs font-bold tracking-widest">
                        v{update.version}
                      </span>
                      <span className="text-white font-bold text-lg">{update.title}</span>
                    </div>
                    <span className="text-xs font-semibold text-white/40 bg-white/5 px-2.5 py-1 rounded-md">
                      {new Date(update.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  
                  <p className="text-sm text-white/70 leading-relaxed mb-5 relative z-10">
                    {update.description}
                  </p>
                  
                  <div className="space-y-3 relative z-10">
                    {update.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                        <div className="mt-0.5 p-1 bg-white/5 rounded-lg shrink-0">
                          {getIconForFeature(feature)}
                        </div>
                        <span className="text-[13px] text-white/80 font-medium leading-snug">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}

            {updates.length === 0 && !loading && (
              <p className="text-center text-white/50 py-10 text-sm">Nenhuma atualização encontrada.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
