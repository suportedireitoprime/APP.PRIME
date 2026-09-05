import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CarouselHeaderTitleProps {
  kind: 'blog' | 'livro' | 'noticia';
}

const CarouselHeaderTitle = ({ kind }: CarouselHeaderTitleProps) => {
  const headerTitle =
    kind === 'blog'
      ? 'Blogger Jurídico'
      : kind === 'livro'
      ? 'Recomendação de Livro'
      : 'Notícias Jurídicas';

  const headerSubtitle =
    kind === 'blog'
      ? 'artigos, filosofia e curiosidades do Direito'
      : kind === 'livro'
      ? 'clássicos e obras do Direito'
      : 'notícias do mundo jurídico em tempo real';

  return (
    <div className="px-5 h-[64px] relative">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={kind}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.2 }}
          className="absolute left-5 right-5"
        >
          <h3 className="font-display text-foreground text-[18px] font-bold mb-1 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-primary" />
            {headerTitle}
          </h3>
          <p className="font-body text-muted-foreground text-[12.5px] leading-snug mb-3 ml-3 truncate">
            {headerSubtitle}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default memo(CarouselHeaderTitle);
