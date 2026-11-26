import { Suspense, memo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import HomeCard from '@/components/vademecum/home/HomeCard';
import { toast } from '@/hooks/use-toast';
import HomeNoticiasCarousel from '@/components/vademecum/home/HomeNoticiasCarousel';
import HomeLivrosCarousel from '@/components/ferramentas/FerramentasLivrosCarrossel';
import HomeBoletinsList from './HomeBoletinsList';
import HomeSectionHeader from './HomeSectionHeader';
import { GRID_CATS, EMALTA_CATS, Cat } from './homeSectionsData';
interface HomeTabEstudosProps {
  emAltaLeis?: boolean;
  hideBlog?: boolean;
  hideNoticias?: boolean;
  noticiasAutoplay?: boolean;
  onNewsOpenChange?: (open: boolean) => void;
  onOpenCategory: (cat: Cat) => void;
  onOpenVisuais?: () => void;
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
  const { user } = useAuth();

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.user_metadata?.nome?.split(' ')[0] || 'Doutor(a)';

  return (
    <motion.div
      key="estudos"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
      className="space-y-4 xs:space-y-4.5 sm:space-y-5"
    >
      {/* Em Alta — leis (Vade Mecum) ou funções de estudo (home) */}
      {emAltaLeis ? (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4">
          {GRID_CATS.map((c, i) => (
            <HomeCard
              key={c.id}
              icon={c.icon}
              label={c.label}
              sublabel={c.sublabel || ''}
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
        <div className="flex flex-col gap-8">
          {/* Carrossel de Notícias Jurídicas antes de Estudos Livres */}
          {!hideNoticias && (
            <div className="-mx-4 sm:-mx-6 md:-mx-8">
              <HomeNoticiasCarousel autoplay={noticiasAutoplay} onOpenChange={onNewsOpenChange} />
            </div>
          )}

          {/* Seção Inteligência Jurídica — posicionada logo após o carrossel de Notícias Jurídicas */}
          <div className="flex flex-col gap-3">
            <HomeSectionHeader
              title="INTELIGÊNCIA JURÍDICA"
            />

            <div key="grid-estudos" className="grid grid-cols-2 gap-2.5 md:gap-4">
              {EMALTA_CATS.map((c, i) => (
                <HomeCard
                  key={`cat-${c.id}`}
                  icon={c.icon}
                  label={c.label}
                  sublabel={c.sublabel}
                  color="#FFFFFF"
                  iconStrokeWidth={1.4}
                  style={{
                    background: 'linear-gradient(135deg, #BE123C 0%, #881337 55%, #4C0519 100%)',
                  }}
                  className="border-white/15 hover:border-white/30 shadow-md shadow-rose-950/40 [&_p.font-body]:text-white/85 [&_svg]:text-white/80"
                  titleClassName="font-card text-white font-semibold text-[14px] sm:text-[15px] tracking-[-0.01em] leading-snug line-clamp-1"
                  delay={i * 0.05}
                  badge={c.emBreve ? 'Em breve' : undefined}
                  onClick={() => {
                    if (c.emBreve) {
                      toast({ title: 'Em breve', description: 'Essa função está sendo preparada.' });
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

          {/* Carrossel de Biblioteca Jurídica */}
          {!hideNoticias && <HomeLivrosCarousel />}

          {/* Boletins Jurídicos em Lista Vertical */}
          <HomeBoletinsList />
        </div>
      )}
    </motion.div>
  );
};

export default memo(HomeTabEstudos);

