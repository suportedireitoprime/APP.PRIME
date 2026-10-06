import { Suspense, memo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ListChecks, Layers, FileQuestion, Timer, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { FlashcardsIcon } from '@/components/icons/FlashcardsIcon';
import HomeCard from '@/components/vademecum/home/HomeCard';
import HomeTresPoderes from './HomeTresPoderes';
import HomeApresentacoesTimeline from './HomeApresentacoesTimeline';
import { toast } from '@/hooks/use-toast';
import HomeNoticiasCarousel from '@/components/vademecum/home/HomeNoticiasCarousel';
import HomeLivrosCarousel from '@/components/ferramentas/FerramentasLivrosCarrossel';
import { shade } from '@/lib/leiTheme';
import { haptic } from '@/lib/nativeHaptics';

const PRATICAR_FUNCTIONS = [
  {
    id: 'leiseca',
    title: 'Lições',
    subtitle: 'Tiro ao alvo',
    icon: Target,
    color: '#f43f5e', // rose
    image: '/assets/praticar-leiseca.png',
    path: '/praticar',
  },
  {
    id: 'flashcards',
    title: 'Flashcards',
    subtitle: 'Revisão ativa',
    icon: Layers,
    color: '#3b82f6', // blue
    image: '/assets/praticar-flashcards.png',
    path: '/flashcards',
  },
  {
    id: 'questoes',
    title: 'Questões',
    subtitle: 'Teste de fixação',
    icon: FileQuestion,
    color: '#10b981', // emerald
    image: '/assets/praticar-questoes.png',
    path: '/questoes',
  },
  {
    id: 'simulados',
    title: 'Simulados',
    subtitle: 'Treino real',
    icon: Timer,
    color: '#8b5cf6', // violet
    image: '/assets/praticar-simulados.png',
    path: '/simulados',
  }
];
import { GRID_CATS, EMALTA_CATS, Cat } from './homeSectionsData';
import HomeEmAltaCarousel from '@/components/vademecum/home/carousel/HomeEmAltaCarousel';
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
      {/* Carrossel Em Alta no topo */}
      <div className="pt-2">
        <HomeEmAltaCarousel />
      </div>

      {/* Carrossel de Biblioteca Jurídica fixo */}
      {!hideNoticias && (
        <div className="pt-2 pb-2 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
          <Suspense fallback={<div className="h-48 bg-muted/20 animate-pulse rounded-xl mx-4" />}>
            <HomeLivrosCarousel />
          </Suspense>
        </div>
      )}

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
          
          {/* Seção Praticar */}
          <div className="flex flex-col gap-3">
            <div className="mb-1 relative z-10 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-foreground text-[18px] font-bold mb-1 flex items-center gap-2 uppercase tracking-widest">
                  <span className="w-1 h-5 rounded-full bg-[#E11D48]" />
                  Praticar
                </h3>
                <p className="font-body text-muted-foreground text-[12.5px] leading-snug ml-3">
                  Treine com flashcards e questões inéditas
                </p>
              </div>
            </div>
            <div className="-mx-4 sm:-mx-6 px-4 sm:px-6 flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 pt-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {PRATICAR_FUNCTIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    navigate(item.path);
                  }}
                  className="snap-center shrink-0 min-w-[152px] max-w-[162px] h-[122px] relative flex flex-col shadow-md rounded-2xl group transition-all duration-300 text-left cursor-pointer focus-visible:outline-none hover:-translate-y-1"
                >
                  <div 
                    className="absolute inset-0 rounded-2xl pointer-events-none transition-all duration-300 shadow-md group-hover:opacity-100 opacity-95 overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${item.color} 0%, ${shade(item.color, -0.3)} 100%)` }}
                  >
                    <item.icon
                      className="absolute -right-2 -bottom-2 w-20 h-20 text-white/[0.15] drop-shadow-md group-hover:scale-105 group-hover:text-white/[0.2] transition-all duration-300"
                      strokeWidth={1.3}
                    />
                    <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-white/10 blur-xl group-hover:bg-white/20 transition-all" />
                  </div>

                  {item.image && (
                    <div className="absolute right-0 w-auto h-[105px] max-w-none pointer-events-none z-10 transition-all duration-300 origin-bottom group-hover:scale-[1.06] -top-4 drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] group-hover:-top-5 group-hover:drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)]">
                      <img
                        src={item.image}
                        alt=""
                        className="h-full w-auto object-contain"
                      />
                    </div>
                  )}

                  <div className="relative z-20 flex flex-col justify-between w-full h-full p-3 pointer-events-none">
                    <div className="flex justify-between items-start">
                      <item.icon
                        className="w-5 h-5 text-white shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-200"
                        strokeWidth={1.8}
                      />
                    </div>
                    
                    <div className="flex justify-between items-end mt-auto">
                      <div className="flex flex-col">
                        <span className="font-display text-white text-[16px] sm:text-[18px] font-black tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] leading-none">
                          {item.title}
                        </span>
                        <span className="text-white/80 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mt-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                          {item.subtitle}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Seção Estudos Livre */}
          <div className="flex flex-col gap-3">
            <div className="mb-1 relative z-10 flex items-start justify-between gap-3">
              <div>
              <h3 className="font-display text-foreground text-[18px] font-bold mb-1 flex items-center gap-2 uppercase tracking-widest">
                <span className="w-1 h-5 rounded-full bg-[#E11D48]" />
                Estudos Livre
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
                iconStrokeWidth={1.5}
                delay={i * 0.05}
                className="transition-all bg-[#252528] hover:bg-[#2F2F33] border-white/5 shadow-sm"
                iconClassName={c.id === 'ea-mapas' ? 'w-6 h-6' : ''}
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
        </div>
      )}


      {/* SeÃ§Ã£o TrÃªs Poderes */}
      <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
        <HomeTresPoderes />
      </div>

      {/* Linha do Tempo de ApresentaÃ§Ãµes (Logo apÃ³s TrÃªs Poderes) */}
      <HomeApresentacoesTimeline />

      {/* EspaÃ§o de seguranÃ§a para garantir que o Ãºltimo elemento nÃ£o fique atrÃ¡s do BottomNav */}
      <div className="h-28 w-full shrink-0 pointer-events-none" />
    </motion.div>
  );
};

export default memo(HomeTabEstudos);

