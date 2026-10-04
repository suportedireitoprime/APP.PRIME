import React from "react";
import DesktopPageLayout from "@/components/layout/DesktopPageLayout";
import ShapeGrid from "@/components/ui/ShapeGrid";
import { ArrowLeft, ChevronRight, Scale, Building2, Shield, FileText, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/vademecum/navigation/PageHeader";

const CAROUSELS = [
  {
    id: 'magistratura',
    title: 'Magistratura',
    color: '#3b82f6',
    icon: Scale,
    items: [
      { id: 'mag-sp', title: 'TJSP', subtitle: 'São Paulo' },
      { id: 'mag-rj', title: 'TJRJ', subtitle: 'Rio de Janeiro' },
      { id: 'mag-mg', title: 'TJMG', subtitle: 'Minas Gerais' },
      { id: 'mag-federal', title: 'TRF', subtitle: 'Federal' },
    ]
  },
  {
    id: 'mp',
    title: 'Ministério Público',
    color: '#10b981',
    icon: Building2,
    items: [
      { id: 'mp-sp', title: 'MPSP', subtitle: 'São Paulo' },
      { id: 'mp-rj', title: 'MPRJ', subtitle: 'Rio de Janeiro' },
      { id: 'mp-mg', title: 'MPMG', subtitle: 'Minas Gerais' },
      { id: 'mpf', title: 'MPF', subtitle: 'Federal' },
    ]
  },
  {
    id: 'delegado',
    title: 'Delegado',
    color: '#6366f1',
    icon: Shield,
    items: [
      { id: 'del-sp', title: 'Delegado SP', subtitle: 'Polícia Civil SP' },
      { id: 'del-rj', title: 'Delegado RJ', subtitle: 'Polícia Civil RJ' },
      { id: 'del-mg', title: 'Delegado MG', subtitle: 'Polícia Civil MG' },
      { id: 'del-pf', title: 'Delegado PF', subtitle: 'Polícia Federal' },
    ]
  },
  {
    id: 'prf',
    title: 'Polícia Rodoviária Federal',
    color: '#475569',
    icon: Shield,
    items: [
      { id: 'prf-nacional', title: 'PRF Nacional', subtitle: 'Policial Rodoviário' },
    ]
  },
  {
    id: 'pf',
    title: 'Polícia Federal',
    color: '#1e293b',
    icon: Globe,
    items: [
      { id: 'pf-agente', title: 'Agente PF', subtitle: 'Nacional' },
      { id: 'pf-escrivao', title: 'Escrivão PF', subtitle: 'Nacional' },
      { id: 'pf-papiloscopista', title: 'Papiloscopista', subtitle: 'Nacional' },
    ]
  },
  {
    id: 'pc',
    title: 'Polícia Civil',
    color: '#334155',
    icon: Shield,
    items: [
      { id: 'pc-sp', title: 'Investigador SP', subtitle: 'São Paulo' },
      { id: 'pc-rj', title: 'Inspetor RJ', subtitle: 'Rio de Janeiro' },
      { id: 'pc-mg', title: 'Investigador MG', subtitle: 'Minas Gerais' },
      { id: 'pc-df', title: 'Agente PCDF', subtitle: 'Distrito Federal' },
    ]
  },
  {
    id: 'escrevente',
    title: 'Escrevente TJ',
    color: '#f59e0b',
    icon: FileText,
    items: [
      { id: 'esc-sp', title: 'Escrevente TJSP', subtitle: 'São Paulo' },
      { id: 'esc-rj', title: 'Técnico TJRJ', subtitle: 'Rio de Janeiro' },
      { id: 'esc-mg', title: 'Oficial TJMG', subtitle: 'Minas Gerais' },
    ]
  },
  {
    id: 'inss',
    title: 'Técnico do INSS',
    color: '#d97706',
    icon: FileText,
    items: [
      { id: 'inss-nacional', title: 'Técnico INSS', subtitle: 'Nacional' },
    ]
  }
];

export default function Simulados() {
  const navigate = useNavigate();

  const mobileHeader = (
    <PageHeader
      title="Simulados"
      subtitle="Treino real"
      onBack={() => navigate(-1)}
    />
  );

  return (
    <DesktopPageLayout
      activeId="estudos"
      title="Simulados"
      subtitle="Treino real"
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

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 space-y-8 max-w-[1200px] mx-auto pb-[calc(7rem+var(--sai-bottom))] lg:pb-8">
        
        {/* Navigation Back Button for Desktop */}
        <button 
          onClick={() => navigate(-1)}
          className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium mb-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>

        {/* Carrosséis */}
        <div className="space-y-10">
          {CAROUSELS.map((carousel) => (
            <div key={carousel.id} className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-display font-bold text-lg sm:text-xl text-white flex items-center gap-2 uppercase tracking-widest">
                  <span className="w-1.5 h-6 rounded-full" style={{ backgroundColor: carousel.color }} />
                  {carousel.title}
                </h3>
                <button className="text-muted-foreground hover:text-white text-sm font-semibold flex items-center gap-1 transition-colors">
                  Ver todos <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="-mx-4 sm:mx-0 px-4 sm:px-0 flex gap-4 overflow-x-auto pb-4 snap-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {carousel.items.map((item) => (
                  <button 
                    key={item.id}
                    className="snap-start shrink-0 w-[240px] md:w-[260px] h-[140px] bg-card rounded-2xl border border-border flex flex-col p-5 hover:border-primary/50 transition-all shadow-sm text-left relative overflow-hidden group"
                  >
                    <div className="flex items-center justify-between w-full mb-auto">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: `${carousel.color}15`, color: carousel.color }}
                      >
                        <carousel.icon className="w-5 h-5" />
                      </div>
                    </div>
                    
                    <div className="w-full">
                      <h4 className="font-display font-bold text-base text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {item.subtitle}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </DesktopPageLayout>
  );
}
