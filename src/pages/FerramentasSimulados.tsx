import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { useNavigate } from 'react-router-dom';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { PlayCircle, Search, FileText, FileSignature, GraduationCap, Scale, ChevronRight, ArrowLeft, History } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSimulado, setSelectedSimulado] = useState<SimuladoItem | null>(null);

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
      if (cat.toLowerCase().includes('juiz substituto')) {
        cat = 'Juiz de Direito';
      }
      
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(sim);
    });
    
    Object.keys(groups).forEach(cat => {
      groups[cat].sort((a, b) => (b.year || 0) - (a.year || 0));
    });
    
    return groups;
  }, [filteredSimulados]);

  const handleDownload = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    if (!url) return;
    window.open(url, '_blank');
  };

  const mobileHeader = selectedCategory ? (
    <PageHeader
      title={selectedCategory}
      subtitle={`${groupedSimulados[selectedCategory]?.length || 0} provas disponíveis`}
      onBack={() => setSelectedCategory(null)}
    />
  ) : (
    <PageHeader
      title="Simulados & Provas"
      subtitle="Pratique com provas anteriores e simulados"
      onBack={() => navigate('/ferramentas')}
    />
  );

  return (
    <DesktopPageLayout
      activeId="ferramentas"
      title={selectedCategory ? selectedCategory : "Simulados & Provas"}
      subtitle={selectedCategory ? `${groupedSimulados[selectedCategory]?.length || 0} provas disponíveis` : "Pratique com provas anteriores e cadernos de questões"}
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
        
        {/* Navigation Back Button for Desktop */}
        {selectedCategory && (
          <button 
            onClick={() => setSelectedCategory(null)}
            className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar para Categorias
          </button>
        )}

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder={selectedCategory ? "Buscar prova ou ano nesta categoria..." : "Buscar por cargo, prova ou ano..."} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-10 pr-4 rounded-xl bg-card border border-border focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-card animate-pulse border border-border" />
            ))}
          </div>
        ) : !selectedCategory ? (
          <div className="space-y-4">
            {Object.entries(groupedSimulados).map(([category, items]) => (
              <button 
                key={category} 
                onClick={() => setSelectedCategory(category)}
                className="w-full bg-card rounded-2xl border border-border hover:border-primary/30 transition-all duration-300 flex items-center justify-between p-4 sm:p-5 hover:bg-muted/30 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
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
                <div className="p-2 rounded-full bg-transparent text-muted-foreground">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {groupedSimulados[selectedCategory]?.map((sim) => (
              <button 
                key={sim.id} 
                onClick={() => setSelectedSimulado(sim)}
                className="flex flex-col bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] group text-left"
              >
                <div className="p-5 flex-1 flex flex-col items-start w-full relative">
                  <div className="flex justify-between items-center mb-4 w-full">
                    <span className="text-sm font-bold px-3 py-1 bg-primary/15 text-primary rounded-lg">
                      {sim.year || 'Ano ND'}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1">
                      Simulado <ChevronRight className="w-3 h-3 opacity-50" />
                    </span>
                  </div>
                  <h4 className="font-display font-semibold text-base sm:text-lg leading-snug text-foreground mb-2 group-hover:text-primary transition-colors">
                    {sim.exam?.name || 'Sem título'}
                  </h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-auto">
                    <FileSignature className="w-3.5 h-3.5" /> Toque para abrir opções
                  </p>
                </div>
              </button>
            ))}
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

      <Sheet open={!!selectedSimulado} onOpenChange={(open) => !open && setSelectedSimulado(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl bg-card border-border p-0 overflow-hidden flex flex-col sm:max-w-md sm:mx-auto">
          <div className="p-6">
            <SheetHeader className="text-left mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-bold px-2.5 py-1 bg-primary/15 text-primary rounded-md">
                  {selectedSimulado?.year || 'Ano ND'}
                </span>
                <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                  Simulado
                </span>
              </div>
              <SheetTitle className="text-xl sm:text-2xl font-display font-bold text-foreground leading-tight">
                {selectedSimulado?.exam?.name || 'Sem título'}
              </SheetTitle>
            </SheetHeader>
            
            <div className="space-y-4">
              <button 
                onClick={() => {
                  if (selectedSimulado) navigate(`/ferramentas/simulados/resolver/${selectedSimulado.id}`);
                }}
                className="w-full relative overflow-hidden bg-gradient-to-r from-primary/90 to-primary text-primary-foreground font-bold text-[16px] py-4 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_4px_20px_-4px_rgba(239,68,68,0.3)]"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
                <PlayCircle className="w-5 h-5 drop-shadow-sm" /> 
                <span className="drop-shadow-sm tracking-wide">INICIAR SIMULADO</span>
              </button>

              <div className="grid grid-cols-2 gap-3">
                 <button 
                   onClick={(e) => selectedSimulado && handleDownload(e, selectedSimulado.prova_url)} 
                   disabled={!selectedSimulado?.prova_url}
                   className="bg-zinc-900/50 hover:bg-zinc-900 disabled:opacity-50 text-foreground py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all font-medium text-[13px] border border-white/5 hover:border-white/10 shadow-sm"
                 >
                   <FileText className="w-4 h-4 text-zinc-400" /> Ver Prova
                 </button>
                 <button 
                   onClick={(e) => selectedSimulado && handleDownload(e, selectedSimulado.gabarito_url)} 
                   disabled={!selectedSimulado?.gabarito_url}
                   className="bg-zinc-900/50 hover:bg-zinc-900 disabled:opacity-50 text-foreground py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all font-medium text-[13px] border border-white/5 hover:border-white/10 shadow-sm"
                 >
                   <FileText className="w-4 h-4 text-emerald-500/80" /> Ver Gabarito
                 </button>
              </div>
              
              <button 
                onClick={() => { /* Placeholder logic for history */ }}
                className="w-full bg-zinc-950 border border-white/5 text-zinc-300 hover:text-white hover:bg-zinc-900 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all font-medium text-[13px] shadow-sm"
              >
                 <History className="w-4 h-4 opacity-70" /> Ver Histórico e Acertos
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </DesktopPageLayout>
  );
}
