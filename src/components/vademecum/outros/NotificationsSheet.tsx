import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Scale, Newspaper, BookOpen, 
  ArrowRight, Clock, RefreshCw, Sparkles 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { resenhaSelect } from '@/lib/resenhaBackend';
import { haptic } from '@/lib/nativeHaptics';
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

const LAST_SEEN_KEY = 'vacatio_novidades_last_seen';

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

    const parseDiario = (list: any[]) => {
      for (const r of list) {
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
    };

    const parseNoticias = (list: any[]) => {
      for (const r of list) {
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
    };

    const parseBlog = (list: any[]) => {
      for (const r of list) {
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
    };

    parseDiario((diario.data as any[] | null) ?? []);
    parseNoticias((noticias.data as any[] | null) ?? []);
    parseBlog((blog.data as any[] | null) ?? []);

    // Se hoje ainda não houver publicações (ex: madrugada ou fim de semana), busca as mais recentes gerais
    if (items.length === 0) {
      const [diarioRecente, noticiasRecentes, blogRecentes] = await Promise.all([
        resenhaSelect<any>({
          select: 'id,tipo_ato,numero_ato,ementa,created_at,data_dou',
          order: 'created_at.desc',
          limit: '10',
        }).then((data) => ({ data })),
        supabase
          .from('noticias_juridicas' as any)
          .select('id,titulo,resumo,imagem_url,created_at,fonte')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('blog_edicao_posts' as any)
          .select('id,titulo,resumo,imagem_thumb_url,imagem_url,data_publicacao,publicado')
          .eq('publicado', true)
          .order('data_publicacao', { ascending: false })
          .limit(8),
      ]);

      parseDiario((diarioRecente.data as any[] | null) ?? []);
      parseNoticias((noticiasRecentes.data as any[] | null) ?? []);
      parseBlog((blogRecentes.data as any[] | null) ?? []);
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items;
  } catch {
    return [];
  }
}

/** Hook oficial de contagem de novidades não lidas em tempo real */
export function useUnreadNotifCount() {
  const [count, setCount] = useState(0);

  const checkUnread = useCallback(() => {
    try {
      const lastSeenIso = localStorage.getItem(LAST_SEEN_KEY);
      
      // Se já abriu nas últimas 4 horas, não incomoda com badge
      if (lastSeenIso) {
        const lastSeenDate = new Date(lastSeenIso);
        const diffHours = (Date.now() - lastSeenDate.getTime()) / (1000 * 60 * 60);
        if (diffHours < 4) {
          setCount(0);
          return;
        }
      }

      fetchCuratedLegalFeed()
        .then((items) => {
          if (!items || items.length === 0) {
            setCount(0);
            return;
          }
          if (!lastSeenIso) {
            setCount(Math.min(items.length, 3));
            return;
          }
          const lastSeenTime = new Date(lastSeenIso).getTime();
          const unread = items.filter((it) => new Date(it.createdAt).getTime() > lastSeenTime);
          setCount(Math.min(unread.length, 9));
        })
        .catch(() => setCount(0));
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    checkUnread();
    const interval = setInterval(checkUnread, 90_000);
    const onVisible = () => document.visibilityState === 'visible' && checkUnread();
    const onNotificationsChanged = () => checkUnread();

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('notifications-changed', onNotificationsChanged);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('notifications-changed', onNotificationsChanged);
    };
  }, [checkUnread]);

  return count;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NotificationsSheet({ open, onClose }: Props) {
  const navigate = useNavigate();
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'diario' | 'noticia' | 'blog'>('todos');
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

      // Marca visualização para zerar o badge de novidades
      try {
        localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
        window.dispatchEvent(new Event('notifications-changed'));
      } catch {}

      return () => cancelAnimationFrame(raf);
    }
    setEntered(false);
    closeTimer.current = window.setTimeout(() => setMounted(false), 260);
    return () => {
      if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
    };
  }, [open]);

  // Carrega feed de novidades curadas
  const loadNotifications = useCallback(async () => {
    if (!open) return;
    setLoading(true);

    try {
      const feed = await fetchCuratedLegalFeed();
      setCuratedItems(feed);
    } catch (e) {
      console.warn('Erro ao carregar novidades:', e);
    } finally {
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleOpenCuratedItem = (it: CuratedItem) => {
    try { haptic.selection(); } catch {}
    onClose();
    navigate(it.to);
  };

  // Contadores por tipo para os filtros
  const contadores = useMemo(() => {
    const diario = curatedItems.filter(i => i.kind === 'diario').length;
    const noticia = curatedItems.filter(i => i.kind === 'noticia').length;
    const blog = curatedItems.filter(i => i.kind === 'blog').length;
    return { todos: curatedItems.length, diario, noticia, blog };
  }, [curatedItems]);

  // Itens filtrados
  const itensExibidos = useMemo(() => {
    if (filtroTipo === 'todos') return curatedItems;
    return curatedItems.filter(i => i.kind === filtroTipo);
  }, [curatedItems, filtroTipo]);

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
        {/* HEADER EXCLUSIVO: CENTRAL DE NOVIDADES */}
        <header className="relative border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
          <div className="px-4 pt-4 pb-3 flex items-start gap-3">
            <div className="relative w-11 h-11 flex items-center justify-center shrink-0 rounded-xl bg-gradient-to-br from-red-600/20 to-red-950/40 border border-red-500/30 shadow-inner">
              <Scale className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
                Novidades & Atualizações
              </h2>
              <p className="text-[12px] text-zinc-400 mt-0.5">
                {curatedItems.length > 0
                  ? `${curatedItems.length} publicação${curatedItems.length > 1 ? 'ões' : ''} recentes`
                  : 'Atos do Diário Oficial e Notícias'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  try { haptic.light(); } catch {}
                  loadNotifications();
                }}
                title="Atualizar"
                aria-label="Atualizar novidades"
                className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => {
                  try { haptic.light(); } catch {}
                  onClose();
                }}
                aria-label="Fechar"
                className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* FILTROS DE CATEGORIA DAS NOVIDADES */}
          {curatedItems.length > 0 && (
            <div className="px-4 pb-3 pt-1">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
                <button
                  type="button"
                  onClick={() => {
                    try { haptic.selection(); } catch {}
                    setFiltroTipo('todos');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                    filtroTipo === 'todos'
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-950/60 border border-red-400/30'
                      : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Todas</span>
                  <span className="text-[10px] opacity-80 font-mono">({contadores.todos})</span>
                </button>

                {contadores.diario > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      try { haptic.selection(); } catch {}
                      setFiltroTipo('diario');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                      filtroTipo === 'diario'
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-950/60 border border-red-400/30'
                        : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    <Scale className="w-3 h-3" />
                    <span>D.O.U.</span>
                    <span className="text-[10px] opacity-80 font-mono">({contadores.diario})</span>
                  </button>
                )}

                {contadores.noticia > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      try { haptic.selection(); } catch {}
                      setFiltroTipo('noticia');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                      filtroTipo === 'noticia'
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-950/60 border border-red-400/30'
                        : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    <Newspaper className="w-3 h-3" />
                    <span>Notícias</span>
                    <span className="text-[10px] opacity-80 font-mono">({contadores.noticia})</span>
                  </button>
                )}

                {contadores.blog > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      try { haptic.selection(); } catch {}
                      setFiltroTipo('blog');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                      filtroTipo === 'blog'
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-950/60 border border-red-400/30'
                        : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>Artigos</span>
                    <span className="text-[10px] opacity-80 font-mono">({contadores.blog})</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </header>

        {/* LIST CONTAINER */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
          {loading && (
            <div className="text-center text-zinc-400 py-12 text-sm flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-red-500" />
              <span>Carregando novidades...</span>
            </div>
          )}

          {/* LISTA EXCLUSIVA DE NOVIDADES */}
          {!loading && (
            <>
              {itensExibidos.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="w-14 h-14 mx-auto rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3">
                    <Scale className="w-6 h-6 text-zinc-500" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-200 mb-1">Sem publicações nesta categoria</p>
                  <p className="text-xs text-zinc-500">
                    Novos atos do Diário Oficial da União e notícias do dia aparecerão aqui.
                  </p>
                </div>
              ) : (
                itensExibidos.map((it) => {
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
                      className="w-full text-left rounded-2xl border border-zinc-900 hover:border-zinc-800 p-3.5 flex gap-3 bg-zinc-950/70 hover:bg-zinc-900/60 transition-all active:scale-[0.99] cursor-pointer"
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
