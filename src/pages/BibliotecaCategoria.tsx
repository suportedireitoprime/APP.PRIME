import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ArrowLeft, ChevronRight, Mic, MicOff, Bookmark } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import {
  COLECOES,
  findColecao,
  normalizeLivro,
  type LivroNormalizado,
  type ColecaoConfig,
} from '@/lib/bibliotecaColecoes';
import { motion } from 'framer-motion';
import { directImg } from '@/lib/cdnImg';
import { getPersistedColecao, setPersistedColecao } from '@/services/offlineDb';
import { withBundleFallback, bundle } from '@/services/offlineBundle';
import { useBibliotecaCapa } from '@/hooks/useBibliotecaAsset';
import { useIsAdmin } from '@/hooks/useVisibleColecoes';
import LivroDetailSheet from '@/components/biblioteca/LivroDetailSheet';
import BibliotecaAtalhosBar from '@/components/biblioteca/BibliotecaAtalhosBar';
import BibliotecaBottomNav from '@/components/biblioteca/BibliotecaBottomNav';
import { getAreaCover } from '@/lib/areasDireitoCovers';
import { styleForArea } from '@/lib/bibliotecaIcons';
import { useLivroBadges, type LivroBadgeInfo } from '@/hooks/useLivroBadges';
import { getRecentes, subscribeTracking, type LivroSnapshot } from '@/lib/bibliotecaTracking';
import { useTrackArea } from "@/hooks/useTrackArea";
import { useIsDesktop } from '@/hooks/use-desktop';
import DesktopSidebar from '@/components/vademecum/DesktopSidebar';
import DesktopBreadcrumb from '@/components/vademecum/DesktopBreadcrumb';

const norm = (s: string) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Fallback quando não há capa custom mapeada
const FALLBACK_TINTS = [
  'hsla(0, 65%, 45%, 0.85)',
  'hsla(220, 55%, 45%, 0.85)',
  'hsla(150, 45%, 35%, 0.85)',
  'hsla(35, 75%, 45%, 0.85)',
  'hsla(275, 45%, 45%, 0.85)',
  'hsla(195, 55%, 40%, 0.85)',
  'hsla(15, 65%, 45%, 0.85)',
  'hsla(255, 40%, 40%, 0.85)',
  'hsla(90, 40%, 35%, 0.85)',
];
function fallbackTint(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return FALLBACK_TINTS[h % FALLBACK_TINTS.length];
}


function useLivrosDaColecao(colecao: ColecaoConfig | undefined) {
  return useQuery({
    queryKey: ['biblioteca-colecao', colecao?.id],
    enabled: !!colecao,
    staleTime: 10 * 60 * 1000,
    // Mantém dados anteriores enquanto revalida — sem skeleton em revisitas.
    placeholderData: (prev) => prev,
    queryFn: async () => {
      if (!colecao) return [];
      try {
        let q: any = supabase.from(colecao.table as any).select(colecao.select);
        if (colecao.orderBy) q = q.order(colecao.orderBy, { ascending: true, nullsFirst: false });
        
        const data = await withBundleFallback(
          q.limit(2000).then((res: any) => {
            if (res.error) throw res.error;
            return res.data;
          }),
          async () => {
             const bundleFnName = 'biblioteca' + colecao.id.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
             if ((bundle as any)[bundleFnName]) {
               return await (bundle as any)[bundleFnName]();
             }
             return [];
          }
        );
        
        const list = (data as any[]).map((r) => normalizeLivro(r, colecao));
        setPersistedColecao(colecao.id, list).catch(() => {});
        return list;
      } catch (err) {
        // Fallback da rede extrema para cache indexado persistente
        const cached = await getPersistedColecao<LivroNormalizado>(colecao.id);
        if (cached && cached.length) return cached;
        throw err;
      }
    },
  });
}

function LivroCard({ livro, onClick, priority, badge, index = 0 }: { livro: LivroNormalizado; onClick: () => void; priority?: boolean; badge?: LivroBadgeInfo; index?: number }) {
  const capaUrl = useBibliotecaCapa(livro.capa, 300);
  const pct = badge?.progresso ? Math.round(badge.progresso * 100) : 0;
  
  return (
    <motion.button
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.4), type: "spring", stiffness: 300, damping: 24 }}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      aria-label={`Abrir livro ${livro.titulo}${livro.autor ? ` de ${livro.autor}` : ''}`}
      className="group flex items-stretch gap-3 p-2.5 rounded-2xl bg-card border border-border hover:border-primary/40 hover:bg-secondary/40 transition-colors text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 relative overflow-hidden"
    >
      <div className="w-[72px] h-[100px] shrink-0 rounded-lg overflow-hidden bg-muted shadow-sm">
        {capaUrl ? (
          <img
            src={capaUrl}
            alt={livro.titulo}
            className="w-full h-full object-cover"
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            {...(priority ? { fetchpriority: 'high' as any } : {})}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 p-1.5">
            <span className="text-[9px] text-center text-muted-foreground font-medium leading-tight line-clamp-4">
              {livro.titulo}
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
        <p className="text-[14px] sm:text-[15px] font-bold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors break-words">
          {livro.titulo}
        </p>
        {livro.autor && (
          <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1">
            {livro.autor}
          </p>
        )}
        
        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
          {livro.area && (
            <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-bold">
              {livro.area}
            </span>
          )}
          {badge?.favorito && (
            <span
              title="Favorito"
              className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-500"
            >
              <Bookmark className="w-2.5 h-2.5 fill-current" />
              Favorito
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar na base do card */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-border/40">
        {pct > 0 && (
          <div 
            className="h-full bg-primary transition-all duration-500" 
            style={{ width: `${pct}%` }} 
          />
        )}
      </div>
    </motion.button>
  );
}


const BibliotecaCategoria = () => {
  useTrackArea("biblioteca_categoria_aberta");
  const isDesktop = useIsDesktop();
  const { colecaoId, areaSlug } = useParams<{ colecaoId: string; areaSlug?: string }>();
  const navigate = useNavigate();
  const colecao = colecaoId ? findColecao(colecaoId) : undefined;
  const isAdmin = useIsAdmin();
  useEffect(() => {
    if (colecao?.adminOnly && !isAdmin) navigate('/bibliotecas', { replace: true });
  }, [colecao, isAdmin, navigate]);

  const [recentes, setRecentes] = useState<LivroSnapshot[]>(() => getRecentes());
  useEffect(() => subscribeTracking(() => setRecentes(getRecentes())), []);
  const ultimoLivro = recentes.length > 0 ? recentes[0] : null;

  // SEO & Título dinâmico por Coleção / Área
  useEffect(() => {
    const nomeColecao = colecao?.label || 'Acervo';
    document.title = areaSlug
      ? `${decodeURIComponent(areaSlug)} - ${nomeColecao} | Vade Mecum PRIME`
      : `${nomeColecao} | Vade Mecum PRIME`;
  }, [colecao, areaSlug]);

  const { data: livros = [], isLoading } = useLivrosDaColecao(colecao);
  const [query, setQuery] = useState('');
  const [livroAberto, setLivroAberto] = useState<LivroNormalizado | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const livroIdParam = searchParams.get('livro');

  useEffect(() => {
    if (!livroIdParam || livros.length === 0) return;
    const found = livros.find((l) => String(l.id) === livroIdParam);
    if (found) setLivroAberto(found);
  }, [livroIdParam, livros]);

  const handleCloseLivro = () => {
    setLivroAberto(null);
    if (searchParams.get('livro')) {
      const next = new URLSearchParams(searchParams);
      next.delete('livro');
      setSearchParams(next, { replace: true });
    }
  };
  const voice = useVoiceInput((text) => setQuery((prev) => (prev ? prev + ' ' : '') + text));
  const badges = useLivroBadges(colecao?.table);


  const areas = useMemo(() => {
    if (!colecao || colecao.modo !== 'categorias') return [] as { name: string; capa?: string; count: number }[];
    const map = new Map<string, { name: string; capa?: string; count: number }>();
    for (const l of livros) {
      const a = l.area || 'Outros';
      const existing = map.get(a);
      if (existing) existing.count++;
      else map.set(a, { name: a, capa: l.capa || undefined, count: 1 });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [livros, colecao]);

  const areaAtiva = areaSlug ? decodeURIComponent(areaSlug) : null;

  const livrosVisiveis = useMemo(() => {
    let list = livros;
    if (areaAtiva) list = list.filter((l) => (l.area || 'Outros') === areaAtiva);
    const q = norm(query.trim());
    if (q) {
      list = list.filter((l) => norm(`${l.titulo} ${l.autor || ''} ${l.area || ''}`).includes(q));
    }
    return list;
  }, [livros, areaAtiva, query]);

  if (!colecao) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Coleção não encontrada.</p>
      </div>
    );
  }

  // Grid de áreas (só quando modo=categorias e sem área selecionada)
  const mostrarAreas = colecao.modo === 'categorias' && !areaAtiva;

  if (isDesktop) {
    return (
      <div className="h-[calc(100dvh-104px)] bg-background flex flex-col">
        <div className="flex flex-1 min-h-0">
          <DesktopSidebar activeTab="biblioteca" onTabChange={(tab) => {
             if (tab === 'legislacao') navigate('/');
             else if (tab === 'noticias') navigate('/noticias');
             else if (tab === 'ferramentas') navigate('/ferramentas');
             else navigate('/bibliotecas');
          }} />
          <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden relative contain-content overscroll-contain">
            <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border flex flex-col">
              <DesktopBreadcrumb />
            </div>

            <div className="px-8 py-6 2xl:px-14">
              {/* Top row: Search + Última Leitura */}
              <div className="flex items-center justify-between gap-6 mb-6">
                {/* Search */}
                <div className="flex items-center gap-2 max-w-2xl flex-1">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                    <Input
                      value={voice.listening && voice.partial ? voice.partial : query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={mostrarAreas ? 'Buscar área ou livro…' : 'Buscar livro…'}
                      className="pl-11 pr-3 h-12 text-sm rounded-xl bg-card border border-border/60"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={voice.toggle}
                    aria-label={voice.listening ? 'Parar gravação' : 'Buscar por voz'}
                    className={`relative overflow-hidden shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition ${
                      voice.listening
                        ? 'bg-red-500 text-white animate-pulse shadow-red-500/40'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                  >
                    {voice.listening && <span className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />}
                    {voice.listening
                      ? <MicOff className="w-5 h-5 relative z-[2]" strokeWidth={2} />
                      : <Mic className="w-5 h-5 relative z-[2]" strokeWidth={2} />}
                  </button>
                </div>

                {/* Última Leitura */}
                {ultimoLivro && (
                  <button
                    onClick={() => setLivroAberto(ultimoLivro as any)}
                    className="group flex items-center gap-3 p-1.5 pr-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-secondary/40 transition-all shadow-sm text-left shrink-0"
                  >
                    <div className="w-10 h-12 rounded bg-muted overflow-hidden shrink-0">
                      {ultimoLivro.capa ? (
                        <img src={directImg(ultimoLivro.capa, 100)} alt={ultimoLivro.titulo} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-primary/10" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-primary mb-0.5">
                        Última leitura
                      </span>
                      <span className="text-sm font-semibold text-foreground truncate max-w-[160px] group-hover:text-primary transition-colors">
                        {ultimoLivro.titulo}
                      </span>
                    </div>
                  </button>
                )}
              </div>

              {/* Título da seção do acervo */}
              <div className="mb-6">
                <p className="text-[10px] uppercase tracking-[0.22em] text-primary/90 font-bold mb-1">
                  ACERVO
                </p>
                <div className="flex items-center gap-2">
                  <span className="w-1 h-6 rounded-full bg-primary" />
                  <h2 className="text-2xl font-bold text-foreground">
                    {mostrarAreas ? 'Áreas do Direito' : 'Todos os livros'}
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground mt-1 ml-3">
                  {mostrarAreas
                    ? 'Escolha uma área para ver as obras daquele campo.'
                    : 'Clique em um livro para abrir, favoritar ou começar a leitura.'}
                </p>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-[148px] rounded-2xl bg-muted animate-pulse border border-border" />
                  ))}
                </div>
              ) : livros.length === 0 ? (
                <div className="py-16 text-center border rounded-2xl border-dashed">
                  <p className="text-sm text-muted-foreground">Nenhum livro ainda nesta coleção.</p>
                </div>
              ) : mostrarAreas ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {areas
                    .filter((a) => !query || norm(a.name).includes(norm(query)))
                    .map((a, index) => {
                      const s = styleForArea(a.name);
                      const Icon = s.icon;
                      return (
                        <motion.button
                          key={a.name}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.4) }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate(`/bibliotecas/${colecao.id}/${encodeURIComponent(a.name)}`)}
                          className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border hover:border-primary/40 hover:bg-secondary/50 transition-colors text-left group"
                        >
                          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                            <Icon className="w-6 h-6" style={{ color: s.color }} strokeWidth={1.6} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-display font-bold text-foreground text-sm uppercase truncate group-hover:text-primary transition-colors">
                              {a.name}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {a.count} {a.count === 1 ? 'livro' : 'livros'}
                            </p>
                          </div>
                        </motion.button>
                      );
                    })}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {livrosVisiveis.map((l, i) => (
                    <LivroCard
                      key={`${colecao.id}-${l.id}`}
                      livro={l}
                      index={i}
                      priority={i < 15}
                      badge={badges.getBadge(colecao.id, colecao.table, l.id)}
                      onClick={() => setLivroAberto(l)}
                    />
                  ))}
                  {livrosVisiveis.length === 0 && (
                    <p className="text-sm text-muted-foreground col-span-full">
                      Nenhum livro encontrado.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <LivroDetailSheet
          livro={livroAberto}
          open={!!livroAberto}
          onClose={handleCloseLivro}
        />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background pb-[calc(96px+var(--sai-bottom,0px))]">
      <PageHeader
        title={areaAtiva || colecao.label}
        subtitle={areaAtiva ? colecao.label : undefined}
        onBack={() => {
          if (areaAtiva) navigate(`/bibliotecas/${colecao.id}`);
          else navigate('/bibliotecas');
        }}
      />

      {/* Hero */}
      <div className={`relative h-32 bg-gradient-to-r ${colecao.gradient} overflow-hidden`}>
        <img src={colecao.cover} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="relative h-full flex flex-col justify-end px-4 pb-3 text-white">
          <p className="text-[9px] uppercase tracking-[0.22em] font-bold text-white/80">
            {colecao.eyebrow}
          </p>
          <p className="text-xs text-white/85 line-clamp-2 mt-1">{colecao.subtitle}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full px-4 pt-4">
        {/* Search */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <Input
              value={voice.listening && voice.partial ? voice.partial : query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={mostrarAreas ? 'Buscar área ou livro…' : 'Buscar livro…'}
              className="pl-11 pr-3 h-14 text-base rounded-2xl bg-card border border-border/60"
            />
          </div>
          <button
            type="button"
            onClick={voice.toggle}
            aria-label={voice.listening ? 'Parar gravação' : 'Buscar por voz'}
            className={`relative overflow-hidden shrink-0 w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-[0.95] transition ${
              voice.listening
                ? 'bg-red-500 text-white animate-pulse shadow-red-500/40'
                : 'bg-primary text-primary-foreground shadow-primary/30'
            }`}
          >
            {voice.listening && <span className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />}
            {voice.listening
              ? <MicOff className="w-6 h-6 relative z-[2]" strokeWidth={2.5} />
              : <Mic className="w-6 h-6 relative z-[2]" strokeWidth={2.5} />}
          </button>
        </div>

        {/* Atalhos: Leitura, Favoritos, Recentes, Offline */}
        <div className="-mx-4">
          <BibliotecaAtalhosBar onAbrirLivro={setLivroAberto} filtroArea={areaAtiva ?? null} />
        </div>

        {/* Título da seção do acervo */}
        <div className="mt-2 mb-4">
          <p className="text-[10px] uppercase tracking-[0.22em] text-primary/90 font-bold">
            ACERVO
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-1 h-6 rounded-full bg-primary" />
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
              {mostrarAreas ? 'Áreas do Direito' : 'Todos os livros'}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1 ml-3">
            {mostrarAreas
              ? 'Escolha uma área para ver as obras daquele campo.'
              : 'Toque em um livro para abrir, favoritar ou começar a leitura.'}
          </p>
        </div>




        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[104px] rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : livros.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum livro ainda nesta coleção.
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Rode a importação em Admin → Atualização para popular o acervo.
            </p>
          </div>
        ) : mostrarAreas ? (
          <div className="flex flex-col gap-2">
            {areas
              .filter((a) => !query || norm(a.name).includes(norm(query)))
              .map((a, index) => {
                const s = styleForArea(a.name);
                const Icon = s.icon;
                return (
                  <motion.button
                    key={a.name}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.4) }}
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/bibliotecas/${colecao.id}/${encodeURIComponent(a.name)}`)}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border hover:border-primary/40 transition-colors text-left w-full relative overflow-hidden"
                  >
                    <div className="w-11 h-11 rounded-xl bg-secondary/70 flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6" style={{ color: s.color }} strokeWidth={1.6} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-display font-bold text-foreground text-[14px] leading-tight uppercase truncate">
                        {a.name}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {a.count} {a.count === 1 ? 'livro' : 'livros'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </motion.button>
                );
              })}
          </div>

        ) : (
          <div className="flex flex-col gap-2">
            {livrosVisiveis.map((l, i) => (
              <LivroCard
                key={`${colecao.id}-${l.id}`}
                livro={l}
                index={i}
                priority={i < 12}
                badge={badges.getBadge(colecao.id, colecao.table, l.id)}
                onClick={() => setLivroAberto(l)}
              />
            ))}
            {livrosVisiveis.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                Nenhum livro encontrado.
              </p>
            )}
          </div>
        )}
      </div>

      <LivroDetailSheet
        livro={livroAberto}
        open={!!livroAberto}
        onClose={handleCloseLivro}
      />

      <BibliotecaBottomNav />
    </div>
  );
};

export default BibliotecaCategoria;
