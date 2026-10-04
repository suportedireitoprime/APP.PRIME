import React from "react";
import DesktopPageLayout from "@/components/layout/DesktopPageLayout";
import ShapeGrid from "@/components/ui/ShapeGrid";
import { ArrowLeft, ChevronRight, FileSignature } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/vademecum/navigation/PageHeader";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Simulados() {
  const navigate = useNavigate();

  const mobileHeader = (
    <PageHeader
      title="Simulados"
      subtitle="Provas e Cadernos"
      onBack={() => navigate('/ferramentas')}
    />
  );

  const { data: categorias, isLoading } = useQuery({
    queryKey: ['simulados_ativos_list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('simulado_exams')
        .select(`
          id,
          name,
          simulados (
            id,
            year
          )
        `)
        .order('name');
        
      if (error) throw error;
      
      // Filtra para exibir apenas categorias que possuem simulados cadastrados
      return (data || []).filter(exam => exam.simulados && exam.simulados.length > 0);
    }
  });

  return (
    <DesktopPageLayout
      activeId="estudos"
      title="Simulados"
      subtitle="Provas e Cadernos"
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
        
        <button 
          onClick={() => navigate('/ferramentas')}
          className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>

        <div className="space-y-2 mb-6">
          <h2 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight uppercase">
            Simulados Disponíveis
          </h2>
          <p className="text-muted-foreground text-sm font-medium">
            Selecione uma prova para iniciar seu treino.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
             {[1, 2, 3].map(i => (
                <div key={i} className="h-[88px] w-full bg-card rounded-2xl animate-pulse border border-border" />
             ))}
          </div>
        ) : categorias?.length === 0 ? (
          <div className="text-center py-20 bg-card border border-border rounded-2xl flex flex-col items-center justify-center gap-4">
             <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center">
               <FileSignature className="w-8 h-8 text-muted-foreground/50" />
             </div>
             <p className="text-muted-foreground font-medium">Nenhum simulado cadastrado no momento.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            {categorias?.map((exam) => (
              <button 
                key={exam.id}
                onClick={() => navigate('/ferramentas/simulados', { state: { category: exam.name } })}
                className="w-full bg-card rounded-2xl border border-border hover:border-primary/50 transition-all duration-300 flex items-center justify-between p-4 sm:p-5 hover:bg-muted/30 text-left group shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                    {exam.name.toLowerCase().includes('juiz') || exam.name.toLowerCase().includes('direito') ? (
                      <img src="/assets/praticar-juiz.png" alt="Juiz" className="w-full h-full object-contain object-left drop-shadow-md" />
                    ) : (
                      <img src="/assets/eoab-woman-fixed.webp" alt="OAB" className="w-full h-full object-contain object-left drop-shadow-md scale-125 origin-center" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base sm:text-lg text-foreground tracking-tight group-hover:text-primary transition-colors">
                      {exam.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium">
                      {exam.simulados.length} {exam.simulados.length === 1 ? 'prova cadastrada' : 'provas cadastradas'}
                    </p>
                  </div>
                </div>
                <div className="p-2 rounded-full bg-transparent text-muted-foreground">
                  <ChevronRight className="w-5 h-5 group-hover:text-primary transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}

      </div>
    </DesktopPageLayout>
  );
}
