import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scale, BookOpen, Shield, ScrollText, HeartHandshake,
  Search, RefreshCw, ChevronRight, CheckCircle2,
  Clock, Loader2, Play, Pause, ArrowLeft, Volume2,
  Cpu, Sliders, Check, Sparkles, Filter, AlertCircle,
  FileText, Zap, Music, ListFilter, VolumeX,
  Trash2, ChevronDown, Mic, Database, Layers
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
  buscarTestesCache,
  gerarESalvarPreviaAudio,
  apagarPreviaAudio,
  apagarNarracaoArtigo,
  type TesteAudioRegistro,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
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

/** Detecta se um item é um artigo real (Art. X) vs estrutural (PARTE GERAL, TÍTULO, CAPÍTULO, etc.) */
const ROTULOS_ESTRUTURAIS = /^(PARTE|T[ÍI]TULO|CAP[ÍI]TULO|SE[ÇC][ÃA]O|SUBSE[ÇC][ÃA]O|LIVRO|DISPOSI[ÇC][ÕO]ES|PRELI?MINARES?|TRANSITÓRIAS?)/i;
function isArtigoReal(art: ArtigoLei): boolean {
  const num = String(art.numero || '').trim();
  // Se o "número" começa com um rótulo estrutural, não é artigo
  if (ROTULOS_ESTRUTURAIS.test(num)) return false;
  // Se não tem conteúdo substancial (caput < 5 chars) e o título é estrutural
  if (art.titulo && ROTULOS_ESTRUTURAIS.test(art.titulo.trim()) && (!art.caput || art.caput.trim().length < 5)) return false;
  return true;
}

/** Enriquecer artigos legislativos reais com seu contexto hierárquico (Parte, Livro, Título, Capítulo) */
function enriquecerArtigosComHierarquia(artigosBrutos: ArtigoLei[]): ArtigoLei[] {
  let currentParte = '';
  let currentLivro = '';
  let currentTitulo = '';
  let currentCapitulo = '';

  const artigosEnriquecidos: ArtigoLei[] = [];

  for (const item of artigosBrutos) {
    const num = String(item.numero || '').trim();
    const caput = String(item.caput || '').trim();
    const textoCompleto = `${num}\n${caput}`.trim();

    // 1. Detecta Linha de Parte (ex: "PARTE GERAL", "PARTE ESPECIAL")
    if (/^\s*PARTE\s+(?:GERAL|ESPECIAL|[IVXLCDM0-9]+)/i.test(num) || /^\s*PARTE\s+(?:GERAL|ESPECIAL|[IVXLCDM0-9]+)/i.test(caput)) {
      const match = textoCompleto.match(/PARTE\s+(?:GERAL|ESPECIAL|[IVXLCDM0-9]+)/i);
      currentParte = match ? match[0].trim() : num;
      currentTitulo = '';
      currentCapitulo = '';
      continue;
    }

    // 2. Detecta Linha de Livro (ex: "LIVRO I")
    if (/^\s*LIVRO\s+[IVXLCDM0-9]+/i.test(num) || /^\s*LIVRO\s+[IVXLCDM0-9]+/i.test(caput)) {
      const match = textoCompleto.match(/LIVRO\s+[IVXLCDM0-9]+[^\n]*/i);
      currentLivro = match ? match[0].trim() : num;
      currentTitulo = '';
      currentCapitulo = '';
      continue;
    }

    // 3. Detecta Linha de Título (ex: "TÍTULO I\nDA APLICAÇÃO DA LEI PENAL")
    if (/^\s*T[ÍI]TULO\s+[IVXLCDM0-9]+/i.test(num) || /^\s*T[ÍI]TULO\s+[IVXLCDM0-9]+/i.test(caput)) {
      const linhas = textoCompleto.split('\n').map((l) => l.trim()).filter(Boolean);
      const linha0 = linhas[0] || num;
      const linha1 = linhas.slice(1).join(' - ');
      currentTitulo = linha1 ? `${linha0} - ${linha1}` : linha0;
      currentCapitulo = '';
      continue;
    }

    // 4. Detecta Linha de Capítulo (ex: "CAPÍTULO I\nDO CRIME")
    if (/^\s*CAP[ÍI]TULO\s+(?:[IVXLCDM0-9]+|[ÚU]NICO)/i.test(num) || /^\s*CAP[ÍI]TULO\s+(?:[IVXLCDM0-9]+|[ÚU]NICO)/i.test(caput)) {
      const linhas = textoCompleto.split('\n').map((l) => l.trim()).filter(Boolean);
      const linha0 = linhas[0] || num;
      const linha1 = linhas.slice(1).join(' - ');
      currentCapitulo = linha1 ? `${linha0} - ${linha1}` : linha0;
      continue;
    }

    // Se for artigo real legislativo
    if (isArtigoReal(item)) {
      artigosEnriquecidos.push({
        ...item,
        parte: currentParte || item.parte,
        livro: currentLivro || item.livro,
        titulo: currentTitulo || item.titulo,
        capitulo: currentCapitulo || item.capitulo,
      });
    }
  }

  return artigosEnriquecidos;
}

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

  // Geração de narração individual
  const [gerandoArtigoNum, setGerandoArtigoNum] = useState<string | null>(null);
  const [apagandoArtigoNum, setApagandoArtigoNum] = useState<string | null>(null);
  const [artigoParaExcluir, setArtigoParaExcluir] = useState<ArtigoLei | null>(null);
  const [apagandoArtigo, setApagandoArtigo] = useState(false);
  const [progressoGeracao, setProgressoGeracao] = useState<{ parteAtual: number; totalPartes: number; rotulo: string } | null>(null);

  // Player de Áudio Fatiado (com destaque do bloco ativo)
  const [tocandoUrl, setTocandoUrl] = useState<string | null>(null);
  const [blocoAtivoId, setBlocoAtivoId] = useState<string | null>(null);
  const [reproduzindoSequencial, setReproduzindoSequencial] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Estados do "Teste de Áudio"
  const [vozTeste, setVozTeste] = useState('Kore');
  const [textoTeste, setTextoTeste] = useState(AMOSTRAS_TESTE[0].texto);
  const [isVozModalOpen, setIsVozModalOpen] = useState(false);
  const [filtroGeneroVoz, setFiltroGeneroVoz] = useState<'todos' | 'F' | 'M'>('todos');
  const [testesCache, setTestesCache] = useState<Record<string, TesteAudioRegistro>>({});
  const [carregandoCache, setCarregandoCache] = useState(false);
  const [gerandoEstilos, setGerandoEstilos] = useState<Record<string, boolean>>({});
  const [gerandoTodas, setGerandoTodas] = useState(false);
  const [apagandoEstiloId, setApagandoEstiloId] = useState<string | null>(null);
  const [tocandoEstiloId, setTocandoEstiloId] = useState<string | null>(null);
  const [tempoAudioAtual, setTempoAudioAtual] = useState(0);
  const [duracaoAudioAtual, setDuracaoAudioAtual] = useState(0);

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
      // Enriquece artigos reais com seu contexto hierárquico (Parte Geral, Livro, Título, Capítulo)
      const artigosProcessados = enriquecerArtigosComHierarquia(listaArtigos || []);
      setArtigos(artigosProcessados);
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

  // Handler de reprodução do áudio do artigo (áudio completo unificado ou sequencial)
  const tocarArtigo = (audioUrlPrincipal: string | undefined, partes: ArtigoParte[], artigoNum: string) => {
    if (audioUrlPrincipal) {
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      const a = audioRef.current;

      if (tocandoUrl === audioUrlPrincipal && reproduzindoSequencial === artigoNum) {
        a.pause();
        setTocandoUrl(null);
        setReproduzindoSequencial(null);
        setBlocoAtivoId(null);
        return;
      }

      a.pause();
      a.src = audioUrlPrincipal;
      setTocandoUrl(audioUrlPrincipal);
      setReproduzindoSequencial(artigoNum);
      setBlocoAtivoId(null);

      a.play().catch((err) => {
        console.warn('Erro ao tocar áudio unificado:', err);
        toast.error('Não foi possível reproduzir este áudio');
        setTocandoUrl(null);
        setReproduzindoSequencial(null);
      });

      a.onended = () => {
        setTocandoUrl(null);
        setReproduzindoSequencial(null);
        setBlocoAtivoId(null);
      };
      return;
    }

    tocarArtigoSequencial(partes, artigoNum);
  };

  // Gera narração contínua inteligente para um artigo (com introdução contextual e até ~1 min por áudio)
  const handleGerarNarraçãoIndividual = async (artigo: ArtigoLei) => {
    if (!selectedLei || gerandoArtigoNum) return;
    setGerandoArtigoNum(artigo.numero);
    setProgressoGeracao({ parteAtual: 1, totalPartes: 1, rotulo: 'Iniciando gravação contínua...' });

    const toastId = toast.loading(`Narrando Artigo ${artigo.numero}...`);

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

      const numLimpo = String(artigo.numero).replace(/^[Aa]rt\.?\s*/i, '').trim();
      setStatusNarracoes((prev) => ({
        ...prev,
        [numLimpo]: {
          artigo_numero: numLimpo,
          audio_url: res.audioUrl,
          partes: res.partes,
        },
        [artigo.numero]: {
          artigo_numero: numLimpo,
          audio_url: res.audioUrl,
          partes: res.partes,
        },
      }));

      const msg = res.partes.length === 1
        ? `Artigo ${artigo.numero} gravado com sucesso em 1 áudio contínuo!`
        : `Artigo ${artigo.numero} gravado com sucesso em ${res.partes.length} partes (~1 min cada)!`;
      toast.success(msg, { id: toastId });
    } catch (err: any) {
      console.error('Erro na narração individual:', err);
      toast.error(`Falha ao narrar: ${err.message || 'Erro desconhecido'}`, { id: toastId });
    } finally {
      setGerandoArtigoNum(null);
      setProgressoGeracao(null);
    }
  };

  // Confirmação e exclusão real da narração no Supabase (DB + Storage)
  const handleConfirmarExcluirNarracao = async () => {
    if (!artigoParaExcluir || !selectedLei) return;
    const art = artigoParaExcluir;
    const numLimpo = String(art.numero).replace(/^[Aa]rt\.?\s*/i, '').trim();

    setApagandoArtigo(true);
    setApagandoArtigoNum(art.numero);
    const toastId = toast.loading(`Excluindo narração do Artigo ${art.numero} do Supabase...`);

    try {
      await apagarNarracaoArtigo(selectedLei.tabela_nome, art.numero);

      // Atualiza o estado local removendo todas as variações de chaves
      setStatusNarracoes((prev) => {
        const novo = { ...prev };
        delete novo[numLimpo];
        delete novo[art.numero];
        delete novo[`Art. ${numLimpo}`];
        delete novo[`Artigo ${numLimpo}`];
        const numDigitos = numLimpo.replace(/\D/g, '');
        if (numDigitos) {
          delete novo[numDigitos];
          delete novo[`${numDigitos}º`];
          delete novo[`${numDigitos}°`];
          delete novo[`Art. ${numDigitos}`];
          delete novo[`Art. ${numDigitos}º`];
        }
        return novo;
      });

      // Se estiver tocando este artigo, interrompe
      if (tocandoUrl || reproduzindoSequencial === art.numero) {
        if (audioRef.current) audioRef.current.pause();
        setTocandoUrl(null);
        setReproduzindoSequencial(null);
        setBlocoAtivoId(null);
      }

      toast.success(`Narração do Artigo ${art.numero} excluída com sucesso!`, { id: toastId });
      setArtigoParaExcluir(null);
    } catch (err: any) {
      console.error('Erro ao excluir narração:', err);
      toast.error(`Falha ao excluir: ${err.message || 'Erro desconhecido'}`, { id: toastId });
    } finally {
      setApagandoArtigo(false);
      setApagandoArtigoNum(null);
    }
  };

  // Efeito para carregar o cache do Supabase sempre que a voz ou texto mudarem
  useEffect(() => {
    if (selectedCat?.id !== 'teste-audio') return;
    let ativo = true;
    setCarregandoCache(true);
    buscarTestesCache(vozTeste, textoTeste)
      .then((res) => {
        if (ativo) setTestesCache(res);
      })
      .catch((err) => console.warn('Erro ao carregar cache de testes:', err))
      .finally(() => {
        if (ativo) setCarregandoCache(false);
      });
    return () => {
      ativo = false;
    };
  }, [vozTeste, textoTeste, selectedCat?.id]);

  // Reproduzir ou pausar uma prévia de estilo
  const handleTocarEstilo = (estiloId: string, url: string) => {
    if (tocandoEstiloId === estiloId) {
      audioRef.current?.pause();
      setTocandoEstiloId(null);
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    audioRef.current.pause();
    audioRef.current.src = url;
    audioRef.current.ontimeupdate = () => {
      if (audioRef.current) {
        setTempoAudioAtual(audioRef.current.currentTime || 0);
        setDuracaoAudioAtual(audioRef.current.duration || 0);
      }
    };
    audioRef.current.onended = () => {
      setTocandoEstiloId(null);
      setTempoAudioAtual(0);
    };
    audioRef.current.onerror = () => {
      setTocandoEstiloId(null);
      toast.error('Erro ao reproduzir arquivo de áudio');
    };

    audioRef.current.play().then(() => {
      setTocandoEstiloId(estiloId);
    }).catch((err) => {
      console.warn('Falha no autoplay:', err);
      setTocandoEstiloId(null);
    });
  };

  // Gerar versão individual de uma tonalidade
  const handleGerarEstilo = async (estilo: typeof ESTILOS_TOM[0]) => {
    if (!textoTeste.trim()) {
      toast.error('Insira o texto da amostra jurídica');
      return;
    }

    setGerandoEstilos((prev) => ({ ...prev, [estilo.id]: true }));
    const toastId = toast.loading(`Gerando áudio (${estilo.label}) com voz ${vozTeste}...`);

    try {
      const reg = await gerarESalvarPreviaAudio(
        textoTeste,
        vozTeste,
        estilo.id,
        estilo.prompt,
        estilo.label
      );

      setTestesCache((prev) => ({ ...prev, [estilo.id]: reg }));
      toast.success(`Versão "${estilo.label}" gerada e salva no Supabase!`, { id: toastId });
      handleTocarEstilo(estilo.id, reg.audio_url);
    } catch (err: any) {
      toast.error(`Erro ao gerar versão: ${err.message || 'Falha'}`, { id: toastId });
    } finally {
      setGerandoEstilos((prev) => ({ ...prev, [estilo.id]: false }));
    }
  };

  // Gerar todas as 4 versões simultaneamente
  const handleGerarTodas4Versoes = async () => {
    if (!textoTeste.trim()) {
      toast.error('Insira o texto da amostra jurídica');
      return;
    }

    const estilosPendentes = ESTILOS_TOM.filter((e) => !testesCache[e.id]?.audio_url);

    if (estilosPendentes.length === 0) {
      toast.info('As 4 versões já estão salvas no Supabase!');
      return;
    }

    setGerandoTodas(true);
    const toastId = toast.loading(`Gerando ${estilosPendentes.length} versões pendentes com a voz ${vozTeste}...`);

    let sucessoCount = 0;
    for (const estilo of estilosPendentes) {
      try {
        setGerandoEstilos((prev) => ({ ...prev, [estilo.id]: true }));
        const reg = await gerarESalvarPreviaAudio(
          textoTeste,
          vozTeste,
          estilo.id,
          estilo.prompt,
          estilo.label
        );
        setTestesCache((prev) => ({ ...prev, [estilo.id]: reg }));
        sucessoCount++;
      } catch (err: any) {
        console.error(`Erro na versão ${estilo.id}:`, err);
      } finally {
        setGerandoEstilos((prev) => ({ ...prev, [estilo.id]: false }));
      }
    }

    setGerandoTodas(false);
    if (sucessoCount > 0) {
      toast.success(`${sucessoCount} versões geradas e salvas com sucesso no Supabase!`, { id: toastId });
    } else {
      toast.error('Falha ao gerar versões simultâneas', { id: toastId });
    }
  };

  // Apagar áudio do Supabase para poder regenerar
  const handleApagarEstilo = async (estiloId: string) => {
    const reg = testesCache[estiloId];
    if (!reg) return;

    if (tocandoEstiloId === estiloId) {
      audioRef.current?.pause();
      setTocandoEstiloId(null);
    }

    setApagandoEstiloId(estiloId);
    try {
      await apagarPreviaAudio(reg.id, reg.storage_path);
      setTestesCache((prev) => {
        const copia = { ...prev };
        delete copia[estiloId];
        return copia;
      });
      toast.success('Áudio excluído do Supabase! Agora você pode regenerá-lo.');
    } catch (err: any) {
      toast.error(`Falha ao excluir: ${err.message || 'Erro'}`);
    } finally {
      setApagandoEstiloId(null);
    }
  };

  // Salvar Voz como padrão da automação
  const handleDefinirComoPadrao = async () => {
    if (!configAuto) return;
    setSalvandoAuto(true);
    try {
      await salvarConfigAutomacao({ voz_padrao: vozTeste, estilo_tom: ESTILOS_TOM[0].prompt });
      setConfigAuto((prev) => prev ? { ...prev, voz_padrao: vozTeste, estilo_tom: ESTILOS_TOM[0].prompt } : prev);
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
                const estruturado = parseArtigoEmPartes(artigo, selectedLei?.nome, selectedLei?.tabela_nome);
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
                              <CheckCircle2 className="w-3 h-3" /> Narrado ({partesAtuais.length} {partesAtuais.length === 1 ? 'áudio contínuo' : 'partes'})
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Clock className="w-3 h-3" /> Pendente
                            </span>
                          )}
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {estruturado.totalCaracteres} chars · {estruturado.totalPartes === 1 ? '1 áudio contínuo (~1 min)' : `${estruturado.totalPartes} partes (~1 min cada)`}
                          </span>
                        </div>

                        {([artigo.parte, artigo.livro, artigo.titulo, artigo.capitulo].filter(Boolean).length > 0) && (
                          <p className="text-xs font-semibold text-primary/90 truncate mb-1">
                            <span className="text-muted-foreground/80 font-normal">
                              {[artigo.parte, artigo.livro, artigo.titulo, artigo.capitulo].filter(Boolean).join(' › ')}
                            </span>
                          </p>
                        )}

                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {artigo.caput}
                        </p>
                      </div>

                      {/* Botões de Ação do Artigo */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {estaNarrado ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => tocarArtigo(reg?.audio_url, partesAtuais, artigo.numero)}
                              className={`p-2.5 rounded-xl border transition-all ${
                                estaTocandoSequencial
                                  ? 'bg-primary text-primary-foreground border-primary animate-pulse'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              }`}
                              title="Ouvir Artigo Completo"
                            >
                              {estaTocandoSequencial ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setArtigoParaExcluir(artigo);
                              }}
                              disabled={apagandoArtigoNum === artigo.numero || apagandoArtigo}
                              className="p-2.5 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 active:scale-95 transition-all disabled:opacity-50"
                              title="Excluir Narração do Supabase"
                            >
                              {apagandoArtigoNum === artigo.numero ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleGerarNarraçãoIndividual(artigo)}
                            disabled={estaGerando}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-semibold hover:bg-primary/20 active:scale-95 transition-all disabled:opacity-50"
                          >
                            {estaGerando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                            <span className="hidden sm:inline">Gerar Áudio</span>
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
                            {partesAtuais.length === 1 ? 'Áudio Contínuo (~1 minuto)' : `Partes do Artigo (${partesAtuais.length} partes)`}
                          </span>
                          {!estaNarrado && (
                            <button
                              onClick={() => handleGerarNarraçãoIndividual(artigo)}
                              disabled={estaGerando}
                              className="text-xs text-primary hover:underline font-semibold"
                            >
                              Gerar narração contínua agora
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

        {/* Modal de Confirmação para Excluir Narração do Supabase */}
        <Dialog open={!!artigoParaExcluir} onOpenChange={(open) => !open && !apagandoArtigo && setArtigoParaExcluir(null)}>
          <DialogContent className="max-w-md bg-[#0D0F12]/95 border-white/10 text-white backdrop-blur-2xl">
            <DialogHeader>
              <div className="w-12 h-12 rounded-2xl bg-destructive/15 border border-destructive/30 flex items-center justify-center text-destructive mb-2">
                <Trash2 className="w-6 h-6" />
              </div>
              <DialogTitle className="text-lg font-bold text-white">
                Excluir Narração do Artigo {artigoParaExcluir?.numero}?
              </DialogTitle>
              <DialogDescription className="text-sm text-zinc-400">
                Esta ação removerá todos os arquivos de áudio do <strong className="text-white">Supabase Storage</strong> e apagará o registro da tabela <strong className="text-white">narracoes_artigos</strong>. Deseja continuar?
              </DialogDescription>
            </DialogHeader>

            {artigoParaExcluir && (
              <div className="p-3 rounded-xl bg-zinc-900/70 border border-white/5 text-xs text-zinc-300 line-clamp-3 italic">
                "{artigoParaExcluir.caput}"
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-2 mt-3">
              <button
                type="button"
                disabled={apagandoArtigo}
                onClick={() => setArtigoParaExcluir(null)}
                className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-medium transition-colors disabled:opacity-50 text-zinc-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={apagandoArtigo}
                onClick={handleConfirmarExcluirNarracao}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-destructive hover:bg-destructive/90 text-white text-sm font-semibold transition-all shadow-lg shadow-destructive/20 disabled:opacity-50"
              >
                {apagandoArtigo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir Definitivamente</span>
                  </>
                )}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
    const vozSelecionadaObj = VOZES_DISPONIVEIS.find((v) => v.id === vozTeste) || VOZES_DISPONIVEIS[0];
    const vozesFiltradas = filtroGeneroVoz === 'todos'
      ? VOZES_DISPONIVEIS
      : VOZES_DISPONIVEIS.filter((v) => v.genero === filtroGeneroVoz);
    const totalVersoesSalvas = ESTILOS_TOM.filter((e) => !!testesCache[e.id]?.audio_url).length;

    const formatarTempo = (segundos: number) => {
      if (isNaN(segundos) || segundos < 0) return '0:00';
      const mins = Math.floor(segundos / 60);
      const secs = Math.floor(segundos % 60);
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
      <div className="min-h-dvh bg-background pb-12">
        <PageHeader
          title="Teste de Áudio"
          subtitle="Vozes Gemini TTS, tonalidades e testes de pronúncia jurídica"
          onBack={() => {
            if (audioRef.current) {
              audioRef.current.pause();
              setTocandoEstiloId(null);
            }
            setSelectedCat(null);
          }}
        />

        <div className="p-4 max-w-4xl mx-auto space-y-5">
          {/* Seletor de Voz Compacto (Botão com Modal) */}
          <div className="p-4 rounded-2xl border border-border/70 bg-gradient-to-br from-card/90 via-card/60 to-secondary/30 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-primary" />
                Voz Selecionada para Teste
              </span>
              <span className="text-xs text-muted-foreground">
                {VOZES_DISPONIVEIS.length} vozes disponíveis
              </span>
            </div>

            {/* Botão Trigger que abre o seletor */}
            <button
              type="button"
              onClick={() => setIsVozModalOpen(true)}
              className="w-full p-3.5 rounded-xl border border-border/80 bg-secondary/30 hover:bg-secondary/60 hover:border-primary/50 transition-all text-left flex items-center justify-between gap-3 group active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm transition-transform group-hover:scale-105',
                  vozSelecionadaObj.genero === 'F'
                    ? 'bg-pink-500/15 border-pink-500/30 text-pink-400'
                    : 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                )}>
                  <Mic className="w-5 h-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-foreground tracking-tight">
                      {vozSelecionadaObj.nome}
                    </span>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase',
                      vozSelecionadaObj.genero === 'F'
                        ? 'bg-pink-500/15 text-pink-400 border border-pink-500/30'
                        : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                    )}>
                      {vozSelecionadaObj.genero === 'F' ? 'Feminina' : 'Masculina'}
                    </span>
                    {vozSelecionadaObj.destaque && (
                      <span className="hidden sm:inline px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Recomendada
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {vozSelecionadaObj.descricao}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg bg-secondary/90 border border-border/70 text-xs font-semibold text-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all">
                <span>Trocar Voz</span>
                <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" />
              </div>
            </button>
          </div>

          {/* Modal / Dialog de Escolha da Voz */}
          <Dialog open={isVozModalOpen} onOpenChange={setIsVozModalOpen}>
            <DialogContent className="max-w-xl max-h-[85vh] flex flex-col p-0 overflow-hidden bg-background border-border/80">
              <DialogHeader className="p-4 sm:p-5 border-b border-border/50 text-left">
                <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-primary" />
                  Selecione a Voz para Teste
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Clique na voz desejada para selecioná-la. A janela fechará automaticamente.
                </p>

                {/* Filtro Rápido: Todas / Femininas / Masculinas */}
                <div className="flex items-center gap-1.5 mt-3 bg-secondary/40 p-1 rounded-xl w-fit">
                  {(['todos', 'F', 'M'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setFiltroGeneroVoz(g)}
                      className={cn(
                        'px-3 py-1 rounded-lg text-xs font-semibold transition-all',
                        filtroGeneroVoz === g
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {g === 'todos' ? 'Todas (11)' : g === 'F' ? 'Femininas (5)' : 'Masculinas (6)'}
                    </button>
                  ))}
                </div>
              </DialogHeader>

              <div className="p-4 overflow-y-auto space-y-2 flex-1">
                {vozesFiltradas.map((v) => {
                  const isSelected = vozTeste === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setVozTeste(v.id);
                        setIsVozModalOpen(false); // Fecha o modal imediatamente conforme solicitado!
                      }}
                      className={cn(
                        'w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 group',
                        isSelected
                          ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
                          : 'border-border/60 bg-secondary/20 hover:bg-secondary/40 hover:border-border'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border',
                          v.genero === 'F'
                            ? 'bg-pink-500/10 border-pink-500/20 text-pink-400'
                            : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                        )}>
                          <Mic className="w-4 h-4" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">{v.nome}</span>
                            <span className={cn(
                              'px-1.5 py-0.5 rounded text-[9.5px] font-bold',
                              v.genero === 'F' ? 'bg-pink-500/10 text-pink-400' : 'bg-blue-500/10 text-blue-400'
                            )}>
                              {v.genero === 'F' ? 'Feminina' : 'Masculina'}
                            </span>
                            {v.destaque && (
                              <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-amber-500/10 text-amber-400">
                                Recomendada
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{v.descricao}</p>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>

          {/* Amostras Rápidas e Texto da Narração */}
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
                    type="button"
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
              rows={3}
              className="w-full p-3 rounded-xl bg-secondary/30 border border-border/60 text-xs text-foreground leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Digite ou cole aqui o texto do artigo que você deseja ouvir..."
            />

            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
              <span>{textoTeste.length} / 1.500 caracteres</span>
              <button
                type="button"
                onClick={handleDefinirComoPadrao}
                disabled={salvandoAuto}
                className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Definir voz {vozTeste} como padrão da Automação
              </button>
            </div>
          </div>

          {/* As 4 Tonalidades e Prévias Simultâneas */}
          <div className="p-4 rounded-2xl border border-border/60 bg-card/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/40">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-primary" />
                  4 Versões de Tonalidade (Gemini TTS)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {carregandoCache ? (
                    'Consultando cache no Supabase...'
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-emerald-400" />
                      <strong>{totalVersoesSalvas} de 4</strong> versões salvas no Supabase
                    </span>
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={handleGerarTodas4Versoes}
                disabled={gerandoTodas || totalVersoesSalvas === 4}
                className={cn(
                  'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50',
                  totalVersoesSalvas === 4
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
              >
                {gerandoTodas ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Gerando Versões...</span>
                  </>
                ) : totalVersoesSalvas === 4 ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Todas as 4 Salvas</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gerar 4 Versões Simultâneas</span>
                  </>
                )}
              </button>
            </div>

            {/* Grid com os 4 cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ESTILOS_TOM.map((estilo) => {
                const cacheItem = testesCache[estilo.id];
                const isSalvo = !!cacheItem?.audio_url;
                const isGerando = !!gerandoEstilos[estilo.id];
                const isTocando = tocandoEstiloId === estilo.id;
                const isApagando = apagandoEstiloId === estilo.id;

                return (
                  <div
                    key={estilo.id}
                    className={cn(
                      'p-4 rounded-xl border transition-all flex flex-col justify-between gap-3',
                      isSalvo
                        ? 'border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/10'
                        : 'border-border/60 bg-secondary/20 hover:bg-secondary/30'
                    )}
                  >
                    <div>
                      {/* Topo do card: Nome + Status + Botão Apagar */}
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-foreground tracking-tight truncate">
                            {estilo.label}
                          </h4>
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            {isSalvo ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                                <CheckCircle2 className="w-3 h-3" /> Salvo no Supabase
                              </span>
                            ) : isGerando ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 border border-primary/30 text-primary animate-pulse">
                                <Loader2 className="w-3 h-3 animate-spin" /> Gerando...
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-muted-foreground border border-border/60">
                                Não gerado
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botão Apagar com Ícone de Lixeira */}
                        {isSalvo && (
                          <button
                            type="button"
                            onClick={() => handleApagarEstilo(estilo.id)}
                            disabled={isApagando}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 active:scale-90 transition-all shrink-0"
                            title="Apagar áudio do Supabase e regenerar"
                          >
                            {isApagando ? (
                              <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>

                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
                        {estilo.prompt}
                      </p>
                    </div>

                    {/* Ações / Player */}
                    <div className="pt-2 border-t border-border/40">
                      {isSalvo && cacheItem?.audio_url ? (
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleTocarEstilo(estilo.id, cacheItem.audio_url)}
                            className={cn(
                              'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-md shrink-0 active:scale-95',
                              isTocando
                                ? 'bg-primary text-primary-foreground animate-pulse'
                                : 'bg-emerald-500 text-black hover:bg-emerald-400'
                            )}
                            title={isTocando ? 'Pausar' : 'Ouvir Versão'}
                          >
                            {isTocando ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mb-1">
                              <span>{isTocando ? 'Reproduzindo' : 'Pronto para ouvir'}</span>
                              <span>
                                {isTocando && duracaoAudioAtual > 0
                                  ? `${formatarTempo(tempoAudioAtual)} / ${formatarTempo(duracaoAudioAtual)}`
                                  : 'WAV'}
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                              <div
                                className={cn(
                                  'h-full transition-all duration-200',
                                  isTocando ? 'bg-primary' : 'bg-emerald-500/70'
                                )}
                                style={{
                                  width: isTocando && duracaoAudioAtual > 0
                                    ? `${(tempoAudioAtual / duracaoAudioAtual) * 100}%`
                                    : '100%'
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleGerarEstilo(estilo)}
                          disabled={isGerando || gerandoTodas}
                          className="w-full py-2 px-3 rounded-xl bg-secondary/70 hover:bg-secondary border border-border/60 text-xs font-semibold text-foreground flex items-center justify-center gap-2 hover:border-primary/50 active:scale-98 transition-all disabled:opacity-50"
                        >
                          {isGerando ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                              <span>Gerando áudio...</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 text-primary" />
                              <span>Gerar Esta Versão</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
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
