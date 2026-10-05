import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { useNavigate, useLocation } from 'react-router-dom';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { PlayCircle, Search, FileText, FileSignature, GraduationCap, Scale, ChevronRight, ArrowLeft, History, BarChart3, ExternalLink, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { haptic } from '@/lib/nativeHaptics';

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
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(location.state?.category || null);
  const [selectedSimulado, setSelectedSimulado] = useState<SimuladoItem | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewPdfTitle, setPreviewPdfTitle] = useState<string>('');
  const [showSobre, setShowSobre] = useState(false);

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

  const { data: raioXData, isLoading: loadingRaioX } = useQuery({
    queryKey: ['simulado_raiox', selectedSimulado?.id],
    queryFn: async () => {
      if (!selectedSimulado) return null;
      const { data, error } = await supabase
        .from('simulado_questions')
        .select('disciplina, assunto')
        .eq('simulado_id', selectedSimulado.id);
        
      if (error) throw error;
      
      const total = data.length;
      if (total === 0) return [];
      
      const counts: Record<string, { count: number, assuntos: Record<string, number> }> = {};
      
      data.forEach((q: any) => {
        const d = q.disciplina || 'Outras Disciplinas';
        const a = q.assunto || 'Tópico Geral';
        if (!counts[d]) counts[d] = { count: 0, assuntos: {} };
        counts[d].count++;
        if (!counts[d].assuntos[a]) counts[d].assuntos[a] = 0;
        counts[d].assuntos[a]++;
      });
      
      return Object.entries(counts)
        .map(([name, info]) => ({
          name,
          percent: Math.round((info.count / total) * 100),
          count: info.count,
          assuntos: Object.entries(info.assuntos)
            .map(([assunto, c]) => ({ name: assunto, count: c as number, percent: Math.round((c as number / info.count) * 100) }))
            .sort((a, b) => b.count - a.count)
        }))
        .sort((a, b) => b.count - a.count);
    },
    enabled: !!selectedSimulado
  });

  const [expandedRaioX, setExpandedRaioX] = useState<Record<string, boolean>>({});
  const toggleRaioX = (name: string) => {
    try { haptic.selection(); } catch {}
    setExpandedRaioX(prev => ({ ...prev, [name]: !prev[name] }));
  };

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
    try { haptic.selection(); } catch {}
    if (!url) return;
    window.open(url, '_blank');
  };

  const handlePreviewPdf = (e: React.MouseEvent, url: string, title: string) => {
    e.stopPropagation();
    try { haptic.selection(); } catch {}
    if (!url) return;
    setPreviewPdfUrl(url);
    setPreviewPdfTitle(title);
  };

  const handleStartSimulado = () => {
    if (!selectedSimulado) return;
    try { haptic.selection(); } catch {}
    
    setIsStarting(true);
    setTimeout(() => {
      navigate(`/ferramentas/simulados/resolver/${selectedSimulado.id}`);
      setTimeout(() => setIsStarting(false), 500);
    }, 800);
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
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col bg-card rounded-2xl border border-border p-5 relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                <div className="flex justify-between items-center mb-3">
                  <div className="h-4 w-32 bg-white/5 rounded" />
                  <div className="h-3 w-16 bg-white/5 rounded" />
                </div>
                <div className="h-6 w-48 bg-white/10 rounded mb-4" />
                <div className="h-3 w-40 bg-white/5 rounded" />
              </div>
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
                  <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center shrink-0">
                    {category.toLowerCase().includes('juiz') || category.toLowerCase().includes('direito') ? (
                      <img src="/assets/images/praticar-juiz.png" alt="Juiz" className="w-full h-full object-contain object-left drop-shadow-md" />
                    ) : (
                      <img src="/assets/images/eoab-woman-fixed.webp" alt="OAB" className="w-full h-full object-contain object-left drop-shadow-md" />
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
          <div className="relative py-4 max-w-3xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Linha vertical central */}
            <div className="absolute left-[24px] sm:left-1/2 top-4 bottom-4 w-1 bg-border/50 -translate-x-1/2 rounded-full" />
            
            {groupedSimulados[selectedCategory]?.map((sim, index) => {
              // No desktop intercala direita/esquerda. No mobile todos ficam na direita da linha.
              const isEven = index % 2 === 0;
              
              return (
                <div key={sim.id} className={`relative flex items-center mb-8 ${isEven ? 'sm:justify-start' : 'sm:justify-end'}`}>
                  {/* Ponto de conexão (Bolinha) */}
                  <div className="absolute left-[24px] sm:left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#0D0D0D] border-[3px] border-primary z-10 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                  
                  {/* Container do Card */}
                  <div className={`w-full sm:w-1/2 pl-14 sm:pl-0 ${isEven ? 'sm:pr-10' : 'sm:pl-10'}`}>
                    <button 
                      onClick={() => {
                        try { haptic.selection(); } catch {}
                        setSelectedSimulado(sim);
                      }}
                      className="flex flex-col rounded-2xl hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] group text-left relative w-full h-[140px] transition-all"
                    >
                      {/* Background isolado para manter o border-radius e clipping interno (sem cortar a imagem externa) */}
                      <div className="absolute inset-0 bg-card rounded-2xl border border-border overflow-hidden group-hover:border-primary/50 transition-colors">
                        {/* Efeito de deck empilhado visual sutil */}
                        <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-[100%] transition-transform group-hover:scale-110" />
                      </div>
                      
                      {/* Imagens 3D vazadas */}
                      {sim.exam?.name?.toLowerCase().includes('juiz') ? (
                        <div className="absolute right-0 sm:right-2 bottom-0 h-[170px] sm:h-[190px] z-20 pointer-events-none drop-shadow-2xl flex items-end">
                          <img src="/assets/praticar-juiz.png" alt="Juiz" className="w-auto h-full object-contain object-bottom" />
                        </div>
                      ) : (
                        <div className="absolute right-0 sm:right-2 bottom-0 h-[170px] sm:h-[190px] z-20 pointer-events-none drop-shadow-2xl flex items-end">
                          <img src="/assets/eoab-woman-fixed.webp" alt="OAB" className="w-auto h-full object-contain object-bottom" />
                        </div>
                      )}
                      
                      <div className="p-5 flex-1 flex flex-col items-start w-full relative z-10">
                        <div className="flex justify-between items-start mb-4 w-full">
                          <div className="flex items-center text-primary relative z-30 gap-2">
                            <span className="text-xl sm:text-2xl font-black tracking-tighter drop-shadow-sm">
                              {sim.year || 'ND'}
                            </span>
                            {/* "Bandeira" (Badge do Estado) */}
                            {(() => {
                              const ufMatch = sim.exam?.name?.match(/TJ([A-Z]{2})/i);
                              if (ufMatch) {
                                return (
                                  <div className="flex items-center justify-center bg-zinc-800 border border-white/10 rounded overflow-hidden shadow-sm h-5 sm:h-6 px-1.5 gap-1">
                                    <span className="text-[10px] sm:text-[11px] font-bold text-zinc-300 tracking-wider">
                                      🇧🇷 {ufMatch[1].toUpperCase()}
                                    </span>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                        
                        <div className="mt-auto w-full relative z-30">
                          <h4 className="font-display font-bold text-sm sm:text-lg leading-tight text-foreground mb-1.5 group-hover:text-primary transition-colors line-clamp-2 max-w-[65%]">
                            {sim.exam?.name || 'Sem título'}
                          </h4>
                          <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 uppercase tracking-wider font-semibold">
                            SIMULADO {sim.prova_url && !sim.prova_url.startsWith('http') ? `- ${sim.prova_url.toUpperCase()}` : ''} <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
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

      <Sheet open={!!selectedSimulado} onOpenChange={(open) => !open && setSelectedSimulado(null)}>
        <SheetContent side="bottom" className="rounded-none sm:rounded-t-3xl bg-card border-border p-0 overflow-hidden flex flex-col sm:max-w-md sm:mx-auto h-[100dvh] sm:h-[90vh]">
          <div className="p-6 flex-1 overflow-y-auto flex flex-col pb-10">
            <SheetHeader className="text-left mb-6 shrink-0">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-bold px-2.5 py-1 bg-primary/15 text-primary rounded-md">
                  {selectedSimulado?.year || 'Ano ND'}
                </span>
                <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                  Simulado
                </span>
              </div>
              <SheetTitle className="text-xl sm:text-2xl font-display font-bold text-foreground leading-tight pr-8">
                {selectedSimulado?.exam?.name || 'Sem título'}
              </SheetTitle>
            </SheetHeader>
            
            <div className="space-y-4 shrink-0">
              <button 
                onClick={handleStartSimulado}
                className="w-full relative overflow-hidden bg-gradient-to-r from-primary/90 to-primary text-primary-foreground font-bold text-[16px] py-4 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_4px_20px_-4px_rgba(239,68,68,0.3)]"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
                <PlayCircle className="w-5 h-5 drop-shadow-sm" /> 
                <span className="drop-shadow-sm tracking-wide">INICIAR SIMULADO</span>
              </button>

              <div className="grid grid-cols-3 gap-2">
                 <button 
                   onClick={(e) => selectedSimulado && handlePreviewPdf(e, selectedSimulado.prova_url, 'Prova')} 
                   disabled={!selectedSimulado?.prova_url}
                   className="bg-zinc-900/50 hover:bg-zinc-900 disabled:opacity-50 text-foreground py-3.5 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all font-medium text-[11px] sm:text-xs border border-white/5 hover:border-white/10 shadow-sm"
                 >
                   <FileText className="w-4 h-4 text-zinc-400" /> Ver Prova
                 </button>
                 <button 
                   onClick={(e) => selectedSimulado && handlePreviewPdf(e, selectedSimulado.gabarito_url, 'Gabarito')} 
                   disabled={!selectedSimulado?.gabarito_url}
                   className="bg-zinc-900/50 hover:bg-zinc-900 disabled:opacity-50 text-foreground py-3.5 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all font-medium text-[11px] sm:text-xs border border-white/5 hover:border-white/10 shadow-sm"
                 >
                   <FileText className="w-4 h-4 text-emerald-500/80" /> Gabarito
                 </button>
                 <button 
                   onClick={(e) => selectedSimulado && handlePreviewPdf(e, selectedSimulado.edital_url, 'Edital')} 
                   disabled={!selectedSimulado?.edital_url}
                   className="bg-zinc-900/50 hover:bg-zinc-900 disabled:opacity-50 text-foreground py-3.5 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all font-medium text-[11px] sm:text-xs border border-white/5 hover:border-white/10 shadow-sm"
                 >
                   <FileSignature className="w-4 h-4 text-blue-400" /> Edital
                 </button>
              </div>
              
              <button 
                onClick={() => { /* Placeholder logic for history */ }}
                className="w-full bg-zinc-950 border border-white/5 text-zinc-300 hover:text-white hover:bg-zinc-900 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all font-medium text-[13px] shadow-sm"
              >
                 <History className="w-4 h-4 opacity-70" /> Histórico de Acertos
              </button>
            </div>
            
            <div className="mt-8 flex-1">
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" /> Raio-X do Simulado
              </h4>
              <div className="space-y-3">
                {loadingRaioX ? (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : raioXData && raioXData.length > 0 ? (
                  raioXData.map((item, i) => {
                    const isExpanded = expandedRaioX[item.name];
                    return (
                      <div key={i} className="bg-card border border-border/50 rounded-xl overflow-hidden">
                        <button 
                          onClick={() => toggleRaioX(item.name)}
                          className="w-full p-3.5 flex flex-col gap-2.5 hover:bg-white/[0.02] transition-colors text-left"
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="text-[13px] font-semibold text-zinc-200 leading-tight pr-4">
                              {item.name}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">{item.percent}%</span>
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                            </div>
                          </div>
                          <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${item.percent}%` }} />
                          </div>
                        </button>
                        
                        {/* Dropdown de Assuntos */}
                        {isExpanded && (
                          <div className="px-3.5 pb-3.5 pt-1 space-y-2 border-t border-border/30 bg-black/20">
                            {item.assuntos.map((assunto, j) => (
                              <div key={j} className="flex justify-between items-center py-1">
                                <span className="text-xs text-zinc-400 line-clamp-2 pr-2">
                                  • {assunto.name}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-medium shrink-0">
                                  {assunto.count} {assunto.count === 1 ? 'Q' : 'Qs'} ({assunto.percent}%)
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">Sem informações de raio-x para este simulado.</p>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Transição Hero (Item 5) */}
      {isStarting && selectedSimulado && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative flex flex-col items-center">
            {selectedSimulado.exam?.name?.toLowerCase().includes('juiz') && (
              <img 
                src="/assets/praticar-juiz.png" 
                alt="Juiz" 
                className="w-48 sm:w-56 h-auto drop-shadow-2xl animate-in zoom-in slide-in-from-bottom-10 duration-700" 
              />
            )}
            <div className="mt-8 text-center animate-in slide-in-from-bottom-4 fade-in duration-500 delay-150">
              <h2 className="font-display text-2xl font-bold text-white mb-2">
                Preparando Caderno...
              </h2>
              <div className="flex items-center justify-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse delay-75" />
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse delay-150" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Preview de PDF */}
      <Sheet open={!!previewPdfUrl} onOpenChange={(open) => !open && setPreviewPdfUrl(null)}>
        <SheetContent side="bottom" className="rounded-none sm:rounded-t-3xl bg-card border-border p-0 overflow-hidden flex flex-col h-[100dvh] sm:h-[90vh] sm:max-w-4xl sm:mx-auto">
          <div className="flex justify-between items-center p-4 border-b border-white/5 bg-zinc-950">
            <h3 className="font-display font-bold text-lg text-white">Visualização: {previewPdfTitle}</h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => previewPdfUrl && window.open(previewPdfUrl, '_blank')}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                title="Abrir em nova guia"
              >
                <ExternalLink className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setPreviewPdfUrl(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 w-full bg-zinc-950/50">
            {previewPdfUrl && (
              <iframe 
                src={`${previewPdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                className="w-full h-full border-none"
                title={previewPdfTitle}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Menu Inferior Dock */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0D0D0D] pb-[max(env(safe-area-inset-bottom),16px)] pt-3 border-t border-white/5">
        <div className="mx-auto max-w-md px-4">
          <div className="bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-between p-1.5 shadow-lg">
            <button className="flex flex-col items-center gap-1.5 py-2 px-4 rounded-xl text-primary bg-white/5 w-1/3 transition-colors">
              <GraduationCap className="w-5 h-5" />
              <span className="text-[10px] font-semibold tracking-wide">Simulados</span>
            </button>
            <button 
              onClick={() => toast.info('Estatísticas em breve!')}
              className="flex flex-col items-center gap-1.5 py-2 px-4 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors w-1/3"
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-[10px] font-semibold tracking-wide">Estatísticas</span>
            </button>
            <button 
              onClick={() => {
                try { haptic.selection(); } catch {}
                setShowSobre(true);
              }}
              className="flex flex-col items-center gap-1.5 py-2 px-4 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors w-1/3"
            >
              <Info className="w-5 h-5" />
              <span className="text-[10px] font-semibold tracking-wide">Sobre</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Sobre a Carreira */}
      <Sheet open={showSobre} onOpenChange={setShowSobre}>
        <SheetContent side="bottom" className="rounded-none sm:rounded-t-3xl bg-[#0a0a0a] border-white/10 p-0 overflow-hidden flex flex-col h-[100dvh] sm:h-[90vh] sm:max-w-xl sm:mx-auto">
          <div className="p-6 flex-1 overflow-y-auto pb-32">
            <div className="flex justify-between items-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Scale className="w-6 h-6 text-primary" />
              </div>
              <button 
                onClick={() => setShowSobre(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 -rotate-90" />
              </button>
            </div>
            
            <h2 className="text-2xl font-display font-bold text-white mb-2 leading-tight">
              A Carreira de Juiz de Direito Substituto
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-8">
              Conheça tudo sobre uma das carreiras mais respeitadas, desafiadoras e almejadas da Magistratura Estadual Brasileira.
            </p>

            <div className="space-y-8">
              {/* Seção 1 */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-3">O que é?</h3>
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 text-sm text-zinc-300 leading-relaxed space-y-3">
                  <p>
                    O <strong>Juiz de Direito Substituto</strong> representa a porta de entrada vitalícia para a carreira da Magistratura Estadual. Após a posse, ele atua suprindo as necessidades jurisdicionais de diversas varas e comarcas, seja cobrindo férias, licenças médicas, vacâncias temporárias ou auxiliando juízes titulares em varas congestionadas.
                  </p>
                  <p>
                    Apesar da nomenclatura "substituto", ele possui as <strong>exatamente as mesmas garantias constitucionais, deveres e poderes judicantes</strong> de um juiz titular. Suas sentenças, decisões e condução de audiências têm o mesmo peso e autoridade perante a lei.
                  </p>
                </div>
              </section>

              {/* Seção 2 */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-3">Linha do Tempo</h3>
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4">
                  <div className="relative pl-6 border-l border-zinc-800 space-y-6">
                    <div className="relative">
                      <div className="absolute w-3 h-3 bg-primary rounded-full -left-[1.90rem] top-1.5 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                      <h4 className="text-white font-display uppercase tracking-[0.15em] text-[13px] font-bold">Aprovação no Concurso</h4>
                      <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">Posse e ingresso imediato como Juiz Substituto nas entrâncias iniciais, passando obrigatoriamente por curso de formação na Escola da Magistratura.</p>
                    </div>
                    <div className="relative">
                      <div className="absolute w-3 h-3 bg-zinc-700 rounded-full -left-[1.90rem] top-1.5 border-2 border-[#0a0a0a]" />
                      <h4 className="text-white font-display uppercase tracking-[0.15em] text-[13px] font-bold">Juiz de Direito (Titular)</h4>
                      <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">Promoção alcançada por critérios alternados de antiguidade ou merecimento, assumindo a titularidade definitiva de uma vara específica (Ex: 1ª Vara Cível).</p>
                    </div>
                    <div className="relative">
                      <div className="absolute w-3 h-3 bg-zinc-700 rounded-full -left-[1.90rem] top-1.5 border-2 border-[#0a0a0a]" />
                      <h4 className="text-white font-display uppercase tracking-[0.15em] text-[13px] font-bold">Desembargador</h4>
                      <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">O ápice da carreira no estado. Promoção ao Tribunal de Justiça (2ª Instância), julgando recursos colegiados em Câmaras ou Turmas.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Seção 3 */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-3">Salário e Benefícios</h3>
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 text-sm text-zinc-300 space-y-3">
                  <p>
                    A remuneração inicial (subsídio) varia conforme a legislação estadual, mas atualmente a média nacional gira em torno de <strong>R$ 32.000 a R$ 35.000</strong> brutos mensais para o cargo inicial.
                  </p>
                  <p>
                    Além do subsídio principal garantido por lei, os magistrados possuem direito a diversas indenizações e benefícios (variáveis por TJ), que comumente incluem:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 text-xs text-zinc-400 ml-2">
                    <li>Auxílio-moradia (quando aplicável);</li>
                    <li>Auxílio-alimentação e Auxílio-saúde;</li>
                    <li>Gratificação por acúmulo de acervo/jurisdição;</li>
                    <li>Férias de 60 dias anuais (conversíveis em pecúnia quando imperiosa necessidade);</li>
                  </ul>
                </div>
              </section>

              {/* Seção 4 */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-3">Requisitos (O que precisa?)</h3>
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4">
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div>
                        <span className="text-[13px] font-bold text-white">Formação Acadêmica</span>
                        <p className="text-xs text-zinc-400 mt-1">Ser Bacharel em Direito por instituição oficialmente reconhecida pelo MEC.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div>
                        <span className="text-[13px] font-bold text-white">Prática Jurídica</span>
                        <p className="text-xs text-zinc-400 mt-1">Comprovar no mínimo <strong>3 anos de atividade jurídica</strong> após a colação de grau (documentada na fase da inscrição definitiva).</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div>
                        <span className="text-[13px] font-bold text-white">Aprovação nas 5 Fases do Concurso</span>
                        <p className="text-xs text-zinc-400 mt-1">1. Prova Objetiva; 2. Provas Escritas (Discursiva e Sentenças); 3. Sindicância, Saúde e Psicotécnico; 4. Prova Oral; 5. Avaliação de Títulos.</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Seção 5 */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-red-400 mb-3">Vedações (O que NÃO pode fazer)</h3>
                <div className="bg-red-950/20 border border-red-900/30 rounded-2xl p-4">
                  <p className="text-xs text-zinc-400 mb-3">O cargo exige dedicação integral, sendo expressamente proibido pela Constituição (LOMAN):</p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0 shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
                      <span className="text-[13px] text-zinc-300">Exercer, ainda que em disponibilidade, outro cargo ou função, salvo <strong>uma única de magistério</strong>.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0 shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
                      <span className="text-[13px] text-zinc-300">Exercer a advocacia sob qualquer hipótese.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0 shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
                      <span className="text-[13px] text-zinc-300">Dedicar-se a atividade político-partidária (filiação partidária é proibida).</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0 shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
                      <span className="text-[13px] text-zinc-300">Receber honorários, percentagens, custas ou participações em processos.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0 shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
                      <span className="text-[13px] text-zinc-300">Exercer o comércio ou participar de sociedade comercial empresarial (exceto como mero acionista).</span>
                    </li>
                  </ul>
                </div>
              </section>
            </div>
          </div>
        </SheetContent>
      </Sheet>

    </DesktopPageLayout>
  );
}





