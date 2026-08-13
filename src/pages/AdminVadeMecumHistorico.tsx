import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Scale, Search, Loader2, RefreshCcw, CheckCircle } from 'lucide-react';
import { LEIS_CATALOG } from '@/data/leisCatalog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function AdminVadeMecumHistorico() {
  const navigate = useNavigate();
  const [selectedLaw, setSelectedLaw] = useState('');
  const [loading, setLoading] = useState(false);
  const [scrapedUpdates, setScrapedUpdates] = useState<any[]>([]);

  const startScraping = async () => {
    if (!selectedLaw) return;
    
    const leiData = LEIS_CATALOG.find(l => l.tabela_nome === selectedLaw);
    if (!leiData?.url_planalto) {
        toast.error("Esta lei não tem URL oficial do planalto configurada no catálogo.");
        return;
    }

    setLoading(true);
    setScrapedUpdates([]);
    try {
      const { data, error } = await supabase.functions.invoke('vademecum-scraper', {
          body: { targetUrl: leiData.url_planalto, maxAgeYears: 5 }
      });
      
      if (error) throw error;
      if (data?.articles) {
          setScrapedUpdates(data.articles);
          toast.success(`Foram encontradas ${data.articles.length} alterações recentes no Planalto.`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Falha na varredura.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0D0D0D]/95 backdrop-blur-md border-b border-white/10 px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/admin-funcoes')}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Scale className="w-5 h-5 text-purple-400" />
            Histórico do Vade Mecum
          </h1>
          <p className="text-xs text-gray-400">Rastreador de Atualizações do Planalto</p>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-6">
        {/* Seletor */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-300">1. Selecione a Lei para Varredura</h2>
          <div className="flex flex-col gap-3">
            <select 
              className="bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500"
              value={selectedLaw}
              onChange={(e) => setSelectedLaw(e.target.value)}
            >
              <option value="">Escolha uma lei...</option>
              {Array.from(new Set(LEIS_CATALOG.map(l => l.tipo))).map(tipo => (
                <optgroup key={tipo} label={tipo.toUpperCase()}>
                  {LEIS_CATALOG.filter(l => l.tipo === tipo).map(lei => (
                    <option key={lei.tabela_nome} value={lei.tabela_nome}>
                      {lei.nome}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            <button 
              onClick={startScraping}
              disabled={!selectedLaw || loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              {loading ? 'Raspando dados oficiais...' : 'Iniciar Varredura'}
            </button>
          </div>
        </section>

        {/* Resultados Placeholder */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-300">2. Artigos Identificados com Mudança (Planalto)</h2>
          
          {scrapedUpdates.length > 0 ? (
            <div className="space-y-3">
               {scrapedUpdates.map((item, idx) => (
                  <div key={idx} className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                          <h3 className="text-white font-bold">{item.artigo}</h3>
                          <p className="text-xs text-orange-400 mt-1">{item.motivo}</p>
                      </div>
                      <button className="shrink-0 bg-white/10 hover:bg-white/20 text-white rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-2 transition-colors">
                          <RefreshCcw className="w-4 h-4" /> Comparar com o Banco
                      </button>
                  </div>
               ))}
            </div>
          ) : (
            <div className={`text-center py-10 bg-white/5 rounded-2xl border border-white/5 border-dashed ${loading ? 'opacity-50' : ''}`}>
              <Scale className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                {loading ? 'Aguardando o robô do Browserless ler o site...' : 'Selecione uma lei acima para rastrear o Planalto.'}
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
