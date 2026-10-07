import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock, ShieldCheck, Zap, Sparkles, CheckCircle2, ChevronRight, Info, Shield, Trophy, Crown } from "lucide-react";
import { TypewriterText } from "@/components/ui/TypewriterText";
import { haptic } from '@/lib/nativeHaptics';

interface PricingCardsProps {
  selectedPlan: 'mensal' | 'anual' | 'vitalicio';
  isNewUser: boolean;
  onSelectPlan: (plan: 'mensal' | 'anual' | 'vitalicio') => void;
}

export function PricingCards({ selectedPlan, isNewUser, onSelectPlan }: PricingCardsProps) {
  const activePlan = selectedPlan === 'promocao' as any ? 'anual' : selectedPlan;

  const anualMessages = [
    "Acesso total por 1 ano inteiro",
    "Mais econômico que o plano mensal",
    "Garantia de 7 dias ou seu dinheiro de volta",
    "Todas as atualizações e novas leis inclusas"
  ];

  const mensalMessages = [
    "Acesso flexível mês a mês",
    "Sem fidelidade, cancele fácil",
    "Pague apenas pelo que usar",
    "Acesso completo a tudo"
  ];

  return (
    <div className="w-full flex flex-col gap-4 px-4 pt-2 pb-4">
      <div className="flex p-1.5 bg-neutral-950/80 rounded-full border border-white/10 relative z-20 shadow-inner max-w-sm mx-auto w-full backdrop-blur-md">
        <button
          type="button"
          onClick={() => {
            haptic.light();
            onSelectPlan('mensal');
          }}
          className={`relative z-10 flex-1 py-2.5 sm:py-3 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-full transition-colors duration-200 cursor-pointer select-none ${
            activePlan === 'mensal' 
              ? 'text-white' 
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          {activePlan === 'mensal' && (
            <motion.div
              layoutId="pricing-tab"
              className="absolute inset-0 bg-gradient-to-r from-red-600 via-primary to-rose-600 rounded-full shadow-[0_0_20px_rgba(224,31,71,0.55)] border border-red-400/40 -z-10"
              transition={{ type: "spring", bounce: 0.15, duration: 0.45 }}
            />
          )}
          Mensal
        </button>

        <button
          type="button"
          onClick={() => {
            haptic.light();
            onSelectPlan('anual');
          }}
          className={`relative z-10 flex-1 py-2.5 sm:py-3 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-full transition-colors duration-200 cursor-pointer select-none ${
            activePlan === 'anual'
              ? 'text-white' 
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          {activePlan === 'anual' && (
            <motion.div
              layoutId="pricing-tab"
              className="absolute inset-0 bg-gradient-to-r from-red-600 via-primary to-rose-600 rounded-full shadow-[0_0_20px_rgba(224,31,71,0.55)] border border-red-400/40 -z-10"
              transition={{ type: "spring", bounce: 0.15, duration: 0.45 }}
            />
          )}
          Anual
        </button>

        <button
          type="button"
          onClick={() => {
            haptic.light();
            onSelectPlan('vitalicio');
          }}
          className={`relative z-10 flex-1 py-2.5 sm:py-3 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-full transition-colors duration-200 cursor-pointer select-none ${
            activePlan === 'vitalicio'
              ? 'text-white' 
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          {activePlan === 'vitalicio' && (
            <motion.div
              layoutId="pricing-tab"
              className="absolute inset-0 bg-gradient-to-r from-red-600 via-primary to-rose-600 rounded-full shadow-[0_0_20px_rgba(224,31,71,0.55)] border border-red-400/40 -z-10"
              transition={{ type: "spring", bounce: 0.15, duration: 0.45 }}
            />
          )}
          Vitalício
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

          {activePlan === 'anual' && (
            <button
              type="button"
              onClick={() => onSelectPlan('anual')}
              className="relative w-full rounded-3xl border-2 transition-all duration-300 text-left p-4 overflow-hidden border-primary bg-primary/5 shadow-[0_0_40px_rgba(224,31,71,0.15)] ring-1 ring-primary/50"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
              
              {/* Imagem de Fundo Vazada */}
              <div className="absolute top-0 bottom-0 right-0 w-3/5 pointer-events-none overflow-hidden rounded-r-3xl z-0" style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 40%)' }}>
                <img src="/anual_premium.webp" alt="" className="w-full h-full object-cover opacity-60 mix-blend-screen scale-125 translate-x-4 translate-y-1" loading="lazy" />
              </div>

              <div className="absolute top-0 right-0 bg-primary text-primary-foreground font-black text-[9px] px-2.5 py-0.5 rounded-bl-xl tracking-wider z-10 flex items-center gap-1">
                <Crown className="w-3 h-3 fill-amber-300 text-amber-300" />
                O MAIS ADQUIRIDO
              </div>

              <div className="flex justify-between items-start mb-1.5 relative z-10">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <h3 className="font-display font-black text-primary text-base uppercase tracking-wider shadow-black/50 drop-shadow-md">Plano Anual</h3>
                  </div>
                </div>
              </div>

              <div className="flex items-baseline gap-1.5 mb-1 text-foreground relative z-10">
                <span className="font-display text-3xl font-black shadow-black/50 drop-shadow-md">R$ 149,90</span>
                <span className="font-display text-lg font-bold shadow-black/50 drop-shadow-md text-muted-foreground">/ano</span>
              </div>

              <p className="text-[11px] font-bold text-muted-foreground mb-2 relative z-10 drop-shadow-md shadow-black/50">
                Pagamento único no cartão ou PIX
              </p>
              
              <div className="flex flex-col gap-1.5 mb-3 mt-3 relative z-10 w-full pl-0.5">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-[12px] font-bold text-white shadow-black/50 drop-shadow-md">Acesso ao conteúdo por 12 meses</span>
                </div>
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-[12px] font-bold text-white shadow-black/50 drop-shadow-md">Acesso 100% ilimitado ao APP</span>
                </div>
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-[12px] font-bold text-white shadow-black/50 drop-shadow-md">+200 ferramentas desbloqueadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-[12px] font-bold text-white shadow-black/50 drop-shadow-md">Inteligência Artificial Horus no WhatsApp</span>
                </div>
              </div>

              <div className="w-full pt-1 mt-1 border-t border-primary/20 flex items-center justify-center relative z-10">
                <TypewriterText messages={anualMessages} className="text-[11px] font-bold text-primary drop-shadow-md mt-2" />
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
                <img src="/mensal_premium.webp" alt="" className="w-full h-full object-cover object-top opacity-50 mix-blend-screen scale-110 translate-x-4 translate-y-2" loading="lazy" />
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

              <div className="flex flex-col gap-1.5 mb-3 mt-3 relative z-10 w-full pl-0.5">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-[12px] font-bold text-white shadow-black/50 drop-shadow-md">Acesso flexível mês a mês</span>
                </div>
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-[12px] font-bold text-white shadow-black/50 drop-shadow-md">Acesso 100% ilimitado ao APP</span>
                </div>
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-[12px] font-bold text-white shadow-black/50 drop-shadow-md">+200 ferramentas desbloqueadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-[12px] font-bold text-white shadow-black/50 drop-shadow-md">Inteligência Artificial Horus no WhatsApp</span>
                </div>
              </div>

              <div className="w-full pt-1 mt-1 border-t border-white/10 flex items-center justify-center relative z-10">
                <TypewriterText messages={mensalMessages} className="text-[11px] font-bold text-muted-foreground drop-shadow-md mt-2" />
              </div>
            </button>
          )}

          {activePlan === 'vitalicio' && (
            <button
              type="button"
              onClick={() => onSelectPlan('vitalicio')}
              className="relative w-full rounded-3xl border-2 transition-all duration-300 text-left p-4 overflow-hidden border-primary bg-primary/5 shadow-[0_0_40px_rgba(224,31,71,0.15)] ring-1 ring-primary/50"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
              
              {/* Imagem de Fundo Vazada */}
              <div className="absolute top-0 bottom-0 right-0 w-3/5 pointer-events-none overflow-hidden rounded-r-3xl z-0" style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 40%)' }}>
                <img src="/vitalicio_premium_v2.webp" alt="" className="w-full h-full object-cover object-top opacity-60 mix-blend-screen translate-x-4 translate-y-1" loading="lazy" />
              </div>

              <div className="flex justify-between items-start mb-1.5 relative z-10">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                     <ShieldCheck className="w-4 h-4 text-primary" />
                     <h3 className="font-display font-black text-primary text-base uppercase tracking-wider shadow-black/50 drop-shadow-md">Plano Vitalício</h3>
                  </div>
                </div>
              </div>

              <div className="flex items-baseline gap-1.5 mb-1 text-foreground relative z-10">
                <span className="font-display text-3xl font-black shadow-black/50 drop-shadow-md">R$ 249,90</span>
                <span className="font-display text-lg font-bold shadow-black/50 drop-shadow-md text-muted-foreground">único</span>
              </div>

              <p className="text-[11px] font-bold text-muted-foreground mb-2 relative z-10 drop-shadow-md shadow-black/50">
                Parcele em até 10 vezes no cartão (Acesso para sempre)
              </p>
              
              <div className="flex flex-col gap-1.5 mb-3 mt-3 relative z-10 w-full pl-0.5">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-[12px] font-bold text-white shadow-black/50 drop-shadow-md">Acesso para sempre</span>
                </div>
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-[12px] font-bold text-white shadow-black/50 drop-shadow-md">Acesso 100% ilimitado ao APP</span>
                </div>
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-[12px] font-bold text-white shadow-black/50 drop-shadow-md">+200 ferramentas desbloqueadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-[12px] font-bold text-white shadow-black/50 drop-shadow-md">Inteligência Artificial Horus no WhatsApp</span>
                </div>
              </div>

              <div className="w-full pt-1 mt-1 border-t border-primary/20 flex items-center justify-center relative z-10">
                <TypewriterText messages={["Pague uma vez e acesse para sempre", "Todas as atualizações inclusas", "Sem cobranças recorrentes"]} className="text-[11px] font-bold text-primary drop-shadow-md mt-2" />
              </div>
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}



