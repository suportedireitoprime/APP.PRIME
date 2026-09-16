import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import horusOwl from '@/assets/horus/horus-owl.webp';

interface HorusPromoModalProps {
  open: boolean;
  timeLeft: number;
  onClose: () => void;
  onRedeem: () => void;
}

export function HorusPromoModal({ open, timeLeft, onClose, onRedeem }: HorusPromoModalProps) {
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#161b22] border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col items-center"
          >
            <Button 
              size="icon" 
              variant="ghost" 
              className="absolute top-2 right-2 text-white/50 hover:text-white rounded-full z-10"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
            
            <div className="w-full flex items-center justify-center mb-1 -mt-4">
              <img src={horusOwl} alt="Horus" className="w-28 h-28 object-contain drop-shadow-2xl" />
            </div>
            
            <h3 className="font-display text-2xl font-black text-white text-center mb-1">OFERTA EXCLUSIVA ANUAL</h3>
            <p className="text-sm text-center text-muted-foreground mb-4">
              Você acabou de criar sua conta e ganhou um super desconto de boas-vindas no <span className="text-emerald-400 font-bold">PIX</span> válido por tempo limitado! Tenha acesso ao aplicativo todo e a todas as funções liberadas.
            </p>
            
            <motion.div 
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="font-display text-4xl font-black text-emerald-400 mb-5 tracking-wider drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]"
            >
              {formatTime(timeLeft)}
            </motion.div>
            
            <div className="bg-emerald-500/10 border border-emerald-500/20 w-full rounded-2xl p-4 text-center mb-4 relative overflow-hidden">
               <div className="absolute top-0 right-0 bg-emerald-500 text-white font-black text-[9px] px-2 py-0.5 rounded-bl-lg tracking-wider">
                 PROMOÇÃO 24H
               </div>
               <div className="text-sm font-bold text-emerald-500/80 line-through">De R$ 199,90</div>
               <div className="font-display text-3xl font-black text-emerald-400">R$ 149,90</div>
               <div className="text-xs font-semibold text-emerald-500/80">equivale a R$ 12,49 / mês</div>
            </div>

            <Button 
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20"
              onClick={onRedeem}
            >
              Resgatar Desconto Agora
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
