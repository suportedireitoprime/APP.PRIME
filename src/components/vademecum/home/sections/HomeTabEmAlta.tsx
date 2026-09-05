import { memo, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import HomeCard from '@/components/vademecum/home/HomeCard';
import { GRID_CATS, RADAR_CATS, Cat } from './homeSectionsData';

const AprendaSobreLeis = lazyWithRetry(() => import('@/components/vademecum/outros/AprendaSobreLeis'));

interface HomeTabEmAltaProps {
  onOpenCategory: (cat: Cat) => void;
  onSelectRadar: (id: string) => void;
}

const HomeTabEmAlta = ({ onOpenCategory, onSelectRadar }: HomeTabEmAltaProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      key="emalta"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
      className="space-y-4 px-1 pb-8"
    >
      <div className="mb-4">
        <h3 className="font-display text-foreground text-[18px] font-bold flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-primary" />
          Em Alta
        </h3>
        <p className="font-body text-sm text-muted-foreground mt-1 ml-3">
          As leis e normas mais acessadas no momento
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {GRID_CATS.map((c, i) => (
          <HomeCard
            key={c.id}
            icon={c.icon}
            label={c.label}
            sublabel={c.sublabel}
            color={c.color}
            delay={i * 0.05}
            solidColor={true}
            onClick={() => {
              if (c.id === 'jurisprudencia') {
                navigate('/jurisprudencia');
              } else {
                onOpenCategory(c);
              }
            }}
            data-track="home_card_click"
            data-track-name={c.label}
            data-track-section="emalta"
          />
        ))}
      </div>

      <div className="pt-6 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
        <Suspense fallback={<div className="h-32 bg-muted/20 animate-pulse rounded-xl mx-4 mt-8" />}>
          <AprendaSobreLeis titleClassName="px-4 sm:px-6 md:px-8 lg:px-12" />
        </Suspense>
      </div>

      <div className="pt-6">
        <div className="mb-4">
          <h3 className="font-display text-foreground text-[18px] font-bold flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-primary" />
            Outras Normas
          </h3>
          <p className="font-body text-sm text-muted-foreground mt-1 ml-3">
            Acompanhe publicações diárias, radares e boletins jurídicos
          </p>
        </div>
        <motion.div
          className="space-y-2.5"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
          }}
          initial="hidden"
          animate="show"
        >
          {RADAR_CATS.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.id}
                onClick={() => onSelectRadar(c.id)}
                data-track="home_radar_cat_click"
                className="w-full flex items-center gap-3 px-4 py-5 min-h-[76px] rounded-2xl bg-secondary border border-border/60 shadow-sm transition focus-visible:outline-none"
              >
                <Icon
                  className="w-8 h-8 shrink-0"
                  style={{ color: c.color }}
                  strokeWidth={1.15}
                />
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-display text-foreground text-[15.5px] font-bold leading-tight truncate">
                    {c.label}
                  </p>
                  <p className="font-body text-muted-foreground text-[12px] leading-tight truncate mt-0.5">
                    {c.sublabel}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default memo(HomeTabEmAlta);
