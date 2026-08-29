import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Info, LogOut, ChevronRight,
  User, LifeBuoy, Lock, Star, Gem, MessageSquareHeart,
  Pencil, Sparkles, Bell as BellIcon, Crown, CheckSquare,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfileSummary } from '@/hooks/useProfileSummary';
import { useSubscription } from '@/hooks/useSubscription';
import { useAppUsageTime } from '@/hooks/useAppUsageTime';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { isAdminEmail } from '@/lib/adminEmails';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import OpiniaoSheet from '@/components/menu/OpiniaoSheet';
import { useBodyScrollLock, resetBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { haptic } from '@/lib/nativeHaptics';

interface SideMenuProps {
  open: boolean;
  onClose: () => void;
  onNavigate?: (section: string) => void;
}

interface Item {
  id: string;
  label: string;
  icon: any;
  hint?: string;
  danger?: boolean;
}
interface Group { title?: string; items: Item[]; }

// Destaques base, agora calculados dinamicamente no render

const GROUPS: Group[] = [
  {
    title: 'Conta',
    items: [
      { id: 'opiniao', label: 'Opinião', icon: MessageSquareHeart },
      { id: 'suporte', label: 'Suporte', icon: LifeBuoy },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { id: 'sobre', label: 'Sobre o App', icon: Info },
    ],
  },
  {
    items: [
      { id: 'sair', label: 'Sair', icon: LogOut, danger: true },
    ],
  },
];

const SideMenu = ({ open, onClose, onNavigate }: SideMenuProps) => {
  const [opiniaoOpen, setOpiniaoOpen] = useState(false);
  useEscapeKey(open, onClose);
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { isPremium } = useSubscription();
  const { formattedToday, pctToday } = useAppUsageTime();
  useBodyScrollLock(open);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('sidemenu-state', { detail: { open } }));
    if (open) {
      document.body.dataset.sideMenuOpen = 'true';
      // Prefetch de rotas frequentes pra navegação instantânea
      import('@/pages/Assinatura.tsx').catch(() => {});
      import('@/pages/Perfil.tsx').catch(() => {});
    } else delete document.body.dataset.sideMenuOpen;
    return () => { delete document.body.dataset.sideMenuOpen; };
  }, [open]);

  // Se o menu desmontar aberto (ex.: navegação para outra rota logo após o
  // clique), garante que a bottom nav volte a aparecer.
  useEffect(() => {
    return () => {
      window.dispatchEvent(new CustomEvent('sidemenu-state', { detail: { open: false } }));
      delete document.body.dataset.sideMenuOpen;
    };
  }, []);

  const displayName =
    (user?.user_metadata as any)?.display_name ||
    (user?.user_metadata as any)?.full_name ||
    user?.email?.split('@')[0] ||
    'Usuário';
  const userEmail = user?.email || '';
  const { data: profileSummary } = useProfileSummary();
  const rawAvatarUrl =
    (profileSummary?.avatarUrl || undefined) ||
    (user?.user_metadata?.avatar_url as string | undefined) ||
    (user?.user_metadata?.picture as string | undefined);
  const [avatarBroken, setAvatarBroken] = useState(false);
  useEffect(() => { setAvatarBroken(false); }, [rawAvatarUrl]);
  const avatarUrl = avatarBroken ? undefined : rawAvatarUrl;
  const iniciais = (String(displayName)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n: string) => n[0]?.toUpperCase())
    .join('') || 'U');
  const isAdmin = isAdminEmail(userEmail);

  const highlightTrio: Item[] = [
    { id: 'meu-espaco', label: 'Meu Espaço', icon: User },
    { id: 'planos',  label: isPremium ? 'Minha assinatura' : 'Planos',  icon: Gem },
    { id: 'lembretes', label: 'Meus lembretes', icon: BellIcon },
    { id: 'avaliar', label: 'Avaliar o app', icon: Star },
  ];

  const handleItemClick = async (id: string) => {
    haptic.selection();
    if (id === 'sair') {
      // Fecha o menu e limpa locks imediatamente
      resetBodyScrollLock();
      onClose();
      // signOut direto — delay mínimo para garantir que o menu fechou
      setTimeout(() => {
        signOut().catch(() => {});
      }, 50);
      return;
    }

    // Avaliar o app abre a loja nativa diretamente (conforme pedido)
    if (id === 'avaliar') {
      onClose();
      
      const isIos = Capacitor.getPlatform() === 'ios';
      const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456';
      const APP_STORE_REVIEW_URL = 'https://apps.apple.com/us/app/direito-estudos-jur%C3%ADdicos/id6450845861?action=write-review';
      const PLAY_MARKET_URL = 'market://details?id=br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456';

      if (Capacitor.isNativePlatform()) {
        const primary = isIos ? APP_STORE_REVIEW_URL : PLAY_MARKET_URL;
        import('@capacitor/app-launcher').then(({ AppLauncher }) => {
          AppLauncher.openUrl({ url: primary }).catch(() => {
            window.open(isIos ? APP_STORE_REVIEW_URL : PLAY_STORE_URL, '_blank');
          });
        });
      } else {
        window.open(PLAY_STORE_URL, '_blank');
      }
      return;
    }

    const directRoutes: Record<string, string> = {
      'perfil': '/perfil',
      'planos': '/assinatura',
      'meu-espaco': '/meu-espaco',
      'suporte': '/suporte',
      'sobre': '/sobre',
      'atualizacao': '/noticias',
      'explicacao': '/explicacao-lei',
      'constituicao': '/legislacao/constituicao',
      'codigos': '/legislacao/codigos',
      'estatutos': '/legislacao/estatutos',
      'leis-ordinarias': '/legislacao/leis-ordinarias',
      'decretos': '/legislacao/decretos',
      'sumulas': '/jurisprudencia',
      'admin-monitor': '/admin',
      'admin-avaliacao-loja': '/admin-avaliacao-loja',
      'resumo-livro': '/admin/resumo-livro-audio',
      'estudar': '/estudos',
      'resumos': '/resumos-juridicos',
      'biblioteca': '/biblioteca',
      'opiniao': '/opiniao',
      'sobre': '/sobre',
      'lembretes': '/meus-lembretes',

    };

    if (directRoutes[id]) {
      navigate(directRoutes[id]);
      onClose();
      return;
    }

    onNavigate?.(id);
    onClose();
  };

  const sheet = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[2000] bg-background flex flex-col"
        >
          <PageHeader title="Menu" onBack={onClose} />

          <div className="flex-1 overflow-y-auto px-4 pb-[calc(2rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] pt-3">



              {/* Profile card */}
              <div className="rounded-3xl bg-gradient-to-br from-secondary/80 to-secondary/40 border border-border p-4 mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { navigate('/perfil'); onClose(); }}
                    className="relative shrink-0 group"
                    aria-label="Editar perfil"
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={String(displayName)}
                        referrerPolicy="no-referrer"
                        onError={() => setAvatarBroken(true)}
                        className="w-14 h-14 rounded-full object-cover border-2 border-primary/50"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full border-2 border-primary/50 bg-primary/15 flex items-center justify-center">
                        <span className="font-display text-primary text-lg font-bold">{iniciais}</span>
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center border-2 border-card">
                      <Pencil className="w-3 h-3 text-primary-foreground" />
                    </div>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-display text-base font-bold text-foreground leading-tight truncate">{displayName}</h2>
                      {isPremium ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-[10px] font-body font-bold uppercase tracking-wider text-yellow-500">
                          <Crown className="w-3 h-3" /> Premium
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-muted border border-border text-[10px] font-body font-bold uppercase tracking-wider text-muted-foreground">
                          Free
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-body truncate">{userEmail}</p>
                  </div>
                  {!isPremium && (
                    <button
                      onMouseEnter={() => { import('@/pages/Assinatura.tsx').catch(() => {}); }}
                      onPointerDown={() => { import('@/pages/Assinatura.tsx').catch(() => {}); }}
                      onClick={() => { navigate('/assinatura'); onClose(); }}
                      className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-body font-semibold whitespace-nowrap active:scale-95 transition-transform"
                    >
                      Atualizar
                    </button>
                  )}
                </div>

                {/* Study time bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-body text-muted-foreground">Tempo de estudo hoje</span>
                    <span className="text-xs font-body font-semibold text-foreground">{formattedToday}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pctToday}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>
                </div>
              </div>

              {/* Perfil · Planos · Suporte como itens de lista (mesmo estilo de "Meus lembretes"). */}
              <GroupCard>
                {highlightTrio.map((it) => (
                  <MenuRow
                    key={it.id}
                    icon={it.icon}
                    label={it.label}
                    variant={it.id === 'planos' ? 'gold' : undefined}
                    onClick={() => handleItemClick(it.id)}
                  />
                ))}
              </GroupCard>

              {/* Regular groups */}
              {GROUPS.map((g, idx) => (
                <React.Fragment key={g.title || `g-${idx}`}>
                  <GroupCard title={g.title}>
                    {g.items.map(item => (
                      <MenuRow
                        key={item.id}
                        icon={item.icon}
                        label={item.label}
                        danger={item.danger}
                        onClick={() => handleItemClick(item.id)}
                      />
                    ))}
                  </GroupCard>
                  {g.title === 'Conta' && isAdmin && (
                    <GroupCard title="Admin">

                      <MenuRow
                        icon={Lock}
                        label="Funções Admin"
                        onClick={() => { navigate('/admin-funcoes'); onClose(); }}
                      />
                    </GroupCard>
                  )}
                </React.Fragment>
              ))}


              <p className="text-center text-xs font-body text-muted-foreground pt-4 pb-2">
                Direito Prime © 2026
              </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

  );

  // Purge agressivo de todos os locks de scroll/pointer que o Radix
  // ou outros modais possam deixar no body ao desmontar abruptamente.
  const purgeBodyLocks = () => {
    resetBodyScrollLock();
    delete document.body.dataset.sideMenuOpen;
  };

  if (typeof document === 'undefined') return null;
  return createPortal(
    <>
      {sheet}
      <OpiniaoSheet open={opiniaoOpen} onClose={() => setOpiniaoOpen(false)} />
    </>,
    document.body,
  );
};

function GroupCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      {title && (
        <p className="px-3 pb-1.5 text-[11px] font-body font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </p>
      )}
      <div className="rounded-2xl bg-secondary/60 border border-border overflow-hidden divide-y divide-border/60">
        {children}
      </div>
    </div>
  );
}

function MenuRow({
  icon: Icon,
  label,
  onClick,
  danger,
  variant,
}: {
  icon: any;
  label: string;
  onClick: () => void;
  danger?: boolean;
  variant?: 'gold' | 'rose';
}) {
  if (variant === 'rose') {
    return (
      <button
        onClick={onClick}
        aria-label={label}
        className="group relative w-full flex items-center gap-3 px-4 py-[18px] text-left overflow-hidden transition-transform active:scale-[0.99] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
        style={{
          background:
            'linear-gradient(135deg, hsl(350 68% 32%) 0%, hsl(350 74% 42%) 50%, hsl(348 80% 50%) 100%)',
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 animate-[planos-shine_3.2s_ease-in-out_infinite]"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)',
          }}
        />
        <Icon className="relative w-5 h-5 text-white" strokeWidth={2.4} aria-hidden="true" />
        <span className="relative font-body text-[15px] font-bold flex-1">{label}</span>
        <ChevronRight className="relative w-4 h-4 opacity-90" strokeWidth={2.6} aria-hidden="true" />
      </button>
    );
  }
  if (variant === 'gold') {
    return (
      <button
        onClick={onClick}
        aria-label={label}
        className="group relative w-full flex items-center gap-3 px-4 py-[18px] text-left overflow-hidden transition-transform active:scale-[0.99] text-[hsl(43_80%_12%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
        style={{
          background: 'linear-gradient(135deg, hsl(45 95% 58%) 0%, hsl(43 90% 50%) 55%, hsl(40 88% 44%) 100%)',
        }}
      >
        {/* Shine reflection sweep — plays only on this row */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 animate-[planos-shine_3.2s_ease-in-out_infinite]"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)',
          }}
        />
        <Icon className="relative w-5 h-5 text-[hsl(43_80%_12%)]" strokeWidth={2.4} aria-hidden="true" />
        <span className="relative font-body text-[15px] font-bold flex-1">{label}</span>
        <span className="relative text-[10px] uppercase tracking-widest font-display font-bold px-2 py-0.5 rounded-full bg-[hsl(43_80%_12%)]/15">
          Pro
        </span>
        <ChevronRight className="relative w-4 h-4 opacity-80" strokeWidth={2.6} aria-hidden="true" />
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`w-full flex items-center gap-3 px-4 py-[18px] text-left transition-colors active:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${
        danger ? 'text-red-400 hover:text-red-300' : 'text-foreground/90 hover:bg-secondary'
      }`}
    >
      <Icon className={`w-5 h-5 shrink-0 ${danger ? 'text-red-400' : 'text-hero-panel'}`} aria-hidden="true" />
      <span className="font-body text-[15px] flex-1">{label}</span>
    </button>
  );
}

export default SideMenu;
