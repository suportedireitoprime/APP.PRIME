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
      className="relative w-full overflow-hidden bg-hero-panel shadow-2xl shadow-black/60 z-20 flex flex-col justify-end pb-4" 
      style={{ 
        minHeight: '260px', // Reduzido conforme pedido
        backgroundColor: '#050505',
        transform: 'translateZ(0)'
      }}
    >
      {/* Imagem de Capa (fundo) */}
      <img
        src={heroBannerAsset}
        alt="Estudos Jurídicos - Capa"
        className="absolute inset-0 w-full h-full object-cover object-right z-0 pointer-events-none"
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
          style={{ clipPath: 'polygon(0 0, 36% 0, 24% 100%, 0% 100%)' }}
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

      {/* Conteúdo Central */}
      <div className="relative z-10 flex flex-col justify-end h-full px-12 xl:px-20 2xl:px-28 w-full pt-[184px]">
        <div className="flex w-full items-end justify-between gap-12 max-w-[1600px] mx-auto">
          
          <div className="flex-1 max-w-[650px] space-y-4 pt-10 pb-4">

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

