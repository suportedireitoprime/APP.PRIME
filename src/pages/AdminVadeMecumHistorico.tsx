import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Scale, Search, Loader2, RefreshCcw, FileText, ChevronRight, BookOpen, ExternalLink, Bot, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { LEIS_CATALOG, type LeiCatalogItem } from '@/data/leisCatalog';
import { fetchArtigosLei } from '@/services/legislacaoService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";

type ViewState = 'categories' | 'laws' | 'scraper' | 'details';

export default function AdminVadeMecumHistorico() {
  const navigate = useNavigate();
  
  // Navigation State
  const [view, setView] = useState<ViewState>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLaw, setSelectedLaw] = useState<LeiCatalogItem | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [scrapedUpdates, setScrapedUpdates] = useState<any[]>([]);
  const [iaAnalysis, setIaAnalysis] = useState<'pending'|'analyzing'|'match'|'diff'|'updated'>('pending');
  const [iaReason, setIaReason] = useState<string>('');
  const [bancoText, setBancoText] = useState<string>('');
  const [dbArticleId, setDbArticleId] = useState<string | null>(null);
  const [lastScrapeDate, setLastScrapeDate] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('Todos');

  useEffect(() => {
      if (selectedLaw) {
          const date = localStorage.getItem(`vade_scrape_${selectedLaw.tabela_nome}`);
          setLastScrapeDate(date || null);
          const cachedData = localStorage.getItem(`vade_scrape_data_${selectedLaw.tabela_nome}`);
          if (cachedData) {
              try { setScrapedUpdates(JSON.parse(cachedData)); } catch (e) { console.error(e); }
          }
      }
  }, [selectedLaw]);

  // 1. Derivando categorias únicas do catálogo
  const categories = useMemo(() => {
      const types = new Set(LEIS_CATALOG.map(l => l.tipo));
      return Array.from(types).sort();
  }, []);

  const lawsOfCategory = useMemo(() => {
      if (!selectedCategory) return [];
      return LEIS_CATALOG.filter(l => l.tipo === selectedCategory);
  }, [selectedCategory]);

  const handleCategoryClick = (category: string) => {
      setSelectedCategory(category);
      setView('laws');
  };

  const handleLawClick = (law: LeiCatalogItem) => {
      setSelectedLaw(law);
      setScrapedUpdates([]);
      setSelectedYear('Todos'); // Reseta o filtro
      setView('scraper');
  };

  const handleArticleClick = (article: any) => {
      setSelectedArticle(article);
      setIaAnalysis('pending');
      setIaReason('');
      setView('details');
  };

  const availableYears = useMemo(() => {
      const years = new Set(scrapedUpdates.map(u => u.ano));
      return ['Todos', ...Array.from(years).sort((a, b) => Number(b) - Number(a)).map(String)];
  }, [scrapedUpdates]);

  const filteredUpdates = useMemo(() => {
      if (selectedYear === 'Todos') return scrapedUpdates;
      return scrapedUpdates.filter(u => String(u.ano) === selectedYear);
  }, [scrapedUpdates, selectedYear]);

  const goBack = () => {
      if (view === 'details') setView('scraper');
      else if (view === 'scraper') setView('laws');
      else if (view === 'laws') setView('categories');
      else navigate('/admin-funcoes');
  };

  const startScraping = async () => {
    if (!selectedLaw) return;
    
    if (!selectedLaw.url_planalto) {
        toast.error("Esta lei não tem URL oficial do planalto configurada no catálogo.");
        return;
    }

    setLoading(true);
    setScrapedUpdates([]);
    try {
      const { data, error } = await supabase.functions.invoke('vademecum-scraper', {
          body: { targetUrl: selectedLaw.url_planalto, maxAgeYears: 5 }
      });
      
      if (error) throw error;
      
      setScrapedUpdates(data.articles || []);
      const today = new Date().toLocaleDateString('pt-BR');
      setLastScrapeDate(today);
      localStorage.setItem(`vade_scrape_${selectedLaw.tabela_nome}`, today);
      localStorage.setItem(`vade_scrape_data_${selectedLaw.tabela_nome}`, JSON.stringify(data.articles || []));
      toast.success(`${data.articles?.length || 0} alterações recentes encontradas no Diário Oficial.`, { id: "scraper-toast" });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Falha na varredura.");
    } finally {
      setLoading(false);
    }
  };

  const runIAComparison = async () => {
      setIaAnalysis('analyzing');
      try {
          // 1. Fetch current text from database unificada
          setDbArticleId(null);
          const artigosDoBanco = await fetchArtigosLei(selectedLaw?.id || '', selectedLaw?.tabela_nome);
          const rawNumStr = selectedArticle.artigo.replace(/[^0-9]/g, '');
          const matchingDbArt = artigosDoBanco.find(a => String(a.numero).replace(/[^0-9]/g, '') === rawNumStr);

          const textoNoBanco = matchingDbArt?.texto || "Artigo não encontrado no banco de dados.";
          setBancoText(textoNoBanco);
          if (matchingDbArt?.id) {
             setDbArticleId(matchingDbArt.id);
          }

          // 2. Invoke Gemini Edge Function
          const { data: iaResult, error: iaError } = await supabase.functions.invoke('vademecum-compare-ia', {
              body: { 
                  textoBanco: textoNoBanco,
                  textoPlanaltoAntigo: selectedArticle.texto_antigo,
                  textoPlanaltoNovo: selectedArticle.texto_novo
              }
          });

          if (iaError) throw iaError;
          if (iaResult?.error) throw new Error(iaResult.error);

          if (iaResult?.status === 'match') {
              setIaAnalysis('match');
          } else {
              setIaAnalysis('diff');
              setIaReason(iaResult?.reason || "A redação do banco difere do Planalto e precisa de atualização.");
          }
      } catch (err: any) {
          console.error(err);
          toast.error("Erro na análise da IA: " + err.message);
          setIaAnalysis('pending');
      }
  };

  const applyUpdate = async () => {
      if (!selectedLaw || !selectedArticle) return;
      try {
          if (!dbArticleId) throw new Error("ID do artigo nativo não encontrado para update.");
          
          toast.loading("Atualizando banco...", { id: "update-banco" });
          const { error } = await supabase
              .from('vade_mecum_artigos')
              .update({ texto: selectedArticle.texto_novo })
              .eq('id', dbArticleId);
          
          if (error) throw error;
          
          toast.success("Banco de Dados Atualizado com Sucesso!", { id: "update-banco" });
          setIaAnalysis('updated');
      } catch (err: any) {
          console.error(err);
          toast.error("Falha ao salvar: " + err.message, { id: "update-banco" });
      }
  };

  const extractAutoria = (texto: string) => {
      if (!texto) return { textoLimpo: '', autoria: null };
      const regex = /\s*(\(?(?:INCLUÍD[OA]|ALTERAD[OA]|REDAÇÃO DADA|REVOGAD[OA]).+?(?:LEI|DECRETO|EMENDA).*?\d{4}\)?)\s*$/i;
      const match = texto.match(regex);
      if (match) {
          return { 
              textoLimpo: texto.replace(match[0], '').trim(), 
              autoria: match[1].replace(/^\(|\)$/g, '').trim()
          };
      }
      return { textoLimpo: texto, autoria: null };
  };

  const { textoLimpo: textoNovoLimpo, autoria: autoriaNovo } = extractAutoria(selectedArticle?.texto_novo || '');
  const { textoLimpo: textoAntigoLimpo } = extractAutoria(selectedArticle?.texto_antigo || '');
  const { autoria: autoriaMotivo } = extractAutoria(selectedArticle?.motivo || '');
  const motivoLimpo = autoriaMotivo || selectedArticle?.motivo || 'Alteração não especificada';

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0D0D0D]/95 backdrop-blur-md border-b border-white/10 px-4 py-4 flex items-center gap-3">
        <button
          onClick={goBack}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Scale className="w-5 h-5 text-purple-400" />
            {view === 'categories' && 'Categorias de Leis'}
            {view === 'laws' && selectedCategory.toUpperCase()}
            {view === 'scraper' && selectedLaw?.nome}
            {view === 'details' && selectedArticle?.artigo}
          </h1>
          <p className="text-xs text-gray-400">Rastreador de Atualizações do Planalto</p>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto space-y-6">
        
        {/* VIEW 1: CATEGORIES */}
        {view === 'categories' && (
           <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
               {categories.map(cat => (
                   <button 
                      key={cat} 
                      onClick={() => handleCategoryClick(cat)}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 text-left transition-all active:scale-95 flex flex-col gap-3"
                   >
                       <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                           <BookOpen className="w-6 h-6 text-purple-400" />
                       </div>
                       <div>
                           <h3 className="font-bold text-lg capitalize">{cat}</h3>
                           <p className="text-xs text-gray-500 mt-1">{LEIS_CATALOG.filter(l => l.tipo === cat).length} leis cadastradas</p>
                       </div>
                   </button>
               ))}
           </div>
        )}

        {/* VIEW 2: LAWS */}
        {view === 'laws' && (
           <div className="space-y-3">
               {lawsOfCategory.map(law => (
                   <button 
                      key={law.id}
                      onClick={() => handleLawClick(law)}
                      className="w-full bg-[#1A1A1A] hover:bg-[#2A2A2A] border border-white/5 rounded-2xl p-4 flex items-center justify-between transition-colors text-left"
                   >
                       <div>
                           <h3 className="font-bold text-white text-lg">{law.nome}</h3>
                           <p className="text-sm text-gray-400 mt-1">{law.descricao}</p>
                       </div>
                       <ChevronRight className="w-5 h-5 text-gray-500 shrink-0" />
                   </button>
               ))}
           </div>
        )}

        {/* VIEW 3: SCRAPER */}
        {view === 'scraper' && (
           <div className="space-y-6">
              <section className="bg-[#151515] border border-white/5 rounded-2xl p-6 space-y-5">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div>
                        <h2 className="font-black text-2xl uppercase text-white tracking-wider">{selectedLaw?.nome}</h2>
                        <a href={selectedLaw?.url_planalto} target="_blank" rel="noreferrer" className="text-sm text-gray-400 hover:text-blue-400 hover:underline flex items-center gap-1 mt-1">
                         Acessar fonte (Planalto) <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                    {lastScrapeDate && (
                        <div className="inline-flex items-center gap-2 bg-black/50 px-4 py-2 rounded-xl border border-white/5">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest leading-none">Última varredura</span>
                                <span className="text-sm text-gray-300 font-medium">{lastScrapeDate}</span>
                            </div>
                        </div>
                    )}
                </div>
                
                <button 
                  onClick={startScraping}
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl py-4 font-bold text-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-purple-900/20"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
                  {loading ? 'Raspando o Planalto (Aguarde)...' : 'Iniciar Varredura 360°'}
                </button>
              </section>

              {scrapedUpdates.length > 0 && (
                 <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8 mb-4">
                         <h3 className="font-black text-gray-300 uppercase tracking-widest text-sm">Atualizações Recentes:</h3>
                         
                         <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar w-full sm:w-auto">
                             {availableYears.map(year => (
                                 <button
                                     key={year}
                                     onClick={() => setSelectedYear(year)}
                                     className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-colors whitespace-nowrap border ${
                                         selectedYear === year
                                             ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                                             : 'bg-[#151515] border-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                     }`}
                                 >
                                     {year}
                                 </button>
                             ))}
                         </div>
                     </div>
                     
                     {filteredUpdates.length === 0 && (
                         <div className="text-center p-8 bg-[#1A1A1A] rounded-xl border border-white/5">
                             <p className="text-gray-400">Nenhuma atualização em {selectedYear}.</p>
                         </div>
                     )}

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {filteredUpdates.map((item, idx) => (
                             <button
                                key={idx}
                                onClick={() => handleArticleClick(item)}
                                className="bg-[#1A1A1A] border border-orange-500/10 hover:border-orange-500/30 hover:bg-[#1f1f1f] rounded-2xl p-5 text-left transition-all group flex flex-col h-full"
                             >
                                 <div className="flex justify-between items-start mb-3">
                                     <h4 className="font-black text-white text-lg group-hover:text-orange-400 transition-colors">{item.artigo}</h4>
                                     <span className="text-[10px] font-bold text-gray-400 bg-black/40 px-2 py-1 rounded border border-white/5 uppercase tracking-wider">
                                         Ano {item.ano}
                                     </span>
                                 </div>
                                 <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed flex-grow">
                                     <span className="text-orange-400 font-medium">{item.motivo}</span>
                                     <br/>{item.texto_novo}
                                 </p>
                                 <div className="mt-5 flex items-center text-gray-500 text-xs font-bold uppercase tracking-wider group-hover:text-white transition-colors">
                                     Analisar Sincronia <ChevronRight className="w-4 h-4 ml-1" />
                                 </div>
                             </button>
                         ))}
                     </div>
                 </section>
              )}
           </div>
        )}

        {/* VIEW 4: DETAILS & IA COMPARISON */}
        {view === 'details' && selectedArticle && (
           <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 pt-4">

               {/* Card de Data Solitário no Topo */}
               <div className="flex">
                   <div className="bg-[#1A1A1A] border border-white/10 rounded-xl px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 shadow-lg">
                       <div className="flex items-center gap-2">
                           <Clock className="w-4 h-4 text-gray-400" />
                           <span className="text-gray-400 text-sm font-medium uppercase tracking-wider">
                               {selectedArticle.data_completa ? (
                                   <strong className="text-white">{selectedArticle.data_completa}</strong>
                               ) : (
                                   <>ANO DA PUBLICAÇÃO: <strong className="text-white ml-1">{selectedArticle.ano}</strong></>
                               )}
                           </span>
                       </div>
                       {autoriaNovo && (
                           <div className="text-orange-400 text-[11px] sm:text-xs font-bold uppercase bg-orange-900/20 px-3 py-1 rounded-full border border-orange-500/20">
                               {autoriaNovo}
                           </div>
                       )}
                   </div>
               </div>

               {/* Badge de Data e Motivo */}
               <div className={`bg-gradient-to-r to-transparent border-l-4 p-5 rounded-r-lg ${
                   selectedArticle.motivo.toLowerCase().includes('incluíd')
                   ? 'from-blue-900/30 border-blue-500'
                   : 'from-orange-900/20 border-orange-500'
               }`}>
                   <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                       <div>
                           <div className={`font-bold text-sm uppercase tracking-wider mb-1 ${
                               selectedArticle.motivo.toLowerCase().includes('incluíd') ? 'text-blue-400' : 'text-orange-400'
                           }`}>
                               {selectedArticle.motivo.toLowerCase().includes('incluíd') ? 'INCLUSÃO OFICIAL' : 'ALTERAÇÃO OFICIAL'}
                           </div>
                            <h3 className="text-white text-lg font-medium leading-snug">{motivoLimpo}</h3>
                       </div>
                       <a 
                           href={selectedArticle.link_lei ? selectedArticle.link_lei : (selectedLaw?.url_planalto || '#')}
                           target="_blank"
                           rel="noopener noreferrer"
                           title={selectedArticle.link_lei ? `Acessar Lei Inclusora/Alteradora no site oficial` : `Link específico não disponibilizado pelo Planalto`}
                           className={`relative z-10 shrink-0 flex flex-col items-center justify-center gap-1 px-4 py-2 ${
                               selectedArticle.link_lei ? 'bg-[#222] hover:bg-[#333] cursor-pointer' : 'bg-[#111] opacity-70 cursor-not-allowed'
                           } transition-colors border border-white/10 rounded-lg text-sm text-gray-300`}
                       >
                           <div className="flex items-center gap-2">
                               {selectedArticle.link_lei ? 'Acessar Lei Modificadora' : 'Lei Modificadora (Sem Link)'}
                               <ExternalLink className={`w-4 h-4 ${
                                   selectedArticle.link_lei ? (selectedArticle.motivo.toLowerCase().includes('incluíd') ? 'text-blue-400' : 'text-orange-400') : 'text-gray-600'
                               }`} />
                           </div>
                       </a>
                   </div>
               </div>

               {/* Comparação dos Textos (Antigo vs Novo) */}
               <div className="grid grid-cols-1 gap-6">
                   {selectedArticle.motivo.toLowerCase().includes('incluíd') ? (
                       <div className="bg-[#111111] border border-blue-900/30 rounded-xl p-5 relative overflow-hidden">
                           <div className="absolute top-0 left-0 w-1 h-full bg-blue-900/50" />
                           <h4 className="flex items-center gap-2 font-bold text-blue-500 text-sm mb-4">
                               <FileText className="w-4 h-4" />
                               DISPOSITIVO INCLUÍDO
                           </h4>
                           <p className="text-gray-400 font-serif leading-relaxed">Trata-se de uma inclusão de novo dispositivo inédito. Não há texto anterior (revogado) para ser comparado.</p>
                       </div>
                   ) : (
                       <div className="bg-[#111111] border border-red-900/30 rounded-xl p-5 relative overflow-hidden">
                           <div className="absolute top-0 left-0 w-1 h-full bg-red-900/50" />
                           <h4 className="flex items-center gap-2 font-bold text-red-500 text-sm mb-4">
                               <FileText className="w-4 h-4" />
                               TEXTO ANTIGO (REVOGADO/ALTERADO)
                           </h4>
                           <p className="text-gray-400 font-serif leading-relaxed line-through decoration-red-900/50">{textoAntigoLimpo || "Não foi possível extrair o texto revogado com exatidão."}</p>
                       </div>
                   )}
                   
                   <div className="bg-[#111111] border border-green-900/30 rounded-xl p-5 relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-1 h-full bg-green-900/50" />
                       <h4 className="flex items-center gap-2 font-bold text-green-500 text-sm mb-4">
                           <FileText className="w-4 h-4" />
                           TEXTO NOVO (PLANALTO)
                       </h4>
                       <p className="text-gray-200 font-serif leading-relaxed text-lg">{textoNovoLimpo}</p>
                   </div>
               </div>

               {/* Caixa do Gemini IA */}
               <div className="bg-[#151515] border border-white/10 rounded-xl p-6 sm:p-8 mt-4 shadow-xl">
                   <div className="text-center mb-8">
                       <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-gray-800 to-gray-700 flex items-center justify-center mx-auto mb-4">
                           <Bot className="w-7 h-7 text-white" />
                       </div>
                       <h3 className="font-black text-xl text-white uppercase tracking-wider">Análise de Sincronia (IA)</h3>
                       <p className="text-gray-400 mt-2 max-w-2xl mx-auto">
                           A Inteligência Artificial irá cruzar o texto oficial do Planalto com a base de dados do aplicativo.
                       </p>
                   </div>
                   
                   {iaAnalysis === 'pending' && (
                       <div className="flex justify-center">
                         <Button onClick={runIAComparison} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8">
                             Comparar com o Banco
                         </Button>
                       </div>
                   )}
                   
                   {iaAnalysis === 'analyzing' && (
                       <div className="flex flex-col items-center gap-3 text-blue-300">
                           <Loader2 className="w-6 h-6 animate-spin" />
                           <span className="font-medium animate-pulse">Gemini 2.5 Flash analisando os textos...</span>
                       </div>
                   )}

                   {iaAnalysis === 'diff' && (
                       <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-5 sm:p-6 text-left animate-in zoom-in-95">
                           <div className="flex flex-col sm:flex-row items-start gap-4">
                               <div className="bg-orange-500/20 p-2 rounded-lg shrink-0">
                                   <AlertTriangle className="w-6 h-6 text-orange-400" />
                               </div>
                               <div className="flex-1 w-full">
                                   <h4 className="font-bold text-orange-400 text-lg">Banco Desatualizado</h4>
                                   <p className="text-orange-200/70 text-sm mt-2 leading-relaxed">{iaReason}</p>
                                   
                                   <div className="mt-5 bg-black/60 p-4 rounded-lg border border-orange-500/10">
                                       <span className="text-xs font-bold text-orange-500/50 block mb-2 uppercase tracking-wider">Redação Atual (No App):</span>
                                       <p className="text-sm text-gray-400 font-serif leading-relaxed line-clamp-4">{bancoText}</p>
                                   </div>

                                   <div className="mt-6 flex justify-end">
                                       <Button onClick={applyUpdate} size="lg" className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto text-white font-bold shadow-lg shadow-orange-900/20 transition-all">
                                           Aplicar Atualização
                                       </Button>
                                   </div>
                               </div>
                           </div>
                       </div>
                   )}

                   {iaAnalysis === 'updated' && (
                       <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-5 sm:p-6 text-left animate-in zoom-in-95">
                           <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                               <div className="bg-purple-500/20 p-3 rounded-full shrink-0">
                                   <CheckCircle2 className="w-8 h-8 text-purple-400" />
                               </div>
                               <div className="flex-1">
                                   <h4 className="font-bold text-purple-300 text-xl">Banco Sincronizado!</h4>
                                   <p className="text-purple-200/60 text-sm mt-2">A alteração do Planalto foi gravada no banco e já está visível para os alunos.</p>
                                   <div className="mt-6 flex justify-center sm:justify-start">
                                       <Button onClick={() => setView('scraper')} variant="outline" className="bg-transparent border-purple-500/30 hover:bg-purple-900/20 text-purple-300">
                                           Voltar para a Lista de Alterações
                                       </Button>
                                   </div>
                               </div>
                           </div>
                       </div>
                   )}

                   {iaAnalysis === 'match' && (
                       <div className="bg-[#1A1A1A] border-l-4 border-green-500 rounded-lg p-4 text-left animate-in zoom-in-95">
                           <div className="flex items-center gap-3">
                               <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                               <div>
                                   <h4 className="font-bold text-white">Tudo em Ordem!</h4>
                                   <p className="text-gray-400 text-sm mt-1">O texto do banco já está sincronizado com a redação mais recente.</p>
                               </div>
                           </div>
                       </div>
                   )}
               </div>
           </div>
        )}
      </main>
    </div>
  );
}
