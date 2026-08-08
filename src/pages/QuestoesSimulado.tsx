import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timer, Gavel, ChevronRight, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import QuestoesBottomNav from '@/components/questoes/QuestoesBottomNav';
import ResolverPadrao from '@/components/questoes/ResolverPadrao';
import { useQuestoesCargos, useQuestoesSessao, type Cargo } from '@/hooks/useQuestoes';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const db = supabase as any;
const TAMANHOS = [10, 20, 30];

const QuestoesSimulado = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cargos, loading: loadingCargos } = useQuestoesCargos();
  const [cargo, setCargo] = useState<Cargo | null>(null);
  const [tamanho, setTamanho] = useState(10);
  const [rodando, setRodando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const simuladoId = useRef<string | null>(null);
  const acertos = useRef(0);

  const { questoes, loading, recarregar, registrar } = useQuestoesSessao(
    rodando ? { cargoId: cargo?.id ?? null, limite: tamanho } : { limite: 1, cargoId: '00000000-0000-0000-0000-000000000000' },
  );

  useEffect(() => {
    if (!rodando) return;
    const t = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [rodando]);

  const iniciar = async (c: Cargo | null) => {
    setCargo(c);
    acertos.current = 0;
    setSegundos(0);
    setRodando(true);
    if (user) {
      const { data } = await db.from('questoes_simulados').insert({
        user_id: user.id,
        titulo: c ? `Simulado ${c.nome}` : 'Simulado geral',
        cargo_id: c?.id ?? null,
        cargo: c?.nome ?? null,
        total: tamanho,
      }).select('id').single();
      simuladoId.current = data?.id ?? null;
    }
  };

  const registrarSimulado = async (questaoId: string, alternativa: string, acertou: boolean) => {
    if (acertou) acertos.current += 1;
    await registrar(questaoId, alternativa, acertou, 'simulado');
    if (simuladoId.current) {
      await db.from('questoes_simulado_itens').insert({
        simulado_id: simuladoId.current, questao_id: questaoId, alternativa, acertou,
      });
      await db.from('questoes_simulados').update({
        acertos: acertos.current, duracao_seg: segundos,
      }).eq('id', simuladoId.current);
    }
  };

  const finalizar = async () => {
    if (simuladoId.current) {
      await db.from('questoes_simulados').update({
        status: 'concluido', finalizado_em: new Date().toISOString(),
        acertos: acertos.current, duracao_seg: segundos,
      }).eq('id', simuladoId.current);
    }
    simuladoId.current = null;
    setRodando(false);
  };

  const mmss = `${String(Math.floor(segundos / 60)).padStart(2, '0')}:${String(segundos % 60).padStart(2, '0')}`;

  return (
    <div className="theme-questoes min-h-screen bg-background pb-[calc(8.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]">
      <PageHeader
        title="Simulado"
        subtitle={rodando ? mmss : 'Escolha o cargo'}
        onBack={() => (rodando ? finalizar() : navigate('/questoes'))}
      />

      <div className="mx-auto w-full max-w-3xl px-4 py-5">
        {!rodando ? (
          <>
            <button
              type="button"
              onClick={() => navigate('/questoes/simulado/geral')}
              className="mb-3 flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left hover:border-primary/50 transition-all active:scale-98"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 shrink-0">
                <Timer className="h-6 w-6 text-primary" />
              </span>
              <span className="flex-1">
                <span className="block text-[15px] font-bold text-foreground">Simulado Geral</span>
                <span className="block text-[12px] text-muted-foreground">Questões mescladas de todos os cargos e exames</span>
              </span>
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
            </button>

            {loadingCargos ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              <div className="space-y-2">
                {cargos.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => navigate(`/questoes/simulado/${c.slug || c.id}`)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left hover:border-primary/50 transition-all active:scale-98"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl shrink-0" style={{ background: `${c.cor}22` }}>
                      <Gavel className="h-6 w-6" style={{ color: c.cor }} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-bold text-foreground">{c.nome}</span>
                      <span className="block text-[12px] text-muted-foreground">
                        {c.total_questoes.toLocaleString('pt-BR')} questões disponíveis
                      </span>
                    </span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <ResolverPadrao
              questoes={questoes}
              loading={loading}
              contexto="simulado"
              onRegistrar={registrarSimulado}
              onNovoBloco={recarregar}
              vazioTexto="Não há questões suficientes para este cargo ainda."
            />
            <button
              onClick={finalizar}
              className="mt-5 h-12 w-full rounded-xl border border-border text-[15px] font-semibold text-muted-foreground"
            >
              Encerrar simulado
            </button>
          </>
        )}
      </div>

      <QuestoesBottomNav />
    </div>
  );
};

export default QuestoesSimulado;
