import { motion } from 'framer-motion';
import { 
  Landmark, Scale, Users, BookOpen, Feather, 
  BookMarked, Briefcase, Globe, Gavel, Unlock, Megaphone 
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { toast } from 'sonner';

const CATEGORIAS = [
  { id: 'presidentes', label: 'Presidentes', icon: Landmark },
  { id: 'ministros-stf', label: 'Ministros do STF', icon: Scale },
  { id: 'deputados', label: 'Deputados & Senadores', icon: Users },
  { id: 'juristas', label: 'Grandes Juristas', icon: BookOpen },
  { id: 'filosofos', label: 'Filósofos', icon: Feather },
  { id: 'doutrinadores', label: 'Doutrinadores Clássicos', icon: BookMarked },
  { id: 'advogados', label: 'Advogados Históricos', icon: Briefcase },
  { id: 'internacional', label: 'Ícones Dir. Internacional', icon: Globe },
  { id: 'magistrados', label: 'Magistrados', icon: Gavel },
  { id: 'abolicionistas', label: 'Abolicionistas', icon: Unlock },
  { id: 'promotores', label: 'Promotores', icon: Megaphone },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export const BiografiaCategoriasView = () => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-6 pb-32">
      <div className="space-y-2 text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-display font-bold text-foreground tracking-tight">
          Biografias
        </h2>
        <p className="text-sm font-body text-muted-foreground leading-relaxed">
          Explore a vida, o pensamento e o legado dos personagens que moldaram a história do Direito, da política e da filosofia no Brasil e no mundo.
        </p>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 pt-4"
      >
        {CATEGORIAS.map((cat) => {
          const Icon = cat.icon;
          return (
            <motion.button
              key={cat.id}
              variants={itemVariants}
              onClick={() => {
                haptic.selection();
                toast.info(`Categoria "${cat.label}" em construção. Em breve!`);
              }}
              className="flex flex-col items-center justify-center p-5 gap-3 rounded-2xl bg-card border border-border/40 shadow-sm hover:shadow-md hover:border-primary/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary group text-center"
            >
              <Icon className="w-8 h-8 text-zinc-400 transition-transform group-hover:scale-110 group-hover:text-primary" strokeWidth={1.5} />
              <span className="font-display font-semibold text-[13px] text-foreground/90 group-hover:text-primary transition-colors line-clamp-2">
                {cat.label}
              </span>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
};

export default BiografiaCategoriasView;
