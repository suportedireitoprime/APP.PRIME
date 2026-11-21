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

export default function AdminNotificacoesLocais() {
  const navigate = useNavigate();
  const [regras, setRegras] = useState<RegraNotificacaoLocal[]>(() => carregarRegrasNotificacoesLocais());
  const [regraAtivaId, setRegraAtivaId] = useState<string>('videoaulas_continuar');
  const [progressoSimulado, setProgressoSimulado] = useState<number>(60);
  const [testando, setTestando] = useState<boolean>(false);
  const [contagemRegressiva, setContagemRegressiva] = useState<number | null>(null);

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

  // Simula uma abertura no local para testar a telemetria em tempo real
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
        return <PlayCircle className="w-5 h-5 text-sky-400" />;
      case 'audioaulas':
        return <Headphones className="w-5 h-5 text-emerald-400" />;
      case 'livros':
        return <BookOpen className="w-5 h-5 text-amber-400" />;
      case 'streak':
        return <Flame className="w-5 h-5 text-orange-400" />;
      case 'flashcards':
        return <Brain className="w-5 h-5 text-purple-400" />;
      case 'trial':
        return <Hourglass className="w-5 h-5 text-rose-400" />;
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
            <span>Push Nuvem</span>
          </button>
        }
      />

      <div className="max-w-4xl mx-auto px-4 pt-4 space-y-6">
        {/* Banner Explicativo */}
        <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-r from-sky-950/40 via-zinc-900 to-zinc-900 p-4 sm:p-5">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center shrink-0 text-sky-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-semibold text-white">Disparo Inteligente no Dispositivo</h2>
                <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/30 text-[10px]">Latência Zero</Badge>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">100% Gratuito</Badge>
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">Telemetria Local</Badge>
              </div>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                As notificações são disparadas diretamente no chip do celular quando o aluno pausa uma aula ou livro.
                Abaixo você acompanha a <strong>taxa de abertura real</strong> no aparelho e quem clicou para continuar o estudo.
              </p>
            </div>
          </div>
        </div>

        {/* =========================================================================
            PAINEL DE TELEMETRIA: SE ELES ABRIRAM NO LOCAL (METRICAS REAIS)
           ========================================================================= */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider text-[11px]">
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. Total Disparadas */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-1">
              <span className="text-[11px] text-zinc-400 flex items-center gap-1.5 font-medium">
                <Send className="w-3.5 h-3.5 text-zinc-400" />
                <span>Disparadas</span>
              </span>
              <div className="text-xl font-bold text-white font-mono">
                {metricas?.totalDisparadas ?? 0}
              </div>
              <span className="text-[10px] text-zinc-500">Agendadas no celular</span>
            </div>

            {/* 2. Total Abertas */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-emerald-500/20 space-y-1">
              <span className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-medium">
                <MousePointerClick className="w-3.5 h-3.5 text-emerald-400" />
                <span>Abertas no Local</span>
              </span>
              <div className="text-xl font-bold text-emerald-400 font-mono">
                {metricas?.totalAbertas ?? 0}
              </div>
              <span className="text-[10px] text-zinc-500">Alunos que clicaram</span>
            </div>

            {/* 3. Taxa de Abertura (CTR) */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-sky-500/20 space-y-1">
              <span className="text-[11px] text-sky-400 flex items-center gap-1.5 font-medium">
                <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
                <span>Taxa de Abertura</span>
              </span>
              <div className="text-xl font-bold text-sky-400 font-mono">
                {metricas?.taxaAberturaPct ?? 0}%
              </div>
              <span className="text-[10px] text-zinc-500">Conversão real no aparelho</span>
            </div>

            {/* 4. Tempo Médio até Abrir */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-amber-500/20 space-y-1">
              <span className="text-[11px] text-amber-400 flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Tempo de Resposta</span>
              </span>
              <div className="text-xl font-bold text-amber-400 font-mono">
                ~{metricas?.tempoMedioAteAbrirMin ?? 4} min
              </div>
              <span className="text-[10px] text-zinc-500">Média pós-disparo</span>
            </div>
          </div>

          {/* Desempenho por Módulo & Feed de Aberturas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Tabela por Função */}
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Desempenho por Função
                </h4>
                <span className="text-[11px] text-zinc-500">Abertas / Disparadas</span>
              </div>

              <div className="space-y-2">
                {[
                  { id: 'videoaulas' as const, label: 'Videoaulas', icon: PlayCircle, color: 'text-sky-400' },
                  { id: 'audioaulas' as const, label: 'Áudioaulas', icon: Headphones, color: 'text-emerald-400' },
                  { id: 'livros' as const, label: 'Livros & Vade Mecum', icon: BookOpen, color: 'text-amber-400' },
                  { id: 'streak' as const, label: 'Ofensiva Diária', icon: Flame, color: 'text-orange-400' },
                  { id: 'flashcards' as const, label: 'Flashcards', icon: Brain, color: 'text-purple-400' },
                ].map((item) => {
                  const stat = metricas?.porModulo?.[item.id] || { disparadas: 0, abertas: 0, taxaPct: 0 };
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${item.color}`} />
                        <span className="text-zinc-200 font-medium">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-400 font-mono text-[11px]">
                          {stat.abertas} / {stat.disparadas}
                        </span>
                        <Badge className="bg-white/10 text-white font-mono text-[10px]">
                          {stat.taxaPct}%
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Feed Ao Vivo das Últimas Aberturas */}
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Últimos Alunos que Abriram</span>
                </h4>
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

              <div className="space-y-2 max-h-[175px] overflow-y-auto pr-1">
                {metricas?.ultimasAberturas && metricas.ultimasAberturas.length > 0 ? (
                  metricas.ultimasAberturas.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-white font-medium truncate">{ev.titulo}</span>
                        <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px] shrink-0">
                          {ev.acaoId === 'continuar' ? 'Clicou Continuar' : 'Abriu Push'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span className="truncate">{ev.userEmail || 'aluno'}</span>
                        <span className="shrink-0 text-zinc-500">
                          {new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(
                            new Date(ev.timestamp)
                          )}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-zinc-500 rounded-xl bg-white/[0.02] border border-dashed border-white/10">
                    Nenhuma abertura registrada ainda. Use o botão "+ Simular Clique" acima para testar o registro.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SIMULADOR INTERATIVO ANDROID (IDÊNTICO AO PRINT DO USUÁRIO)
           ========================================================================= */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider text-[11px]">
                Preview em Tempo Real (Android 14/15)
              </h3>
            </div>
            <span className="text-[11px] text-zinc-400">Arraste para testar o progresso</span>
          </div>

          <Card className="bg-zinc-950/90 border-white/10 p-5 rounded-2xl shadow-xl space-y-4">
            {/* O CARD DE NOTIFICAÇÃO ESTILO ANDROID NATIVO */}
            <div className="relative mx-auto max-w-md w-full bg-[#1e1e20] text-white rounded-2xl p-3.5 sm:p-4 border border-white/10 shadow-2xl space-y-3 font-sans select-none">
              {/* Header do Sistema: Ícone do App, Nome, Autor e Capa */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {/* Ícone Redondo com Fogo (como no print) */}
                  <div className="w-6 h-6 rounded-full bg-[#f95738] flex items-center justify-center shrink-0 shadow-sm">
                    <Flame className="w-3.5 h-3.5 text-white fill-white" />
                  </div>
                  <span className="text-[13px] font-semibold text-white truncate">Direito Premium</span>
                  <span className="text-zinc-500 text-xs font-light">·</span>
                  <span className="text-zinc-400 text-xs truncate">
                    {regraSelecionada.modulo === 'audioaulas'
                      ? 'Áudioaula'
                      : regraSelecionada.modulo === 'livros'
                      ? 'Biblioteca'
                      : 'Estudo'}
                  </span>
                </div>

                {/* Capa do Livro / Aula (Direita) */}
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

              {/* Título & Subtítulo */}
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
                    toast.info(`Navegando para: ${regraSelecionada.rotaPadrao} (Abertura registrada!)`);
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
              <div className="pt-2 max-w-md mx-auto space-y-1.5">
                <div className="flex justify-between text-xs text-zinc-400 font-medium">
                  <span>Progresso do Aluno no Teste:</span>
                  <span className="text-sky-400 font-bold">{progressoSimulado}%</span>
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

            {/* Botões de Ação para Teste Real */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={() => handleDispararTeste(0)}
                disabled={testando || contagemRegressiva !== null}
                className="w-full sm:w-auto bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs px-5 h-11 rounded-xl shadow-lg shadow-sky-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Testar no Meu Aparelho Agora</span>
              </Button>

              <Button
                onClick={() => handleDispararTeste(5)}
                disabled={testando || contagemRegressiva !== null}
                variant="outline"
                className="w-full sm:w-auto border-white/20 bg-white/5 hover:bg-white/10 text-white font-medium text-xs px-5 h-11 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4 text-amber-400" />
                <span>
                  {contagemRegressiva !== null
                    ? `Disparando em ${contagemRegressiva}s... (bloqueie a tela)`
                    : 'Testar em 5 segundos (Background)'}
                </span>
              </Button>
            </div>
          </Card>
        </div>

        {/* =========================================================================
            GERENCIADOR DE REGRAS POR FUNÇÃO & PESSOAS
           ========================================================================= */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider text-[11px]">
                Regras por Função & Público-Alvo
              </h3>
              <p className="text-xs text-zinc-400">Escolha quais módulos enviam e para quem direcionar</p>
            </div>
            <button
              onClick={handleRestaurarPadroes}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restaurar Padrões</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {regras.map((regra) => {
              const selecionada = regra.id === regraAtivaId;

              return (
                <div
                  key={regra.id}
                  onClick={() => {
                    haptic.selection();
                    setRegraAtivaId(regra.id);
                  }}
                  className={`cursor-pointer rounded-2xl border transition-all p-4 ${
                    selecionada
                      ? 'border-sky-500/60 bg-zinc-900/90 shadow-lg shadow-sky-500/10'
                      : 'border-white/10 bg-zinc-950/60 hover:bg-zinc-900/50'
                  }`}
                >
                  {/* Cabeçalho do Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        {getModuloIcon(regra.modulo)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-white">{regra.nome}</h4>
                          {regra.mostrarBarraProgresso && (
                            <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/30 text-[10px]">
                              Barra Azul Ativa
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{regra.descricao}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <span className="text-xs text-zinc-400 font-medium hidden sm:inline">
                        {regra.ativo ? 'Ativo' : 'Pausado'}
                      </span>
                      <Switch
                        checked={regra.ativo}
                        onCheckedChange={(checked) => {
                          haptic.selection();
                          handleAtualizarRegra(regra.id, { ativo: checked });
                        }}
                      />
                    </div>
                  </div>

                  {/* Configurações Detalhadas (visíveis quando selecionado) */}
                  {selecionada && (
                    <div
                      className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* 1. Para Quais Pessoas Enviar (Público-Alvo) */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-sky-400" />
                          <span>Para quem enviar:</span>
                        </label>
                        <select
                          value={regra.publicoAlvo}
                          onChange={(e) => {
                            haptic.selection();
                            handleAtualizarRegra(regra.id, {
                              publicoAlvo: e.target.value as PublicoAlvoNotificacao,
                            });
                          }}
                          className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                        >
                          <option value="todos">👥 Todos os alunos</option>
                          <option value="gratuitos">🆓 Apenas Gratuitos (Foco em Conversão)</option>
                          <option value="assinantes">👑 Apenas Assinantes Pro (Engajamento)</option>
                          <option value="inativos_24h">💤 Inativos há mais de 24 horas</option>
                        </select>
                      </div>

                      {/* 2. Tempo de Inatividade / Horário de Disparo */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Gatilho de Disparo:</span>
                        </label>
                        {regra.horarioFixoDisparo ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={regra.horarioFixoDisparo}
                              onChange={(e) => {
                                handleAtualizarRegra(regra.id, { horarioFixoDisparo: e.target.value });
                              }}
                              className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                            />
                            <span className="text-[11px] text-zinc-400 shrink-0">Horário fixo</span>
                          </div>
                        ) : (
                          <select
                            value={regra.gatilhoHorasInatividade}
                            onChange={(e) => {
                              haptic.selection();
                              handleAtualizarRegra(regra.id, {
                                gatilhoHorasInatividade: Number(e.target.value),
                              });
                            }}
                            className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                          >
                            <option value={1}>1 hora após parar o estudo</option>
                            <option value={2}>2 horas após pausar (Recomendado)</option>
                            <option value={4}>4 horas após pausar</option>
                            <option value={12}>12 horas após pausar</option>
                            <option value={24}>24 horas após pausar</option>
                          </select>
                        )}
                      </div>

                      {/* 3. Título da Notificação */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-semibold text-zinc-300">
                          Exemplo de Título:
                        </label>
                        <Input
                          value={regra.exemploTitulo}
                          onChange={(e) => handleAtualizarRegra(regra.id, { exemploTitulo: e.target.value })}
                          className="bg-zinc-900 border-white/15 text-xs text-white h-9 rounded-xl"
                        />
                      </div>

                      {/* 4. Subtítulo da Notificação */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-semibold text-zinc-300">
                          Exemplo de Subtítulo:
                        </label>
                        <Input
                          value={regra.exemploSubtitulo}
                          onChange={(e) => handleAtualizarRegra(regra.id, { exemploSubtitulo: e.target.value })}
                          className="bg-zinc-900 border-white/15 text-xs text-white h-9 rounded-xl"
                        />
                      </div>

                      {/* 5. Botão de Ação & Rota */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-300">Texto do Botão de Ação:</label>
                        <Input
                          value={regra.textoBotaoAcao}
                          onChange={(e) => handleAtualizarRegra(regra.id, { textoBotaoAcao: e.target.value })}
                          className="bg-zinc-900 border-white/15 text-xs text-white h-9 rounded-xl"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-300">Rota de Abertura:</label>
                        <Input
                          value={regra.rotaPadrao}
                          onChange={(e) => handleAtualizarRegra(regra.id, { rotaPadrao: e.target.value })}
                          className="bg-zinc-900 border-white/15 text-xs text-white h-9 rounded-xl"
                        />
                      </div>

                      {/* 6. Barra de Progresso Azul */}
                      <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                        <div>
                          <div className="text-xs font-semibold text-white">Barra de Progresso Azul</div>
                          <div className="text-[11px] text-zinc-400">
                            Exibe a linha azul horizontal idêntica ao player de mídia no painel de notificações
                          </div>
                        </div>
                        <Switch
                          checked={regra.mostrarBarraProgresso}
                          onCheckedChange={(checked) => {
                            haptic.selection();
                            handleAtualizarRegra(regra.id, { mostrarBarraProgresso: checked });
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Rodapé Informativo */}
        <div className="p-4 rounded-xl border border-white/10 bg-zinc-950/50 text-center space-y-1 text-xs text-zinc-400">
          <p>
            As aberturas locais são registradas instantaneamente no aparelho e sincronizadas com a nuvem.
          </p>
          <p className="text-[11px] text-zinc-500">
            Capacitor Local Notifications v8 · Suporte a Android 14+ / iOS 17+ com Action Buttons e CTR local
          </p>
        </div>
      </div>
    </div>
  );
}
