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

      <div className="max-w-md mx-auto px-4 pt-2 space-y-4">
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
            ABA 3: PÚBLICO & MÉTRICAS
           ========================================================================= */}
        {tabAtiva === 'publicos' && (
          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <span className="text-[11px] text-zinc-400">Público-alvo:</span>
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
                      className={`p-2 rounded-xl text-xs text-left font-medium transition-all border ${
                        ativo
                          ? 'bg-white text-zinc-950 font-semibold border-white'
                          : 'bg-zinc-900/80 text-zinc-400 border-white/5 hover:text-white'
                      }`}
                    >
                      {pub.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Resumo de Métricas em linha única limpa */}
            <div className="pt-2 border-t border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-300">Aberturas no Aparelho</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => void carregarMetricas()}
                    className="text-zinc-500 hover:text-zinc-300 p-1"
                    title="Atualizar"
                  >
                    <RefreshCw className={`w-3 h-3 ${carregandoMetricas ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => void handleLimparTestes()}
                    className="text-zinc-500 hover:text-rose-400 p-1"
                    title="Limpar métricas"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="p-2 rounded-xl bg-zinc-900/60 border border-white/5">
                  <div className="text-[10px] text-zinc-500">Disparadas</div>
                  <div className="text-sm font-bold text-white font-mono">{metricas?.totalDisparadas ?? 0}</div>
                </div>

                <div className="p-2 rounded-xl bg-zinc-900/60 border border-white/5">
                  <div className="text-[10px] text-zinc-500">Abertas</div>
                  <div className="text-sm font-bold text-emerald-400 font-mono">{metricas?.totalAbertas ?? 0}</div>
                </div>

                <div className="p-2 rounded-xl bg-zinc-900/60 border border-white/5">
                  <div className="text-[10px] text-zinc-500">Taxa (CTR)</div>
                  <div className="text-sm font-bold text-sky-400 font-mono">{metricas?.taxaAberturaPct ?? 0}%</div>
                </div>
              </div>
            </div>
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
