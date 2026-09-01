import { motion } from 'framer-motion';
import { Bell, ShieldAlert, Loader2, Radio, Newspaper, Gavel, BookOpen, Rocket, Star } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import HorusSectionHero from '@/components/horus/HorusSectionHero';
import { HorusTopTabs, HorusTab } from './HorusTopTabs';
import { NotifPrefs } from '@/services/horusService';
import { HORUS_COLOR } from './HorusFuncoesTab';

const NOTIF_ITEMS: Array<{ key: keyof NotifPrefs; icon: any; color: string; label: string; desc: string }> = [
  { key: 'radar_leis', icon: Radio, color: 'violet', label: 'Radar de Leis', desc: 'Novas leis e decretos publicados no DOU.' },
  { key: 'boletim_juridico', icon: Newspaper, color: 'sky', label: 'Boletim jurídico diário', desc: 'Resumo diário das principais notícias do Direito.' },
  { key: 'boletim_leis', icon: Gavel, color: 'amber', label: 'Boletim de leis diárias', desc: 'Boletim em vídeo das leis publicadas no dia.' },
  { key: 'blog_novos_posts', icon: BookOpen, color: 'cyan', label: 'Novos artigos do blog', desc: 'Aviso sempre que um novo post for publicado.' },
  { key: 'app_atualizacoes', icon: Rocket, color: 'emerald', label: 'Atualizações do aplicativo', desc: 'Novidades, novas versões e melhorias.' },
  { key: 'artigo_favorito', icon: Star, color: 'rose', label: 'Mudança em artigo favorito', desc: 'Quando um artigo que você favoritou for alterado.' },
];

interface HorusNotificacoesTabProps {
  tab: HorusTab;
  setTab: (t: HorusTab) => void;
  isVerified: boolean;
  statusLoading: boolean;
  prefs: NotifPrefs;
  savingKey: keyof NotifPrefs | null;
  savePref: (key: keyof NotifPrefs, value: boolean, requireVerification: () => void) => void;
  onRequestVerify: () => void;
}

export function HorusNotificacoesTab({
  tab, setTab, isVerified, statusLoading, prefs, savingKey, savePref, onRequestVerify
}: HorusNotificacoesTabProps) {
  return (
    <motion.div
      key="notificacoes"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      className="flex flex-col gap-2.5"
    >
      <HorusTopTabs active={tab} onChange={setTab} />
      <div className="px-4 pt-2" />
      <HorusSectionHero
        icon={Bell}
        eyebrow="Central de avisos"
        title="Notificações no WhatsApp"
        description="Escolha o que o Horus vai te avisar: leis novas, boletins, blog e atualizações. Ative ou desative quando quiser."
      />
      {!isVerified && !statusLoading && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/40 mb-2">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="font-body text-xs text-amber-300 flex-1 leading-snug">
            Verifique seu WhatsApp para começar a receber estas notificações.
          </p>
        </div>
      )}
      {NOTIF_ITEMS.map((n, i) => {
        const Icon = n.icon;
        const checked = prefs[n.key];
        const saving = savingKey === n.key;
        return (
          <motion.label
            key={n.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center gap-3 p-4 rounded-2xl bg-secondary/50 border border-border cursor-pointer"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${HORUS_COLOR[n.color].bg}`}>
              <Icon className={`w-5 h-5 ${HORUS_COLOR[n.color].text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-sm font-bold leading-tight">{n.label}</p>
              <p className="font-body text-xs text-muted-foreground leading-snug mt-0.5 line-clamp-2">{n.desc}</p>
            </div>
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground shrink-0" />
            ) : (
              <Switch
                checked={checked}
                onCheckedChange={(v) => savePref(n.key, v, onRequestVerify)}
                disabled={!isVerified}
              />
            )}
          </motion.label>
        );
      })}
      <p className="font-body text-xs text-muted-foreground mt-3 px-1 leading-snug">
        As notificações são enviadas pelo WhatsApp do Horus. Você pode desativar a qualquer momento.
      </p>
    </motion.div>
  );
}
