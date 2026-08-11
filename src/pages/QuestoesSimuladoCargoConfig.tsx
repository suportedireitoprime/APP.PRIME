import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Timer,
  Gavel,
  ChevronRight,
  Loader2,
  Play,
  Clock,
  Sparkles,
  Sliders,
  Trophy,
  History,
  AlertCircle,
  BarChart2
} from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';

import ResolverPadrao from '@/components/questoes/ResolverPadrao';
import { useQuestoesCargos, useQuestoesSessao, useQuestoesAreas, type Cargo } from '@/hooks/useQuestoes';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
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
  const { cargos } = useQuestoesCargos();

  const [cargo, setCargo] = useState<Cargo | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<'config' | 'raioX'>('config');
  const [tamanho, setTamanho] = useState<number>(20);
  const [isTodasSelected, setIsTodasSelected] = useState(false);
  const [isCustomSelected, setIsCustomSelected] = useState(false);
  const [customInput, setCustomInput] = useState('45');
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState<string | null>(null);
  const [modoTempo, setModoTempo] = useState<'livre' | 'cronometrado'>('cronometrado');
  
  const [rodando, setRodando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [historico, setHistorico] = useState<SimuladoHistorico[]>([]);
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
      const query = db.from('questoes_simulados').select('*').eq('user_id', user.id);
      if (cargo.id !== 'geral') {
        query.eq('cargo_id', cargo.id);
      }
      const { data } = await query.order('created_at', { ascending: false }).limit(5);
      if (!cancelado && data) {
        setHistorico(data as SimuladoHistorico[]);
      }
    })();
    return () => { cancelado = true; };
  }, [user, cargo]);

  // Limpa o nome do cargo (remove números no final como " 1")
  const cleanNome = cargo?.nome ? cargo.nome.replace(/\s+\d+$/, '') : 'Simulado';

  // Hook de sessão de questões para o simulado
  const finalLimite = isTodasSelected 
    ? (cargo?.total_questoes || 100) 
    : isCustomSelected 
      ? (parseInt(customInput, 10) || 20) 
      : tamanho;

  const { questoes, loading, recarregar, registrar } = useQuestoesSessao(
    rodando
      ? {
          cargoId: cargo?.id !== 'geral' ? cargo?.id : null,
          area: disciplinaSelecionada,
          limite: finalLimite,
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
        titulo: `Simulado ${cleanNome}`,
        cargo_id: cargo?.id !== 'geral' ? cargo?.id : null,
        cargo: cleanNome,
        total: finalLimite,
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
      total: finalLimite,
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

  const totalDisciplinasQuestoes = disciplinas.reduce((acc, d) => acc + Number(d.total || 0), 0);

  return (
    <div className="theme-questoes min-h-screen bg-background pb-[calc(8.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] pt-[calc(0.5rem+var(--sai-top,env(safe-area-inset-top,0px)))]">
      <PageHeader
        title={`Simulado ${cleanNome}`}
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

      <div className="mx-auto w-full max-w-3xl px-3.5 sm:px-6 space-y-5 pt-2">
        {!rodando && !resultadoFinal ? (
          <>
            {/* Hero Card do Cargo */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-5 sm:p-6 shadow-xl"
            >
              <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
              
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg p-2 bg-card/80 border border-white/10"
                >
                  {getCargoLogo(cargo?.nome) ? (
                    <img src={getCargoLogo(cargo?.nome)!} alt="" className="w-10 h-10 object-contain drop-shadow-sm" />
                  ) : (
                    <Gavel className="w-7 h-7 text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl font-black text-white tracking-wide uppercase leading-snug">
                    {cleanNome}
                  </h1>
                  <p className="text-xs font-semibold text-white/70 mt-0.5">
                    {cargo?.total_questoes ? cargo.total_questoes.toLocaleString('pt-BR') : '1.000+'} questões oficiais cadastradas
                  </p>
                </div>
              </div>

              {/* Quick stats bar */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-white/10 text-center">
                <div className="bg-white/5 rounded-xl p-2">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Simulados</span>
                  <span className="text-base font-black text-white">{totalSimuladosFatos}</span>
                </div>
                <div className="bg-white/5 rounded-xl p-2">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Média</span>
                  <span className="text-base font-black text-emerald-400">{mediaAcertos}%</span>
                </div>
                <div className="bg-white/5 rounded-xl p-2">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Modo</span>
                  <span className="text-base font-black text-purple-400">Oficial</span>
                </div>
              </div>
            </motion.div>

            {/* Alternância de Abas: Configurações vs Raio-X */}
            <div className="flex bg-card border border-border/80 p-1 rounded-2xl shadow-sm">
              <button
                type="button"
                onClick={() => { haptic.selection(); setAbaAtiva('config'); }}
                className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 ${
                  abaAtiva === 'config'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sliders className="w-4 h-4" />
                Configurações
              </button>
              <button
                type="button"
                onClick={() => { haptic.selection(); setAbaAtiva('raioX'); }}
                className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 ${
                  abaAtiva === 'raioX'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Raio-X do Cargo
              </button>
            </div>

            {abaAtiva === 'config' ? (
              /* Painel de Configurações */
              <div className="rounded-3xl border border-border bg-card p-5 space-y-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-extrabold text-foreground border-b border-border/60 pb-3">
                  <Sliders className="w-4 h-4 text-purple-500" />
                  <span>Personalize seu Simulado</span>
                </div>

                {/* Qtd de Questões */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-2.5">
                    Quantidade de Questões
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        setIsTodasSelected(true);
                        setIsCustomSelected(false);
                      }}
                      className={`h-11 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all active:scale-95 flex items-center justify-center ${
                        isTodasSelected
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-500/40'
                          : 'bg-secondary text-foreground hover:bg-secondary/80 border border-border/50'
                      }`}
                    >
                      Todas
                    </button>

                    {[10, 20, 30, 50, 100].map((t) => {
                      const active = !isTodasSelected && !isCustomSelected && tamanho === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            haptic.selection();
                            setIsTodasSelected(false);
                            setIsCustomSelected(false);
                            setTamanho(t);
                          }}
                          className={`h-11 px-3.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all active:scale-95 flex items-center justify-center ${
                            active
                              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-500/40'
                              : 'bg-secondary text-foreground hover:bg-secondary/80 border border-border/50'
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        setIsTodasSelected(false);
                        setIsCustomSelected(true);
                      }}
                      className={`h-11 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all active:scale-95 flex items-center justify-center ${
                        isCustomSelected
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-500/40'
                          : 'bg-secondary text-foreground hover:bg-secondary/80 border border-border/50'
                      }`}
                    >
                      Personalizado
                    </button>
                  </div>

                  {isCustomSelected && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">Número de questões:</span>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        className="w-24 h-10 px-3 rounded-xl border border-border bg-muted/60 text-sm font-black text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  )}
                </div>

                {/* Disciplinas / Áreas */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-2.5">
                    Filtrar por Matéria (Opcional)
                  </label>
                  {loadingDisciplinas ? (
                    <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-purple-500" /></div>
                  ) : (
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                      <button
                        type="button"
                        onClick={() => setDisciplinaSelecionada(null)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                          disciplinaSelecionada === null
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-secondary text-muted-foreground hover:text-foreground border border-border/50'
                        }`}
                      >
                        Todas as matérias
                      </button>
                      {disciplinas.map((d) => (
                        <button
                          key={d.area}
                          type="button"
                          onClick={() => setDisciplinaSelecionada(d.area)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all truncate max-w-[220px] ${
                            disciplinaSelecionada === d.area
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'bg-secondary text-muted-foreground hover:text-foreground border border-border/50'
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
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-2.5">
                    Modo do Cronômetro
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setModoTempo('cronometrado')}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        modoTempo === 'cronometrado'
                          ? 'border-purple-500 bg-purple-500/10 text-foreground'
                          : 'border-border bg-secondary/50 text-muted-foreground'
                      }`}
                    >
                      <span className="flex items-center gap-2 text-xs font-extrabold text-foreground">
                        <Clock className="w-4 h-4 text-purple-400" /> Cronometrado
                      </span>
                      <span className="block text-[11px] text-muted-foreground mt-1">Conta o tempo de resolução</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setModoTempo('livre')}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        modoTempo === 'livre'
                          ? 'border-purple-500 bg-purple-500/10 text-foreground'
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
            ) : (
              /* Aba Raio-X do Cargo */
              <div className="rounded-3xl border border-border bg-card p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                    <BarChart2 className="w-4.5 h-4.5 text-purple-400" />
                    <span>Raio-X de Incidência de Matérias</span>
                  </div>
                  <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full">
                    {disciplinas.length} disciplinas
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">
                  Proporção de questões por disciplina neste edital/cargo:
                </p>

                {loadingDisciplinas ? (
                  <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-purple-500" /></div>
                ) : disciplinas.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">Sem dados de disciplinas ainda.</div>
                ) : (
                  <div className="space-y-3 pt-1">
                    {disciplinas.map((d) => {
                      const perc = totalDisciplinasQuestoes > 0 ? Math.round((Number(d.total) / totalDisciplinasQuestoes) * 100) : 0;
                      return (
                        <div key={d.area} className="space-y-1.5 bg-muted/40 p-3 rounded-2xl border border-border/40">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-foreground truncate max-w-[220px]">{d.area}</span>
                            <span className="text-purple-400 font-extrabold">{d.total} q. ({perc}%)</span>
                          </div>
                          <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-500" 
                              style={{ width: `${Math.max(perc, 4)}%` }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Botão Principal de Início (Roxo, Responsivo, Destacado) */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { haptic.impact(); iniciar(); }}
              className="w-full h-15 sm:h-16 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-base sm:text-lg tracking-wide flex items-center justify-center gap-3 shadow-xl shadow-purple-600/30 active:scale-98 transition-all cursor-pointer"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>INICIAR SIMULADO ({finalLimite} QUESTÕES)</span>
            </motion.button>

            {/* Histórico Recente do Cargo */}
            {historico.length > 0 && (
              <div className="rounded-3xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-center justify-between text-sm font-bold text-foreground border-b border-border pb-2.5">
                  <span className="flex items-center gap-2">
                    <History className="w-4 h-4 text-purple-400" />
                    <span>Últimos Simulados Realizados</span>
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
                          <span className={`block text-xs font-black ${pct >= 70 ? 'text-emerald-400' : 'text-purple-400'}`}>
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
            <div className="w-20 h-20 rounded-full bg-purple-500/15 text-purple-400 mx-auto flex items-center justify-center">
              <Trophy className="w-10 h-10 text-purple-400" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-foreground">Simulado Concluído!</h2>
              <p className="text-sm text-muted-foreground mt-1">Resultado da sua prova de {cleanNome}:</p>
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
                <span className="text-2xl font-black text-purple-400">
                  {Math.round((resultadoFinal.acertos / resultadoFinal.total) * 100)}%
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={iniciar}
                className="w-full h-14 rounded-2xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-500 transition-all shadow-md active:scale-95"
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
    </div>
  );
}

