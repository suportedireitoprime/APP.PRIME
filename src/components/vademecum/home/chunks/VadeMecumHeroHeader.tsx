import React, { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BellRing } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import NotificationsSheet, { useUnreadNotifCount } from '@/components/vademecum/outros/NotificationsSheet';

const VadeMecumHeroHeader: React.FC = () => {
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = useUnreadNotifCount();

  return (
    <>
      <div className="px-4 pb-2 pt-2 flex items-center justify-between relative z-30">
        <button 
          onClick={() => { 
            haptic.selection(); 
            navigate('/'); 
          }} 
          aria-label="Voltar para tela inicial"
          className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
        </button>
        <button 
          onClick={() => { 
            haptic.selection(); 
            setNotifOpen(true);
          }} 
          aria-label={`Notificações e novidades legislativas${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
          className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:scale-95 relative cursor-pointer"
        >
          <BellRing className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none flex items-center justify-center border border-neutral-900 shadow">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
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

export default memo(VadeMecumHeroHeader);
