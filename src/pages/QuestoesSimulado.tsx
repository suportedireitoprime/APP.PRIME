import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timer, Gavel, ChevronRight, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import QuestoesBottomNav from '@/components/questoes/QuestoesBottomNav';
import ResolverPadrao from '@/components/questoes/ResolverPadrao';
import { useQuestoesCargos, useQuestoesSessao, type Cargo } from '@/hooks/useQuestoes';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { haptic } from '@/lib/nativeHaptics';

import prfLogo from '@/assets/cargos/policia-rodoviaria-federal.webp';
import pfLogo from '@/assets/cargos/policia-federal.webp';
import pcDfLogo from '@/assets/cargos/policia-civil-df.webp';
import pmSpLogo from '@/assets/cargos/policia-militar-sp.webp';
import ppRsLogo from '@/assets/cargos/policia-penal-rs.webp';

function getCargoLogo(nome?: string | null) {
  const n = (nome || '').toLowerCase();
  if (n.includes('prf') || n.includes('rodoviár') || n.includes('rodoviario')) return prfLogo;
  if (n.includes('polícia federal') || n.includes('policia federal')) return pfLogo;
  if (n.includes('polícia civil') || n.includes('policia civil')) return pcDfLogo;
  if (n.includes('polícia militar') || n.includes('policia militar')) return pmSpLogo;
  if (n.includes('polícia penal') || n.includes('policia penal')) return ppRsLogo;
  return null;
}

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
            {loadingCargos ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 items-stretch">
                {cargos.map((c) => {
                  const logo = getCargoLogo(c.nome);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { haptic.selection(); navigate(`/questoes/simulado/${c.slug || c.id}`); }}
                      className="group flex flex-col justify-between h-36 p-4 rounded-2xl border border-border/80 bg-card hover:border-primary/50 transition-all active:scale-98 shadow-sm text-left"
                    >
                      <div className="flex items-center justify-between w-full">
                        {logo ? (
                          <div className="w-10 h-10 flex items-center justify-center shrink-0">
                            <img src={logo} alt={c.nome} className="max-h-9 max-w-9 object-contain drop-shadow-sm" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${c.cor || '#A78BFA'}18` }}>
                            <Gavel className="h-5 w-5" style={{ color: c.cor || '#A78BFA' }} />
                          </div>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-sm font-extrabold text-foreground leading-tight line-clamp-2 flex items-end min-h-[2.25rem]">
                          {c.nome}
                        </span>
                        <span className="block text-[11px] text-muted-foreground mt-1 font-semibold">
                          {c.total_questoes.toLocaleString('pt-BR')} questões
                        </span>
                      </div>
                    </button>
                  );
                })}
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
