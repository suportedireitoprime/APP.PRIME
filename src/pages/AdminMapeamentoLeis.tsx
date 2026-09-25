import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scale, BookOpen, Shield, ScrollText, HeartHandshake,
  Search, RefreshCw, ExternalLink, ChevronRight, CheckCircle2,
  Clock, Loader2, Eye, ArrowLeft, History, AlertTriangle, Check, X,
  ListFilter, RotateCcw
} from 'lucide-react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { LEIS_CATALOG, type LeiCatalogItem } from '@/data/leisCatalog';
import { supabase } from '@/integrations/supabase/client';
import LeiDetailView from '@/components/vademecum/views/LeiDetailView';
import { toast } from 'sonner';

interface CategoriaDef {
  id: string;
  nome: string;
  desc: string;
  icon: any;
  color: string;
}

import { extractMesAno, normalizeAlteracoes, getScrapedAlteracoes, SEED_CP_ALTERACOES, type ScrapedArticleUpdate } from '@/data/leiAlteracoesScraped';

export interface ExtracaoHistoricoItem {
  id: string;
  data: string;
  timestamp: number;
  artigos: number;
  status: 'sucesso' | 'erro';
  detalhe?: string;
}

const CATEGORIAS_DEF: CategoriaDef[] = [
  { id: 'codigo', nome: 'Códigos', desc: 'CP, CC, CPC, CPP, CLT, CTN, CDC, CTB e outros', icon: Scale, color: '#f59e0b' },
  { id: 'estatuto', nome: 'Estatutos', desc: 'ECA, Idoso, PCD, OAB, Igualdade Racial, Desarmamento', icon: BookOpen, color: '#ec4899' },
  { id: 'constituicao', nome: 'Constituição Federal', desc: 'Carta Magna de 1988 e emendas', icon: Shield, color: '#10b981' },
  { id: 'lei-especial', nome: 'Leis Especiais', desc: 'Maria da Penha, Drogas, Licitações, LGPD, Falências', icon: ScrollText, color: '#8b5cf6' },
  { id: 'previdenciario', nome: 'Previdenciário', desc: 'Benefícios, Custeio, Previdência Complementar e LOAS', icon: HeartHandshake, color: '#06b6d4' },
];

export default function AdminMapeamentoLeis() {
  const navigate = useNavigate();
  const [selectedCat, setSelectedCat] = useState<CategoriaDef | null>(null);
  const [busca, setBusca] = useState('');
  const [extraindoSlug, setExtraindoSlug] = useState<string | null>(null);
  const [progressoExtraindo, setProgressoExtraindo] = useState<Record<string, number>>({});
  const [etapaExtraindo, setEtapaExtraindo] = useState<Record<string, string>>({});
  const [lastScrapes, setLastScrapes] = useState<Record<string, string>>({});
  const [historicoExtracoes, setHistoricoExtracoes] = useState<Record<string, ExtracaoHistoricoItem[]>>({});
  const [modalHistoricoExtracoesLei, setModalHistoricoExtracoesLei] = useState<LeiCatalogItem | null>(null);
  const [aprovados, setAprovados] = useState<Record<string, boolean>>({});
  const [triagem, setTriagem] = useState<Record<string, boolean>>({});
  const [previaLei, setPreviaLei] = useState<LeiCatalogItem | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<'todas' | 'triagem' | 'aprovadas' | 'pendentes'>('todas');

  // Estados do Modo Histórico da Lei
  const [historicoLei, setHistoricoLei] = useState<LeiCatalogItem | null>(null);
  const [alteracoes, setAlteracoes] = useState<ScrapedArticleUpdate[]>([]);
  const [carregandoAlteracoes, setCarregandoAlteracoes] = useState(false);
  const [anoFiltro, setAnoFiltro] = useState<string>('Todos');
  const [buscaArtigoHistorico, setBuscaArtigoHistorico] = useState('');
  const [sincronizandoArtigo, setSincronizandoArtigo] = useState<string | null>(null);

  // Carrega histórico de última extração, status de aprovação e histórico de extrações anteriores
  useEffect(() => {
    const loadedScrapes: Record<string, string> = {};
    const loadedAprovados: Record<string, boolean> = {};
    const loadedTriagem: Record<string, boolean> = {};
    const loadedHistoricos: Record<string, ExtracaoHistoricoItem[]> = {};

    LEIS_CATALOG.forEach(l => {
      const dt = localStorage.getItem(`vade_scrape_${l.id}`) ||
                 localStorage.getItem(`vade_scrape_${l.tabela_nome}`);
      if (dt) loadedScrapes[l.id] = dt;

      const ap = localStorage.getItem(`vade_aprovado_${l.id}`) === 'true';
      if (ap) loadedAprovados[l.id] = true;

      // Status de Triagem: explícito no localStorage ou, se extraído e não aprovado, entra por padrão em triagem
      const trRaw = localStorage.getItem(`vade_triagem_${l.id}`);
      if (trRaw !== null) {
        loadedTriagem[l.id] = trRaw === 'true';
      } else if (dt && !ap) {
        loadedTriagem[l.id] = true;
      }

      const histRaw = localStorage.getItem(`vade_scrape_history_${l.id}`);
      if (histRaw) {
        try {
          loadedHistoricos[l.id] = JSON.parse(histRaw);
        } catch {}
      } else if (dt) {
        loadedHistoricos[l.id] = [{
          id: `hist_init_${l.id}`,
          data: dt,
          timestamp: Date.now(),
          artigos: l.id === 'cp' ? 428 : 0,
          status: 'sucesso',
          detalhe: 'Extração registrada com sucesso'
        }];
      }
    });

    setLastScrapes(loadedScrapes);
    setAprovados(loadedAprovados);
    setTriagem(loadedTriagem);
    setHistoricoExtracoes(loadedHistoricos);
  }, []);

  // Contadores por status dentro da categoria selecionada
  const counts = useMemo(() => {
    if (!selectedCat) return { total: 0, triagem: 0, aprovadas: 0, pendentes: 0 };
    const leisCat = LEIS_CATALOG.filter(l => l.tipo === selectedCat.id);
    const aprovadasCount = leisCat.filter(l => !!aprovados[l.id]).length;
    const triagemCount = leisCat.filter(l => !aprovados[l.id] && !!triagem[l.id]).length;
    const pendentesCount = leisCat.filter(l => !aprovados[l.id] && !triagem[l.id]).length;
    return {
      total: leisCat.length,
      triagem: triagemCount,
      aprovadas: aprovadasCount,
      pendentes: pendentesCount,
    };
  }, [selectedCat, aprovados, triagem]);

  // Leis da categoria selecionada ou filtradas pela busca e status
  const leisFiltradas = useMemo(() => {
    let list = selectedCat
      ? LEIS_CATALOG.filter(l => l.tipo === selectedCat.id)
      : [];

    if (filtroStatus === 'triagem') {
      list = list.filter(l => !aprovados[l.id] && !!triagem[l.id]);
    } else if (filtroStatus === 'aprovadas') {
      list = list.filter(l => !!aprovados[l.id]);
    } else if (filtroStatus === 'pendentes') {
      list = list.filter(l => !aprovados[l.id] && !triagem[l.id]);
    }

    if (busca.trim()) {
      const q = busca.toLowerCase();
      list = list.filter(l =>
        l.nome.toLowerCase().includes(q) ||
        l.sigla.toLowerCase().includes(q) ||
        l.descricao.toLowerCase().includes(q) ||
        (l.tags && l.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    return list;
  }, [selectedCat, filtroStatus, aprovados, triagem, busca]);

  // Função para executar a extração / re-extração da lei com porcentagem e histórico
  const handleExtrairLei = async (lei: LeiCatalogItem) => {
    if (!lei.url_planalto) {
      toast.error(`A lei ${lei.sigla} não possui URL oficial do Planalto configurada.`);
      return;
    }

    setExtraindoSlug(lei.id);
    setProgressoExtraindo(prev => ({ ...prev, [lei.id]: 8 }));
    setEtapaExtraindo(prev => ({ ...prev, [lei.id]: 'Conectando ao Planalto...' }));
    const toastId = toast.loading(`Iniciando extração de ${lei.nome} no Planalto...`);

    // Timer de progressão gradual de porcentagem (0% a 95%)
    const progressTimer = setInterval(() => {
      setProgressoExtraindo(prev => {
        const cur = prev[lei.id] || 8;
        if (cur < 28) {
          setEtapaExtraindo(e => ({ ...e, [lei.id]: 'Baixando HTML oficial do Planalto...' }));
          return cur + 4;
        } else if (cur < 58) {
          setEtapaExtraindo(e => ({ ...e, [lei.id]: 'Estruturando hierarquia e artigos...' }));
          return cur + 3;
        } else if (cur < 86) {
          setEtapaExtraindo(e => ({ ...e, [lei.id]: 'Gravando artigos no banco de dados...' }));
          return cur + 2;
        } else if (cur < 95) {
          setEtapaExtraindo(e => ({ ...e, [lei.id]: 'Finalizando indexação...' }));
          return cur + 1;
        }
        return cur;
      });
    }, 350);

    try {
      let artigosCount = 0;
      const { data, error } = await supabase.functions.invoke('reextrair-lei-planalto', {
        body: {
          slug: lei.id,
          planalto_url: lei.url_planalto,
          nome: lei.nome,
          dry_run: false,
        },
      });

      if (error) {
        // Fallback para vademecum-scraper
        const { data: scrapData, error: scrapError } = await supabase.functions.invoke('vademecum-scraper', {
          body: { targetUrl: lei.url_planalto, maxAgeYears: 5 }
        });
        if (scrapError) throw scrapError;
        artigosCount = scrapData?.articles?.length || 0;
        if (scrapData?.articles) {
          localStorage.setItem(`vade_scrape_data_${lei.tabela_nome}`, JSON.stringify(scrapData.articles));
        }
      } else {
        artigosCount = (data as { artigos?: number })?.artigos || 0;
      }

      clearInterval(progressTimer);
      setProgressoExtraindo(prev => ({ ...prev, [lei.id]: 100 }));
      setEtapaExtraindo(prev => ({ ...prev, [lei.id]: 'Concluído com sucesso!' }));

      const agora = new Date().toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });

      localStorage.setItem(`vade_scrape_${lei.id}`, agora);
      localStorage.setItem(`vade_scrape_${lei.tabela_nome}`, agora);
      setLastScrapes(prev => ({ ...prev, [lei.id]: agora }));

      // Se a lei ainda não foi aprovada, coloca-a em Triagem para revisão
      if (!aprovados[lei.id]) {
        localStorage.setItem(`vade_triagem_${lei.id}`, 'true');
        setTriagem(prev => ({ ...prev, [lei.id]: true }));
      }

      // Registra no histórico de extrações
      const novoRegistro: ExtracaoHistoricoItem = {
        id: `ext_${Date.now()}`,
        data: agora,
        timestamp: Date.now(),
        artigos: artigosCount,
        status: 'sucesso',
        detalhe: `${artigosCount} artigos processados e indexados com sucesso.`
      };
      setHistoricoExtracoes(prev => {
        const prevHist = prev[lei.id] || [];
        const updatedHist = [novoRegistro, ...prevHist].slice(0, 15);
        localStorage.setItem(`vade_scrape_history_${lei.id}`, JSON.stringify(updatedHist));
        return { ...prev, [lei.id]: updatedHist };
      });

      toast.success(
        `Extração concluída com sucesso! ${artigosCount > 0 ? `${artigosCount} artigos processados.` : ''}`,
        { id: toastId }
      );
    } catch (err: any) {
      clearInterval(progressTimer);
      console.error(err);
      
      const agora = new Date().toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      const novoRegistroErro: ExtracaoHistoricoItem = {
        id: `ext_${Date.now()}`,
        data: agora,
        timestamp: Date.now(),
        artigos: 0,
        status: 'erro',
        detalhe: err.message || 'Falha na conexão com o Planalto'
      };
      setHistoricoExtracoes(prev => {
        const prevHist = prev[lei.id] || [];
        const updatedHist = [novoRegistroErro, ...prevHist].slice(0, 15);
        localStorage.setItem(`vade_scrape_history_${lei.id}`, JSON.stringify(updatedHist));
        return { ...prev, [lei.id]: updatedHist };
      });

      toast.error(`Erro ao extrair ${lei.sigla}: ${err.message || 'Falha na conexão'}`, { id: toastId });
    } finally {
      setTimeout(() => {
        setExtraindoSlug(null);
        setProgressoExtraindo(prev => {
          const c = { ...prev };
          delete c[lei.id];
          return c;
        });
        setEtapaExtraindo(prev => {
          const c = { ...prev };
          delete c[lei.id];
          return c;
        });
      }, 1000);
    }
  };

  // Função para abrir o Histórico da Lei
  const handleAbrirHistorico = async (lei: LeiCatalogItem) => {
    setHistoricoLei(lei);
    setAnoFiltro('Todos');
    setBuscaArtigoHistorico('');

    // Carrega alterações enriquecidas com mês, ano e novidades recentes
    const list = getScrapedAlteracoes(lei.tabela_nome, lei.id);
    if (list.length > 0) {
      setAlteracoes(list);
      // Persiste o cache atualizado com os meses devidamente normalizados
      localStorage.setItem(`vade_scrape_data_${lei.tabela_nome}`, JSON.stringify(list));
      return;
    }

    // Se não tiver cache, executa a busca de alterações no Planalto
    await handleBuscarAlteracoesPlanalto(lei);
  };

  // Busca alterações por artigo no Planalto via vademecum-scraper
  const handleBuscarAlteracoesPlanalto = async (lei: LeiCatalogItem) => {
    if (!lei.url_planalto) {
      toast.error(`A lei ${lei.sigla} não possui URL oficial do Planalto configurada.`);
      return;
    }

    setCarregandoAlteracoes(true);
    const toastId = toast.loading(`Buscando alterações e redações dadas no Planalto...`);

    try {
      const { data, error } = await supabase.functions.invoke('vademecum-scraper', {
        body: { targetUrl: lei.url_planalto, maxAgeYears: 20 }
      });

      if (error) throw error;

      const rawArticles: ScrapedArticleUpdate[] = data?.articles || [];
      let articlesList = normalizeAlteracoes(rawArticles);

      // Para o Código Penal, assegura que as alterações mais recentes (como Agosto/2026 da Lei 15.487)
      // permaneçam no topo
      const isCP = (lei.tabela_nome && /CP_CODIGO_PENAL/i.test(lei.tabela_nome)) || (lei.id && /^cp$/i.test(lei.id));
      if (isCP) {
        const existingArts = new Set(articlesList.map(i => `${i.artigo}-${i.ano}`));
        const missingFromSeed = SEED_CP_ALTERACOES.filter(
          seedItem => !existingArts.has(`${seedItem.artigo}-${seedItem.ano}`)
        );
        if (missingFromSeed.length > 0) {
          articlesList = normalizeAlteracoes([...missingFromSeed, ...articlesList]);
        }
      }

      setAlteracoes(articlesList);

      const agora = new Date().toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });

      localStorage.setItem(`vade_scrape_${lei.id}`, agora);
      localStorage.setItem(`vade_scrape_${lei.tabela_nome}`, agora);
      localStorage.setItem(`vade_scrape_data_${lei.tabela_nome}`, JSON.stringify(articlesList));
      setLastScrapes(prev => ({ ...prev, [lei.id]: agora }));

      toast.success(
        `${articlesList.length} artigos alterados/incluídos identificados no Planalto.`,
        { id: toastId }
      );
    } catch (err: any) {
      console.error(err);
      toast.error(`Erro ao rastrear alterações: ${err.message || 'Falha de conexão'}`, { id: toastId });
    } finally {
      setCarregandoAlteracoes(false);
    }
  };

  // Função para sincronizar um artigo específico no banco
  const handleSincronizarArtigo = async (lei: LeiCatalogItem, item: ScrapedArticleUpdate) => {
    setSincronizandoArtigo(item.artigo);
    const toastId = toast.loading(`Sincronizando ${item.artigo} no banco de dados...`);

    try {
      const numArtigoLimpo = item.artigo.replace(/[^0-9]/g, '');

      if (numArtigoLimpo) {
        await supabase
          .from('vade_mecum_artigos')
          .update({ texto: item.texto_novo })
          .ilike('numero', `%${numArtigoLimpo}%`);
      }

      await supabase
        .from('legislacao_alteracoes')
        .insert({
          tabela_nome: lei.tabela_nome,
          artigo_numero: item.artigo,
          tipo_alteracao: item.texto_antigo ? 'texto_alterado' : 'artigo_novo',
          texto_anterior: item.texto_antigo || 'Redação anterior.',
          texto_atual: item.texto_novo,
          detectado_em: new Date().toISOString(),
          revisado: true,
        });

      toast.success(`${item.artigo} sincronizado e gravado no Histórico com sucesso!`, { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(`Falha ao sincronizar ${item.artigo}: ` + (err.message || 'Erro no banco'), { id: toastId });
    } finally {
      setSincronizandoArtigo(null);
    }
  };

  // Função para aprovar a lei para o Vade Mecum (move de Triagem/Todos para Aprovadas)
  const handleAprovarLei = (lei: LeiCatalogItem) => {
    localStorage.setItem(`vade_aprovado_${lei.id}`, 'true');
    localStorage.setItem(`vade_triagem_${lei.id}`, 'false');
    setAprovados(prev => ({ ...prev, [lei.id]: true }));
    setTriagem(prev => ({ ...prev, [lei.id]: false }));
    toast.success(`${lei.nome} aprovada com sucesso! Movida para Aprovadas.`);
  };

  // Função para devolver a lei de Triagem de volta para Todos / Pendentes
  const handleDevolverTriagem = (lei: LeiCatalogItem) => {
    localStorage.setItem(`vade_triagem_${lei.id}`, 'false');
    localStorage.setItem(`vade_aprovado_${lei.id}`, 'false');
    setTriagem(prev => ({ ...prev, [lei.id]: false }));
    setAprovados(prev => ({ ...prev, [lei.id]: false }));
    toast.info(`${lei.nome} devolvida para Todos.`);
  };

  // Função para revogar aprovação e mover de volta para Triagem
  const handleRevogarAprovacao = (lei: LeiCatalogItem) => {
    localStorage.setItem(`vade_aprovado_${lei.id}`, 'false');
    localStorage.setItem(`vade_triagem_${lei.id}`, 'true');
    setAprovados(prev => ({ ...prev, [lei.id]: false }));
    setTriagem(prev => ({ ...prev, [lei.id]: true }));
    toast.info(`Aprovação revogada. ${lei.nome} retornou para Triagem.`);
  };

  // Anos disponíveis para filtro no Histórico
  const anosDisponiveis = useMemo(() => {
    const setAnos = new Set(alteracoes.map(a => a.ano).filter(Boolean));
    return ['Todos', ...Array.from(setAnos).sort((a, b) => b - a).map(String)];
  }, [alteracoes]);

  // Alterações filtradas por ano e busca
  const alteracoesFiltradas = useMemo(() => {
    let list = alteracoes;
    if (anoFiltro !== 'Todos') {
      list = list.filter(a => String(a.ano) === anoFiltro);
    }
    if (buscaArtigoHistorico.trim()) {
      const q = buscaArtigoHistorico.toLowerCase();
      list = list.filter(a =>
        a.artigo.toLowerCase().includes(q) ||
        a.motivo.toLowerCase().includes(q) ||
        a.texto_novo.toLowerCase().includes(q) ||
        a.texto_antigo.toLowerCase().includes(q)
      );
    }
    return list;
  }, [alteracoes, anoFiltro, buscaArtigoHistorico]);

  // Identifica a última alteração (mais recente com mês e ano)
  const ultimaAlteracaoTexto = useMemo(() => {
    if (alteracoes.length === 0) return null;
    const maisRecente = alteracoes[0];
    if (!maisRecente) return null;
    const mes = maisRecente.mes_completo || maisRecente.mes;
    if (mes && maisRecente.ano) {
      return `${mes} de ${maisRecente.ano}`;
    }
    return maisRecente.ano ? String(maisRecente.ano) : null;
  }, [alteracoes]);

  // ==========================================
  // MODO 1: VISUALIZADOR DE HISTÓRICO DA LEI
  // ==========================================
  if (historicoLei) {
    return (
      <div className="min-h-dvh bg-background pb-12">
        {/* Header Superior Fixo */}
        <div className="sticky top-0 z-50 bg-[#0D0D0D]/95 backdrop-blur-md border-b border-border/80 px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setHistoricoLei(null)}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary hover:bg-secondary/80 text-foreground shrink-0 transition-colors"
              title="Voltar ao Mapeamento"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                  Histórico de Alterações
                </span>
                <span className="text-sm font-bold text-foreground truncate">
                  {historicoLei.nome}
                </span>
                {ultimaAlteracaoTexto && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Última alteração: {ultimaAlteracaoTexto}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground truncate">{historicoLei.descricao}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleBuscarAlteracoesPlanalto(historicoLei)}
              disabled={carregandoAlteracoes}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-semibold transition-all min-h-[40px] disabled:opacity-50 shadow-sm"
            >
              {carregandoAlteracoes ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Varrendo Planalto...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Varredura Planalto</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Conteúdo do Histórico */}
        <div className="p-4 max-w-4xl mx-auto space-y-5">
          {/* Instruções */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border/60 text-xs text-muted-foreground leading-relaxed">
            Todas as alterações e inclusões de artigos identificadas no site oficial do Planalto. Os links azuis (como <strong>(Incluído pela Lei nº ...)</strong>) levam diretamente para a lei modificadora oficial.
          </div>

          {/* Barra de Filtro e Busca */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={buscaArtigoHistorico}
                onChange={e => setBuscaArtigoHistorico(e.target.value)}
                placeholder="Buscar por número do artigo ou termo..."
                className="w-full pl-10 pr-4 py-2.5 bg-secondary/40 border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Filtro por Ano */}
            {anosDisponiveis.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
                <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap mr-1">
                  Filtrar por Ano:
                </span>
                {anosDisponiveis.map(ano => (
                  <button
                    key={ano}
                    onClick={() => setAnoFiltro(ano)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      anoFiltro === ano
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {ano}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Listagem das Alterações */}
          {carregandoAlteracoes ? (
            <div className="text-center py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Extraindo histórico de alterações do Planalto...</p>
            </div>
          ) : alteracoesFiltradas.length === 0 ? (
            <div className="text-center py-16 bg-secondary/20 rounded-2xl border border-border/40 p-6 space-y-3">
              <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
              <h3 className="font-semibold text-foreground text-base">Nenhuma alteração encontrada</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {alteracoes.length === 0
                  ? 'Ainda não foram extraídas alterações para esta lei. Clique em "Varredura Planalto" para buscar.'
                  : 'Nenhuma alteração corresponde aos filtros selecionados.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs text-muted-foreground">
                Exibindo <strong>{alteracoesFiltradas.length}</strong> alterações encontradas:
              </div>

              {alteracoesFiltradas.map((item, idx) => {
                const isSincronizando = sincronizandoArtigo === item.artigo;
                const linkDestino = item.link_lei || historicoLei.url_planalto;

                return (
                  <div
                    key={`${item.artigo}_${idx}`}
                    className="rounded-2xl border border-border/60 bg-secondary/30 p-5 space-y-4 shadow-sm hover:border-border transition-colors"
                  >
                    {/* Topo do Card de Alteração */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display text-base font-bold text-foreground">
                          {item.artigo}
                        </span>

                        <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 uppercase tracking-wider">
                          {item.mes ? `${item.mes.toUpperCase()} / ${item.ano}` : (item.mes_ano || `ANO ${item.ano}`)}
                        </span>

                        {/* Link Azul Oficial do Planalto Clicável */}
                        {linkDestino && (
                          <a
                            href={linkDestino}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 underline font-medium cursor-pointer transition-colors"
                            title="Abrir lei oficial no site do Planalto"
                          >
                            <span>({item.motivo})</span>
                            <ExternalLink className="w-3 h-3 text-blue-400 shrink-0" />
                          </a>
                        )}
                      </div>

                      {/* Botão Sincronizar */}
                      <button
                        onClick={() => handleSincronizarArtigo(historicoLei, item)}
                        disabled={isSincronizando}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all self-start sm:self-auto disabled:opacity-50"
                      >
                        {isSincronizando ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Gravando...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Sincronizar Artigo</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Comparação dos Textos (Antigo vs Novo) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Texto Antigo (Revogado) */}
                      <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3.5 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">
                          Texto Antigo (Revogado / Anterior)
                        </span>
                        <p className="text-xs text-muted-foreground/90 font-serif leading-relaxed line-through decoration-rose-500/50">
                          {item.texto_antigo || 'Dispositivo incluído pela primeira vez (inédito).'}
                        </p>
                      </div>

                      {/* Texto Novo (Planalto) */}
                      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                          Texto Novo (Vigente no Planalto)
                        </span>
                        <p className="text-xs text-foreground font-serif leading-relaxed">
                          {item.texto_novo}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // MODO 2: VISUALIZADOR DE PRÉVIA DO VADE MECUM
  // ==========================================
  if (previaLei) {
    const isExtracting = extraindoSlug === previaLei.id;
    const isAprovada = !!aprovados[previaLei.id];
    const isEmTriagem = !isAprovada && !!triagem[previaLei.id];

    return (
      <div className="min-h-dvh bg-background flex flex-col">
        {/* Barra Superior de Controle Administrativo */}
        <div className="sticky top-0 z-50 bg-[#0D0D0D]/95 backdrop-blur-md border-b border-border/80 px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setPreviaLei(null)}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary hover:bg-secondary/80 text-foreground shrink-0 transition-colors"
              title="Voltar ao Mapeamento"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider">
                  Prévia Oficial Vade Mecum
                </span>
                <span className="text-sm font-bold text-foreground truncate">
                  {previaLei.nome}
                </span>
                {isAprovada ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" /> Aprovada
                  </span>
                ) : isEmTriagem ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <ListFilter className="w-3 h-3" /> Em Triagem
                  </span>
                ) : null}
              </div>
              <p className="text-[11px] text-muted-foreground truncate">{previaLei.descricao}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Se estiver em triagem, botão Devolver para Todos */}
            {isEmTriagem && (
              <button
                onClick={() => handleDevolverTriagem(previaLei)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-secondary/80 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all min-h-[40px] shadow-sm active:scale-95"
                title="Devolver para Todos / Pendentes"
              >
                <RotateCcw className="w-4 h-4 text-rose-400" />
                <span>Devolver</span>
              </button>
            )}

            {/* Botão Aprovar / Revogar */}
            <button
              onClick={() => isAprovada ? handleRevogarAprovacao(previaLei) : handleAprovarLei(previaLei)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[40px] shadow-sm active:scale-95 ${
                isAprovada
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isAprovada ? 'Aprovada (Revogar)' : 'Aprovar Lei'}</span>
            </button>

            {/* Botão Re-extrair */}
            <button
              onClick={() => handleExtrairLei(previaLei)}
              disabled={isExtracting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-semibold transition-all min-h-[40px] disabled:opacity-50 shadow-sm"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span className="whitespace-nowrap">
                    Re-extraindo {progressoExtraindo[previaLei.id] || 0}%
                  </span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">Re-extrair Lei</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Visualizador Oficial do Vade Mecum */}
        <div className="flex-1">
          <LeiDetailView
            tipo={previaLei.tipo}
            leis={[previaLei]}
            selectedLeiId={previaLei.id}
            selectedLeiNome={previaLei.nome}
            selectedLeiDescricao={previaLei.descricao}
            selectedTabelaNome={previaLei.tabela_nome}
            subcat={previaLei.id}
            config={{ label: previaLei.nome, icon: Scale, bg: 'from-amber-500/90 to-amber-700/80' }}
            goBack={() => setPreviaLei(null)}
            pendingArtigoNumero={null}
            setPendingArtigoNumero={() => {}}
          />
        </div>
      </div>
    );
  }

  // ==========================================
  // MODO 3: LISTAGEM DE CATEGORIAS E LEIS
  // ==========================================
  return (
    <div className="min-h-dvh bg-background pb-12">
      {/* Header com navegação */}
      <PageHeader
        title={selectedCat ? selectedCat.nome : "Mapeamento de Leis"}
        onBack={() => {
          if (selectedCat) {
            setSelectedCat(null);
            setBusca('');
          } else {
            navigate('/admin-funcoes');
          }
        }}
      />

      <div className="p-4 max-w-4xl mx-auto space-y-4">
        {/* NÍVEL 1: SELEÇÃO DE CATEGORIAS */}
        {!selectedCat && (
          <div className="space-y-3">
            <p className="font-body text-[12px] text-muted-foreground px-1">
              Selecione uma categoria para visualizar as leis, o status de extração, histórico de alterações e a prévia do Vade Mecum.
            </p>

            <div className="rounded-2xl border border-border/60 bg-secondary/30 divide-y divide-border/50 overflow-hidden">
              {CATEGORIAS_DEF.map(cat => {
                const Icon = cat.icon;
                const totalLeis = LEIS_CATALOG.filter(l => l.tipo === cat.id).length;

                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCat(cat);
                      setBusca('');
                    }}
                    className="w-full flex items-center gap-4 px-4 py-5 min-h-[84px] text-left hover:bg-secondary/60 active:bg-secondary transition-colors"
                  >
                    <div
                      className="w-14 h-14 flex items-center justify-center shrink-0 rounded-2xl bg-secondary/50 border border-border/40"
                      style={{ color: cat.color }}
                    >
                      <Icon className="w-7 h-7" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-body text-base font-semibold text-foreground truncate">
                        {cat.nome}
                      </div>
                      <div className="font-body text-[12px] text-muted-foreground truncate mt-0.5">
                        {cat.desc} · {totalLeis} {totalLeis === 1 ? 'lei' : 'leis'}
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* NÍVEL 2: LEIS DA CATEGORIA SELECIONADA */}
        {selectedCat && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Campo de Busca Rápida & Filtros por Status */}
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  placeholder={`Buscar em ${selectedCat.nome}...`}
                  className="w-full pl-10 pr-4 py-2.5 bg-secondary/40 border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Pills de Filtro: Todas / Triagem / Aprovadas / Pendentes */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
                <button
                  onClick={() => setFiltroStatus('todas')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    filtroStatus === 'todas'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Todas ({counts.total})
                </button>

                <button
                  onClick={() => setFiltroStatus('triagem')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    filtroStatus === 'triagem'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ListFilter className="w-3.5 h-3.5" />
                  <span>Triagem ({counts.triagem})</span>
                </button>

                <button
                  onClick={() => setFiltroStatus('aprovadas')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    filtroStatus === 'aprovadas'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Aprovadas ({counts.aprovadas})</span>
                </button>

                <button
                  onClick={() => setFiltroStatus('pendentes')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    filtroStatus === 'pendentes'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pendentes ({counts.pendentes})</span>
                </button>
              </div>
            </div>

            {leisFiltradas.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Nenhuma lei encontrada para os critérios selecionados.
              </div>
            ) : (
              <div className="rounded-2xl border border-border/60 bg-secondary/30 divide-y divide-border/50 overflow-hidden">
                {leisFiltradas.map(lei => {
                  const isExtracting = extraindoSlug === lei.id;
                  const lastScrape = lastScrapes[lei.id];
                  const isAprovada = !!aprovados[lei.id];
                  const isEmTriagem = !isAprovada && !!triagem[lei.id];
                  const histList = historicoExtracoes[lei.id] || [];
                  const progresso = progressoExtraindo[lei.id] || 0;
                  const etapa = etapaExtraindo[lei.id] || 'Extraindo lei...';

                  return (
                    <div
                      key={lei.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/40 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-body text-base font-semibold text-foreground">
                            {lei.nome}
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                            {lei.sigla}
                          </span>
                          {isAprovada ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Aprovada
                            </span>
                          ) : isEmTriagem ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              <ListFilter className="w-3 h-3" /> Em Triagem
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-zinc-500/10 text-muted-foreground border border-border/40">
                              Pendente
                            </span>
                          )}
                        </div>

                        <div className="font-body text-[12px] text-muted-foreground mt-1 line-clamp-2">
                          {lei.descricao}
                        </div>

                        <div className="flex items-center gap-3 mt-2.5 flex-wrap text-[11px]">
                          {/* Data da última extração */}
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              Última extração:{' '}
                              {lastScrape ? (
                                <strong className="text-foreground">{lastScrape}</strong>
                              ) : (
                                <span className="text-muted-foreground/80 italic">Pendente / Nunca</span>
                              )}
                            </span>
                          </div>

                          {/* Histórico das últimas vezes que foi extraído */}
                          {histList.length > 0 && (
                            <button
                              onClick={() => setModalHistoricoExtracoesLei(lei)}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-secondary hover:bg-secondary/80 text-primary border border-primary/20 transition-all hover:scale-105 active:scale-95"
                              title="Ver histórico de todas as vezes que esta lei foi extraída"
                            >
                              <History className="w-3 h-3 text-primary shrink-0" />
                              <span>{histList.length} extraç{histList.length === 1 ? 'ão' : 'ões'}</span>
                            </button>
                          )}

                          {/* Link oficial Planalto */}
                          {lei.url_planalto && (
                            <a
                              href={lei.url_planalto}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline ml-auto sm:ml-0"
                            >
                              Planalto oficial <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          )}
                        </div>

                        {/* Barra de Progresso em Tempo Real durante a Extração */}
                        {isExtracting && (
                          <div className="mt-3 p-3 rounded-xl bg-primary/10 border border-primary/25 space-y-2 animate-in fade-in duration-300">
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-primary inline-flex items-center gap-1.5 min-w-0 truncate">
                                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-primary" />
                                <span className="truncate">{etapa}</span>
                              </span>
                              <span className="font-mono text-primary font-bold text-sm shrink-0 ml-2">
                                {progresso}%
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-secondary/80 overflow-hidden relative">
                              <div
                                className="h-full bg-gradient-to-r from-primary via-blue-500 to-emerald-400 transition-all duration-300 rounded-full shadow-sm"
                                style={{ width: `${progresso}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Botões de Ação Responsivos */}
                      <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                        {/* Botão Ver Prévia */}
                        <button
                          onClick={() => setPreviaLei(lei)}
                          className="col-span-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border/60 text-xs sm:text-sm font-medium whitespace-nowrap active:scale-95 transition-all min-h-[40px]"
                          title="Abrir Prévia Oficial do Vade Mecum"
                        >
                          <Eye className="w-4 h-4 text-primary shrink-0" />
                          <span className="whitespace-nowrap">Ver Prévia</span>
                        </button>

                        {/* Botão Histórico da Lei */}
                        <button
                          onClick={() => handleAbrirHistorico(lei)}
                          className="col-span-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border/60 text-xs sm:text-sm font-medium whitespace-nowrap active:scale-95 transition-all min-h-[40px]"
                          title="Ver histórico de alterações por artigo do Planalto"
                        >
                          <History className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="whitespace-nowrap">Histórico</span>
                        </button>

                        {/* Fluxo de Triagem e Decisão Administrativa */}
                        {isEmTriagem ? (
                          <>
                            {/* Botão Devolver para Todos */}
                            <button
                              onClick={() => handleDevolverTriagem(lei)}
                              className="col-span-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-secondary/80 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs sm:text-sm font-semibold whitespace-nowrap active:scale-95 transition-all min-h-[40px]"
                              title="Devolver para Todos / Pendentes"
                            >
                              <RotateCcw className="w-4 h-4 text-rose-400 shrink-0" />
                              <span className="whitespace-nowrap">Devolver</span>
                            </button>

                            {/* Botão Aprovar Lei */}
                            <button
                              onClick={() => handleAprovarLei(lei)}
                              className="col-span-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold whitespace-nowrap active:scale-95 transition-all min-h-[40px] shadow-sm"
                              title="Aprovar Lei para o Vade Mecum"
                            >
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              <span className="whitespace-nowrap">Aprovar Lei</span>
                            </button>
                          </>
                        ) : isAprovada ? (
                          <>
                            {/* Botão Revogar Aprovação */}
                            <button
                              onClick={() => handleRevogarAprovacao(lei)}
                              className="col-span-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-rose-500/20 text-emerald-300 hover:text-rose-300 border border-emerald-500/30 hover:border-rose-500/30 text-xs sm:text-sm font-medium whitespace-nowrap active:scale-95 transition-all min-h-[40px]"
                              title="Revogar aprovação e mover de volta para Triagem"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span className="whitespace-nowrap">Aprovada</span>
                            </button>

                            {/* Botão Re-extrair Lei */}
                            <button
                              onClick={() => handleExtrairLei(lei)}
                              disabled={isExtracting}
                              className="col-span-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-xs sm:text-sm whitespace-nowrap hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[40px]"
                              title="Re-extrair Lei do Planalto"
                            >
                              {isExtracting ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                                  <span className="whitespace-nowrap">{progresso}%</span>
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="w-4 h-4 shrink-0" />
                                  <span className="whitespace-nowrap">Re-extrair</span>
                                </>
                              )}
                            </button>
                          </>
                        ) : (
                          /* Lei Pendente */
                          <button
                            onClick={() => handleExtrairLei(lei)}
                            disabled={isExtracting}
                            className="col-span-2 sm:col-span-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-xs sm:text-sm whitespace-nowrap hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[40px]"
                            title={lastScrape ? 'Re-extrair Lei e enviar para Triagem' : 'Extrair Lei e enviar para Triagem'}
                          >
                            {isExtracting ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                                <span className="whitespace-nowrap">
                                  {lastScrape ? 'Re-extraindo' : 'Extraindo'} {progresso}%
                                </span>
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-4 h-4 shrink-0" />
                                <span className="whitespace-nowrap">
                                  {lastScrape ? 'Re-extrair' : 'Extrair Lei'}
                                </span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal / Dialog: Histórico das Últimas Vezes que foi Extraído */}
      {modalHistoricoExtracoesLei && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#121212] border border-border/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header do Modal */}
            <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between gap-3 bg-secondary/20">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider">
                    {modalHistoricoExtracoesLei.sigla}
                  </span>
                  <h3 className="font-bold text-base text-foreground truncate">
                    Histórico de Extrações
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {modalHistoricoExtracoesLei.nome}
                </p>
              </div>

              <button
                onClick={() => setModalHistoricoExtracoesLei(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conteúdo da Timeline */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 divide-y divide-border/30">
              {(historicoExtracoes[modalHistoricoExtracoesLei.id] || []).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-muted-foreground/60" />
                  <p>Nenhuma extração anterior registrada ainda para esta lei.</p>
                </div>
              ) : (
                (historicoExtracoes[modalHistoricoExtracoesLei.id] || []).map((item, idx) => (
                  <div key={item.id || idx} className="pt-3 first:pt-0 flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {item.status === 'sucesso' ? (
                        <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-bold text-foreground">
                          {item.data}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          item.status === 'sucesso'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        }`}>
                          {item.status === 'sucesso' ? 'Sucesso' : 'Falha'}
                        </span>
                      </div>

                      <div className="text-xs text-muted-foreground leading-relaxed">
                        {item.detalhe || `${item.artigos} artigos processados.`}
                      </div>

                      {item.artigos > 0 && (
                        <div className="text-[11px] font-medium text-emerald-400/90">
                          Total: {item.artigos} artigos sincronizados
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer do Modal */}
            <div className="p-4 border-t border-border/60 bg-secondary/10 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  const lei = modalHistoricoExtracoesLei;
                  setModalHistoricoExtracoesLei(null);
                  handleExtrairLei(lei);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-all active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-extrair Agora</span>
              </button>

              <button
                onClick={() => setModalHistoricoExtracoesLei(null)}
                className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
