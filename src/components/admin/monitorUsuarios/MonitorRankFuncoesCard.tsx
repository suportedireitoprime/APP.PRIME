import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MEDAL, MEDAL_COLORS } from './monitorUsuariosConstants';

interface MonitorRankFuncoesCardProps {
  rankPeriod: 'day' | 'week' | 'month';
  setRankPeriod: (period: 'day' | 'week' | 'month') => void;
  rankRows: { label: string; count: number }[];
  maxRank: number;
}

export function MonitorRankFuncoesCard({
  rankPeriod,
  setRankPeriod,
  rankRows,
  maxRank,
}: MonitorRankFuncoesCardProps) {
  return (
    <div className="rounded-2xl bg-secondary/40 border border-border/30 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border/30 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-primary" />
        <p className="text-xs font-bold text-foreground">Rank de Funções</p>
        <div className="ml-auto flex items-center gap-1 bg-muted/40 rounded-full p-0.5">
          {(['day', 'week', 'month'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setRankPeriod(k)}
              className={cn(
                'text-[10px] font-semibold px-2.5 py-1 rounded-full transition-colors',
                rankPeriod === k
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {k === 'day' ? 'Hoje' : k === 'week' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>
      </div>

      {rankRows.length === 0 ? (
        <div className="py-8 text-center">
          <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Sem dados neste período</p>
        </div>
      ) : (
        <div className="divide-y divide-border/20">
          {rankRows.map((r, i) => {
            const pct = Math.round((r.count / maxRank) * 100);
            return (
              <div key={r.label} className="px-4 py-2.5">
                <div className="flex items-center gap-3 mb-1.5">
                  <span
                    className={cn(
                      'text-sm font-bold w-7 text-center shrink-0',
                      i < 3 ? MEDAL_COLORS[i] : 'text-muted-foreground',
                    )}
                  >
                    {i < 3 ? MEDAL[i] : `#${i + 1}`}
                  </span>
                  <span className="text-xs font-semibold text-foreground flex-1 truncate">{r.label}</span>
                  <span className="text-xs font-bold text-primary shrink-0">{r.count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden ml-10">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: pct / 100 }}
                    style={{ transformOrigin: 'left' }}
                    transition={{ delay: i * 0.04, duration: 0.4 }}
                    className="h-full w-full rounded-full bg-primary"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
