import { motion } from 'framer-motion';
import { Target, MapPin } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import type { ConcursoRow } from '@/lib/videoaulasStore';

interface SetupEditalProps {
  concursos: ConcursoRow[];
  onSelect: (id: string) => void;
}

export const SetupEdital = ({ concursos, onSelect }: SetupEditalProps) => (
  <motion.div
    initial="hidden"
    animate="show"
    exit={{ opacity: 0, y: -20 }}
    variants={{
      show: { transition: { staggerChildren: 0.1 } }
    }}
    className="w-full flex flex-col pt-4 px-4 pb-32"
  >
    <motion.div
      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
      className="text-center mb-8"
    >
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 relative">
        <Target className="w-10 h-10 text-primary" />
        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-50" />
      </div>
      <h2 className="text-2xl font-black text-foreground mb-2">Qual seu alvo?</h2>
      <p className="text-sm text-muted-foreground">Escolha o edital para montarmos seu plano de aprovação.</p>
    </motion.div>

    <div className="space-y-3">
      {concursos.map((c) => (
        <motion.button
          variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}
          key={c.id}
          onClick={() => {
            haptic.selection();
            onSelect(c.id);
          }}
          className="w-full flex items-center gap-4 text-left p-4 rounded-3xl border border-border/40 bg-card shadow-lg shadow-black/10 hover:border-primary/50 transition-all active:scale-[0.98]"
        >
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center shrink-0">
            <Target className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase leading-tight mb-1 text-foreground">{c.titulo}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-semibold">
              <MapPin className="w-3.5 h-3.5" /> {c.disciplinas?.length || 0} disciplinas
            </p>
          </div>
        </motion.button>
      ))}
    </div>
  </motion.div>
);
