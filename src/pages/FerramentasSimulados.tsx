import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { useNavigate } from 'react-router-dom';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { Download, PlayCircle, Search, FileText, FileSignature, ChevronDown, GraduationCap, Scale, ChevronRight } from 'lucide-react';

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
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

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
      return data as any[];
    }
  });

  const filteredSimulados = simuladosList?.filter((sim) => {
    const examName = sim.exam?.name || '';
    return examName.toLowerCase().includes(searchTerm.toLowerCase()) || 
           sim.year?.toString().includes(searchTerm);
  }) || [];

  const groupedSimulados = useMemo(() => {
    const groups: Record<string, SimuladoItem[]> = {};
    filteredSimulados.forEach(sim => {
      let cat = sim.exam?.name?.trim() || 'Outros';
      // Normalize to "Juiz de Direito" if the user has a specific preference for that nomenclature
      if (cat.toLowerCase().includes('juiz substituto')) {
        cat = 'Juiz de Direito';
      }
      
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(sim);
    });
    
    // Sort items within each category by year descending
    Object.keys(groups).forEach(cat => {
      groups[cat].sort((a, b) => (b.year || 0) - (a.year || 0));
    });
    
    return groups;
  }, [filteredSimulados]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

  const handleDownload = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
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
            placeholder="Buscar por cargo, prova ou ano..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-10 pr-4 rounded-xl bg-card border border-border focus:border-primary/50 transition-colors"
          />
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-card animate-pulse border border-border" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedSimulados).map(([category, items]) => {
              const isExpanded = expandedCategories.includes(category);
              return (
                <div 
                  key={category} 
                  className={`bg-card rounded-2xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-primary/40 shadow-lg shadow-primary/5' : 'border-border hover:border-primary/20'}`}
                >
                  <button 
                    onClick={() => toggleCategory(category)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center transition-colors ${isExpanded ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                        {category.toLowerCase().includes('juiz') || category.toLowerCase().includes('direito') ? (
                          <Scale className="w-6 h-6 sm:w-7 sm:h-7" />
                        ) : (
                          <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-lg sm:text-xl text-foreground tracking-tight">
                          {category}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {items.length} {items.length === 1 ? 'prova disponível' : 'provas disponíveis'}
                        </p>
                      </div>
                    </div>
                    <div className={`p-2 rounded-full transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-primary/10 text-primary' : 'bg-transparent text-muted-foreground'}`}>
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border bg-muted/10 p-4 sm:p-5 animate-in slide-in-from-top-2 fade-in duration-300">
                      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {items.map((sim) => (
                          <div 
                            key={sim.id} 
                            className="flex flex-col bg-card rounded-xl border border-border overflow-hidden hover:border-primary/30 transition-all hover:shadow-md group"
                          >
                            <div className="p-4 flex-1 flex flex-col items-start text-left">
                              <div className="flex justify-between items-center mb-3 w-full">
                                <span className="text-xs font-bold px-2.5 py-1 bg-primary/15 text-primary rounded-md">
                                  {sim.year || 'Ano ND'}
                                </span>
                                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1">
                                  Simulado <ChevronRight className="w-3 h-3 opacity-50" />
                                </span>
                              </div>
                              <h4 className="font-display font-semibold text-[15px] leading-snug text-foreground mb-1">
                                {sim.exam?.name || 'Sem título'}
                              </h4>
                            </div>
                            
                            <div className="bg-muted/40 p-2.5 grid grid-cols-3 gap-1.5 border-t border-border">
                              <button 
                                onClick={(e) => handleDownload(e, sim.prova_url)}
                                disabled={!sim.prova_url}
                                className="flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-lg hover:bg-card border border-transparent hover:border-border transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-transparent text-[11px] font-medium text-muted-foreground hover:text-foreground active:scale-95"
                              >
                                <FileText className="w-4 h-4 text-primary shrink-0" />
                                <span className="truncate w-full text-center">Prova</span>
                              </button>
                              <button 
                                onClick={(e) => handleDownload(e, sim.gabarito_url)}
                                disabled={!sim.gabarito_url}
                                className="flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-lg hover:bg-card border border-transparent hover:border-border transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-transparent text-[11px] font-medium text-muted-foreground hover:text-foreground active:scale-95"
                              >
                                <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span className="truncate w-full text-center">Gabarito</span>
                              </button>
                              <button 
                                onClick={() => navigate(`/ferramentas/simulados/resolver/${sim.id}`)}
                                className="flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-[11px] font-medium active:scale-95 shadow-sm"
                              >
                                <PlayCircle className="w-4 h-4 shrink-0" />
                                <span className="truncate w-full text-center">Resolver</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && filteredSimulados.length === 0 && (
          <div className="text-center py-20 flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center border border-border">
              <FileSignature className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-foreground">Nenhum simulado</h3>
              <p className="text-muted-foreground max-w-sm mt-1">
                Não encontramos simulados ou exames correspondentes à sua busca.
              </p>
            </div>
          </div>
        )}
      </div>
    </DesktopPageLayout>
  );
}
