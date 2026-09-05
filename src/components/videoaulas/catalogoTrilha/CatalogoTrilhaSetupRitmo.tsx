import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2 } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

interface CatalogoTrilhaSetupRitmoProps {
  catalogoId: string;
  titulo: string;
  onBack: () => void;
  onFinish: (dias: number) => void;
}

export const CatalogoTrilhaSetupRitmo = ({
  titulo,
  onFinish,
}: CatalogoTrilhaSetupRitmoProps) => {
  const [dias, setDias] = useState(15);
  const opcoesDias = [7, 15, 30];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full flex flex-col pt-4 px-4 pb-32"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-black text-foreground mb-2">Prazo da Missão</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Em quanto tempo você quer concluir o catálogo <strong className="text-foreground">{titulo}</strong>?
        </p>

        <div className="grid grid-cols-3 gap-3 mt-8">
          {opcoesDias.map((num) => (
            <button
              key={num}
              onClick={() => {
                haptic.selection();
                setDias(num);
              }}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 relative ${
                dias === num
                  ? 'border-primary bg-primary/10 scale-105 shadow-lg shadow-primary/20'
                  : 'border-border/50 bg-card hover:border-primary/50'
              }`}
            >
              <span className={`text-2xl font-black ${dias === num ? 'text-primary' : 'text-foreground'}`}>
                {num}
              </span>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${dias === num ? 'text-primary/80' : 'text-muted-foreground'}`}>
                Dias
              </span>
              {dias === num && <CheckCircle2 className="w-4 h-4 text-primary absolute top-2 right-2" />}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            haptic.success();
            onFinish(dias);
          }}
          className="w-full mt-10 bg-primary text-primary-foreground font-bold py-4 rounded-2xl shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] transition-all active:scale-95"
        >
          Gerar Minha Trilha
        </button>
      </div>
    </motion.div>
  );
};
