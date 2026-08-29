import { Search } from 'lucide-react';
import heroBannerAsset from '@/assets/desktop-hero-banner.webp';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getNoticiasCache, type Noticia } from '@/services/noticiasService';
import NoticiaViewerSheet from '@/components/vademecum/NoticiaViewerSheet';
import { newsImg } from '@/lib/cdnImg';

const heroBanner = heroBannerAsset;

export interface DesktopHeroFunction {
  id: string;
  label: string;
  svg: React.ReactNode;
  onClick: () => void;
}

interface Props {
  typingHint?: string;
  onSearchClick?: () => void;
  /** @deprecated Functions now render below the hero via DesktopFunctionRow */
  functions?: DesktopHeroFunction[];
}

const DesktopHeroBanner = ({ typingHint = 'Buscar lei...', onSearchClick }: Props) => {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedNoticia, setSelectedNoticia] = useState<Noticia | null>(null);

  useEffect(() => {
    setNoticias((getNoticiasCache() || []).slice(0, 5));
  }, []);

  useEffect(() => {
    if (noticias.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % noticias.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [noticias.length]);

  const currentNews = noticias[currentIndex];

  return (
    <div className="relative w-full overflow-hidden" style={{ minHeight: '260px' }}>
      <img
        src={heroBanner}
        alt="Direito Prime banner"
        className="absolute inset-0 w-full h-full object-cover object-center"
        width={1920}
        height={512}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

      <div className="relative z-10 flex items-center h-full min-h-[260px] px-12 xl:px-20 2xl:px-28 py-8">
        <div className="flex w-full items-center justify-between gap-12">
          
          <div className="flex-1 max-w-3xl space-y-6">
            <div className="space-y-3">
              <h2 className="font-serif italic text-4xl xl:text-5xl font-bold text-foreground leading-[1.05] tracking-tight drop-shadow-md">
                Estudos Jurídicos
              </h2>
              <p className="text-muted-foreground text-base xl:text-lg font-body leading-relaxed max-w-2xl">
                Pesquise por legislação, jurisprudência, resumos e materiais de estudo.
              </p>
            </div>

            {/* Search bar */}
            <button
              onClick={onSearchClick}
              className="group relative w-full max-w-3xl flex items-center h-16 pl-6 pr-24 rounded-2xl bg-card/90 backdrop-blur border-2 border-primary/40 shadow-2xl shadow-primary/20 hover:border-primary/70 transition-colors text-left"
            >
              <Search className="w-5 h-5 text-primary shrink-0 mr-3" />
              <span className="text-foreground/80 text-base xl:text-lg font-body truncate">
                {typingHint}
                <span className="animate-pulse text-primary">|</span>
              </span>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 h-12 px-5 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/40 group-hover:bg-primary/90 transition-colors">
                Pesquisar
              </span>
            </button>

            <p className="text-muted-foreground text-sm font-body flex items-center gap-2">
              <span className="text-primary">★</span> +10.000 alunos já estudam com a gente
            </p>
          </div>

          {/* Right side news card */}
          {currentNews && (
            <div className="hidden xl:block w-[360px] shrink-0">
               <div className="text-[11px] font-bold font-body uppercase tracking-widest text-primary mb-3">Notícias Jurídicas</div>
               <div 
                 className="relative h-44 w-full rounded-2xl overflow-hidden border border-border shadow-2xl cursor-pointer group bg-card"
                 onClick={() => setSelectedNoticia(currentNews)}
               >
                 <AnimatePresence mode="wait">
                   <motion.div
                     key={currentNews.id}
                     initial={{ opacity: 0, y: 5 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -5 }}
                     transition={{ duration: 0.4, ease: "easeOut" }}
                     className="absolute inset-0"
                   >
                     {currentNews.imagem_url ? (
                       <>
                         <img src={newsImg(currentNews.imagem_url, 400)} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                       </>
                     ) : (
                       <div className="absolute inset-0 bg-secondary/20" />
                     )}
                     <div className="absolute bottom-0 left-0 right-0 p-5">
                       <h3 className="text-white font-display font-bold text-sm line-clamp-3 leading-snug drop-shadow-md">{currentNews.titulo}</h3>
                     </div>
                   </motion.div>
                 </AnimatePresence>
               </div>
            </div>
          )}

        </div>
      </div>

      {selectedNoticia && (
        <NoticiaViewerSheet 
          open={!!selectedNoticia} 
          onOpenChange={(v) => !v && setSelectedNoticia(null)} 
          noticia={selectedNoticia} 
        />
      )}
    </div>
  );
};

export default DesktopHeroBanner;

