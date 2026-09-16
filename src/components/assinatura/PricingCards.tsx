import { motion } from "framer-motion";
import { Check, Clock, ShieldCheck, Zap } from "lucide-react";

interface PricingCardsProps {
  selectedPlan: 'mensal' | 'anual' | 'promocao';
  isNewUser: boolean;
  onSelectPlan: (plan: 'mensal' | 'anual' | 'promocao') => void;
}

export function PricingCards({ selectedPlan, isNewUser, onSelectPlan }: PricingCardsProps) {
  return (
    <div className="w-full flex flex-col gap-4 px-4 pt-2 pb-6">
      {/* Plano Anual / Promoção PIX */}
      {isNewUser ? (
        <button
          type="button"
          onClick={() => onSelectPlan('promocao')}
          className={`relative w-full rounded-3xl border-2 transition-all duration-300 text-left p-5 overflow-hidden ${
            selectedPlan === 'promocao' 
              ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_40px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50' 
              : 'border-border/50 bg-card/40 hover:bg-card/80 opacity-80 scale-[0.98]'
          }`}
        >
          {selectedPlan === 'promocao' && (
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
          )}
          
          <div className="absolute top-0 right-0 bg-emerald-500 text-white font-black text-[9px] px-3 py-1 rounded-bl-xl tracking-wider">
            OFERTA DE BOAS-VINDAS
          </div>

          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                <h3 className="font-display font-black text-emerald-400 text-lg uppercase tracking-wider">Anual PIX</h3>
              </div>
              <p className="font-body text-xs font-semibold text-muted-foreground line-through">De R$ 199,90</p>
            </div>
            {selectedPlan === 'promocao' && (
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg">
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
            )}
          </div>

          <div className="flex items-baseline gap-1 mb-1">
            <span className="font-display text-4xl font-black text-foreground">R$ 149,90</span>
            <span className="text-xs font-bold text-muted-foreground">/ano</span>
          </div>

          <p className="text-[11px] font-bold text-emerald-500 mb-3 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Promoção válida por 24 horas
          </p>
          
          <div className="w-full bg-emerald-500/10 rounded-lg p-2.5 flex items-center justify-center border border-emerald-500/20">
            <span className="text-xs font-bold text-emerald-400">Equivale a apenas R$ 12,49 / mês</span>
          </div>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onSelectPlan('anual')}
          className={`relative w-full rounded-3xl border-2 transition-all duration-300 text-left p-5 overflow-hidden ${
            selectedPlan === 'anual' 
              ? 'border-primary bg-primary/5 shadow-[0_0_40px_rgba(224,31,71,0.15)] ring-1 ring-primary/50' 
              : 'border-border/50 bg-card/40 hover:bg-card/80 opacity-80 scale-[0.98]'
          }`}
        >
          {selectedPlan === 'anual' && (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
          )}
          
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground font-black text-[9px] px-3 py-1 rounded-bl-xl tracking-wider">
            MAIS ESCOLHIDO
          </div>

          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <h3 className="font-display font-black text-primary text-lg uppercase tracking-wider">Plano Anual</h3>
              </div>
            </div>
            {selectedPlan === 'anual' && (
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg">
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
            )}
          </div>

          <div className="flex items-baseline gap-1 mb-1 text-foreground">
            <span className="font-display text-xl font-bold">12x de</span>
            <span className="font-display text-4xl font-black">R$ 16,65</span>
          </div>

          <p className="text-[11px] font-bold text-muted-foreground mb-3">
            ou R$ 199,90 à vista
          </p>
          
          <div className="w-full bg-primary/10 rounded-lg p-2.5 flex items-center justify-center border border-primary/20">
            <span className="text-xs font-bold text-primary">Acesso total por 1 ano inteiro</span>
          </div>
        </button>
      )}

      {/* Plano Mensal */}
      <button
        type="button"
        onClick={() => onSelectPlan('mensal')}
        className={`relative w-full rounded-3xl border-2 transition-all duration-300 text-left p-5 overflow-hidden ${
          selectedPlan === 'mensal' 
            ? 'border-border bg-card shadow-lg ring-1 ring-border/50' 
            : 'border-transparent bg-card/20 hover:bg-card/40 opacity-70 scale-[0.98]'
        }`}
      >
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-display font-bold text-muted-foreground text-sm uppercase tracking-wider">Plano Mensal</h3>
          {selectedPlan === 'mensal' && (
            <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center shrink-0">
              <Check className="w-3 h-3 text-background" strokeWidth={3} />
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-1">
          <span className="font-display text-2xl font-black text-foreground">R$ 29,90</span>
          <span className="text-[10px] font-bold text-muted-foreground">/mês</span>
        </div>
      </button>
    </div>
  );
}
