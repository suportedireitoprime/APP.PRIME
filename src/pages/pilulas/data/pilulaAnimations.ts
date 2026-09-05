import { type Variants } from 'framer-motion';

/**
 * Variants de animação para containers com stagger.
 * Compartilhado entre Pilulas (Clássicos) e outros componentes de lista.
 */
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

/**
 * Variants de animação para itens individuais da lista.
 */
export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};
