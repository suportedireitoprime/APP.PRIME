import { Suspense, memo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import HomeCard from '@/components/vademecum/home/HomeCard';
import HomeTresPoderes from './HomeTresPoderes';
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
      {emAltaLeis ? (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4">
          {GRID_CATS.map((c, i) => (
            <HomeCard
              key={c.id}
              icon={c.icon}
              label={c.label}
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
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3 pt-2">
          <div className="mb-1 relative z-10 flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-foreground text-[18px] font-bold mb-1 flex items-center gap-2 uppercase tracking-widest">
                <span className="w-1 h-5 rounded-full bg-[#E11D48]" />
                Estudos
              </h3>
              <p className="font-body text-muted-foreground text-[12.5px] leading-snug ml-3">
                Ferramentas complementares para seus estudos
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4">
            {EMALTA_CATS.map((c, i) => (
              <HomeCard
                key={c.id}
                icon={c.icon}
                label={c.label}
                sublabel={c.sublabel}
                color="#FFFFFF"
                iconStyle={{ filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 10px rgba(255, 255, 255, 0.45))' }}
                iconStrokeWidth={1.5}
                delay={i * 0.05}
                className="transition-all"
                style={{
                  backgroundImage: 'linear-gradient(to top right, #0e0e11 0%, #16161a 45%, #2a2a30 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.12), 0 4px 14px rgba(0, 0, 0, 0.5)',
                }}
                iconClassName={c.id === 'ea-mapas' ? 'w-6 h-6' : ''}
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
        </div>
      )}

      {/* Carrossel de notícias movido para o final */}
      {!hideNoticias && (
        <div className="pt-8 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
          <Suspense fallback={<div className="h-48 bg-muted/20 animate-pulse rounded-xl mx-4" />}>
            <HomeNoticiasCarousel onOpenChange={onNewsOpenChange} autoplay={noticiasAutoplay} />
          </Suspense>
        </div>
      )}

      {/* Seção Três Poderes */}
      <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
        <HomeTresPoderes />
      </div>

      {/* Espaço de segurança para garantir que o último elemento não fique atrás do BottomNav */}
      <div className="h-28 w-full shrink-0 pointer-events-none" />
    </motion.div>
  );
};

export default memo(HomeTabEstudos);
