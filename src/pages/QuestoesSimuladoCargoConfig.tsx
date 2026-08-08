import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react';
import {
  Timer,
  Gavel,
  ChevronRight,
  Loader2,
  ArrowLeft,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  BarChart3,
  BookOpen,
  Sliders,
  Trophy,
  History,
  AlertCircle
} from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import QuestoesBottomNav from '@/components/questoes/QuestoesBottomNav';
import ResolverPadrao from '@/components/questoes/ResolverPadrao';
import { useQuestoesCargos, useQuestoesSessao, useQuestoesAreas, type Cargo, type Questao } from '@/hooks/useQuestoes';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';

const db = supabase as any;
const TAMANHOS = [10, 20, 30, 50, 100];

type SimuladoHistorico = {
  id: string;
  titulo: string;
  total: number;
  acertos: number;
  duracao_seg: number;
  status: string;
  created_at: string;
};

export default function QuestoesSimuladoCargoConfig() {
  const { cargoId } = useParams<{ cargoId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cargos, loading: loadingCargos } = useQuestoesCargos();

  const [cargo, setCargo] = useState<Cargo | null>(null);
  const [tamanho, setTamanho] = useState(20);
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState<string | null>(null);
  const [modoTempo, setModoTempo] = useState<'livre' | 'cronometrado'>('cronometrado');
  const [modoCorrecao, setModoCorrecao] = useState<'imediata' | 'final'>('imediata');
  
  const [rodando, setRodando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [historico, setHistorico] = useState<SimuladoHistorico[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(true);
  const [resultadoFinal, setResultadoFinal] = useState<{ acertos: number; total: number; tempo: number } | null>(null);

  const simuladoId = useRef<string | null>(null);
  const acertos = useRef(0);

  // Busca disciplinas disponíveis para este cargo
  const { areas: disciplinas, loading: loadingDisciplinas } = useQuestoesAreas(null, cargo?.id ?? null);

  // Encontra o cargo pelo ID ou Slug
  useEffect(() => {
    if (cargoId === 'geral') {
      setCargo({
        id: 'geral',
        nome: 'Simulado Geral',
        slug: 'geral',
        cor: '#E6C200',
        icone: 'Timer',
        total_questoes: 25000,
      });
      return;
    }
    if (cargos.length > 0) {
      const achado = cargos.find((c) => c.id === cargoId || c.slug === cargoId);
      if (achado) {
        setCargo(achado);
      } else {
        setCargo({
          id: cargoId || 'geral',
          nome: cargoId ? cargoId.replace(/-/g, ' ').toUpperCase() : 'Simulado',
          slug: cargoId || 'geral',
          cor: '#E6C200',
          icone: 'Gavel',
          total_questoes: 1000,
        });
      }
    }
  }, [cargoId, cargos]);

  // Carrega histórico de simulados deste cargo
  useEffect(() => {
    if (!user || !cargo) return;
    let cancelado = false;
    (async () => {
      setLoadingHistorico(true);
      const query = db.from('questoes_simulados').select('*').eq('user_id', user.id);
      if (cargo.id !== 'geral') {
        query.eq('cargo_id', cargo.id);
      }
      const { data } = await query.order('created_at', { ascending: false }).limit(5);
      if (!cancelado && data) {
        setHistorico(data as SimuladoHistorico[]);
      }
      if (!cancelado) setLoadingHistorico(false);
    })();
    return () => { cancelado = true; };
  }, [user, cargo]);

  // Hook de sessão de questões para o simulado
  const { questoes, loading, recarregar, registrar } = useQuestoesSessao(
    rodando
      ? {
          cargoId: cargo?.id !== 'geral' ? cargo?.id : null,
          area: disciplinaSelecionada,
          limite: tamanho,
        }
      : { limite: 1, cargoId: '00000000-0000-0000-0000-000000000000' }
  );

  // Timer
  useEffect(() => {
    if (!rodando) return;
    const t = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [rodando]);

  const iniciar = async () => {
    acertos.current = 0;
    setSegundos(0);
    setResultadoFinal(null);
    setRodando(true);

    if (user) {
      const { data } = await db.from('questoes_simulados').insert({
        user_id: user.id,
        titulo: cargo ? `Simulado ${cargo.nome}` : 'Simulado Geral',
        cargo_id: cargo?.id !== 'geral' ? cargo?.id : null,
        cargo: cargo?.nome ?? 'Geral',
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
        simulado_id: simuladoId.current,
        questao_id: questaoId,
        alternativa,
        acertou,
      });

      await db.from('questoes_simulados').update({
        acertos: acertos.current,
        duracao_seg: segundos,
      }).eq('id', simuladoId.current);
    }
  };

  const finalizar = async () => {
    const totalResp = acertos.current;
    const tempoGasto = segundos;

    if (simuladoId.current) {
      await db.from('questoes_simulados').update({
        status: 'concluido',
        finalizado_em: new Date().toISOString(),
        acertos: totalResp,
        duracao_seg: tempoGasto,
      }).eq('id', simuladoId.current);
    }

    setResultadoFinal({
      acertos: totalResp,
      total: tamanho,
      tempo: tempoGasto,
    });

    simuladoId.current = null;
    setRodando(false);
  };

  const mmss = `${String(Math.floor(segundos / 60)).padStart(2, '0')}:${String(segundos % 60).padStart(2, '0')}`;
  const totalSimuladosFatos = historico.length;
  const mediaAcertos = totalSimuladosFatos > 0
    ? Math.round(historico.reduce((acc, curr) => acc + (curr.total > 0 ? (curr.acertos / curr.total) * 100 : 0), 0) / totalSimuladosFatos)
    : 0;

  return (
    <div className="theme-questoes min-h-screen bg-background pb-[calc(8.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]">
      <PageHeader
        title={cargo ? `Simulado ${cargo.nome}` : 'Configurar Simulado'}
        subtitle={rodando ? mmss : 'Personalize sua prova'}
        onBack={() => {
          if (rodando) {
            if (window.confirm('Deseja encerrar o simulado em andamento?')) {
              finalizar();
            }
          } else {
            navigate('/questoes/simulado');
          }
        }}
      />

      <div className="mx-auto w-full max-w-3xl px-4 py-5 space-y-6">
        {!rodando && !resultadoFinal ? (
          <>
            {/* Hero Card do Cargo */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-6 shadow-xl"
            >
              <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
              
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
                  style={{ background: cargo?.cor ? `${cargo.cor}25` : 'rgba(230,194,0,0.15)', border: `1px solid ${cargo?.cor || '#E6C200'}40` }}
                >
                  <Gavel className="w-7 h-7" style={{ color: cargo?.cor || '#E6C200' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                    {cargo?.nome || 'Simulado Geral'}
                  </h1>
                  <p className="text-xs sm:text-sm font-medium text-white/70 mt-0.5">
                    {cargo?.total_questoes ? cargo.total_questoes.toLocaleString('pt-BR') : '25.000+'} questões oficiais cadastradas
                  </p>
                </div>
              </div>

              {/* Quick stats bar */}
              <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-white/10 text-center">
                <div className="bg-white/5 rounded-xl p-2.5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Simulados</span>
                  <span className="text-base font-black text-white">{totalSimuladosFatos}</span>
                </div>
                <div className="bg-white/5 rounded-xl p-2.5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Média</span>
                  <span className="text-base font-black text-emerald-400">{mediaAcertos}%</span>
                </div>
                <div className="bg-white/5 rounded-xl p-2.5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Modo</span>
                  <span className="text-base font-black text-amber-400">Oficial</span>
                </div>
              </div>
            </motion.div>

            {/* Painel de Configurações */}
            <div className="rounded-3xl border border-border bg-card p-5 space-y-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground border-b border-border pb-3">
                <Sliders className="w-4 h-4 text-primary" />
                <span>Configurações do Simulado</span>
              </div>

              {/* Qtd de Questões */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                  Quantidade de Questões
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {TAMANHOS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTamanho(t)}
                      className={`h-11 rounded-xl text-xs sm:text-sm font-extrabold transition-all active:scale-95 flex items-center justify-center ${
                        tamanho === t
                          ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-black shadow-md shadow-amber-500/20'
                          : 'bg-secondary text-foreground hover:bg-secondary/80 border border-border/50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Disciplinas / Áreas */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                  Filtrar por Matéria (Opcional)
                </label>
                {loadingDisciplinas ? (
                  <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                    <button
                      type="button"
                      onClick={() => setDisciplinaSelecionada(null)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        disciplinaSelecionada === null
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Todas as matérias
                    </button>
                    {disciplinas.map((d) => (
                      <button
                        key={d.area}
                        type="button"
                        onClick={() => setDisciplinaSelecionada(d.area)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all truncate max-w-[200px] ${
                          disciplinaSelecionada === d.area
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-secondary text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {d.area} ({d.total})
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Modo de Tempo */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                  Modo do Cronômetro
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModoTempo('cronometrado')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      modoTempo === 'cronometrado'
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border bg-secondary/50 text-muted-foreground'
                    }`}
                  >
                    <span className="flex items-center gap-2 text-xs font-extrabold text-foreground">
                      <Clock className="w-4 h-4 text-primary" /> Cronometrado
                    </span>
                    <span className="block text-[11px] text-muted-foreground mt-1">Conta o tempo exato de resolução</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoTempo('livre')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      modoTempo === 'livre'
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border bg-secondary/50 text-muted-foreground'
                    }`}
                  >
                    <span className="flex items-center gap-2 text-xs font-extrabold text-foreground">
                      <Timer className="w-4 h-4 text-emerald-400" /> Sem Pressão
                    </span>
                    <span className="block text-[11px] text-muted-foreground mt-1">Treine livremente sem relógio</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Botão Principal de Início */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={iniciar}
              className="w-full h-15 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-black font-black text-base tracking-wide flex items-center justify-center gap-3 shadow-xl shadow-amber-500/25 active:scale-95 transition-all"
            >
              <Play className="w-5 h-5 fill-black" />
              <span>INICIAR SIMULADO ({tamanho} QUESTÕES)</span>
            </motion.button>

            {/* Histórico Recente do Cargo */}
            {historico.length > 0 && (
              <div className="rounded-3xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-center justify-between text-sm font-bold text-foreground border-b border-border pb-2.5">
                  <span className="flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" />
                    <span>Últimos Simulados</span>
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold">{historico.length} recentes</span>
                </div>
                <div className="space-y-2">
                  {historico.map((h) => {
                    const pct = h.total > 0 ? Math.round((h.acertos / h.total) * 100) : 0;
                    const dataStr = new Date(h.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    return (
                      <div key={h.id} className="flex items-center justify-between p-3 rounded-2xl bg-secondary/60 border border-border/40">
                        <div>
                          <span className="block text-xs font-bold text-foreground">{h.titulo}</span>
                          <span className="block text-[11px] text-muted-foreground mt-0.5">{dataStr}</span>
                        </div>
                        <div className="text-right">
                          <span className={`block text-xs font-black ${pct >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {h.acertos}/{h.total} ({pct}%)
                          </span>
                          <span className="block text-[10px] text-muted-foreground">
                            {Math.floor(h.duracao_seg / 60)}m {h.duracao_seg % 60}s
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : resultadoFinal ? (
          /* Tela de Resultado Final do Simulado */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-border bg-card p-6 text-center space-y-6 shadow-xl"
          >
            <div className="w-20 h-20 rounded-full bg-primary/15 text-primary mx-auto flex items-center justify-center">
              <Trophy className="w-10 h-10 text-primary" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-foreground">Simulado Finalizado!</h2>
              <p className="text-sm text-muted-foreground mt-1">Confira o seu resultado no simulado de {cargo?.nome || 'Geral'}:</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-secondary/70 rounded-2xl p-4 border border-border/50">
                <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Acertos</span>
                <span className="text-2xl font-black text-emerald-400">{resultadoFinal.acertos}</span>
              </div>
              <div className="bg-secondary/70 rounded-2xl p-4 border border-border/50">
                <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Total</span>
                <span className="text-2xl font-black text-foreground">{resultadoFinal.total}</span>
              </div>
              <div className="bg-secondary/70 rounded-2xl p-4 border border-border/50">
                <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Aproveitamento</span>
                <span className="text-2xl font-black text-amber-400">
                  {Math.round((resultadoFinal.acertos / resultadoFinal.total) * 100)}%
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={iniciar}
                className="w-full h-13 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-md active:scale-95"
              >
                Refazer Simulado
              </button>
              <button
                type="button"
                onClick={() => setResultadoFinal(null)}
                className="w-full h-12 rounded-2xl border border-border text-foreground font-semibold text-sm hover:bg-secondary transition-colors"
              >
                Configurar Novo Simulado
              </button>
            </div>
          </motion.div>
        ) : (
          /* Runner do Simulado */
          <>
            <ResolverPadrao
              questoes={questoes}
              loading={loading}
              contexto="simulado"
              onRegistrar={registrarSimulado}
              onNovoBloco={recarregar}
              vazioTexto="Não há questões suficientes com os filtros selecionados."
            />

            <button
              type="button"
              onClick={finalizar}
              className="mt-6 w-full h-12 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 font-bold text-sm hover:bg-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Encerrar Simulado e Ver Resultado</span>
            </button>
          </>
        )}
      </div>

      <QuestoesBottomNav />
    </div>
  );
}
