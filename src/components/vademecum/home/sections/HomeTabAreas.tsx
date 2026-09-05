import { memo } from 'react';
import { motion } from 'framer-motion';
import HomeCard from '@/components/vademecum/home/HomeCard';
import { AREA_CATS, AreaCat } from './homeSectionsData';

interface HomeTabAreasProps {
  onOpenArea: (area: AreaCat) => void;
}

const HomeTabAreas = ({ onOpenArea }: HomeTabAreasProps) => {
  return (
    <motion.div
      key="areas"
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
            Áreas do Direito
          </h2>
        </div>
        <p className="font-body text-muted-foreground text-[13px] leading-snug mt-1 ml-3">
          Navegue pela legislação organizada por área de atuação.
        </p>
      </div>
      <div className="h-[1.5px] bg-border/70 w-full -mt-2" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {AREA_CATS.map((c, i) => (
          <HomeCard
            key={c.id}
            icon={c.icon}
            label={c.label}
            sublabel={c.sublabel}
            color={c.color}
            delay={Math.min(i * 0.04, 0.3)}
            onClick={() => onOpenArea(c)}
            data-track="home_card_click"
            data-track-name={c.label}
            data-track-section="areas"
          />
        ))}
      </div>
    </motion.div>
  );
};

export default memo(HomeTabAreas);
