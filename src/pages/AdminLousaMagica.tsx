import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Presentation, ArrowLeft } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

export default function AdminLousaMagica() {
  const navigate = useNavigate();

  return (
    <div className="h-dvh max-h-dvh w-full overflow-hidden flex flex-col bg-[#0D0D0D] text-white select-none">
      {/* Top Bar Minimalista com Botão de Voltar & Título */}
      <header className="h-12 flex-none px-3 border-b border-white/10 bg-black/80 backdrop-blur-md flex items-center z-20 pt-[env(safe-area-inset-top,0px)]">
        <button
          onClick={() => {
            haptic.selection();
            navigate('/admin-funcoes');
          }}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
          aria-label="Voltar para Funções ADM"
          title="Voltar"
        >
          <ArrowLeft className="w-5 h-5 text-zinc-200" strokeWidth={2.4} />
        </button>

        <div className="flex flex-col ml-2.5">
          <span className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5 leading-none">
            <Presentation className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            LOUSA MÁGICA
          </span>
          <span className="text-[10px] text-zinc-400 truncate max-w-[220px] sm:max-w-none mt-0.5 leading-none">
            Hans Kelsen & Teoria Pura
          </span>
        </div>
      </header>

      {/* Container Fullscreen do Player da Lousa Mágica */}
      <main className="flex-1 w-full h-full min-h-0 bg-[#0e0f0e] flex items-center justify-center overflow-hidden relative">
        <iframe
          src="/lousa-magica/index.html"
          title="Lousa Mágica - Hans Kelsen"
          className="w-full h-full border-0 block overflow-hidden max-w-[460px] md:max-w-none"
          allow="autoplay; fullscreen; clipboard-write"
        />
      </main>
    </div>
  );
}
