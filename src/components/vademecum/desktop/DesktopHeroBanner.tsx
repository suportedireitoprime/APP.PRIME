import { Search, GraduationCap, Layers, HelpCircle, Sparkles, Book, Library, FileText, MonitorPlay, Headphones, ChevronRight, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import heroBannerAsset from '@/assets/desktop-hero-banner.jpg';
import HeroMotifs from '@/components/vademecum/home/HeroMotifs';

interface Props {
  typingHint?: string;
  onSearchClick?: () => void;
}

const DesktopHeroBanner = ({ typingHint = 'Buscar lei...', onSearchClick }: Props) => {
  const navigate = useNavigate();

  return (
    <div className="relative w-full max-w-[1600px] mx-auto z-20 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
      {/* COLUNA ESQUERDA: CAPA PRINCIPAL */}
      <div className="relative min-h-[380px] rounded-3xl overflow-hidden shadow-2xl bg-[#050505] flex flex-col justify-end group">
        {/* Imagem de Fundo */}
        <img
          src={heroBannerAsset}
          alt="Estudos Jurídicos - Capa"
          className="absolute inset-0 w-full h-full object-cover object-right z-0 pointer-events-none transition-transform duration-700 group-hover:scale-105"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />

        {/* Overlay vermelho com recorte poligonal cobrindo parte da esquerda */}
        <div 
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{ filter: 'drop-shadow(25px 0 25px rgba(0,0,0,0.8)) drop-shadow(8px 0 10px rgba(0,0,0,0.95))' }}
        >
          <div 
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: 'polygon(0 0, 70% 0, 50% 100%, 0% 100%)' }}
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

        {/* CONTEÚDO ESQUERDA */}
        <div className="relative z-10 w-full h-full p-10 flex flex-col justify-end pointer-events-none">
          <div className="max-w-xl w-full pointer-events-auto">
            <h2 className="text-3xl font-display font-bold text-white mb-6 drop-shadow-md">O que você quer estudar hoje?</h2>
            
            {/* Barra de Pesquisa Estilo Mobile */}
            <button 
              onClick={onSearchClick}
              className="w-full h-14 bg-background/80 backdrop-blur-md rounded-2xl flex items-center px-4 gap-3 shadow-lg border border-border/50 hover:bg-background/90 transition-colors mb-8 group"
            >
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <Search className="w-4 h-4 text-primary" />
              </div>
              <span className="text-muted-foreground font-body text-sm text-left flex-1">{typingHint}</span>
            </button>

            {/* 4 Botões Rápidos */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Aprender', icon: GraduationCap, route: '/aprender' },
                { label: 'Flashcards', icon: Layers, route: '/flashcards' },
                { label: 'Questões', icon: HelpCircle, route: '/questoes' },
                { label: 'Me Explique', icon: Sparkles, route: '/assistente-horus' }
              ].map((btn, i) => (
                <button
                  key={i}
                  onClick={() => navigate(btn.route)}
                  className="flex flex-col items-center justify-center gap-2 bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/10 rounded-2xl p-4 transition-all hover:scale-105 group/btn shadow-lg"
                >
                  <btn.icon className="w-7 h-7 text-white/90 group-hover/btn:text-white transition-colors drop-shadow-md" />
                  <span className="text-white text-xs font-semibold font-body tracking-wide drop-shadow-md">{btn.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* COLUNA DIREITA: ACESSO RÁPIDO */}
      <div className="bg-hero-panel rounded-3xl relative z-20 flex flex-col p-6 shadow-2xl overflow-hidden border border-white/10">
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />
        
        <div className="relative z-10 flex-1 flex flex-col">
          <h3 className="text-white font-display font-bold text-base mb-6 flex items-center gap-2 opacity-95">
            <span className="w-1 h-4 bg-white rounded-full"></span>
            ACESSO RÁPIDO
          </h3>

          <div className="flex flex-col gap-0 border-y border-white/10 divide-y divide-white/10 mt-2">
            {[
              { label: 'Vade Mecum', icon: Book, route: '/vade-mecum' },
              { label: 'Biblioteca', icon: Library, route: '/bibliotecas' },
              { label: 'Resumos', icon: FileText, route: '/aprender/resumos' },
              { label: 'Videoaulas', icon: MonitorPlay, route: '/aprender/videos' },
              { label: 'Audioaulas', icon: Headphones, route: '/aprender/audios' },
              { label: 'Chat (Hórus)', icon: MessageSquare, route: '/assistente-horus' }
            ].map((link, i) => (
              <button
                key={i}
                onClick={() => navigate(link.route)}
                className="w-full flex items-center gap-4 px-3 py-4 hover:bg-white/10 transition-colors text-white font-body group"
              >
                <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center shrink-0 group-hover:bg-black/30 transition-colors border border-white/5 shadow-inner">
                  <link.icon className="w-5 h-5 text-white/90 group-hover:text-white" />
                </div>
                <span className="font-semibold tracking-wide text-[15px] drop-shadow-sm flex-1 text-left opacity-95 group-hover:opacity-100 transition-opacity">{link.label}</span>
                <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/80 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopHeroBanner;

