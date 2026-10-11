import { useState, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, BellRing, BookOpen, Layers, Library } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import HeroMotifs from '@/components/vademecum/home/HeroMotifs';
import NotificationsSheet, { useUnreadNotifCount } from '@/components/vademecum/outros/NotificationsSheet';
import resumosHeroImg from '@/assets/covers/resumos-philosophers-hero.webp';

interface Props {
  totalResumos?: number;
  totalAreas?: number;
  totalTemas?: number;
}

const ResumosHero = ({
  totalResumos = 4694,
  totalAreas = 30,
  totalTemas = 531,
}: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = useUnreadNotifCount();
  const isMapas = location.pathname.startsWith('/mapas-mentais') || location.pathname.startsWith('/visuais') || location.pathname.startsWith('/mapas');

  return (
    <>
      {/* Shell sólido, opaco e com blindagem contra culling e overscroll idêntico à Home */}
      <div
        className="bg-hero-panel relative overflow-hidden rounded-b-[36px] shadow-2xl shadow-black/60 pt-[var(--sai-top,env(safe-area-inset-top,0px))] flex flex-col z-20"
        style={{
          transform: 'translateZ(0)',
          backgroundColor: '#050505',
        }}
      >
        {/* Blindagem de overscroll superior contra vazamento do fundo */}
        <div
          className="pointer-events-none absolute -top-[1200px] left-0 right-0 h-[1200px] z-0"
          style={{ backgroundColor: '#050505' }}
          aria-hidden="true"
        />

        {/* Imagem de Fundo dos 5 Grandes Filósofos do Direito de Épocas Distintas */}
        <img
          src={resumosHeroImg}
          alt="Filósofos do Direito: Aristóteles, Cícero, Tomás de Aquino, Montesquieu e Kant"
          aria-hidden="true"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover object-[62%_center] md:object-center z-0 pointer-events-none translate-x-[4%] md:translate-x-0"
        />

        {/* Overlay vermelho com gradiente estilo menu e sombra (drop-shadow real na divisória diagonal) */}
        <div 
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{ filter: 'drop-shadow(25px 0 25px rgba(0,0,0,0.8)) drop-shadow(8px 0 10px rgba(0,0,0,0.95))' }}
        >
          <div 
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: 'polygon(0 0, 47% 0, 36% 100%, 0% 100%)' }}
          >
            <div className="absolute inset-0 bg-hero-panel" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,180,180,0.22),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.5),transparent_65%)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

            {/* Motivos clássicos do Direito com máscara elegante */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                WebkitMaskImage: 'linear-gradient(to right, transparent 20%, black 46%)',
                maskImage: 'linear-gradient(to right, transparent 20%, black 46%)'
              }}
            >
              <HeroMotifs />
            </div>

            {/* Grid Pattern Background */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }} />
          </div>
        </div>

        {/* Botões do Topo: Voltar à esquerda e Notificações à direita */}
        <header className="absolute top-0 right-0 left-0 z-20 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] md:pt-[calc(1rem+var(--sai-top,env(safe-area-inset-top,0px)))] pointer-events-none">
          <div className="pointer-events-auto px-4 pb-2 pt-2 flex items-center justify-between">
            <button
              onClick={() => { haptic.selection(); navigate('/'); }}
              aria-label="Voltar para tela inicial"
              className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:opacity-70 cursor-pointer"
            >
              <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
            </button>

            <button 
              onClick={() => { 
                haptic.selection(); 
                setNotifOpen(true);
              }} 
              aria-label={`Notificações e novidades${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
              className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:opacity-70 relative cursor-pointer"
            >
              <BellRing className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none flex items-center justify-center border border-neutral-900 shadow">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Conteúdo: Título refinado sem o logo solicitado */}
        <div className="relative z-10 pt-16 sm:pt-20 flex-1 flex flex-col justify-start min-h-[135px]">
          <div className="flex flex-col items-center text-center gap-1 z-[10] relative w-[44%] max-w-[175px] ml-2 sm:ml-4">
            <h1 className="font-serif italic text-white text-[20px] sm:text-[23px] leading-[1.08] font-bold tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
              {isMapas ? 'Mapas Mentais' : 'Resumos Jurídicos'}
            </h1>
            <p className="font-body text-white/95 text-[9px] sm:text-[10px] font-bold tracking-[0.25em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-1.5">
              {isMapas ? 'INFOGRÁFICOS VISUAIS' : 'ESTRUTURADOS & PRECISOS'}
            </p>
            
            <div className="mt-3.5 flex items-center text-left gap-2 w-full justify-center">
              <div className="w-[2px] h-7 bg-white/40 rounded-full shrink-0" />
              <p className="font-serif italic text-white/85 text-[11px] sm:text-[12px] leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                Domine os conceitos,<br/>fixe o essencial.
              </p>
            </div>
          </div>
        </div>

        {/* Estatísticas no padrão de cartões integrados do app */}
        <div className="relative z-10 px-3 sm:px-5 pt-3 pb-5">
          <div className="flex items-center justify-between gap-2 mx-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl p-2 shadow-2xl">
            {/* Box 1: Total Resumos */}
            <div className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-[14px] hover:bg-white/5 active:bg-white/10 transition-all duration-200 select-none text-center">
              <div className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-white/60">
                  Resumos
                </span>
              </div>
              <span className="mt-1 font-display text-[15px] sm:text-[17px] font-black leading-none text-white [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]">
                {totalResumos.toLocaleString('pt-BR')}
              </span>
            </div>

            <div className="w-px h-8 bg-white/10" />

            {/* Box 2: Total Áreas */}
            <div className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-[14px] hover:bg-white/5 active:bg-white/10 transition-all duration-200 select-none text-center">
              <div className="flex items-center gap-1">
                <Library className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-white/60">
                  Áreas
                </span>
              </div>
              <span className="mt-1 font-display text-[15px] sm:text-[17px] font-black leading-none text-white [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]">
                {totalAreas.toLocaleString('pt-BR')}
              </span>
            </div>

            <div className="w-px h-8 bg-white/10" />

            {/* Box 3: Total Temas */}
            <div className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-[14px] hover:bg-white/5 active:bg-white/10 transition-all duration-200 select-none text-center">
              <div className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-white/60">
                  Temas
                </span>
              </div>
              <span className="mt-1 font-display text-[15px] sm:text-[17px] font-black leading-none text-white [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]">
                {totalTemas.toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {notifOpen && (
        <NotificationsSheet 
          open={notifOpen} 
          onClose={() => setNotifOpen(false)} 
        />
      )}
    </>
  );
};

export default memo(ResumosHero);
