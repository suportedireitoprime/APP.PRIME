import React, { useState, useEffect } from 'react';
import { Crown, Timer, LockKeyhole, CheckCircle2, Code2, Sparkles } from 'lucide-react';
import {
  getDevSimulationMode,
  setDevSimulationMode,
  DEV_SIMULATION_EVENT,
  DEV_SIMULATION_INFO,
  type DevSimulationMode,
} from '@/lib/devSimulation';
import { haptic } from '@/lib/nativeHaptics';

interface DevSubscriptionSwitcherProps {
  onModeChanged?: (mode: DevSimulationMode) => void;
}

export const DevSubscriptionSwitcher: React.FC<DevSubscriptionSwitcherProps> = ({ onModeChanged }) => {
  const [currentMode, setCurrentMode] = useState<DevSimulationMode>(() => getDevSimulationMode());

  useEffect(() => {
    const handleEvent = (e: Event) => {
      const custom = e as CustomEvent<{ mode: DevSimulationMode }>;
      if (custom.detail?.mode) {
        setCurrentMode(custom.detail.mode);
      }
    };
    window.addEventListener(DEV_SIMULATION_EVENT, handleEvent);
    return () => window.removeEventListener(DEV_SIMULATION_EVENT, handleEvent);
  }, []);

  const handleSelectMode = (mode: DevSimulationMode) => {
    if (mode === currentMode) return;
    haptic.impact('medium');
    setDevSimulationMode(mode);
    setCurrentMode(mode);
    onModeChanged?.(mode);
  };

  const OPTIONS: Array<{
    id: DevSimulationMode;
    title: string;
    description: string;
    badge: string;
    icon: React.ElementType;
    activeBorder: string;
    activeBg: string;
    badgeStyle: string;
    iconColor: string;
  }> = [
    {
      id: 'premium',
      title: 'Assinante Premium',
      description: 'Acesso vitalício irrestrito. Sem travas ou paywalls.',
      badge: 'PREMIUM',
      icon: Crown,
      activeBorder: 'border-amber-400/80 shadow-[0_0_15px_rgba(251,191,36,0.25)]',
      activeBg: 'bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-transparent',
      badgeStyle: 'text-amber-300 bg-amber-500/20 border-amber-400/40',
      iconColor: 'text-amber-400',
    },
    {
      id: 'free',
      title: 'Não Assinante',
      description: 'Acesso com degustação de 2 itens e travas ativas.',
      badge: 'NÃO ASSINANTE',
      icon: LockKeyhole,
      activeBorder: 'border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.25)]',
      activeBg: 'bg-gradient-to-r from-rose-500/20 via-rose-400/10 to-transparent',
      badgeStyle: 'text-rose-300 bg-rose-500/20 border-rose-400/40',
      iconColor: 'text-rose-400',
    },
  ];

  return (
    <div
      data-dev-control="true"
      className="rounded-2xl border border-violet-500/30 bg-gradient-to-b from-violet-950/25 via-background/90 to-background p-3.5 space-y-3"
    >
      {/* Header do Simulador */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-400">
            <Code2 className="w-4 h-4" strokeWidth={2.4} />
          </div>
          <div>
            <span className="font-display text-xs font-black tracking-widest text-violet-300 uppercase block">
              Simulador Dev
            </span>
            <span className="text-[11px] text-muted-foreground font-body">
              Alterne o tipo de conta para testes
            </span>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider bg-violet-500/15 border border-violet-500/30 text-violet-300">
          <Sparkles className="w-2.5 h-2.5" />
          ATIVO
        </span>
      </div>

      {/* Opções de perfis */}
      <div className="space-y-2 pt-0.5">
        {OPTIONS.map((opt) => {
          const isSelected = currentMode === opt.id;
          const Icon = opt.icon;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelectMode(opt.id)}
              className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 relative overflow-hidden active:scale-[0.99] ${
                isSelected
                  ? `${opt.activeBorder} ${opt.activeBg}`
                  : 'border-border/60 bg-secondary/40 hover:bg-secondary/70 hover:border-border'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    isSelected
                      ? `${opt.badgeStyle}`
                      : 'border-border bg-secondary/60 text-muted-foreground'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? opt.iconColor : 'text-muted-foreground'}`} strokeWidth={2.4} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-display text-sm font-bold truncate leading-tight ${
                        isSelected ? 'text-foreground' : 'text-foreground/80'
                      }`}
                    >
                      {opt.title}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9.5px] font-mono font-black tracking-wider uppercase border shrink-0 ${opt.badgeStyle}`}
                    >
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-[11.5px] text-muted-foreground font-body leading-snug truncate mt-0.5">
                    {opt.description}
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center justify-center">
                {isSelected ? (
                  <CheckCircle2 className={`w-5 h-5 ${opt.iconColor}`} strokeWidth={2.4} />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-border/80 bg-background/50" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="pt-1 border-t border-violet-500/15 flex items-center justify-between text-[10.5px] text-muted-foreground/75 font-body">
        <span>Modo atual: <strong className="text-violet-300 font-semibold">{DEV_SIMULATION_INFO[currentMode].name}</strong></span>
        <span className="text-[10px] text-zinc-400">0ms reativo</span>
      </div>
    </div>
  );
};

export default DevSubscriptionSwitcher;
