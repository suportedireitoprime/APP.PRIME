import { memo, useState } from 'react';
import { Bell, Menu as MenuIcon, User as UserIcon } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface HomeUserHeaderProps {
  nome: string;
  perfilLabel: string;
  avatarUrl?: string;
  iniciais: string;
  unreadCount: number;
  onOpenNotif: () => void;
  onOpenMenu: () => void;
}

const HomeUserHeader = ({
  nome,
  perfilLabel,
  avatarUrl,
  iniciais,
  unreadCount,
  onOpenNotif,
  onOpenMenu,
}: HomeUserHeaderProps) => {
  const [imgError, setImgError] = useState(false);

  const handleNotifClick = () => {
    if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    onOpenNotif();
  };

  const handleMenuClick = () => {
    if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    onOpenMenu();
  };

  return (
    <header className="relative px-3 pt-[calc(0.75rem+var(--sai-top))] md:px-6 md:pt-[calc(1.5rem+var(--sai-top,0px))] lg:px-8 lg:pt-8 flex items-center gap-2 md:gap-4">
      <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1 pr-3 pl-1">
        <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full overflow-hidden border-2 border-white bg-black/40 flex items-center justify-center shrink-0 shadow-lg shadow-black/50">
          {avatarUrl && !imgError ? (
            <img
              src={avatarUrl}
              alt={nome}
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : iniciais ? (
            <span className="font-display text-white text-[14px] md:text-[16px] lg:text-[18px] font-bold">{iniciais}</span>
          ) : (
            <UserIcon className="w-5 h-5 md:w-6 md:h-6 text-white/80" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-white text-[17px] md:text-[19px] lg:text-[21px] font-bold leading-[1.15] truncate drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
            {nome}
          </p>
          {perfilLabel && (
            <p className="font-body text-white/95 text-[13.5px] md:text-[15px] lg:text-[16px] font-medium leading-tight truncate mt-0.5 md:mt-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
              {perfilLabel}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <button
          onClick={handleNotifClick}
          aria-label={`Abrir notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
          className="relative w-11 h-11 md:w-12 md:h-12 lg:w-13 lg:h-13 rounded-full bg-neutral-900/85 border border-white/15 backdrop-blur-md shadow-lg shadow-black/40 flex items-center justify-center active:scale-95 transition"
        >
          <Bell className="w-5 h-5 md:w-[22px] md:h-[22px] text-white" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] md:min-w-[20px] md:h-[20px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] md:text-[11px] font-bold leading-none flex items-center justify-center border border-neutral-900 shadow">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
        <button
          onPointerDown={() => { import('@/components/vademecum/navigation/SideMenu').catch(() => {}); }}
          onClick={handleMenuClick}
          aria-label="Abrir menu"
          className="w-11 h-11 md:w-12 md:h-12 lg:w-13 lg:h-13 rounded-full bg-neutral-900/85 border border-white/15 backdrop-blur-md shadow-lg shadow-black/40 flex items-center justify-center active:scale-95 transition"
        >
          <MenuIcon className="w-5 h-5 md:w-[22px] md:h-[22px] text-white" />
        </button>
      </div>
    </header>
  );
};

export default memo(HomeUserHeader);
