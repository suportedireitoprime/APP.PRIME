import { LucideIcon, ChevronRight, FileText } from 'lucide-react';

interface DocumentCardProps {
  title: string;
  stat1Value: string;
  stat1Label?: string;
  icon?: LucideIcon;
  onClick?: () => void;
}

export const DocumentCard = ({
  title,
  stat1Value,
  stat1Label,
  icon: Icon = FileText,
  onClick
}: DocumentCardProps) => {
  return (
    <button 
      onClick={onClick}
      className="group flex items-center gap-4 p-4 min-h-[76px] rounded-xl bg-secondary/50 border border-border hover:border-primary/40 hover:bg-secondary transition-all text-left w-full"
    >
      <Icon className="w-6 h-6 text-primary stroke-[1.5] shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-body text-base font-bold text-foreground leading-tight truncate">{title}</p>
        <p className="font-body text-sm text-muted-foreground mt-0.5">
          {stat1Value} {stat1Label}
        </p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
    </button>
  );
};
