// @ts-nocheck
import React from 'react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, TrendingUp, Target, BookOpen, Clock, Award, ArrowLeft, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ShapeGrid from '@/components/ui/ShapeGrid';

export default function SimuladosEstatisticas() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['simulados_stats_full_page', user?.id],
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    enabled: !!user,
    queryFn: async () => {
      const { data: historicos, error: histError } = await supabase
        .from('user_simulados_historico')
        .select(`
          *,
          simulados:simulado_id(
            id,
            year,
            prova_url,
            exam:simulado_exams(name)
          )
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (histError) throw histError;

      const { data: respostas, error: respError } = await supabase
        .from('user_simulados_respostas')
        .select(`
          acertou,
          disciplina,
          assunto,
          user_simulados_historico!inner(user_id)
        `)
        .eq('user_simulados_historico.user_id', user.id);

      if (respError) throw respError;

      const discMap: Record<string, { certas: number; total: number }> = {};
      let totalCertas = 0;

      respostas?.forEach(r => {
        const d = r.disciplina || 'Outras Matérias';
        if (!discMap[d]) discMap[d] = { certas: 0, total: 0 };
        discMap[d].total += 1;
        if (r.acertou) {
          discMap[d].certas += 1;
          totalCertas += 1;
        }
      });

      const ranking = Object.entries(discMap).map(([name, item]) => ({
        name,
        certas: item.certas,
        total: item.total,
        pct: Math.round((item.certas / item.total) * 100)
      })).sort((a, b) => b.pct - a.pct);

      const totalRespondidas = respostas?.length || 0;
      const mediaGeral = totalRespondidas > 0 ? Math.round((totalCertas / totalRespondidas) * 100) : 0;

      return {
        historicos: historicos || [],
        totalSimulados: historicos?.length || 0,
        totalRespondidas,
        totalCertas,
        mediaGeral,
        ranking
      };
    }
  });

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-16">
      <div className="fixed inset-0 pointer-events-none z-0 opacity-80">
        <ShapeGrid speed={0.4} squareSize={44} direction="diagonal" borderColor="rgba(255, 255, 255, 0.04)" hoverFillColor="rgba(255, 255, 255, 0.08)" shape="square" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-4 space-y-6">
        <PageHeader
          title="Estatísticas dos Simulados"
          subtitle="Aproveitamento geral, corte da 1ª Fase e ranking por matéria"
          onBack={() => navigate('/simulados')}
        />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
            <p className="text-zinc-400 text-sm">Carregando métricas...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cards Superiores */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-zinc-900/80 border border-white/10 p-4 rounded-2xl text-center">
                <Target className="w-6 h-6 text-primary mx-auto mb-1.5" />
                <span className="text-2xl font-black text-white">{stats?.totalSimulados || 0}</span>
                <span className="text-[11px] uppercase tracking-wider text-zinc-400 block mt-0.5">Simulados Feitos</span>
              </div>
              <div className="bg-zinc-900/80 border border-white/10 p-4 rounded-2xl text-center">
                <BookOpen className="w-6 h-6 text-primary mx-auto mb-1.5" />
                <span className="text-2xl font-black text-white">{stats?.totalRespondidas || 0}</span>
                <span className="text-[11px] uppercase tracking-wider text-zinc-400 block mt-0.5">Questões Feitas</span>
              </div>
              <div className="bg-zinc-900/80 border border-white/10 p-4 rounded-2xl text-center">
                <TrendingUp className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />
                <span className="text-2xl font-black text-emerald-400">{stats?.totalCertas || 0}</span>
                <span className="text-[11px] uppercase tracking-wider text-zinc-400 block mt-0.5">Total Acertos</span>
              </div>
              <div className="bg-zinc-900/80 border border-white/10 p-4 rounded-2xl text-center">
                <Trophy className="w-6 h-6 text-amber-400 mx-auto mb-1.5" />
                <span className="text-2xl font-black text-amber-400">{stats?.mediaGeral || 0}%</span>
                <span className="text-[11px] uppercase tracking-wider text-zinc-400 block mt-0.5">Média Geral</span>
              </div>
            </div>

            {/* Ranking por Matéria */}
            <div className="bg-zinc-900/80 border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4">
              <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" /> Aproveitamento por Disciplina
              </h3>

              {stats?.ranking && stats.ranking.length > 0 ? (
                <div className="space-y-3">
                  {stats.ranking.map((item, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-300 font-bold">{item.name}</span>
                        <span className="text-zinc-400 font-semibold">{item.certas}/{item.total} ({item.pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.pct >= 50 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 text-center py-6">
                  Nenhuma resposta computada ainda. Conclua um simulado para ver o ranking.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

