import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Presentation, ArrowLeft } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

export default function AdminLousaMagica() {
  const navigate = useNavigate();

  return (
    <div className="h-dvh max-h-dvh w-full overflow-hidden flex flex-col bg-[#0D0D0D] text-white select-none pb-[env(safe-area-inset-bottom,0px)]">
      {/* Top Bar Minimalista Responsivo com Botão de Voltar & Título (Padrão Google Material 3 / HIG) */}
      <header className="min-h-[58px] sm:min-h-[64px] flex-none px-3 sm:px-4 border-b border-white/10 bg-black/85 backdrop-blur-md flex items-center z-20 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] pb-2">
        <button
          onClick={() => {
            haptic.selection();
            navigate('/admin-funcoes');
          }}
          className="w-12 h-12 sm:w-[52px] sm:h-[52px] min-w-[48px] min-h-[48px] rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-200 hover:text-white hover:bg-white/10 active:scale-95 transition-all shadow-sm"
          aria-label="Voltar para Funções ADM"
          title="Voltar"
        >
          <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7 text-zinc-100" strokeWidth={2.4} />
        </button>

        <div className="flex flex-col ml-3 min-w-0">
          <span className="text-sm sm:text-base font-bold text-white tracking-wider flex items-center gap-2 leading-tight">
            <Presentation className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
            LOUSA MÁGICA
          </span>
          <span className="text-xs sm:text-sm text-zinc-400 truncate max-w-[240px] sm:max-w-none mt-0.5 leading-tight">
            Hans Kelsen & Teoria Pura
          </span>
        </div>
      </header>

      {/* Container Fullscreen do Player da Lousa Mágica com Proteção Safe Area */}
      <main className="flex-1 w-full h-full min-h-0 bg-[#0e0f0e] flex items-center justify-center overflow-hidden relative">
        <iframe
          src="/lousa-magica/index.html"
          title="Lousa Mágica - Hans Kelsen"
          className="w-full h-full border-0 block overflow-hidden max-w-[480px] md:max-w-none"
          allow="autoplay; fullscreen; clipboard-write"
        />
      </main>
    </div>
  );
}
