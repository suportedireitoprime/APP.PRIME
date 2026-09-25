import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scale, BookOpen, Shield, ScrollText, HeartHandshake,
  Search, RefreshCw, ExternalLink, ChevronRight, CheckCircle2,
  Clock, Loader2, Eye, ArrowLeft, Check
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

  // MODO PRÉVIA: RENDERIZA O VADE MECUM EXATAMENTE COMO O ALUNO VÊ COM BARRA DE ADMIN
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
              Selecione uma categoria para visualizar as leis, o status de extração e a prévia do Vade Mecum.
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
                Nenhuma lei encontrada para "{busca}".
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

                      {/* Botões Lado a Lado: Ver Prévia & Extrair/Re-extrair */}
                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                        {/* Botão Ver Prévia */}
                        <button
                          onClick={() => setPreviaLei(lei)}
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border/60 text-xs sm:text-sm font-medium active:scale-95 transition-all min-h-[44px]"
                        >
                          <Eye className="w-4 h-4 text-primary" />
                          <span>Ver Prévia</span>
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
                              <span>{lastScrape ? 'Re-extrair Lei' : 'Extrair Lei'}</span>
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
