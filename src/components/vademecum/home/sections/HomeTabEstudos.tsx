import { Suspense, memo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import HomeCard from '@/components/vademecum/home/HomeCard';
import { toast } from '@/hooks/use-toast';
const HomeNoticiasCarousel = lazyWithRetry(() => import('@/components/vademecum/home/HomeNoticiasCarousel'));
import { GRID_CATS, EMALTA_CATS, Cat } from './homeSectionsData';

interface HomeTabEstudosProps {
  emAltaLeis?: boolean;
  hideBlog?: boolean;
  hideNoticias?: boolean;
  noticiasAutoplay?: boolean;
  onNewsOpenChange?: (open: boolean) => void;
  onOpenCategory: (cat: Cat) => void;
  onOpenVisuais: () => void;
  onOpenAreas: () => void;
}

const HomeTabEstudos = ({
  emAltaLeis = false,
  hideBlog = false,
  hideNoticias = false,
  noticiasAutoplay = true,
  onNewsOpenChange,
  onOpenCategory,
  onOpenVisuais,
  onOpenAreas,
}: HomeTabEstudosProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      key="estudos"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
      className="space-y-6"
    >
      {/* Em Alta — leis (Vade Mecum) ou funções de estudo (home) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {emAltaLeis
          ? GRID_CATS.map((c, i) => (
              <HomeCard
                key={c.id}
                icon={c.icon}
                label={c.label}
                sublabel={c.sublabel}
                color={c.color}
                delay={i * 0.05}
                onClick={() => {
                  if (c.id === 'jurisprudencia') {
                    navigate('/jurisprudencia');
                  } else {
                    onOpenCategory(c);
                  }
                }}
                data-track="home_card_click"
                data-track-name={c.label}
                data-track-section="estudos"
              />
            ))
          : EMALTA_CATS.map((c, i) => (
              <HomeCard
                key={c.id}
                icon={c.icon}
                label={c.label}
                sublabel={c.sublabel}
                color={c.color}
                delay={i * 0.05}
                iconClassName={c.id === 'ea-mapas' ? 'w-6 h-6' : undefined}
                badge={c.emBreve ? 'Em breve' : undefined}
                onClick={() => {
                  if (c.emBreve) {
                    toast({ title: 'Em breve', description: 'Essa função está sendo preparada.' });
                    return;
                  }
                  if (c.id === 'ea-mapas') {
                    onOpenVisuais();
                    return;
                  }
                  if (c.id === 'ea-areas') {
                    onOpenAreas();
                    return;
                  }
                  navigate(c.route);
                }}
                data-track="home_card_click"
                data-track-name={c.label}
                data-track-section="estudos"
              />
            ))}
      </div>

      {/* Carrossel de notícias movido para o final */}
      {!hideNoticias && (
        <div className="pt-8 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
          <Suspense fallback={<div className="h-48 bg-muted/20 animate-pulse rounded-xl mx-4" />}>
            <HomeNoticiasCarousel onOpenChange={onNewsOpenChange} autoplay={noticiasAutoplay} />
          </Suspense>
        </div>
      )}

      {/* Espaço de segurança para garantir que o último elemento não fique atrás do BottomNav */}
      <div className="h-28 w-full shrink-0 pointer-events-none" />
    </motion.div>
  );
};

export default memo(HomeTabEstudos);
