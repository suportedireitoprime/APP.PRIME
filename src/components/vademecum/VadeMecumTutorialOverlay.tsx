import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Search, Bookmark, ChevronRight } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

interface VadeMecumTutorialOverlayProps {
  onClose: () => void;
}

export default function VadeMecumTutorialOverlay({ onClose }: VadeMecumTutorialOverlayProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Bem-vindo ao Vade Mecum",
      desc: "Aqui você tem acesso a milhares de leis atualizadas, prontas para leitura e estudo offline.",
      icon: BookOpen,
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      title: "Busca Inteligente",
      desc: "Pesquise por artigos, termos ou trechos específicos e encontre resultados instantaneamente.",
      icon: Search,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10"
    },
    {
      title: "Favoritos e Marcações",
      desc: "Salve as leis que você mais acessa e crie marcações para estudo rápido a qualquer momento.",
      icon: Bookmark,
      color: "text-amber-500",
      bg: "bg-amber-500/10"
    }
  ];

  const handleNext = () => {
    haptic.selection();
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-sm bg-card rounded-3xl shadow-2xl overflow-hidden border border-white/10"
      >
        <button
          onClick={() => {
            haptic.selection();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-white bg-black/20 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 pt-12 flex flex-col items-center text-center min-h-[320px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center w-full"
            >
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${steps[step].bg}`}>
                {React.createElement(steps[step].icon, { className: `w-10 h-10 ${steps[step].color}` })}
              </div>
              <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">
                {steps[step].title}
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {steps[step].desc}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-auto pt-8 w-full">
            <div className="flex justify-center gap-2 mb-6">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step ? 'w-6 bg-primary' : 'w-1.5 bg-white/20'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="w-full py-3.5 px-4 bg-primary text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              {step === steps.length - 1 ? 'Começar a Usar' : 'Próximo'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
