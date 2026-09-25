import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scale, BookOpen, Shield, ScrollText, HeartHandshake,
  Search, RefreshCw, ChevronRight, CheckCircle2,
  Clock, Loader2, Play, Pause, ArrowLeft, Volume2,
  Cpu, Sliders, Check, Sparkles, Filter, AlertCircle,
  FileText, Zap, Music, ListFilter, VolumeX
} from 'lucide-react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { LEIS_CATALOG, type LeiCatalogItem } from '@/data/leisCatalog';
import { fetchArtigosLei } from '@/services/legislacaoService';
import type { ArtigoLei } from '@/data/mockData';
import { parseArtigoEmPartes, type ArtigoParte, type ArtigoEstruturado } from '@/utils/artigoPartesParser';
import {
  VOZES_DISPONIVEIS,
  ESTILOS_TOM,
  AMOSTRAS_TESTE,
  buscarStatusNarracoes,
  testarVozAudio,
  gerarNarracaoArtigoFatiada,
  obterConfigAutomacao,
  salvarConfigAutomacao,
  dispararDeployCron,
  dispararAutomacaoLoteManual,
  buscarLogsAutomacao,
  type NarracaoArtigoRegistro,
  type ConfigAutomacao,
  type LogAutomacao,
} from '@/services/narracaoLeisService';
import { toast } from 'sonner';

interface CategoriaDef {
  id: string;
  nome: string;
  desc: string;
  icon: any;
  color: string;
  isSpecialTool?: boolean;
}

const CATEGORIAS_DEF: CategoriaDef[] = [
  { id: 'codigo', nome: 'Códigos', desc: 'CP, CC, CPC, CPP, CLT, CTN, CDC, CTB e outros', icon: Scale, color: '#f59e0b' },
  { id: 'estatuto', nome: 'Estatutos', desc: 'ECA, Idoso, PCD, OAB, Igualdade Racial, Desarmamento', icon: BookOpen, color: '#ec4899' },
  { id: 'constituicao', nome: 'Constituição Federal', desc: 'Carta Magna de 1988 e emendas', icon: Shield, color: '#10b981' },
  { id: 'lei-especial', nome: 'Leis Especiais', desc: 'Maria da Penha, Drogas, Licitações, LGPD, Falências', icon: ScrollText, color: '#8b5cf6' },
  { id: 'previdenciario', nome: 'Previdenciário', desc: 'Benefícios, Custeio, Previdência Complementar e LOAS', icon: HeartHandshake, color: '#06b6d4' },
  // Funções especiais solicitadas explicitamente pelo usuário abaixo de Previdenciário:
  { id: 'teste-audio', nome: 'Teste de Áudio', desc: 'Testar vozes Gemini TTS, tonalidades, velocidade e amostras reais', icon: Volume2, color: '#e11d48', isSpecialTool: true },
  { id: 'automacao', nome: 'Automação', desc: 'Cron job de 10 em 10 minutos, prioridade de artigos maiores e fila', icon: Cpu, color: '#6366f1', isSpecialTool: true },
];

export default function AdminNarracaoLeis() {
  const navigate = useNavigate();

  // Navegação
  const [selectedCat, setSelectedCat] = useState<CategoriaDef | null>(null);
  const [selectedLei, setSelectedLei] = useState<LeiCatalogItem | null>(null);
  const [busca, setBusca] = useState('');

  // Artigos da lei selecionada
  const [artigos, setArtigos] = useState<ArtigoLei[]>([]);
  const [carregandoArtigos, setCarregandoArtigos] = useState(false);
  const [statusNarracoes, setStatusNarracoes] = useState<Record<string, NarracaoArtigoRegistro>>({});
  const [artigoExpandido, setArtigoExpandido] = useState<string | null>(null);
  const [filtroArtigos, setFiltroArtigos] = useState<'todos' | 'narrados' | 'pendentes' | 'maiores'>('todos');

  // Geração de narração fatiada individual
  const [gerandoArtigoNum, setGerandoArtigoNum] = useState<string | null>(null);
  const [progressoGeracao, setProgressoGeracao] = useState<{ parteAtual: number; totalPartes: number; rotulo: string } | null>(null);

  // Player de Áudio Fatiado (com destaque do bloco ativo)
  const [tocandoUrl, setTocandoUrl] = useState<string | null>(null);
  const [blocoAtivoId, setBlocoAtivoId] = useState<string | null>(null);
  const [reproduzindoSequencial, setReproduzindoSequencial] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Estados do "Teste de Áudio"
  const [vozTeste, setVozTeste] = useState('Kore');
  const [estiloTeste, setEstiloTeste] = useState(ESTILOS_TOM[0].prompt);
  const [textoTeste, setTextoTeste] = useState(AMOSTRAS_TESTE[0].texto);
  const [gerandoPrevia, setGerandoPrevia] = useState(false);
  const [audioPreviaUrl, setAudioPreviaUrl] = useState<string | null>(null);

  // Estados da "Automação"
  const [configAuto, setConfigAuto] = useState<ConfigAutomacao | null>(null);
  const [logsAuto, setLogsAuto] = useState<LogAutomacao[]>([]);
  const [salvandoAuto, setSalvandoAuto] = useState(false);
  const [disparandoManual, setDisparandoManual] = useState(false);

  // Carrega configuração de automação ao montar
  useEffect(() => {
    obterConfigAutomacao().then(setConfigAuto).catch(() => {});
    buscarLogsAutomacao().then(setLogsAuto).catch(() => {});
  }, []);

  // Carrega artigos quando uma lei é selecionada
  useEffect(() => {
    if (!selectedLei) return;
    setCarregandoArtigos(true);
    setArtigos([]);
    setStatusNarracoes({});
    setArtigoExpandido(null);

    Promise.all([
      fetchArtigosLei(selectedLei.id, selectedLei.tabela_nome),
      buscarStatusNarracoes(selectedLei.tabela_nome),
    ]).then(([listaArtigos, statusMap]) => {
      setArtigos(listaArtigos || []);
      setStatusNarracoes(statusMap || {});
    }).catch((err) => {
      toast.error('Erro ao carregar dados da legislação');
      console.error(err);
    }).finally(() => {
      setCarregandoArtigos(false);
    });
  }, [selectedLei]);

  // Contadores da lei selecionada
  const estatisticasLei = useMemo(() => {
    const total = artigos.length;
    let narrados = 0;
    artigos.forEach((art) => {
      const num = String(art.numero).replace(/^[Aa]rt\.?\s*/, '').trim();
      if (statusNarracoes[num] || statusNarracoes[art.numero]) narrados++;
    });
    const percentual = total > 0 ? ((narrados / total) * 100).toFixed(1) : '0.0';
    return { total, narrados, pendentes: total - narrados, percentual };
  }, [artigos, statusNarracoes]);

  // Filtragem e ordenação dos artigos
  const artigosFiltrados = useMemo(() => {
    let list = [...artigos];

    if (filtroArtigos === 'narrados') {
      list = list.filter((art) => {
        const num = String(art.numero).replace(/^[Aa]rt\.?\s*/, '').trim();
        return !!statusNarracoes[num] || !!statusNarracoes[art.numero];
      });
    } else if (filtroArtigos === 'pendentes') {
      list = list.filter((art) => {
        const num = String(art.numero).replace(/^[Aa]rt\.?\s*/, '').trim();
        return !statusNarracoes[num] && !statusNarracoes[art.numero];
      });
    } else if (filtroArtigos === 'maiores') {
      // Ordena pelos maiores primeiro (por comprimento de texto)
      list.sort((a, b) => (b.caput || '').length - (a.caput || '').length);
    }

    if (busca.trim()) {
      const q = busca.toLowerCase();
      list = list.filter((art) =>
        art.numero.toLowerCase().includes(q) ||
        (art.caput && art.caput.toLowerCase().includes(q)) ||
        (art.titulo && art.titulo.toLowerCase().includes(q))
      );
    }

    return list;
  }, [artigos, statusNarracoes, filtroArtigos, busca]);

  // Handler de reprodução de áudio de uma parte
  const tocarParteAudio = (url: string, parteId: string) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const a = audioRef.current;

    if (tocandoUrl === url) {
      a.pause();
      setTocandoUrl(null);
      setBlocoAtivoId(null);
      return;
    }

    a.pause();
    a.src = url;
    setTocandoUrl(url);
    setBlocoAtivoId(parteId);

    a.play().catch((err) => {
      console.warn('Erro ao tocar áudio:', err);
      toast.error('Não foi possível reproduzir este áudio');
      setTocandoUrl(null);
      setBlocoAtivoId(null);
    });

    a.onended = () => {
      setTocandoUrl(null);
      setBlocoAtivoId(null);
    };
  };

  // Handler de reprodução sequencial do artigo fatiado
  const tocarArtigoSequencial = (partes: ArtigoParte[], artigoNum: string) => {
    if (!partes || partes.length === 0) return;
    const partesComAudio = partes.filter((p) => !!p.audioUrl);

    if (partesComAudio.length === 0) {
      toast.error('Este artigo ainda não possui áudios gerados nas partes.');
      return;
    }

    if (reproduzindoSequencial === artigoNum) {
      // Pausa
      if (audioRef.current) audioRef.current.pause();
      setReproduzindoSequencial(null);
      setTocandoUrl(null);
      setBlocoAtivoId(null);
      return;
    }

    setReproduzindoSequencial(artigoNum);
    let idx = 0;

    const playNext = () => {
      if (idx >= partesComAudio.length) {
        setReproduzindoSequencial(null);
        setTocandoUrl(null);
        setBlocoAtivoId(null);
        return;
      }

      const parte = partesComAudio[idx];
      tocarParteAudio(parte.audioUrl!, parte.id);

      if (audioRef.current) {
        audioRef.current.onended = () => {
          idx++;
          playNext();
        };
      }
    };

    playNext();
  };

  // Gera narração fatiada para um artigo
  const handleGerarNarraçãoIndividual = async (artigo: ArtigoLei) => {
    if (!selectedLei || gerandoArtigoNum) return;
    setGerandoArtigoNum(artigo.numero);
    setProgressoGeracao({ parteAtual: 1, totalPartes: 1, rotulo: 'Iniciando...' });

    const toastId = toast.loading(`Fatiando e narrando Artigo ${artigo.numero}...`);

    try {
      const voz = configAuto?.voz_padrao || 'Kore';
      const estilo = configAuto?.estilo_tom || 'Animado e envolvente, como professora jovem de Direito';

      const res = await gerarNarracaoArtigoFatiada(
        artigo,
        selectedLei.tabela_nome,
        selectedLei.nome,
        voz,
        estilo,
        (parteAtual, totalPartes, rotulo) => {
          setProgressoGeracao({ parteAtual, totalPartes, rotulo });
        }
      );

      const numLimpo = String(artigo.numero).replace(/^[Aa]rt\.?\s*/, '').trim();
      setStatusNarracoes((prev) => ({
        ...prev,
        [numLimpo]: {
          artigo_numero: numLimpo,
          audio_url: res.audioUrl,
          partes: res.partes,
        },
      }));

      toast.success(`Artigo ${artigo.numero} narrado com sucesso em ${res.partes.length} partes!`, { id: toastId });
    } catch (err: any) {
      console.error('Erro na narração individual:', err);
      toast.error(`Falha ao narrar: ${err.message || 'Erro desconhecido'}`, { id: toastId });
    } finally {
      setGerandoArtigoNum(null);
      setProgressoGeracao(null);
    }
  };

  // Teste de Voz instantâneo
  const handleTestarVoz = async () => {
    if (!textoTeste.trim()) {
      toast.error('Insira um texto de amostra');
      return;
    }

    setGerandoPrevia(true);
    setAudioPreviaUrl(null);
    const toastId = toast.loading(`Gerando áudio com a voz ${vozTeste}...`);

    try {
      const url = await testarVozAudio(textoTeste, vozTeste, estiloTeste);
      setAudioPreviaUrl(url);

      if (!audioRef.current) audioRef.current = new Audio();
      audioRef.current.src = url;
      audioRef.current.play().catch(() => {});

      toast.success(`Prévia gerada com sucesso!`, { id: toastId });
    } catch (err: any) {
      toast.error(`Erro: ${err.message || 'Falha ao gerar voz'}`, { id: toastId });
    } finally {
      setGerandoPrevia(false);
    }
  };

  // Salvar Voz como padrão da automação
  const handleDefinirComoPadrao = async () => {
    if (!configAuto) return;
    setSalvandoAuto(true);
    try {
      await salvarConfigAutomacao({ voz_padrao: vozTeste, estilo_tom: estiloTeste });
      setConfigAuto((prev) => prev ? { ...prev, voz_padrao: vozTeste, estilo_tom: estiloTeste } : prev);
      toast.success(`Voz ${vozTeste} definida como padrão da automação!`);
    } catch (e) {
      toast.error('Erro ao salvar preferências');
    } finally {
      setSalvandoAuto(false);
    }
  };

  // Alternar Cron Job da Automação
  const handleToggleCron = async () => {
    if (!configAuto) return;
    const novoStatus = !configAuto.ativa;
    setSalvandoAuto(true);
    const toastId = toast.loading(novoStatus ? 'Agendando Cron no Supabase (a cada 10 min)...' : 'Pausando Cron no Supabase...');

    try {
      await dispararDeployCron(configAuto.intervalo_minutos || 10, novoStatus);
      setConfigAuto((prev) => prev ? { ...prev, ativa: novoStatus } : prev);
      toast.success(novoStatus ? 'Automação ativada! Disparando a cada 10 minutos.' : 'Automação pausada.', { id: toastId });
    } catch (err: any) {
      toast.error(`Erro: ${err.message || 'Falha ao configurar cron'}`, { id: toastId });
    } finally {
      setSalvandoAuto(false);
    }
  };

  // Disparo manual de lote na automação
  const handleDispararLoteAgora = async () => {
    setDisparandoManual(true);
    const toastId = toast.loading('Processando próximo artigo de maior tamanho da fila...');

    try {
      const res = await dispararAutomacaoLoteManual({
        tabelaNome: configAuto?.tabela_nome || 'CP_CODIGO_PENAL',
        prioridade: configAuto?.prioridade || 'artigos_maiores',
        voz: configAuto?.voz_padrao || 'Kore',
      });

      if (res?.artigo) {
        toast.success(`Artigo ${res.artigo} narrado e fatiado em ${res.partes_geradas} partes!`, { id: toastId });
      } else {
        toast.info(res?.message || 'Ciclo de automação concluído.', { id: toastId });
      }

      // Recarrega config e logs
      obterConfigAutomacao().then(setConfigAuto).catch(() => {});
      buscarLogsAutomacao().then(setLogsAuto).catch(() => {});
    } catch (err: any) {
      toast.error(`Erro: ${err.message || 'Falha no ciclo manual'}`, { id: toastId });
    } finally {
      setDisparandoManual(false);
    }
  };

  // ==========================================================================
  // RENDER: NÍVEL 3 (LISTAGEM DE ARTIGOS DA LEI SELECIONADA)
  // ==========================================================================
  if (selectedLei) {
    return (
      <div className="min-h-dvh bg-background pb-12">
        <PageHeader
          title={selectedLei.sigla}
          subtitle={selectedLei.nome}
          onBack={() => setSelectedLei(null)}
          rightAction={
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{estatisticasLei.narrados}/{estatisticasLei.total} ({estatisticasLei.percentual}%)</span>
            </div>
          }
        />

        <div className="p-4 max-w-4xl mx-auto space-y-4">
          {/* Card Resumo de Narração */}
          <div className="p-4 rounded-2xl border border-border/70 bg-gradient-to-br from-card/80 via-card/50 to-secondary/30 backdrop-blur-md shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold tracking-wider uppercase text-primary">Estúdio de Narração Fatiada</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Blocos Modulares
                  </span>
                </div>
                <h2 className="text-lg font-bold text-foreground mt-0.5">{selectedLei.nome}</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Narrações segmentadas por <strong>Caput, Penas, Parágrafos e Incisos</strong> com grifo visual simultâneo.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleDispararLoteAgora()}
                  disabled={disparandoManual}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 active:scale-95 transition-all shadow-md disabled:opacity-50"
                >
                  {disparandoManual ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  <span>Narrar Maior Pendente</span>
                </button>
              </div>
            </div>

            {/* Barra de Progresso Geral */}
            <div className="mt-4 pt-3 border-t border-border/50">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5 font-mono">
                <span>Progresso de Cobertura de Voz</span>
                <span className="text-foreground font-bold">{estatisticasLei.percentual}% concluído</span>
              </div>
              <div className="w-full h-2 rounded-full bg-secondary/80 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                  style={{ width: `${estatisticasLei.percentual}%` }}
                />
              </div>
            </div>
          </div>

          {/* Filtros e Busca */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por artigo, crime ou texto..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary/40 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {(['todos', 'narrados', 'pendentes', 'maiores'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltroArtigos(f)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                    filtroArtigos === f
                      ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                      : 'bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  {f === 'todos' && `Todos (${artigos.length})`}
                  {f === 'narrados' && `Narrados (${estatisticasLei.narrados})`}
                  {f === 'pendentes' && `Pendentes (${estatisticasLei.pendentes})`}
                  {f === 'maiores' && `Artigos Maiores`}
                </button>
              ))}
            </div>
          </div>

          {/* Listagem de Artigos */}
          {carregandoArtigos ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Carregando catálogo e status de áudios...</p>
            </div>
          ) : artigosFiltrados.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-border/60 bg-secondary/10">
              <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-semibold text-foreground">Nenhum artigo encontrado</p>
              <p className="text-xs text-muted-foreground mt-1">Tente ajustar a busca ou os filtros de status.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {artigosFiltrados.map((artigo) => {
                const numLimpo = String(artigo.numero).replace(/^[Aa]rt\.?\s*/, '').trim();
                const reg = statusNarracoes[numLimpo] || statusNarracoes[artigo.numero];
                const estaNarrado = !!reg?.audio_url;
                const estruturado = parseArtigoEmPartes(artigo);
                const isExpandido = artigoExpandido === artigo.numero;
                const estaGerando = gerandoArtigoNum === artigo.numero;
                const partesAtuais = reg?.partes || estruturado.partes;
                const estaTocandoSequencial = reproduzindoSequencial === artigo.numero;

                return (
                  <div
                    key={artigo.id || artigo.numero}
                    className={`rounded-2xl border transition-all ${
                      isExpandido
                        ? 'border-primary/40 bg-card/90 shadow-md ring-1 ring-primary/20'
                        : 'border-border/60 bg-secondary/20 hover:bg-secondary/35'
                    }`}
                  >
                    {/* Linha Resumo do Artigo */}
                    <div className="p-4 flex items-start sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-bold text-sm text-foreground">
                            Artigo {artigo.numero}
                          </span>
                          {estaNarrado ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Narrado ({partesAtuais.length} blocos)
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Clock className="w-3 h-3" /> Pendente
                            </span>
                          )}
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {estruturado.totalCaracteres} chars · {estruturado.totalPartes} partes
                          </span>
                        </div>

                        {artigo.titulo && (
                          <p className="text-xs font-semibold text-primary/90 truncate mb-1">
                            {artigo.titulo}
                          </p>
                        )}

                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {artigo.caput}
                        </p>
                      </div>

                      {/* Botões de Ação do Artigo */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {estaNarrado ? (
                          <button
                            onClick={() => tocarArtigoSequencial(partesAtuais, artigo.numero)}
                            className={`p-2.5 rounded-xl border transition-all ${
                              estaTocandoSequencial
                                ? 'bg-primary text-primary-foreground border-primary animate-pulse'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            }`}
                            title="Ouvir Artigo Completo"
                          >
                            {estaTocandoSequencial ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleGerarNarraçãoIndividual(artigo)}
                            disabled={estaGerando}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-semibold hover:bg-primary/20 active:scale-95 transition-all disabled:opacity-50"
                          >
                            {estaGerando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                            <span className="hidden sm:inline">Gerar Fatiado</span>
                          </button>
                        )}

                        <button
                          onClick={() => setArtigoExpandido(isExpandido ? null : artigo.numero)}
                          className="p-2.5 rounded-xl hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isExpandido ? 'rotate-90' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Barra de Progresso Durante a Geração */}
                    {estaGerando && progressoGeracao && (
                      <div className="px-4 pb-3">
                        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs">
                          <div className="flex items-center justify-between mb-1.5 text-primary font-semibold">
                            <span>Gerando áudio da parte: {progressoGeracao.rotulo}</span>
                            <span>{progressoGeracao.parteAtual} de {progressoGeracao.totalPartes}</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${(progressoGeracao.parteAtual / progressoGeracao.totalPartes) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bloco Expandido: Lista das Partes Fatiadas */}
                    {isExpandido && (
                      <div className="p-4 pt-0 border-t border-border/40 mt-1 space-y-2.5">
                        <div className="flex items-center justify-between pt-3">
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Subdivisões do Artigo ({partesAtuais.length} blocos)
                          </span>
                          {!estaNarrado && (
                            <button
                              onClick={() => handleGerarNarraçãoIndividual(artigo)}
                              disabled={estaGerando}
                              className="text-xs text-primary hover:underline font-semibold"
                            >
                              Gerar todos os áudios agora
                            </button>
                          )}
                        </div>

                        <div className="space-y-2">
                          {partesAtuais.map((parte) => {
                            const isParteAtiva = blocoAtivoId === parte.id;
                            const isTocandoEsta = tocandoUrl === parte.audioUrl && !!tocandoUrl;

                            return (
                              <div
                                key={parte.id}
                                className={`p-3 rounded-xl border transition-all ${
                                  isParteAtiva
                                    ? 'bg-amber-500/15 border-amber-500/60 ring-2 ring-amber-500/30 shadow-md'
                                    : 'bg-background/60 border-border/50 hover:border-border/80'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                      isParteAtiva
                                        ? 'bg-amber-500 text-black'
                                        : 'bg-secondary text-muted-foreground'
                                    }`}>
                                      {parte.rotulo}
                                    </span>
                                    {isParteAtiva && (
                                      <span className="text-[11px] font-bold text-amber-400 animate-pulse flex items-center gap-1">
                                        <Volume2 className="w-3.5 h-3.5" /> Narrando agora...
                                      </span>
                                    )}
                                  </div>

                                  {parte.audioUrl && (
                                    <button
                                      onClick={() => tocarParteAudio(parte.audioUrl!, parte.id)}
                                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                        isTocandoEsta
                                          ? 'bg-amber-500 text-black font-bold'
                                          : 'bg-secondary hover:bg-secondary/80 text-foreground'
                                      }`}
                                    >
                                      {isTocandoEsta ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                      <span>{isTocandoEsta ? 'Pausar' : 'Ouvir bloco'}</span>
                                    </button>
                                  )}
                                </div>

                                <p className={`text-xs leading-relaxed ${isParteAtiva ? 'text-amber-200 font-medium' : 'text-foreground'}`}>
                                  {parte.texto}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: NÍVEL 2 (LISTA DE LEIS DA CATEGORIA SELECIONADA)
  // ==========================================================================
  if (selectedCat && !selectedCat.isSpecialTool) {
    const leisDaCategoria = LEIS_CATALOG.filter((l) => l.tipo === selectedCat.id);
    const leisFiltradasCat = leisDaCategoria.filter((l) => {
      if (!busca.trim()) return true;
      const q = busca.toLowerCase();
      return (
        l.nome.toLowerCase().includes(q) ||
        l.sigla.toLowerCase().includes(q) ||
        l.descricao.toLowerCase().includes(q)
      );
    });

    return (
      <div className="min-h-dvh bg-background pb-12">
        <PageHeader
          title={selectedCat.nome}
          subtitle={selectedCat.desc}
          onBack={() => { setSelectedCat(null); setBusca(''); }}
        />

        <div className="p-4 max-w-4xl mx-auto space-y-4">
          {/* Busca de Leis */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder={`Buscar em ${selectedCat.nome} (ex: Código Penal, CLT...)`}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-secondary/40 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Cards das Leis */}
          <div className="rounded-2xl border border-border/60 bg-secondary/20 divide-y divide-border/50 overflow-hidden">
            {leisFiltradasCat.map((lei) => (
              <button
                key={lei.id}
                onClick={() => setSelectedLei(lei)}
                className="w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-secondary/50 active:bg-secondary transition-colors"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                  style={{ backgroundColor: `${lei.iconColor || selectedCat.color}20`, color: lei.iconColor || selectedCat.color }}
                >
                  <Scale className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-foreground">{lei.sigla}</span>
                    <span className="text-xs text-muted-foreground truncate">{lei.nome}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {lei.descricao}
                  </p>
                </div>

                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: FERRAMENTA ESPECIAL — TESTE DE ÁUDIO
  // ==========================================================================
  if (selectedCat && selectedCat.id === 'teste-audio') {
    return (
      <div className="min-h-dvh bg-background pb-12">
        <PageHeader
          title="Teste de Áudio"
          subtitle="Vozes Gemini TTS, tonalidades e testes de pronúncia jurídica"
          onBack={() => setSelectedCat(null)}
        />

        <div className="p-4 max-w-4xl mx-auto space-y-6">
          {/* Seletor de Vozes */}
          <div className="p-4 rounded-2xl border border-border/60 bg-card/60 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-primary" />
                Selecione a Voz para Teste
              </h3>
              <span className="text-xs text-muted-foreground">{VOZES_DISPONIVEIS.length} vozes disponíveis</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {VOZES_DISPONIVEIS.map((v) => {
                const isSelected = vozTeste === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setVozTeste(v.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                        : 'border-border/60 bg-secondary/20 hover:bg-secondary/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-foreground">{v.nome}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        v.genero === 'F' ? 'bg-pink-500/10 text-pink-400' : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {v.genero === 'F' ? 'Feminina' : 'Masculina'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{v.descricao}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seletor de Tonalidade / Estilo */}
          <div className="p-4 rounded-2xl border border-border/60 bg-card/60 space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary" />
              Tonalidade e Estilo da Narração
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ESTILOS_TOM.map((estilo) => (
                <button
                  key={estilo.id}
                  onClick={() => setEstiloTeste(estilo.prompt)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    estiloTeste === estilo.prompt
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                      : 'border-border/60 bg-secondary/20 hover:bg-secondary/40'
                  }`}
                >
                  <p className="font-bold text-xs text-foreground mb-1">{estilo.label}</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{estilo.prompt}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Amostras Rápidas e Texto para Ouvir */}
          <div className="p-4 rounded-2xl border border-border/60 bg-card/60 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Texto da Amostra Jurídica
              </h3>

              <div className="flex items-center gap-1.5 flex-wrap">
                {AMOSTRAS_TESTE.map((amostra, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTextoTeste(amostra.texto)}
                    className="px-2.5 py-1 rounded-lg bg-secondary/60 hover:bg-secondary text-[11px] font-medium text-foreground transition-colors"
                  >
                    {amostra.titulo}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={textoTeste}
              onChange={(e) => setTextoTeste(e.target.value)}
              rows={4}
              className="w-full p-3 rounded-xl bg-secondary/30 border border-border/60 text-xs text-foreground leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Digite ou cole aqui o texto do artigo que você deseja ouvir..."
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                onClick={handleTestarVoz}
                disabled={gerandoPrevia}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
              >
                {gerandoPrevia ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                <span>Ouvir com voz {vozTeste}</span>
              </button>

              <button
                onClick={handleDefinirComoPadrao}
                disabled={salvandoAuto}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border/60 text-xs font-semibold text-foreground transition-all"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Definir voz {vozTeste} como padrão da Automação</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: FERRAMENTA ESPECIAL — AUTOMAÇÃO (CRON JOBS)
  // ==========================================================================
  if (selectedCat && selectedCat.id === 'automacao') {
    return (
      <div className="min-h-dvh bg-background pb-12">
        <PageHeader
          title="Automação de Narração"
          subtitle="Cron job de 10 em 10 minutos no Supabase com prioridade para artigos maiores"
          onBack={() => setSelectedCat(null)}
        />

        <div className="p-4 max-w-4xl mx-auto space-y-6">
          {/* Card Status do Cron */}
          <div className="p-5 rounded-2xl border border-border/70 bg-gradient-to-br from-card/90 via-card/50 to-secondary/30 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${configAuto?.ativa ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
                  <span className="text-sm font-bold text-foreground">
                    {configAuto?.ativa ? 'Cron Job Ativo (a cada 10 min)' : 'Cron Job Pausado'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Disparo agendado via <code>pg_cron</code> no Supabase chamando a Edge Function de narração fatiada.
                </p>
              </div>

              <button
                onClick={handleToggleCron}
                disabled={salvandoAuto}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 ${
                  configAuto?.ativa
                    ? 'bg-rose-500/15 border border-rose-500/40 text-rose-400 hover:bg-rose-500/25'
                    : 'bg-emerald-500 text-black hover:bg-emerald-400'
                }`}
              >
                {configAuto?.ativa ? 'Pausar Automação' : 'Ativar Automação (10 min)'}
              </button>
            </div>

            {/* Painel de Métricas Rápidas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border/50">
              <div className="p-3 rounded-xl bg-secondary/30">
                <span className="text-[11px] text-muted-foreground block">Artigos Gerados</span>
                <span className="text-base font-bold text-foreground font-mono">
                  {configAuto?.artigos_gerados_total || 0}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-secondary/30">
                <span className="text-[11px] text-muted-foreground block">Prioridade</span>
                <span className="text-xs font-bold text-primary truncate block mt-0.5">
                  Artigos Maiores 1º
                </span>
              </div>

              <div className="p-3 rounded-xl bg-secondary/30">
                <span className="text-[11px] text-muted-foreground block">Voz Padrão</span>
                <span className="text-xs font-bold text-foreground truncate block mt-0.5">
                  {configAuto?.voz_padrao || 'Kore'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-secondary/30">
                <span className="text-[11px] text-muted-foreground block">Último Gerado</span>
                <span className="text-xs font-bold text-emerald-400 truncate block mt-0.5">
                  {configAuto?.ultimo_artigo_gerado || 'Nenhum'}
                </span>
              </div>
            </div>
          </div>

          {/* Configurações da Automação */}
          <div className="p-5 rounded-2xl border border-border/60 bg-card/60 space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary" />
              Parâmetros de Execução do Cron
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Lei Alvo da Fila Automática
                </label>
                <select
                  value={configAuto?.tabela_nome || 'CP_CODIGO_PENAL'}
                  onChange={async (e) => {
                    const tabela = e.target.value;
                    await salvarConfigAutomacao({ tabela_nome: tabela });
                    setConfigAuto((prev) => prev ? { ...prev, tabela_nome: tabela } : prev);
                  }}
                  className="w-full p-2.5 rounded-xl bg-secondary/40 border border-border/60 text-foreground font-medium"
                >
                  <option value="CP_CODIGO_PENAL">Código Penal (CP) — Recomendado</option>
                  <option value="CC_CODIGO_CIVIL">Código Civil (CC)</option>
                  <option value="CF88_CONSTITUICAO_FEDERAL">Constituição Federal (CF/88)</option>
                  <option value="CPC_CODIGO_PROCESSO_CIVIL">Código de Processo Civil (CPC)</option>
                  <option value="CPP_CODIGO_PROCESSO_PENAL">Código de Processo Penal (CPP)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Regra de Prioridade na Fila
                </label>
                <div className="p-3 rounded-xl bg-secondary/20 border border-border/50 text-muted-foreground">
                  <div className="flex items-center gap-2 text-foreground font-bold mb-1">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Artigos Maiores Primeiro (Ativo)
                  </div>
                  Calcula a extensão em caracteres de cada artigo pendente e processa primeiro os mais extensos e densos, adiantando o trabalho nos artigos que os alunos mais precisam de narração.
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Intervalo do Disparador
                </label>
                <div className="p-3 rounded-xl bg-secondary/20 border border-border/50 text-foreground font-mono">
                  10 em 10 minutos (<code>*/10 * * * *</code>)
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleDispararLoteAgora}
                disabled={disparandoManual}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
              >
                {disparandoManual ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                <span>Disparar 1 Lote Manual Agora (Maior Artigo Pendente)</span>
              </button>
            </div>
          </div>

          {/* Histórico de Execuções e Logs */}
          <div className="p-5 rounded-2xl border border-border/60 bg-card/60 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Histórico de Execuções Recentes
              </h3>
              <button
                onClick={() => buscarLogsAutomacao().then(setLogsAuto)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Atualizar
              </button>
            </div>

            {logsAuto.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                Nenhum log registrado ainda. Acione o botão acima para rodar o primeiro lote.
              </p>
            ) : (
              <div className="divide-y divide-border/40 rounded-xl border border-border/40 overflow-hidden bg-background/50 text-xs">
                {logsAuto.map((log) => (
                  <div key={log.id} className="p-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">
                          Artigo {log.artigo_numero}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          log.status === 'sucesso' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {log.status}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {log.partes_geradas} partes
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {log.mensagem}
                      </p>
                    </div>

                    <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: NÍVEL 1 (TELA PRINCIPAL: CATEGORIAS & FERRAMENTAS)
  // ==========================================================================
  return (
    <div className="min-h-dvh bg-background pb-12">
      <PageHeader
        title="Narração de Leis"
        subtitle="Vade Mecum, estúdio de voz fatiada, testes e automação"
        onBack={() => navigate('/admin-funcoes?cat=bases-juridicas', { state: { fromCat: 'bases-juridicas' } })}
      />

      <div className="p-4 max-w-4xl mx-auto space-y-4">
        <p className="text-xs text-muted-foreground px-1">
          Selecione uma categoria de legislação para ver os artigos e gerar narrações fatiadas, ou use as ferramentas de teste e automação abaixo:
        </p>

        <div className="rounded-2xl border border-border/60 bg-secondary/30 divide-y divide-border/50 overflow-hidden shadow-sm">
          {CATEGORIAS_DEF.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat)}
                className="w-full flex items-center gap-4 px-4 py-4 min-h-[80px] text-left hover:bg-secondary/60 active:bg-secondary transition-colors"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                  style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                >
                  <Icon className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-foreground">{cat.nome}</span>
                    {cat.isSpecialTool && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                        Ferramenta
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {cat.desc}
                  </p>
                </div>

                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
