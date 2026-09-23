import { Suspense, memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Sparkles, Zap, Star, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import HomeCard from '@/components/vademecum/home/HomeCard';
import HomeTresPoderes from './HomeTresPoderes';
import HomeLeiSecaBar from './HomeLeiSecaBar';
import HomeApresentacoesTimeline from './HomeApresentacoesTimeline';
import { toast } from '@/hooks/use-toast';
import HomeNoticiasCarousel from '@/components/vademecum/home/HomeNoticiasCarousel';
import HomeLivrosCarousel from '@/components/ferramentas/FerramentasLivrosCarrossel';
const HomeAprenderCarousel = lazyWithRetry(() => import('@/components/vademecum/home/aprender/HomeAprenderCarousel'));
import { AprenderCarouselSkeleton } from '@/components/vademecum/home/aprender/chunks';
import { GRID_CATS, EMALTA_CATS, Cat } from './homeSectionsData';
import horusOwlAsset from '@/assets/horus/horus-owl.png.asset.json';
import horusOwlBundled from '@/assets/horus/horus-owl.webp';
import horusOwl1 from '@/assets/horus/01_coruja_oratoria.webp';
import horusOwl2 from '@/assets/horus/02_coruja_estudando.webp';
import horusOwl3 from '@/assets/horus/03_coruja_balanca_justica.webp';
import horusOwl4 from '@/assets/horus/04_coruja_maleta_balanca.webp';
import { pickAsset, srcOf } from '@/lib/assetUrl';

const horusOwl = pickAsset(horusOwlBundled, srcOf(horusOwlAsset));
const OWL_IMAGES = [horusOwl, horusOwl1, horusOwl2, horusOwl3, horusOwl4];

const HORUS_DESCRIPTIONS = [
  "Seu tutor inteligente 24h",
  "Tire dúvidas pelo WhatsApp",
  "Peça resumos de leis",
  "Pesquise jurisprudência",
  "Explique termos difíceis",
  "Gere casos práticos",
  "Tabelas comparativas na hora",
  "Crie flashcards de revisão",
  "Entenda a Lei Seca rápido",
  "Simule questões de provas"
];

// Função para decidir o carrossel de forma determinística (por horário)
// Isso evita trocas erráticas a cada navegação, garantindo que o cache funcione e o carregamento seja instantâneo.
function getTopCarouselType(): 'noticias' | 'livros' {
  const hour = new Date().getHours();
  // Das 00:00 às 17:59 exibe Notícias. Das 18:00 às 23:59 exibe Livros.
  return (hour >= 18 || hour < 6) ? 'livros' : 'noticias';
}

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
  const { user } = useAuth();

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.user_metadata?.nome?.split(' ')[0] || 'Doutor(a)';

  const [topCarousel] = useState<'noticias' | 'livros'>(() => {
    return getTopCarouselType();
  });

  const [descIndex, setDescIndex] = useState(0);
  const [owlIndex, setOwlIndex] = useState(0);
  const [showBubble, setShowBubble] = useState(false);
  const [bubblePhrase, setBubblePhrase] = useState("");

  useEffect(() => {
    // Alternância do texto descritivo do botão
    const descInterval = setInterval(() => {
      setDescIndex((prev) => (prev + 1) % HORUS_DESCRIPTIONS.length);
    }, 3200);

    // Alternância da imagem do Horus a cada 5 segundos aleatoriamente
    const owlInterval = setInterval(() => {
      setOwlIndex((prev) => {
        let next = prev;
        while (next === prev) {
          next = Math.floor(Math.random() * OWL_IMAGES.length);
        }
        return next;
      });
    }, 5000);

    return () => {
      clearInterval(descInterval);
      clearInterval(owlInterval);
    };
  }, []);

  useEffect(() => {
    // Lógica do balão de fala da coruja (1 vez por sessão, some em 6s)
    const hasShown = sessionStorage.getItem('horus_balloon_shown');
    if (!hasShown) {
      const phrases = [
        "venha conversar comigo! Vou tirar suas dúvidas jurídicas.",
        "precisa de ajuda com leis? Me chame aqui!",
        "está com dúvidas? Eu te explico em segundos!",
        "simule casos práticos falando direto comigo!"
      ];
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      setBubblePhrase(randomPhrase);
      setShowBubble(true);
      sessionStorage.setItem('horus_balloon_shown', 'true');

      const timer = setTimeout(() => {
        setShowBubble(false);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <motion.div
      key="estudos"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
      className="space-y-6"
    >
      {/* Carrossel de Notícias Jurídicas ou Livros no topo */}
      {!hideNoticias && (
        <div className="pt-2 pb-2 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
          <Suspense fallback={<div className="h-48 bg-muted/20 animate-pulse rounded-xl mx-4" />}>
            {topCarousel === 'noticias' ? (
              <HomeNoticiasCarousel onOpenChange={onNewsOpenChange} autoplay={noticiasAutoplay} />
            ) : (
              <HomeLivrosCarousel />
            )}
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
        <div className="flex flex-col gap-3 pt-2">
          {/* Assistente Horus Centralizado e Destacado */}
          <div className="flex justify-center mb-10 mt-8 px-4">
            <button 
              onClick={() => navigate('/assistente-horus')}
              className="group relative flex items-center w-full max-w-[340px] bg-gradient-to-r from-[#E11D48] to-[#7F1D1D] text-white pl-6 pr-24 py-4 rounded-[1.25rem] shadow-xl shadow-rose-900/20 transition-all active:scale-95 border border-rose-500/30 overflow-visible"
            >
              {/* SVGs de Fundo */}
              <div className="absolute inset-0 overflow-hidden rounded-[1.25rem] pointer-events-none">
                <Sparkles className="absolute top-2 left-4 w-5 h-5 text-rose-300 opacity-20" />
                <Zap className="absolute bottom-1 left-24 w-8 h-8 text-rose-300 opacity-10" />
                <Star className="absolute top-1/2 left-32 w-4 h-4 text-rose-300 opacity-15" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
              </div>

              <div className="flex flex-col items-start text-left z-10 min-w-0 flex-1 mt-1">
                <span className="text-[15px] font-display font-bold uppercase tracking-widest flex items-center gap-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  Assistente NO WhatsApp
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  >
                    <ChevronRight className="w-4 h-4 opacity-80 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                  </motion.div>
                </span>
                
                <div className="h-4 relative w-full overflow-hidden mt-1">
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={descIndex}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                      className="absolute text-[12px] font-body text-rose-100/90 leading-snug font-semibold whitespace-nowrap truncate w-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                    >
                      {HORUS_DESCRIPTIONS[descIndex]}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>
              
              {/* Balão de Fala */}
              <AnimatePresence>
                {showBubble && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: [0, -3, 0] }}
                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    transition={{ delay: 0.4, y: { repeat: Infinity, duration: 3.5, ease: "easeInOut" } }}
                    className="absolute -top-10 right-20 z-30"
                  >
                    <div className="relative bg-white text-rose-700 px-3 py-1.5 rounded-[12px] shadow-lg border border-rose-100 max-w-[190px]">
                      {/* Botão de Fechar */}
                      <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowBubble(false); }}
                        className="absolute -top-1.5 -left-1.5 bg-white border border-rose-100 text-rose-400 hover:text-rose-600 rounded-full w-4 h-4 flex items-center justify-center shadow-sm z-10"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                      
                      <p className="text-[10px] font-bold leading-tight text-center">
                        {firstName}, {bubblePhrase}
                      </p>
                      {/* Caldinha apontando para a boca da coruja (direita) */}
                      <div className="absolute top-1/2 -right-1.5 w-3 h-3 bg-white border-r border-t border-rose-100 transform -translate-y-1/2 rotate-45 rounded-sm pointer-events-none"></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Imagem do Horus e Texto no pé */}
              <div className="absolute -right-3 -top-8 w-[110px] flex flex-col items-center pointer-events-none z-20">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={owlIndex}
                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    transition={{ duration: 0.2 }}
                    src={OWL_IMAGES[owlIndex]} 
                    alt="Horus" 
                    className="w-full h-[110px] object-contain drop-shadow-2xl" 
                  />
                </AnimatePresence>
                <span className="text-[12px] font-display font-black uppercase tracking-widest text-white/95 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] -mt-1.5 relative z-10">
                  Horus
                </span>
              </div>
            </button>
          </div>

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
          
          <div key="grid-estudos" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4">
            {EMALTA_CATS.map((c, i) => (
              <HomeCard
                key={`cat-${c.id}`}
                icon={c.icon}
                label={c.label}
                sublabel={c.sublabel}
                color="#FFFFFF"
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

          {/* Aprender em Carrossel 3D */}
          {!hideBlog && (
            <div className="pt-6 pb-0">
              <Suspense fallback={<AprenderCarouselSkeleton />}>
                <HomeAprenderCarousel hideBlog={hideBlog} />
              </Suspense>
            </div>
          )}

          {/* Seção Lei Seca com Título, Risquinho Vermelho e Descrição */}
          <div className="pt-2 flex flex-col gap-2.5">
            <div className="mb-0.5 relative z-10 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-foreground text-[18px] font-bold mb-1 flex items-center gap-2 uppercase tracking-widest">
                  <span className="w-1 h-5 rounded-full bg-[#E11D48]" />
                  Lei Seca
                </h3>
                <p className="font-body text-muted-foreground text-[12.5px] leading-snug ml-3">
                  Pratique artigos comentados, simulados e questões
                </p>
              </div>
            </div>

            <HomeLeiSecaBar />
          </div>
        </div>
      )}


      {/* Seção Três Poderes */}
      <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
        <HomeTresPoderes />
      </div>

      {/* Linha do Tempo de Apresentações (Logo após Três Poderes) */}
      <HomeApresentacoesTimeline />

      {/* Espaço de segurança para garantir que o último elemento não fique atrás do BottomNav */}
      <div className="h-28 w-full shrink-0 pointer-events-none" />
    </motion.div>
  );
};

export default memo(HomeTabEstudos);
