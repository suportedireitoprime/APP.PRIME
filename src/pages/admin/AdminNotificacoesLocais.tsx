import { lazy, Suspense, useState, useMemo, useEffect, useCallback } from 'react';
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
  Newspaper,
  Users,
  Sparkles,
  ExternalLink,
  Zap,
  Eye,
} from 'lucide-react';
import { NotificacoesAparenciaTab } from '@/components/admin/notificacoes-locais/NotificacoesAparenciaTab';

const NotificacoesGatilhosTab = lazy(
  () => import('@/components/admin/notificacoes-locais/NotificacoesGatilhosTab'),
);
const NotificacoesPublicosTab = lazy(
  () => import('@/components/admin/notificacoes-locais/NotificacoesPublicosTab'),
);
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
          <NotificacoesAparenciaTab
            regraSelecionada={regraSelecionada}
            onAtualizarRegra={handleAtualizarRegra}
          />
        )}

        {tabAtiva === 'gatilhos' && (
          <Suspense fallback={null}>
            <NotificacoesGatilhosTab
              regraSelecionada={regraSelecionada}
              onAtualizarRegra={handleAtualizarRegra}
            />
          </Suspense>
        )}

        {tabAtiva === 'publicos' && (
          <Suspense fallback={null}>
            <NotificacoesPublicosTab
              subSecaoPublico={subSecaoPublico}
              setSubSecaoPublico={setSubSecaoPublico}
              alunosAtivos={alunosAtivos}
              alunosFiltrados={alunosFiltrados}
              buscaAluno={buscaAluno}
              setBuscaAluno={setBuscaAluno}
              filtroModuloAluno={filtroModuloAluno}
              setFiltroModuloAluno={setFiltroModuloAluno}
              carregandoAlunos={carregandoAlunos}
              carregarAlunos={carregarAlunos}
              metricas={metricas}
              carregandoMetricas={carregandoMetricas}
              carregarMetricas={carregarMetricas}
              modoDisparoMassa={modoDisparoMassa}
              setModoDisparoMassa={setModoDisparoMassa}
              disparandoEmMassa={disparandoEmMassa}
              progressoMassa={progressoMassa}
              handleDispararMassa={handleDispararMassa}
              disparandoAlunoId={disparandoAlunoId}
              handleCarregarAlunoNoPreview={handleCarregarAlunoNoPreview}
              handleDispararAluno={handleDispararAluno}
              handleLimparTestes={handleLimparTestes}
              handleSimularAberturaDoEvento={handleSimularAberturaDoEvento}
              regraSelecionada={regraSelecionada}
              onAtualizarRegra={handleAtualizarRegra}
              getModuloIcon={getModuloIcon}
            />
          </Suspense>
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
