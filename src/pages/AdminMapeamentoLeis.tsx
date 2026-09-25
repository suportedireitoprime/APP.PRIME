import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scale, BookOpen, Shield, ScrollText, HeartHandshake,
  Search, RefreshCw, ExternalLink, ChevronRight, CheckCircle2,
  Clock, Loader2, Eye, ArrowLeft, History, AlertTriangle, Check
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

interface ScrapedArticleUpdate {
  artigo: string;
  motivo: string; // Ex: "Incluído pela Lei nº 13.964, de 2019"
  ano: number;
  texto_antigo: string;
  texto_novo: string;
  link_lei?: string;
  data_completa?: string;
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
  const [lastScrapes, setLastScrapes] = useState<Record<string, string>>({});
  const [aprovados, setAprovados] = useState<Record<string, boolean>>({});
  const [previaLei, setPreviaLei] = useState<LeiCatalogItem | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<'todas' | 'aprovadas' | 'pendentes'>('todas');

  // Estados do Modo Histórico da Lei
  const [historicoLei, setHistoricoLei] = useState<LeiCatalogItem | null>(null);
  const [alteracoes, setAlteracoes] = useState<ScrapedArticleUpdate[]>([]);
  const [carregandoAlteracoes, setCarregandoAlteracoes] = useState(false);
  const [anoFiltro, setAnoFiltro] = useState<string>('Todos');
  const [buscaArtigoHistorico, setBuscaArtigoHistorico] = useState('');
  const [sincronizandoArtigo, setSincronizandoArtigo] = useState<string | null>(null);

  // Carrega histórico de última extração e status de aprovação
  useEffect(() => {
    const loadedScrapes: Record<string, string> = {};
    const loadedAprovados: Record<string, boolean> = {};

    LEIS_CATALOG.forEach(l => {
      const dt = localStorage.getItem(`vade_scrape_${l.id}`) ||
                 localStorage.getItem(`vade_scrape_${l.tabela_nome}`);
      if (dt) loadedScrapes[l.id] = dt;

      const ap = localStorage.getItem(`vade_aprovado_${l.id}`) === 'true';
      if (ap) loadedAprovados[l.id] = true;
    });

    setLastScrapes(loadedScrapes);
    setAprovados(loadedAprovados);
  }, []);

  // Contadores por status dentro da categoria selecionada
  const counts = useMemo(() => {
    if (!selectedCat) return { total: 0, aprovadas: 0, pendentes: 0 };
    const leisCat = LEIS_CATALOG.filter(l => l.tipo === selectedCat.id);
    const aprovadasCount = leisCat.filter(l => !!aprovados[l.id]).length;
    return {
      total: leisCat.length,
      aprovadas: aprovadasCount,
      pendentes: leisCat.length - aprovadasCount,
    };
  }, [selectedCat, aprovados]);

  // Leis da categoria selecionada ou filtradas pela busca e status
  const leisFiltradas = useMemo(() => {
    let list = selectedCat
      ? LEIS_CATALOG.filter(l => l.tipo === selectedCat.id)
      : [];

    if (filtroStatus === 'aprovadas') {
      list = list.filter(l => !!aprovados[l.id]);
    } else if (filtroStatus === 'pendentes') {
      list = list.filter(l => !aprovados[l.id]);
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
  }, [selectedCat, filtroStatus, aprovados, busca]);

  // Função para executar a extração / re-extração da lei
  const handleExtrairLei = async (lei: LeiCatalogItem) => {
    if (!lei.url_planalto) {
      toast.error(`A lei ${lei.sigla} não possui URL oficial do Planalto configurada.`);
      return;
    }

    setExtraindoSlug(lei.id);
    const toastId = toast.loading(`Iniciando extração de ${lei.nome} no Planalto...`);

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

      const agora = new Date().toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });

      localStorage.setItem(`vade_scrape_${lei.id}`, agora);
      localStorage.setItem(`vade_scrape_${lei.tabela_nome}`, agora);
      setLastScrapes(prev => ({ ...prev, [lei.id]: agora }));

      toast.success(
        `Extração concluída com sucesso! ${artigosCount > 0 ? `${artigosCount} artigos processados.` : ''}`,
        { id: toastId }
      );
    } catch (err: any) {
      console.error(err);
      toast.error(`Erro ao extrair ${lei.sigla}: ${err.message || 'Falha na conexão'}`, { id: toastId });
    } finally {
      setExtraindoSlug(null);
    }
  };

  // Função para abrir o Histórico da Lei
  const handleAbrirHistorico = async (lei: LeiCatalogItem) => {
    setHistoricoLei(lei);
    setAnoFiltro('Todos');
    setBuscaArtigoHistorico('');

    // Verifica se já tem cache das alterações no localStorage
    const cached = localStorage.getItem(`vade_scrape_data_${lei.tabela_nome}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setAlteracoes(parsed);
        return;
      } catch {}
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

      const articlesList: ScrapedArticleUpdate[] = data?.articles || [];
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

  // Função para aprovar a lei para o Vade Mecum
  const handleAprovarLei = (lei: LeiCatalogItem) => {
    const novoStatus = !aprovados[lei.id];
    localStorage.setItem(`vade_aprovado_${lei.id}`, String(novoStatus));
    setAprovados(prev => ({ ...prev, [lei.id]: novoStatus }));

    if (novoStatus) {
      toast.success(`${lei.nome} aprovada para o Vade Mecum com sucesso!`);
    } else {
      toast.info(`Aprovação de ${lei.nome} revogada.`);
    }
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

  // Identifica a última alteração (mais recente)
  const ultimaAlteracaoAno = useMemo(() => {
    if (alteracoes.length === 0) return null;
    const anos = alteracoes.map(a => a.ano).filter(Boolean);
    return anos.length > 0 ? Math.max(...anos) : null;
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
                {ultimaAlteracaoAno && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Última alteração: {ultimaAlteracaoAno}
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

                        <span className="text-[11px] font-bold text-gray-300 bg-black/40 px-2 py-0.5 rounded border border-white/10 uppercase tracking-wider">
                          Ano {item.ano}
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
                {isAprovada && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" /> Aprovada
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground truncate">{previaLei.descricao}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Botão Aprovar */}
            <button
              onClick={() => handleAprovarLei(previaLei)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[40px] shadow-sm ${
                isAprovada
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isAprovada ? 'Aprovada' : 'Aprovar'}</span>
            </button>

            {/* Botão Re-extrair */}
            <button
              onClick={() => handleExtrairLei(previaLei)}
              disabled={isExtracting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-semibold transition-all min-h-[40px] disabled:opacity-50 shadow-sm"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Extraindo...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Re-extrair</span>
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

              {/* Pills de Filtro: Todas / Aprovadas / Pendentes */}
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
                          {isAprovada && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Aprovada
                            </span>
                          )}
                        </div>

                        <div className="font-body text-[12px] text-muted-foreground mt-1 line-clamp-2">
                          {lei.descricao}
                        </div>

                        <div className="flex items-center gap-4 mt-2.5 flex-wrap text-[11px]">
                          {/* Data da última extração */}
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              Última extração:{' '}
                              {lastScrape ? (
                                <strong className="text-foreground">{lastScrape}</strong>
                              ) : (
                                <span className="text-muted-foreground/80 italic">Pendente / Nunca</span>
                              )}
                            </span>
                          </div>

                          {/* Link oficial Planalto */}
                          {lei.url_planalto && (
                            <a
                              href={lei.url_planalto}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              Planalto oficial <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Botões Lado a Lado: Ver Prévia, Histórico e Extrair */}
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
                        {/* Botão Ver Prévia */}
                        <button
                          onClick={() => setPreviaLei(lei)}
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border/60 text-xs sm:text-sm font-medium active:scale-95 transition-all min-h-[44px]"
                          title="Abrir Prévia Oficial do Vade Mecum"
                        >
                          <Eye className="w-4 h-4 text-primary" />
                          <span>Ver Prévia</span>
                        </button>

                        {/* Botão Histórico da Lei */}
                        <button
                          onClick={() => handleAbrirHistorico(lei)}
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border/60 text-xs sm:text-sm font-medium active:scale-95 transition-all min-h-[44px]"
                          title="Ver histórico de alterações por artigo do Planalto"
                        >
                          <History className="w-4 h-4 text-amber-400" />
                          <span>Histórico</span>
                        </button>

                        {/* Botão Extrair / Re-extrair */}
                        <button
                          onClick={() => handleExtrairLei(lei)}
                          disabled={isExtracting}
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-xs sm:text-sm hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[44px]"
                        >
                          {isExtracting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Extraindo...</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4" />
                              <span>{lastScrape ? 'Re-extrair' : 'Extrair'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
