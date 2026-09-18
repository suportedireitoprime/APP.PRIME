import { Search } from 'lucide-react';
import heroBannerAsset from '@/assets/desktop-hero-banner.jpg'; // Using the newly uploaded image
import HeroMotifs from '@/components/vademecum/home/HeroMotifs';

interface Props {
  typingHint?: string;
  onSearchClick?: () => void;
}

const DesktopHeroBanner = ({ typingHint = 'Buscar lei...', onSearchClick }: Props) => {
  return (
    <div 
      className="relative w-full overflow-hidden bg-hero-panel shadow-2xl shadow-black/60 z-20 flex flex-col justify-end pb-8" 
      style={{ 
        minHeight: '380px', // Reduzido já que removemos o texto grande
        backgroundColor: '#050505',
        transform: 'translateZ(0)'
      }}
    >
      {/* Imagem de Capa (fundo) */}
      <img
        src={heroBannerAsset}
        alt="Estudos Jurídicos - Capa"
        className="absolute inset-0 w-full h-full object-cover object-center z-0 pointer-events-none"
        loading="eager"
        decoding="async"
        fetchPriority="high"
      />

      {/* Overlay vermelho com recorte poligonal */}
      <div 
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{ filter: 'drop-shadow(25px 0 25px rgba(0,0,0,0.8)) drop-shadow(8px 0 10px rgba(0,0,0,0.95))' }}
      >
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: 'polygon(0 0, 55% 0, 42% 100%, 0% 100%)' }}
        >
          <div className="absolute inset-0 bg-hero-panel" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,180,180,0.22),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.5),transparent_65%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <HeroMotifs />
          
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }} />
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/20 to-transparent z-[1] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent z-[1] pointer-events-none" />

      {/* Conteúdo Central */}
      <div className="relative z-10 flex flex-col justify-end h-full px-12 xl:px-20 2xl:px-28 w-full pt-[184px]">
        <div className="flex w-full items-end justify-between gap-12 max-w-[1600px] mx-auto">
          
          <div className="flex-1 max-w-[650px] space-y-4 pt-10 pb-4">
            {/* Search bar inside the red panel area */}
            <button
              onClick={onSearchClick}
              className="group relative w-full flex items-center h-[48px] pl-5 pr-28 rounded-2xl bg-[#1a0a0d]/90 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] shadow-primary/20 hover:border-primary/50 transition-colors text-left"
            >
              <Search className="w-4 h-4 text-white/50 shrink-0 mr-3 group-hover:text-primary transition-colors" />
              <span className="text-white/70 text-sm font-body truncate">
                {typingHint}
                <span className="animate-pulse text-primary">|</span>
              </span>
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 px-4 rounded-xl bg-primary text-white font-display font-bold text-xs flex items-center gap-2 shadow-lg shadow-primary/40 group-hover:bg-[#ff3344] transition-colors">
                Pesquisar
              </span>
            </button>
            
            <p className="text-white/50 text-xs font-body flex items-center gap-2">
              <span className="text-primary text-[10px]">★</span> +10.000 alunos já estudam com a gente
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopHeroBanner;

