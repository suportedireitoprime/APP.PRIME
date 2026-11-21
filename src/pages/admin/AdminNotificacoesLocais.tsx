import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Smartphone,
  PlayCircle,
  Headphones,
  BookOpen,
  Flame,
  Brain,
  Clock,
  Users,
  Send,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  ExternalLink,
  BellRing,
  HelpCircle,
  Eye,
  SlidersHorizontal,
  Hourglass,
  BarChart3,
  TrendingUp,
  MousePointerClick,
  Check,
  RefreshCw,
  Trash2,
  UserCheck,
  Moon,
  ShieldCheck,
  Settings,
  Palette,
} from 'lucide-react';
import {
  carregarRegrasNotificacoesLocais,
  salvarRegrasNotificacoesLocais,
  dispararNotificacaoLocalTeste,
  obterMetricasNotificacoesLocais,
  limparMetricasLocais,
  registrarAberturaNotificacaoLocal,
  RegraNotificacaoLocal,
  ModuloNotificacaoLocal,
  PublicoAlvoNotificacao,
  MetricasNotificacoesLocais,
  REGRAS_PADRAO_NOTIFICACOES_LOCAIS,
} from '@/lib/nativo/notificacaoLocalManager';
import { haptic } from '@/lib/nativeHaptics';

type TabView = 'quando_disparar' | 'como_aparece' | 'publicos_telemetria';

export default function AdminNotificacoesLocais() {
  const navigate = useNavigate();
  const [tabAtiva, setTabAtiva] = useState<TabView>('como_aparece');
  const [regras, setRegras] = useState<RegraNotificacaoLocal[]>(() => carregarRegrasNotificacoesLocais());
  const [regraAtivaId, setRegraAtivaId] = useState<string>('videoaulas_continuar');
  const [progressoSimulado, setProgressoSimulado] = useState<number>(60);
  const [testando, setTestando] = useState<boolean>(false);
  const [contagemRegressiva, setContagemRegressiva] = useState<number | null>(null);

  // Filtro de público para edição de templates
  const [publicoFiltro, setPublicoFiltro] = useState<PublicoAlvoNotificacao>('todos');

  // Estado de Telemetria de Abertura no Aparelho
  const [metricas, setMetricas] = useState<MetricasNotificacoesLocais | null>(null);
  const [carregandoMetricas, setCarregandoMetricas] = useState<boolean>(false);

  const carregarMetricas = useCallback(async () => {
    setCarregandoMetricas(true);
    try {
      const data = await obterMetricasNotificacoesLocais();
      setMetricas(data);
    } catch (e) {
      console.warn('[AdminNotificacoesLocais] Erro ao carregar métricas:', e);
    } finally {
      setCarregandoMetricas(false);
    }
  }, []);

  useEffect(() => {
    void carregarMetricas();
  }, [carregarMetricas]);

  const regraSelecionada = useMemo(() => {
    return regras.find((r) => r.id === regraAtivaId) || regras[0];
  }, [regras, regraAtivaId]);

  const handleAtualizarRegra = (id: string, updates: Partial<RegraNotificacaoLocal>) => {
    setRegras((prev) => {
      const atualizadas = prev.map((r) => (r.id === id ? { ...r, ...updates } : r));
      salvarRegrasNotificacoesLocais(atualizadas);
      return atualizadas;
    });
  };

  const handleRestaurarPadroes = () => {
    haptic.impact('medium');
    setRegras(REGRAS_PADRAO_NOTIFICACOES_LOCAIS);
    salvarRegrasNotificacoesLocais(REGRAS_PADRAO_NOTIFICACOES_LOCAIS);
    toast.success('Regras restauradas para os padrões recomendados!');
  };

  const handleDispararTeste = async (delaySegundos: number = 0) => {
    haptic.impact('heavy');
    setTestando(true);

    if (delaySegundos > 0) {
      setContagemRegressiva(delaySegundos);
      toast.info(`⏳ Disparo em ${delaySegundos}s! Minimize o app ou bloqueie a tela.`);
      let segundosRestantes = delaySegundos;
      const interval = setInterval(() => {
        segundosRestantes -= 1;
        setContagemRegressiva(segundosRestantes);
        if (segundosRestantes <= 0) {
          clearInterval(interval);
          setContagemRegressiva(null);
        }
      }, 1000);
    }

    const resultado = await dispararNotificacaoLocalTeste({
      regra: regraSelecionada,
      delaySegundos,
      progresso: progressoSimulado,
    });

    setTestando(false);

    if (resultado.sucesso) {
      toast.success(resultado.mensagem);
      void carregarMetricas();
    } else {
      toast.error(resultado.mensagem);
    }
  };

  const handleSimularAberturaLocal = async () => {
    haptic.impact('light');
    await registrarAberturaNotificacaoLocal({
      modulo: regraSelecionada.modulo,
      acao: 'continuar',
      rota: regraSelecionada.rotaPadrao,
      progresso: progressoSimulado,
    });
    toast.success('Abertura simulada com sucesso! Métricas atualizadas.');
    void carregarMetricas();
  };

  const handleLimparTestes = () => {
    haptic.selection();
    limparMetricasLocais();
    void carregarMetricas();
    toast.info('Histórico de testes locais limpo!');
  };

  const getModuloIcon = (modulo: ModuloNotificacaoLocal) => {
    switch (modulo) {
      case 'videoaulas':
        return <PlayCircle className="w-4 h-4 text-sky-400" />;
      case 'audioaulas':
        return <Headphones className="w-4 h-4 text-emerald-400" />;
      case 'livros':
        return <BookOpen className="w-4 h-4 text-amber-400" />;
      case 'streak':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'flashcards':
        return <Brain className="w-4 h-4 text-purple-400" />;
      case 'trial':
        return <Hourglass className="w-4 h-4 text-rose-400" />;
    }
  };

  return (
    <div className="min-h-dvh bg-[#0D0D0D] text-foreground pb-12">
      <PageHeader
        title="Notificações Locais (Retenção)"
        subtitle="Continuar assistindo/lendo & barra de progresso no aparelho"
        onBack={() => navigate('/admin-funcoes?cat=push')}
        rightAction={
          <button
            onClick={() => navigate('/admin-push')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-medium text-white transition-colors"
          >
            <BellRing className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Push Nuvem</span>
          </button>
        }
      />

      <div className="max-w-4xl mx-auto px-4 pt-3 space-y-4">
        {/* =========================================================================
            BARRA MINIMALISTA DE NAVEGAÇÃO POR ABAS (3 ABAS LIMPAS)
           ========================================================================= */}
        <div className="flex p-1 rounded-2xl bg-zinc-950 border border-white/10 gap-1 select-none">
          <button
            onClick={() => {
              haptic.selection();
              setTabAtiva('quando_disparar');
            }}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 ${
              tabAtiva === 'quando_disparar'
                ? 'bg-zinc-800 text-white shadow-md border border-white/10'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span className="truncate">Quando Disparar</span>
          </button>

          <button
            onClick={() => {
              haptic.selection();
              setTabAtiva('como_aparece');
            }}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 ${
              tabAtiva === 'como_aparece'
                ? 'bg-zinc-800 text-white shadow-md border border-white/10'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-sky-400" />
            <span className="truncate">Como Aparece</span>
          </button>

          <button
            onClick={() => {
              haptic.selection();
              setTabAtiva('publicos_telemetria');
            }}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 ${
              tabAtiva === 'publicos_telemetria'
                ? 'bg-zinc-800 text-white shadow-md border border-white/10'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span className="truncate">Públicos & Métricas</span>
          </button>
        </div>

        {/* SELETOR HORIZONTAL DE MÓDULO (Limpo e compacto) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {regras.map((r) => {
            const ativa = r.id === regraAtivaId;
            return (
              <button
                key={r.id}
                onClick={() => {
                  haptic.selection();
                  setRegraAtivaId(r.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all ${
                  ativa
                    ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                    : 'bg-zinc-950/80 text-zinc-400 hover:text-zinc-200 border border-white/5'
                }`}
              >
                {getModuloIcon(r.modulo)}
                <span>{r.nome.split(' (')[0]}</span>
                {r.ativo && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            ABA 1: ⚙️ QUANDO DISPARAR (GATILHOS & CONDIÇÕES)
           ========================================================================= */}
        {tabAtiva === 'quando_disparar' && (
          <div className="space-y-4">
            <Card className="bg-zinc-950 border-white/10 p-4 sm:p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    {getModuloIcon(regraSelecionada.modulo)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{regraSelecionada.nome}</h3>
                    <p className="text-xs text-zinc-400">Gatilhos de tempo e regras de inatividade</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 hidden sm:inline">
                    {regraSelecionada.ativo ? 'Ativado' : 'Pausado'}
                  </span>
                  <Switch
                    checked={regraSelecionada.ativo}
                    onCheckedChange={(checked) => {
                      haptic.selection();
                      handleAtualizarRegra(regraSelecionada.id, { ativo: checked });
                    }}
                  />
                </div>
              </div>

              {/* 1. Tempo de Inatividade após Pausa */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Quando disparar a notificação:</span>
                </label>

                {regraSelecionada.horarioFixoDisparo ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <input
                      type="time"
                      value={regraSelecionada.horarioFixoDisparo}
                      onChange={(e) => {
                        handleAtualizarRegra(regraSelecionada.id, { horarioFixoDisparo: e.target.value });
                      }}
                      className="bg-zinc-900 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <span className="text-xs text-zinc-400">
                      Disparo fixo todos os dias se o aluno ainda não tiver estudado hoje.
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { horas: 0.5, label: '30 minutos' },
                      { horas: 1, label: '1 hora' },
                      { horas: 2, label: '2 horas (Padrão)', destaque: true },
                      { horas: 4, label: '4 horas' },
                      { horas: 12, label: '12 horas' },
                      { horas: 24, label: '24 horas' },
                    ].map((opt) => {
                      const ativo = (regraSelecionada.gatilhoHorasInatividade || 2) === opt.horas;
                      return (
                        <button
                          key={opt.horas}
                          type="button"
                          onClick={() => {
                            haptic.selection();
                            handleAtualizarRegra(regraSelecionada.id, { gatilhoHorasInatividade: opt.horas });
                          }}
                          className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                            ativo
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-sm'
                              : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. Condições Inteligentes de Proteção (Anti-Spam) */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Condições Inteligentes de Proteção</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Progresso Mínimo */}
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-300 font-medium">Progresso mínimo para disparar:</span>
                      <span className="text-sky-400 font-bold font-mono">
                        {regraSelecionada.progressoMinimoPct ?? 10}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="30"
                      value={regraSelecionada.progressoMinimoPct ?? 10}
                      onChange={(e) => {
                        handleAtualizarRegra(regraSelecionada.id, { progressoMinimoPct: Number(e.target.value) });
                      }}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    />
                    <p className="text-[11px] text-zinc-500">
                      Evita notificar se o aluno só abriu e fechou por engano em menos de 10%.
                    </p>
                  </div>

                  {/* Limite Diário de Disparos */}
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-300 font-medium">Limite diário por usuário:</span>
                      <span className="text-amber-400 font-bold font-mono">
                        {regraSelecionada.limiteDiario ?? 2} por dia
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            haptic.selection();
                            handleAtualizarRegra(regraSelecionada.id, { limiteDiario: num });
                          }}
                          className={`flex-1 py-1 rounded-lg text-xs font-semibold border ${
                            (regraSelecionada.limiteDiario ?? 2) === num
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                              : 'bg-white/5 border-white/10 text-zinc-400'
                          }`}
                        >
                          Máx {num}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      Protege o aluno contra excesso de alertas no mesmo dia.
                    </p>
                  </div>
                </div>

                {/* Quiet Hours (Janela de Silêncio das 23h às 07h) */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0 text-purple-400">
                      <Moon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Quiet Hours (Janela de Silêncio)</div>
                      <div className="text-[11px] text-zinc-400">
                        Não disparar notificações entre 23:00 e 07:00 da manhã.
                      </div>
                    </div>
                  </div>

                  <Switch
                    checked={regraSelecionada.quietHoursAtivo ?? true}
                    onCheckedChange={(checked) => {
                      haptic.selection();
                      handleAtualizarRegra(regraSelecionada.id, { quietHoursAtivo: checked });
                    }}
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* =========================================================================
            ABA 2: 🎨 COMO APARECE (VISUAL DA NOTIFICAÇÃO & PREVIEW 1:1)
           ========================================================================= */}
        {tabAtiva === 'como_aparece' && (
          <div className="space-y-4">
            {/* O CARD DE NOTIFICAÇÃO ESTILO ANDROID NATIVO (IDÊNTICO AO PRINT) */}
            <Card className="bg-zinc-950 border-white/10 p-4 sm:p-5 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-sky-400" />
                  <span>Preview Real do Aparelho (Android 15 / iOS)</span>
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">{progressoSimulado}% concluído</span>
              </div>

              {/* CARD ANDROID 1:1 */}
              <div className="relative mx-auto max-w-md w-full bg-[#1e1e20] text-white rounded-2xl p-3.5 sm:p-4 border border-white/10 shadow-2xl space-y-3 font-sans select-none">
                {/* Header: Ícone Redondo Laranja, Nome, Separador e Capa */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-[#f95738] flex items-center justify-center shrink-0 shadow-sm">
                      <Flame className="w-3.5 h-3.5 text-white fill-white" />
                    </div>
                    <span className="text-[13px] font-semibold text-white truncate">Estudos Jurídicos</span>
                    <span className="text-zinc-500 text-xs font-light">·</span>
                    <span className="text-zinc-400 text-xs truncate">
                      {regraSelecionada.modulo === 'audioaulas'
                        ? 'Áudioaula'
                        : regraSelecionada.modulo === 'livros'
                        ? 'Biblioteca'
                        : 'Estudo'}
                    </span>
                  </div>

                  {regraSelecionada.exemploCapaUrl && (
                    <div className="w-9 h-9 rounded-md overflow-hidden shrink-0 border border-white/10 shadow-md">
                      <img
                        src={regraSelecionada.exemploCapaUrl}
                        alt="Capa"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Título & Subtítulo com valores simulados */}
                <div className="space-y-0.5">
                  <h4 className="text-[14px] font-bold text-white leading-tight line-clamp-1">
                    {regraSelecionada.exemploTitulo}
                  </h4>
                  <p className="text-[12px] text-zinc-300 font-normal line-clamp-1">
                    {regraSelecionada.exemploSubtitulo}
                  </p>
                </div>

                {/* Barra de Progresso Azul Vibrante (Idêntica ao Print do Usuário!) */}
                {regraSelecionada.mostrarBarraProgresso && (
                  <div className="space-y-1 pt-1">
                    <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#007aff] rounded-full transition-all duration-300 shadow-[0_0_8px_#007aff]"
                        style={{ width: `${progressoSimulado}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Botão de Ação Interativo ("Continuar assistindo") */}
                <div className="pt-2 flex items-center justify-between border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      void registrarAberturaNotificacaoLocal({
                        modulo: regraSelecionada.modulo,
                        acao: 'continuar',
                        rota: regraSelecionada.rotaPadrao,
                        progresso: progressoSimulado,
                      });
                      toast.info(`Abertura registrada: ${regraSelecionada.rotaPadrao}`);
                      void carregarMetricas();
                    }}
                    className="text-[13px] font-semibold text-white hover:text-sky-400 active:scale-95 transition-all py-1 px-1 flex items-center gap-1.5"
                  >
                    <span>{regraSelecionada.textoBotaoAcao}</span>
                  </button>
                  <div className="text-zinc-500 hover:text-zinc-300 transition-colors p-1">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Slider de Progresso Interativo */}
              {regraSelecionada.mostrarBarraProgresso && (
                <div className="pt-1 max-w-md mx-auto space-y-1.5">
                  <div className="flex justify-between text-xs text-zinc-400 font-medium">
                    <span>Ajuste para testar a barra azul:</span>
                    <span className="text-sky-400 font-bold font-mono">{progressoSimulado}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="95"
                    value={progressoSimulado}
                    onChange={(e) => setProgressoSimulado(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                </div>
              )}

              {/* Botões de Disparo de Teste */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <Button
                  onClick={() => handleDispararTeste(0)}
                  disabled={testando || contagemRegressiva !== null}
                  className="w-full sm:w-auto bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs px-4 h-10 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Testar no Meu Aparelho Agora</span>
                </Button>

                <Button
                  onClick={() => handleDispararTeste(5)}
                  disabled={testando || contagemRegressiva !== null}
                  variant="outline"
                  className="w-full sm:w-auto border-white/15 bg-white/5 hover:bg-white/10 text-white font-medium text-xs px-4 h-10 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {contagemRegressiva !== null
                      ? `Disparando em ${contagemRegressiva}s... (bloqueie)`
                      : 'Testar em 5 segundos'}
                  </span>
                </Button>
              </div>
            </Card>

            {/* Customizador de Textos & Variáveis */}
            <Card className="bg-zinc-950 border-white/10 p-4 sm:p-5 rounded-2xl space-y-3.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-sky-400" />
                <span>Editar Textos & Variáveis Dinâmicas</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-semibold text-zinc-300">Título da Notificação:</label>
                    <span className="text-[11px] text-zinc-500">Variáveis: &#123;titulo&#125;, &#123;aluno&#125;</span>
                  </div>
                  <Input
                    value={regraSelecionada.exemploTitulo}
                    onChange={(e) => handleAtualizarRegra(regraSelecionada.id, { exemploTitulo: e.target.value })}
                    className="bg-zinc-900 border-white/15 text-xs text-white h-9 rounded-xl"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-semibold text-zinc-300">Subtítulo da Notificação:</label>
                    <span className="text-[11px] text-zinc-500">Variáveis: &#123;minutos&#125;, &#123;progresso&#125;</span>
                  </div>
                  <Input
                    value={regraSelecionada.exemploSubtitulo}
                    onChange={(e) => handleAtualizarRegra(regraSelecionada.id, { exemploSubtitulo: e.target.value })}
                    className="bg-zinc-900 border-white/15 text-xs text-white h-9 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Texto do Botão de Ação:</label>
                  <Input
                    value={regraSelecionada.textoBotaoAcao}
                    onChange={(e) => handleAtualizarRegra(regraSelecionada.id, { textoBotaoAcao: e.target.value })}
                    className="bg-zinc-900 border-white/15 text-xs text-white h-9 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Rota de Abertura:</label>
                  <Input
                    value={regraSelecionada.rotaPadrao}
                    onChange={(e) => handleAtualizarRegra(regraSelecionada.id, { rotaPadrao: e.target.value })}
                    className="bg-zinc-900 border-white/15 text-xs text-white h-9 rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <div className="text-xs font-semibold text-white">Barra de Progresso Azul</div>
                    <div className="text-[11px] text-zinc-400">
                      Exibe a linha horizontal com a porcentagem de conclusão no aparelho
                    </div>
                  </div>
                  <Switch
                    checked={regraSelecionada.mostrarBarraProgresso}
                    onCheckedChange={(checked) => {
                      haptic.selection();
                      handleAtualizarRegra(regraSelecionada.id, { mostrarBarraProgresso: checked });
                    }}
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* =========================================================================
            ABA 3: 👥 PÚBLICOS & ABERTURAS (TELEMETRIA E SEGMENTAÇÃO)
           ========================================================================= */}
        {tabAtiva === 'publicos_telemetria' && (
          <div className="space-y-4">
            {/* 1. SEPARADOR DE PÚBLICOS-ALVO */}
            <Card className="bg-zinc-950 border-white/10 p-4 sm:p-5 rounded-2xl space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Segmentação de Públicos</span>
                  </h4>
                  <p className="text-xs text-zinc-400">Direcione regras e mensagens para perfis específicos</p>
                </div>

                <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px] border-emerald-500/30">
                  Segmentação Ativa
                </Badge>
              </div>

              {/* Botões de Público */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'todos' as const, label: '👥 Todos os Alunos', desc: 'Regra geral' },
                  { id: 'gratuitos' as const, label: '🆓 Apenas Gratuitos', desc: 'Foco conversão Pro' },
                  { id: 'assinantes' as const, label: '👑 Assinantes Pro', desc: 'Foco retenção / LTV' },
                  { id: 'inativos_24h' as const, label: '💤 Inativos (+48h)', desc: 'Reativação de estudo' },
                ].map((pub) => {
                  const ativo = regraSelecionada.publicoAlvo === pub.id;
                  return (
                    <button
                      key={pub.id}
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        handleAtualizarRegra(regraSelecionada.id, { publicoAlvo: pub.id });
                      }}
                      className={`p-3 rounded-xl border text-left transition-all space-y-0.5 ${
                        ativo
                          ? 'bg-emerald-500/15 border-emerald-500/40 shadow-sm'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className={`text-xs font-bold ${ativo ? 'text-emerald-300' : 'text-zinc-200'}`}>
                        {pub.label}
                      </div>
                      <div className="text-[10px] text-zinc-400">{pub.desc}</div>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* 2. TELEMETRIA: SE ELES ABRIRAM NO LOCAL */}
            <Card className="bg-zinc-950 border-white/10 p-4 sm:p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider text-[11px]">
                    Telemetria: Aberturas Reais no Aparelho
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSimularAberturaLocal}
                    className="text-[11px] text-zinc-400 hover:text-sky-300 bg-white/5 border border-white/10 px-2 py-1 rounded-lg transition-colors"
                  >
                    + Simular Clique
                  </button>
                  <button
                    onClick={() => void carregarMetricas()}
                    disabled={carregandoMetricas}
                    className="text-xs text-zinc-400 hover:text-white p-1 rounded transition-colors"
                    title="Atualizar métricas"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${carregandoMetricas ? 'animate-spin text-sky-400' : ''}`} />
                  </button>
                </div>
              </div>

              {/* 4 Cards de Métricas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[11px] text-zinc-400 font-medium">Disparadas</span>
                  <div className="text-xl font-bold text-white font-mono">{metricas?.totalDisparadas ?? 0}</div>
                  <span className="text-[10px] text-zinc-500">Agendadas no celular</span>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-emerald-500/20 space-y-1">
                  <span className="text-[11px] text-emerald-400 font-medium">Abertas no Local</span>
                  <div className="text-xl font-bold text-emerald-400 font-mono">{metricas?.totalAbertas ?? 0}</div>
                  <span className="text-[10px] text-zinc-500">Alunos que clicaram</span>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-sky-500/20 space-y-1">
                  <span className="text-[11px] text-sky-400 font-medium">Taxa de Abertura</span>
                  <div className="text-xl font-bold text-sky-400 font-mono">{metricas?.taxaAberturaPct ?? 0}%</div>
                  <span className="text-[10px] text-zinc-500">Conversão real</span>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-amber-500/20 space-y-1">
                  <span className="text-[11px] text-amber-400 font-medium">Tempo até Abrir</span>
                  <div className="text-xl font-bold text-amber-400 font-mono">~{metricas?.tempoMedioAteAbrirMin ?? 4} min</div>
                  <span className="text-[10px] text-zinc-500">Média pós-disparo</span>
                </div>
              </div>

              {/* Feed das Últimas Aberturas */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Últimos Alunos que Abriram a Notificação</span>
                  </span>
                  {metricas?.ultimasAberturas && metricas.ultimasAberturas.length > 0 && (
                    <button
                      onClick={handleLimparTestes}
                      className="text-[10px] text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Limpar</span>
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {metricas?.ultimasAberturas && metricas.ultimasAberturas.length > 0 ? (
                    metricas.ultimasAberturas.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-white font-medium truncate">{ev.titulo}</div>
                          <div className="text-[11px] text-zinc-400 truncate">{ev.userEmail || 'aluno'}</div>
                        </div>
                        <div className="text-right shrink-0 space-y-0.5">
                          <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px]">
                            {ev.acaoId === 'continuar' ? 'Clicou Continuar' : 'Abriu Push'}
                          </Badge>
                          <div className="text-[10px] text-zinc-500">
                            {new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(
                              new Date(ev.timestamp)
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-zinc-500 rounded-xl bg-white/[0.02] border border-dashed border-white/10">
                      Nenhuma abertura registrada ainda. Use o botão "+ Simular Clique" para testar o registro.
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Rodapé Minimalista */}
        <div className="py-2 text-center text-[11px] text-zinc-600">
          Notificações Locais · Motor Nativo Capacitor v8 & Web Push
        </div>
      </div>
    </div>
  );
}
