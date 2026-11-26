import { Mail, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const InfoRow = ({ icon: Icon, label, value, badge, onCopy }: {
  icon: typeof Mail;
  label: string;
  value: string;
  badge?: string;
  onCopy?: () => void;
}) => (
  <div className="flex items-center gap-3 px-4 py-3.5">
    <Icon className="w-4 h-4 text-primary/75 shrink-0" strokeWidth={1.7} />
    <div className="flex-1 min-w-0">
      <p className="text-[10.5px] text-muted-foreground font-body uppercase tracking-wider leading-none">
        {label}
      </p>
      <p className="text-[13.5px] font-medium text-foreground font-body truncate mt-1">
        {value}
      </p>
    </div>
    <div className="flex items-center gap-1.5 shrink-0">
      {badge && (
        <Badge variant="secondary" className="text-[10px] bg-emerald-500/15 text-emerald-400 border-0">
          {badge}
        </Badge>
      )}
      {onCopy && (
        <button
          type="button"
          onClick={onCopy}
          aria-label={`Copiar ${label}`}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground/70 hover:text-foreground hover:bg-white/[0.06] active:scale-95 transition-all cursor-pointer"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  </div>
);
