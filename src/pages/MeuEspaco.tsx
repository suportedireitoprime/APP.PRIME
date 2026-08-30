import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Camera, Pencil, Check,
  StickyNote, Highlighter, Star, BookMarked,
  Scale, FileText, Film, Gavel, BookOpen, Sparkles, Calendar,
  NotebookPen, Video, Database, Trash2, Mic, Monitor, Layers, Brain, BellRing
} from "lucide-react";
import { toast } from "sonner";
import { haptic } from "@/lib/nativeHaptics";
import { supabase } from "@/integrations/supabase/client";
import { flushAppMetricsNow } from "@/lib/appMetrics";
import { PESSOAL_COVERS, getCoverSrc, getCoverLqip, preloadCover } from "@/assets/pessoal/covers";
import { getCache, setCache } from "@/lib/pessoalCache";
import { useProfileSummary } from "@/hooks/useProfileSummary";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMeuEspacoFeed, MEU_ESPACO_FEED_KEY, type MeuEspacoFeedItem } from "@/services/meuEspacoFeed";
import { prefetchAllPessoal, prefetchPessoalByPath } from "@/services/pessoalPrefetch";
import { track } from "@/lib/analyticsEvents";
import { useTrackArea } from "@/hooks/useTrackArea";
import { useGoBack } from '@/hooks/useGoBack';
import { useHideSplashScreen } from '@/hooks/useHideSplashScreen';

const PESSOAL_SNAP = "sheet_snapshot";
const prefetchRoute = (path: string) => {
  switch (path) {
    case '/pessoal/leis': import("@/pages/pessoal/Leis.tsx"); break;
    case '/pessoal/artigos': import("@/pages/pessoal/Artigos.tsx"); break;
    case '/pessoal/anotacoes': import("@/pages/pessoal/Anotacoes.tsx"); break;
    case '/pessoal/grifos': import("@/pages/pessoal/Grifos.tsx"); break;
    case '/pessoal/livros': import("@/pages/pessoal/Livros.tsx"); break;
    case '/pessoal/filmes': import("@/pages/pessoal/Filmes.tsx"); break;
    case '/pessoal/jurisprudencias': import("@/pages/pessoal/Jurisprudencias.tsx"); break;
    case '/pessoal/tematicas': import("@/pages/pessoal/Tematicas.tsx"); break;
  }
};

const KIND_LABEL: Record<MeuEspacoFeedItem['kind'], string> = {
  anotacao: 'Anotação',
  grifo: 'Grifo',
  artigo: 'Artigo favorito',
  lei: 'Lei acessada',
  livro: 'Livro favorito',
  jurisprudencia: 'Jurisprudência',
  tematica: 'Temática',
};

const KIND_ICON: Record<MeuEspacoFeedItem['kind'], any> = {
  anotacao: StickyNote, grifo: Highlighter, artigo: Star,
  lei: Scale, livro: BookMarked, jurisprudencia: Gavel, tematica: Film,
};

// ---------- Calendar helpers ----------
const WEEKDAY = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 7 dias começando em hoje (à esquerda) e retrocedendo. */
function getDayList(days = 7): Date[] {
  const out: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(d);
  }
  return out;
}

function dayShortLabel(d: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Ontem';
  return WEEKDAY[d.getDay()];
}

function formatFullDate(d: Date) {
  return `${d.getDate()} de ${MONTHS[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatEventLabel(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  const hh = formatTime(ts);
  if (diff === 0) return `hoje, ${hh}`;
  if (diff === 1) return `ontem, ${hh}`;
  const dd = String(new Date(ts).getDate()).padStart(2, '0');
  const mm = String(new Date(ts).getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}, ${hh}`;
}
const METAS_MOCK = [
  { id: 'm1', type: 'Missão de Leitura', title: 'Crime e Castigo', subtitle: 'Meta: Ler 15 páginas hoje (Págs 45 a 60)', progress: 0, path: '/pessoal/livros', icon: BookOpen },
  { id: 'm2', type: 'Trilha de Videoaula', title: 'Processo Penal: Inquérito', subtitle: 'Continuar Aula 04: Prazos do Inquérito', progress: 65, path: '/minhas-videoaulas', icon: Video },
  { id: 'm3', type: 'Revisão e Exercícios', title: 'Direito Civil: Contratos', subtitle: '10 exercícios separados para hoje', progress: 100, path: '/pessoal/anotacoes', icon: FileText },
];

const QUICK = [
  { label: 'Minhas Leituras', icon: BookOpen, path: '/minhas-leituras', color: '#FFD400' },
  { label: 'Meus Resumos', icon: NotebookPen, path: '/meus-resumos', color: '#22D3EE' },
  { label: 'Videoaulas', icon: Video, path: '/minhas-videoaulas', color: '#FF2D78' },
  { label: 'Minhas anotações', icon: StickyNote, path: '/pessoal/anotacoes' },
  { label: 'Meus grifos', icon: Highlighter, path: '/pessoal/grifos' },
  { label: 'Livros Salvos', icon: BookMarked, path: '/pessoal/livros' },
  { label: 'Filmes', icon: Film, path: '/pessoal/filmes' },
  { label: 'Jurisprudências', icon: Gavel, path: '/pessoal/jurisprudencias' },
  { label: 'Temáticas', icon: Star, path: '/pessoal/tematicas' },
];

const MeuEspaco = () => {
  useHideSplashScreen(100);
  useTrackArea("meu_espaco_aberto");
  const navigate = useNavigate();
  const goBack = useGoBack('/');
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: summary } = useProfileSummary();

  // Estado local editável (bio / capa) — inicial vem do React Query (persistido).
  const [bioDraft, setBioDraft] = useState<string>('');
  const [editingBio, setEditingBio] = useState(false);
  const [capaOverride, setCapaOverride] = useState<string | null>(null);
  const [bioOverride, setBioOverride] = useState<string | null>(null);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => toYMD(new Date()));
  const [activeTab, setActiveTab] = useState<'meus' | 'metas'>('meus');
  const [clearingStorage, setClearingStorage] = useState(false);
  

  // Snapshot local para paint imediato antes do React Query reidratar.
  const initialSnap: any = getCache(PESSOAL_SNAP);
  const snapFeed: MeuEspacoFeedItem[] = Array.isArray(initialSnap?.feed) ? initialSnap.feed : [];
  const snapFavTotal = Number(initialSnap?.favTotal ?? 0);
  const snapLeis = Number(initialSnap?.leisCount ?? 0);
  const snapArt = Number(initialSnap?.artigosCount ?? 0);
  const snapLeituras = Number(initialSnap?.leiturasCount ?? 0);

  const feedQuery = useQuery({
    queryKey: MEU_ESPACO_FEED_KEY(user?.id),
    enabled: !!user?.id,
    queryFn: () => fetchMeuEspacoFeed(user!.id),
    staleTime: 60_000,
    gcTime: 1000 * 60 * 60 * 24 * 7,
    placeholderData: (prev) => prev,
    initialData: snapFeed.length
      ? { feed: snapFeed, favTotal: snapFavTotal, leisCount: snapLeis, artigosCount: snapArt, leiturasCount: snapLeituras }
      : undefined,
  });

  const feed: MeuEspacoFeedItem[] = feedQuery.data?.feed ?? snapFeed;
  const leisCount = feedQuery.data?.leisCount ?? snapLeis;
  const artigosCount = feedQuery.data?.artigosCount ?? snapArt;
  const leiturasCount = feedQuery.data?.leiturasCount ?? snapLeituras;

  const displayName = summary?.displayName ?? initialSnap?.displayName ?? (user?.email?.split('@')[0] ?? 'Você');
  const isPremium = summary?.isPremium ?? !!initialSnap?.isPremium;
  const avatarUrl =
    summary?.avatarUrl ||
    initialSnap?.avatarUrl ||
    (user?.user_metadata as any)?.avatar_url ||
    (user?.user_metadata as any)?.picture ||
    '';
  const bio = bioOverride ?? summary?.bio ?? initialSnap?.bio ?? '';
  const capaId = capaOverride ?? summary?.capaId ?? initialSnap?.capaId ?? 'capa1';
  const email = summary?.email || user?.email || initialSnap?.email || '';

  const handle = useMemo(() => {
    const base = (email.split('@')[0] || 'usuario').toLowerCase().replace(/[^a-z0-9._-]/g, '');
    return `@${base}`;
  }, [email]);

  // Flush métricas — fire-and-forget, sem bloquear o paint.
  useEffect(() => {
    if (!user?.id) return;
    flushAppMetricsNow().then(() => {
      qc.invalidateQueries({ queryKey: ['profile-summary', user.id] });
    }).catch(() => {});
  }, [user?.id, qc]);

  // Persiste snapshot em localStorage sempre que a query real chegar.
  useEffect(() => {
    if (!user?.id || !feedQuery.data) return;
    try {
      const prevSnap: any = getCache(PESSOAL_SNAP) || {};
      setCache(PESSOAL_SNAP, {
        ...prevSnap,
        email: user.email ?? '',
        displayName,
        isPremium,
        avatarUrl,
        bio,
        capaId,
        favTotal: feedQuery.data.favTotal,
        leisCount: feedQuery.data.leisCount,
        artigosCount: feedQuery.data.artigosCount,
        leiturasCount: feedQuery.data.leiturasCount,
        feed: feedQuery.data.feed,
      });
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedQuery.data, user?.id]);

  // Prefetch das subpáginas /pessoal/* em idle.
  useEffect(() => {
    if (!user?.id) return;
    const idle: any = (window as any).requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 200));
    const cancelIdle: any = (window as any).cancelIdleCallback ?? clearTimeout;
    const uid = user.id;
    const handle = idle(() => {
      prefetchAllPessoal(qc, uid);
      import('@/pages/pessoal/Leis.tsx');
      import('@/pages/pessoal/Artigos.tsx');
      import('@/pages/pessoal/Anotacoes.tsx');
      import('@/pages/pessoal/Grifos.tsx');
      import('@/pages/pessoal/Livros.tsx');
      import('@/pages/pessoal/Filmes.tsx');
      import('@/pages/pessoal/Jurisprudencias.tsx');
      import('@/pages/pessoal/Tematicas.tsx');
    });
    return () => { try { cancelIdle(handle); } catch {} };
  }, [user?.id, qc]);

  // Revalida stats ao receber flush do appMetrics.
  useEffect(() => {
    if (!user?.id) return;
    const handler = () => qc.invalidateQueries({ queryKey: ['profile-summary', user.id] });
    window.addEventListener('app-metrics-flushed', handler);
    return () => window.removeEventListener('app-metrics-flushed', handler);
  }, [user?.id, qc]);

  // Persiste summary no snapshot.
  useEffect(() => {
    if (!summary) return;
    try {
      const prev: any = getCache(PESSOAL_SNAP) || {};
      setCache(PESSOAL_SNAP, {
        ...prev,
        email: summary.email || prev.email || '',
        displayName: summary.displayName || prev.displayName || '',
        isPremium: summary.isPremium ?? prev.isPremium ?? false,
        avatarUrl: summary.avatarUrl || prev.avatarUrl || '',
        bio: summary.bio ?? prev.bio ?? '',
        capaId: summary.capaId || prev.capaId || 'capa1',
      });
    } catch {}
  }, [summary]);

  const saveBio = async () => {
    if (!user?.id) return;
    const val = bioDraft.trim().slice(0, 240);
    setBioOverride(val);
    setEditingBio(false);
    const online = typeof navigator === 'undefined' ? true : navigator.onLine !== false;
    if (online) {
      const { error } = await supabase.from('profiles').update({ bio: val }).eq('id', user.id);
      if (error) {
        try {
          const { syncQueue } = await import('@/services/syncQueue');
          await syncQueue.enqueue({ kind: 'table.update', table: 'profiles', match: { id: user.id }, values: { bio: val } });
        } catch (e) { console.error("Falha syncQueue:", e); toast.error("Falha ao agendar edição offline."); }
      }
    } else {
      try {
        const { syncQueue } = await import('@/services/syncQueue');
        await syncQueue.enqueue({ kind: 'table.update', table: 'profiles', match: { id: user.id }, values: { bio: val } });
      } catch (e) { console.error("Falha syncQueue:", e); toast.error("Falha ao agendar edição offline."); }
    }
    qc.invalidateQueries({ queryKey: ['profile-summary', user.id] });
    haptic.success();
  };

  const pickCover = async (id: string) => {
    setCapaOverride(id);
    setCoverPickerOpen(false);
    haptic.selection();
    if (user?.id) {
      const online = typeof navigator === 'undefined' ? true : navigator.onLine !== false;
      if (online) {
        const { error } = await supabase.from('profiles').update({ capa_id: id }).eq('id', user.id);
        if (error) {
          try {
            const { syncQueue } = await import('@/services/syncQueue');
            await syncQueue.enqueue({ kind: 'table.update', table: 'profiles', match: { id: user.id }, values: { capa_id: id } });
          } catch (e) { console.error("Falha syncQueue:", e); toast.error("Falha ao agendar edição offline."); }
        }
      } else {
        try {
          const { syncQueue } = await import('@/services/syncQueue');
          await syncQueue.enqueue({ kind: 'table.update', table: 'profiles', match: { id: user.id }, values: { capa_id: id } });
        } catch (e) { console.error("Falha syncQueue:", e); toast.error("Falha ao agendar edição offline."); }
      }
      qc.invalidateQueries({ queryKey: ['profile-summary', user.id] });
    }
  };

  const go = (path: string) => {
    haptic.selection();
    track('meu_espaco_acesso_rapido', { path });
    navigate(path);
  };

  const handleBack = () => {
    haptic.selection();
    goBack();
  };

  const clearStorage = async () => {
    haptic.selection();
    toast.warning("Tem certeza?", {
      description: "Isso apagará o cache de leis e dicionário baixados (serão recarregados quando necessário).",
      action: {
        label: "Limpar",
        onClick: async () => {
          setClearingStorage(true);
          try {
            const { localDb } = await import('@/services/localDb');
            if (localDb.available) {
              await localDb.clearAll();
            }
            const { clearCache } = await import('@/lib/pessoalCache');
            clearCache();
            toast.success("Armazenamento offline liberado com sucesso!");
          } catch (e) {
            console.error("Erro ao limpar dados offline:", e);
            toast.error("Houve um erro ao liberar o armazenamento.");
          } finally {
            setClearingStorage(false);
          }
        }
      }
    });
  };

  // ---------- Calendar & agrupamento por dia ----------
  const dayList = useMemo(() => getDayList(7), []);
  const feedByDay = useMemo(() => {
    const m = new Map<string, MeuEspacoFeedItem[]>();
    for (const it of feed) {
      const key = toYMD(new Date(it.ts));
      const arr = m.get(key) ?? [];
      arr.push(it);
      m.set(key, arr);
    }
    return m;
  }, [feed]);

  const eventsOfDay = useMemo(() => (feedByDay.get(selectedDate) ?? []).sort((a, b) => b.ts - a.ts), [feedByDay, selectedDate]);

  return (
    <div className="min-h-[100dvh] bg-background overflow-y-auto">
      {/* Cover */}
      <div
        className="relative w-full h-52 sm:h-64 bg-secondary overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${getCoverLqip(capaId)})` }}
      >
        <img
          key={capaId}
          src={getCoverSrc(capaId)}
          alt="Capa do perfil"
          loading="eager"
          decoding="sync"
          {...({ fetchpriority: 'high' } as any)}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-background" />
        <button
          onClick={handleBack}
          aria-label="Voltar"
          className="absolute top-[calc(0.75rem+var(--sai-top))] left-3 w-12 h-12 rounded-full bg-black/55 backdrop-blur flex items-center justify-center text-white active:scale-95 transition"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => setCoverPickerOpen(true)}
          className="absolute top-[calc(0.75rem+var(--sai-top))] right-3 h-12 px-4 rounded-full bg-black/55 backdrop-blur flex items-center gap-2 text-white text-sm font-medium active:scale-95 transition"
        >
          <Camera className="w-4 h-4" />
          Trocar capa
        </button>
      </div>

      {/* Avatar + identidade */}
      <div className="relative -mt-14 px-5 flex flex-col items-center">
        <div className="w-28 h-28 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-4xl font-display font-black ring-4 ring-background shadow-xl overflow-hidden">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              width={112}
              height={112}
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            (displayName[0] || 'U').toUpperCase()
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <h1 className="font-display text-2xl font-bold text-foreground">{displayName}</h1>
          {isPremium && (
            <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> Plus
            </span>
          )}
        </div>
        <p className="font-body text-sm text-muted-foreground">{handle}</p>

      </div>

      
      <div className="lg:mx-auto lg:w-full lg:max-w-[1200px] lg:px-8">
        
        {/* Carrossel de Datas */}
        <div className="mt-6 px-5 lg:px-0">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              {formatFullDate(new Date(selectedDate + 'T00:00:00'))}
            </span>
          </div>
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2 snap-x">
            {dayList.map((d) => {
              const key = toYMD(d);
              const isSelected = selectedDate === key;
              const hasData = (feedByDay.get(key)?.length ?? 0) > 0;
              return (
                <button
                  key={key}
                  onClick={() => { haptic.selection(); setSelectedDate(key); }}
                  className={`snap-start shrink-0 relative flex flex-col items-center justify-center gap-1 w-[4.5rem] h-[4.5rem] rounded-2xl transition-all shadow-sm border ${
                    isSelected
                      ? 'bg-primary border-primary text-primary-foreground shadow-primary/30'
                      : 'bg-secondary/40 border-border/60 text-foreground hover:bg-secondary/60'
                  }`}
                >
                  <span className={`text-[10px] font-body font-semibold uppercase tracking-wide ${isSelected ? '' : 'text-foreground/70'}`}>
                    {dayShortLabel(d)}
                  </span>
                  <span className="text-xl font-display font-bold leading-none">{d.getDate()}</span>
                  {hasData && !isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary absolute bottom-1.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu de Alternância (Tabs) */}
        <div className="px-5 mt-4 lg:px-0">
          <div className="flex bg-secondary/40 border border-border/60 p-1 rounded-[14px]">
            <button
              onClick={() => { haptic.selection(); setActiveTab('meus'); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${activeTab === 'meus' ? 'bg-background text-foreground shadow-sm border border-border/50' : 'text-muted-foreground'}`}
            >
              Meus
            </button>
            <button
              onClick={() => { haptic.selection(); setActiveTab('metas'); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${activeTab === 'metas' ? 'bg-background text-foreground shadow-sm border border-border/50' : 'text-muted-foreground'}`}
            >
              Metas do Dia
            </button>
          </div>
        </div>

        {activeTab === 'meus' && (
          <div className="mt-5 space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0 pb-[calc(4rem+var(--safe-bottom))]">
            
            <div className="space-y-6">
              {/* Bio */}
              <div className="px-5 lg:px-0">
                <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Sobre mim</span>
                    {editingBio ? (
                      <button onClick={saveBio} className="h-8 px-3 rounded-full bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Salvar
                      </button>
                    ) : (
                      <button onClick={() => { setBioDraft(bio); setEditingBio(true); }} className="h-8 px-3 rounded-full bg-background border border-border text-xs font-semibold inline-flex items-center gap-1">
                        <Pencil className="w-3.5 h-3.5" /> Editar
                      </button>
                    )}
                  </div>
                  {editingBio ? (
                    <textarea
                      value={bioDraft}
                      onChange={(e) => setBioDraft(e.target.value)}
                      maxLength={240}
                      placeholder="Diga algo sobre você, sua área do Direito, o que estuda..."
                      className="w-full min-h-[96px] bg-background border border-border rounded-xl p-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  ) : (
                    <p className="text-sm text-foreground/90 leading-relaxed min-h-[48px]">
                      {bio || <span className="text-muted-foreground italic">Diga algo sobre você, sua área do Direito, o que estuda...</span>}
                    </p>
                  )}
                </div>
              </div>

              {/* Estatísticas */}
              <div className="px-5 lg:px-0 grid grid-cols-3 gap-3">
                <StatCell
                  icon={Scale}
                  label="Leis lidas"
                  value={leisCount.toString()}
                  onClick={() => go('/pessoal/leis')}
                />
                <StatCell
                  icon={Star}
                  label="Artigos"
                  value={artigosCount.toString()}
                  onClick={() => go('/pessoal/artigos')}
                />
                <StatCell
                  icon={BookOpen}
                  label="Leituras"
                  value={leiturasCount.toString()}
                  onClick={() => go('/minhas-leituras')}
                />
              </div>

              {/* Seção 1: Anotações e Captura */}
              <div className="px-5 lg:px-0">
                <h3 className="font-display text-foreground text-[18px] font-bold mb-3 flex items-center gap-2">
                  <span className="w-1 h-5 rounded-full bg-primary" />
                  Anotações e Captura
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    onClick={() => go('/anotacoes/audio')}
                    className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card p-5 text-center hover:border-emerald-500/50 transition-colors active:scale-95 shadow-sm relative group overflow-hidden"
                  >
                    <div className="absolute top-3 right-3 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-1 transition-all">
                      <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center relative z-10 mb-1">
                      <Mic className="w-6 h-6 text-emerald-500" strokeWidth={1.5} />
                    </div>
                    <span className="font-display font-bold text-[14px] text-foreground relative z-10">Gravar Aula</span>
                  </motion.button>
                  
                  <motion.button
                    onClick={() => go('/faculdade/lousa')}
                    className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card p-5 text-center hover:border-blue-500/50 transition-colors active:scale-95 shadow-sm relative group overflow-hidden"
                  >
                    <div className="absolute top-3 right-3 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-1 transition-all">
                      <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center relative z-10 mb-1">
                      <Monitor className="w-6 h-6 text-blue-500" strokeWidth={1.5} />
                    </div>
                    <span className="font-display font-bold text-[14px] text-foreground relative z-10">Lousa Scanner</span>
                  </motion.button>
                </div>
              </div>

              {/* Seção 2: Caderno Inteligente */}
              <div className="px-5 lg:px-0">
                <h3 className="font-display text-foreground text-[18px] font-bold mb-3 flex items-center gap-2">
                  <span className="w-1 h-5 rounded-full bg-primary" />
                  Caderno Inteligente
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  <motion.button
                    onClick={() => go('/faculdade/resumos')}
                    className="flex flex-col items-center justify-start gap-2 rounded-2xl border border-border/60 bg-card p-3 text-center hover:border-primary/50 transition-colors active:scale-95"
                  >
                    <FileText className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
                    <span className="font-display font-bold text-[11px] text-foreground leading-tight">Resumos</span>
                  </motion.button>
                  
                  <motion.button
                    onClick={() => go('/flashcards-personalizados')}
                    className="flex flex-col items-center justify-start gap-2 rounded-2xl border border-border/60 bg-card p-3 text-center hover:border-primary/50 transition-colors active:scale-95"
                  >
                    <Layers className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
                    <span className="font-display font-bold text-[11px] text-foreground leading-tight">Flashcards</span>
                  </motion.button>

                  <motion.button
                    onClick={() => go('/assistente')}
                    className="flex flex-col items-center justify-start gap-2 rounded-2xl border border-border/60 bg-card p-3 text-center hover:border-primary/50 transition-colors active:scale-95"
                  >
                    <Brain className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
                    <span className="font-display font-bold text-[11px] text-foreground leading-tight">Mapas</span>
                  </motion.button>

                  <motion.button
                    onClick={() => go('/faculdade/lembretes')}
                    className="flex flex-col items-center justify-start gap-2 rounded-2xl border border-border/60 bg-card p-3 text-center hover:border-primary/50 transition-colors active:scale-95"
                  >
                    <BellRing className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
                    <span className="font-display font-bold text-[11px] text-foreground leading-tight">Lembretes</span>
                  </motion.button>
                </div>
              </div>

              {/* Quick access Quadradinhos */}
              <div className="px-5 lg:px-0 mt-2">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 px-1">Acesso rápido</p>
                <div className="grid grid-cols-3 gap-2">
                  {QUICK.map((q) => {
                    const Icon = q.icon;
                    return (
                      <button
                        key={q.label}
                        onClick={() => go(q.path)}
                        onPointerEnter={() => { prefetchRoute(q.path); if (user?.id) prefetchPessoalByPath(qc, user.id, q.path); }}
                        onPointerDown={() => { prefetchRoute(q.path); if (user?.id) prefetchPessoalByPath(qc, user.id, q.path); }}
                        onTouchStart={() => { prefetchRoute(q.path); if (user?.id) prefetchPessoalByPath(qc, user.id, q.path); }}
                        className="aspect-[4/3] rounded-2xl border border-border/60 bg-secondary/30 hover:bg-secondary/60 active:scale-[0.97] transition p-3 flex flex-col items-start justify-between text-left"
                      >
                        <Icon className="w-5 h-5" style={{ color: (q as any).color ?? 'var(--primary)' }} />
                        <span className="text-[12px] font-semibold text-foreground leading-tight">{q.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Armazenamento Local / Limpeza */}
              <div className="px-5 lg:px-0">
                <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Database className="w-5 h-5 text-muted-foreground" />
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Armazenamento Offline
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground/80 mb-4">
                    O aplicativo guarda leis, artigos e resumos para que você possa estudar mesmo sem internet. Limpe esse cache se precisar liberar espaço.
                  </p>
                  <button
                    onClick={clearStorage}
                    disabled={clearingStorage}
                    className="w-full h-12 rounded-xl bg-secondary border border-border/60 text-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 active:scale-[0.98] transition hover:bg-secondary/80 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                    {clearingStorage ? "Limpando..." : "Limpar dados baixados"}
                  </button>
                </div>
              </div>
            </div>

            {/* Minha atividade (feed) */}
            <div className="px-5 lg:px-0">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 px-1">Histórico em {formatFullDate(new Date(selectedDate + 'T00:00:00'))}</p>
              {eventsOfDay.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Nenhuma atividade registrada neste dia.
                </div>
              ) : (
                <div className="rounded-2xl border border-border/60 bg-secondary/30 divide-y divide-border/50 overflow-hidden">
                  {eventsOfDay.map((it) => {
                    const Icon = KIND_ICON[it.kind] ?? Scale;
                    return (
                      <button
                        key={it.id}
                        onClick={() => it.path && go(it.path)}
                        className="w-full flex items-center gap-3 px-4 py-3 min-h-[64px] text-left hover:bg-secondary/60 active:bg-secondary transition"
                      >
                        <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-primary shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                            {KIND_LABEL[it.kind]} · {formatEventLabel(it.ts)}
                          </div>
                          <div className="font-body text-sm font-semibold text-foreground truncate">{it.title}</div>
                          {it.subtitle && <div className="text-xs text-muted-foreground truncate">{it.subtitle}</div>}
                        </div>
                        {it.path && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {activeTab === 'metas' && (
          <div className="mt-5 px-5 lg:px-0 pb-[calc(4rem+var(--safe-bottom))] space-y-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold px-1">Seu progresso diário</p>
            {METAS_MOCK.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Nenhuma meta pendente para hoje. Bom descanso!
              </div>
            ) : (
              METAS_MOCK.sort((a,b) => b.progress - a.progress).map(m => {
                const Icon = m.icon;
                const isDone = m.progress === 100;
              return (
                <button
                  key={m.id}
                  onClick={() => go(m.path)}
                  className={`w-full flex items-center gap-4 px-4 py-3 min-h-[72px] rounded-2xl border transition-all text-left active:scale-[0.99] ${isDone ? 'bg-secondary/20 border-border/30 opacity-75' : 'bg-secondary/40 border-border/60 shadow-sm hover:bg-secondary/60'}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isDone ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'}`}>
                    {isDone ? <Check className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                        {m.type}
                      </div>
                      <div className={`text-[10px] font-black ${isDone ? 'text-green-500' : 'text-primary'}`}>
                        {isDone ? 'CONCLUÍDO' : `${m.progress}%`}
                      </div>
                    </div>
                    <div className={`font-body text-sm font-bold truncate ${isDone ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {m.title}
                    </div>
                    {m.subtitle && (
                      <div className={`text-xs mt-0.5 mb-2.5 truncate ${isDone ? 'text-muted-foreground/60 line-through' : 'text-muted-foreground'}`}>
                        {m.subtitle}
                      </div>
                    )}
                    {!m.subtitle && <div className="mb-2.5" />}
                    <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${isDone ? 'bg-green-500' : 'bg-primary'}`} 
                        style={{ width: `${m.progress}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            }))}
          </div>
        )}

      </div>

      {/* Cover picker */}
      <AnimatePresence>
        {coverPickerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setCoverPickerOpen(false)}
              className="fixed inset-0 z-[90] bg-black/60"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="fixed bottom-0 left-0 right-0 z-[100] bg-card rounded-t-3xl border-t border-border p-5 pb-[calc(1.25rem+var(--sai-bottom))]"
            >
              <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-display text-lg font-bold text-foreground mb-3">Escolha uma capa</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {PESSOAL_COVERS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => pickCover(c.id)}
                    className={`relative w-full aspect-[16/6] rounded-2xl overflow-hidden border-2 transition ${capaId === c.id ? 'border-primary ring-2 ring-primary/40' : 'border-border/60'}`}
                  >
                    <img src={c.src} alt={c.label} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute bottom-2 left-3 text-white text-xs font-semibold drop-shadow">{c.label}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

function StatCell({
  icon: Icon, label, value, onClick, onPrefetch,
}: { icon: any; label: string; value: string; onClick?: () => void; onPrefetch?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerEnter={onPrefetch}
      onPointerDown={onPrefetch}
      onTouchStart={onPrefetch}
      className="rounded-2xl bg-secondary/40 border border-border/60 p-3 flex flex-col items-center justify-center text-center active:scale-[0.97] hover:bg-secondary/60 transition"
    >
      <Icon className="w-4 h-4 text-primary mb-1" />
      <div className="font-display text-lg font-bold text-foreground leading-none">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-1">{label}</div>
    </button>
  );
}

export default MeuEspaco;
