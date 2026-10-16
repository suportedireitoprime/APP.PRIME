import { motion } from 'framer-motion';
import { TEMAS, TEMA_COLORS, type BlogTema } from '@/data/blogPosts';
import { haptic } from '@/lib/nativeHaptics';

interface Props {
  onSelectCategoria: (tema: BlogTema) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

export const BlogCategoriasView = ({ onSelectCategoria }: Props) => {
  const sortedTemas = [...TEMAS].sort((a, b) => a.localeCompare(b, 'pt-BR'));

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-6 pb-32">
      <div className="space-y-2 text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-display font-bold text-foreground tracking-tight">
          Explorar por Categoria
        </h2>
        <p className="text-sm font-body text-muted-foreground leading-relaxed">
          Navegue pelas diversas áreas do Direito. De atualidades e jurisprudência até as curiosidades mais interessantes.
        </p>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 pt-4"
      >
        {sortedTemas.map((tema) => {
          const twColor = TEMA_COLORS[tema]?.chip || 'emerald';
          const isAtivo = tema === 'Leis' || tema === 'Conceitos Fundamentais';
          return (
            <motion.button
              key={tema}
              variants={itemVariants}
              onClick={() => {
                haptic.selection();
                onSelectCategoria(tema);
              }}
              className={`relative flex flex-col items-center justify-center p-5 sm:p-6 gap-2.5 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary group text-center overflow-hidden ${
                isAtivo ? 'border-primary/40 bg-card/90 ring-1 ring-primary/20' : 'border-border/40 opacity-80 hover:opacity-100'
              }`}
            >
              <div
                className="absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20"
                style={{ background: TEMA_COLORS[tema]?.bg || 'rgba(16, 185, 129, 0.1)' }}
              />
              <div className="relative z-10 font-display font-semibold text-[13px] sm:text-sm text-foreground/90 group-hover:text-primary transition-colors line-clamp-2">
                {tema}
              </div>
              {isAtivo ? (
                <span className="relative z-10 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  50 Artigos
                </span>
              ) : (
                <span className="relative z-10 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Em breve
                </span>
              )}
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
};

export default BlogCategoriasView;
