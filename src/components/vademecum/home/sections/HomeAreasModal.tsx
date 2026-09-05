import { memo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight } from 'lucide-react';
import HomeCard from '@/components/vademecum/home/HomeCard';
import { AREA_CATS, AreaCat } from './homeSectionsData';

interface HomeAreasModalProps {
  open: boolean;
  onClose: () => void;
  onSelectArea: (area: AreaCat) => void;
}

const HomeAreasModal = ({ open, onClose, onSelectArea }: HomeAreasModalProps) => {
  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border/60 px-3 pt-[calc(var(--sai-top)+10px)] pb-3">
        <button
          onClick={onClose}
          aria-label="Voltar"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-card active:scale-95 transition"
        >
          <ChevronRight className="h-6 w-6 rotate-180 text-foreground" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[19px] font-bold leading-tight text-foreground">Áreas do Direito</p>
          <p className="truncate font-body text-[12px] text-muted-foreground">
            Escolha uma área para ver as leis daquela área
          </p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-[calc(var(--sai-bottom)+24px)] pt-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {AREA_CATS.map((c, i) => (
            <HomeCard
              key={c.id}
              icon={c.icon}
              label={c.label}
              sublabel={c.sublabel}
              color={c.color}
              delay={Math.min(i * 0.04, 0.3)}
              onClick={() => onSelectArea(c)}
              data-track="home_card_click"
              data-track-name={c.label}
              data-track-section="areas"
            />
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default memo(HomeAreasModal);
