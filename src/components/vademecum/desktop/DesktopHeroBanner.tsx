import { Sparkles, MessageSquare, Layers, HelpCircle, GraduationCap, Bell, Search, Book, Library, FileText, MonitorPlay, Headphones, ChevronRight, Bot, ListChecks, BookA } from 'lucide-react';
import { FlashcardsIcon } from '@/components/icons/FlashcardsIcon';
import { AprenderDeckStacked, useAprenderItems } from '@/components/vademecum/home/aprender/chunks';
import { useNavigate } from 'react-router-dom';
import heroBannerAsset from '@/assets/desktop-hero-banner.jpg';
import primeLogoAsset from '@/assets/logo-direitoprime-v2.webp.asset.json';
import primeLogoBundled from '@/assets/bundled/logo-direitoprime-v2.webp';
import { pickAsset, srcOf } from '@/lib/assetUrl';
import HeroMotifs from '@/components/vademecum/home/HeroMotifs';

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
    <div className="relative w-full mx-auto z-20 grid grid-cols-1 lg:grid-cols-[1fr_310px] xl:grid-cols-[1fr_340px] gap-6">
      {/* COLUNA ESQUERDA: CAPA PRINCIPAL (HERO) */}
      <div className="relative h-[380px] rounded-3xl overflow-hidden shadow-2xl flex flex-col group bg-zinc-950 border border-white/10">
        {/* Imagem de Fundo (A CAPA) */}
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
          style={{ filter: 'drop-shadow(20px 0 25px rgba(0,0,0,0.85))' }}
        >
          <div 
            className="absolute inset-0 overflow-hidden"
            style={{ 
              clipPath: 'polygon(0 0, 52% 0, 36% 100%, 0% 100%)',
              WebkitClipPath: 'polygon(0 0, 52% 0, 36% 100%, 0% 100%)',
            }}
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

        {/* CARROSSEL DE DECKS DO APRENDER NO LADO ESQUERDO DO PAINEL */}
        <div className="absolute bottom-5 left-5 xl:left-8 pointer-events-auto z-20 flex flex-col items-center w-[250px] xl:w-[280px]">
          <div className="transform scale-[0.74] xl:scale-[0.82] origin-bottom w-full pb-2 flex justify-center">
            <AprenderDeckStacked items={items} onItemClick={handleItemClick} />
          </div>
          <button 
            onClick={() => navigate('/aprender')} 
            className="relative flex items-center justify-center gap-2 font-display text-white text-[13px] font-bold uppercase tracking-widest py-2.5 w-[85%] mx-auto rounded-xl bg-red-900/80 hover:bg-red-950/90 transition-all border border-red-700/50 overflow-hidden group shadow-[0_8px_30px_rgba(153,27,27,0.3)]"
          >
            <span className="relative z-10">Acessar</span>
            <ChevronRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform relative z-10" />
            <div className="absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer" />
          </button>
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
        <div className="absolute inset-0 z-10 flex flex-col pt-20 pb-6 px-8 pointer-events-none">
          {/* LADO DIREITO: Busca e Botões Rápidos */}
          <div className="w-full max-w-[440px] h-full flex flex-col justify-end ml-auto pointer-events-auto pb-1">
            <h2 className="text-[28px] xl:text-[34px] 2xl:text-4xl text-right font-display font-extrabold text-white mb-5 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] uppercase tracking-tight leading-tight">
              O QUE VOCÊ QUER ESTUDAR HOJE?
            </h2>
            
            <button 
              onClick={onSearchClick}
              className="w-full h-14 bg-background/90 backdrop-blur-md rounded-2xl flex items-center px-4 gap-3 shadow-2xl border border-border/50 hover:bg-background transition-colors mb-5 group"
            >
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <Search className="w-4 h-4 text-primary" />
              </div>
              <span className="text-muted-foreground font-body text-sm text-left flex-1">{typingHint}</span>
            </button>

            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Aprender', icon: GraduationCap, route: '/aprender', color: '#FACC15' },
                { label: 'Flashcards', icon: FlashcardsIcon, route: '/flashcards', color: '#34D399' },
                { label: 'Questões', icon: ListChecks, route: '/questoes', color: '#F87171' },
                { label: 'Chat Jurídico', icon: MessageSquare, route: '/chat-juridico', color: '#F97316' }
              ].map((btn, i) => (
                <button
                  key={i}
                  onClick={() => navigate(btn.route)}
                  className="flex flex-col items-center justify-center gap-2 bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl p-3 transition-all hover:scale-105 group/btn shadow-xl"
                >
                  <btn.icon style={{ color: btn.color }} className="w-6 h-6 transition-colors drop-shadow-md brightness-90 group-hover/btn:brightness-110" />
                  <span className="text-white text-[11px] font-semibold font-body tracking-wide drop-shadow-md">{btn.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* COLUNA DIREITA: ACESSO RÁPIDO */}
      <div className="bg-hero-panel rounded-3xl relative z-20 flex flex-col p-6 shadow-2xl overflow-hidden border border-white/10 h-[380px]">
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />
        
        <div className="relative z-10 flex-1 flex flex-col justify-between">
          <h3 className="text-white font-display font-bold text-base mb-2 flex items-center gap-2 opacity-95">
            <span className="w-1 h-4 bg-white rounded-full"></span>
            ACESSO RÁPIDO
          </h3>

          <div className="flex flex-col divide-y divide-white/10">
            {[
              { label: 'Vade Mecum', icon: Book, route: '/vade-mecum' },
              { label: 'Biblioteca', icon: Library, route: '/bibliotecas' },
              { label: 'Dicionário', icon: BookA, route: '/ferramentas/dicionario' },
              { label: 'Resumos', icon: FileText, route: '/resumos-juridicos' },
              { label: 'Videoaulas', icon: MonitorPlay, route: '/videoaulas/painel' },
              { label: 'Audioaulas', icon: Headphones, route: '/audioaulas' }
            ].map((link, i) => (
              <button
                key={i}
                onClick={() => navigate(link.route)}
                className="w-full flex items-center gap-3.5 px-2.5 py-2.5 hover:bg-white/10 rounded-xl transition-colors text-white font-body group"
              >
                <div className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center shrink-0 group-hover:bg-black/30 transition-colors border border-white/5 shadow-inner">
                  <link.icon className="w-4 h-4 text-white/90 group-hover:text-white" />
                </div>
                <span className="font-semibold tracking-wide text-[14px] drop-shadow-sm flex-1 text-left opacity-95 group-hover:opacity-100 transition-opacity">{link.label}</span>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/80 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopHeroBanner;
