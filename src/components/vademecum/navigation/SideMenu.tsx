import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Info, LogOut, ChevronRight,
  LifeBuoy, Lock, Gem,
  Pencil, Crown, Timer, Star,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/hooks/useAuth';
import { useProfileSummary } from '@/hooks/useProfileSummary';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { isAdminEmail } from '@/lib/adminEmails';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import OpiniaoSheet from '@/components/menu/OpiniaoSheet';
import AvaliarAppSheet from '@/components/vademecum/sheets/AvaliarAppSheet';
import { useBodyScrollLock, resetBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { haptic } from '@/lib/nativeHaptics';

interface SideMenuProps {
  open: boolean;
  onClose: () => void;
  onNavigate?: (section: string) => void;
}

const SideMenu = ({ open, onClose, onNavigate }: SideMenuProps) => {
  const [opiniaoOpen, setOpiniaoOpen] = useState(false);
  const [avaliarOpen, setAvaliarOpen] = useState(false);
  const [appVersion, setAppVersion] = useState<string>('v1.0.0');
  useEscapeKey(open, onClose);
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { isPremium, isTrial, expiresAt } = useSubscription();
  useBodyScrollLock(open);

  // Obter versão da build nativa (Android, iOS ou Web) sem número de build
  useEffect(() => {
    let cancel = false;
    const obterVersao = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          const { App: CapacitorApp } = await import('@capacitor/app');
          const info = await CapacitorApp.getInfo();
          if (!cancel && info?.version) {
            setAppVersion(`v${info.version}`);
          }
        } else {
          setAppVersion('v1.0.0');
        }
      } catch (err) {
        if (!cancel) setAppVersion('v1.0.0');
      }
    };
    void obterVersao();
    return () => { cancel = true; };
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('sidemenu-state', { detail: { open } }));
    if (open) {
      document.body.dataset.sideMenuOpen = 'true';
      import('@/pages/assinatura/Assinatura.tsx').catch(() => {});
      import('@/pages/perfil/Perfil.tsx').catch(() => {});
    } else delete document.body.dataset.sideMenuOpen;
    return () => { delete document.body.dataset.sideMenuOpen; };
  }, [open]);

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

  const handleItemClick = async (id: string) => {
    haptic.selection();
    if (id === 'sair') {
      resetBodyScrollLock();
      onClose();
      navigate('/auth', { replace: true });
      setTimeout(() => {
        signOut().catch(() => {});
      }, 50);
      return;
    }

    if (id === 'avaliar') {
      setAvaliarOpen(true);
      return;
    }

    if (id === 'sugestao' || id === 'opiniao') {
      setOpiniaoOpen(true);
      return;
    }

    const directRoutes: Record<string, string> = {
      // 1. IA & Chat
      'horus': '/assistente-horus',
      'assistente-horus': '/assistente-horus',
      'me-explique': '/me-explique',
      'chat-juridico': '/chat-juridico',

      // 2. Vade Mecum
      'vademecum': '/vade-mecum',
      'constituicao': '/legislacao/constituicao',
      'codigos': '/vade-mecum/codigos',
      'estatutos': '/legislacao/estatuto',
      'jurisprudencia': '/jurisprudencia',
      'leis-ordinarias': '/legislacao/lei-ordinaria',
      'legislacao-especial': '/vade-mecum/especiais',
      'legislacao-estadual': '/legislacao-estadual',

      // 3. Biblioteca
      'biblioteca': '/bibliotecas',
      'biblioteca-todas': '/bibliotecas',
      'biblioteca-em-alta': '/bibliotecas/em-alta',
      'biblioteca-classicos': '/bibliotecas/classicos',
      'biblioteca-meus-livros': '/pessoal/livros',
      'biblioteca-offline': '/modo-offline/livros',

      // 4. Estudos & Prática
      'questoes': '/questoes',
      'simulados': '/simulados',
      'flashcards': '/flashcards',
      'videoaulas': '/videoaulas',
      'audioaulas': '/audioaulas',
      'audiobooks': '/audiobooks',
      'mapas-mentais': '/mapas-mentais',
      'lei-seca': '/lei-seca',
      'pilulas': '/pilulas',
      'resumos-juridicos': '/resumos-juridicos',
      'aulas-interativas': '/aulas',

      // 4. Ferramentas & Consulta
      'dicionario': '/ferramentas/dicionario',
      'radares': '/radares',
      'noticias': '/noticias',
      'lembretes': '/lembretes',
      'modo-offline': '/modo-offline',
      'ferramentas': '/ferramentas',

      // 5. Conta & Sistema
      'perfil': '/perfil',
      'planos': '/assinatura',
      'suporte': '/suporte',
      'sobre': '/sobre',

      // 6. Admin
      'admin-funcoes': '/admin-funcoes',
      'admin-assinantes': '/admin-assinantes',
      'admin-push': '/admin-push',
    };

    if (directRoutes[id]) {
      navigate(directRoutes[id]);
      onClose();
      return;
    }

    onNavigate?.(id);
    onClose();
  };

  const sheet = open ? (
    <div className="fixed inset-0 z-[2000] bg-background flex flex-col">
      <PageHeader title="Menu" onBack={onClose} />

      <div className="flex-1 overflow-y-auto px-4 pb-[calc(2rem+var(--sai-bottom))] pt-3 space-y-4">
        {/* Profile card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-secondary/80 to-secondary/40 border border-border p-4">
          <div className="flex items-center justify-between gap-3">
            {/* Lado Esquerdo: Avatar + Identificação Completa (Sem abreviar o nome) */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
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
                    className="w-14 h-14 rounded-full object-cover border-2 border-primary/50 shadow-md"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full border-2 border-primary/50 bg-primary/15 flex items-center justify-center shadow-md">
                    <span className="font-display text-primary text-lg font-bold">{iniciais}</span>
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center border-2 border-card shadow-sm">
                  <Pencil className="w-3 h-3 text-primary-foreground" />
                </div>
              </button>

              <div className="min-w-0 flex-1">
                <h2 className="font-display text-base font-bold text-foreground leading-snug">
                  {displayName}
                </h2>
                <p className="text-xs text-muted-foreground font-body truncate mt-0.5">
                  {userEmail}
                </p>
              </div>
            </div>

            {/* Lado Direito: Tag Premium (se for assinante pago definitivo) */}
            {!isTrial && isPremium && (
              <div className="shrink-0 -mt-1 flex items-center">
                <div className="relative group overflow-hidden inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-400/50 bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-amber-500/20 text-[10.5px] font-body font-black uppercase tracking-wider text-amber-300 shadow-md shadow-amber-500/15">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 -left-full w-full -skew-x-12 animate-[planos-shine_2.8s_ease-in-out_infinite]"
                    style={{
                      background:
                        'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.75) 50%, transparent 100%)',
                    }}
                  />
                  <Crown className="relative w-3.5 h-3.5 text-amber-400 fill-amber-400/20 shrink-0 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" strokeWidth={2.4} />
                  <span className="relative drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">Premium</span>
                </div>
              </div>
            )}

            {!isTrial && !isPremium && (
              <div className="shrink-0 -mt-1 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-muted border border-border text-[10px] font-body font-bold uppercase tracking-wider text-muted-foreground">
                  Free
                </span>
                <button
                  onMouseEnter={() => { import('@/pages/assinatura/Assinatura.tsx').catch(() => {}); }}
                  onPointerDown={() => { import('@/pages/assinatura/Assinatura.tsx').catch(() => {}); }}
                  onClick={() => { navigate('/assinatura'); onClose(); }}
                  className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-body font-semibold whitespace-nowrap active:opacity-70 transition-transform shadow-sm"
                >
                  Atualizar
                </button>
              </div>
            )}
          </div>

          {/* Faixa Minimalista de Teste: 100% da largura, sem espremer ou abreviar o nome */}
          {isTrial && (
            <TrialStrip
              expiresAt={expiresAt}
              onAssinar={() => {
                navigate('/assinatura');
                onClose();
              }}
            />
          )}
        </div>

        {/* Card com as funções principais: Minha assinatura, Avaliar aplicativo, Suporte, Sobre o app */}
        <GroupCard title="Conta & Suporte">
          <MenuRow
            icon={Gem}
            iconColor="text-red-400"
            label={isPremium ? "Minha assinatura" : "Minha assinatura / Planos"}
            onClick={() => handleItemClick('planos')}
          />
          <MenuRow
            icon={Star}
            iconColor="text-yellow-400 fill-yellow-400/25"
            label="Avaliar aplicativo"
            onClick={() => handleItemClick('avaliar')}
          />
          <MenuRow
            icon={LifeBuoy}
            iconColor="text-red-400"
            label="Suporte"
            onClick={() => handleItemClick('suporte')}
          />
          <MenuRow
            icon={Info}
            iconColor="text-red-400"
            label="Sobre o App"
            hint={appVersion}
            onClick={() => handleItemClick('sobre')}
          />
        </GroupCard>

        {/* Card Exclusivo do Administrador */}
        {isAdmin && (
          <GroupCard title="Admin">
            <MenuRow
              icon={Lock}
              iconColor="text-red-400"
              label="Funções Admin"
              onClick={() => handleItemClick('admin-funcoes')}
            />
          </GroupCard>
        )}

        {/* Card de Sessão: Sair */}
        <GroupCard>
          <MenuRow
            icon={LogOut}
            label="Sair"
            danger
            onClick={() => handleItemClick('sair')}
          />
        </GroupCard>

        <div className="text-center pt-4 pb-2 space-y-1">
          <p className="text-xs font-mono font-medium text-muted-foreground/80">
            Versão do aplicativo: {appVersion}
          </p>
          <p className="text-[11px] font-body text-muted-foreground/50">
            Direito Prime © 2026
          </p>
        </div>
      </div>
    </div>
  ) : null;

  if (typeof document === 'undefined') return null;
  return createPortal(
    <>
      {sheet}
      <OpiniaoSheet open={opiniaoOpen} onClose={() => setOpiniaoOpen(false)} />
      <AvaliarAppSheet
        open={avaliarOpen}
        onClose={() => setAvaliarOpen(false)}
        onFeedback={() => {
          setOpiniaoOpen(true);
        }}
      />
    </>,
    document.body,
  );
};

function GroupCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      {title && (
        <p className="px-3 text-[11px] font-body font-semibold text-muted-foreground uppercase tracking-wider">
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
  iconColor,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  danger?: boolean;
  iconColor?: string;
  hint?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`w-full flex items-center justify-between gap-3 px-4 py-[18px] text-left transition-colors active:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${
        danger ? 'text-red-400 hover:text-red-300' : 'text-foreground/90 hover:bg-secondary'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Icon
          className={`w-5 h-5 shrink-0 drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] ${
            iconColor?.includes('yellow')
              ? 'drop-shadow-[0_0_6px_rgba(250,204,21,0.4)]'
              : 'drop-shadow-[0_0_7px_rgba(248,113,113,0.45)]'
          } ${
            danger
              ? 'text-red-400'
              : iconColor || 'text-red-400'
          }`}
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <span className="font-body text-[15px] font-medium flex-1 truncate">{label}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {hint && (
          <span className="text-[11px] font-mono font-semibold text-zinc-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
            {hint}
          </span>
        )}
        {!danger && (
          <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" strokeWidth={1.8} aria-hidden="true" />
        )}
      </div>
    </button>
  );
}

function TrialStrip({
  expiresAt,
  onAssinar,
}: {
  expiresAt: string | null;
  onAssinar: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Teste encerrado');
        return;
      }
      const totalHours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (totalHours > 24) {
        setTimeLeft(`${totalHours}h restantes`);
      } else if (totalHours > 0) {
        setTimeLeft(`${totalHours}h ${mins}m restantes`);
      } else {
        setTimeLeft(`${mins}m restantes`);
      }
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className="mt-3 pt-2.5 border-t border-amber-400/40 flex items-center justify-between gap-2 bg-gradient-to-r from-amber-500/25 via-amber-400/15 to-amber-500/25 shadow-[inset_0_1px_0_rgba(251,191,36,0.3)] -mx-4 -mb-4 px-4 py-2.5 rounded-b-3xl">
      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] whitespace-nowrap min-w-0 shrink-0">
        <Timer className="w-3.5 h-3.5 text-amber-400 shrink-0 drop-shadow-[0_0_6px_rgba(251,191,36,0.7)]" strokeWidth={2.4} />
        <span className="whitespace-nowrap">{timeLeft}</span>
      </div>
      <button
        type="button"
        onClick={onAssinar}
        className="relative group overflow-hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-400/70 bg-gradient-to-r from-amber-500/40 via-amber-400/25 to-amber-500/40 text-[10.5px] font-black uppercase tracking-wider text-amber-200 shadow-md shadow-amber-500/25 active:scale-95 transition-all cursor-pointer shrink-0"
      >
        {/* Faixa de reflexo luminoso dinâmico (Shine reflection sweep) */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -left-full w-full -skew-x-12 animate-[planos-shine_2.8s_ease-in-out_infinite]"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.85) 50%, transparent 100%)',
          }}
        />
        <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30 shrink-0 drop-shadow-[0_0_6px_rgba(251,191,36,0.7)]" strokeWidth={2.4} />
        <span className="relative drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)] whitespace-nowrap">ASSINAR PLANO →</span>
      </button>
    </div>
  );
}

export default SideMenu;
