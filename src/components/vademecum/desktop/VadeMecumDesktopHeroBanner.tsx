import { Search, Heart, NotebookPen, Radar, History, LayoutGrid, Scale, ChevronRight, Bookmark, Bell, BookA } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import heroBannerAsset from '@/assets/covers/vademecum-judge.webp';
import HeroMotifs from '@/components/vademecum/home/HeroMotifs';
import primeLogoAsset from '@/assets/logo-direitoprime-v2.png.asset.json';
import primeLogoBundled from '@/assets/bundled/logo-direitoprime-v2.webp';
import { pickAsset, srcOf } from '@/lib/assetUrl';

const primeLogo = pickAsset(primeLogoBundled, srcOf(primeLogoAsset));

interface Props {
  typingHint?: string;
  onSearchClick?: () => void;
  onNotifClick?: () => void;
  unreadCount?: number;
}

const VadeMecumDesktopHeroBanner = ({ typingHint = 'Buscar lei...', onSearchClick, onNotifClick, unreadCount = 0 }: Props) => {
  const navigate = useNavigate();

  return (
    <div className="relative w-full max-w-[1600px] mx-auto z-20 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 h-[380px]">
      {/* COLUNA ESQUERDA: CAPA PRINCIPAL */}
      <div className="relative h-full rounded-3xl overflow-hidden shadow-2xl flex flex-col group">
        {/* Imagem de Fundo */}
        <img
          src={heroBannerAsset}
          alt="Estudos Jurídicos - Capa"
          className="absolute inset-0 w-full h-full object-cover object-[25%_center] z-0 pointer-events-none transition-transform duration-700 group-hover:scale-105"
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
            style={{ clipPath: 'polygon(0 0, 55% 0, 35% 100%, 0% 100%)' }}
          >
            <div className="absolute inset-0 bg-hero-panel" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,180,180,0.22),transparent_60%)]" />
            <HeroMotifs />
            
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }} />
          </div>
        </div>

        {/* HEADER INTERNO (Logo + Título + Notificações) */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-6 pointer-events-none">
          <div className="flex items-center gap-3 shrink-0 pointer-events-auto">
            <div className="relative w-16 h-16">
              <img src={primeLogo} alt="Estudos Jurídicos" className="w-full h-full object-contain drop-shadow-md" />
            </div>
            <div className="flex flex-col items-start leading-none justify-center mt-1">
              <span className="font-serif italic text-3xl font-bold text-white tracking-tight drop-shadow-sm">
                Estudos Jurídicos
              </span>
              <span className="font-body text-[10px] uppercase tracking-[0.24em] text-white/80 mt-1.5 pl-1">
                Uso Profissional
              </span>
            </div>
          </div>

          <button
            onClick={onNotifClick}
            className="relative shrink-0 w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md border border-white/25 hover:bg-white/20 hover:border-white/40 flex items-center justify-center transition-colors pointer-events-auto group/notif shadow-lg"
            aria-label="Notificações"
          >
            <Bell className="w-5 h-5 text-white drop-shadow-md group-hover/notif:scale-110 transition-transform" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-[#1E1E22] shadow-sm animate-pulse-slow">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* CONTEÚDO ESQUERDA */}
        <div className="absolute inset-0 z-10 flex flex-col pt-24 pb-6 px-8 pointer-events-none">
          <div className="w-[55%] h-full flex flex-col justify-end ml-auto pointer-events-auto">
            <h2 className="text-4xl font-display font-extrabold text-white mb-6 drop-shadow-md uppercase tracking-tight">
              O QUE VOCÊ QUER PESQUISAR HOJE?
            </h2>
            
            {/* Barra de Pesquisa Estilo Mobile */}
            <button 
              onClick={onSearchClick}
              className="w-full h-14 bg-background/80 backdrop-blur-md rounded-2xl flex items-center px-4 gap-3 shadow-lg border border-border/50 hover:bg-background/90 transition-colors mb-8 group"
            >
              <Search className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-muted-foreground font-body text-sm text-left flex-1">{typingHint}</span>
            </button>

            {/* 4 Botões Rápidos */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Favoritos', icon: Heart, route: '/vade-mecum/favoritos' },
                { label: 'Anotações', icon: NotebookPen, route: '/vade-mecum/anotacoes' },
                { label: 'Radares', icon: Radar, route: '/radares' },
                { label: 'Histórico', icon: History, route: '/vade-mecum/recentes' }
              ].map((btn, i) => (
                <button
                  key={i}
                  onClick={() => btn.route === '/vade-mecum/anotacoes' ? null : navigate(btn.route)}
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
      <div className="bg-hero-panel rounded-3xl relative z-20 flex flex-col p-6 shadow-2xl overflow-hidden border border-white/10 h-full">
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
              { label: 'Dicionário Jurídico', icon: BookA, route: '/ferramentas/dicionario' },
              { label: 'Constituição & Códigos', icon: LayoutGrid, route: '/vade-mecum/categorias' },
              { label: 'Áreas do Direito', icon: Scale, route: '/vade-mecum/areas' },
              { label: 'Meus Favoritos', icon: Bookmark, route: '/vade-mecum/favoritos' },
              { label: 'Acessados Recentemente', icon: History, route: '/vade-mecum/recentes' }
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

export default VadeMecumDesktopHeroBanner;

