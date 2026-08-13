import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Scale, Search, Loader2, RefreshCcw, FileText, ChevronRight, BookOpen, ExternalLink, Bot, CheckCircle2, AlertTriangle } from 'lucide-react';
import { LEIS_CATALOG, type LeiCatalogItem } from '@/data/leisCatalog';
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
      setView('scraper');
  };

  const handleArticleClick = (article: any) => {
      setSelectedArticle(article);
      setIaAnalysis('pending');
      setIaReason('');
      setView('details');
  };

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
      if (data?.articles) {
          setScrapedUpdates(data.articles);
          toast.success(`Varredura concluída. ${data.articles.length} atualizações encontradas.`);
      }
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
          // 1. Fetch current text from database
          const { data: dbData, error: dbError } = await supabase
              .from('vademecum')
              .select('id, texto')
              .eq('tabela_nome', selectedLaw?.tabela_nome)
              .eq('artigo', selectedArticle.artigo)
              .maybeSingle();
          
          const textoNoBanco = dbData?.texto || "Artigo não encontrado no banco de dados.";
          setBancoText(textoNoBanco);

          // 2. Invoke Gemini Edge Function
          const { data: iaResult, error: iaError } = await supabase.functions.invoke('vademecum-compare-ia', {
              body: { 
                  textoBanco: textoNoBanco,
                  textoPlanaltoAntigo: selectedArticle.texto_antigo,
                  textoPlanaltoNovo: selectedArticle.texto_novo
              }
          });

          if (iaError) throw iaError;

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
          toast.loading("Atualizando banco...", { id: "update-banco" });
          const { error } = await supabase
              .from('vademecum')
              .update({ texto: selectedArticle.texto_novo })
              .eq('tabela_nome', selectedLaw.tabela_nome)
              .eq('artigo', selectedArticle.artigo);
          
          if (error) throw error;
          
          toast.success("Banco de Dados Atualizado com Sucesso!", { id: "update-banco" });
          setIaAnalysis('updated');
      } catch (err: any) {
          console.error(err);
          toast.error("Falha ao salvar: " + err.message, { id: "update-banco" });
      }
  };

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
              <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="font-bold text-xl">{selectedLaw?.nome}</h2>
                        <a href={selectedLaw?.url_planalto} target="_blank" rel="noreferrer" className="text-sm text-blue-400 hover:underline flex items-center gap-1 mt-2">
                           Acessar fonte (Planalto) <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
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
                     <h3 className="font-bold text-gray-300">Atualizações Recentes Identificadas:</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {scrapedUpdates.map((item, idx) => (
                             <button
                                key={idx}
                                onClick={() => handleArticleClick(item)}
                                className="bg-[#1A1A1A] border border-orange-500/20 hover:border-orange-500/50 rounded-2xl p-5 text-left transition-all"
                             >
                                 <h4 className="font-bold text-white text-lg">{item.artigo}</h4>
                                 <p className="text-sm text-gray-400 mt-2 line-clamp-3 leading-relaxed">
                                     <span className="text-orange-400 font-medium">{item.motivo}</span>
                                     <br/>{item.texto_novo}
                                 </p>
                                 <div className="mt-4 flex items-center text-purple-400 text-sm font-semibold gap-1">
                                     Analisar com IA <ChevronRight className="w-4 h-4" />
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
           <div className="space-y-6">
               
               {/* Side-by-side texts */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-5 space-y-3">
                       <h3 className="font-bold text-red-400 flex items-center gap-2">
                           <FileText className="w-4 h-4" /> Texto Antigo (Revogado/Alterado)
                       </h3>
                       <p className="text-sm text-gray-300 leading-relaxed font-serif line-through decoration-red-500/50">
                           {selectedArticle.texto_antigo || "Não foi possível extrair o texto revogado com exatidão."}
                       </p>
                   </div>
                   <div className="bg-green-950/20 border border-green-500/20 rounded-2xl p-5 space-y-3">
                       <h3 className="font-bold text-green-400 flex items-center gap-2">
                           <FileText className="w-4 h-4" /> Texto Novo (Planalto)
                       </h3>
                       <p className="text-sm text-gray-300 leading-relaxed font-serif">
                           {selectedArticle.texto_novo || "Não extraído."}
                       </p>
                       <div className="mt-4 inline-block bg-white/10 px-3 py-1 rounded-full text-xs text-orange-300">
                           {selectedArticle.motivo}
                       </div>
                   </div>
               </div>

               {/* IA Module */}
               <div className="bg-blue-950/20 border border-blue-500/20 rounded-2xl p-6 text-center space-y-4">
                   <Bot className="w-10 h-10 text-blue-400 mx-auto" />
                   <h3 className="font-bold text-lg text-blue-100">Análise de Sincronia (Gemini IA)</h3>
                   <p className="text-sm text-blue-200/70 max-w-lg mx-auto">
                       A Inteligência Artificial irá ler o texto oficial do Planalto e comparar com o que temos atualmente no nosso Banco de Dados para ver se você precisa aplicar esta atualização.
                   </p>
                   
                   {iaAnalysis === 'pending' && (
                       <Button onClick={runIAComparison} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8">
                           Comparar com o Banco
                       </Button>
                   )}
                   
                   {iaAnalysis === 'analyzing' && (
                       <div className="flex flex-col items-center gap-3 text-blue-300">
                           <Loader2 className="w-6 h-6 animate-spin" />
                           <span className="font-medium animate-pulse">Gemini 2.5 Flash analisando os textos...</span>
                       </div>
                   )}

                   {iaAnalysis === 'diff' && (
                       <div className="bg-[#1A1A1A] border-l-4 border-orange-500 rounded-lg p-4 text-left animate-in zoom-in-95">
                           <div className="flex items-start gap-3">
                               <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                               <div>
                                   <h4 className="font-bold text-white text-lg">Banco Desatualizado</h4>
                                   <p className="text-gray-400 text-sm mt-1 leading-relaxed">{iaReason}</p>
                                   <div className="mt-4 bg-black/40 p-3 rounded-lg border border-white/5">
                                       <span className="text-xs font-bold text-gray-500 block mb-1">Como está hoje no seu app:</span>
                                       <p className="text-sm text-gray-400 font-serif line-clamp-3">{bancoText}</p>
                                   </div>
                                   <Button onClick={applyUpdate} className="mt-4 bg-orange-600 hover:bg-orange-700 w-full md:w-auto text-white">
                                       Aplicar Atualização no Banco
                                   </Button>
                               </div>
                           </div>
                       </div>
                   )}

                   {iaAnalysis === 'updated' && (
                       <div className="bg-[#1A1A1A] border-l-4 border-purple-500 rounded-lg p-4 text-left animate-in zoom-in-95">
                           <div className="flex items-center gap-3">
                               <CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0" />
                               <div>
                                   <h4 className="font-bold text-white">Banco Sincronizado!</h4>
                                   <p className="text-gray-400 text-sm mt-1">O Vade Mecum já reflete a alteração do Planalto para seus alunos.</p>
                                   <Button onClick={goBack} variant="outline" className="mt-4 bg-transparent border-purple-500/50 hover:bg-purple-900/20 text-white">
                                       Voltar para a Lista
                                   </Button>
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
