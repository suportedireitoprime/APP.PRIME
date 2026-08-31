import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HardDrive, BookMarked, Heart, Route as RouteIcon, FileUp } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { abrirAtalhoBiblioteca } from './BibliotecaBottomNav';
import socratesImg from '@/assets/filosofos/socrates.jpg';

interface Props {
  onBuscar?: () => void;
  children?: React.ReactNode;
}

const BibliotecaHero = ({ children }: Props) => {
  const navigate = useNavigate();

  const ACTIONS = [
    { id: 'leitura' as const, label: 'Leitura', icon: BookMarked },
    { id: 'trilhas' as const, label: 'Trilhas', icon: RouteIcon },
    { id: 'favoritos' as const, label: 'Favoritos', icon: Heart },
    { id: 'personalizado' as const, label: 'Meus PDFs', icon: FileUp },
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
      className="relative overflow-hidden rounded-b-[36px] border-b border-amber-950/40 shadow-2xl shadow-black/60 pt-[var(--sai-top)] flex flex-col z-20"
      style={{
        background:
          'linear-gradient(135deg, hsl(28 35% 22%) 0%, hsl(24 40% 30%) 50%, hsl(20 45% 18%) 100%)',
        transform: 'translateZ(0)',
        isolation: 'isolate',
        contain: 'paint',
      }}
    >
      {/* Texturas */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,220,180,0.18),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.45),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

      {/* Ornamentos SVG */}
      <svg
        aria-hidden
        viewBox="0 0 200 200"
        className="pointer-events-none absolute -left-3 -top-2 w-16 h-16 text-amber-300/25"
      >
        <g fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="30" y="140" width="140" height="24" rx="3" />
          <rect x="45" y="112" width="120" height="24" rx="3" />
          <rect x="35" y="84" width="130" height="24" rx="3" />
        </g>
      </svg>
      <svg
        aria-hidden
        viewBox="0 0 200 200"
        className="pointer-events-none absolute right-2 top-3 w-14 h-14 text-amber-300/20"
      >
        <g fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="30" y="40" width="90" height="30" rx="4" transform="rotate(-25 75 55)" />
          <line x1="95" y1="95" x2="160" y2="160" />
          <rect x="120" y="150" width="60" height="14" rx="3" />
        </g>
      </svg>

      {/* Header — Voltar + Offline */}
      <div className="px-4 pb-2 pt-2 flex items-center justify-between relative z-30">
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

      {/* Silhueta Sócrates no fundo */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[48%] select-none overflow-hidden">
        <img
          src={socratesImg}
          alt=""
          loading="eager"
          decoding="sync"
          fetchPriority="high"
          className="absolute -right-4 bottom-0 h-[105%] w-auto object-contain object-bottom opacity-[0.35] drop-shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
        />
      </div>

      {/* Gradiente legibilidade */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[hsl(20,45%,18%)] via-[hsl(20,45%,18%)]/60 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

      {/* Conteúdo */}
      <div className="relative px-4 pt-1 pb-5 flex flex-col gap-4">
        {/* Brand */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="relative h-20 mb-1 flex items-center justify-center">
            <img
              src={socratesImg}
              alt="Sócrates"
              loading="eager"
              decoding="sync"
              className="w-auto h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)] rounded-full"
            />
          </div>
          <h1 className="font-serif italic text-white text-[24px] leading-[1.05] font-semibold tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
            Biblioteca
          </h1>
          <p className="font-body text-amber-200/85 text-[12.5px] font-medium tracking-wide uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
            Acervo Jurídico
          </p>
        </div>

        {/* 4 Botões de Ação Rápida */}
        <div className="grid grid-cols-4 gap-2 mx-1 mt-1">
          {ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.id}
                onClick={() => handleAction(a.id)}
                className="group flex flex-col items-center justify-center py-3 px-1 rounded-2xl bg-black/45 backdrop-blur-md border border-white/10 shadow-xl hover:bg-black/60 transition-all active:scale-95 gap-2 text-center"
              >
                <Icon className="w-5 h-5 text-white/70 group-hover:text-white group-hover:scale-110 transition-all" strokeWidth={2} />
                <span className="text-[9px] font-extrabold text-white/90 leading-tight uppercase tracking-wider">{a.label}</span>
              </button>
            );
          })}
        </div>

        {/* Slot para busca ou conteúdo extra */}
        {children && <div className="relative mt-2">{children}</div>}
      </div>
    </div>
  );
};

export default BibliotecaHero;
