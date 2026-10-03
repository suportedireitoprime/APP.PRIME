import { Suspense, memo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ListChecks } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { FlashcardsIcon } from '@/components/icons/FlashcardsIcon';
import HomeCard from '@/components/vademecum/home/HomeCard';
import HomeTresPoderes from './HomeTresPoderes';
import HomeLeiSecaBar from './HomeLeiSecaBar';
import HomeApresentacoesTimeline from './HomeApresentacoesTimeline';
import { toast } from '@/hooks/use-toast';
import HomeNoticiasCarousel from '@/components/vademecum/home/HomeNoticiasCarousel';
import HomeLivrosCarousel from '@/components/ferramentas/FerramentasLivrosCarrossel';
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
            
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
              <HomeCard
                icon={FlashcardsIcon}
                label="Flashcards"
                sublabel="Revisão espaçada"
                color="#00FFAA"
                iconStrokeWidth={1.5}
                delay={0}
                className="transition-all bg-[#252528] hover:bg-[#2F2F33] border-white/5 shadow-sm"
                onClick={() => navigate('/flashcards')}
                data-track="home_card_click"
                data-track-name="Flashcards"
                data-track-section="praticar"
              />
              <HomeCard
                icon={ListChecks}
                label="Questões"
                sublabel="Treino focado"
                color="#FF4D00"
                iconStrokeWidth={1.5}
                delay={0.05}
                className="transition-all bg-[#252528] hover:bg-[#2F2F33] border-white/5 shadow-sm"
                onClick={() => navigate('/questoes')}
                data-track="home_card_click"
                data-track-name="Questões"
                data-track-section="praticar"
              />
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

          {/* SeÃ§Ã£o Lei Seca com TÃ­tulo, Risquinho Vermelho e DescriÃ§Ã£o */}
          <div className="pt-2 flex flex-col gap-2.5">
            <div className="mb-0.5 relative z-10 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-foreground text-[18px] font-bold mb-1 flex items-center gap-2 uppercase tracking-widest">
                  <span className="w-1 h-5 rounded-full bg-[#E11D48]" />
                  Lei Seca
                </h3>
                <p className="font-body text-muted-foreground text-[12.5px] leading-snug ml-3">
                  Pratique artigos comentados, simulados e questÃµes
                </p>
              </div>
            </div>

            <HomeLeiSecaBar />
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

