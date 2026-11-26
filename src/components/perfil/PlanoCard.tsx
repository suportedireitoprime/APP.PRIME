import { ChevronRight, Crown, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { haptic } from '@/lib/nativeHaptics';

interface Props {
  isPremium: boolean;
  loading: boolean;
  titulo: string;
  desc: string;
  tag: string;
  expira: string | null;
}

export function PlanoCard({ isPremium, loading, titulo, desc, tag, expira }: Props) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => {
        haptic.selection();
        navigate(isPremium ? '/planos/ativos' : '/assinatura');
      }}
      className={`w-full text-left p-4 rounded-2xl border transition-all active:scale-[0.985] cursor-pointer ${
        isPremium
          ? 'bg-gradient-to-br from-amber-500/12 via-amber-500/5 to-transparent border-amber-500/35 hover:border-amber-500/50'
          : 'bg-card/70 border-border/60 hover:border-primary/40'
      }`}
    >
      <div className="flex items-center gap-3.5">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
          isPremium ? 'bg-amber-500/15 text-amber-400' : 'bg-primary/12 text-primary'
        }`}>
          {isPremium ? <Crown className="w-5 h-5" strokeWidth={1.8} /> : <Zap className="w-5 h-5" strokeWidth={1.8} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display text-base font-bold text-foreground leading-tight">{titulo}</p>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-white/10 text-foreground/85 border-0">
              {tag}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-body mt-0.5 leading-snug">
            {loading ? 'Carregando...' : desc}
          </p>
          {expira && <p className="text-[11px] text-muted-foreground/75 mt-0.5">Renova em {expira}</p>}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground/60 shrink-0" />
      </div>

      {!isPremium && !loading && (
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); haptic.selection(); navigate('/assinatura'); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); navigate('/assinatura'); } }}
          className="gold-cta mt-3.5 w-full h-11 rounded-xl flex items-center justify-center gap-2 font-display text-sm font-extrabold text-amber-950 tracking-wide active:scale-[0.98] transition-transform cursor-pointer"
        >
          <Crown className="w-4 h-4 relative z-10" strokeWidth={2.5} />
          <span className="relative z-10">ASSINAR PREMIUM</span>
        </div>
      )}
    </button>
  );
}
