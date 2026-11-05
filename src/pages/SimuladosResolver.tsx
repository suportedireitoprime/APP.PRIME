// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Loader2, AlertTriangle } from 'lucide-react';
import ResolverPadrao from '@/components/questoes/ResolverPadrao';
import { Questao } from '@/hooks/useQuestoes';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export default function SimuladosResolver() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initialSimulado = location.state?.simulado;
  const [rodando, setRodando] = useState(true);
  const [segundos, setSegundos] = useState(0);
  const [confirmarSaida, setConfirmarSaida] = useState(false);
  const [historicoId, setHistoricoId] = useState<string | null>(null);

  const { user } = useAuth();

  const { mutateAsync: registerHistory } = useMutation({
    mutationFn: async () => {
      if (!user || !id) return null;
      
      const { data: existing } = await supabase
        .from('user_simulados_historico')
        .select('id')
        .eq('user_id', user.id)
        .eq('simulado_id', id)
        .eq('status', 'em_andamento')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (existing) {
        return existing.id;
      }
      
      const { data: newHistory, error } = await supabase
        .from('user_simulados_historico')
        .insert({
          user_id: user.id,
          simulado_id: id,
          status: 'em_andamento',
        })
        .select('id')
        .single();
        
      if (error) throw error;
      return newHistory.id;
    },
    onSuccess: (hid) => {
      if (hid) setHistoricoId(hid);
    }
  });

  const { mutate: finishHistory } = useMutation({
    mutationFn: async (hId: string) => {
      if (!user) return;
      await supabase
        .from('user_simulados_historico')
        .update({
          status: 'finalizado',
          completed_at: new Date().toISOString(),
          total_questoes: questoesData?.length || 0,
        })
        .eq('id', hId);
    }
  });

  useEffect(() => {
    if (user && id && questoesData && !historicoId) {
      registerHistory();
    }
  }, [user, id, questoesData, historicoId, registerHistory]);

  const { data: simulado, isLoading: loadingSimulado } = useQuery({
    queryKey: ['simulados', id],
    initialData: initialSimulado,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
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
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('simulado_questions')
          .select('*')
          .eq('simulado_id', id)
          .order('numero_questao', { ascending: true, nullsFirst: false });
        
        if (error) {
          console.warn('Erro ao buscar questões:', error);
          return [];
        }
        return data as any[];
      } catch (err) {
        console.warn('Falha na query de questões:', err);
        return [];
      }
    },
    enabled: !!id
  });

  useEffect(() => {
    if (!rodando) return;
    const t = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [rodando]);

  // Converter para o formato padrão do ResolverPadrao
  const questoesFormatadas = React.useMemo(() => {
    if (!questoesData) return [];
    const examName = simulado?.exam?.name || '';
    const isOAB = examName.toLowerCase().includes('oab') || (simulado?.prova_url || '').toLowerCase().includes('oab');
    const defaultBanca = isOAB ? ((simulado?.year || 2024) >= 2010 ? 'FGV' : 'CESPE/OAB') : 'VUNESP';
    const defaultOrgao = isOAB ? 'OAB' : 'Tribunal de Justiça';

    return questoesData.map(q => {
      const options = q.options || {};
      
      const fullComentario = [
        q.correct_comment ? `Gabarito Comentado:\n${q.correct_comment}` : '',
        q.incorrect_comment ? `Análise das Demais Alternativas:\n${q.incorrect_comment}` : '',
        q.base_legal ? `Base Legal: ${q.base_legal}` : '',
      ].filter(Boolean).join('\n\n') || q.correct_comment || '';

      return {
        id: q.id,
        numero_questao: q.numero_questao ? String(q.numero_questao) : undefined,
        banca: defaultBanca,
        cargo: examName || (isOAB ? 'Advogado (Exame de Ordem)' : 'Juiz Substituto'),
        orgao: defaultOrgao,
        ano: simulado?.year || new Date().getFullYear(),
        disciplina: q.disciplina || '',
        enunciado: q.text || '',
        alt_a: options.A || '',
        alt_b: options.B || '',
        alt_c: options.C || '',
        alt_d: options.D || '',
        alt_e: options.E || '',
        gabarito_oficial: q.gabarito || 'A',
        gabarito_comentado: fullComentario,
        comentario_incorretas: q.incorrect_comment || '',
        base_legal: q.base_legal || '',
        dificuldade: q.dificuldade || '',
        status: q.status || '',
        observacao: q.observacao || '',
        cargo_id: id,
        assunto: q.assunto || '',
        modalidade: (options.C && options.C !== '') ? 'multipla_escolha' : 'certo_errado',
      } as unknown as Questao;
    });
  }, [questoesData, simulado, id]);

  const finalizar = () => {
    setRodando(false);
    if (historicoId) {
      finishHistory(historicoId);
    }
  };

  const handleRegistrar = async (questaoId: string, alternativa: string, acertou: boolean) => {
    if (!historicoId || !user) return;
    try {
      const q = questoesData?.find(item => item.id === questaoId);
      await supabase.from('user_simulados_respostas').insert({
        historico_id: historicoId,
        questao_id: questaoId,
        disciplina: q?.disciplina || '',
        assunto: q?.assunto || '',
        acertou,
      });

      if (acertou) {
        await supabase.rpc('increment_simulado_acertos', { h_id: historicoId }).catch(async () => {
          const { data: h } = await supabase
            .from('user_simulados_historico')
            .select('acertos')
            .eq('id', historicoId)
            .single();
          if (h) {
            await supabase
              .from('user_simulados_historico')
              .update({ acertos: (h.acertos || 0) + 1 })
              .eq('id', historicoId);
          }
        });
      }
    } catch (err) {
      console.warn('Erro ao salvar resposta de simulado:', err);
    }
  };

  const formatarTempo = (totalSegundos: number) => {
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const seg = totalSegundos % 60;
    if (horas > 0) {
      return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
    }
    return `${minutos.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
  };

  if (loadingSimulado || loadingQuestoes) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <h2 className="text-xl font-bold text-foreground">Carregando Simulado...</h2>
        <p className="text-sm text-muted-foreground mt-1">Sincronizando questões oficiais...</p>
      </div>
    );
  }

  if (!questoesFormatadas || questoesFormatadas.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-foreground">Nenhuma questão encontrada</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          Este simulado ainda não possui questões digitalizadas cadastradas no sistema.
        </p>
        <button
          onClick={() => navigate('/simulados')}
          className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-sm hover:opacity-90 transition-opacity"
        >
          Voltar para Simulados
        </button>
      </div>
    );
  }

  const cleanTitle = (simulado?.prova_url || '').replace(/^https?:\/\/.*$/, '').trim() || simulado?.exam?.name || 'Simulado Oficial';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-border">
        <PageHeader
          title={cleanTitle}
          subtitle={`Tempo decorrido: ${formatarTempo(segundos)} • ${questoesFormatadas.length} Questões`}
          onBack={() => setConfirmarSaida(true)}
        />
      </div>

      <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-6">
        <ResolverPadrao
          questoes={questoesFormatadas}
          origem="simulado"
          onFinish={finalizar}
          onRegistrarResposta={handleRegistrar}
        />
      </div>

      <Dialog open={confirmarSaida} onOpenChange={setConfirmarSaida}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Deseja realmente sair?</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Seu tempo de simulado será pausado e o progresso das respostas registradas continuará salvo em seu histórico.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end mt-4">
            <button
              onClick={() => setConfirmarSaida(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-muted"
            >
              Continuar Simulado
            </button>
            <button
              onClick={() => {
                finalizar();
                navigate('/simulados');
              }}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700"
            >
              Sair do Simulado
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
