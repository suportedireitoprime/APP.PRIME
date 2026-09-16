import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock, ShieldCheck, Zap } from "lucide-react";
import { TypewriterText } from "@/components/ui/TypewriterText";

interface PricingCardsProps {
  selectedPlan: 'mensal' | 'anual' | 'promocao';
  isNewUser: boolean;
  onSelectPlan: (plan: 'mensal' | 'anual' | 'promocao') => void;
}

export function PricingCards({ selectedPlan, isNewUser, onSelectPlan }: PricingCardsProps) {
  // Define o card a ser exibido com base na seleção
  const activePlan = selectedPlan === 'promocao' && !isNewUser ? 'anual' : selectedPlan;

  const anualMessages = [
    "Acesso total por 1 ano inteiro",
    "Economize mais de 50%",
    "Sua carreira em outro nível",
    "O plano mais escolhido"
  ];

  const mensalMessages = [
    "Acesso flexível mês a mês",
    "Sem fidelidade, cancele fácil",
    "Pague apenas pelo que usar",
    "Acesso completo a tudo"
  ];

  return (
    <div className="w-full flex flex-col gap-4 px-4 pt-2 pb-4">
      {/* Menu de Alternância (Toggle) */}
      <div className="flex p-1 bg-card/60 rounded-full border border-border/50 relative z-20 shadow-inner max-w-sm mx-auto w-full">
        <button
          type="button"
          onClick={() => onSelectPlan('mensal')}
          className={`relative z-10 flex-1 py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-full transition-all duration-300 ${
            activePlan === 'mensal' 
              ? 'text-foreground' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {activePlan === 'mensal' && (
            <motion.div
              layoutId="pricing-tab"
              className="absolute inset-0 bg-background rounded-full border border-border shadow-md -z-10"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          Mensal
        </button>

        <button
          type="button"
          onClick={() => onSelectPlan(isNewUser ? 'promocao' : 'anual')}
          className={`relative z-10 flex-1 py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-full transition-all duration-300 ${
            (activePlan === 'anual' || activePlan === 'promocao')
              ? 'text-foreground' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {(activePlan === 'anual' || activePlan === 'promocao') && (
            <motion.div
              layoutId="pricing-tab"
              className="absolute inset-0 bg-background rounded-full border border-border shadow-md -z-10"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          Anual
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activePlan}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          {activePlan === 'promocao' && isNewUser && (
            <button
              type="button"
              onClick={() => onSelectPlan('promocao')}
              className="relative w-full rounded-3xl border-2 transition-all duration-300 text-left p-4 overflow-hidden border-emerald-500 bg-emerald-500/10 shadow-[0_0_40px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
              
              <div className="absolute top-0 right-0 bg-emerald-500 text-white font-black text-[9px] px-2.5 py-0.5 rounded-bl-xl tracking-wider">
                OFERTA DE BOAS-VINDAS
              </div>

              <div className="flex justify-between items-start mb-1.5">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                    <h3 className="font-display font-black text-emerald-400 text-base uppercase tracking-wider">Anual PIX</h3>
                  </div>
                  <p className="font-body text-[11px] font-semibold text-muted-foreground line-through">De R$ 199,90</p>
                </div>
              </div>

              <div className="flex items-baseline gap-1 mb-1">
                <span className="font-display text-3xl font-black text-foreground">R$ 149,90</span>
                <span className="text-[10px] font-bold text-muted-foreground">/ano</span>
              </div>

              <p className="text-[10px] font-bold text-emerald-500 mb-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Promoção válida por 24 horas
              </p>
              
              <div className="w-full pt-1 flex items-center justify-center">
                <TypewriterText messages={["Equivale a apenas R$ 12,49 / mês", "Desconto exclusivo de boas-vindas", "Aproveite antes que acabe"]} className="text-[11px] font-bold text-emerald-400" />
              </div>
            </button>
          )}

          {activePlan === 'anual' && (
            <button
              type="button"
              onClick={() => onSelectPlan('anual')}
              className="relative w-full rounded-3xl border-2 transition-all duration-300 text-left p-4 overflow-hidden border-primary bg-primary/5 shadow-[0_0_40px_rgba(224,31,71,0.15)] ring-1 ring-primary/50"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
              
              {/* Imagem de Fundo Vazada */}
              <div className="absolute top-0 bottom-0 right-0 w-3/5 pointer-events-none overflow-hidden rounded-r-3xl z-0" style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 40%)' }}>
                <img src="/anual_premium.jpg" alt="" className="w-full h-full object-cover opacity-60 mix-blend-screen scale-125 translate-x-4 translate-y-1" loading="lazy" />
              </div>

              <div className="absolute top-0 right-0 bg-primary text-primary-foreground font-black text-[9px] px-2.5 py-0.5 rounded-bl-xl tracking-wider z-10">
                MAIS ESCOLHIDO
              </div>

              <div className="flex justify-between items-start mb-1.5 relative z-10">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <h3 className="font-display font-black text-primary text-base uppercase tracking-wider shadow-black/50 drop-shadow-md">Plano Anual</h3>
                  </div>
                </div>
              </div>

              <div className="flex items-baseline gap-1 mb-1 text-foreground relative z-10">
                <span className="font-display text-lg font-bold shadow-black/50 drop-shadow-md">12x de</span>
                <span className="font-display text-3xl font-black shadow-black/50 drop-shadow-md">R$ 16,65</span>
              </div>

              <p className="text-[10px] font-bold text-muted-foreground mb-2 relative z-10 drop-shadow-md shadow-black/50">
                ou R$ 199,90 à vista
              </p>
              
              <div className="w-full pt-1 flex items-center justify-center relative z-10">
                <TypewriterText messages={anualMessages} className="text-[11px] font-bold text-primary drop-shadow-md" />
              </div>
            </button>
          )}

          {activePlan === 'mensal' && (
            <button
              type="button"
              onClick={() => onSelectPlan('mensal')}
              className="relative w-full rounded-3xl border-2 transition-all duration-300 text-left p-4 overflow-hidden border-border bg-card shadow-lg ring-1 ring-border/50"
            >
              {/* Imagem de Fundo Vazada */}
              <div className="absolute top-0 bottom-0 right-0 w-3/5 pointer-events-none overflow-hidden rounded-r-3xl z-0" style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 40%)' }}>
                <img src="/mensal_premium.jpg" alt="" className="w-full h-full object-cover opacity-50 mix-blend-screen scale-125 translate-x-4 translate-y-1" loading="lazy" />
              </div>

              <div className="flex justify-between items-start mb-1.5 relative z-10">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-display font-black text-muted-foreground text-base uppercase tracking-wider shadow-black/50 drop-shadow-md">Plano Mensal</h3>
                  </div>
                </div>
              </div>

              <div className="flex items-baseline gap-1 mb-1 text-foreground relative z-10">
                <span className="font-display text-3xl font-black shadow-black/50 drop-shadow-md">R$ 29,90</span>
                <span className="text-[10px] font-bold text-muted-foreground shadow-black/50 drop-shadow-md">/mês</span>
              </div>
              
              <p className="text-[10px] font-bold text-muted-foreground mb-2 relative z-10 drop-shadow-md shadow-black/50">
                Sem fidelidade. Cancele quando quiser.
              </p>

              <div className="w-full pt-1 flex items-center justify-center relative z-10">
                <TypewriterText messages={mensalMessages} className="text-[11px] font-bold text-muted-foreground drop-shadow-md" />
              </div>
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
