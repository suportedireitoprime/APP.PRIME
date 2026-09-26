import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Scale, BookOpen, Shield, ScrollText, HeartHandshake,
  Search, RefreshCw, ChevronRight, CheckCircle2,
  Clock, Loader2, Play, Pause, ArrowLeft, Volume2,
  Cpu, Sliders, Check, Sparkles, Filter, AlertCircle,
  FileText, Zap, Music, ListFilter, VolumeX,
  Trash2, ChevronDown, Mic, Database, Layers,
  Plus, X, Tag, ListOrdered
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
  calcularScoreArtigo,
  MAPA_TOP_PROVAS,
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

/**
 * Limpa duplicações consecutivas como "TÍTULO I - TÍTULO I" ou "CAPÍTULO I - CAPÍTULO I"
 */
function deduplicarHierarquiaTexto(texto: string): string {
  if (!texto) return '';
  return texto
    // Deduplica "TÍTULO I - TÍTULO I" -> "TÍTULO I"
    .replace(/(T[ÍI]TULO\s+[IVXLCDM0-9]+)\s*[-–—:]*\s*\1\b/gi, '$1')
    // Deduplica "CAPÍTULO I - CAPÍTULO I" -> "CAPÍTULO I"
    .replace(/(CAP[ÍI]TULO\s+(?:[IVXLCDM0-9]+|[ÚU]NICO))\s*[-–—:]*\s*\1\b/gi, '$1')
    // Deduplica "PARTE GERAL - PARTE GERAL" -> "PARTE GERAL"
    .replace(/(PARTE\s+(?:GERAL|ESPECIAL|[IVXLCDM0-9]+))\s*[-–—:]*\s*\1\b/gi, '$1')
    // Deduplica "LIVRO I - LIVRO I" -> "LIVRO I"
    .replace(/(LIVRO\s+[IVXLCDM0-9]+)\s*[-–—:]*\s*\1\b/gi, '$1')
    // Limpa múltiplos hífens ou espaços estranhos
    .replace(/\s*[-–—]\s*[-–—]\s*/g, ' - ')
    .trim();
}

/**
 * Extrai e deduplica títulos ou capítulos que venham repetidos da raspagem/banco.
 * Ex: num="TÍTULO I", caput="TÍTULO I\nDA APLICAÇÃO DA LEI PENAL"
 * -> "TÍTULO I - DA APLICAÇÃO DA LEI PENAL"
 */
function normalizarTextoEstrutural(num: string, caput: string): string {
  const linhasCandidatas = `${num}\n${caput}`
    .split(/[\r\n]+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const linhasUnicas: string[] = [];
  for (const l of linhasCandidatas) {
    const lNorm = l.toLowerCase();
    const jaExiste = linhasUnicas.some((existente) => existente.toLowerCase() === lNorm);
    if (!jaExiste) {
      linhasUnicas.push(l);
    }
  }

  if (linhasUnicas.length === 0) return num.trim();
  if (linhasUnicas.length === 1) return linhasUnicas[0];

  const primeira = linhasUnicas[0];
  const demais = linhasUnicas.slice(1);

  // Se alguma linha restante começar repetindo a primeira linha (ex: "TÍTULO I - DA APLICAÇÃO"), limpa o prefixo
  const escapedPrimeira = primeira.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  const regexPrimeira = new RegExp(`^${escapedPrimeira}\\s*[-–—:]*\\s*`, 'i');

  const subtitulos = demais
    .map((d) => d.replace(regexPrimeira, '').trim())
    .filter((d) => Boolean(d) && d.toLowerCase() !== primeira.toLowerCase());

  if (subtitulos.length > 0) {
    return deduplicarHierarquiaTexto(`${primeira} - ${subtitulos.join(' - ')}`);
  }

  return deduplicarHierarquiaTexto(primeira);
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
      currentParte = match ? match[0].trim() : normalizarTextoEstrutural(num, caput);
      currentTitulo = '';
      currentCapitulo = '';
      continue;
    }

    // 2. Detecta Linha de Livro (ex: "LIVRO I")
    if (/^\s*LIVRO\s+[IVXLCDM0-9]+/i.test(num) || /^\s*LIVRO\s+[IVXLCDM0-9]+/i.test(caput)) {
      currentLivro = normalizarTextoEstrutural(num, caput);
      currentTitulo = '';
      currentCapitulo = '';
      continue;
    }

    // 3. Detecta Linha de Título (ex: "TÍTULO I\nDA APLICAÇÃO DA LEI PENAL")
    if (/^\s*T[ÍI]TULO\s+[IVXLCDM0-9]+/i.test(num) || /^\s*T[ÍI]TULO\s+[IVXLCDM0-9]+/i.test(caput)) {
      currentTitulo = normalizarTextoEstrutural(num, caput);
      currentCapitulo = '';
      continue;
    }

    // 4. Detecta Linha de Capítulo (ex: "CAPÍTULO I\nDO CRIME")
    if (/^\s*CAP[ÍI]TULO\s+(?:[IVXLCDM0-9]+|[ÚU]NICO)/i.test(num) || /^\s*CAP[ÍI]TULO\s+(?:[IVXLCDM0-9]+|[ÚU]NICO)/i.test(caput)) {
      currentCapitulo = normalizarTextoEstrutural(num, caput);
      continue;
    }

    // Se for artigo real legislativo
    if (isArtigoReal(item)) {
      artigosEnriquecidos.push({
        ...item,
        parte: deduplicarHierarquiaTexto(currentParte || item.parte || ''),
        livro: deduplicarHierarquiaTexto(currentLivro || item.livro || ''),
        titulo: deduplicarHierarquiaTexto(currentTitulo || item.titulo || ''),
        capitulo: deduplicarHierarquiaTexto(currentCapitulo || item.capitulo || ''),
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

  // Tonalidade selecionada para gravação dos artigos (padrão 'super_animado')
  const [estiloNarracaoSelecionado, setEstiloNarracaoSelecionado] = useState<string>(() => {
    const saved = localStorage.getItem('admin_narracao_estilo_selecionado');
    if (!saved || saved === 'animado') {
      return 'super_animado';
    }
    return saved;
  });

  // Geração de narração individual
  const [gerandoArtigoNum, setGerandoArtigoNum] = useState<string | null>(null);
  const [apagandoArtigoNum, setApagandoArtigoNum] = useState<string | null>(null);
  const [artigoParaExcluir, setArtigoParaExcluir] = useState<ArtigoLei | null>(null);
  const [apagandoArtigo, setApagandoArtigo] = useState(false);
  const [progressoGeracao, setProgressoGeracao] = useState<{ parteAtual: number; totalPartes: number; rotulo: string } | null>(null);
  const [progressoDetalhado, setProgressoDetalhado] = useState<{
    artigoNumero: string;
    parteAtual: number;
    totalPartes: number;
    rotulo: string;
    porcentagem: number;
    segundosDecorridos: number;
    segundosEstimadosRestantes: number;
  } | null>(null);

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
  const [artigosPorLei, setArtigosPorLei] = useState<Record<string, ArtigoLei[]>>({});
  const [statusPorLei, setStatusPorLei] = useState<Record<string, Record<string, NarracaoArtigoRegistro>>>({});
  const [carregandoFila, setCarregandoFila] = useState(false);
  const [limiteFila, setLimiteFila] = useState(30);

  // Leis ativas na fila da automação (padrão multi-leis)
  const leisAtivas = useMemo(() => {
    if (Array.isArray(configAuto?.leis_ativas) && configAuto.leis_ativas.length > 0) {
      return configAuto.leis_ativas;
    }
    return [configAuto?.tabela_nome || 'CP_CODIGO_PENAL'];
  }, [configAuto?.leis_ativas, configAuto?.tabela_nome]);

  // Carrega artigos e status das leis ativas para alimentar a fila em tempo real
  useEffect(() => {
    if (selectedCat?.id !== 'automacao' || leisAtivas.length === 0) return;
    let mounted = true;
    setCarregandoFila(true);

    Promise.all(
      leisAtivas.map(async (tabela) => {
        const leiItem = LEIS_CATALOG.find((l) => l.tabela_nome === tabela);
        const leiId = leiItem?.id || tabela.toLowerCase();
        const [arts, status] = await Promise.all([
          fetchArtigosLei(leiId, tabela),
          buscarStatusNarracoes(tabela),
        ]);
        return { tabela, arts: arts || [], status: status || {} };
      })
    ).then((resultados) => {
      if (!mounted) return;
      const novosArtigos: Record<string, ArtigoLei[]> = {};
      const novosStatus: Record<string, Record<string, NarracaoArtigoRegistro>> = {};
      resultados.forEach((r) => {
        novosArtigos[r.tabela] = r.arts;
        novosStatus[r.tabela] = r.status;
      });
      setArtigosPorLei((prev) => ({ ...prev, ...novosArtigos }));
      setStatusPorLei((prev) => ({ ...prev, ...novosStatus }));
    }).catch((err) => {
      console.error('Erro ao carregar artigos para fila:', err);
    }).finally(() => {
      if (mounted) setCarregandoFila(false);
    });

    return () => { mounted = false; };
  }, [selectedCat?.id, leisAtivas]);

  // Cálculo da Fila Intercalada Round-Robin por relevância (Top Provas + Artigos Maiores)
  const filaIntercalada = useMemo(() => {
    if (leisAtivas.length === 0) return [];

    const listasPorLei: {
      lei: LeiCatalogItem;
      itens: { artigo: ArtigoLei; score: number; isTopProva: boolean; lenChars: number }[];
    }[] = [];

    leisAtivas.forEach((tab) => {
      const leiItem = LEIS_CATALOG.find((l) => l.tabela_nome === tab) || {
        id: tab.toLowerCase(),
        nome: tab.replace(/_/g, ' '),
        sigla: tab.split('_')[0] || tab,
        tabela_nome: tab,
        descricao: '',
        tipo: 'codigo',
        iconColor: '#f59e0b',
      };

      const arts = artigosPorLei[tab] || [];
      const statusMap = statusPorLei[tab] || {};

      const pendentes = arts
        .filter((a) => {
          if (!isArtigoReal(a)) return false;
          const numLimpo = String(a.numero || '').replace(/^[Aa]rt\.?\s*/i, '').trim();
          const numDigitos = numLimpo.replace(/\D/g, '');
          const jaNarrado = !!(
            statusMap[numLimpo] ||
            statusMap[a.numero] ||
            (numDigitos && (statusMap[numDigitos] || statusMap[`${numDigitos}º`] || statusMap[`Art. ${numDigitos}`]))
          );
          return !jaNarrado;
        })
        .map((art) => {
          const { score, isTopProva, lenChars } = calcularScoreArtigo(art, tab);
          return { artigo: art, score, isTopProva, lenChars };
        });

      // Ordena por score decrescente (Top Prova + Artigos Maiores primeiro!)
      pendentes.sort((a, b) => b.score - a.score);

      listasPorLei.push({ lei: leiItem, itens: pendentes });
    });

    // Intercalação 1 a 1 entre as leis ativas (Round-Robin)
    const filaFinal: {
      posicao: number;
      lei: LeiCatalogItem;
      artigo: ArtigoLei;
      tabelaNome: string;
      numLimpo: string;
      tamanhoChars: number;
      isTopProva: boolean;
      estimativaSegundos: number;
    }[] = [];

    const maxItens = Math.max(...listasPorLei.map((l) => l.itens.length), 0);
    if (maxItens === 0) return [];

    const offsetIndice = (configAuto?.indice_lei_atual ?? 0) % listasPorLei.length;

    for (let rodada = 0; rodada < maxItens; rodada++) {
      for (let i = 0; i < listasPorLei.length; i++) {
        const idxLei = (offsetIndice + i) % listasPorLei.length;
        const grupo = listasPorLei[idxLei];
        if (grupo.itens[rodada]) {
          const item = grupo.itens[rodada];
          const numLimpo = String(item.artigo.numero || '').replace(/^[Aa]rt\.?\s*/i, '').trim();
          const estimativa = Math.max(10, Math.round(item.lenChars / 18));
          filaFinal.push({
            posicao: filaFinal.length + 1,
            lei: grupo.lei,
            artigo: item.artigo,
            tabelaNome: grupo.lei.tabela_nome,
            numLimpo,
            tamanhoChars: item.lenChars,
            isTopProva: item.isTopProva,
            estimativaSegundos: estimativa,
          });
        }
      }
    }

    return filaFinal;
  }, [leisAtivas, artigosPorLei, statusPorLei, configAuto?.indice_lei_atual]);

  // Carrega configuração de automação ao montar
  useEffect(() => {
    obterConfigAutomacao().then(setConfigAuto).catch(() => {});
    buscarLogsAutomacao().then(setLogsAuto).catch(() => {});
  }, []);

  // Carrega artigos quando uma lei é selecionada e escuta novidades em tempo real
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

    // Realtime: atualiza instantaneamente quando uma narração é gerada pelo Vade Mecum ou automação
    const canalNarracoes = supabase
      .channel(`admin-narracoes-${selectedLei.tabela_nome}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'narracoes_artigos',
        },
        async () => {
          try {
            const statusAtualizado = await buscarStatusNarracoes(selectedLei.tabela_nome);
            if (statusAtualizado) {
              setStatusNarracoes(statusAtualizado);
            }
          } catch (e) {
            console.warn('[AdminNarracaoLeis] Erro ao sincronizar realtime de narrações:', e);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(canalNarracoes);
    };
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

  // Reprodução sequencial caso as partes ainda não tenham sido unificadas em 1 único WAV
  const tocarArtigoSequencial = (partes: ArtigoParte[], artigoNum: string) => {
    const partesComAudio = partes.filter((p) => !!p.audioUrl);
    if (partesComAudio.length === 0) {
      toast.info('Nenhum áudio disponível para este artigo');
      return;
    }

    let idx = 0;
    const tocarProxima = () => {
      if (idx >= partesComAudio.length) {
        setTocandoUrl(null);
        setReproduzindoSequencial(null);
        setBlocoAtivoId(null);
        return;
      }

      const parte = partesComAudio[idx];
      idx++;
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      const a = audioRef.current;
      a.pause();
      a.src = parte.audioUrl!;
      setTocandoUrl(parte.audioUrl!);
      setReproduzindoSequencial(artigoNum);
      setBlocoAtivoId(parte.id);
      a.play().catch(() => {});
      a.onended = tocarProxima;
    };

    tocarProxima();
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

  // Gera narração contínua inteligente para um artigo com progresso em porcentagem e tempo estimado
  const handleGerarNarraçãoIndividual = async (artigo: ArtigoLei, leiCustom?: LeiCatalogItem) => {
    const leiAlvo = leiCustom || selectedLei;
    if (!leiAlvo || gerandoArtigoNum) return;
    const chaveGerando = `${leiAlvo.tabela_nome}_${artigo.numero}`;
    setGerandoArtigoNum(chaveGerando);

    // Identifica o estilo selecionado pelo usuário (padrão super animado)
    const estiloObj = ESTILOS_TOM.find((e) => e.id === estiloNarracaoSelecionado) || ESTILOS_TOM[0];
    const estiloPrompt = estiloObj.prompt;
    const voz = configAuto?.voz_padrao || 'Kore';

    // Estimativa de tempo com base no tamanho do artigo (mínimo 5s, máximo 25s por chamada)
    const totalChars = (artigo.caput || '').length + (artigo.titulo || '').length;
    let tempoEstimadoParteSegundos = Math.max(5, Math.min(22, Math.round(totalChars / 45)));

    let parteAtualNum = 1;
    let totalPartesNum = 1;
    let rotuloAtual = 'Artigo Completo';
    let startTime = Date.now();
    let porcentagemAcumulada = 3;

    // Toast inicial com porcentagem e tempo estimado
    const toastId = toast.loading(`Narrando Artigo ${artigo.numero} (${leiAlvo.sigla || leiAlvo.nome})... 3% (~${tempoEstimadoParteSegundos}s restantes)`);

    setProgressoGeracao({ parteAtual: 1, totalPartes: 1, rotulo: rotuloAtual });
    setProgressoDetalhado({
      artigoNumero: `${leiAlvo.sigla ? leiAlvo.sigla + ' ' : ''}${artigo.numero}`,
      parteAtual: 1,
      totalPartes: 1,
      rotulo: rotuloAtual,
      porcentagem: 3,
      segundosDecorridos: 0,
      segundosEstimadosRestantes: tempoEstimadoParteSegundos,
    });

    // Timer suave a cada 250ms simulando subida orgânica de porcentagem e tempo restante
    const timer = setInterval(() => {
      const decorridos = Math.max(0.1, (Date.now() - startTime) / 1000);
      const restantes = Math.max(1, Math.round(tempoEstimadoParteSegundos - decorridos));

      // Calcula fatia da parte atual em relação ao total de partes
      const baseFatia = ((parteAtualNum - 1) / totalPartesNum) * 100;
      const progressoParte = Math.min(94, Math.max(5, Math.round((decorridos / tempoEstimadoParteSegundos) * 92)));
      const porcentagemGlobal = Math.min(96, Math.max(porcentagemAcumulada, Math.round(baseFatia + (progressoParte / totalPartesNum))));
      porcentagemAcumulada = porcentagemGlobal;

      setProgressoDetalhado({
        artigoNumero: `${leiAlvo.sigla ? leiAlvo.sigla + ' ' : ''}${artigo.numero}`,
        parteAtual: parteAtualNum,
        totalPartes: totalPartesNum,
        rotulo: rotuloAtual,
        porcentagem: porcentagemGlobal,
        segundosDecorridos: Math.round(decorridos),
        segundosEstimadosRestantes: restantes,
      });

      // Atualiza o toast com a porcentagem e tempo estimado
      toast.loading(
        `Narrando Artigo ${artigo.numero} (${leiAlvo.sigla || leiAlvo.nome})... ${porcentagemGlobal}% (~${restantes}s restantes)`,
        { id: toastId }
      );
    }, 250);

    try {
      const res = await gerarNarracaoArtigoFatiada(
        artigo,
        leiAlvo.tabela_nome,
        leiAlvo.nome,
        voz,
        estiloPrompt,
        (parteAtual, totalPartes, rotulo) => {
          parteAtualNum = parteAtual;
          totalPartesNum = totalPartes;
          rotuloAtual = rotulo;
          startTime = Date.now();
          tempoEstimadoParteSegundos = 8;
          setProgressoGeracao({ parteAtual, totalPartes, rotulo });
        }
      );

      clearInterval(timer);

      // Marca 100% no progresso
      setProgressoDetalhado({
        artigoNumero: `${leiAlvo.sigla ? leiAlvo.sigla + ' ' : ''}${artigo.numero}`,
        parteAtual: totalPartesNum,
        totalPartes: totalPartesNum,
        rotulo: rotuloAtual,
        porcentagem: 100,
        segundosDecorridos: Math.round((Date.now() - startTime) / 1000),
        segundosEstimadosRestantes: 0,
      });

      const numLimpo = String(artigo.numero).replace(/^[Aa]rt\.?\s*/i, '').trim();
      const duracaoSegundos = res.duracaoSegundos || 0;

      const reg: NarracaoArtigoRegistro = {
        artigo_numero: numLimpo,
        audio_url: res.audioUrl,
        partes: res.partes,
        duracao_segundos: duracaoSegundos,
      };

      setStatusNarracoes((prev) => ({
        ...prev,
        [numLimpo]: reg,
        [artigo.numero]: reg,
      }));

      setStatusPorLei((prev) => {
        const leiTab = leiAlvo.tabela_nome;
        const currentLeiStatus = prev[leiTab] || {};
        return {
          ...prev,
          [leiTab]: {
            ...currentLeiStatus,
            [numLimpo]: reg,
            [artigo.numero]: reg,
          },
        };
      });

      const msg = res.partes.length === 1
        ? `Artigo ${artigo.numero} (${leiAlvo.sigla || leiAlvo.nome}) gravado e persistido! ${duracaoSegundos}s (${estiloObj.label}).`
        : `Artigo ${artigo.numero} (${leiAlvo.sigla || leiAlvo.nome}) gravado em ${res.partes.length} partes! ${duracaoSegundos}s total.`;
      toast.success(msg, { id: toastId });
    } catch (err: any) {
      clearInterval(timer);
      console.error('Erro na narração individual:', err);
      toast.error(`Falha ao narrar: ${err.message || 'Erro desconhecido'}`, { id: toastId });
    } finally {
      clearInterval(timer);
      setGerandoArtigoNum(null);
      setProgressoGeracao(null);
      setTimeout(() => setProgressoDetalhado(null), 1200);
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

  // Gerar todas as 5 versões simultaneamente
  const handleGerarTodas4Versoes = async () => {
    if (!textoTeste.trim()) {
      toast.error('Insira o texto da amostra jurídica');
      return;
    }

    const estilosPendentes = ESTILOS_TOM.filter((e) => !testesCache[e.id]?.audio_url);

    if (estilosPendentes.length === 0) {
      toast.info(`Todas as ${ESTILOS_TOM.length} versões já estão salvas no Supabase!`);
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
  const handleDispararLoteAgora = async (tabelaEspecifica?: string) => {
    setDisparandoManual(true);
    const toastId = toast.loading('Processando próximo artigo da fila de automação...');

    try {
      const res = await dispararAutomacaoLoteManual({
        tabelaNome: tabelaEspecifica,
        prioridade: configAuto?.prioridade || 'artigos_maiores',
        voz: configAuto?.voz_padrao || 'Kore',
      });

      if (res?.artigo) {
        toast.success(`Artigo ${res.artigo} (${res.tabela_nome || ''}) gravado com sucesso!`, { id: toastId });
        if (res.tabela_nome) {
          const novoStatus = await buscarStatusNarracoes(res.tabela_nome);
          setStatusPorLei((prev) => ({ ...prev, [res.tabela_nome]: novoStatus }));
        }
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

  const handleAdicionarLeiFila = async (tabelaNome: string) => {
    if (leisAtivas.includes(tabelaNome)) return;
    const novasLeis = [...leisAtivas, tabelaNome];
    setSalvandoAuto(true);
    try {
      await salvarConfigAutomacao({ leis_ativas: novasLeis, tabela_nome: novasLeis[0] });
      setConfigAuto((prev) => prev ? { ...prev, leis_ativas: novasLeis, tabela_nome: novasLeis[0] } : prev);
      toast.success('Legislação adicionada à rotação da automação!');
    } catch {
      toast.error('Erro ao adicionar lei');
    } finally {
      setSalvandoAuto(false);
    }
  };

  const handleRemoverLeiFila = async (tabelaNome: string) => {
    if (leisAtivas.length <= 1) {
      toast.warning('A fila precisa conter ao menos uma lei ativa!');
      return;
    }
    const novasLeis = leisAtivas.filter((t) => t !== tabelaNome);
    setSalvandoAuto(true);
    try {
      await salvarConfigAutomacao({ leis_ativas: novasLeis, tabela_nome: novasLeis[0] });
      setConfigAuto((prev) => prev ? { ...prev, leis_ativas: novasLeis, tabela_nome: novasLeis[0] } : prev);
      toast.info('Legislação removida da rotação');
    } catch {
      toast.error('Erro ao remover lei');
    } finally {
      setSalvandoAuto(false);
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

          {/* Seletor Visual de Tonalidade para Narração */}
          <div className="p-4 rounded-2xl border border-border/70 bg-gradient-to-br from-card/90 via-card/60 to-secondary/30 backdrop-blur-md shadow-md space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Tonalidade da Narração (Gemini TTS)
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Voz: <strong className="text-foreground">{configAuto?.voz_padrao || 'Kore'}</strong> · Selecione a versão para gravar
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
              {ESTILOS_TOM.map((est) => {
                const isSelected = estiloNarracaoSelecionado === est.id;
                const isPadrao = est.id === 'super_animado';

                return (
                  <button
                    key={est.id}
                    type="button"
                    onClick={() => {
                      setEstiloNarracaoSelecionado(est.id);
                      localStorage.setItem('admin_narracao_estilo_selecionado', est.id);
                      toast.info(`Tonalidade "${est.label}" selecionada para as próximas gravações!`);
                    }}
                    className={cn(
                      'p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-1 group active:scale-[0.98]',
                      isSelected
                        ? 'bg-primary/15 border-primary ring-2 ring-primary/30 shadow-sm'
                        : 'bg-secondary/30 border-border/60 hover:bg-secondary/60 hover:border-border'
                    )}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={cn(
                          'w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 border transition-all',
                          isSelected
                            ? 'bg-primary border-primary text-primary-foreground font-bold'
                            : 'border-border/80 group-hover:border-primary/50'
                        )}>
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                        </span>
                        <span className={cn(
                          'text-xs font-bold truncate',
                          isSelected ? 'text-primary' : 'text-foreground'
                        )}>
                          {est.label}
                        </span>
                      </div>

                      {isPadrao && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
                          Padrão
                        </span>
                      )}
                    </div>
                    <p className="text-[10.5px] text-muted-foreground line-clamp-1 pl-5.5">
                      {est.prompt}
                    </p>
                  </button>
                );
              })}
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
                              {reg?.duracao_segundos ? (
                                <span className="ml-1 text-emerald-300 font-mono font-bold">
                                  • ⏱ {reg.duracao_segundos}s
                                </span>
                              ) : null}
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
                              {[
                                deduplicarHierarquiaTexto(artigo.parte || ''),
                                deduplicarHierarquiaTexto(artigo.livro || ''),
                                deduplicarHierarquiaTexto(artigo.titulo || ''),
                                deduplicarHierarquiaTexto(artigo.capitulo || ''),
                              ].filter(Boolean).join(' › ')}
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
                            className={cn(
                              'flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold active:scale-95 transition-all disabled:opacity-60',
                              estaGerando
                                ? 'bg-primary/20 border-primary text-primary shadow-sm'
                                : 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20'
                            )}
                          >
                            {estaGerando ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                <span className="font-mono font-bold">
                                  {progressoDetalhado?.porcentagem || 5}%
                                </span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-4 h-4" />
                                <span className="hidden sm:inline">Gerar Áudio</span>
                              </>
                            )}
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

                    {/* Barra de Progresso Durante a Geração com Porcentagem e Estimativa de Segundos */}
                    {estaGerando && (progressoDetalhado || progressoGeracao) && (
                      <div className="px-4 pb-3">
                        <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-xs shadow-inner">
                          <div className="flex items-center justify-between mb-1.5 text-primary font-semibold">
                            <span className="flex items-center gap-1.5 truncate">
                              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                              Gerando áudio: <strong>{progressoDetalhado?.rotulo || progressoGeracao?.rotulo || 'Artigo Completo'}</strong>
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-mono font-bold text-sm text-foreground bg-primary/20 px-2 py-0.5 rounded-lg border border-primary/30">
                                {progressoDetalhado?.porcentagem || 5}%
                              </span>
                              <span className="text-muted-foreground font-mono text-[11px]">
                                {progressoDetalhado?.parteAtual || progressoGeracao?.parteAtual || 1} de {progressoDetalhado?.totalPartes || progressoGeracao?.totalPartes || 1}
                              </span>
                            </div>
                          </div>

                          <div className="w-full h-2 rounded-full bg-secondary/80 overflow-hidden relative">
                            <div
                              className="h-full bg-gradient-to-r from-primary via-rose-500 to-amber-500 transition-all duration-300 rounded-full"
                              style={{ width: `${Math.max(4, progressoDetalhado?.porcentagem || 8)}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground font-mono">
                            <span className="flex items-center gap-1 text-primary">
                              <Clock className="w-3 h-3" />
                              Tempo estimado restante: <strong>~{progressoDetalhado?.segundosEstimadosRestantes ?? 8}s</strong>
                            </span>
                            <span>
                              Decorrido: <strong>{progressoDetalhado?.segundosDecorridos || 0}s</strong>
                            </span>
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
                                    {parte.duracaoSegundos ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-secondary/80 text-emerald-400 border border-emerald-500/20">
                                        ⏱ {parte.duracaoSegundos}s
                                      </span>
                                    ) : null}
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

          {/* As 5 Tonalidades e Prévias Simultâneas */}
          <div className="p-4 rounded-2xl border border-border/60 bg-card/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/40">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-primary" />
                  5 Versões de Tonalidade (Gemini TTS)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {carregandoCache ? (
                    'Consultando cache no Supabase...'
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-emerald-400" />
                      <strong>{totalVersoesSalvas} de {ESTILOS_TOM.length}</strong> versões salvas no Supabase
                    </span>
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={handleGerarTodas4Versoes}
                disabled={gerandoTodas || totalVersoesSalvas === ESTILOS_TOM.length}
                className={cn(
                  'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50',
                  totalVersoesSalvas === ESTILOS_TOM.length
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
              >
                {gerandoTodas ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Gerando Versões...</span>
                  </>
                ) : totalVersoesSalvas === ESTILOS_TOM.length ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Todas as 5 Salvas</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gerar 5 Versões Simultâneas</span>
                  </>
                )}
              </button>
            </div>

            {/* Grid com os cards de tonalidades */}
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
                              <>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                                  <CheckCircle2 className="w-3 h-3" /> Salvo no Supabase
                                </span>
                                {cacheItem?.duracao_segundos ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                                    ⏱ {cacheItem.duracao_segundos}s gerados
                                  </span>
                                ) : null}
                              </>
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
                                  : cacheItem?.duracao_segundos
                                  ? `${cacheItem.duracao_segundos}s • WAV`
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

          {/* Seletor Multi-Leis da Automação */}
          <div className="p-5 rounded-2xl border border-border/60 bg-card/60 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Legislações na Rotação Automática ({leisAtivas.length})
              </h3>
              <span className="text-[11px] text-muted-foreground font-medium">
                Intercalação Round-Robin (1 artigo de cada)
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              Adicione as leis que você deseja que a automação processe. O robô irá narrar <strong>1 artigo de cada lei selecionada</strong> a cada intervalo, alternando automaticamente no ciclo.
            </p>

            {/* Tags das Leis Ativas */}
            <div className="flex flex-wrap gap-2 pt-1">
              {leisAtivas.map((tab) => {
                const leiItem = LEIS_CATALOG.find((l) => l.tabela_nome === tab);
                const sigla = leiItem?.sigla || tab.split('_')[0];
                const nome = leiItem?.nome || tab;
                const cor = leiItem?.iconColor || '#f59e0b';

                return (
                  <div
                    key={tab}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/70 bg-secondary/50 text-xs font-semibold text-foreground shadow-sm transition-all"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cor }}
                    />
                    <span className="font-bold text-primary">{sigla}</span>
                    <span className="truncate max-w-[180px] text-muted-foreground">{nome}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoverLeiFila(tab)}
                      disabled={salvandoAuto || leisAtivas.length <= 1}
                      className="ml-1 text-muted-foreground hover:text-rose-400 p-0.5 rounded-full hover:bg-rose-500/15 disabled:opacity-40"
                      title={leisAtivas.length <= 1 ? 'Mínimo de 1 lei obrigatória' : 'Remover da fila'}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Botões Rápidos para Adicionar Leis Populares */}
            <div className="pt-2 border-t border-border/40 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Adicionar Legislação à Rotação:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { tab: 'CP_CODIGO_PENAL', sigla: 'CP', nome: 'Código Penal' },
                  { tab: 'CC_CODIGO_CIVIL', sigla: 'CC', nome: 'Código Civil' },
                  { tab: 'CF88_CONSTITUICAO_FEDERAL', sigla: 'CF/88', nome: 'Constituição Federal' },
                  { tab: 'CLT_CONSOLIDACAO_LEIS_TRABALHO', sigla: 'CLT', nome: 'Trabalhista (CLT)' },
                  { tab: 'CPC_CODIGO_PROCESSO_CIVIL', sigla: 'CPC', nome: 'Processo Civil' },
                  { tab: 'CPP_CODIGO_PROCESSO_PENAL', sigla: 'CPP', nome: 'Processo Penal' },
                  { tab: 'CDC_CODIGO_DEFESA_CONSUMIDOR', sigla: 'CDC', nome: 'Consumidor' },
                  { tab: 'ECA_ESTATUTO_CRIANCA_ADOLESCENTE', sigla: 'ECA', nome: 'ECA' },
                ].map((item) => {
                  const jaAtiva = leisAtivas.includes(item.tab);
                  return (
                    <button
                      key={item.tab}
                      type="button"
                      onClick={() => jaAtiva ? handleRemoverLeiFila(item.tab) : handleAdicionarLeiFila(item.tab)}
                      disabled={salvandoAuto}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 active:scale-95',
                        jaAtiva
                          ? 'bg-primary/20 border-primary/40 text-primary font-bold'
                          : 'bg-secondary/40 border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                      )}
                    >
                      {jaAtiva ? <Check className="w-3 h-3 text-primary" /> : <Plus className="w-3 h-3" />}
                      <span>{item.sigla}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dropdown com todo o LEIS_CATALOG */}
              <div className="pt-2">
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAdicionarLeiFila(e.target.value);
                    }
                  }}
                  disabled={salvandoAuto}
                  className="w-full p-2.5 rounded-xl bg-secondary/40 border border-border/60 text-foreground font-medium text-xs"
                >
                  <option value="">+ Selecionar outra lei do catálogo para adicionar à fila...</option>
                  {LEIS_CATALOG.filter((l) => !leisAtivas.includes(l.tabela_nome)).map((l) => (
                    <option key={l.id} value={l.tabela_nome}>
                      {l.sigla} — {l.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Regra de Prioridade Padronizada */}
            <div className="p-3.5 rounded-xl bg-secondary/20 border border-border/50 text-muted-foreground space-y-1">
              <div className="flex items-center gap-2 text-foreground font-bold text-xs">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Hierarquia Padrão da Fila (Artigos Maiores + Top Provas)</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Dentro de cada lei participante, o algoritmo pontua os artigos mais cobrados em exames (OAB e concursos) combinados com a extensão de caracteres do texto. Os artigos de maior impacto e densidade são sempre processados primeiro.
              </p>
            </div>
          </div>

          {/* PAINEL VIVO: FILA DE EXECUÇÃO DOS ARTIGOS (ORDEM DA AUTOMAÇÃO) */}
          <div className="p-5 rounded-2xl border border-border/60 bg-card/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/40">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-emerald-400" />
                  Fila de Execução da Automação ({filaIntercalada.length} artigos)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ordem real em que o cron do Supabase gravará os próximos artigos:
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDispararLoteAgora()}
                  disabled={disparandoManual || filaIntercalada.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
                >
                  {disparandoManual ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  <span>Disparar Próximo da Fila (#1)</span>
                </button>
              </div>
            </div>

            {carregandoFila ? (
              <div className="p-8 text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                <p className="text-xs text-muted-foreground">Calculando a ordem intercalada das leis selecionadas...</p>
              </div>
            ) : filaIntercalada.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-secondary/20 border border-border/40 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-sm text-foreground">Todos os artigos narrados!</h4>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Não existem artigos pendentes nas legislações ativas no momento. Adicione mais leis acima para continuar a expansão.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* DESTAQUE: Artigo #1 (O Próximo Imediato a ser gravado) */}
                {filaIntercalada[0] && (
                  <div className="p-4 rounded-xl border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 via-card to-secondary/30 shadow-md space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md font-mono text-xs font-black bg-emerald-500 text-black shadow-sm">
                          #1 PRÓXIMO NA FILA
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-md text-xs font-bold text-white shadow-sm"
                          style={{ backgroundColor: filaIntercalada[0].lei.iconColor || '#e11d48' }}
                        >
                          {filaIntercalada[0].lei.sigla} · {filaIntercalada[0].lei.nome}
                        </span>
                        {filaIntercalada[0].isTopProva && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400">
                            ⭐ Top Provas & Exames
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] font-mono text-muted-foreground">
                        {filaIntercalada[0].tamanhoChars} caracteres · ~{Math.round(filaIntercalada[0].estimativaSegundos / 60) || 1} min
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-foreground">
                        Artigo {filaIntercalada[0].numLimpo}
                        {filaIntercalada[0].artigo.titulo ? ` — ${filaIntercalada[0].artigo.titulo}` : ''}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 italic">
                        "{filaIntercalada[0].artigo.caput || filaIntercalada[0].artigo.texto || 'Sem texto de caput'}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                      <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Será narrado no próximo tick do cron (ou clique ao lado)
                      </span>

                      <button
                        onClick={() => handleGerarNarraçãoIndividual(filaIntercalada[0].artigo, filaIntercalada[0].lei)}
                        disabled={!!gerandoArtigoNum}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50"
                      >
                        {gerandoArtigoNum === `${filaIntercalada[0].tabelaNome}_${filaIntercalada[0].artigo.numero}` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                        <span>Narrar este Artigo Agora</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Lista com os próximos artigos da fila */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block px-1">
                    Sequência Intercalada da Automação:
                  </span>

                  <div className="divide-y divide-border/40 rounded-xl border border-border/40 overflow-hidden bg-background/50 text-xs">
                    {filaIntercalada.slice(1, limiteFila).map((item) => (
                      <div
                        key={`${item.tabelaNome}_${item.artigo.numero}_${item.posicao}`}
                        className="p-3 flex items-center justify-between gap-3 hover:bg-secondary/30 transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="font-mono font-bold text-muted-foreground text-[11px] w-7 shrink-0 text-right">
                            #{item.posicao}
                          </span>

                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-black text-white shrink-0"
                            style={{ backgroundColor: item.lei.iconColor || '#e11d48' }}
                          >
                            {item.lei.sigla}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-foreground">
                                Art. {item.numLimpo}
                              </span>
                              {item.artigo.titulo && (
                                <span className="text-muted-foreground truncate max-w-[200px]">
                                  {item.artigo.titulo}
                                </span>
                              )}
                              {item.isTopProva && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
                                  ⭐ Top Prova
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                              {item.artigo.caput || item.artigo.texto || ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[10px] font-mono text-muted-foreground hidden sm:inline-block">
                            {item.tamanhoChars} chars
                          </span>

                          <button
                            onClick={() => handleGerarNarraçãoIndividual(item.artigo, item.lei)}
                            disabled={!!gerandoArtigoNum}
                            className="px-2.5 py-1 rounded-md bg-secondary border border-border text-foreground hover:bg-primary hover:text-primary-foreground font-semibold text-[11px] transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50"
                            title="Gravar este artigo antecipadamente"
                          >
                            {gerandoArtigoNum === `${item.tabelaNome}_${item.artigo.numero}` ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Play className="w-3 h-3" />
                            )}
                            <span className="hidden sm:inline">Gravar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filaIntercalada.length > limiteFila && (
                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => setLimiteFila((prev) => prev + 30)}
                        className="px-4 py-2 rounded-xl bg-secondary/50 border border-border/60 hover:bg-secondary text-xs text-foreground font-semibold transition-all"
                      >
                        Carregar mais {Math.min(30, filaIntercalada.length - limiteFila)} artigos da fila ({filaIntercalada.length - limiteFila} restantes)...
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
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
