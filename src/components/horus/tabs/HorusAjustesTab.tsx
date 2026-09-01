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
        description="Defina como o Horus deve te chamar, gerencie seu número verificado e controle o que aparece por aqui."
      />
      <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
        <div className="flex items-center gap-2 mb-1">
          <Pencil className="w-4 h-4 text-emerald-400" />
          <p className="font-body text-sm font-bold">Seu nome</p>
        </div>
        <p className="font-body text-xs text-muted-foreground mb-3">
          É o seu nome de cadastro. Alterar aqui também atualiza seu perfil.
        </p>
        <input
          type="text"
          value={nomeEdit}
          onChange={(e) => setNomeEdit(e.target.value)}
          placeholder="Seu nome"
          maxLength={60}
          className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-emerald-500 outline-none font-body text-base"
        />
        <button
          onClick={saveNome}
          disabled={savingNome || !nomeEdit.trim() || nomeEdit.trim() === profileName.trim()}
          className="mt-3 w-full h-11 rounded-xl font-display font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 text-white"
          style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
        >
          {savingNome ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Salvar nome
        </button>
      </div>

      <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <Pencil className="w-4 h-4 text-primary" />
            <p className="font-body text-sm font-bold">Apelido no Horus</p>
          </div>
          <Switch
            checked={apelidoAtivo}
            onCheckedChange={(v) => setApelidoAtivo(Boolean(v))}
            disabled={!isVerified}
          />
        </div>
        <p className="font-body text-xs text-muted-foreground mb-3">
          Se ativar, o Horus vai te chamar pelo apelido. Seu nome de cadastro continua igual.
        </p>
        <input
          type="text"
          value={apelidoEdit}
          onChange={(e) => setApelidoEdit(e.target.value)}
          placeholder="Ex.: Wes, Dr. Wesley…"
          maxLength={40}
          disabled={!isVerified || !apelidoAtivo}
          className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary outline-none font-body text-base disabled:opacity-60"
        />
        <button
          onClick={saveApelido}
          disabled={
            savingApelido || !isVerified ||
            (apelidoAtivo === Boolean(linkedApelidoAtivo) &&
             apelidoEdit.trim() === (linkedApelido || '').trim())
          }
          className="mt-3 w-full h-11 rounded-xl font-display font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 bg-primary text-primary-foreground"
        >
          {savingApelido ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Salvar apelido
        </button>
        {!isVerified && (
          <p className="mt-2 font-body text-xs text-muted-foreground">
            Verifique seu WhatsApp para usar apelido.
          </p>
        )}
      </div>

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

      <button
        onClick={() => { haptic.selection(); setTab('notificacoes'); }}
        className="flex items-center gap-3 p-4 rounded-2xl bg-secondary/50 border border-border text-left"
      >
        <Bell className="w-5 h-5 text-amber-400" />
        <div className="flex-1">
          <p className="font-body text-sm font-bold">Gerenciar notificações</p>
          <p className="font-body text-xs text-muted-foreground">Escolha o que receber no WhatsApp</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </button>
    </motion.div>
  );
}
