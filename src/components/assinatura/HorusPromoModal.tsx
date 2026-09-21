import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/vademecum/ui_elements/Confetti";
import { haptic } from "@/lib/nativeHaptics";
import { useAuth } from "@/hooks/useAuth";
import ShapeGrid from "@/components/ui/ShapeGrid";
import horusOwl from '@/assets/horus/horus-owl.webp';

interface HorusPromoModalProps {
  open: boolean;
  timeLeft: number;
  onClose: () => void;
  onRedeem: () => void;
}

export function HorusPromoModal({ open, timeLeft, onClose, onRedeem }: HorusPromoModalProps) {
  const { user } = useAuth();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.user_metadata?.name?.split(' ')[0] || '';

  useEffect(() => {
    if (!open) return;

    // Disparar comemoração tátil e auditiva
    haptic.success();
    setTimeout(() => {
      haptic.impact('medium');
    }, 400);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <Confetti />
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-950/95"
            onClick={onClose}
          >
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
              <ShapeGrid
                speed={0.4}
                squareSize={44}
                direction="diagonal"
                borderColor="rgba(255, 255, 255, 0.05)"
                hoverFillColor="rgba(16, 185, 129, 0.1)"
                shape="square"
                hoverTrailAmount={4}
              />
            </div>
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm relative z-10 flex flex-col items-center"
            >
              <div className="relative w-full flex items-center justify-center mb-1 -mt-4 pointer-events-none select-none h-28">
                {/* Glow pulsante atrás do Hórus */}
                <motion.div 
                  animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-x-12 inset-y-4 rounded-full bg-emerald-500/40 blur-3xl pointer-events-none" 
                />
                
                {/* Hórus flutuando */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative z-10 w-28 h-28 flex items-center justify-center"
                >
                  <img src={horusOwl} alt="Horus" className="w-full h-full object-contain drop-shadow-[0_12px_28px_rgba(0,0,0,0.9)]" />
                </motion.div>
              </div>
              
              <h3 className="font-display text-2xl font-black text-white text-center mb-1">OFERTA EXCLUSIVA ANUAL</h3>
              <p className="text-sm text-center text-muted-foreground mb-4 px-2">
                <span className="font-bold text-white">{firstName ? `Ei ${firstName}! ` : 'Ei! '}</span>
                Você ganhou um super desconto de boas-vindas no <span className="text-emerald-400 font-bold">PIX</span>. Libere agora o acesso total ao aplicativo antes que o tempo acabe.
              </p>
              
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="text-[12px] font-black tracking-widest text-emerald-400 uppercase">TERMINA EM</span>
                <motion.div 
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="font-display text-2xl font-black text-emerald-400 tracking-wider drop-shadow-[0_0_15px_rgba(52,211,153,0.5)] leading-none"
                >
                  {formatTime(timeLeft)}
                </motion.div>
              </div>
              
              <div className="w-full flex flex-col items-center justify-center mb-8 relative">
                 <div className="bg-emerald-500 text-white font-black text-[9px] px-2 py-0.5 rounded-full tracking-wider mb-2">
                   PROMOÇÃO 24H
                 </div>
                 <div className="text-sm font-bold text-emerald-500/80 line-through">De R$ 199,90</div>
                 <div className="font-display text-5xl font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)] my-1">R$ 149,90</div>
                 <div className="text-xs font-semibold text-emerald-500/80">equivale a R$ 12,49 / mês</div>
              </div>

              <Button 
                className="btn-shine-loop relative overflow-hidden w-full h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl font-black text-base uppercase tracking-wider transition-all shadow-[0_8px_25px_rgba(16,185,129,0.35)] active:scale-[0.98] cursor-pointer"
                onClick={onRedeem}
              >
                Resgatar Desconto Agora
              </Button>

              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="mt-3 relative overflow-hidden w-full h-14 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl font-black text-base uppercase tracking-wider transition-all shadow-[0_8px_25px_rgba(239,68,68,0.35)] active:scale-[0.98] cursor-pointer"
              >
                Quero perder o desconto
              </Button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
