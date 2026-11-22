import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  PlayCircle,
  Headphones,
  BookOpen,
  Flame,
  Brain,
  Clock,
  Send,
  BellRing,
  RotateCcw,
  Moon,
  RefreshCw,
  Trash2,
  Newspaper,
  Users,
  BarChart3,
  Search,
  Smartphone,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Activity,
  Zap,
  Filter,
  Eye,
} from 'lucide-react';
import {
  carregarRegrasNotificacoesLocais,
  salvarRegrasNotificacoesLocais,
  dispararNotificacaoLocalTeste,
  obterMetricasNotificacoesLocais,
  limparMetricasLocais,
  registrarAberturaNotificacaoLocal,
  obterAlunosAtivosParaRetencao,
  dispararRetencaoParaAluno,
  dispararRetencaoEmMassaParaAlunos,
  RegraNotificacaoLocal,
  ModuloNotificacaoLocal,
  PublicoAlvoNotificacao,
  MetricasNotificacoesLocais,
  AlunoAtivoRetencao,
  EventoTelemetriaLocal,
  REGRAS_PADRAO_NOTIFICACOES_LOCAIS,
} from '@/lib/nativo/notificacaoLocalManager';
import { haptic } from '@/lib/nativeHaptics';

type TabView = 'aparencia' | 'gatilhos' | 'publicos';

export default function AdminNotificacoesLocais() {
  const navigate = useNavigate();
  const [tabAtiva, setTabAtiva] = useState<TabView>('aparencia');
  const [regras, setRegras] = useState<RegraNotificacaoLocal[]>(() => carregarRegrasNotificacoesLocais());
  const [regraAtivaId, setRegraAtivaId] = useState<string>('videoaulas_continuar');
  const [progressoSimulado, setProgressoSimulado] = useState<number>(60);
  const [testando, setTestando] = useState<boolean>(false);
  const [contagemRegressiva, setContagemRegressiva] = useState<number | null>(null);

  // Telemetria local
  const [metricas, setMetricas] = useState<MetricasNotificacoesLocais | null>(null);
  const [carregandoMetricas, setCarregandoMetricas] = useState<boolean>(false);

  // Alunos ativos & Telemetria expandida
  const [alunosAtivos, setAlunosAtivos] = useState<AlunoAtivoRetencao[]>([]);
  const [carregandoAlunos, setCarregandoAlunos] = useState<boolean>(false);
  const [subSecaoPublico, setSubSecaoPublico] = useState<'alunos' | 'telemetria' | 'segmentos'>('alunos');
  const [filtroModuloAluno, setFiltroModuloAluno] = useState<'todos' | ModuloNotificacaoLocal>('todos');
  const [buscaAluno, setBuscaAluno] = useState<string>('');
  const [disparandoAlunoId, setDisparandoAlunoId] = useState<string | null>(null);

  // Disparo em Massa & Lembrete Geral
  const [disparandoEmMassa, setDisparandoEmMassa] = useState<boolean>(false);
  const [progressoMassa, setProgressoMassa] = useState<{
    atual: number;
    total: number;
    alunoNome: string;
  } | null>(null);
  const [modoDisparoMassa, setModoDisparoMassa] = useState<'inteligente' | 'streak' | 'flashcards' | 'boletim'>('inteligente');

  const carregarMetricas = useCallback(async () => {
    setCarregandoMetricas(true);
    try {
      const data = await obterMetricasNotificacoesLocais();
      setMetricas(data);
    } catch {
      /* ignore */
    } finally {
      setCarregandoMetricas(false);
    }
  }, []);

  const carregarAlunos = useCallback(async () => {
    setCarregandoAlunos(true);
    try {
      const lista = await obterAlunosAtivosParaRetencao();
      setAlunosAtivos(lista);
    } catch {
      /* ignore */
    } finally {
      setCarregandoAlunos(false);
    }
  }, []);

  useEffect(() => {
    void carregarMetricas();
    void carregarAlunos();
  }, [carregarMetricas, carregarAlunos]);

  const alunosFiltrados = useMemo(() => {
    return alunosAtivos.filter((aluno) => {
      const casaModulo = filtroModuloAluno === 'todos' || aluno.modulo === filtroModuloAluno;
      const termo = buscaAluno.trim().toLowerCase();
      const casaBusca =
        !termo ||
        aluno.nome.toLowerCase().includes(termo) ||
        aluno.email.toLowerCase().includes(termo) ||
        aluno.tituloConteudo.toLowerCase().includes(termo) ||
        aluno.subtituloConteudo.toLowerCase().includes(termo);
      return casaModulo && casaBusca;
    });
  }, [alunosAtivos, filtroModuloAluno, buscaAluno]);

  const handleDispararAluno = async (aluno: AlunoAtivoRetencao) => {
    haptic.impact('heavy');
    setDisparandoAlunoId(aluno.id);
    toast.loading(`Disparando retenção (${aluno.progressoPct}%) para ${aluno.nome}...`, { id: 'disp_aluno' });
    const res = await dispararRetencaoParaAluno(aluno, 0);
    setDisparandoAlunoId(null);
    if (res.sucesso) {
      toast.success(res.mensagem, { id: 'disp_aluno' });
      void carregarMetricas();
      void carregarAlunos();
    } else {
      toast.error(res.mensagem, { id: 'disp_aluno' });
    }
  };

  const handleDispararMassa = async () => {
    if (alunosFiltrados.length === 0) {
      toast.info('Nenhum aluno elegível no filtro atual.');
      return;
    }
    haptic.impact('heavy');
    setDisparandoEmMassa(true);
    setProgressoMassa({ atual: 0, total: alunosFiltrados.length, alunoNome: '' });
    toast.loading(`Iniciando disparo em massa para ${alunosFiltrados.length} alunos...`, { id: 'disp_massa' });

    const moduloFixo = modoDisparoMassa === 'inteligente' ? undefined : modoDisparoMassa;

    const res = await dispararRetencaoEmMassaParaAlunos(
      alunosFiltrados,
      moduloFixo,
      (atual, total, alunoNome) => {
        setProgressoMassa({ atual, total, alunoNome });
      }
    );

    setDisparandoEmMassa(false);
    setProgressoMassa(null);

    if (res.sucessos > 0) {
      toast.success(`Disparo concluído! ${res.sucessos} lembretes enviados (${res.erros} falhas).`, { id: 'disp_massa' });
      void carregarMetricas();
      void carregarAlunos();
    } else {
      toast.error('Falha ao processar disparos em massa.', { id: 'disp_massa' });
    }
  };

  const handleCarregarAlunoNoPreview = (aluno: AlunoAtivoRetencao) => {
    haptic.selection();
    const regraCorrespondente = regras.find((r) => r.modulo === aluno.modulo) || regras[0];
    setRegraAtivaId(regraCorrespondente.id);
    setProgressoSimulado(aluno.progressoPct);
    handleAtualizarRegra(regraCorrespondente.id, {
      exemploTitulo: aluno.tituloConteudo,
      exemploSubtitulo: aluno.subtituloConteudo,
      exemploCapaUrl: aluno.capaUrl || regraCorrespondente.exemploCapaUrl,
      rotaPadrao: aluno.rota,
    });
    toast.info(`Dados de ${aluno.nome} carregados no preview!`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    toast.success('Padrões restaurados');
  };

  const handleLimparTestes = async () => {
    haptic.selection();
    await limparMetricasLocais();
    toast.success('Métricas resetadas');
    void carregarMetricas();
  };

  const handleDispararTeste = async (delaySegundos: number = 0) => {
    haptic.impact('heavy');
    setTestando(true);

    if (delaySegundos > 0) {
      setContagemRegressiva(delaySegundos);
      toast.info(`Disparo em ${delaySegundos}s! Minimize ou bloqueie a tela.`);
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
    toast.success('Abertura registrada no aparelho');
    void carregarMetricas();
  };

  const handleSimularAberturaDoEvento = async (ev: EventoTelemetriaLocal) => {
    haptic.impact('medium');
    await registrarAberturaNotificacaoLocal({
      notificacaoId: ev.notificacaoId,
      modulo: ev.modulo,
      acao: 'continuar',
      rota: ev.rota,
      progresso: ev.progresso,
      eventoId: ev.id,
    });
    toast.success(`Abertura computada para: ${ev.titulo}`);
    void carregarMetricas();
  };

  const getModuloIcon = (modulo: ModuloNotificacaoLocal) => {
    switch (modulo) {
      case 'videoaulas':
        return <PlayCircle className="w-3.5 h-3.5 text-sky-400" />;
      case 'audioaulas':
        return <Headphones className="w-3.5 h-3.5 text-emerald-400" />;
      case 'livros':
        return <BookOpen className="w-3.5 h-3.5 text-amber-400" />;
      case 'streak':
        return <Flame className="w-3.5 h-3.5 text-orange-400" />;
      case 'flashcards':
        return <Brain className="w-3.5 h-3.5 text-purple-400" />;
      case 'trial':
        return <Clock className="w-3.5 h-3.5 text-rose-400" />;
      case 'boletim':
        return <Newspaper className="w-3.5 h-3.5 text-sky-400" />;
    }
  };

  return (
    <div className="min-h-dvh bg-[#0B0B0D] text-zinc-100 pb-16">
      <PageHeader
        title="Notificações Locais"
        onBack={() => navigate('/admin-funcoes?cat=push')}
        rightAction={
          <button
            onClick={() => navigate('/admin-push')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-[11px] font-medium text-zinc-300 transition-colors"
          >
            <BellRing className="w-3 h-3 text-emerald-400" />
            <span>Nuvem</span>
          </button>
        }
      />

      <div className="max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto px-4 pt-2 space-y-4">
        {/* SELETOR HORIZONTAL DE MÓDULO (Pílulas ultra-limpas) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {regras.map((r) => {
            const selecionada = r.id === regraAtivaId;
            return (
              <button
                key={r.id}
                onClick={() => {
                  haptic.selection();
                  setRegraAtivaId(r.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs shrink-0 transition-all ${
                  selecionada
                    ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                    : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-white/5'
                }`}
              >
                {getModuloIcon(r.modulo)}
                <span>{r.nome.split(' (')[0].replace('Continuar ', '')}</span>
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            PREVIEW FLUTUANTE REAL NATIVO (1:1 Android / iOS, sem caixas envolventes)
           ========================================================================= */}
        <div className="pt-1">
          <div className="w-full bg-[#1c1c1e] text-white rounded-2xl p-4 border border-white/10 shadow-2xl space-y-3 select-none">
            {/* Header da Notificação: Ícone App, Nome e Capa Real */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 rounded-full bg-[#f95738] flex items-center justify-center shrink-0 shadow-sm">
                  <Flame className="w-3 h-3 text-white fill-white" />
                </div>
                <span
                  className="text-[13px] font-semibold text-white tracking-tight"
                  style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                >
                  Estudos Jurídicos
                </span>
                <span className="text-zinc-500 text-xs">·</span>
                <span
                  className="text-zinc-400 text-xs font-normal"
                  style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                >
                  {regraSelecionada.modulo === 'audioaulas'
                    ? 'Áudio'
                    : regraSelecionada.modulo === 'livros'
                    ? 'Leitura'
                    : regraSelecionada.modulo === 'boletim'
                    ? 'Notícias'
                    : 'Estudo'}
                </span>
              </div>

              {regraSelecionada.exemploCapaUrl && (
                <div className="w-10 h-13 rounded-md overflow-hidden shrink-0 border border-white/15 bg-zinc-800 shadow-md">
                  <img
                    src={regraSelecionada.exemploCapaUrl}
                    alt="Capa Real"
                    className="w-full h-full object-cover object-center"
                    loading="eager"
                    decoding="async"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/covers/o-investidor-inteligente.jpg';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Conteúdo: Título e Subtítulo com tipografia nativa ultra-limpa (NÃO herdando Bebas Neue / Barlow) */}
            <div className="space-y-0.5 pt-0.5">
              <div
                className="text-[14px] font-semibold text-zinc-100 leading-snug line-clamp-1"
                style={{
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
                  letterSpacing: '-0.015em',
                  textTransform: 'none',
                }}
              >
                {regraSelecionada.exemploTitulo}
              </div>
              <div
                className="text-[12px] text-zinc-400 font-normal line-clamp-1"
                style={{
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
                  textTransform: 'none',
                }}
              >
                {regraSelecionada.exemploSubtitulo}
              </div>
            </div>

            {/* Barra de Progresso Azul Vibrante */}
            {regraSelecionada.mostrarBarraProgresso && (
              <div className="pt-0.5">
                <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#007aff] rounded-full transition-all duration-200 shadow-[0_0_8px_#007aff]"
                    style={{ width: `${progressoSimulado}%` }}
                  />
                </div>
              </div>
            )}

            {/* Ação da Notificação */}
            <div className="pt-1.5 flex items-center justify-between border-t border-white/5 text-[13px]">
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  void handleSimularAberturaLocal();
                }}
                className="font-medium text-white hover:text-sky-400 active:opacity-70 transition-colors"
                style={{
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
                  textTransform: 'none',
                }}
              >
                {regraSelecionada.textoBotaoAcao}
              </button>
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
            </div>
          </div>
        </div>

        {/* SLIDER DISCRETO DE PROGRESSO */}
        {regraSelecionada.mostrarBarraProgresso && (
          <div className="flex items-center gap-3 px-1 text-xs text-zinc-400">
            <span className="shrink-0 text-zinc-500 text-[11px]">Progresso</span>
            <input
              type="range"
              min="5"
              max="95"
              value={progressoSimulado}
              onChange={(e) => setProgressoSimulado(Number(e.target.value))}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
            <span className="font-mono text-sky-400 shrink-0 w-8 text-right text-xs">{progressoSimulado}%</span>
          </div>
        )}

        {/* BOTÕES DE DISPARO COMPACTOS */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => handleDispararTeste(0)}
            disabled={testando || contagemRegressiva !== null}
            className="bg-[#007aff] hover:bg-[#006ee6] text-white font-semibold text-xs h-9 rounded-xl flex items-center justify-center gap-1.5 active:scale-98 transition-all shadow-md shadow-[#007aff]/20"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Testar Agora</span>
          </Button>

          <Button
            onClick={() => handleDispararTeste(5)}
            disabled={testando || contagemRegressiva !== null}
            variant="outline"
            className="border-white/10 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 font-medium text-xs h-9 rounded-xl flex items-center justify-center gap-1.5 active:scale-98 transition-all"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{contagemRegressiva !== null ? `${contagemRegressiva}s...` : 'Em 5 segundos'}</span>
          </Button>
        </div>

        {/* ABAS SUBORDINADAS ULTRA-FINAS */}
        <div className="flex border-b border-white/10 text-xs font-medium pt-2">
          {[
            { id: 'aparencia' as const, label: 'Textos' },
            { id: 'gatilhos' as const, label: 'Gatilho' },
            { id: 'publicos' as const, label: 'Público & Métricas' },
          ].map((tab) => {
            const ativo = tabAtiva === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  haptic.selection();
                  setTabAtiva(tab.id);
                }}
                className={`flex-1 pb-2 text-center transition-colors relative ${
                  ativo ? 'text-white font-semibold' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span>{tab.label}</span>
                {ativo && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            ABA 1: TEXTOS (INPUTS MINIMALISTAS)
           ========================================================================= */}
        {tabAtiva === 'aparencia' && (
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <span className="text-[11px] text-zinc-400">Título da Notificação</span>
              <Input
                value={regraSelecionada.exemploTitulo}
                onChange={(e) => handleAtualizarRegra(regraSelecionada.id, { exemploTitulo: e.target.value })}
                className="bg-zinc-900/90 border-white/10 text-xs text-white h-9 rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-zinc-400">Subtítulo</span>
              <Input
                value={regraSelecionada.exemploSubtitulo}
                onChange={(e) => handleAtualizarRegra(regraSelecionada.id, { exemploSubtitulo: e.target.value })}
                className="bg-zinc-900/90 border-white/10 text-xs text-white h-9 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[11px] text-zinc-400">Botão de Ação</span>
                <Input
                  value={regraSelecionada.textoBotaoAcao}
                  onChange={(e) => handleAtualizarRegra(regraSelecionada.id, { textoBotaoAcao: e.target.value })}
                  className="bg-zinc-900/90 border-white/10 text-xs text-white h-9 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-zinc-400">Rota</span>
                <Input
                  value={regraSelecionada.rotaPadrao}
                  onChange={(e) => handleAtualizarRegra(regraSelecionada.id, { rotaPadrao: e.target.value })}
                  className="bg-zinc-900/90 border-white/10 text-xs text-white h-9 rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-zinc-400">Barra de progresso azul</span>
              <Switch
                checked={regraSelecionada.mostrarBarraProgresso}
                onCheckedChange={(checked) => {
                  haptic.selection();
                  handleAtualizarRegra(regraSelecionada.id, { mostrarBarraProgresso: checked });
                }}
              />
            </div>
          </div>
        )}

        {/* =========================================================================
            ABA 2: GATILHOS (TEMPO & REGRAS)
           ========================================================================= */}
        {tabAtiva === 'gatilhos' && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-white/5">
              <span className="text-xs text-zinc-300">Ativar disparo automático</span>
              <Switch
                checked={regraSelecionada.ativo}
                onCheckedChange={(checked) => {
                  haptic.selection();
                  handleAtualizarRegra(regraSelecionada.id, { ativo: checked });
                }}
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] text-zinc-400">Tempo após pausar:</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { horas: 0.5, label: '30 min' },
                  { horas: 1, label: '1 hora' },
                  { horas: 2, label: '2h (Padrão)' },
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
                      className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
                        ativo
                          ? 'bg-white text-zinc-950 font-semibold'
                          : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-white/5 mt-2">
              <div className="flex items-center gap-2">
                <Moon className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs text-zinc-300">Silêncio Noturno (23h às 07h)</span>
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
        )}

        {/* =========================================================================
            ABA 3: PÚBLICO & MÉTRICAS (ALUNOS ATIVOS & TELEMETRIA COMPLETA)
           ========================================================================= */}
        {tabAtiva === 'publicos' && (
          <div className="space-y-4 pt-1">
            {/* SUB-SELETOR ULTRA-LIMPO: Alunos Ativos vs Telemetria vs Segmentação */}
            <div className="flex items-center gap-1.5 p-1 bg-zinc-900/90 rounded-2xl border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setSubSecaoPublico('alunos');
                }}
                className={`flex-1 py-1.5 px-2 rounded-xl font-medium transition-all flex items-center justify-center gap-1.5 ${
                  subSecaoPublico === 'alunos'
                    ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-sky-500" />
                <span>Alunos Ativos</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    subSecaoPublico === 'alunos'
                      ? 'bg-zinc-900 text-white'
                      : 'bg-white/10 text-zinc-300'
                  }`}
                >
                  {alunosAtivos.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setSubSecaoPublico('telemetria');
                }}
                className={`flex-1 py-1.5 px-2 rounded-xl font-medium transition-all flex items-center justify-center gap-1.5 ${
                  subSecaoPublico === 'telemetria'
                    ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Telemetria</span>
                {metricas && metricas.taxaAberturaPct > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      subSecaoPublico === 'telemetria'
                        ? 'bg-emerald-950 text-emerald-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {metricas.taxaAberturaPct}% CTR
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setSubSecaoPublico('segmentos');
                }}
                className={`py-1.5 px-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-1.5 ${
                  subSecaoPublico === 'segmentos'
                    ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filtros</span>
              </button>
            </div>

            {/* ---------------------------------------------------------------------
                SUB-VIEW 1: ALUNOS ATIVOS COM ESTUDOS EM ANDAMENTO
               --------------------------------------------------------------------- */}
            {subSecaoPublico === 'alunos' && (
              <div className="space-y-3">
                {/* Busca e Filtros Rápidos */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      value={buscaAluno}
                      onChange={(e) => setBuscaAluno(e.target.value)}
                      placeholder="Pesquisar por aluno, e-mail ou obra..."
                      className="bg-zinc-900/90 border-white/10 text-xs text-white pl-8.5 h-8.5 rounded-xl placeholder:text-zinc-500"
                    />
                    {buscaAluno && (
                      <button
                        onClick={() => setBuscaAluno('')}
                        className="text-[10px] text-zinc-400 hover:text-white absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-white/10"
                      >
                        Limpar
                      </button>
                    )}
                  </div>

                  {/* Pílulas de Módulo */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
                    {[
                      { id: 'todos', label: 'Todos' },
                      { id: 'livros', label: '📖 Livros', icon: BookOpen },
                      { id: 'audioaulas', label: '🎧 Áudio', icon: Headphones },
                      { id: 'videoaulas', label: '🎬 Vídeo', icon: PlayCircle },
                    ].map((filtro) => {
                      const ativo = filtroModuloAluno === filtro.id;
                      return (
                        <button
                          key={filtro.id}
                          type="button"
                          onClick={() => {
                            haptic.selection();
                            setFiltroModuloAluno(filtro.id as any);
                          }}
                          className={`px-2.5 py-1 rounded-full text-xs shrink-0 transition-all ${
                            ativo
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold'
                              : 'bg-zinc-900/60 text-zinc-400 border border-white/5 hover:text-zinc-200'
                          }`}
                        >
                          {filtro.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Banner de Status com Botão Atualizar */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-sky-200 text-[11px] font-medium">
                      {alunosFiltrados.length} alunos com estudos pausados (elegíveis para notificação de retenção)
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      haptic.selection();
                      void carregarAlunos();
                      void carregarMetricas();
                    }}
                    className="p-1 rounded-md text-sky-400 hover:text-sky-200 hover:bg-sky-500/20 transition-colors"
                    title="Recarregar alunos"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${carregandoAlunos ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {/* CARD DE DISPARO EM MASSA DE ALTA EFICIÊNCIA */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/70 via-zinc-900/95 to-sky-950/50 border border-sky-500/30 shadow-xl space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
                        <Send className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>Disparo em Massa & Retenção 360°</span>
                          <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/40 text-[10px] px-1.5 py-0">
                            {alunosFiltrados.length} Alunos
                          </Badge>
                        </h4>
                        <p className="text-[11px] text-zinc-400">
                          Dispara lembretes automáticos para os alunos não esquecerem os estudos
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Seletor de Modo de Disparo */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        setModoDisparoMassa('inteligente');
                      }}
                      className={`p-2 rounded-xl text-left border transition-all flex flex-col gap-0.5 ${
                        modoDisparoMassa === 'inteligente'
                          ? 'bg-sky-500/20 border-sky-500/60 text-white shadow-sm'
                          : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                        <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                        <span>🎯 Inteligente (360°)</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 leading-tight">
                        Cada aluno recebe sua pendência real (Vídeo, Áudio ou Livro)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        setModoDisparoMassa('streak');
                      }}
                      className={`p-2 rounded-xl text-left border transition-all flex flex-col gap-0.5 ${
                        modoDisparoMassa === 'streak'
                          ? 'bg-orange-500/20 border-orange-500/60 text-white shadow-sm'
                          : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                        <Flame className="w-3.5 h-3.5 text-orange-400" />
                        <span>🔥 Salvar Streak</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 leading-tight">
                        Alerta de ofensiva para não perder a sequência hoje
                      </span>
                    </button>
                  </div>

                  {/* Botão de Ação Primária & Barra de Progresso Real */}
                  {disparandoEmMassa ? (
                    <div className="space-y-2 p-2.5 rounded-xl bg-black/50 border border-white/10">
                      <div className="flex items-center justify-between text-xs text-zinc-300">
                        <span className="flex items-center gap-1.5 font-medium truncate max-w-[240px]">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400 shrink-0" />
                          <span className="truncate">Disparando para {progressoMassa?.alunoNome || 'aluno'}...</span>
                        </span>
                        <span className="font-mono text-sky-400 font-bold shrink-0">
                          {progressoMassa?.atual || 0} / {progressoMassa?.total || alunosFiltrados.length}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-150"
                          style={{
                            width: `${
                              progressoMassa
                                ? Math.round((progressoMassa.atual / progressoMassa.total) * 100)
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={handleDispararMassa}
                      disabled={alunosFiltrados.length === 0}
                      className="w-full h-10 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-sky-900/30 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>
                        Disparar Lembrete Geral para Todos ({alunosFiltrados.length} Alunos)
                      </span>
                    </Button>
                  )}
                </div>

                {/* Lista de Alunos Ativos com Barra de Progresso Real */}
                <div className="space-y-2.5">
                  {alunosFiltrados.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 text-xs bg-zinc-900/40 rounded-2xl border border-white/5 p-4">
                      Nenhum aluno encontrado para os filtros selecionados.
                    </div>
                  ) : (
                    alunosFiltrados.map((aluno) => {
                      const isFiring = disparandoAlunoId === aluno.id;
                      return (
                        <div
                          key={aluno.id}
                          className="p-3.5 rounded-2xl bg-[#18181b]/80 border border-white/10 hover:border-white/20 transition-all space-y-3 shadow-lg"
                        >
                          {/* Cabeçalho do Aluno: Nome, E-mail, Dispositivo e Tempo Parado */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                                {aluno.nome.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-semibold text-white truncate">
                                    {aluno.nome}
                                  </span>
                                  {aluno.isLocalUser && (
                                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[9px] px-1.5 py-0">
                                      Este Aparelho
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-[11px] text-zinc-400 truncate font-mono">
                                  {aluno.email}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <Badge
                                variant="outline"
                                className="bg-zinc-900/80 border-white/10 text-zinc-300 text-[10px] flex items-center gap-1"
                              >
                                <Smartphone className="w-2.5 h-2.5 text-zinc-400" />
                                <span>{aluno.dispositivo}</span>
                              </Badge>
                              <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 text-amber-400" />
                                <span>{aluno.tempoParadoFormatado}</span>
                              </span>
                            </div>
                          </div>

                          {/* Bloco de Conteúdo: Capa, Título e Barra de Progresso Real */}
                          <div className="flex gap-3 p-2.5 rounded-xl bg-zinc-900/90 border border-white/5">
                            {aluno.capaUrl && (
                              <div className="w-10 h-13 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-zinc-800 shadow-sm">
                                <img
                                  src={aluno.capaUrl}
                                  alt={aluno.tituloConteudo}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src =
                                      '/covers/o-investidor-inteligente.jpg';
                                  }}
                                />
                              </div>
                            )}

                            <div className="flex-1 min-w-0 space-y-1.5 justify-center flex flex-col">
                              <div className="flex items-center gap-1.5">
                                {getModuloIcon(aluno.modulo)}
                                <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                                  {aluno.modulo === 'livros'
                                    ? 'Leitura de Livro'
                                    : aluno.modulo === 'audioaulas'
                                    ? 'Áudioaula'
                                    : 'Videoaula'}
                                </span>
                              </div>

                              <div className="text-xs font-semibold text-zinc-100 truncate">
                                {aluno.tituloConteudo}
                              </div>

                              <div className="text-[11px] text-zinc-400 truncate">
                                {aluno.subtituloConteudo}
                              </div>

                              {/* Barra de Progresso Nativa Azul */}
                              <div className="space-y-1 pt-0.5">
                                <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[#007aff] rounded-full shadow-[0_0_8px_#007aff] transition-all"
                                    style={{ width: `${aluno.progressoPct}%` }}
                                  />
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                                  <span className="text-sky-400 font-semibold">{aluno.progressoPct}% concluído</span>
                                  {aluno.paginaAtual && aluno.totalPaginas && (
                                    <span>Pág {aluno.paginaAtual}/{aluno.totalPaginas}</span>
                                  )}
                                  {aluno.tempoRestanteMin && (
                                    <span>faltam {aluno.tempoRestanteMin} min</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Ações Rápidas: Carregar no Preview & Disparar Notificação com Barra */}
                          <div className="grid grid-cols-2 gap-2 pt-0.5">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleCarregarAlunoNoPreview(aluno)}
                              className="h-8 text-xs bg-zinc-900 border-white/10 hover:bg-zinc-800 text-zinc-300 rounded-xl flex items-center justify-center gap-1.5 transition-all"
                            >
                              <Eye className="w-3 h-3 text-sky-400" />
                              <span>Ver no Preview</span>
                            </Button>

                            <Button
                              type="button"
                              onClick={() => void handleDispararAluno(aluno)}
                              disabled={isFiring}
                              className="h-8 text-xs bg-gradient-to-r from-[#007aff] to-sky-600 hover:from-[#006ee6] hover:to-sky-500 text-white font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-[#007aff]/20 active:scale-98 transition-all"
                            >
                              <Send className={`w-3 h-3 ${isFiring ? 'animate-spin' : ''}`} />
                              <span>{isFiring ? 'Disparando...' : 'Disparar Notificação'}</span>
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ---------------------------------------------------------------------
                SUB-VIEW 2: TELEMETRIA COMPLETA EM TEMPO REAL
               --------------------------------------------------------------------- */}
            {subSecaoPublico === 'telemetria' && (
              <div className="space-y-4">
                {/* 4 Cards de Métricas Principais */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-3 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-1">
                    <div className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
                      <Send className="w-3 h-3 text-sky-400" />
                      <span>Disparadas</span>
                    </div>
                    <div className="text-xl font-bold text-white font-mono">
                      {metricas?.totalDisparadas ?? 0}
                    </div>
                    <div className="text-[10px] text-zinc-500">Agendadas no aparelho</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-1">
                    <div className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Abertas</span>
                    </div>
                    <div className="text-xl font-bold text-emerald-400 font-mono">
                      {metricas?.totalAbertas ?? 0}
                    </div>
                    <div className="text-[10px] text-zinc-500">Ações de clique no chip</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-1">
                    <div className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
                      <Activity className="w-3 h-3 text-purple-400" />
                      <span>Taxa CTR</span>
                    </div>
                    <div className="text-xl font-bold text-purple-400 font-mono">
                      {metricas?.taxaAberturaPct ?? 0}%
                    </div>
                    <div className="text-[10px] text-zinc-500">Conversão de retenção</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-1">
                    <div className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>Tempo Médio</span>
                    </div>
                    <div className="text-xl font-bold text-amber-400 font-mono">
                      {metricas?.tempoMedioAteAbrirMin ?? 0} min
                    </div>
                    <div className="text-[10px] text-zinc-500">Até o retorno do aluno</div>
                  </div>
                </div>

                {/* Breakdown de Retenção por Módulo */}
                <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Retenção por Módulo de Estudo</span>
                    <span className="text-[10px] text-zinc-400">CTR por Tipo</span>
                  </div>

                  <div className="space-y-2">
                    {[
                      { key: 'videoaulas' as const, label: 'Videoaulas', icon: PlayCircle, color: 'bg-sky-500' },
                      { key: 'audioaulas' as const, label: 'Áudioaulas', icon: Headphones, color: 'bg-emerald-500' },
                      { key: 'livros' as const, label: 'Leitura de Livros', icon: BookOpen, color: 'bg-amber-500' },
                      { key: 'streak' as const, label: 'Streak Diário (Fogo)', icon: Flame, color: 'bg-orange-500' },
                      { key: 'boletim' as const, label: 'Boletim de Notícias', icon: Newspaper, color: 'bg-sky-400' },
                    ].map((m) => {
                      const modData = metricas?.porModulo[m.key] || { disparadas: 0, abertas: 0, taxaPct: 0 };
                      const Icon = m.icon;
                      return (
                        <div key={m.key} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 text-zinc-300">
                              <Icon className="w-3.5 h-3.5 text-zinc-400" />
                              <span>{m.label}</span>
                            </div>
                            <div className="flex items-center gap-2 font-mono text-[11px]">
                              <span className="text-zinc-500">{modData.abertas}/{modData.disparadas}</span>
                              <span className="text-sky-400 font-bold w-10 text-right">{modData.taxaPct}%</span>
                            </div>
                          </div>
                          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${m.color} rounded-full transition-all`}
                              style={{ width: `${Math.max(modData.taxaPct, 3)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Feed de Histórico em Tempo Real */}
                <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs font-semibold text-white">Log de Telemetria em Tempo Real</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => void carregarMetricas()}
                        className="text-zinc-400 hover:text-white p-1"
                        title="Atualizar"
                      >
                        <RefreshCw className={`w-3 h-3 ${carregandoMetricas ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => void handleLimparTestes()}
                        className="text-zinc-400 hover:text-rose-400 p-1"
                        title="Limpar Histórico"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
                    {(!metricas?.historicoEventos || metricas.historicoEventos.length === 0) ? (
                      <div className="text-center py-6 text-zinc-500 text-xs">
                        Nenhum evento registrado ainda. Dispare um teste ou aguarde o aluno pausar uma aula.
                      </div>
                    ) : (
                      metricas.historicoEventos.map((ev) => {
                        const isAberto = ev.tipo === 'aberto';
                        return (
                          <div
                            key={ev.id}
                            className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Badge
                                  className={`text-[9px] px-1.5 py-0 font-semibold ${
                                    isAberto
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                      : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                                  }`}
                                >
                                  {isAberto ? 'ABERTO' : 'DISPARADO'}
                                </Badge>
                                <span className="text-zinc-400 text-[10px] font-mono">
                                  {ev.userEmail || 'aluno@direitoprime.com'}
                                </span>
                              </div>
                              <span className="text-[10px] text-zinc-500 font-mono">
                                {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-zinc-200">
                              <span className="font-medium truncate max-w-[200px] sm:max-w-xs">{ev.titulo}</span>
                              {ev.progresso > 0 && (
                                <span className="text-sky-400 font-mono text-[11px] font-bold shrink-0">
                                  {ev.progresso}%
                                </span>
                              )}
                            </div>

                            {ev.tempoAteAbrirMs && ev.tempoAteAbrirMs > 0 && (
                              <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                <span>Retornou em {Math.round(ev.tempoAteAbrirMs / 1000)}s após receber</span>
                              </div>
                            )}

                            {!isAberto && (
                              <div className="pt-1.5 flex items-center justify-between border-t border-white/5 mt-1">
                                <span className="text-[10px] text-zinc-500 italic">Aguardando clique</span>
                                <button
                                  type="button"
                                  onClick={() => void handleSimularAberturaDoEvento(ev)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-[9.5px] font-semibold text-emerald-300 hover:bg-emerald-500/25 active:scale-95 transition-all"
                                  title="Simular que o usuário tocou na notificação para testar a telemetria de abertura"
                                >
                                  <Eye className="w-2.5 h-2.5 text-emerald-400" />
                                  Simular Abertura
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------------------------
                SUB-VIEW 3: SEGMENTAÇÃO DE PÚBLICO
               --------------------------------------------------------------------- */}
            {subSecaoPublico === 'segmentos' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <span className="text-[11px] text-zinc-400">Público-alvo para esta regra:</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'todos' as const, label: 'Todos os Alunos' },
                      { id: 'gratuitos' as const, label: 'Apenas Gratuitos' },
                      { id: 'assinantes' as const, label: 'Apenas Assinantes' },
                      { id: 'inativos_24h' as const, label: 'Inativos (+48h)' },
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
                          className={`p-2.5 rounded-xl text-xs text-left font-medium transition-all border ${
                            ativo
                              ? 'bg-white text-zinc-950 font-semibold border-white shadow-sm'
                              : 'bg-zinc-900/80 text-zinc-400 border-white/5 hover:text-white'
                          }`}
                        >
                          {pub.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* RODAPÉ MINIMALISTA */}
        <div className="pt-2 flex justify-between items-center text-[11px] text-zinc-600">
          <span>Estudos Jurídicos · Notificações Locais</span>
          <button onClick={handleRestaurarPadroes} className="hover:text-zinc-400 flex items-center gap-1">
            <RotateCcw className="w-3 h-3" />
            <span>Restaurar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
