import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import type { BlogPost } from '@/data/blogPosts';
import BlogPostSheet from '@/components/vademecum/blog/BlogPostSheet';
import BlogHeroHeader from '@/components/vademecum/blog/BlogHeroHeader';
import { useBlogPostsCache } from '@/hooks/useBlogPostsCache';
import { useFeatureLimit } from '@/hooks/useFeatureLimit';
import PremiumGate from '@/components/PremiumGate';
import BloggerBottomNav, { type BloggerTab } from '@/components/vademecum/blog/BloggerBottomNav';
import BlogCategoriasView from '@/components/vademecum/blog/BlogCategoriasView';
import { useIsDesktop } from '@/hooks/use-desktop';
import { KeepAlive } from '@/components/ui/KeepAlive';
import { recordActivity } from '@/lib/continuity';
import { useGoBack } from '@/hooks/useGoBack';
import { blogThumb } from '@/lib/blogImg';

// Hooks de trending e filtragem
import { useBlogTrending } from '@/hooks/useBlogTrending';
import { useBlogPostsFilter } from '@/hooks/useBlogPostsFilter';

// Chunks modulares extraídos
import {
  type BlogFilter,
  BlogInfoHeader,
  BlogFiltersBar,
  BlogBioTabContainer,
  BlogFeedView,
} from '@/components/vademecum/blog/chunks';

export type { BlogFilter };

const Blog = () => {
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
  const { allPosts, posts, visiblePosts } = useBlogPostsFilter(
    dbPosts,
    selectedFilter,
    bottomTab,
    trendingIds,
    blogLoaded
  );

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
    return () => {
      links.forEach((l) => l.remove());
    };
  }, [visiblePosts]);

  const handleOpenPost = useCallback(
    (post: BlogPost) => {
      if (!canUse) {
        setGateOpen(true);
        return;
      }
      setSelectedPost(post);
      register(post.id);
      recordActivity({ path: `/blog?post=${post.id}`, label: post.titulo, kind: 'blog' });
    },
    [canUse, register]
  );

  return (
    <div className="min-h-dvh bg-background">
      <BlogInfoHeader
        infoOpen={infoOpen}
        onToggleInfo={() => setInfoOpen((v) => !v)}
        onBack={() => goBack()}
      />

      {bottomTab !== 'favoritos' && bottomTab !== 'biografia' && bottomTab !== 'categorias' && (
        <BlogHeroHeader
          selectedTema={
            selectedFilter === 'trending' || selectedFilter === 'todos'
              ? null
              : selectedFilter
          }
        />
      )}

      {bottomTab !== 'biografia' && bottomTab !== 'categorias' && (
        <BlogFiltersBar
          selectedFilter={selectedFilter}
          onSelectFilter={(filter) => setSelectedFilter(filter)}
        />
      )}

      <KeepAlive active={bottomTab === 'biografia'}>
        <BlogBioTabContainer
          selectedBioPerson={selectedBioPerson}
          setSelectedBioPerson={setSelectedBioPerson}
          selectedBioCategory={selectedBioCategory}
          setSelectedBioCategory={setSelectedBioCategory}
        />
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
        <BlogFeedView
          isDesktop={isDesktop}
          selectedFilter={selectedFilter}
          visiblePosts={visiblePosts}
          posts={posts}
          blogLoaded={blogLoaded}
          selectedPost={selectedPost}
          canUse={canUse}
          onOpenPost={handleOpenPost}
          onCloseSelectedPost={() => setSelectedPost(null)}
        />
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
