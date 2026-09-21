import { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Scale, Gavel, BookOpen, Landmark, Feather, ScrollText, Bird } from 'lucide-react';
import primeLogoAsset from '@/assets/logo-direitoprime-v2.png.asset.json';
import primeLogoBundled from '@/assets/bundled/logo-direitoprime-v2.webp';
import { pickAsset, srcOf } from '@/lib/assetUrl';

const primeLogo = pickAsset(primeLogoBundled, srcOf(primeLogoAsset));
import NotificationsSheet, { useUnreadNotifCount } from '@/components/vademecum/outros/NotificationsSheet';
import DesktopToolsMenu from '@/components/vademecum/desktop/DesktopToolsMenu';

// Ícones decorativos flutuando ao fundo — bem discretos, low-opacity.
const BACKDROP_ICONS = [
  { Icon: Scale,     top: '18%', left: '6%',  size: 42, rot: -12 },
  { Icon: Gavel,     top: '58%', left: '14%', size: 34, rot: 8 },
  { Icon: BookOpen,  top: '22%', left: '32%', size: 30, rot: 4 },
  { Icon: Landmark,  top: '62%', left: '46%', size: 44, rot: -6 },
  { Icon: Feather,   top: '20%', left: '62%', size: 28, rot: 14 },
  { Icon: ScrollText,top: '60%', left: '74%', size: 34, rot: -10 },
  { Icon: Scale,     top: '28%', left: '88%', size: 36, rot: 10 },
];

interface Props {
  onSearchClick?: () => void;
  onAssistenteClick?: () => void;
  isTransparent?: boolean;
}

const DesktopTopHeader = memo(({ onAssistenteClick, isTransparent }: Props) => {
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = useUnreadNotifCount();

  return (
    <div className={`w-full overflow-hidden ${isTransparent ? 'bg-transparent border-none' : 'border-b border-primary/30'}`} style={{ height: 104 }}>
      {!isTransparent && (
        <>
          {/* Degradê amarelo subindo do rodapé */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/35 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-transparent pointer-events-none" />
        </>
      )}

      {/* Elementos jurídicos decorativos */}
      {!isTransparent && (
        <div className="absolute inset-0 pointer-events-none">
          {BACKDROP_ICONS.map(({ Icon, top, left, size, rot }, i) => (
            <div
              key={i}
              className="absolute text-primary-foreground/15"
              style={{ top, left, transform: `rotate(${rot}deg)` }}
            >
              <Icon size={size} strokeWidth={1.5} />
            </div>
          ))}
        </div>
      )}

      {/* Conteúdo */}
      <div className="relative z-10 h-full w-full px-8 xl:px-14 flex items-center gap-6">
        {/* Logo + wordmark */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 shrink-0 group"
        >
          <div className="relative w-14 h-14">
            <img src={primeLogo} alt="Estudos Jurídicos" className="w-full h-full object-contain drop-shadow-md" />
          </div>
          <div className="flex flex-col items-start leading-none justify-center mt-1">
            <span className="font-serif italic text-3xl font-bold text-white tracking-tight drop-shadow-sm">
              Estudos Jurídicos
            </span>
            <span className="font-body text-[10px] uppercase tracking-[0.24em] text-white/80 mt-1 pl-1">
              Uso Profissional
            </span>
          </div>
        </button>

        {/* Espaço flexível */}
        <div className="flex-1" />

        {/* Todas as funções */}
        <DesktopToolsMenu />

        {/* Assistente Horus */}
        <button
          onClick={() => onAssistenteClick ? onAssistenteClick() : navigate('/assistente-horus')}
          className="relative shrink-0 w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md border border-white/25 hover:bg-white/20 hover:border-white/40 flex items-center justify-center transition-colors group"
          aria-label="Assistente Horus"
          title="Assistente Horus"
        >
          <Bird className="w-5 h-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] group-hover:scale-110 transition-transform" />
        </button>


        {/* Botão de notificações */}
        <button
          onClick={() => setNotifOpen(true)}
          className="relative shrink-0 w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md border border-white/25 hover:bg-white/20 hover:border-white/40 flex items-center justify-center transition-colors group"
          aria-label={unreadCount > 0 ? `Notificações (${unreadCount} novas)` : 'Notificações'}
        >
          <Bell className="w-5 h-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] group-hover:scale-110 transition-transform" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-white text-primary text-[10px] font-black flex items-center justify-center border-2 border-white/70 shadow-lg"
              aria-hidden
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      <NotificationsSheet open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
});

export default DesktopTopHeader;
