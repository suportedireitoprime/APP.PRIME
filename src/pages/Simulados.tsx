import React from "react";
import DesktopPageLayout from "@/components/layout/DesktopPageLayout";
import ShapeGrid from "@/components/ui/ShapeGrid";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Simulados() {
  const navigate = useNavigate();

  return (
    <DesktopPageLayout
      activeId="estudos"
      title="Simulados"
      subtitle="Treino real"
      mobileHeader={null}
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
            <button className="bg-white text-violet-900 font-bold py-3 px-6 rounded-xl self-start hover:scale-105 transition-transform active:scale-95 shadow-lg">
              Continuar Simulado
            </button>
          </div>
          <div className="hidden md:block w-1/3 relative z-10">
            <img 
              src="/assets/praticar-simulados.png" 
              alt="Simulados" 
              className="absolute right-0 bottom-0 h-[120%] object-contain origin-bottom object-right-bottom drop-shadow-2xl"
            />
          </div>
        </div>

        {/* Categories Placeholder */}
        <div className="space-y-8 mt-8">
          <div className="space-y-4">
            <h3 className="font-display font-bold text-xl text-white flex items-center gap-2 uppercase tracking-widest">
              <span className="w-1 h-5 rounded-full bg-violet-500" />
              Profissões Jurídicas
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x [scrollbar-width:none]">
               {/* Cards will go here */}
               <div className="min-w-[200px] h-[120px] bg-card rounded-2xl border border-border flex items-center justify-center snap-start shadow-sm text-muted-foreground text-sm">
                 Em breve
               </div>
            </div>
          </div>
        </div>

      </div>
    </DesktopPageLayout>
  );
}
