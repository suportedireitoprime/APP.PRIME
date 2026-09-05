import { memo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import HomeCard from '@/components/vademecum/home/HomeCard';
import { CATEGORIA_CATS, CategoriaFormal } from './homeSectionsData';

interface HomeTabCategoriasProps {
  onOpenCategory: (category: CategoriaFormal) => void;
}

const HomeTabCategorias = ({ onOpenCategory }: HomeTabCategoriasProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      key="categorias"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
      className="space-y-4 px-1 pb-8"
    >
      <div>
        <div className="flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-primary" />
          <h2 className="font-body text-foreground text-2xl sm:text-3xl font-bold tracking-tight">
            Categorias
          </h2>
        </div>
        <p className="font-body text-muted-foreground text-[13px] leading-snug mt-1 ml-3">
          Leis federais, legislação estadual, jurisprudência, OAB, decretos e outras normas.
        </p>
      </div>
      <div className="h-[1.5px] bg-border/70 w-full -mt-2" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {CATEGORIA_CATS.map((c, i) => (
          <HomeCard
            key={c.id}
            icon={c.icon}
            label={c.label}
            sublabel={c.sublabel}
            color={c.color}
            delay={i * 0.05}
            onClick={() => {
              if (c.route) { navigate(c.route); return; }
              if (c.id === 'cat-jurisprudencia') { navigate('/jurisprudencia'); return; }
              onOpenCategory(c);
            }}
            data-track="home_card_click"
            data-track-name={c.label}
            data-track-section="categorias"
          />
        ))}
      </div>
    </motion.div>
  );
};

export default memo(HomeTabCategorias);
