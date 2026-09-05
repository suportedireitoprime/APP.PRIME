import React from 'react';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Tema } from './blogEdicaoTypes';

export interface TimelineSlot {
  horario: string;
  label: string;
  enviado: boolean;
  atrasado: boolean;
  isNext: boolean;
}

interface BlogEdicaoHeroProps {
  hojeFormatado: string;
  timelineSlots: TimelineSlot[];
  proximaGeracao: {
    horario: string | null;
    item: Tema | null;
  };
}

export function BlogEdicaoHero({ hojeFormatado, timelineSlots, proximaGeracao }: BlogEdicaoHeroProps) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary/25 via-primary/10 to-transparent border border-primary/30 px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[9px] uppercase tracking-[0.2em] text-primary/80 font-bold">Hoje</div>
          <div className="text-base sm:text-lg font-display font-black tracking-tight text-foreground leading-tight capitalize">
            {hojeFormatado}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full w-max border border-emerald-500/20">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider">Automação Ativa</span>
          </div>
        </div>

        {/* Timeline inline compacta */}
        {timelineSlots.length > 0 && (
          <div className="flex items-center gap-2">
            {timelineSlots.map((s) => (
              <div key={s.horario} className="flex flex-col items-center gap-0.5">
                <div
                  className={
                    'w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ' +
                    (s.enviado
                      ? 'bg-primary border-primary text-primary-foreground'
                      : s.atrasado
                      ? 'bg-destructive/20 border-destructive text-destructive'
                      : s.isNext
                      ? 'bg-primary/20 border-primary text-primary animate-pulse'
                      : 'bg-background border-primary/30 text-muted-foreground')
                  }
                >
                  {s.enviado ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : s.atrasado ? (
                    <AlertCircle className="w-3.5 h-3.5" />
                  ) : (
                    <Loader2 className={'w-3.5 h-3.5 ' + (s.isNext ? 'animate-spin' : '')} />
                  )}
                </div>
                <div
                  className={
                    'text-[10px] font-bold ' +
                    (s.enviado ? 'text-primary' : s.isNext ? 'text-foreground' : 'text-muted-foreground')
                  }
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {proximaGeracao.item && (
        <div className="mt-2 pt-2 border-t border-primary/20 flex items-center gap-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap">
            {proximaGeracao.horario}
          </div>
          <div className="text-xs font-semibold line-clamp-1 flex-1">
            {proximaGeracao.item.titulo_sugerido}
          </div>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {proximaGeracao.item.categoria}
          </span>
        </div>
      )}
    </div>
  );
}
