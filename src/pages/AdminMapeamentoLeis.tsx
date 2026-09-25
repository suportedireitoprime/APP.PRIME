import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scale, BookOpen, Shield, ScrollText, HeartHandshake,
  Search, RefreshCw, ExternalLink, ChevronRight, CheckCircle2,
  Clock, Loader2
} from 'lucide-react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { LEIS_CATALOG, type LeiCatalogItem } from '@/data/leisCatalog';
import { supabase } from '@/integrations/supabase/client';
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

  // Carrega histórico de última extração salvo no localStorage ou storage local
  useEffect(() => {
    const loaded: Record<string, string> = {};
    LEIS_CATALOG.forEach(l => {
      const dt = localStorage.getItem(`vade_scrape_${l.id}`) ||
                 localStorage.getItem(`vade_scrape_${l.tabela_nome}`);
      if (dt) loaded[l.id] = dt;
    });
    setLastScrapes(loaded);
  }, []);

  // Leis da categoria selecionada ou todas
  const leisFiltradas = useMemo(() => {
    let list = selectedCat
      ? LEIS_CATALOG.filter(l => l.tipo === selectedCat.id)
      : [];

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
  }, [selectedCat, busca]);

  // Função para executar a extração / re-extração da lei
  const handleExtrairLei = async (lei: LeiCatalogItem) => {
    if (!lei.url_planalto) {
      toast.error(`A lei ${lei.sigla} não possui URL oficial do Planalto configurada.`);
      return;
    }

    setExtraindoSlug(lei.id);
    const toastId = toast.loading(`Iniciando extração de ${lei.nome} no Planalto...`);

    try {
      // 1. Tenta reextrair-lei-planalto
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
              Selecione uma categoria para visualizar as leis e o status de extração do Planalto.
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
            {/* Campo de Busca Rápida */}
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

            {leisFiltradas.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Nenhuma lei encontrada para "{busca}".
              </div>
            ) : (
              <div className="rounded-2xl border border-border/60 bg-secondary/30 divide-y divide-border/50 overflow-hidden">
                {leisFiltradas.map(lei => {
                  const isExtracting = extraindoSlug === lei.id;
                  const lastScrape = lastScrapes[lei.id];

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

                      {/* Botão de Extração */}
                      <button
                        onClick={() => handleExtrairLei(lei)}
                        disabled={isExtracting}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-xs sm:text-sm hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0 min-h-[44px]"
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
