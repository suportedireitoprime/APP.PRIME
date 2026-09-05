import { memo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import HomeCard from '@/components/vademecum/home/HomeCard';
import CircularGallery from '@/components/ui/CircularGallery';
import { toast } from '@/hooks/use-toast';
import { GRID_CATS, EMALTA_CATS, Cat } from './homeSectionsData';

interface HomeTabEstudosProps {
  emAltaLeis?: boolean;
  hideBlog?: boolean;
  pillsItems: any[];
  onOpenCategory: (cat: Cat) => void;
  onOpenVisuais: () => void;
  onOpenAreas: () => void;
}

const HomeTabEstudos = ({
  emAltaLeis = false,
  hideBlog = false,
  pillsItems,
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

      {/* Pílulas em Carrossel 3D */}
      {!hideBlog && (
        <div className="pt-8">
          <div className="mb-4">
            <h3 className="font-display text-foreground text-[18px] font-bold flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-[#10B981]" />
              Pílulas de Códigos
            </h3>
            <p className="font-body text-sm text-muted-foreground mt-1 ml-3">
              Áudios curtos sobre os artigos mais cobrados
            </p>
          </div>
          <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen h-[350px]">
            <CircularGallery
              items={pillsItems}
              bend={0.3}
              textColor="#ffffff"
              scrollEase={0.15}
              borderRadius={0.05}
              onItemClick={(item) => {
                import('@/lib/nativeHaptics').then((m) => m.haptic.selection());
                navigate(`/pilulas/${item.id}`);
              }}
            />
          </div>
        </div>
      )}

      {/* Espaço de segurança para garantir que o último elemento não fique atrás do BottomNav */}
      <div className="h-28 w-full shrink-0 pointer-events-none" />
    </motion.div>
  );
};

export default memo(HomeTabEstudos);
