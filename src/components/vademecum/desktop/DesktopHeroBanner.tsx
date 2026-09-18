import { Sparkles, MessageSquare, Layers, HelpCircle, GraduationCap, Bell, Search, Book, Library, FileText, MonitorPlay, Headphones, ChevronRight, Bot } from 'lucide-react';
import { AprenderCarousel3D, useAprenderItems } from '@/components/vademecum/home/aprender/chunks';
import { useNavigate } from 'react-router-dom';
import heroBannerAsset from '@/assets/desktop-hero-banner.jpg';
import primeLogoAsset from '@/assets/logo-direitoprime-v2.png.asset.json';
import primeLogoBundled from '@/assets/bundled/logo-direitoprime-v2.webp';
import { pickAsset, srcOf } from '@/lib/assetUrl';
import HeroMotifs from '@/components/vademecum/home/HeroMotifs';
import HomeNoticiasCarousel from '@/components/vademecum/home/HomeNoticiasCarousel';

const primeLogo = pickAsset(primeLogoBundled, srcOf(primeLogoAsset));

interface Props {
  typingHint?: string;
  onSearchClick?: () => void;
  onNotifClick?: () => void;
  unreadCount?: number;
}

const DesktopHeroBanner = ({ typingHint = 'Buscar lei...', onSearchClick, onNotifClick, unreadCount = 0 }: Props) => {
  const navigate = useNavigate();

  const { items, handleItemClick } = useAprenderItems();

  return (
    <div className="relative w-full max-w-[1600px] mx-auto z-20 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
      {/* COLUNA ESQUERDA: CAPA PRINCIPAL + CARROSSEL DE NOTÍCIAS */}
      <div className="flex flex-col gap-6">
        <div className="relative h-[380px] rounded-3xl overflow-hidden shadow-2xl flex flex-col group">
        {/* Imagem de Fundo */}
        <img
          src={heroBannerAsset}
          alt="Estudos Jurídicos - Capa"
          className="absolute inset-0 w-full h-full object-cover object-[70%_center] z-0 pointer-events-none transition-transform duration-700 group-hover:scale-105"
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
            
            {/* CARROSSEL DE DECKS DO APRENDER DENTRO DO PAINEL VERMELHO */}
            <div className="absolute bottom-6 left-8 pointer-events-auto z-20 flex flex-col items-center w-[300px]">
              <div className="transform scale-[0.8] origin-bottom w-full pb-2">
                <AprenderCarousel3D items={items} onItemClick={handleItemClick} />
              </div>
              <button onClick={() => navigate('/aprender')} className="relative flex items-center justify-center gap-2 font-display text-white text-[13px] font-bold uppercase tracking-widest py-2.5 w-full rounded-xl bg-red-900/80 hover:bg-red-950/90 transition-all border border-red-700/50 overflow-hidden group shadow-[0_8px_30px_rgba(153,27,27,0.3)]">
                <span className="relative z-10">Acessar</span>
                <ChevronRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform relative z-10" />
                <div className="absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer" />
              </button>
            </div>
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

        {/* CONTEÚDO (Logo, Busca e Botões) */}
        <div className="absolute inset-0 z-10 flex flex-col pt-24 pb-6 px-8 pointer-events-none">
          
          {/* LADO DIREITO: Busca e Botões Rápidos */}
          <div className="w-[55%] h-full flex flex-col justify-end ml-auto pointer-events-auto">
            <h2 className="text-[32px] 2xl:text-4xl text-right font-display font-extrabold text-white mb-6 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] uppercase tracking-tight">
              O QUE VOCÊ QUER ESTUDAR HOJE?
            </h2>
            
            <button 
              onClick={onSearchClick}
              className="w-full h-14 bg-background/90 backdrop-blur-md rounded-2xl flex items-center px-4 gap-3 shadow-2xl border border-border/50 hover:bg-background transition-colors mb-6 group"
            >
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <Search className="w-4 h-4 text-primary" />
              </div>
              <span className="text-muted-foreground font-body text-sm text-left flex-1">{typingHint}</span>
            </button>

            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Aprender', icon: GraduationCap, route: '/aprender' },
                { label: 'Flashcards', icon: Layers, route: '/flashcards' },
                { label: 'Questões', icon: HelpCircle, route: '/questoes' },
                { label: 'Chat Jurídico', icon: MessageSquare, route: '/chat-juridico' }
              ].map((btn, i) => (
                <button
                  key={i}
                  onClick={() => navigate(btn.route)}
                  className="flex flex-col items-center justify-center gap-2 bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl p-3 transition-all hover:scale-105 group/btn shadow-xl"
                >
                  <btn.icon className="w-6 h-6 text-white/90 group-hover/btn:text-white transition-colors drop-shadow-md" />
                  <span className="text-white text-[11px] font-semibold font-body tracking-wide drop-shadow-md">{btn.label}</span>
                </button>
              ))}
            </div>
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
              { label: 'Vade Mecum', icon: Book, route: '/vade-mecum' },
              { label: 'Biblioteca', icon: Library, route: '/bibliotecas' },
              { label: 'Resumos', icon: FileText, route: '/aprender/resumos' },
              { label: 'Videoaulas', icon: MonitorPlay, route: '/aprender/videos' },
              { label: 'Audioaulas', icon: Headphones, route: '/aprender/audios' },
              { label: 'Assistente Hórus', icon: Bot, route: '/assistente-horus' }
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

