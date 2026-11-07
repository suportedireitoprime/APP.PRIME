import React from 'react';
import { ChevronRight, LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { haptic } from '@/lib/nativeHaptics';

export interface EspecialCardItem {
  id: string;
  title: string;
  subtitle: string;
  badgeText?: string;
  route: string;
  icon: LucideIcon;
  iconColor: string;
  bgGradient: string;
}

interface VideoaulasEspeciaisCardProps {
  item: EspecialCardItem;
}

export const VideoaulasEspeciaisCard: React.FC<VideoaulasEspeciaisCardProps> = ({ item }) => {
  const navigate = useNavigate();
  const Icon = item.icon;

  return (
    <button
      onClick={() => {
        haptic.selection();
        navigate(item.route);
      }}
      className="w-full flex items-center gap-3.5 p-3 sm:p-4 min-h-[88px] text-left hover:bg-white/[0.04] active:scale-[0.985] transition-all rounded-2xl bg-[#141416]/90 border border-white/10 hover:border-rose-500/40 shadow-md group overflow-hidden relative cursor-pointer"
    >
      <div
        className="w-[58px] h-[78px] sm:w-[64px] sm:h-[84px] shrink-0 rounded-xl overflow-hidden border border-white/10 shadow-lg relative flex items-center justify-center"
        style={{ background: item.bgGradient }}
      >
        <Icon
          className="w-8 h-8 group-hover:scale-110 transition-transform duration-300"
          style={{ color: item.iconColor }}
          strokeWidth={1.8}
        />
        {item.badgeText && (
          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-rose-500/90 text-[8px] font-black text-white uppercase">
            {item.badgeText}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 pr-1">
        <h4 className="font-sans font-bold text-base sm:text-[17px] text-white group-hover:text-rose-300 transition-colors leading-snug">
          {item.title}
        </h4>
        <p className="font-sans text-xs sm:text-[13px] text-white/50 leading-tight mt-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          <span>{item.subtitle}</span>
        </p>
      </div>

      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/80 group-hover:bg-rose-600 group-hover:border-rose-500 group-hover:text-white transition-all duration-200 shrink-0 text-xs font-bold tracking-wider uppercase">
        <span>Acessar</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </div>
    </button>
  );
};

