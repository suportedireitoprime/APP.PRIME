import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Info, LogOut, ChevronRight, ChevronDown,
  LifeBuoy, Lock, Gem,
  Pencil, Crown, Timer, Bird, Star,
  Sparkles, Scale, BookOpen, Gavel, BookMarked, Bookmark,
  Library, GraduationCap, Brain, Video, Headphones, Compass,
  NotebookPen, Flame, FileText, BookA, Wrench, CloudDownload,
  User as UserIcon, CreditCard, BellRing,
  Landmark, Shield, Columns3, PocketKnife, Map, Bot, Trophy,
  BookOpenText, Layers, Radar, Newspaper, Bell, FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  useEscapeKey(open, onClose);
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { isPremium, isTrial, expiresAt } = useSubscription();
  useBodyScrollLock(open);

  const toggleSection = (id: string) => {
    haptic.selection();
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

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
      // 1. Hórus
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

      // 3. Estudos & Prática
      'biblioteca': '/bibliotecas',
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

      // 5. Minha Conta
      'meu-espaco': '/meu-espaco',
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
          <div className="flex items-start justify-between gap-3">
            {/* Lado Esquerdo: Avatar + Identificação */}
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
                <h2 className="font-display text-base font-bold text-foreground leading-tight truncate">
                  {displayName}
                </h2>
                <p className="text-xs text-muted-foreground font-body truncate mt-0.5">
                  {userEmail}
                </p>
              </div>
            </div>

            {/* Lado Direito: Tag Premium elegante posicionada um pouco mais para cima com animação de reflexo */}
            <div className="shrink-0 -mt-1 flex items-center">
              {isTrial ? (
                <TrialBadge expiresAt={expiresAt} />
              ) : isPremium ? (
                <div className="relative group overflow-hidden inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-400/50 bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-amber-500/20 text-[10.5px] font-body font-black uppercase tracking-wider text-amber-300 shadow-md shadow-amber-500/15">
                  {/* Faixa de reflexo luminoso dinâmico (Shine reflection sweep) */}
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
              ) : (
                <div className="flex items-center gap-2">
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
          </div>
        </div>

        {/* Ramais por Categoria (Accordion Interativo que abre as categorias dentro) */}
        <div className="space-y-3">
          {[
            {
              id: 'horus',
              title: 'Hórus',
              icon: Bird,
              iconColor: 'text-rose-500',
              countLabel: '3 funções',
              items: [
                { id: 'assistente-horus', label: 'Assistente Hórus', icon: Bird, iconColor: 'text-rose-500' },
                { id: 'me-explique', label: 'Me Explique (IA)', icon: Sparkles, iconColor: 'text-amber-400' },
                { id: 'chat-juridico', label: 'Chat Jurídico', icon: Bot, iconColor: 'text-cyan-400' },
              ],
            },
            {
              id: 'vademecum',
              title: 'Vade Mecum',
              icon: Scale,
              iconColor: 'text-amber-400',
              countLabel: '8 categorias',
              items: [
                { id: 'vademecum', label: 'Vade Mecum Geral', icon: Scale, iconColor: 'text-amber-400' },
                { id: 'constituicao', label: 'Constituição', icon: Landmark, iconColor: 'text-yellow-500' },
                { id: 'codigos', label: 'Códigos', icon: BookOpen, iconColor: 'text-blue-400' },
                { id: 'estatutos', label: 'Estatutos', icon: Shield, iconColor: 'text-rose-400' },
                { id: 'jurisprudencia', label: 'Jurisprudência', icon: Gavel, iconColor: 'text-emerald-400' },
                { id: 'leis-ordinarias', label: 'Leis Ordinárias', icon: Columns3, iconColor: 'text-orange-400' },
                { id: 'legislacao-especial', label: 'Legislação Especial', icon: PocketKnife, iconColor: 'text-indigo-400' },
                { id: 'legislacao-estadual', label: 'Legislação Estadual', icon: Map, iconColor: 'text-sky-400' },
              ],
            },
            {
              id: 'estudos',
              title: 'Estudos & Prática',
              icon: GraduationCap,
              iconColor: 'text-sky-400',
              countLabel: '12 funções',
              items: [
                { id: 'biblioteca', label: 'Biblioteca Digital', icon: Library, iconColor: 'text-emerald-400' },
                { id: 'questoes', label: 'Questões', icon: GraduationCap, iconColor: 'text-sky-400' },
                { id: 'simulados', label: 'Simulados', icon: Trophy, iconColor: 'text-amber-400' },
                { id: 'flashcards', label: 'Flashcards', icon: Brain, iconColor: 'text-violet-400' },
                { id: 'videoaulas', label: 'Videoaulas', icon: Video, iconColor: 'text-rose-400' },
                { id: 'audioaulas', label: 'Audioaulas', icon: Headphones, iconColor: 'text-amber-400' },
                { id: 'audiobooks', label: 'Audiobooks', icon: BookOpenText, iconColor: 'text-emerald-400' },
                { id: 'mapas-mentais', label: 'Mapas Mentais', icon: Compass, iconColor: 'text-pink-400' },
                { id: 'lei-seca', label: 'Lei Seca', icon: NotebookPen, iconColor: 'text-yellow-400' },
                { id: 'pilulas', label: 'Pílulas', icon: Flame, iconColor: 'text-orange-400' },
                { id: 'resumos-juridicos', label: 'Resumos Jurídicos', icon: FileText, iconColor: 'text-teal-400' },
                { id: 'aulas-interativas', label: 'Aulas Interativas', icon: Layers, iconColor: 'text-indigo-400' },
              ],
            },
            {
              id: 'ferramentas',
              title: 'Ferramentas & Consulta',
              icon: Wrench,
              iconColor: 'text-zinc-400',
              countLabel: '6 recursos',
              items: [
                { id: 'dicionario', label: 'Dicionário Jurídico', icon: BookA, iconColor: 'text-cyan-400' },
                { id: 'radares', label: 'Radares de Leis', icon: Radar, iconColor: 'text-blue-400' },
                { id: 'noticias', label: 'Notícias Jurídicas', icon: Newspaper, iconColor: 'text-pink-400' },
                { id: 'lembretes', label: 'Central de Lembretes', icon: Bell, iconColor: 'text-amber-400' },
                { id: 'modo-offline', label: 'Modo Offline', icon: CloudDownload, iconColor: 'text-emerald-400' },
                { id: 'ferramentas', label: 'Todas as Ferramentas', icon: Wrench, iconColor: 'text-zinc-400' },
              ],
            },
            {
              id: 'conta',
              title: 'Minha Conta',
              icon: UserIcon,
              iconColor: 'text-slate-300',
              countLabel: '6 opções',
              items: [
                { id: 'meu-espaco', label: 'Meu Espaço', icon: FolderOpen, iconColor: 'text-purple-400' },
                { id: 'perfil', label: 'Meu Perfil', icon: UserIcon, iconColor: 'text-slate-300' },
                { id: 'planos', label: isPremium ? 'Minha Assinatura' : 'Minha Assinatura / Planos', icon: Gem, iconColor: 'text-amber-400', hint: isPremium ? 'Ativa' : 'Atualizar' },
                { id: 'avaliar', label: 'Avaliar Aplicativo', icon: Star, iconColor: 'text-amber-400 fill-amber-400/20' },
                { id: 'suporte', label: 'Suporte', icon: LifeBuoy, iconColor: 'text-pink-400' },
                { id: 'sobre', label: 'Sobre o App', icon: Info, iconColor: 'text-blue-400', hint: appVersion },
              ],
            },
            ...(isAdmin ? [{
              id: 'admin',
              title: 'Painel Admin',
              icon: Lock,
              iconColor: 'text-red-400',
              countLabel: '3 funções',
              items: [
                { id: 'admin-funcoes', label: 'Funções Admin', icon: Lock, iconColor: 'text-red-400' },
                { id: 'admin-assinantes', label: 'Painel de Assinantes', icon: CreditCard, iconColor: 'text-emerald-400' },
                { id: 'admin-push', label: 'Notificações Push', icon: BellRing, iconColor: 'text-amber-400' },
              ],
            }] : []),
          ].map((ramal) => {
            const isOpen = Boolean(openSections[ramal.id]);
            const CatIcon = ramal.icon;

            return (
              <div
                key={ramal.id}
                className="rounded-2xl bg-secondary/60 border border-border/80 overflow-hidden transition-all duration-200 shadow-sm"
              >
                {/* Linha que abre/fecha o ramal */}
                <button
                  type="button"
                  onClick={() => toggleSection(ramal.id)}
                  aria-expanded={isOpen}
                  className="w-full min-h-[58px] flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors active:bg-muted/60 hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors border",
                      isOpen
                        ? "bg-primary/20 border-primary/40 text-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.2)]"
                        : "bg-muted/40 border-border/60 text-muted-foreground"
                    )}>
                      <CatIcon className={cn("w-5 h-5", ramal.iconColor)} strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-display text-[15px] font-bold text-foreground block truncate">
                        {ramal.title}
                      </span>
                      <span className="text-[11px] font-body text-muted-foreground block truncate mt-0.5">
                        {ramal.countLabel}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn(
                      "text-[10.5px] font-body font-semibold px-2 py-0.5 rounded-full border transition-colors",
                      isOpen
                        ? "bg-primary/15 border-primary/30 text-primary"
                        : "bg-muted/30 border-border/50 text-muted-foreground/70"
                    )}>
                      {ramal.items.length}
                    </span>
                    <ChevronDown
                      className={cn(
                        "w-5 h-5 text-muted-foreground/60 transition-transform duration-300",
                        isOpen && "rotate-180 text-primary"
                      )}
                      strokeWidth={2.4}
                    />
                  </div>
                </button>

                {/* Subitens do Ramal */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key={`ramal-${ramal.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden border-t border-border/60 bg-black/30"
                    >
                      <div className="py-1 px-1.5 divide-y divide-border/30">
                        {ramal.items.map((item) => {
                          const ItemIcon = item.icon;
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleItemClick(item.id)}
                              className="w-full min-h-[46px] flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-white/5 active:bg-white/10 group"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1 pl-1">
                                <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center shrink-0 group-hover:border-primary/30 transition-colors">
                                  <ItemIcon
                                    className={cn("w-4 h-4 shrink-0", item.iconColor || "text-primary")}
                                    strokeWidth={2.2}
                                  />
                                </div>
                                <span className="font-body text-[14px] font-medium text-foreground/90 truncate group-hover:text-foreground">
                                  {item.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {item.hint && (
                                  <span className="text-[10px] font-mono font-semibold text-zinc-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                                    {item.hint}
                                  </span>
                                )}
                                <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" strokeWidth={2.2} />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Card de Sessão: Sair */}
        <div className="pt-1">
          <div className="rounded-2xl bg-secondary/60 border border-border overflow-hidden">
            <MenuRow
              icon={LogOut}
              label="Sair"
              danger
              onClick={() => handleItemClick('sair')}
            />
          </div>
        </div>

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
      className={`w-full min-h-[48px] flex items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors active:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${
        danger ? 'text-red-400 hover:text-red-300' : 'text-foreground/90 hover:bg-secondary'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Icon
          className={`w-5 h-5 shrink-0 ${
            danger
              ? 'text-red-400'
              : iconColor || 'text-primary'
          }`}
          strokeWidth={2.2}
          aria-hidden="true"
        />
        <span className="font-body text-[14.5px] font-medium flex-1 truncate">{label}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {hint && (
          <span className="text-[11px] font-mono font-semibold text-zinc-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
            {hint}
          </span>
        )}
        {!danger && (
          <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" strokeWidth={2.4} aria-hidden="true" />
        )}
      </div>
    </button>
  );
}

function TrialBadge({ expiresAt }: { expiresAt: string | null }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('EXPIRADO');
        return;
      }
      const totalHours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (totalHours > 24) {
        setTimeLeft(`TESTE: ${totalHours} HORAS RESTANTES`);
      } else {
        setTimeLeft(`TESTE: ${totalHours}H E ${mins}M RESTANTES`);
      }
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-sky-500/40 bg-sky-500/10 text-[10px] font-body font-bold tracking-wider text-sky-400 shadow-sm shadow-sky-500/10 whitespace-nowrap">
      <Timer className="w-3 h-3 text-sky-400" strokeWidth={2.4} /> {timeLeft}
    </span>
  );
}

export default SideMenu;
