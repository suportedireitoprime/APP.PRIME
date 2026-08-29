import { Search } from 'lucide-react';
import heroBannerAsset from '@/assets/desktop-hero-banner.webp'; 
const heroBanner = heroBannerAsset;

interface Props {
  typingHint?: string;
  onSearchClick?: () => void;
}

const DesktopBibliotecaHero = ({ typingHint = 'Procurar por autor, livro ou coleção...', onSearchClick }: Props) => {
  return (
    <div className="relative w-full overflow-hidden" style={{ minHeight: '260px' }}>
      <img
        src={heroBanner}
        alt="Biblioteca Prime"
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
                Biblioteca Jurídica
              </h2>
              <p className="text-muted-foreground text-base xl:text-lg font-body leading-relaxed max-w-2xl">
                O seu acervo definitivo de obras, guias práticos, clássicos do Direito e coleções de desenvolvimento profissional.
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
              <span className="text-primary">★</span> +2.000 livros em acervo permanente
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DesktopBibliotecaHero;
