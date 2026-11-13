import { Suspense, memo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import HomeCard from '@/components/vademecum/home/HomeCard';
import { toast } from '@/hooks/use-toast';
import HomeLivrosCarousel from '@/components/ferramentas/FerramentasLivrosCarrossel';
import HomeBoletinsList from './HomeBoletinsList';
import { GRID_CATS, EMALTA_CATS, Cat } from './homeSectionsData';
import HomePraticarCarousel from '@/components/vademecum/home/carousel/HomePraticarCarousel';
import HomeAulasInterativasBanner from '@/components/vademecum/home/HomeAulasInterativasBanner';
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
      className="space-y-6"
    >
      {/* Botão de Aulas Interativas abaixo do painel */}
      <div className="pt-2">
        <HomeAulasInterativasBanner />
      </div>

      {/* Carrossel Praticar no topo */}
      <div>
        <HomePraticarCarousel />
      </div>

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
        <div className="flex flex-col gap-6 pt-2">
          {/* Seção Estudos Livres — posicionada logo após o carrossel de Leis em Alta */}
          <div className="flex flex-col gap-3">
            <div className="mb-1 relative z-10 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-foreground text-[18px] font-bold mb-1 flex items-center gap-2 uppercase tracking-widest">
                  <span className="w-1 h-5 rounded-full bg-[#E11D48]" />
                  Estudos Livres
                </h3>
                <p className="font-body text-muted-foreground text-[12.5px] leading-snug ml-3">
                  Ferramentas complementares para seus estudos
                </p>
              </div>
            </div>
            
            <div key="grid-estudos" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4">
              {EMALTA_CATS.map((c, i) => (
                <HomeCard
                  key={`cat-${c.id}`}
                  icon={c.icon}
                  label={c.label}
                  sublabel={c.sublabel}
                  color={c.color}
                  delay={i * 0.05}
                  className="transition-all bg-[#252528] hover:bg-[#2F2F33] border-white/5 shadow-sm"
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

          {/* Carrossel de Biblioteca Jurídica fixo */}
          {!hideNoticias && (
            <div className="pt-2 pb-2 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
              <Suspense fallback={<div className="h-48 bg-muted/20 animate-pulse rounded-xl mx-4" />}>
                <HomeLivrosCarousel />
              </Suspense>
            </div>
          )}

          {/* Boletins Jurídicos em Lista Vertical (logo após o carrossel de clássicos) */}
          <div className="px-1 pt-1">
            <HomeBoletinsList />
          </div>
        </div>
      )}


      {/* SeÃ§Ã£o TrÃªs Poderes */}
      <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
      </div>

      {/* Espaço de segurança para garantir que o último elemento não fique atrás do BottomNav */}
      <div className="h-28 w-full shrink-0 pointer-events-none" />
    </motion.div>
  );
};

export default memo(HomeTabEstudos);

