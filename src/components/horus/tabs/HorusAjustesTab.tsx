import { motion } from 'framer-motion';
import { Settings, Pencil, ShieldCheck, RefreshCw, Bell, ChevronRight, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import HorusSectionHero from '@/components/horus/HorusSectionHero';
import { HorusTopTabs, HorusTab } from './HorusTopTabs';
import { haptic } from '@/lib/nativeHaptics';

interface HorusAjustesTabProps {
  tab: HorusTab;
  setTab: (t: HorusTab) => void;
  isVerified: boolean;
  profileName: string;
  nomeEdit: string;
  setNomeEdit: (v: string) => void;
  savingNome: boolean;
  saveNome: () => void;
  apelidoAtivo: boolean;
  setApelidoAtivo: (v: boolean) => void;
  apelidoEdit: string;
  setApelidoEdit: (v: string) => void;
  savingApelido: boolean;
  saveApelido: () => void;
  linkedApelidoAtivo?: boolean;
  linkedApelido?: string;
  linkedPhone?: string;
  onRequestVerify: () => void;
}

export function HorusAjustesTab({
  tab, setTab, isVerified, profileName,
  nomeEdit, setNomeEdit, savingNome, saveNome,
  apelidoAtivo, setApelidoAtivo, apelidoEdit, setApelidoEdit, savingApelido, saveApelido,
  linkedApelidoAtivo, linkedApelido, linkedPhone, onRequestVerify
}: HorusAjustesTabProps) {
  return (
    <motion.div
      key="ajustes"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      className="flex flex-col gap-4"
    >
      <HorusTopTabs active={tab} onChange={setTab} />
      <div className="px-4 pt-2" />
      <HorusSectionHero
        icon={Settings}
        eyebrow="Personalização"
        title="Ajustes do Horus"
        description="Gerencie seu número de WhatsApp verificado."
      />

      <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-orange-400" />
          <p className="font-body text-sm font-bold">Número no WhatsApp</p>
        </div>
        {isVerified ? (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-body text-base font-semibold truncate">{linkedPhone}</p>
              <p className="font-body text-xs text-orange-400">Verificado</p>
            </div>
            <button
              onClick={() => { haptic.selection(); onRequestVerify(); }}
              className="h-10 px-3 rounded-lg bg-background border border-border font-body text-sm font-semibold flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw className="w-4 h-4" /> Trocar
            </button>
          </div>
        ) : (
          <button
            onClick={() => { haptic.selection(); onRequestVerify(); }}
            className="w-full h-11 rounded-xl font-display font-bold text-sm text-white"
            style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
          >
            Verificar agora
          </button>
        )}
      </div>
    </motion.div>
  );
}
