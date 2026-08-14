import { motion } from 'framer-motion';
import { 
  Landmark, Scale, Users, BookOpen, Feather, 
  BookMarked, Briefcase, Globe, Gavel, Unlock, Megaphone 
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { toast } from 'sonner';

const CATEGORIAS = [
  { id: 'presidentes', label: 'Presidentes', icon: Landmark, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 'ministros-stf', label: 'Ministros do STF', icon: Scale, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'deputados', label: 'Deputados & Senadores', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  { id: 'juristas', label: 'Grandes Juristas', icon: BookOpen, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { id: 'filosofos', label: 'Filósofos', icon: Feather, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { id: 'doutrinadores', label: 'Doutrinadores Clássicos', icon: BookMarked, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { id: 'advogados', label: 'Advogados Históricos', icon: Briefcase, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { id: 'internacional', label: 'Ícones Dir. Internacional', icon: Globe, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  { id: 'magistrados', label: 'Magistrados', icon: Gavel, color: 'text-teal-500', bg: 'bg-teal-500/10' },
  { id: 'abolicionistas', label: 'Abolicionistas', icon: Unlock, color: 'text-red-500', bg: 'bg-red-500/10' },
  { id: 'promotores', label: 'Promotores', icon: Megaphone, color: 'text-sky-500', bg: 'bg-sky-500/10' },
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
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cat.bg} transition-transform group-hover:scale-110`}>
                <Icon className={`w-6 h-6 ${cat.color}`} strokeWidth={2} />
              </div>
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
