import React from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { CheckCircle2, ShieldCheck, Sparkles, Crown, Zap, Infinity as InfinityIcon } from "lucide-react";
import { TypewriterText } from "@/components/ui/TypewriterText";
import { haptic } from '@/lib/nativeHaptics';
import { PRECO_MENSAL, PRECO_ANUAL, PRECO_VITALICIO, brl } from '@/lib/precos';

export type PlanOption = 'mensal' | 'anual' | 'vitalicio';

interface PricingCardsProps {
  selectedPlan: PlanOption;
  isNewUser?: boolean;
  onSelectPlan: (plan: PlanOption) => void;
}

export function PricingCards({ selectedPlan, onSelectPlan }: PricingCardsProps) {
  const activePlan: PlanOption = selectedPlan || 'anual';

  const vitalicioMessages = [
    "Acesso para sempre com pagamento único",
    "Nunca mais pague mensalidades ou anuidades",
    "Todas as novas leis e atualizações futuras inclusas",
    "Inteligência Artificial jurídica irrestrita"
  ];

  const anualMessages = [
    "Acesso total por 12 meses inteiros",
    "Economia de mais de 62% em relação ao mensal",
    "Apenas R$ 7,49 por mês",
    "Todas as atualizações do ano inclusas"
  ];

  const mensalMessages = [
    "Acesso flexível mês a mês",
    "Sem fidelidade: cancele quando quiser",
    `Apenas ${brl(PRECO_MENSAL)} por mês`,
    "Acesso completo a todas as ferramentas"
  ];

  return (
    <div className="w-full flex flex-col gap-4 px-4 pt-2 pb-4">
      {/* Seletor de 3 Planos */}
      <div className="grid grid-cols-3 p-1 bg-white/5 border border-white/10 rounded-2xl relative gap-1">
        <button
          type="button"
          onClick={() => {
            haptic.selection();
            onSelectPlan('vitalicio');
          }}
          className={`relative z-10 py-2.5 px-2 rounded-xl font-display font-black text-[11px] sm:text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1 ${
            activePlan === 'vitalicio'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/30'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <InfinityIcon className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Vitalício</span>
        </button>

        <button
          type="button"
          onClick={() => {
            haptic.selection();
            onSelectPlan('anual');
          }}
          className={`relative z-10 py-2.5 px-2 rounded-xl font-display font-black text-[11px] sm:text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1 ${
            activePlan === 'anual'
              ? 'bg-primary text-white shadow-lg shadow-primary/30'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Crown className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Anual</span>
        </button>

        <button
          type="button"
          onClick={() => {
            haptic.selection();
            onSelectPlan('mensal');
          }}
          className={`relative z-10 py-2.5 px-2 rounded-xl font-display font-black text-[11px] sm:text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1 ${
            activePlan === 'mensal'
              ? 'bg-primary text-white shadow-lg shadow-primary/30'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <span className="truncate">Mensal</span>
        </button>
      </div>

      <LayoutGroup id="pricing-toggle">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePlan}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            {/* PLANO VITALÍCIO */}
            {activePlan === 'vitalicio' && (
              <button
                type="button"
                onClick={() => onSelectPlan('vitalicio')}
                className="relative w-full rounded-3xl border-2 transition-all duration-300 text-left p-4 sm:p-5 overflow-hidden border-amber-500/80 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent shadow-[0_0_40px_rgba(245,158,11,0.2)] ring-1 ring-amber-400/40 cursor-pointer"
              >
                <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-[9px] sm:text-[10px] px-3 py-1 rounded-bl-xl tracking-wider z-10 flex items-center gap-1 uppercase shadow-md">
                  <InfinityIcon className="w-3 h-3" />
                  MELHOR VALOR · PAGAMENTO ÚNICO
                </div>

                <div className="flex justify-between items-start mb-1.5 relative z-10">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <h3 className="font-display font-black text-amber-300 text-base uppercase tracking-wider">
                      Plano Vitalício
                    </h3>
                  </div>
                </div>

                <div className="flex items-baseline gap-1.5 mb-1 text-foreground relative z-10">
                  <span className="font-display text-3xl sm:text-4xl font-black text-amber-300">
                    {brl(PRECO_VITALICIO)}
                  </span>
                  <span className="font-display text-sm sm:text-base font-bold text-zinc-400">
                    pagamento único
                  </span>
                </div>

                <p className="text-[11px] font-bold text-amber-200/80 mb-3 relative z-10">
                  Acesso para sempre • Sem mensalidades ou renovações • PIX ou em até 6x
                </p>

                <div className="flex flex-col gap-1.5 mb-3 mt-3 relative z-10 w-full pl-0.5">
                  {[
                    "Acesso vitalício irrestrito a todo o acervo",
                    "Todas as futuras leis, códigos e atualizações inclusas",
                    "Inteligência Artificial Horus ilimitada",
                    "Simulados, audiobooks, mapas mentais e questões"
                  ].map((feat) => (
                    <div key={feat} className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-[12px] font-bold text-white leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="w-full pt-2 mt-2 border-t border-amber-500/20 flex items-center justify-center relative z-10">
                  <TypewriterText messages={vitalicioMessages} className="text-[11px] font-bold text-amber-300 drop-shadow-md" />
                </div>
              </button>
            )}

            {/* PLANO ANUAL */}
            {activePlan === 'anual' && (
              <button
                type="button"
                onClick={() => onSelectPlan('anual')}
                className="relative w-full rounded-3xl border-2 transition-all duration-300 text-left p-4 sm:p-5 overflow-hidden border-primary bg-primary/5 shadow-[0_0_40px_rgba(224,31,71,0.15)] ring-1 ring-primary/50 cursor-pointer"
              >
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground font-black text-[9px] sm:text-[10px] px-3 py-1 rounded-bl-xl tracking-wider z-10 flex items-center gap-1 uppercase">
                  <Crown className="w-3 h-3 fill-amber-300 text-amber-300" />
                  MAIS ESCOLHIDO · 62% OFF
                </div>

                <div className="flex justify-between items-start mb-1.5 relative z-10">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <h3 className="font-display font-black text-primary text-base uppercase tracking-wider">
                      Plano Anual
                    </h3>
                  </div>
                </div>

                <div className="flex items-baseline gap-1.5 mb-1 text-foreground relative z-10">
                  <span className="font-display text-3xl sm:text-4xl font-black text-white">
                    {brl(PRECO_ANUAL)}
                  </span>
                  <span className="font-display text-sm sm:text-base font-bold text-zinc-400">
                    /ano (R$ 7,49/mês)
                  </span>
                </div>

                <p className="text-[11px] font-bold text-muted-foreground mb-3 relative z-10">
                  Acesso total por 12 meses • Em até 6x no cartão ou PIX
                </p>

                <div className="flex flex-col gap-1.5 mb-3 mt-3 relative z-10 w-full pl-0.5">
                  {[
                    "Acesso completo por 12 meses consecutivos",
                    "Economia superior a 62% em relação ao mensal",
                    "Todas as atualizações do ano incluídas",
                    "Acesso 100% ilimitado em celular, tablet e desktop"
                  ].map((feat) => (
                    <div key={feat} className="flex items-center gap-2">
                      <Crown className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="text-[12px] font-bold text-white leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="w-full pt-2 mt-2 border-t border-primary/20 flex items-center justify-center relative z-10">
                  <TypewriterText messages={anualMessages} className="text-[11px] font-bold text-primary drop-shadow-md" />
                </div>
              </button>
            )}

            {/* PLANO MENSAL */}
            {activePlan === 'mensal' && (
              <button
                type="button"
                onClick={() => onSelectPlan('mensal')}
                className="relative w-full rounded-3xl border-2 transition-all duration-300 text-left p-4 sm:p-5 overflow-hidden border-border bg-card shadow-lg ring-1 ring-border/50 cursor-pointer"
              >
                <div className="flex justify-between items-start mb-1.5 relative z-10">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-display font-black text-muted-foreground text-base uppercase tracking-wider">
                      Plano Mensal
                    </h3>
                  </div>
                </div>

                <div className="flex items-baseline gap-1.5 mb-1 text-foreground relative z-10">
                  <span className="font-display text-3xl sm:text-4xl font-black text-white">
                    {brl(PRECO_MENSAL)}
                  </span>
                  <span className="font-display text-sm sm:text-base font-bold text-zinc-400">
                    /mês
                  </span>
                </div>

                <p className="text-[11px] font-bold text-muted-foreground mb-3 relative z-10">
                  Sem fidelidade • Cancele quando quiser • Apenas {brl(PRECO_MENSAL)}/mês
                </p>

                <div className="flex flex-col gap-1.5 mb-3 mt-3 relative z-10 w-full pl-0.5">
                  {[
                    "Acesso flexível mês a mês",
                    "Todas as leis, questões e audiobooks",
                    "Sem fidelidade e sem taxas extras",
                    "Cancele facilmente a qualquer momento"
                  ].map((feat) => (
                    <div key={feat} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-[12px] font-bold text-white leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="w-full pt-2 mt-2 border-t border-white/10 flex items-center justify-center relative z-10">
                  <TypewriterText messages={mensalMessages} className="text-[11px] font-bold text-muted-foreground drop-shadow-md" />
                </div>
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </LayoutGroup>
    </div>
  );
}
