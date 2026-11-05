import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Bell, CheckCheck, Scale, Newspaper, Video, BookOpen, 
  ArrowRight, Clock, GraduationCap, Sparkles, Trash2, RefreshCw 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { resenhaSelect } from '@/lib/resenhaBackend';
import { useAuth } from '@/hooks/useAuth';
import brasaoRepublica from '@/assets/brasao-republica.webp';

export type NotifCategory = 'leis' | 'noticias' | 'estudos' | 'lembretes' | 'sistema' | 'blog' | 'geral';

export interface UserNotifItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  url?: string | null;
  imageUrl?: string | null;
  category: NotifCategory;
  read: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface CuratedItem {
  id: string;
  kind: 'diario' | 'noticia' | 'blog';
  title: string;
  subtitle?: string;
  createdAt: string;
  to: string;
  image?: string;
}

const CATEGORY_META: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  leis:       { label: 'Legislação',      icon: Scale,         color: '#DC2626', bg: 'bg-red-500/15' },
  noticias:   { label: 'Notícia',         icon: Newspaper,     color: '#A78BFA', bg: 'bg-violet-500/15' },
  estudos:    { label: 'Estudo Jurídico', icon: GraduationCap, color: '#38BDF8', bg: 'bg-sky-500/15' },
  lembretes:  { label: 'Lembrete',        icon: Clock,         color: '#FBBF24', bg: 'bg-amber-500/15' },
  blog:       { label: 'Artigo / Blog',   icon: BookOpen,      color: '#34D399', bg: 'bg-emerald-500/15' },
  sistema:    { label: 'Aviso do App',    icon: Sparkles,      color: '#EC4899', bg: 'bg-pink-500/15' },
  geral:      { label: 'Notificação',     icon: Bell,          color: '#9CA3AF', bg: 'bg-zinc-500/15' },
};

function formatRelative(iso: string): { rel: string; abs: string } {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const min = Math.max(0, Math.floor(diffMs / 60000));
  const abs = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  let rel: string;
  if (min < 1) rel = 'agora';
  else if (min < 60) rel = `há ${min} min`;
  else {
    const h = Math.floor(min / 60);
    if (h < 24) rel = `há ${h}h`;
    else rel = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }
  return { rel, abs };
}

/** Hook oficial de contagem de notificações não lidas em tempo real */
export function useUnreadNotifCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!user?.id) {
      setCount(0);
      return;
    }
    try {
      const { count: unreadCount, error } = await supabase
        .from('user_notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (!error && typeof unreadCount === 'number') {
        setCount(unreadCount);
      }
    } catch {
      setCount(0);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 45_000);

    // Ouvinte em tempo real via Supabase Realtime com tratamento seguro de concorrência
    let channel: any = null;
    if (user?.id) {
      try {
        const uniqueTopic = `user_notifications_badge_${user.id}_${Math.random().toString(36).slice(2, 8)}`;
        channel = supabase
          .channel(uniqueTopic)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_notifications',
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              fetchCount();
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('[NotificationsSheet] Falha segura ao conectar realtime:', err);
      }
    }

    const onVisible = () => document.visibilityState === 'visible' && fetchCount();
    const onNotificationsChanged = () => fetchCount();

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('notifications-changed', onNotificationsChanged);

    return () => {
      clearInterval(interval);
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {}
      }
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('notifications-changed', onNotificationsChanged);
    };
  }, [fetchCount, user?.id]);

  return count;
}

async function fetchCuratedLegalFeed(): Promise<CuratedItem[]> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return [];
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const since = startOfDay.toISOString();
  const hojeLocal = new Date().toLocaleDateString('en-CA');

  try {
    const [diario, noticias, blog] = await Promise.all([
      resenhaSelect<any>({
        select: 'id,tipo_ato,numero_ato,ementa,created_at,data_dou',
        data_dou: `eq.${hojeLocal}`,
        order: 'created_at.desc',
        limit: '15',
      }).then((data) => ({ data })),
      supabase
        .from('noticias_juridicas' as any)
        .select('id,titulo,resumo,imagem_url,created_at,fonte')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(15),
      supabase
        .from('blog_edicao_posts' as any)
        .select('id,titulo,resumo,imagem_thumb_url,imagem_url,data_publicacao,publicado')
        .eq('publicado', true)
        .gte('data_publicacao', since)
        .order('data_publicacao', { ascending: false })
        .limit(10),
    ]);

    const items: CuratedItem[] = [];

    for (const r of (diario.data as any[] | null) ?? []) {
      const tipo = String(r.tipo_ato || '').trim();
      const numero = String(r.numero_ato || '').trim();
      const title = !numero ? tipo : numero.toLowerCase().startsWith(tipo.toLowerCase()) ? numero : `${tipo} nº ${numero}`;
      items.push({
        id: `dou_${r.id}`,
        kind: 'diario',
        title,
        subtitle: r.ementa,
        createdAt: r.created_at,
        to: `/resenha-diaria?data=${r.data_dou || hojeLocal}`,
      });
    }

    for (const r of (noticias.data as any[] | null) ?? []) {
      items.push({
        id: `noticia_${r.id}`,
        kind: 'noticia',
        title: r.titulo,
        subtitle: r.resumo || (r.fonte ? `Fonte: ${r.fonte}` : undefined),
        createdAt: r.created_at,
        to: `/noticias`,
        image: r.imagem_url || undefined,
      });
    }

    for (const r of (blog.data as any[] | null) ?? []) {
      items.push({
        id: `blog_${r.id}`,
        kind: 'blog',
        title: r.titulo,
        subtitle: r.resumo,
        createdAt: r.data_publicacao || r.created_at,
        to: `/blog?post=${encodeURIComponent(r.id)}`,
        image: r.imagem_thumb_url || r.imagem_url || undefined,
      });
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items;
  } catch {
    return [];
  }
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NotificationsSheet({ open, onClose }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pessoal' | 'curadoria'>('pessoal');

  const [userItems, setUserItems] = useState<UserNotifItem[]>([]);
  const [curatedItems, setCuratedItems] = useState<CuratedItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Mount/unmount com transição CSS fluida a 120fps
  const [mounted, setMounted] = useState(open);
  const [entered, setEntered] = useState(false);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
      setMounted(true);
      const raf = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(raf);
    }
    setEntered(false);
    closeTimer.current = window.setTimeout(() => setMounted(false), 260);
    return () => {
      if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
    };
  }, [open]);

  // Carrega notificações do usuário e feed curado
  const loadNotifications = useCallback(async () => {
    if (!open) return;
    setLoading(true);

    try {
      if (user?.id) {
        const { data: dbNotifs } = await supabase
          .from('user_notifications')
          .select('id, user_id, title, body, url, image_url, category, read, read_at, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (dbNotifs) {
          const mapped: UserNotifItem[] = dbNotifs.map((n) => ({
            id: n.id,
            userId: n.user_id,
            title: n.title,
            body: n.body,
            url: n.url,
            imageUrl: n.image_url,
            category: (n.category as NotifCategory) || 'geral',
            read: n.read,
            readAt: n.read_at,
            createdAt: n.created_at,
          }));
          setUserItems(mapped);

          // Se não houver pushes pessoais ainda, muda suavemente para a aba de curadoria
          if (mapped.length === 0) {
            setActiveTab('curadoria');
          } else {
            setActiveTab('pessoal');
          }
        }
      }

      const feed = await fetchCuratedLegalFeed();
      setCuratedItems(feed);
    } catch (e) {
      console.warn('Erro ao carregar notificações:', e);
    } finally {
      setLoading(false);
    }
  }, [open, user?.id]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const unreadCount = useMemo(() => {
    return userItems.filter((it) => !it.read).length;
  }, [userItems]);

  const markAllRead = async () => {
    if (!user?.id) return;
    const nowIso = new Date().toISOString();

    // Atualização otimista imediata na UI
    setUserItems((prev) => prev.map((n) => ({ ...n, read: true, readAt: nowIso })));

    try {
      await supabase
        .from('user_notifications')
        .update({ read: true, read_at: nowIso })
        .eq('user_id', user.id)
        .eq('read', false);
      window.dispatchEvent(new Event('notifications-changed'));
    } catch (e) {
      console.error('Erro ao marcar todas como lidas:', e);
    }
  };

  const handleOpenUserItem = async (item: UserNotifItem) => {
    if (!item.read && user?.id) {
      setUserItems((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true, readAt: new Date().toISOString() } : n))
      );
      void supabase
        .from('user_notifications')
        .update({ read: true, read_at: new Date().toISOString(), clicked: true, clicked_at: new Date().toISOString() })
        .eq('id', item.id);
      window.dispatchEvent(new Event('notifications-changed'));
    }
    onClose();
    if (item.url) {
      navigate(item.url);
    }
  };

  const handleDeleteItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setUserItems((prev) => prev.filter((n) => n.id !== id));
    try {
      await supabase.from('user_notifications').delete().eq('id', id);
      window.dispatchEvent(new Event('notifications-changed'));
    } catch (err) {
      console.error('Erro ao excluir notificação:', err);
    }
  };

  const handleOpenCuratedItem = (it: CuratedItem) => {
    onClose();
    navigate(it.to);
  };

  // Oculta BottomNav no mobile enquanto o sheet estiver aberto
  useEffect(() => {
    if (!mounted) return;
    window.dispatchEvent(new CustomEvent('direitoprime:bottom-nav-visibility', { detail: { hidden: true } }));
    return () => {
      window.dispatchEvent(new CustomEvent('direitoprime:bottom-nav-visibility', { detail: { hidden: false } }));
    };
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[9990] bg-black/85 transition-opacity duration-200"
        style={{ opacity: entered ? 1 : 0 }}
        onClick={onClose}
      />
      <aside
        className="fixed top-0 right-0 bottom-0 z-[9991] w-full max-w-md bg-[#0D0D0D] text-white border-l border-zinc-800/80 shadow-2xl flex flex-col will-change-transform"
        style={{
          paddingTop: 'var(--sai-top)',
          paddingBottom: 'var(--sai-bottom)',
          transform: entered ? 'translate3d(0,0,0)' : 'translate3d(100%,0,0)',
          transition: 'transform 260ms cubic-bezier(0.22, 0.61, 0.36, 1)',
        }}
      >
        {/* HEADER */}
        <header className="relative border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
          <style>{`
            @keyframes bell-wiggle {
              0%, 100% { transform: rotate(0deg); }
              10%, 30%, 50% { transform: rotate(-10deg); }
              20%, 40% { transform: rotate(10deg); }
              60% { transform: rotate(0deg); }
            }
          `}</style>
          <div className="px-4 pt-4 pb-3 flex items-start gap-3">
            <div className="relative w-11 h-11 flex items-center justify-center shrink-0 rounded-xl bg-zinc-900 border border-zinc-800">
              <Bell 
                className="w-5 h-5 text-red-500" 
                style={{ 
                  animation: unreadCount > 0 ? 'bell-wiggle 2s ease-in-out infinite' : 'none',
                  transformOrigin: 'top center'
                }} 
              />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center border-2 border-[#0D0D0D] shadow-lg animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
                Central de Notificações
              </h2>
              <p className="text-[12px] text-zinc-400 mt-0.5">
                {unreadCount > 0
                  ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}`
                  : 'Tudo em dia'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={loadNotifications}
                title="Atualizar"
                aria-label="Atualizar notificações"
                className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* TABS SELECTOR */}
          <div className="px-4 pb-3 flex gap-2">
            <button
              onClick={() => setActiveTab('pessoal')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'pessoal'
                  ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                  : 'bg-zinc-900/60 text-zinc-400 border border-transparent hover:text-zinc-200'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              Para Você
              {unreadCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('curadoria')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'curadoria'
                  ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                  : 'bg-zinc-900/60 text-zinc-400 border border-transparent hover:text-zinc-200'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              Novidades de Hoje
              {curatedItems.length > 0 && (
                <span className="text-[10px] opacity-75 font-mono">({curatedItems.length})</span>
              )}
            </button>
          </div>

          {activeTab === 'pessoal' && unreadCount > 0 && (
            <div className="px-4 pb-2.5 flex justify-end">
              <button
                onClick={markAllRead}
                className="text-xs font-medium text-zinc-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5 text-red-500" />
                Marcar todas como lidas
              </button>
            </div>
          )}
        </header>

        {/* LIST CONTAINER */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
          {loading && (
            <div className="text-center text-zinc-400 py-12 text-sm flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-red-500" />
              <span>Carregando notificações...</span>
            </div>
          )}

          {/* ABA: MINHAS NOTIFICAÇÕES (PESSOAL) */}
          {!loading && activeTab === 'pessoal' && (
            <>
              {userItems.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="w-14 h-14 mx-auto rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3">
                    <Bell className="w-6 h-6 text-zinc-500" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-200 mb-1">Nenhuma notificação pessoal recebida</p>
                  <p className="text-xs text-zinc-500 max-w-xs mx-auto mb-4">
                    Quando o Direito Prime enviar lembretes de estudo ou avisos direcionados, eles aparecerão aqui.
                  </p>
                  <button
                    onClick={() => setActiveTab('curadoria')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-semibold hover:bg-red-600/30 transition-colors"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    Ver novidades legislativas do dia
                  </button>
                </div>
              ) : (
                userItems.map((it) => {
                  const meta = CATEGORY_META[it.category] || CATEGORY_META.geral;
                  const Icon = meta.icon;
                  const { rel, abs } = formatRelative(it.createdAt);

                  return (
                    <div
                      key={it.id}
                      onClick={() => handleOpenUserItem(it)}
                      className={`group relative w-full text-left rounded-2xl border p-3.5 flex gap-3 transition-all cursor-pointer ${
                        !it.read
                          ? 'bg-zinc-900/90 border-red-500/30 shadow-sm shadow-red-950/20'
                          : 'bg-zinc-950/60 border-zinc-900 opacity-80 hover:opacity-100 hover:border-zinc-800'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl ${meta.bg} border border-white/5 flex items-center justify-center shrink-0 overflow-hidden mt-0.5`}>
                        {it.imageUrl ? (
                          <img src={it.imageUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
                        ) : (
                          <Icon className="w-5 h-5" style={{ color: meta.color }} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span
                            className="text-[9.5px] font-black uppercase tracking-wider"
                            style={{ color: meta.color }}
                          >
                            {meta.label}
                          </span>
                          {!it.read && (
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Não lida" />
                          )}
                          <span
                            className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium text-zinc-500"
                            title={abs}
                          >
                            <Clock className="w-2.5 h-2.5" />
                            {rel}
                          </span>
                        </div>

                        <p className={`text-[13px] leading-snug line-clamp-2 ${!it.read ? 'font-bold text-white' : 'font-medium text-zinc-300'}`}>
                          {it.title}
                        </p>
                        {it.body && (
                          <p className="text-[12px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                            {it.body}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-center justify-between shrink-0 pl-1">
                        <button
                          onClick={(e) => handleDeleteItem(e, it.id)}
                          title="Excluir notificação"
                          aria-label="Excluir notificação"
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* ABA: NOVIDADES DE HOJE (CURADORIA LEGISLATIVA & NOTÍCIAS) */}
          {!loading && activeTab === 'curadoria' && (
            <>
              {curatedItems.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="w-14 h-14 mx-auto rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3">
                    <Scale className="w-6 h-6 text-zinc-500" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-200 mb-1">Sem publicações no momento</p>
                  <p className="text-xs text-zinc-500">
                    Novos atos do Diário Oficial da União e notícias do dia aparecerão aqui.
                  </p>
                </div>
              ) : (
                curatedItems.map((it) => {
                  const isDiario = it.kind === 'diario';
                  const isNoticia = it.kind === 'noticia';
                  const tagColor = isDiario ? '#DC2626' : isNoticia ? '#A78BFA' : '#34D399';
                  const tagBg = isDiario ? 'bg-red-500/15' : isNoticia ? 'bg-violet-500/15' : 'bg-emerald-500/15';
                  const tagLabel = isDiario ? 'Diário Oficial' : isNoticia ? 'Notícia Jurídica' : 'Artigo';
                  const { rel, abs } = formatRelative(it.createdAt);

                  return (
                    <button
                      key={it.id}
                      onClick={() => handleOpenCuratedItem(it)}
                      className="w-full text-left rounded-2xl border border-zinc-900 hover:border-zinc-800 p-3.5 flex gap-3 bg-zinc-950/70 hover:bg-zinc-900/60 transition-all active:scale-[0.99]"
                    >
                      <div className={`w-10 h-10 rounded-xl ${tagBg} border border-white/5 flex items-center justify-center shrink-0 overflow-hidden mt-0.5`}>
                        {it.image ? (
                          <img src={it.image} alt="" loading="lazy" className="w-full h-full object-cover" />
                        ) : isDiario ? (
                          <img src={brasaoRepublica} alt="Brasão da República" loading="lazy" className="w-6 h-6 object-contain" />
                        ) : isNoticia ? (
                          <Newspaper className="w-5 h-5 text-violet-400" />
                        ) : (
                          <BookOpen className="w-5 h-5 text-emerald-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span
                            className="text-[9.5px] font-black uppercase tracking-wider"
                            style={{ color: tagColor }}
                          >
                            {tagLabel}
                          </span>
                          <span
                            className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium text-zinc-500"
                            title={abs}
                          >
                            <Clock className="w-2.5 h-2.5" />
                            {rel}
                          </span>
                        </div>

                        <p className="text-[13px] font-semibold text-white leading-snug line-clamp-2">
                          {it.title}
                        </p>
                        {it.subtitle && (
                          <p className="text-[12px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                            {it.subtitle}
                          </p>
                        )}
                      </div>

                      <ArrowRight className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-2" />
                    </button>
                  );
                })
              )}
            </>
          )}
        </div>
      </aside>
    </>,
    document.body
  );
}
