import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { useNavigate } from 'react-router-dom';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { Download, PlayCircle, Search, FileText, FileSignature } from 'lucide-react';

interface SimuladoItem {
  id: string;
  year: number;
  prova_url: string;
  gabarito_url: string;
  edital_url: string;
  created_at: string;
  exam: {
    name: string;
  };
}

export default function FerramentasSimulados() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: simuladosList, isLoading } = useQuery({
    queryKey: ['simulados_list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('simulados')
        .select(`
          *,
          exam:simulado_exams(name)
        `)
        .order('year', { ascending: false });
        
      if (error) throw error;
      // We typecast it just for safety here
      return data as any[];
    }
  });

  const filteredSimulados = simuladosList?.filter((sim) => {
    const examName = sim.exam?.name || '';
    return examName.toLowerCase().includes(searchTerm.toLowerCase()) || 
           sim.year?.toString().includes(searchTerm);
  }) || [];

  const handleDownload = (url: string) => {
    if (!url) return;
    window.open(url, '_blank');
  };

  const mobileHeader = (
    <PageHeader
      title="Simulados & Provas"
      subtitle="Pratique com provas anteriores e simulados"
      onBack={() => navigate('/ferramentas')}
    />
  );

  return (
    <DesktopPageLayout
      activeId="ferramentas"
      title="Simulados & Provas"
      subtitle="Pratique com provas anteriores e cadernos de questões"
      mobileHeader={mobileHeader}
      wide
    >
      <div className="fixed inset-0 pointer-events-none z-0">
        <ShapeGrid 
          speed={0.5} 
          squareSize={40}
          direction='diagonal'
          borderColor='rgba(255, 255, 255, 0.05)'
          hoverFillColor='rgba(255, 255, 255, 0.1)'
          shape='square'
        />
      </div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1200px] mx-auto pb-[calc(7rem+var(--sai-bottom))] lg:pb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar por título ou ano..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-10 pr-4 rounded-xl bg-card border border-border focus:border-primary/50 transition-colors"
          />
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[200px] rounded-2xl bg-card animate-pulse border border-border" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSimulados.map((sim) => (
              <div key={sim.id} className="flex flex-col bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/40 transition-colors group">
                <div className="p-5 flex-1 flex flex-col items-start text-left">
                  <div className="flex justify-between items-start mb-3 w-full">
                    <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded-md">
                      {sim.year || 'Ano ND'}
                    </span>
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium truncate max-w-[120px]">
                      Concurso
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-[16px] leading-tight text-foreground mb-1 line-clamp-2">
                    {sim.exam?.name || 'Sem título'}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Simulado Completo
                  </p>
                </div>
                
                <div className="bg-muted/30 p-3 grid grid-cols-3 gap-2 border-t border-border">
                  <button 
                    onClick={() => handleDownload(sim.prova_url)}
                    disabled={!sim.prova_url}
                    className="flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-lg hover:bg-card border border-transparent hover:border-border transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-transparent text-[11px] font-medium text-muted-foreground hover:text-foreground active:scale-95"
                  >
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <span className="truncate w-full text-center">Prova</span>
                  </button>
                  <button 
                    onClick={() => handleDownload(sim.gabarito_url)}
                    disabled={!sim.gabarito_url}
                    className="flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-lg hover:bg-card border border-transparent hover:border-border transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-transparent text-[11px] font-medium text-muted-foreground hover:text-foreground active:scale-95"
                  >
                    <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="truncate w-full text-center">Gabarito</span>
                  </button>
                  <button 
                    onClick={() => navigate(`/ferramentas/simulados/resolver/${sim.id}`)}
                    className="flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-[11px] font-medium active:scale-95"
                  >
                    <PlayCircle className="w-4 h-4 shrink-0" />
                    <span className="truncate w-full text-center">Resolver</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && filteredSimulados.length === 0 && (
          <div className="text-center py-16 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
              <FileSignature className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display font-bold text-lg text-foreground">Nenhum simulado</h3>
            <p className="text-muted-foreground max-w-sm">
              Não encontramos simulados correspondentes à sua busca no momento.
            </p>
          </div>
        )}
      </div>
    </DesktopPageLayout>
  );
}
