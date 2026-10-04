import React, { useState } from "react";
import DesktopPageLayout from "@/components/layout/DesktopPageLayout";
import ShapeGrid from "@/components/ui/ShapeGrid";
import { ArrowLeft, PlayCircle, ChevronRight, Scale, Shield, GraduationCap, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/vademecum/navigation/PageHeader";

const PROFISSOES_JURIDICAS = [
  { id: 'magistratura', title: 'Magistratura', subtitle: 'Juiz de Direito, Juiz Federal', icon: Scale, color: '#3b82f6' },
  { id: 'mp', title: 'Ministério Público', subtitle: 'Promotor, Procurador', icon: Building2, color: '#10b981' },
  { id: 'defensoria', title: 'Defensoria Pública', subtitle: 'Defensor Público', icon: GraduationCap, color: '#8b5cf6' },
];

const CARREIRAS_POLICIAIS = [
  { id: 'delegado', title: 'Delegado', subtitle: 'Civil e Federal', icon: Shield, color: '#0f172a' },
  { id: 'agente', title: 'Investigador / Agente', subtitle: 'Polícia Civil, PF, PRF', icon: Shield, color: '#334155' },
  { id: 'pm', title: 'Polícia Militar', subtitle: 'Oficial e Praça', icon: Shield, color: '#475569' },
];

const ENSINO_MEDIO = [
  { id: 'escrevente', title: 'Escrevente TJ', subtitle: 'Tribunais de Justiça', icon: FileTextIcon, color: '#f59e0b' },
  { id: 'tecnico-inss', title: 'Técnico INSS', subtitle: 'Técnico do Seguro Social', icon: FileTextIcon, color: '#d97706' },
  { id: 'tecnico-tribunais', title: 'Técnico Judiciário', subtitle: 'TRT, TRE, TRF', icon: FileTextIcon, color: '#b45309' },
];

function FileTextIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  )
}


export default function Simulados() {
  const navigate = useNavigate();
  // Estado para verificar se há simulado em andamento. No momento é false por padrão.
  const [hasActiveSimulado, setHasActiveSimulado] = useState(false);

  const mobileHeader = (
    <PageHeader
      title="Simulados"
      subtitle="Treino real"
      onBack={() => navigate(-1)}
    />
  );

  const renderCarousel = (title: string, data: any[], colorHex: string) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-display font-bold text-lg text-white flex items-center gap-2 uppercase tracking-widest">
          <span className="w-1 h-5 rounded-full" style={{ backgroundColor: colorHex }} />
          {title}
        </h3>
        <button className="text-muted-foreground hover:text-white text-sm font-semibold flex items-center gap-1 transition-colors">
          Ver todos <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      <div className="-mx-4 sm:mx-0 px-4 sm:px-0 flex gap-4 overflow-x-auto pb-4 snap-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {data.map((item) => (
          <button 
            key={item.id}
            className="snap-start shrink-0 w-[240px] md:w-[260px] h-[140px] bg-card rounded-2xl border border-border flex flex-col p-5 hover:border-primary/50 transition-all shadow-sm text-left relative overflow-hidden group"
          >
            <div className="flex items-center justify-between w-full mb-auto">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm"
                style={{ backgroundColor: `${item.color}15`, color: item.color }}
              >
                <item.icon className="w-5 h-5" />
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
          className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>

        {/* Hero Section */}
        <div className="w-full bg-gradient-to-br from-violet-600/90 to-violet-900/90 rounded-3xl overflow-hidden shadow-xl border border-white/10 relative flex flex-col md:flex-row min-h-[220px]">
          <div className="p-6 md:p-8 flex-1 flex flex-col justify-center relative z-20">
            <h2 className="text-2xl md:text-4xl font-display font-black text-white mb-2 leading-tight">
              Seu Treino em <br/> Ambiente Real
            </h2>
            <p className="text-white/80 font-body text-sm md:text-base max-w-sm mb-6">
              Simule o dia da prova com cadernos exclusivos e acompanhe seu desempenho por área.
            </p>
            
            {hasActiveSimulado && (
              <button className="bg-white text-violet-900 font-bold py-3 px-6 rounded-xl self-start hover:scale-105 transition-transform active:scale-95 shadow-lg flex items-center gap-2">
                <PlayCircle className="w-5 h-5" />
                Continuar Simulado
              </button>
            )}
          </div>
          <div className="hidden md:block w-1/3 relative z-10">
            <img 
              src="/assets/praticar-simulados.png" 
              alt="Simulados" 
              className="absolute right-0 bottom-0 h-[120%] object-contain origin-bottom object-right-bottom drop-shadow-2xl"
            />
          </div>
        </div>

        {/* Carrosséis */}
        <div className="space-y-10 pt-2">
          {renderCarousel("Profissões Jurídicas", PROFISSOES_JURIDICAS, "#8b5cf6")}
          {renderCarousel("Carreiras Policiais", CARREIRAS_POLICIAIS, "#3b82f6")}
          {renderCarousel("Ensino Médio", ENSINO_MEDIO, "#f59e0b")}
        </div>

      </div>
    </DesktopPageLayout>
  );
}
