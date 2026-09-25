import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scale, RefreshCw, FileText, CheckCircle2, AlertTriangle,
  Clock, ExternalLink, History, Loader2, Search, ArrowRight,
  BookOpen, Sparkles, Filter
} from 'lucide-react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { LEIS_CATALOG, type LeiCatalogItem } from '@/data/leisCatalog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ResenhaAto {
  id: string;
  tipo_ato: string;
  numero_ato: string;
  ementa: string;
  url: string;
  data_publicacao: string;
  data_dou: string;
}

interface ImpactoItem {
  id: string;
  lei_id?: string;
  tabela_nome: string;
  lei_nome: string;
  artigo_numero: string;
  motivo: string;
  ato_origem: string;
  data_dou: string;
  texto_antigo: string;
  texto_novo: string;
  status: 'pendente' | 'aplicado';
  link_oficial?: string;
}

interface AlteracaoHistorico {
  id: string;
  tabela_nome: string;
  lei_nome?: string;
  artigo_numero: string;
  tipo_alteracao: string;
  texto_anterior: string;
  texto_atual: string;
  detectado_em: string;
  revisado: boolean;
}

export default function AdminVadeMecumHistorico() {
  const navigate = useNavigate();

  // Abas: 'novidades' (Resenha & Impactos) | 'historico' (Antes e Depois)
  const [activeTab, setActiveTab] = useState<'novidades' | 'historico'>('novidades');

  // Estados de dados
  const [loading, setLoading] = useState(true);
  const [escanearLoading, setEscanearLoading] = useState(false);
  const [substituindoId, setSubstituindoId] = useState<string | null>(null);

  const [impactos, setImpactos] = useState<ImpactoItem[]>([]);
  const [historico, setHistorico] = useState<AlteracaoHistorico[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroLei, setFiltroLei] = useState<string>('todas');

  // Carrega impactos pendentes e histórico
  const carregarDados = async () => {
    setLoading(true);
    try {
      // 1. Busca histórico de alterações já aplicadas
      const { data: histData, error: histErr } = await supabase
        .from('legislacao_alteracoes')
        .select('*')
        .order('detectado_em', { ascending: false })
        .limit(100);

      if (histErr) console.warn('Erro ao buscar histórico:', histErr.message);

      // Mapeia nome da lei para cada item do histórico
      const histFormatado = (histData || []).map((h: any) => {
        const leiRef = LEIS_CATALOG.find(l => l.tabela_nome === h.tabela_nome);
        return {
          ...h,
          lei_nome: leiRef ? leiRef.nome : h.tabela_nome,
        };
      });
      setHistorico(histFormatado);

      // 2. Busca impactos da tabela radar_impactos_leis ou resenha_diaria
      const { data: radarData } = await supabase
        .from('radar_impactos_leis')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (radarData && radarData.length > 0) {
        const mappedImpactos: ImpactoItem[] = radarData.map((r: any) => {
          const leiRef = LEIS_CATALOG.find(l => l.id === r.lei_id || l.tabela_nome === r.tabela_nome);
          return {
            id: r.id,
            lei_id: r.lei_id,
            tabela_nome: r.tabela_nome || leiRef?.tabela_nome || 'CP_CODIGO_PENAL',
            lei_nome: leiRef ? leiRef.nome : (r.lei_nome || 'Legislação'),
            artigo_numero: r.artigo_numero || (r.artigos_afetados?.[0]?.numero ? `Art. ${r.artigos_afetados[0].numero}` : 'Artigo'),
            motivo: r.motivo || r.ato_titulo || 'Alteração pelo Diário Oficial',
            ato_origem: r.ato_numero ? `Ato ${r.ato_numero}` : 'Resenha Planalto',
            data_dou: r.data_dou || new Date(r.created_at).toLocaleDateString('pt-BR'),
            texto_antigo: r.texto_antigo || '',
            texto_novo: r.texto_novo || r.artigos_afetados?.[0]?.texto || '',
            status: r.status === 'aplicado' ? 'aplicado' : 'pendente',
            link_oficial: r.url_fonte || leiRef?.url_planalto,
          };
        });
        setImpactos(mappedImpactos.filter(i => i.status === 'pendente'));
      } else {
        // Se ainda não houver radar_impactos_leis populado, busca atos recentes da resenha_diaria
        const { data: resenhaAtos } = await supabase
          .from('resenha_diaria')
          .select('*')
          .order('data_dou', { ascending: false })
          .limit(30);

        if (resenhaAtos && resenhaAtos.length > 0) {
          const detectados: ImpactoItem[] = [];

          resenhaAtos.forEach((ato: ResenhaAto) => {
            const ementaLower = (ato.ementa || '').toLowerCase();

            // Cruza com o catálogo de leis
            LEIS_CATALOG.forEach(lei => {
              const nomeLower = lei.nome.toLowerCase();
              const siglaLower = lei.sigla.toLowerCase();

              const bateu =
                ementaLower.includes(nomeLower) ||
                ementaLower.includes(siglaLower) ||
                (lei.descricao && ementaLower.includes(lei.descricao.toLowerCase()));

              if (bateu) {
                // Tenta extrair menções de artigos ex: "art. 121", "artigo 14"
                const matchArt = ato.ementa.match(/art(?:igo|\.)?\s*(\d+[A-Za-z\-º°ª]*)/i);
                const artNum = matchArt ? `Art. ${matchArt[1]}` : 'Dispositivos diversos';

                detectados.push({
                  id: `${ato.id}_${lei.id}`,
                  lei_id: lei.id,
                  tabela_nome: lei.tabela_nome,
                  lei_nome: lei.nome,
                  artigo_numero: artNum,
                  motivo: ato.ementa,
                  ato_origem: `${ato.tipo_ato} nº ${ato.numero_ato}`,
                  data_dou: ato.data_dou || ato.data_publicacao || 'Recente',
                  texto_antigo: 'Texto anterior cadastrado no aplicativo.',
                  texto_novo: ato.ementa,
                  status: 'pendente',
                  link_oficial: ato.url || lei.url_planalto,
                });
              }
            });
          });

          setImpactos(detectados);
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Falha ao sincronizar dados: ' + (err.message || 'Erro de conexão'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Botão para varrer Resenha Diária do Planalto agora
  const handleEscanearPlanalto = async () => {
    setEscanearLoading(true);
    const toastId = toast.loading('Varrendo Resenha Diária do Planalto e cruzando com o catálogo...');
    try {
      // 1. Invoca raspagem da resenha diária
      await supabase.functions.invoke('scrape-resenha-diaria', {
        body: { origem: 'admin-manual', notify: false }
      });

      // 2. Invoca detecção de impactos
      await supabase.functions.invoke('radar-detectar-impacto-leis', {
        body: { dias: 15, reprocessar: true }
      });

      toast.success('Varredura concluída! Lista de impactos atualizada.', { id: toastId });
      await carregarDados();
    } catch (err: any) {
      console.error(err);
      toast.error('Falha ao escanear o Planalto: ' + (err.message || 'Erro'), { id: toastId });
    } finally {
      setEscanearLoading(false);
    }
  };

  // Botão "Substituir": substitui o texto velho pelo novo APENAS naquele artigo e salva no histórico
  const handleSubstituirArtigo = async (item: ImpactoItem) => {
    setSubstituindoId(item.id);
    const toastId = toast.loading(`Substituindo ${item.artigo_numero} de ${item.lei_nome}...`);

    try {
      // 1. Tenta invocar edge function se for ID de radar_impactos_leis
      let atualizouPorFn = false;
      if (!item.id.includes('_')) {
        const { error: fnErr } = await supabase.functions.invoke('lei-aplicar-impacto-radar', {
          body: { impacto_id: item.id }
        });
        if (!fnErr) atualizouPorFn = true;
      }

      // 2. Se não foi pela edge function, atualiza direto no banco
      if (!atualizouPorFn) {
        const numArtigoLimpo = item.artigo_numero.replace(/[^0-9]/g, '');

        if (numArtigoLimpo) {
          // Atualiza em vade_mecum_artigos se aplicável
          await supabase
            .from('vade_mecum_artigos')
            .update({ texto: item.texto_novo })
            .ilike('numero', `%${numArtigoLimpo}%`);
        }

        // 3. Salva no histórico de alterações (legislacao_alteracoes)
        const { error: histInsertErr } = await supabase
          .from('legislacao_alteracoes')
          .insert({
            tabela_nome: item.tabela_nome,
            artigo_numero: item.artigo_numero,
            tipo_alteracao: 'texto_alterado',
            texto_anterior: item.texto_antigo || 'Redação anterior substituída.',
            texto_atual: item.texto_novo,
            detectado_em: new Date().toISOString(),
            revisado: true,
          });

        if (histInsertErr) {
          console.warn('Aviso ao gravar histórico:', histInsertErr.message);
        }
      }

      toast.success(`Artigo ${item.artigo_numero} atualizado no banco e gravado no Histórico!`, { id: toastId });

      // Remove dos pendentes e recarrega
      setImpactos(prev => prev.filter(i => i.id !== item.id));
      await carregarDados();
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao substituir artigo: ' + (err.message || 'Falha no banco'), { id: toastId });
    } finally {
      setSubstituindoId(null);
    }
  };

  // Filtros de busca
  const impactosFiltrados = useMemo(() => {
    let list = impactos;
    if (filtroLei !== 'todas') {
      list = list.filter(i => i.tabela_nome === filtroLei);
    }
    if (busca.trim()) {
      const q = busca.toLowerCase();
      list = list.filter(i =>
        i.lei_nome.toLowerCase().includes(q) ||
        i.artigo_numero.toLowerCase().includes(q) ||
        i.motivo.toLowerCase().includes(q) ||
        i.ato_origem.toLowerCase().includes(q)
      );
    }
    return list;
  }, [impactos, filtroLei, busca]);

  const historicoFiltrado = useMemo(() => {
    let list = historico;
    if (filtroLei !== 'todas') {
      list = list.filter(h => h.tabela_nome === filtroLei);
    }
    if (busca.trim()) {
      const q = busca.toLowerCase();
      list = list.filter(h =>
        (h.lei_nome || '').toLowerCase().includes(q) ||
        (h.artigo_numero || '').toLowerCase().includes(q) ||
        (h.texto_atual || '').toLowerCase().includes(q) ||
        (h.texto_anterior || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [historico, filtroLei, busca]);

  return (
    <div className="min-h-dvh bg-background pb-12">
      {/* Header */}
      <PageHeader
        title="Histórico de Atualizações"
        onBack={() => navigate('/admin-funcoes')}
      />

      <div className="p-4 max-w-4xl mx-auto space-y-5">
        {/* Barra superior de Ação & Abas */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Abas */}
          <div className="flex items-center bg-secondary/50 p-1 rounded-xl border border-border/50">
            <button
              onClick={() => setActiveTab('novidades')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all ${
                activeTab === 'novidades'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Resenha Planalto</span>
              {impactos.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {impactos.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('historico')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all ${
                activeTab === 'historico'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Histórico (Antes & Depois)</span>
              {historico.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-secondary text-foreground">
                  {historico.length}
                </span>
              )}
            </button>
          </div>

          {/* Botão de Varredura do Planalto */}
          <button
            onClick={handleEscanearPlanalto}
            disabled={escanearLoading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border/60 text-xs sm:text-sm font-medium transition-all min-h-[40px] disabled:opacity-50"
          >
            {escanearLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Varrendo Planalto...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 text-primary" />
                <span>Escanear Resenha Diária</span>
              </>
            )}
          </button>
        </div>

        {/* Barra de Filtro e Busca */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Filtrar por artigo, lei ou ato..."
              className="w-full pl-10 pr-4 py-2 bg-secondary/30 border border-border/50 rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <select
            value={filtroLei}
            onChange={e => setFiltroLei(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-secondary/30 border border-border/50 rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="todas">Todas as Leis</option>
            {LEIS_CATALOG.map(l => (
              <option key={l.tabela_nome} value={l.tabela_nome}>
                {l.sigla} — {l.nome}
              </option>
            ))}
          </select>
        </div>

        {/* CONTEÚDO DA ABA 1: RESENHA PLANALTO & IMPACTOS DETECTADOS */}
        {activeTab === 'novidades' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-16 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Cruzando Resenha Diária com nosso Vade Mecum...</p>
              </div>
            ) : impactosFiltrados.length === 0 ? (
              <div className="text-center py-16 bg-secondary/20 rounded-2xl border border-border/40 p-6 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h3 className="font-semibold text-foreground text-base">Tudo Sincronizado!</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Não há alterações pendentes detectadas na Resenha Diária do Planalto para as leis do aplicativo.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleEscanearPlanalto}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Fazer nova varredura agora
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="font-body text-[12px] text-muted-foreground px-1">
                  Atos recentes do Diário Oficial que impactam artigos do nosso catálogo. Clique em <strong>Substituir</strong> para aplicar a nova redação exclusivamente no artigo correspondente.
                </p>

                {impactosFiltrados.map(item => {
                  const isSubstituindo = substituindoId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-border/60 bg-secondary/30 p-5 space-y-4 shadow-sm hover:border-border transition-colors"
                    >
                      {/* Topo do card: Identificação da Lei & Artigo */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              {item.lei_nome}
                            </span>
                            <span className="font-display text-base font-bold text-foreground">
                              {item.artigo_numero}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.ato_origem} · Publicado em: <strong>{item.data_dou}</strong>
                          </p>
                        </div>

                        {item.link_oficial && (
                          <a
                            href={item.link_oficial}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline self-start sm:self-auto"
                          >
                            Ver no Planalto <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {/* Motivo / Ementa */}
                      <div className="text-xs text-muted-foreground leading-relaxed italic bg-black/20 p-2.5 rounded-lg border border-border/30">
                        "{item.motivo}"
                      </div>

                      {/* Comparação dos Textos */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Texto Velho */}
                        <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3.5 space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">
                            Texto Atual (No App — Será Substituído)
                          </span>
                          <p className="text-xs text-muted-foreground/90 font-serif leading-relaxed line-through decoration-rose-500/50">
                            {item.texto_antigo || 'Texto antigo do artigo.'}
                          </p>
                        </div>

                        {/* Texto Novo */}
                        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                            Texto Novo (Oficial do Planalto)
                          </span>
                          <p className="text-xs text-foreground font-serif leading-relaxed">
                            {item.texto_novo}
                          </p>
                        </div>
                      </div>

                      {/* Botão de Ação: Substituir */}
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => handleSubstituirArtigo(item)}
                          disabled={isSubstituindo}
                          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs sm:text-sm active:scale-95 disabled:opacity-50 transition-all shadow-md shadow-amber-500/10 min-h-[44px]"
                        >
                          {isSubstituindo ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Substituindo artigo...</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4" />
                              <span>Substituir no Banco</span>
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

        {/* CONTEÚDO DA ABA 2: HISTÓRICO COM VISUALIZADOR ANTES E DEPOIS */}
        {activeTab === 'historico' && (
          <div className="space-y-4">
            <p className="font-body text-[12px] text-muted-foreground px-1">
              Registro auditável de todas as substituições aplicadas às leis no aplicativo com visualização <strong>Antes e Depois</strong>.
            </p>

            {loading ? (
              <div className="text-center py-16 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Carregando histórico de alterações...</p>
              </div>
            ) : historicoFiltrado.length === 0 ? (
              <div className="text-center py-16 bg-secondary/20 rounded-2xl border border-border/40 p-6 space-y-2">
                <History className="w-10 h-10 text-muted-foreground mx-auto" />
                <h3 className="font-semibold text-foreground text-base">Nenhuma alteração no histórico</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Assim que você clicar em "Substituir" em qualquer alteração detectada, o registro detalhado aparecerá aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {historicoFiltrado.map(h => {
                  const dataFormatada = new Date(h.detectado_em).toLocaleString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  });

                  return (
                    <div
                      key={h.id}
                      className="rounded-2xl border border-border/60 bg-secondary/30 p-5 space-y-4 shadow-sm"
                    >
                      {/* Topo do Histórico */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                            {h.lei_nome}
                          </span>
                          <span className="font-display text-base font-bold text-foreground">
                            {h.artigo_numero}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Substituído em: <strong>{dataFormatada}</strong></span>
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium ml-2">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Aplicado
                          </span>
                        </div>
                      </div>

                      {/* Visualizador Antes e Depois (Diff Visual) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* ANTES */}
                        <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-4 space-y-2 relative overflow-hidden">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
                              Antes (Texto Anterior)
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-medium">
                              Substituído
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground/90 font-serif leading-relaxed line-through decoration-rose-500/60 whitespace-pre-wrap">
                            {h.texto_anterior || 'Texto anterior não registrado.'}
                          </p>
                        </div>

                        {/* DEPOIS */}
                        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 space-y-2 relative overflow-hidden">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                              Depois (Novo Texto no App)
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium">
                              Vigente
                            </span>
                          </div>
                          <p className="text-xs text-foreground font-serif leading-relaxed whitespace-pre-wrap">
                            {h.texto_atual}
                          </p>
                        </div>
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
