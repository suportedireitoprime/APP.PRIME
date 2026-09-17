import { useState, useEffect } from "react";
import { Timer } from "lucide-react";

export function TrialCountdownBanner({ expiresAt }: { expiresAt: string | null }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!expiresAt) return;

    // Item 33: Normalizar timestamp UTC absoluto evitando distorções de fuso horário local (Acre, Manaus, Brasília)
    const parseToUtcMs = (dateStr: string): number => {
      if (!dateStr) return 0;
      if (/^\d+$/.test(dateStr)) return Number(dateStr);
      const normalized = dateStr.includes('T') && !dateStr.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(dateStr)
        ? `${dateStr}Z`
        : dateStr;
      const parsed = Date.parse(normalized);
      return isNaN(parsed) ? new Date(dateStr).getTime() : parsed;
    };

    const update = () => {
      const expiresMs = parseToUtcMs(expiresAt);
      const nowMs = Date.now();
      const diffSec = Math.floor((expiresMs - nowMs) / 1000);
      if (isNaN(diffSec) || diffSec <= 0) {
        setTimeLeft('Seu teste expirou');
        return;
      }
      const totalHours = Math.floor(diffSec / 3600);
      const mins = Math.floor((diffSec % 3600) / 60);
      if (totalHours >= 24) {
        const days = Math.floor(totalHours / 24);
        const remHours = totalHours % 24;
        setTimeLeft(`${days}d ${remHours}h restantes`);
      } else if (totalHours > 0) {
        setTimeLeft(`${totalHours}h ${mins}m restantes`);
      } else {
        setTimeLeft(`${mins}m restantes`);
      }
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!timeLeft || timeLeft === 'Seu teste expirou') return null;

  return (
    <div className="sticky top-[calc(0.5rem+var(--sai-top,0px))] z-50 mx-4 mt-2 mb-4 transition-all duration-300 pointer-events-none">
      <div className="bg-[#111111]/90 backdrop-blur-xl border-2 border-red-500/40 rounded-2xl p-3 flex flex-col sm:flex-row items-center sm:justify-between shadow-[0_15px_40px_rgba(239,68,68,0.25)] overflow-hidden pointer-events-auto relative gap-3">
        {/* Imagem de Fundo Vazado (Watermark) */}
        <div 
          className="absolute inset-0 opacity-[0.08] bg-no-repeat pointer-events-none"
          style={{ backgroundImage: "url('/logo-prime.webp')", backgroundPosition: 'right -20px center', backgroundSize: '150%' }}
        />
        
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-red-500/0 via-red-500 to-red-500/0"></div>
        
        <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto text-center sm:text-left justify-center sm:justify-start">
           <div className="flex flex-col">
              <span className="font-display font-black text-white text-[13px] sm:text-sm tracking-widest uppercase shadow-sm">Seu Teste Gratuito</span>
              <span className="font-body text-[11px] sm:text-xs font-semibold text-red-400">Aproveite todos os recursos.</span>
           </div>
        </div>
        
        <div className="relative z-10 w-full sm:w-auto px-4 py-2 rounded-xl bg-red-600 text-white font-display font-black text-sm sm:text-base tracking-widest uppercase animate-pulse flex items-center justify-center gap-2 shrink-0 shadow-[0_0_20px_rgba(239,68,68,0.5)]">
           <Timer className="w-5 h-5" />
           <span className="whitespace-nowrap">{timeLeft}</span>
        </div>
      </div>
    </div>
  );
}
