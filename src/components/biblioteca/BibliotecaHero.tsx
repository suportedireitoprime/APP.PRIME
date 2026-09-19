import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HardDrive, BookMarked, Heart, Route as RouteIcon, FileUp } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { abrirAtalhoBiblioteca } from './BibliotecaBottomNav';
import HeroMotifs from '@/components/vademecum/home/HeroMotifs';
import heroEstudanteImg from '@/assets/covers/hero-estudante-v3.jpg';

interface Props {
  onBuscar?: () => void;
  children?: React.ReactNode;
}

const BibliotecaHero = ({ children }: Props) => {
  const navigate = useNavigate();

  const ACTIONS = [
    { id: 'leitura' as const, label: 'Leitura', icon: BookMarked, color: '#818cf8' },
    { id: 'trilhas' as const, label: 'Trilhas', icon: RouteIcon, color: '#34d399' },
    { id: 'favoritos' as const, label: 'Favoritos', icon: Heart, color: '#fb7185' },
    { id: 'personalizado' as const, label: 'Meus PDFs', icon: FileUp, color: '#fbbf24' },
  ];

  const handleAction = (id: typeof ACTIONS[number]['id']) => {
    haptic.selection();
    if (id === 'trilhas') {
      navigate('/bibliotecas/trilhas');
      return;
    }
    abrirAtalhoBiblioteca(id);
  };

  return (
    <div
      className="bg-hero-panel relative overflow-hidden rounded-b-[36px] shadow-2xl shadow-black/60 pt-[var(--sai-top)] flex flex-col z-20"
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

      {/* Imagem Fixa Genérica sem ser de filósofos */}
      <img
        src={heroEstudanteImg}
        alt=""
        aria-hidden="true"
        loading="eager"
        decoding="async"
        fetchPriority="high"
        className="absolute inset-0 w-full h-full object-cover object-[32%_center] md:object-center z-0 pointer-events-none translate-x-[12%] md:translate-x-[8%]"
      />

      {/* Overlay vermelho com gradiente estilo menu e sombra */}
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

          <HeroMotifs />

          {/* Grid Pattern Background */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }} />
        </div>
      </div>

      {/* Botões do topo absolutos */}
      <header className="absolute top-0 right-0 left-0 z-30 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] pointer-events-none">
        <div className="pointer-events-auto px-4 pb-2 pt-2 flex items-center justify-between">
          <button
            onClick={() => { haptic.selection(); navigate('/'); }}
            aria-label="Voltar"
            className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:scale-95"
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
          </button>
          <button
            onClick={() => { haptic.selection(); navigate('/biblioteca-offline'); }}
            aria-label="Armazenamento Offline"
            className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:scale-95"
          >
            <HardDrive className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
          </button>
        </div>
      </header>

      {/* Conteúdo idêntico à altura da Home */}
      <div className="relative z-10 pt-8 sm:pt-10 flex-1 flex flex-col justify-start min-h-[100px]">
        <div className="flex flex-col items-center text-center gap-1 z-[10] relative w-[42%] max-w-[160px] ml-2 sm:ml-4">
          {/* Espaçador invisível para simular a altura da Logo e manter alinhamento vertical exato com a Home */}
          <div className="h-[75px] mb-1 w-full" />
          
          <h1 className="font-serif italic text-white text-[18px] sm:text-[20px] leading-[1.05] font-semibold tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] whitespace-nowrap">
            Biblioteca Jurídica
          </h1>
          <p className="font-body text-white/95 text-[9px] sm:text-[10px] font-bold tracking-[0.25em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-1">
            ACERVO COMPLETO
          </p>
          
          <div className="mt-3 flex items-center text-left gap-2 w-full justify-center">
            <div className="w-[2px] h-7 bg-white/40 rounded-full shrink-0" />
            <p className="font-serif italic text-white/80 text-[11px] sm:text-[12px] leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              Leis, códigos e<br/>trilhas de estudo.
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-3 sm:px-5 pt-2 pb-2">
        <div className="grid grid-cols-4 gap-2 mx-1 mt-1">
          {ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.id}
                onClick={() => handleAction(a.id)}
                className="group flex flex-col items-center justify-center py-3 px-1 rounded-2xl bg-black/45 backdrop-blur-md border border-white/10 shadow-xl hover:bg-black/60 transition-all active:scale-95 gap-2 text-center min-h-[48px] select-none cursor-pointer overflow-hidden"
              >
                <Icon className="w-5 h-5 shrink-0 transition-all group-hover:scale-110" style={{ color: a.color }} strokeWidth={2} />
                <span className="text-[9px] font-extrabold text-white/90 leading-tight uppercase tracking-wider">{a.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {children && (
        <div className="relative z-10 px-4 sm:px-6 w-full pb-5">
          {children}
        </div>
      )}
    </div>
  );
};

export default BibliotecaHero;
