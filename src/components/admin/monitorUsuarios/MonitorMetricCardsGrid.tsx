import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MetricCard } from './monitorUsuariosConstants';

interface MonitorMetricCardsGridProps {
  cards: MetricCard[];
  onSelectCard: (key: string) => void;
  signupsToday: number;
  trialClicksToday: number;
}

export function MonitorMetricCardsGrid({
  cards,
  onSelectCard,
  signupsToday,
  trialClicksToday,
}: MonitorMetricCardsGridProps) {
  return (
    <>
      {/* ── Métricas (6 cards em grid 3x2) ── */}
      <div className="grid grid-cols-3 gap-2.5">
        {cards.map((c, bi) => {
          const Icon = c.icon;
          const Comp: any = c.clickable ? motion.button : motion.div;
          return (
            <Comp
              key={c.key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: bi * 0.05 }}
              onClick={c.clickable ? () => onSelectCard(c.key) : undefined}
              className={cn(
                'relative rounded-2xl bg-secondary/40 border border-border/40 p-3 flex flex-col items-center gap-1.5',
                c.clickable && 'hover:bg-secondary/60 transition-colors active:scale-[0.97] cursor-pointer',
              )}
            >
              <span
                className={`absolute -top-1.5 -right-1.5 ${c.badgeBg} text-background text-[11px] font-bold min-w-[22px] h-[22px] px-1 rounded-full flex items-center justify-center shadow`}
              >
                {c.count}
              </span>
              <div className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${c.iconColor}`} />
              </div>
              <span className="text-[11px] font-semibold text-foreground text-center leading-tight">
                {c.title}
              </span>
              <span className="text-[10px] text-muted-foreground text-center">{c.subtitle}</span>
              {c.key === 'realtime' && c.count > 0 && (
                <span className="flex items-center gap-1 text-[9px] text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ao vivo
                </span>
              )}
            </Comp>
          );
        })}
      </div>

      {/* ── Conversão (barra) ── */}
      <div className="rounded-2xl bg-secondary/40 border border-border/30 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <p className="text-xs font-bold text-foreground">Conversão de teste hoje</p>
          <span className="ml-auto text-[10px] text-muted-foreground">
            {signupsToday > 0 ? Math.round((trialClicksToday / signupsToday) * 100) : 0}% cadastros → trial
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl bg-pink-500/10 border border-pink-500/20 p-2">
            <p className="text-lg font-bold text-pink-400">{signupsToday}</p>
            <p className="text-[10px] text-muted-foreground">Cadastros</p>
          </div>
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2">
            <p className="text-lg font-bold text-amber-400">{trialClicksToday}</p>
            <p className="text-[10px] text-muted-foreground">Cliques em teste</p>
          </div>
        </div>
      </div>
    </>
  );
}
