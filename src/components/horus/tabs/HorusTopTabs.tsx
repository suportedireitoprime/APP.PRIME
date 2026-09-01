import { motion } from 'framer-motion';
import { Home, Gavel, Bell, Settings } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

export type HorusTab = 'main' | 'funcoes' | 'notificacoes' | 'ajustes';

export const TOP_TABS: Array<{ id: HorusTab; label: string; icon: any }> = [
  { id: 'main', label: 'Início', icon: Home },
  { id: 'funcoes', label: 'Funções', icon: Gavel },
  { id: 'notificacoes', label: 'Alertas', icon: Bell },
  { id: 'ajustes', label: 'Ajustes', icon: Settings },
];

export function HorusTopTabs({ active, onChange }: { active: HorusTab; onChange: (t: HorusTab) => void }) {
  return (
    <div className="px-4">
      <div className="relative flex items-center gap-1 p-1 rounded-2xl bg-secondary/70 border border-border">
        {TOP_TABS.map((t) => {
          const Icon = t.icon;
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => { haptic.selection(); onChange(t.id); }}
              data-track="horus_tab_switch"
              data-tab={t.id}
              className="relative flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-body text-[12px] font-semibold transition-colors"
            >
              {isActive && (
                <motion.span
                  layoutId="horus-top-tab-pill"
                  className="absolute inset-0 rounded-xl bg-primary shadow-sm"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className={`relative w-4 h-4 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} strokeWidth={2} />
              <span className={`relative ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
