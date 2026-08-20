import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, Sparkles, Flame, BookOpenText } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { TEMAS, type BlogPost, type BlogTema } from '@/data/blogPosts';
import BlogPostSheet from '@/components/vademecum/BlogPostSheet';
import BlogHeroHeader from '@/components/vademecum/BlogHeroHeader';
import { useBlogPostsCache } from '@/hooks/useBlogPostsCache';
import { useFeatureLimit } from '@/hooks/useFeatureLimit';
import PremiumGate from '@/components/PremiumGate';
import BloggerBottomNav, { type BloggerTab } from '@/components/vademecum/BloggerBottomNav';
import BiografiaCategoriasView from '@/components/vademecum/BiografiaCategoriasView';
import BiografiaListView from '@/components/vademecum/BiografiaListView';
import BiografiaArtigoView from '@/components/vademecum/BiografiaArtigoView';
import BlogCategoriasView from '@/components/vademecum/BlogCategoriasView';
import { useIsDesktop } from '@/hooks/use-desktop';
import { LoadingState, EmptyState } from '@/components/ui/states';
import { KeepAlive } from '@/components/ui/KeepAlive';
import { recordActivity } from '@/lib/continuity';
import { useGoBack } from '@/hooks/useGoBack';
import { blogThumb } from '@/lib/blogImg';

// Novos hooks e componentes extraídos na refatoração
import { useBlogTrending } from '@/hooks/useBlogTrending';
import { useBlogPostsFilter } from '@/hooks/useBlogPostsFilter';
import { BlogPostCard } from '@/components/vademecum/BlogPostCard';

export type BlogFilter = 'trending' | 'todos' | BlogTema;

const Blog = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const location = useLocation();
  const isDesktop = useIsDesktop();
  
  const [selectedFilter, setSelectedFilter] = useState<BlogFilter>('todos');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [bottomTab, setBottomTab] = useState<BloggerTab>('blogger');
  const [selectedBioCategory, setSelectedBioCategory] = useState<string | null>(null);
  const [selectedBioPerson, setSelectedBioPerson] = useState<string | null>(null);

  const { canUse, register, used, config } = useFeatureLimit('blog_read');
  const { posts: dbPosts, loaded: blogLoaded } = useBlogPostsCache();

  // Custom hooks gerenciam o cache de trending e filtragem final de postagens
  const { trendingIds } = useBlogTrending(selectedFilter);
  const { allPosts, posts, visiblePosts } = useBlogPostsFilter(dbPosts, selectedFilter, bottomTab, trendingIds, blogLoaded);

  // SEO
  useEffect(() => {
    if (selectedPost) {
      document.title = `${selectedPost.titulo} | Blogger Jurídico`;
    } else if (selectedFilter === 'trending') {
      document.title = 'Blogger Jurídico - Em Alta | Vade Mecum PRIME';
    } else if (selectedFilter !== 'todos') {
      document.title = `Blogger Jurídico - ${selectedFilter} | Vade Mecum PRIME`;
    } else {
      document.title = 'Blogger Jurídico | Vade Mecum PRIME';
    }
  }, [selectedPost, selectedFilter]);

  // Compartilhamento via query string
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('post');
    if (id) {
      const found = allPosts.find((p) => p.id === id);
      if (found) setSelectedPost(found);
    }
  }, [location.search, allPosts]);

  // Preload Above-the-fold
  useEffect(() => {
    if (!visiblePosts.length) return;
    const links: HTMLLinkElement[] = [];
    visiblePosts.slice(0, 3).forEach((p) => {
      if (!p.imagem_url) return;
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = blogThumb(p.imagem_url);
      (link as HTMLLinkElement & { fetchPriority?: string }).fetchPriority = 'high';
      document.head.appendChild(link);
      links.push(link);
    });
    return () => { links.forEach((l) => l.remove()); };
  }, [visiblePosts]);

  const handleOpenPost = useCallback((post: BlogPost) => {
    if (!canUse) { setGateOpen(true); return; }
    setSelectedPost(post);
    register(post.id);
    recordActivity({ path: `/blog?post=${post.id}`, label: post.titulo, kind: 'blog' });
  }, [canUse, register]);

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg">
        <div className="max-w-3xl mx-auto">
          <PageHeader
            title="Blogger Jurídico"
            subtitle="Artigos, curiosidades e filosofia do Direito"
            onBack={() => goBack()}
            rightAction={
              <button
                onClick={() => setInfoOpen((v) => !v)}
                aria-expanded={infoOpen}
                aria-label="Sobre esta seção"
                className={`w-11 h-11 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-colors ${
                  infoOpen
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`}
              >
                <Info className="w-4 h-4" />
              </button>
            }
          />
        </div>
      </header>

      <AnimatePresence initial={false}>
        {infoOpen && (
          <motion.div
            key="info-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="overflow-hidden max-w-3xl mx-auto px-4"
          >
            <div className="mt-1 mb-2 rounded-2xl border border-primary/30 bg-card/60 backdrop-blur-sm p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="font-display text-sm font-bold text-foreground">O que é o Blogger?</h3>
              </div>
              <p className="font-body text-[12.5px] leading-relaxed text-muted-foreground">
                Uma curadoria de <strong className="text-foreground">artigos autorais</strong> sobre
                filosofia do Direito, decisões marcantes do STF e curiosidades que caem em prova.
                Toque no tema para filtrar.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {bottomTab !== 'favoritos' && bottomTab !== 'biografia' && bottomTab !== 'categorias' && (
        <BlogHeroHeader selectedTema={selectedFilter === 'trending' || selectedFilter === 'todos' ? null : selectedFilter} />
      )}

      {bottomTab !== 'biografia' && bottomTab !== 'categorias' && (
        <div id="blog-filters" className="bg-background border-b border-border/40">
          <div role="tablist" aria-label="Filtros de temas do blog" className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-3 max-w-3xl mx-auto">
            <button
              role="tab"
              aria-selected={selectedFilter === 'todos'}
              aria-label="Exibir todos os artigos"
              onClick={() => setSelectedFilter('todos')}
              className={`shrink-0 min-h-[38px] px-4 py-2 rounded-full text-xs font-body font-semibold uppercase tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                selectedFilter === 'todos'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              Todos
            </button>
            <button
              role="tab"
              aria-selected={selectedFilter === 'trending'}
              aria-label="Exibir artigos em alta"
              onClick={() => setSelectedFilter('trending')}
              className={`shrink-0 min-h-[38px] inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-body font-semibold uppercase tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                selectedFilter === 'trending'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-secondary text-amber-400 hover:bg-secondary/80'
              }`}
            >
              <Flame className="w-3.5 h-3.5" strokeWidth={2.5} />
              Em Alta
            </button>
            {[...TEMAS].sort((a, b) => a.localeCompare(b, 'pt-BR')).map((tema) => {
              const active = selectedFilter === tema;
              return (
                <button
                  key={tema}
                  role="tab"
                  aria-selected={active}
                  aria-label={`Filtrar por ${tema}`}
                  onClick={() => setSelectedFilter(tema)}
                  className={`shrink-0 min-h-[38px] px-4 py-2 rounded-full text-xs font-body font-semibold uppercase tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    active ? 'bg-primary text-primary-foreground shadow-md' : 'bg-secondary text-foreground hover:bg-secondary/80'
                  }`}
                >
                  {tema}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <KeepAlive active={bottomTab === 'biografia'}>
        {selectedBioPerson ? (
          <BiografiaArtigoView 
            personagemId={selectedBioPerson}
            onBack={() => {
              window.scrollTo({ top: 0 });
              setSelectedBioPerson(null);
            }} 
          />
        ) : selectedBioCategory ? (
          <BiografiaListView 
            categoriaId={selectedBioCategory}
            categoriaLabel={selectedBioCategory.charAt(0).toUpperCase() + selectedBioCategory.slice(1)}
            onBack={() => {
              window.scrollTo({ top: 0 });
              setSelectedBioCategory(null);
            }}
            onSelectPersonagem={(id) => {
              window.scrollTo({ top: 0 });
              setSelectedBioPerson(id);
            }}
          />
        ) : (
          <BiografiaCategoriasView onSelectCategoria={(id) => {
             window.scrollTo({ top: 0 });
             setSelectedBioCategory(id);
          }} />
        )}
      </KeepAlive>

      <KeepAlive active={bottomTab === 'categorias'}>
        <BlogCategoriasView 
          onSelectCategoria={(tema) => {
            setSelectedFilter(tema as BlogFilter);
            setBottomTab('blogger');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </KeepAlive>

      <KeepAlive active={bottomTab !== 'biografia' && bottomTab !== 'categorias'}>
        <div className={isDesktop ? 'mx-auto w-full max-w-7xl px-6 py-4 pb-16 flex gap-6 items-start' : 'max-w-3xl mx-auto px-4 py-4 space-y-3 pb-40'}>
          <div className={isDesktop ? 'w-[420px] shrink-0 space-y-3 max-h-[calc(100dvh-260px)] overflow-y-auto pr-2 -mr-2' : 'w-full space-y-3'}>
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedFilter}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="space-y-3 -mx-4 md:mx-0"
              >
                {visiblePosts.map((post, i) => (
                  <BlogPostCard
                    key={post.id}
                    post={post}
                    index={i}
                    active={isDesktop && selectedPost?.id === post.id}
                    isDesktop={isDesktop}
                    canUse={canUse}
                    onOpen={handleOpenPost}
                  />
                ))}
              </motion.div>
            </AnimatePresence>

            {!blogLoaded && (
              <LoadingState variant="list" rows={4} label="Carregando artigos mais recentes" className="-mx-4 md:mx-0" />
            )}

            {blogLoaded && posts.length === 0 && (
              <EmptyState
                icon={BookOpenText}
                title="Nenhum artigo encontrado"
                description="Ainda não há artigos publicados neste tema. Volte em breve."
              />
            )}
          </div>

          {isDesktop && (
            <div className="flex-1 min-w-0 sticky top-[220px] h-[calc(100dvh-260px)]">
              {selectedPost ? (
                <BlogPostSheet
                  inline
                  post={selectedPost}
                  onClose={() => setSelectedPost(null)}
                />
              ) : (
                <div className="h-full w-full rounded-2xl border border-dashed border-border/60 bg-card/30 flex flex-col items-center justify-center text-center px-8">
                  <Sparkles className="w-8 h-8 text-primary/70 mb-3" />
                  <h3 className="font-display text-lg text-foreground mb-1">Selecione um artigo</h3>
                  <p className="font-body text-sm text-muted-foreground max-w-sm">
                    Escolha um post da lista à esquerda para ler aqui, sem sair da página.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </KeepAlive>

      {!isDesktop && (
        <BlogPostSheet post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}

      <PremiumGate
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        feature="blog"
        title="Limite de leituras atingido"
        description="Assinantes leem todos os artigos do Blog Jurídico sem limites."
        usageLabel={config ? `Você leu ${used} de ${config.limit_value} artigos este mês` : undefined}
      />
      
      <BloggerBottomNav 
        active={bottomTab} 
        onChange={(tab) => {
          setBottomTab(tab);
          if (tab === 'blogger') {
            setSelectedFilter('todos');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else if (tab === 'carreiras') {
            setSelectedFilter('Carreiras Jurídicas');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else if (tab === 'categorias') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else if (tab === 'biografia') {
            setSelectedBioCategory(null);
            setSelectedBioPerson(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }} 
      />
    </div>
  );
};

export default Blog;
