import { useState, useEffect } from "react";
import { Timer } from "lucide-react";

export function TrialCountdownBanner({ expiresAt }: { expiresAt: string | null }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Seu teste expirou');
        return;
      }
      const totalHours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (totalHours > 24) {
        setTimeLeft(`${totalHours}h restantes`);
      } else {
        setTimeLeft(`${totalHours}h ${mins}m restantes`);
      }
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!timeLeft || timeLeft === 'Seu teste expirou') return null;

  return (
    <div className="sticky top-[calc(0.5rem+var(--sai-top,0px))] z-50 mx-4 mt-2 mb-4 transition-all duration-300 pointer-events-none">
      <div className="bg-[#111111]/80 backdrop-blur-xl border border-red-500/30 rounded-2xl p-2.5 flex items-center justify-between shadow-[0_10px_30px_rgba(239,68,68,0.15)] overflow-hidden pointer-events-auto relative">
        {/* Imagem de Fundo Vazado (Watermark) */}
        <div 
          className="absolute inset-0 opacity-[0.05] bg-no-repeat pointer-events-none"
          style={{ backgroundImage: "url('/logo-prime.webp')", backgroundPosition: 'right -20px center', backgroundSize: '150%' }}
        />
        
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-red-500/0 via-red-500/80 to-red-500/0"></div>
        
        <div className="flex items-center gap-3 relative z-10 pl-1">
           <div className="w-9 h-9 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 shrink-0">
              <img src="/logo-prime.webp" alt="Logo" className="w-5 h-5 object-contain drop-shadow-md" />
           </div>
           <div className="flex flex-col">
              <span className="font-display font-black text-white text-[11px] sm:text-xs tracking-wide uppercase shadow-sm">Seu Teste Gratuito</span>
              <span className="font-body text-[9px] sm:text-[10px] font-semibold text-red-400">Aproveite todos os recursos.</span>
           </div>
        </div>
        
        <div className="relative z-10 px-3 py-1.5 rounded-xl bg-red-500 text-white font-display font-black text-[9px] sm:text-[10px] tracking-widest uppercase animate-pulse flex items-center gap-1.5 shrink-0 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
           <Timer className="w-3.5 h-3.5" />
           <span className="whitespace-nowrap">{timeLeft}</span>
        </div>
      </div>
    </div>
  );
}
