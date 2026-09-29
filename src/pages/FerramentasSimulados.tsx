import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { useNavigate } from 'react-router-dom';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { Download, PlayCircle, Search, FileText, FileSignature } from 'lucide-react';

interface SimuladoExam {
  id: string;
  title: string;
  banca: string;
  institution: string;
  year: number;
  pdf_prova_url: string;
  pdf_gabarito_url: string;
  pdf_edital_url: string;
  created_at: string;
}

export default function FerramentasSimulados() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: exams, isLoading } = useQuery({
    queryKey: ['simulado_exams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('simulado_exams')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data as SimuladoExam[];
    }
  });

  const filteredExams = exams?.filter((exam) => 
    exam.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (exam.banca && exam.banca.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (exam.institution && exam.institution.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

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
            placeholder="Buscar por título, banca ou instituição..." 
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
            {filteredExams.map((exam) => (
              <div key={exam.id} className="flex flex-col bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/40 transition-colors group">
                <div className="p-5 flex-1 flex flex-col items-start text-left">
                  <div className="flex justify-between items-start mb-3 w-full">
                    <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded-md">
                      {exam.year || 'Ano ND'}
                    </span>
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium truncate max-w-[120px]">
                      {exam.banca || 'Banca ND'}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-[16px] leading-tight text-foreground mb-1 line-clamp-2">
                    {exam.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {exam.institution}
                  </p>
                </div>
                
                <div className="bg-muted/30 p-3 grid grid-cols-3 gap-2 border-t border-border">
                  <button 
                    onClick={() => handleDownload(exam.pdf_prova_url)}
                    disabled={!exam.pdf_prova_url}
                    className="flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-lg hover:bg-card border border-transparent hover:border-border transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-transparent text-[11px] font-medium text-muted-foreground hover:text-foreground active:scale-95"
                  >
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <span className="truncate w-full text-center">Prova</span>
                  </button>
                  <button 
                    onClick={() => handleDownload(exam.pdf_gabarito_url)}
                    disabled={!exam.pdf_gabarito_url}
                    className="flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-lg hover:bg-card border border-transparent hover:border-border transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-transparent text-[11px] font-medium text-muted-foreground hover:text-foreground active:scale-95"
                  >
                    <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="truncate w-full text-center">Gabarito</span>
                  </button>
                  <button 
                    onClick={() => navigate(`/ferramentas/simulados/resolver/${exam.id}`)}
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

        {!isLoading && filteredExams.length === 0 && (
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
