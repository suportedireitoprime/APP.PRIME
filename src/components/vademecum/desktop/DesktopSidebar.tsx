import { useState, useEffect, useMemo, memo, type ElementType } from 'react';
import { pickAsset, srcOf } from '@/lib/assetUrl';
import {
  Scale, BookOpen, FileText, Newspaper, Landmark, Shield, ScrollText, Gavel,
  Radar, RefreshCw, Info, LogOut, BookMarked, HeartPulse, Lock,
  User as UserIcon, BookOpenText, CloudDownload, CreditCard, LifeBuoy,
  Library, Speech, GraduationCap, Headphones, Clapperboard,
} from 'lucide-react';
import { tipoToSlug } from '@/lib/legislacaoSlugs';
import { getLeisPorTipo } from '@/data/leisCatalog';
import SuporteSheet from '@/components/vademecum/sheets/SuporteSheet';
import DesktopCategoriaSheet from '@/components/vademecum/desktop/DesktopCategoriaSheet';
import primeLogoAsset from '@/assets/logo-direitoprime-v2.webp.asset.json';
import primeLogoBundled from '@/assets/bundled/logo-direitoprime-v2.webp';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfileSummary } from '@/hooks/useProfileSummary';
import { isAdminEmail } from '@/lib/adminEmails';
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

const primeLogo = pickAsset(primeLogoBundled, srcOf(primeLogoAsset));

type Tab = 'legislacao' | 'noticias' | 'ferramentas' | 'biblioteca';

interface DesktopSidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

interface SidebarNavItem {
  readonly id: string;
  readonly label: string;
  readonly icon: ElementType;
  readonly route?: string;
  readonly color?: string;
  readonly disabled?: boolean;
  readonly onClick?: () => void;
}

const CATEGORIAS = [
  { id: 'constituicao', tipo: 'constituicao', label: 'Constituição', icon: Landmark, color: '#FFD400' },
  { id: 'codigo', tipo: 'codigo', label: 'Códigos', icon: BookOpen, color: '#3B82F6' },
  { id: 'estatuto', tipo: 'estatuto', label: 'Estatutos', icon: Shield, color: '#F43F5E' },
  { id: 'lei-ordinaria', tipo: 'lei-ordinaria', label: 'Leis Ordinárias', icon: FileText, color: '#DC2626' },
  { id: 'decreto', tipo: 'decreto', label: 'Decretos', icon: ScrollText, color: '#F97316' },
  { id: 'sumula', tipo: 'sumula', label: 'Súmulas', icon: Gavel, color: 'hsl(348 78% 38%)' },
  { id: 'lei-especial', tipo: 'lei-especial', label: 'Leis Especiais', icon: BookMarked, color: '#A855F7' },
  { id: 'previdenciario', tipo: 'previdenciario', label: 'Previdenciário', icon: HeartPulse, color: '#14B8A6' },
] as const;

const SECOES_NAV = [
  { id: 'legislacao', label: 'Início', icon: Scale, color: '#DC2626', route: '/' },
  { id: 'aulas', label: 'Aulas', icon: GraduationCap, color: '#10B981', route: '/aulas' },
  { id: 'audioleis', label: 'Ouça a Lei', icon: Headphones, color: '#F59E0B', route: '/audioleis' },
  { id: 'animacoes', label: 'Animações', icon: Clapperboard, color: '#F97316', route: '/animacoes' },
  { id: 'biblioteca', label: 'Biblioteca', icon: Library, color: '#D97706', route: '/bibliotecas' },
  { id: 'radar', label: 'Radar Legislativo', icon: Radar, color: '#0EA5E9', route: '/radar-360' },
  { id: 'noticias', label: 'Atualizações', icon: RefreshCw, color: '#EC4899', route: '/noticias' },
] as const;

const CONTEUDO_ITEMS: readonly SidebarNavItem[] = [
  { id: 'blog', label: 'Blog Jurídico', icon: BookOpen, route: '/blog', color: '#0EA5E9' },
  { id: 'explicacao', label: 'Artigos e Análises', icon: Newspaper, route: '/pessoal/artigos', color: '#6366F1' },
] as const;

const FERRAMENTAS_ITEMS: readonly SidebarNavItem[] = [
  { id: 'me-explique', label: 'Me Explique (IA)', icon: Speech, route: '/me-explique', color: '#E11D48' },
  { id: 'ferramentas', label: 'Todas as Ferramentas', icon: Gavel, route: '/ferramentas', color: '#DC2626' },
  { id: 'dicionario', label: 'Dicionário Jurídico', icon: BookOpenText, route: '/ferramentas/dicionario', color: '#3B82F6' },
  { id: 'offline', label: 'Modo Offline', icon: CloudDownload, route: '/modo-offline', color: '#64748B' },
] as const;

const CONTA_ITEMS: readonly SidebarNavItem[] = [
  { id: 'perfil', label: 'Meu Perfil', icon: UserIcon, route: '/perfil', color: '#64748B' },
  { id: 'assinatura', label: 'Assinatura', icon: CreditCard, route: '/assinatura', color: '#10B981' },
  { id: 'suporte', label: 'Suporte', icon: LifeBuoy, route: '/suporte', color: '#EC4899' },
  { id: 'sobre', label: 'Sobre o App', icon: Info, route: '/sobre', color: '#06B6D4' },
  { id: 'sair', label: 'Sair', icon: LogOut, color: 'hsl(348 78% 38%)' },
] as const;

const PROFISSAO_MAP: Record<string, string> = {
  faculdade: 'Faculdade e OAB',
  oab: 'Faculdade e OAB',
  concurso: 'Concurseiro',
  advogado: 'Advogado',
};

const DesktopSidebar = memo(({ activeTab: _activeTab, onTabChange }: DesktopSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { data: profileSummary } = useProfileSummary();
  const isAdmin = isAdminEmail(user?.email);

  const [isHovered, setIsHovered] = useState(false);
  const collapsed = !isHovered;
  const [suporteOpen, setSuporteOpen] = useState(false);
  const [catSheet, setCatSheet] = useState<{ tipo: string; label: string; color?: string } | null>(null);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [logoutPrompt, setLogoutPrompt] = useState(false);

  const { displayName, initial, profissao, rawAvatarUrl } = useMemo(() => {
    const meta = user?.user_metadata as { avatar_url?: string; picture?: string } | undefined;
    const name = profileSummary?.displayName || user?.email?.split('@')[0] || 'Visitante';
    const tipos = profileSummary?.perfilTipos;
    const role = (tipos?.[0] && PROFISSAO_MAP[tipos[0]]) || tipos?.[0] || 'Vade Mecum Profissional';
    const avatar = profileSummary?.avatarUrl || meta?.avatar_url || meta?.picture || undefined;
    return {
      displayName: name,
      initial: name.charAt(0).toUpperCase(),
      profissao: role,
      rawAvatarUrl: avatar,
    };
  }, [user, profileSummary]);

  const avatarUrl = avatarBroken ? undefined : rawAvatarUrl;
  useEffect(() => { setAvatarBroken(false); }, [rawAvatarUrl]);

  const handleItemClick = (item: Pick<SidebarNavItem, 'id' | 'route' | 'onClick'>) => {
    if (item.onClick) {
      item.onClick();
      return;
    }
    if (item.id === 'sair') {
      setLogoutPrompt(true);
      return;
    }
    if (item.route) navigate(item.route);
    else console.warn('[DesktopSidebar] item sem rota nem handler:', item.id);
  };

  const renderSection = (title: string, items: readonly SidebarNavItem[], usePrimaryTint = false) => (
    <div className="py-1 border-t border-border/50">
      {!collapsed && (
        <p className="px-5 py-1 text-[9px] font-body font-semibold text-muted-foreground uppercase tracking-widest">
          {title}
        </p>
      )}
      {items.map((item) => {
        const Icon = item.icon;
        const isDisabled = item.disabled;
        const color = item.color || '#DC2626';
        return (
          <button
            key={item.id}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isDisabled) handleItemClick(item);
            }}
            disabled={isDisabled}
            title={collapsed ? item.label : undefined}
            className={`w-full flex items-center gap-2.5 ${collapsed ? 'justify-center px-0' : 'px-3 mx-1'} py-1.5 rounded-lg text-sm font-body transition-colors ${
              isDisabled
                ? 'text-muted-foreground/40 cursor-not-allowed'
                : 'text-foreground/75 hover:bg-secondary hover:text-foreground'
            }`}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 relative overflow-hidden shadow-sm"
              style={
                isDisabled
                  ? undefined
                  : usePrimaryTint
                    ? { backgroundColor: 'hsl(var(--primary) / 0.2)', boxShadow: '0 2px 6px -2px hsl(var(--primary) / 0.3)' }
                    : { backgroundColor: `${color}33`, boxShadow: `0 2px 6px -2px ${color}55` }
              }
            >
              {!usePrimaryTint && (
                <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: isDisabled ? undefined : color }} />
              )}
              <Icon
                className={`w-[16px] h-[16px] drop-shadow-sm ${usePrimaryTint ? 'text-primary' : ''}`}
                style={isDisabled || usePrimaryTint ? undefined : { color, filter: 'saturate(1.4) brightness(1.15)' }}
              />
            </div>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      <div className="relative w-[72px] h-full shrink-0 z-50">
        <aside
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`absolute top-0 left-0 h-screen ${collapsed ? 'w-[72px]' : 'w-[268px]'} bg-zinc-950 border-r border-border/50 flex flex-col overflow-hidden shrink-0 ${collapsed ? '' : 'shadow-[4px_0_24px_rgba(0,0,0,0.5)]'} z-50`}
          style={{ transitionProperty: 'width', transitionDuration: '320ms', transitionTimingFunction: 'cubic-bezier(0.22, 0.61, 0.36, 1)' }}
        >
          {/* Header – user profile */}
          <div className="h-16 flex items-center px-3.5 shrink-0 border-b border-border/50 bg-zinc-950">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-primary/15 flex items-center justify-center border border-white/10 hover:border-primary/50 transition-colors shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} onError={() => setAvatarBroken(true)} className="w-full h-full object-cover" />
              ) : (
                <span className="font-display text-lg font-bold text-primary" aria-hidden="true">{initial}</span>
              )}
            </div>
            {!collapsed && (
              <div className="ml-4 flex flex-col truncate">
                <h1 className="font-display text-base font-bold text-foreground leading-tight truncate">{displayName}</h1>
                <p className="text-[11px] font-body text-muted-foreground truncate">{profissao}</p>
              </div>
            )}
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto py-1 overscroll-contain">
            {isAdmin && (
              <div className="pb-1">
                {!collapsed && (
                  <p className="px-5 py-1 text-[9px] font-body font-semibold text-muted-foreground uppercase tracking-widest">
                    Admin
                  </p>
                )}
                <button
                  onPointerDown={() => { void import('@/pages/admin/AdminFuncoes.tsx').catch(() => {}); }}
                  onClick={() => navigate('/admin-funcoes')}
                  title={collapsed ? 'Funções Admin' : undefined}
                  className={`w-full flex items-center gap-2.5 ${collapsed ? 'justify-center px-0' : 'px-3 mx-1'} py-1.5 rounded-lg text-sm font-body text-foreground/75 hover:bg-secondary hover:text-foreground transition-colors`}
                >
                  <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                    <Lock className="w-[16px] h-[16px] text-primary" />
                  </div>
                  {!collapsed && <span className="font-semibold">Funções Admin</span>}
                </button>
              </div>
            )}

            {/* Main Nav */}
            <div className={`pb-1 ${isAdmin ? 'border-t border-border/50 pt-1' : ''}`}>
              {!collapsed && (
                <p className="px-5 py-1 text-[9px] font-body font-semibold text-muted-foreground uppercase tracking-widest">
                  Seções
                </p>
              )}
              {SECOES_NAV.map((item) => {
                const Icon = item.icon;
                const active = item.route === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.route);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (item.route) navigate(item.route);
                      else onTabChange(item.id as Tab);
                    }}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-2.5 ${collapsed ? 'justify-center px-0' : 'px-3 mx-1'} py-1.5 rounded-lg text-sm font-body transition-all ${
                      active
                        ? 'bg-primary text-primary-foreground font-bold shadow-md shadow-primary/25'
                        : 'text-foreground/75 hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 relative overflow-hidden ${
                        active ? 'bg-primary-foreground/20' : ''
                      }`}
                      style={active ? undefined : { backgroundColor: `${item.color}33`, boxShadow: `0 2px 6px -2px ${item.color}55` }}
                    >
                      <Icon
                        className={`w-[16px] h-[16px] drop-shadow-sm ${active ? 'text-primary-foreground' : ''}`}
                        style={active ? undefined : { color: item.color, filter: 'saturate(1.4) brightness(1.15)' }}
                      />
                    </div>
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                );
              })}
            </div>

            <div className="pb-1 border-t border-border/50 pt-1">
              {!collapsed && (
                <p className="px-5 py-1 text-[9px] font-body font-semibold text-muted-foreground uppercase tracking-widest">
                  Categorias
                </p>
              )}
              {CATEGORIAS.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (cat.tipo === 'constituicao') {
                        navigate(`/legislacao/${tipoToSlug(cat.tipo)}`);
                        return;
                      }
                      const doCatalogo = getLeisPorTipo(cat.tipo);
                      if (doCatalogo.length === 0) {
                        navigate(`/legislacao/${tipoToSlug(cat.tipo)}`);
                        return;
                      }
                      setCatSheet({ tipo: cat.tipo, label: cat.label, color: cat.color });
                    }}
                    title={collapsed ? cat.label : undefined}
                    className={`w-full flex items-center gap-2.5 ${collapsed ? 'justify-center px-0' : 'px-3 mx-1'} py-1.5 rounded-lg text-sm font-body text-foreground/75 hover:bg-secondary hover:text-foreground transition-colors group`}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 relative overflow-hidden shadow-sm"
                      style={{ backgroundColor: `${cat.color}33` }}
                    >
                      <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: cat.color }} />
                      <Icon className="w-[16px] h-[16px]" style={{ color: cat.color }} />
                    </div>
                    {!collapsed && <span>{cat.label}</span>}
                  </button>
                );
              })}
            </div>

            {renderSection('Conteúdo', CONTEUDO_ITEMS)}
            {renderSection('Ferramentas', FERRAMENTAS_ITEMS)}

            {renderSection('Minha conta', CONTA_ITEMS)}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            {collapsed ? (
              <div className="flex justify-center">
                <img src={primeLogo} alt="Direito Prime" className="w-5 h-5 rounded-full object-cover opacity-50" />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <img src={primeLogo} alt="Direito Prime" className="w-6 h-6 rounded-lg object-cover opacity-70" />
                <p className="text-[10px] font-body text-muted-foreground">© 2026 Direito Prime</p>
              </div>
            )}
          </div>
        </aside>
      </div>

      <SuporteSheet open={suporteOpen} onClose={() => setSuporteOpen(false)} />
      <DesktopCategoriaSheet
        open={!!catSheet}
        tipo={catSheet?.tipo ?? null}
        label={catSheet?.label ?? ''}
        color={catSheet?.color}
        onClose={() => setCatSheet(null)}
      />
      <AlertDialog open={logoutPrompt} onOpenChange={setLogoutPrompt}>
        <AlertDialogContent className="w-11/12 max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Sair da conta</AlertDialogTitle>
            <AlertDialogDescription>
              Você quer realmente sair da conta?
            </AlertDialogDescription>
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
    </>
  );
});

export default DesktopSidebar;
