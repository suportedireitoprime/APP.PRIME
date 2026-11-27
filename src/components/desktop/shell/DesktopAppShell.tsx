import { memo, useState, useEffect, useMemo, useCallback, Suspense, type ReactNode, type ElementType } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  Home,
  Scale,
  GraduationCap,
  ListChecks,
  Layers,
  Library,
  NotebookPen,
  Headphones,
  Video,
  Clapperboard,
  Radar,
  Newspaper,
  Gavel,
  User as UserIcon,
  CreditCard,
  LifeBuoy,
  LogOut,
  Search,
  Bell,
  Heart,
  Bird,
  PanelLeftClose,
  PanelLeftOpen,
  Lock,
} from 'lucide-react';
import { useIsDesktop } from '@/hooks/use-desktop';
import { useAuth } from '@/hooks/useAuth';
import { useProfileSummary } from '@/hooks/useProfileSummary';
import { isAdminEmail } from '@/lib/adminEmails';
import { pickAsset, srcOf } from '@/lib/assetUrl';
import primeLogoAsset from '@/assets/logo-direitoprime-v2.webp.asset.json';
import primeLogoBundled from '@/assets/bundled/logo-direitoprime-v2.webp';
import { getFavoritos } from '@/lib/leisFavoritos';
import { tipoToSlug, leiToSlug } from '@/lib/legislacaoSlugs';
import { pushRecente } from '@/lib/leisRecentes';
import { lazyWithRetry } from '@/utils/lazyWithRetry';
import NotificationsSheet, { useUnreadNotifCount } from '@/components/vademecum/outros/NotificationsSheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DesktopCommandPalette } from './DesktopCommandPalette';

const SearchOverlay = lazyWithRetry(() => import('@/components/vademecum/overlays/SearchOverlay'));
const AssistenteOverlay = lazyWithRetry(() => import('@/components/vademecum/overlays/AssistenteOverlay'));

const primeLogo = pickAsset(primeLogoBundled, srcOf(primeLogoAsset));

const EXCLUDED_EXACT = new Set<string>([
  '/auth',
  '/landing',
  '/privacidade',
  '/termos',
  '/excluir-conta',
  '/suporte-publico',
  '/reset-password',
  '/onboarding',
]);

const EXCLUDED_PREFIXES = ['/desktop-link/', '/aprender/aula/', '/questoes/praticar', '/questoes/revisar'];

interface NavItem {
  id: string;
  label: string;
  icon: ElementType;
  route: string;
  matchPrefixes?: string[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Principal',
    items: [
      { id: 'inicio', label: 'Início', icon: Home, route: '/' },
      { id: 'vademecum', label: 'Vade Mecum', icon: Scale, route: '/vade-mecum', matchPrefixes: ['/vade-mecum', '/legislacao'] },
      { id: 'aulas', label: 'Aulas', icon: GraduationCap, route: '/aulas', matchPrefixes: ['/aulas', '/aprender'] },
    ],
  },
  {
    label: 'Praticar',
    items: [
      { id: 'questoes', label: 'Questões', icon: ListChecks, route: '/questoes', matchPrefixes: ['/questoes', '/estudar'] },
      { id: 'flashcards', label: 'Flashcards', icon: Layers, route: '/flashcards', matchPrefixes: ['/flashcards'] },
      { id: 'lei-seca', label: 'Lei Seca', icon: Scale, route: '/lei-seca', matchPrefixes: ['/lei-seca'] },
    ],
  },
  {
    label: 'Acervo',
    items: [
      { id: 'biblioteca', label: 'Biblioteca', icon: Library, route: '/bibliotecas', matchPrefixes: ['/bibliotecas', '/biblioteca'] },
      { id: 'resumos', label: 'Resumos', icon: NotebookPen, route: '/resumos-juridicos', matchPrefixes: ['/resumos'] },
      { id: 'audioleis', label: 'Ouça a Lei', icon: Headphones, route: '/audioleis', matchPrefixes: ['/audioleis', '/audioaulas'] },
      { id: 'videoaulas', label: 'Videoaulas', icon: Video, route: '/videoaulas', matchPrefixes: ['/videoaulas'] },
      { id: 'animacoes', label: 'Animações', icon: Clapperboard, route: '/animacoes', matchPrefixes: ['/animacoes'] },
    ],
  },
  {
    label: 'Mais',
    items: [
      { id: 'radar', label: 'Radar', icon: Radar, route: '/radar-360', matchPrefixes: ['/radar', '/noticias', '/boletins'] },
      { id: 'blog', label: 'Blog', icon: Newspaper, route: '/blog', matchPrefixes: ['/blog'] },
      { id: 'ferramentas', label: 'Ferramentas', icon: Gavel, route: '/ferramentas', matchPrefixes: ['/ferramentas'] },
    ],
  },
];

const ROUTE_TITLES: Array<{ prefix: string; title: string }> = [
  { prefix: '/vade-mecum', title: 'Vade Mecum' },
  { prefix: '/legislacao', title: 'Legislação' },
  { prefix: '/aulas', title: 'Aulas em Trilha' },
  { prefix: '/questoes', title: 'Questões Comentadas' },
  { prefix: '/flashcards', title: 'Flashcards' },
  { prefix: '/lei-seca', title: 'Lei Seca' },
  { prefix: '/bibliotecas', title: 'Biblioteca' },
  { prefix: '/resumos', title: 'Resumos Jurídicos' },
  { prefix: '/audioleis', title: 'Ouça a Lei' },
  { prefix: '/videoaulas', title: 'Videoaulas' },
  { prefix: '/animacoes', title: 'Animações Jurídicas' },
  { prefix: '/radar', title: 'Radar Legislativo' },
  { prefix: '/blog', title: 'Blog Jurídico' },
  { prefix: '/ferramentas', title: 'Ferramentas' },
  { prefix: 'assistente-horus', title: 'Assistente Hórus' },
  { prefix: '/perfil', title: 'Meu Perfil' },
  { prefix: '/assinatura', title: 'Assinatura' },
  { prefix: '/suporte', title: 'Suporte' },
  { prefix: '/admin', title: 'Administração' },
];

type Favorito = ReturnType<typeof getFavoritos>[number];

export const DesktopAppShell = memo(function DesktopAppShell({ children }: { children: ReactNode }) {
  const isDesktop = useIsDesktop();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profileSummary } = useProfileSummary();
  const isAdmin = isAdminEmail(user?.email);

  const [collapsed, setCollapsed] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [deepSearchOpen, setDeepSearchOpen] = useState(false);
  const [assistenteOpen, setAssistenteOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [logoutPrompt, setLogoutPrompt] = useState(false);
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const unreadCount = useUnreadNotifCount();

  const shouldRenderShell = useMemo(() => {
    if (!isDesktop || !user) return false;
    if (EXCLUDED_EXACT.has(location.pathname)) return false;
    if (EXCLUDED_PREFIXES.some((p) => location.pathname.startsWith(p))) return false;
    return true;
  }, [isDesktop, user, location.pathname]);

  useHotkeys(
    'mod+k',
    (e) => {
      if (!shouldRenderShell) return;
      e.preventDefault();
      setCmdOpen((v) => !v);
    },
    { enableOnFormTags: true },
    [shouldRenderShell]
  );

  useEffect(() => {
    if (!shouldRenderShell) return;
    const carregar = () => setFavoritos(getFavoritos().slice(0, 6));
    carregar();
    window.addEventListener('LEIS_FAVORITOS_UPDATED', carregar);
    return () => window.removeEventListener('LEIS_FAVORITOS_UPDATED', carregar);
  }, [shouldRenderShell]);

  const handleDeepSearchSelectLei = useCallback(
    (lei: { tipo: string; leiId: string; nome: string; descricao: string; tabela_nome: string; artigoNumero?: string }) => {
      pushRecente({ tipo: lei.tipo, leiId: lei.leiId, nome: lei.nome, descricao: lei.descricao, tabela_nome: lei.tabela_nome });
      const slug = leiToSlug({ id: lei.leiId, nome: lei.nome });
      const base = `/legislacao/${tipoToSlug(lei.tipo)}/${slug}`;
      navigate(lei.artigoNumero ? `${base}/${encodeURIComponent(lei.artigoNumero)}` : base);
    },
    [navigate]
  );

  const pageTitle = useMemo(() => {
    if (location.pathname === '/') return 'Início';
    const found = ROUTE_TITLES.find((r) => location.pathname.includes(r.prefix));
    return found?.title ?? 'Direito Prime';
  }, [location.pathname]);

  const displayName = profileSummary?.displayName || user?.email?.split('@')[0] || 'Usuário';
  const initial = displayName.charAt(0).toUpperCase();

  if (!shouldRenderShell) {
    return <>{children}</>;
  }

  return (
    <div className="h-dvh w-full bg-[#09090B] text-zinc-100 flex overflow-hidden">
      {/* Sidebar esquerda persistente */}
      <aside
        className={`shrink-0 h-full bg-[#0C0C0F] border-r border-white/[0.06] flex flex-col transition-[width] duration-200 ease-out select-none ${
          collapsed ? 'w-[64px]' : 'w-[232px]'
        }`}
      >
        {/* Brand + Collapse */}
        <div className={`h-14 shrink-0 flex items-center border-b border-white/[0.06] ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          {!collapsed && (
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 text-left group min-w-0"
            >
              <img src={primeLogo} alt="Direito Prime" className="w-7 h-7 rounded-lg object-cover shrink-0 border border-white/10" />
              <div className="min-w-0">
                <p className="font-display text-sm font-bold text-white tracking-tight truncate">Direito Prime</p>
              </div>
            </button>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors shrink-0"
            aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="space-y-0.5">
              {!collapsed && (
                <p className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.route === '/'
                    ? location.pathname === '/'
                    : item.matchPrefixes
                    ? item.matchPrefixes.some((p) => location.pathname.startsWith(p))
                    : location.pathname.startsWith(item.route);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.route)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                      collapsed ? 'justify-center h-9 px-0' : 'px-2.5 h-8'
                    } ${
                      isActive
                        ? 'bg-white/[0.08] text-white'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${isActive ? 'text-rose-400' : 'text-zinc-400'}`}
                      strokeWidth={isActive ? 2.1 : 1.75}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          ))}

          {isAdmin && (
            <div className="space-y-0.5 pt-2 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => navigate('/admin')}
                title={collapsed ? 'Admin' : undefined}
                className={`w-full flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                  collapsed ? 'justify-center h-9 px-0' : 'px-2.5 h-8'
                } ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-white/[0.08] text-white'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]'
                }`}
              >
                <Lock className="w-4 h-4 shrink-0 text-amber-400" />
                {!collapsed && <span className="truncate">Painel Admin</span>}
              </button>
            </div>
          )}
        </nav>

        {/* Footer Conta */}
        <div className="p-2 border-t border-white/[0.06] space-y-0.5">
          {!collapsed && (
            <div className="flex items-center gap-2.5 px-2.5 py-2 mb-1 rounded-lg bg-white/[0.03]">
              <div className="w-7 h-7 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-xs font-bold text-rose-300 shrink-0">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white truncate">{displayName}</p>
                <p className="text-[10px] text-zinc-500 truncate">{user?.email}</p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate('/perfil')}
            title={collapsed ? 'Meu Perfil' : undefined}
            className={`w-full flex items-center gap-2.5 rounded-lg text-[13px] text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors ${
              collapsed ? 'justify-center h-9 px-0' : 'px-2.5 h-8'
            }`}
          >
            <UserIcon className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Perfil</span>}
          </button>

          <button
            type="button"
            onClick={() => navigate('/assinatura')}
            title={collapsed ? 'Assinatura' : undefined}
            className={`w-full flex items-center gap-2.5 rounded-lg text-[13px] text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors ${
              collapsed ? 'justify-center h-9 px-0' : 'px-2.5 h-8'
            }`}
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Assinatura</span>}
          </button>

          <button
            type="button"
            onClick={() => navigate('/suporte')}
            title={collapsed ? 'Suporte' : undefined}
            className={`w-full flex items-center gap-2.5 rounded-lg text-[13px] text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors ${
              collapsed ? 'justify-center h-9 px-0' : 'px-2.5 h-8'
            }`}
          >
            <LifeBuoy className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Suporte</span>}
          </button>

          <button
            type="button"
            onClick={() => setLogoutPrompt(true)}
            title={collapsed ? 'Sair' : undefined}
            className={`w-full flex items-center gap-2.5 rounded-lg text-[13px] text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ${
              collapsed ? 'justify-center h-9 px-0' : 'px-2.5 h-8'
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        {/* Topbar 56px */}
        <header className="h-14 shrink-0 px-6 border-b border-white/[0.06] bg-[#09090B]/90 backdrop-blur-md flex items-center justify-between gap-4 z-30">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-medium text-zinc-500 hidden sm:inline">Direito Prime</span>
            <span className="text-zinc-700 hidden sm:inline">/</span>
            <h1 className="text-sm font-semibold text-white truncate">{pageTitle}</h1>
          </div>

          {/* Command Palette Trigger */}
          <button
            type="button"
            onClick={() => setCmdOpen(true)}
            className="flex-1 max-w-md h-9 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] flex items-center justify-between gap-3 text-xs text-zinc-400 transition-colors"
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span className="truncate">Buscar lei, artigo, aula ou comando...</span>
            </span>
            <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-white/[0.05] border border-white/10 rounded shrink-0">
              Ctrl K
            </kbd>
          </button>

          {/* Right Quick Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Popover>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-9 h-9 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                      aria-label="Favoritos"
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">Favoritos</TooltipContent>
              </Tooltip>
              <PopoverContent align="end" className="w-80 p-0 border-white/10 shadow-2xl overflow-hidden bg-[#111114]">
                <div className="p-3 border-b border-white/[0.07] flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Últimos Favoritos
                  </h4>
                </div>
                <div className="max-h-72 overflow-y-auto p-1.5 flex flex-col gap-0.5">
                  {favoritos.length === 0 ? (
                    <p className="text-xs text-zinc-500 p-4 text-center">Nenhum favorito ainda.</p>
                  ) : (
                    favoritos.map((fav) => (
                      <button
                        key={fav.leiId}
                        type="button"
                        onClick={() => navigate(`/legislacao/${tipoToSlug(fav.tipo)}/${leiToSlug({ id: fav.leiId, nome: fav.nome })}`)}
                        className="flex flex-col text-left p-2.5 rounded-lg hover:bg-white/[0.05] transition-colors"
                      >
                        <span className="text-xs font-semibold text-white line-clamp-1">{fav.nome}</span>
                        <span className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">{fav.descricao || fav.tipo}</span>
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setAssistenteOpen(true)}
                  className="w-9 h-9 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-amber-400 transition-colors"
                  aria-label="Assistente Hórus"
                >
                  <Bird className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Assistente Hórus</TooltipContent>
            </Tooltip>

            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setNotifOpen(true)}
                  className="relative w-9 h-9 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                  aria-label="Notificações"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {unreadCount > 0 ? `Notificações (${unreadCount})` : 'Notificações'}
              </TooltipContent>
            </Tooltip>
          </div>
        </header>

        {/* Content Viewport */}
        <div
          id="desktop-scroll-container"
          data-desktop-scroll="true"
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
        >
          {children}
        </div>
      </div>

      {/* Overlays */}
      <DesktopCommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onOpenDeepSearch={() => setDeepSearchOpen(true)}
      />

      {deepSearchOpen && (
        <Suspense fallback={null}>
          <SearchOverlay
            open={deepSearchOpen}
            onClose={() => setDeepSearchOpen(false)}
            onSelectLei={handleDeepSearchSelectLei}
          />
        </Suspense>
      )}

      {assistenteOpen && (
        <Suspense fallback={null}>
          <AssistenteOverlay open={assistenteOpen} onClose={() => setAssistenteOpen(false)} />
        </Suspense>
      )}

      <NotificationsSheet open={notifOpen} onClose={() => setNotifOpen(false)} />

      <AlertDialog open={logoutPrompt} onOpenChange={setLogoutPrompt}>
        <AlertDialogContent className="w-11/12 max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Sair da conta</AlertDialogTitle>
            <AlertDialogDescription>Você quer realmente sair da conta?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                setLogoutPrompt(false);
                navigate('/auth', { replace: true });
                setTimeout(() => signOut(), 50);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

export default DesktopAppShell;
