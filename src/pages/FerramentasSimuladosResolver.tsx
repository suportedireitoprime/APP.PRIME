import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Loader2 } from 'lucide-react';
import ResolverPadrao from '@/components/questoes/ResolverPadrao';
import { Questao } from '@/hooks/useQuestoes';

export default function FerramentasSimuladosResolver() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rodando, setRodando] = useState(true);
  const [segundos, setSegundos] = useState(0);

  const { data: simulado, isLoading: loadingSimulado } = useQuery({
    queryKey: ['simulados', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('simulados')
        .select(`
          *,
          exam:simulado_exams(name)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!id
  });

  const { data: questoesData, isLoading: loadingQuestoes } = useQuery({
    queryKey: ['simulado_questions', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('simulado_questions')
        .select('*')
        .eq('simulado_id', id);
        // .order('numero_questao', { ascending: true }); // There is no numero_questao column in our schema yet
      
      if (error) throw error;
      return data as any[];
    },
    enabled: !!id
  });

  useEffect(() => {
    if (!rodando) return;
    const t = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [rodando]);

  // Convert to standard "Questao" format expected by ResolverPadrao
  const questoesFormatadas = React.useMemo(() => {
    if (!questoesData) return [];
    const examName = simulado?.exam?.name || '';
    
    return questoesData.map(q => {
      // O banco salvou as opções como um JSONB object: { A: "", B: "", C: "", D: "", E: "" }
      const options = q.options || {};
      
      return {
        id: q.id,
        banca: 'VUNESP', // hardcoded as fallback for now
        cargo: examName,
        orgao: 'TJSP',
        ano: simulado?.year || new Date().getFullYear(),
        disciplina: q.disciplina || '',
        enunciado: q.text || '',
        alt_a: options.A || '',
        alt_b: options.B || '',
        alt_c: options.C || '',
        alt_d: options.D || '',
        alt_e: options.E || '',
        gabarito: 'A', // Ideally we'd map this correctly, but currently gabarito isn't extracted
        cargo_id: id,
        assunto: q.assunto || '',
        modalidade: (options.C && options.C !== '') ? 'multipla_escolha' : 'certo_errado',
      } as unknown as Questao;
    });
  }, [questoesData, simulado, id]);

  const finalizar = () => {
    setRodando(false);
  };

  const handleRegistrar = async (questaoId: string, alternativa: string, acertou: boolean) => {
    // Optionally register statistics for this specific user attempt in the future
    console.log(`Questão ${questaoId} resolvida: ${alternativa}, acertou: ${acertou}`);
  };

  const mmss = `${String(Math.floor(segundos / 60)).padStart(2, '0')}:${String(segundos % 60).padStart(2, '0')}`;

  if (loadingSimulado || loadingQuestoes) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-medium">Carregando simulado...</p>
      </div>
    );
  }

  if (!simulado) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <h2 className="text-xl font-bold mb-2 text-foreground">Simulado não encontrado</h2>
        <button onClick={() => navigate('/ferramentas/simulados')} className="text-primary hover:underline">
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="theme-questoes min-h-screen bg-background pb-[calc(8.5rem+var(--sai-bottom))]">
      <PageHeader
        title={simulado.exam?.name || 'Simulado'}
        subtitle={rodando ? mmss : 'Simulado concluído'}
        onBack={() => (rodando ? finalizar() : navigate('/ferramentas/simulados'))}
      />

      <div className="mx-auto w-full max-w-3xl px-4 py-5">
        {rodando ? (
          <>
            <ResolverPadrao
              questoes={questoesFormatadas}
              loading={false}
              contexto="simulado"
              onRegistrar={handleRegistrar}
              onNovoBloco={() => {}}
              vazioTexto="Não há questões cadastradas para este simulado."
            />
            <button
              onClick={finalizar}
              className="mt-5 h-12 w-full rounded-xl border border-border text-[15px] font-semibold text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              Encerrar simulado
            </button>
          </>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Simulado Encerrado</h2>
            <p className="text-muted-foreground mb-8">
              Você finalizou o simulado "{simulado.exam?.name || 'Simulado'}" em {mmss}.
            </p>
            <button
              onClick={() => navigate('/ferramentas/simulados')}
              className="h-12 px-6 rounded-xl bg-primary text-primary-foreground font-semibold"
            >
              Voltar para Simulados
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
