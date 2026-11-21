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
  ShieldCheck,
  RefreshCw,
  Trash2,
  Users,
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

  // Telemetria
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
    toast.success('Padrões restaurados!');
  };

  const handleDispararTeste = async (delaySegundos: number = 0) => {
    haptic.impact('heavy');
    setTestando(true);

    if (delaySegundos > 0) {
      setContagemRegressiva(delaySegundos);
      toast.info(`Disparo em ${delaySegundos}s (bloqueie a tela para testar)`);
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
    toast.success('Abertura registrada no aparelho!');
    void carregarMetricas();
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
        return <Clock className="w-4 h-4 text-rose-400" />;
    }
  };

  return (
    <div className="min-h-dvh bg-[#0B0B0D] text-foreground pb-12">
      <PageHeader
        title="Notificações Locais"
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

      <div className="max-w-xl mx-auto px-4 pt-3 space-y-4">
        {/* =========================================================================
            ABAS SUPERIORES MINIMALISTAS (Flat, sem cortes, sem excessos)
           ========================================================================= */}
        <div className="flex border-b border-white/10 text-xs font-medium">
          {[
            { id: 'aparencia' as const, label: 'Aparência' },
            { id: 'gatilhos' as const, label: 'Gatilhos' },
            { id: 'publicos' as const, label: 'Públicos & Métricas' },
          ].map((tab) => {
            const ativo = tabAtiva === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  haptic.selection();
                  setTabAtiva(tab.id);
                }}
                className={`flex-1 py-2.5 text-center transition-colors relative ${
                  ativo ? 'text-white font-semibold' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span>{tab.label}</span>
                {ativo && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 shadow-[0_0_8px_#38bdf8]" />
                )}
              </button>
            );
          })}
        </div>

        {/* SELETOR COMPACTO DE FUNÇÃO (Pílulas sutis) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1">
          {regras.map((r) => {
            const selecionada = r.id === regraAtivaId;
            return (
              <button
                key={r.id}
                onClick={() => {
                  haptic.selection();
                  setRegraAtivaId(r.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all ${
                  selecionada
                    ? 'bg-white text-black shadow-sm font-semibold'
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
            1. ABA: APARÊNCIA (PREVIEW FLUTUANTE 1:1 + CONTROLES DISCRETOS)
           ========================================================================= */}
        {tabAtiva === 'aparencia' && (
          <div className="space-y-4 pt-1">
            {/* O CARD DE NOTIFICAÇÃO ESTILO ANDROID 1:1 DIRETO NO FUNDO (Sem caixa na caixa) */}
            <div className="relative mx-auto w-full bg-[#1c1c1e] text-white rounded-2xl p-4 border border-white/10 shadow-2xl space-y-3 font-sans select-none">
              {/* Header: Ícone Redondo, Nome do App e Capa */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-5 h-5 rounded-full bg-[#f95738] flex items-center justify-center shrink-0">
                    <Flame className="w-3 h-3 text-white fill-white" />
                  </div>
                  <span className="text-[13px] font-semibold text-white tracking-tight">Estudos Jurídicos</span>
                  <span className="text-zinc-500 text-xs font-light">·</span>
                  <span className="text-zinc-400 text-xs">
                    {regraSelecionada.modulo === 'audioaulas'
                      ? 'Áudio'
                      : regraSelecionada.modulo === 'livros'
                      ? 'Leitura'
                      : 'Estudo'}
                  </span>
                </div>

                {regraSelecionada.exemploCapaUrl && (
                  <div className="w-8 h-8 rounded-md overflow-hidden shrink-0 border border-white/10">
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
                <h4 className="text-[13px] font-bold text-white leading-tight line-clamp-1">
                  {regraSelecionada.exemploTitulo}
                </h4>
                <p className="text-[12px] text-zinc-300 font-normal line-clamp-1">
                  {regraSelecionada.exemploSubtitulo}
                </p>
              </div>

              {/* Barra de Progresso Azul Vibrante (Idêntica ao Print do Usuário) */}
              {regraSelecionada.mostrarBarraProgresso && (
                <div className="pt-0.5">
                  <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#007aff] rounded-full transition-all duration-300 shadow-[0_0_8px_#007aff]"
                      style={{ width: `${progressoSimulado}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Botão de Ação ("Continuar assistindo") */}
              <div className="pt-1.5 flex items-center justify-between border-t border-white/5 text-[13px]">
                <button
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    void handleSimularAberturaLocal();
                  }}
                  className="font-semibold text-white hover:text-sky-400 active:opacity-75 transition-colors"
                >
                  {regraSelecionada.textoBotaoAcao}
                </button>
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
              </div>
            </div>

            {/* Slider de Progresso Compacto */}
            {regraSelecionada.mostrarBarraProgresso && (
              <div className="flex items-center gap-3 px-1 text-xs text-zinc-400">
                <span className="shrink-0 text-zinc-500">Progresso</span>
                <input
                  type="range"
                  min="5"
                  max="95"
                  value={progressoSimulado}
                  onChange={(e) => setProgressoSimulado(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
                <span className="font-mono text-sky-400 shrink-0 w-8 text-right">{progressoSimulado}%</span>
              </div>
            )}

            {/* Botões de Ação de Teste Compactos (Lado a Lado) */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                onClick={() => handleDispararTeste(0)}
                disabled={testando || contagemRegressiva !== null}
                className="bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs h-10 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Testar Agora</span>
              </Button>

              <Button
                onClick={() => handleDispararTeste(5)}
                disabled={testando || contagemRegressiva !== null}
                variant="outline"
                className="border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium text-xs h-10 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{contagemRegressiva !== null ? `${contagemRegressiva}s...` : 'Em 5 segundos'}</span>
              </Button>
            </div>

            {/* Edição Rápida de Textos */}
            <div className="pt-3 border-t border-white/5 space-y-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-400">Título</label>
                <Input
                  value={regraSelecionada.exemploTitulo}
                  onChange={(e) => handleAtualizarRegra(regraSelecionada.id, { exemploTitulo: e.target.value })}
                  className="bg-zinc-900/90 border-white/10 text-xs text-white h-9 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-400">Subtítulo</label>
                <Input
                  value={regraSelecionada.exemploSubtitulo}
                  onChange={(e) => handleAtualizarRegra(regraSelecionada.id, { exemploSubtitulo: e.target.value })}
                  className="bg-zinc-900/90 border-white/10 text-xs text-white h-9 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-400">Botão de Ação</label>
                  <Input
                    value={regraSelecionada.textoBotaoAcao}
                    onChange={(e) => handleAtualizarRegra(regraSelecionada.id, { textoBotaoAcao: e.target.value })}
                    className="bg-zinc-900/90 border-white/10 text-xs text-white h-9 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-400">Rota</label>
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
          </div>
        )}

        {/* =========================================================================
            2. ABA: GATILHOS (QUANDO DISPARAR)
           ========================================================================= */}
        {tabAtiva === 'gatilhos' && (
          <div className="space-y-4 pt-1">
            {/* Ativar/Desativar Módulo */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-white/5">
              <div className="flex items-center gap-2">
                {getModuloIcon(regraSelecionada.modulo)}
                <span className="text-xs font-semibold text-white">{regraSelecionada.nome}</span>
              </div>
              <Switch
                checked={regraSelecionada.ativo}
                onCheckedChange={(checked) => {
                  haptic.selection();
                  handleAtualizarRegra(regraSelecionada.id, { ativo: checked });
                }}
              />
            </div>

            {/* Tempo de Inatividade */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Tempo após pausar:</label>
              {regraSelecionada.horarioFixoDisparo ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/60 border border-white/5">
                  <input
                    type="time"
                    value={regraSelecionada.horarioFixoDisparo}
                    onChange={(e) => {
                      handleAtualizarRegra(regraSelecionada.id, { horarioFixoDisparo: e.target.value });
                    }}
                    className="bg-zinc-800 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                  />
                  <span className="text-xs text-zinc-400">Horário fixo todos os dias</span>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { horas: 0.5, label: '30 min' },
                    { horas: 1, label: '1 hora' },
                    { horas: 2, label: '2 horas (Padrão)' },
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
                        className={`py-2 rounded-xl text-xs font-medium transition-all ${
                          ativo
                            ? 'bg-white text-black font-semibold'
                            : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-white/5'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Filtros Inteligentes */}
            <div className="space-y-2.5 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Progresso mínimo para disparar</span>
                <span className="text-white font-mono">{regraSelecionada.progressoMinimoPct ?? 10}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                value={regraSelecionada.progressoMinimoPct ?? 10}
                onChange={(e) => {
                  handleAtualizarRegra(regraSelecionada.id, { progressoMinimoPct: Number(e.target.value) });
                }}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />

              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-white/5 mt-3">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-white">Quiet Hours (Silêncio 23h às 07h)</span>
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
          </div>
        )}

        {/* =========================================================================
            3. ABA: PÚBLICOS & MÉTRICAS (TELEMETRIA LIMPA)
           ========================================================================= */}
        {tabAtiva === 'publicos_telemetria' && (
          <div className="space-y-4 pt-1">
            {/* Segmentação de Público */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Para qual público enviar:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'todos' as const, label: 'Todos os Alunos' },
                  { id: 'gratuitos' as const, label: 'Apenas Gratuitos' },
                  { id: 'assinantes' as const, label: 'Apenas Assinantes Pro' },
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
                          ? 'bg-white text-black font-semibold border-white'
                          : 'bg-zinc-900/80 text-zinc-400 border-white/5 hover:text-white'
                      }`}
                    >
                      {pub.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Métricas Reais de Abertura */}
            <div className="pt-2 border-t border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Aberturas no Aparelho</span>
                <button
                  onClick={() => void carregarMetricas()}
                  className="text-xs text-zinc-500 hover:text-zinc-300 p-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${carregandoMetricas ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 text-center space-y-0.5">
                  <div className="text-[11px] text-zinc-500">Disparadas</div>
                  <div className="text-base font-bold text-white font-mono">{metricas?.totalDisparadas ?? 0}</div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 text-center space-y-0.5">
                  <div className="text-[11px] text-zinc-500">Abertas</div>
                  <div className="text-base font-bold text-emerald-400 font-mono">{metricas?.totalAbertas ?? 0}</div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 text-center space-y-0.5">
                  <div className="text-[11px] text-zinc-500">Taxa (CTR)</div>
                  <div className="text-base font-bold text-sky-400 font-mono">{metricas?.taxaAberturaPct ?? 0}%</div>
                </div>
              </div>

              {/* Feed Compacto */}
              {metricas?.ultimasAberturas && metricas.ultimasAberturas.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-zinc-500">
                    <span>Últimos cliques registrados:</span>
                    <button onClick={handleLimparTestes} className="hover:text-red-400">
                      Limpar
                    </button>
                  </div>
                  <div className="space-y-1 max-h-[140px] overflow-y-auto">
                    {metricas.ultimasAberturas.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-2 rounded-lg bg-zinc-900/40 border border-white/5 flex items-center justify-between text-xs"
                      >
                        <span className="text-zinc-300 truncate pr-2">{ev.titulo}</span>
                        <Badge className="bg-emerald-500/10 text-emerald-300 text-[10px] shrink-0">
                          {ev.acaoId === 'continuar' ? 'Continuou' : 'Abriu'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rodapé Sutil */}
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
