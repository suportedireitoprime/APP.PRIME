import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Construction } from 'lucide-react';
import RadarBottomNav from '@/components/radar/RadarBottomNav';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { haptic } from '@/lib/nativeHaptics';

export default function RadarConstrucao() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-[100dvh] bg-[#0d0f12] text-white overflow-hidden pb-24 flex flex-col">
      <ShapeGrid />
      
      {/* Header Nativo */}
      <div className="sticky top-0 z-40 bg-[#0d0f12]/80 backdrop-blur-xl border-b border-white/5 pt-[calc(1.25rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-4 px-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => { haptic.selection(); navigate(-1); }}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 active:opacity-70 transition-all"
          >
            <ArrowLeft className="w-6 h-6 text-white" strokeWidth={2.4} />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              EM BREVE
            </h1>
          </div>
          <div className="w-12 h-12" />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10">
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 ring-1 ring-white/10">
          <Construction className="w-12 h-12 text-white/80" />
        </div>
        <h1 className="text-2xl font-bold mb-3 font-display">Aba em Construção</h1>
        <p className="text-white/50 max-w-sm leading-relaxed">
          Esta funcionalidade está sendo finalizada pela nossa equipe e será liberada em breve com 0ms de latência!
        </p>
      </div>

      <RadarBottomNav />
    </div>
  );
}
