import React, { useState, useEffect } from 'react';
import { Crown, LockKeyhole } from 'lucide-react';
import {
  getDevSimulationMode,
  setDevSimulationMode,
  DEV_SIMULATION_EVENT,
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

  const isPremium = currentMode === 'premium';

  return (
    <div
      data-dev-control="true"
      className="p-1 bg-zinc-900/80 rounded-2xl border border-white/10 shadow-lg backdrop-blur-md"
    >
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/60 rounded-xl border border-white/5">
        <button
          type="button"
          onClick={() => handleSelectMode('premium')}
          className={`h-10 rounded-lg font-display text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none active:scale-[0.98] ${
            isPremium
              ? 'bg-gradient-to-r from-amber-500/25 to-amber-400/15 border border-amber-400/60 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent'
          }`}
        >
          <Crown className={`w-3.5 h-3.5 ${isPremium ? 'text-amber-400' : 'text-zinc-500'}`} />
          <span>Premium</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectMode('free')}
          className={`h-10 rounded-lg font-display text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none active:scale-[0.98] ${
            !isPremium
              ? 'bg-gradient-to-r from-rose-500/25 to-rose-400/15 border border-rose-500/60 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent'
          }`}
        >
          <LockKeyhole className={`w-3.5 h-3.5 ${!isPremium ? 'text-rose-400' : 'text-zinc-500'}`} />
          <span>Não Assinante</span>
        </button>
      </div>
    </div>
  );
};

export default DevSubscriptionSwitcher;
