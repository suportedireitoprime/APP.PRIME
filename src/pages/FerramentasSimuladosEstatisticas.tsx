import React from 'react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, TrendingUp, Target, BookOpen, Clock, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function FerramentasSimuladosEstatisticas() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['simulados_stats', user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Não autenticado");

      // Buscar histórico finalizado do usuário
      const { data: historicos, error: histError } = await supabase
        .from('user_simulados_historico')
        .select('*, simulados(title)')
        .eq('user_id', user.id)
        .eq('status', 'finalizado')
        .order('completed_at', { ascending: false });

      if (histError) throw histError;

      // Buscar respostas para gerar agregados por disciplina
      const { data: respostas, error: respError } = await supabase
        .from('user_simulados_respostas')
        .select(`
          acertou,
          disciplina,
          user_simulados_historico!inner(user_id)
        `)
        .eq('user_simulados_historico.user_id', user.id);

      if (respError) throw respError;

      // Calcular disciplinas
      const disciplinasMap: Record<string, { certas: number; total: number }> = {};
      let totalCertas = 0;

      respostas.forEach(r => {
        const d = r.disciplina || 'Outros';
        if (!disciplinasMap[d]) {
          disciplinasMap[d] = { certas: 0, total: 0 };
        }
        disciplinasMap[d].total += 1;
        if (r.acertou) {
          disciplinasMap[d].certas += 1;
          totalCertas += 1;
        }
      });

      const performancePorDisciplina = Object.entries(disciplinasMap)
        .map(([name, counts]) => ({
          name,
          certas: counts.certas,
          total: counts.total,
          percent: Math.round((counts.certas / counts.total) * 100)
        }))
        .sort((a, b) => b.percent - a.percent);

      const totalRespondidas = respostas.length;
      const mediaGeral = totalRespondidas > 0 ? Math.round((totalCertas / totalRespondidas) * 100) : 0;

      return {
        historicos: historicos || [],
        totalSimulados: historicos?.length || 0,
        totalRespondidas,
        totalCertas,
        mediaGeral,
        performancePorDisciplina
      };
    },
    enabled: !!user
  });

  const COLORS = ['#22c55e', '#ef4444'];

  return (
    <div className="min-h-screen bg-background pb-[calc(6rem+var(--sai-bottom))]">
      <PageHeader 
        title="Estatísticas" 
        showBack={true} 
      />
      
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Carregando estatísticas...</p>
          </div>
        ) : (
          <>
            {/* Cards Superiores */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card border border-border p-4 rounded-xl flex flex-col items-center justify-center text-center">
                <Target className="w-6 h-6 text-primary mb-2" />
                <span className="text-2xl font-bold text-foreground">{stats?.totalSimulados || 0}</span>
                <span className="text-xs text-muted-foreground mt-1">Simulados Feitos</span>
              </div>
              <div className="bg-card border border-border p-4 rounded-xl flex flex-col items-center justify-center text-center">
                <BookOpen className="w-6 h-6 text-primary mb-2" />
                <span className="text-2xl font-bold text-foreground">{stats?.totalRespondidas || 0}</span>
                <span className="text-xs text-muted-foreground mt-1">Questões Resolvidas</span>
              </div>
              <div className="bg-card border border-border p-4 rounded-xl flex flex-col items-center justify-center text-center">
                <TrendingUp className="w-6 h-6 text-green-500 mb-2" />
                <span className="text-2xl font-bold text-foreground">{stats?.totalCertas || 0}</span>
                <span className="text-xs text-muted-foreground mt-1">Acertos</span>
              </div>
              <div className="bg-card border border-border p-4 rounded-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5"></div>
                <Activity className="w-6 h-6 text-primary mb-2 relative z-10" />
                <span className="text-2xl font-bold text-foreground relative z-10">{stats?.mediaGeral || 0}%</span>
                <span className="text-xs text-muted-foreground mt-1 relative z-10">Média Geral</span>
              </div>
            </div>

            {/* Performance por Disciplina */}
            <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                Performance por Disciplina
              </h3>
              
              {stats?.performancePorDisciplina && stats.performancePorDisciplina.length > 0 ? (
                <div className="space-y-4">
                  {stats.performancePorDisciplina.map((disc) => (
                    <div key={disc.name} className="flex flex-col space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-foreground truncate mr-2">{disc.name}</span>
                        <span className="text-muted-foreground whitespace-nowrap">{disc.percent}% ({disc.certas}/{disc.total})</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className={`bg-primary h-2 rounded-full`} 
                          style={{ width: `${disc.percent}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  Nenhum dado de disciplina encontrado ainda.
                </div>
              )}
            </div>

            {/* Gráfico Geral de Acertos/Erros */}
            <div className="bg-card border border-border rounded-xl p-4 sm:p-6 flex flex-col items-center">
               <h3 className="text-lg font-bold text-foreground mb-2 w-full text-left">Visão Geral</h3>
               {stats && stats.totalRespondidas > 0 ? (
                 <div className="h-64 w-full max-w-sm">
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie
                         data={[
                           { name: 'Acertos', value: stats.totalCertas },
                           { name: 'Erros', value: stats.totalRespondidas - stats.totalCertas }
                         ]}
                         cx="50%"
                         cy="50%"
                         innerRadius={60}
                         outerRadius={80}
                         paddingAngle={5}
                         dataKey="value"
                       >
                         {[
                           { name: 'Acertos', value: stats.totalCertas },
                           { name: 'Erros', value: stats.totalRespondidas - stats.totalCertas }
                         ].map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                         ))}
                       </Pie>
                       <Tooltip 
                         contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }}
                         itemStyle={{ color: '#fff' }}
                       />
                     </PieChart>
                   </ResponsiveContainer>
                 </div>
               ) : (
                 <div className="text-center py-6 text-muted-foreground w-full">
                   Resolva simulados para gerar o gráfico.
                 </div>
               )}
            </div>

            {/* Histórico Recente */}
            <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-primary" />
                Últimos Simulados Finalizados
              </h3>
              
              {stats?.historicos && stats.historicos.length > 0 ? (
                <div className="space-y-3">
                  {stats.historicos.slice(0, 5).map((h: any) => (
                    <div key={h.id} className="p-3 border border-border/50 rounded-lg bg-background/50 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm text-foreground line-clamp-1">{h.simulados?.title || 'Simulado'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(h.completed_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded">
                          {h.acertos} / {h.total_questoes}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  Você ainda não finalizou nenhum simulado.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
