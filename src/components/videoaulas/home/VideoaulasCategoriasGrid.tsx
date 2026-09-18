import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, BookOpen, BookText, Landmark, Building2, Building } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { motion } from 'framer-motion';

const CATEGORIAS_PRINCIPAIS = [
  { id: 'areas', label: 'Áreas do Direito', icon: BookOpen, color: '#3b82f6', route: '/videoaulas/areas' },
  { id: 'lei-seca', label: 'Lei Seca', icon: Scale, color: '#f59e0b', route: '/videoaulas/lei-seca' },
  { id: 'jurisprudencia', label: 'Jurisprudência', icon: BookText, color: '#8b5cf6', route: '/videoaulas/jurisprudencia' },
  { id: 'estatutos', label: 'Estatutos', icon: Landmark, color: '#10b981', route: '/videoaulas/estatutos' },
];

const TRES_PODERES = [
  { id: 'senado', label: 'Senado Federal', icon: Building, color: '#64748b', route: '/videoaulas/canal/senado' },
  { id: 'stf', label: 'STF', icon: Landmark, color: '#64748b', route: '/videoaulas/canal/stf' },
  { id: 'camara', label: 'Câmara dos Deputados', icon: Building2, color: '#64748b', route: '/videoaulas/canal/camara' },
];

export const VideoaulasCategoriasGrid = React.memo(function VideoaulasCategoriasGrid() {
  const navigate = useNavigate();

  const renderCard = (item: any) => {
    const Icon = item.icon;
    return (
      <motion.button
        key={item.id}
        variants={{
          hidden: { opacity: 0, y: 10 },
          show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
        }}
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          haptic.selection();
          navigate(item.route);
        }}
        className="group flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border border-border/80 bg-card/60 transition-colors backdrop-blur-md hover:bg-card hover:border-primary/50 hover:shadow-lg focus-visible:outline-none gap-2 text-center"
      >
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center sm:h-12 sm:w-12">
          <Icon className="h-7 w-7 sm:h-8 sm:w-8 transition-transform group-hover:scale-110" strokeWidth={1.9} style={{ color: item.color }} />
        </div>

        <div>
          <p
            className="text-[11px] sm:text-[13px] font-semibold text-foreground leading-tight px-1"
            style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}
          >
            {item.label}
          </p>
        </div>
      </motion.button>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground lg:text-[13px]">
          Categorias
        </p>
        <motion.div 
          className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4 2xl:grid-cols-3"
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.05 } }
          }}
        >
          {CATEGORIAS_PRINCIPAIS.map(renderCard)}
        </motion.div>
      </div>

      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-border/60" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Três Poderes
        </span>
        <div className="h-px flex-1 bg-border/60" />
      </div>

      <motion.div 
        className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4"
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.05 } }
        }}
      >
        {TRES_PODERES.map(renderCard)}
      </motion.div>
    </div>
  );
});
