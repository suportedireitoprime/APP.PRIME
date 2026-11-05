import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";
import type { BlogPost, BlogTema } from "@/data/blogPosts";
import BlogPostSheet from "@/components/vademecum/blog/BlogPostSheet";
import BlogHeroHeader from "@/components/vademecum/blog/BlogHeroHeader";
import { useBlogPostsCache } from "@/hooks/useBlogPostsCache";
import { useFeatureLimit } from "@/hooks/useFeatureLimit";
import PremiumGate from "@/components/PremiumGate";
import BlogCategoriasView from "@/components/vademecum/blog/BlogCategoriasView";
import { useIsDesktop } from "@/hooks/use-desktop";
import { KeepAlive } from "@/components/ui/KeepAlive";
import { recordActivity } from "@/lib/continuity";
import { useGoBack } from "@/hooks/useGoBack";
import { blogThumb } from "@/lib/blogImg";
import ShapeGrid from "@/components/ui/ShapeGrid";

// Componentes da página do Blog
import BlogEmAltaCarousel from "@/components/vademecum/blog/BlogEmAltaCarousel";
import BlogCategoriasListSection from "@/components/vademecum/blog/BlogCategoriasListSection";
import BlogCategoriaSheet from "@/components/vademecum/blog/BlogCategoriaSheet";
import BlogFavoritesFab from "@/components/vademecum/blog/BlogFavoritesFab";
import BlogFavoritesSheet from "@/components/vademecum/blog/BlogFavoritesSheet";

// Tracking e métricas
import { blogTracking } from "@/lib/blogTracking";
import { useBlogDynamicTrending } from "@/hooks/useBlogDynamicTrending";
import { useBlogTrending } from "@/hooks/useBlogTrending";
import { useBlogPostsFilter } from "@/hooks/useBlogPostsFilter";

// Chunks modulares (cabeçalho de navegação e abas secundárias)
import {
  type BlogFilter,
  BlogInfoHeader,
  BlogBioTabContainer,
} from "@/components/vademecum/blog/chunks";

export type { BlogFilter };

function readFavoritesFromStorage(): string[] {
  try {
    const raw = localStorage.getItem("blog:favorites");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return [];
}

const Blog = () => {
  const goBack = useGoBack();
  const location = useLocation();
  const isDesktop = useIsDesktop();

  const [selectedFilter, setSelectedFilter] = useState<BlogFilter>("todos");
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);

  // Sub-abas extras caso acionadas externamente (biografia, categorias em grade)
  const [mainTab] = useState<string>("artigos");
  const [selectedBioCategory, setSelectedBioCategory] = useState<string | null>(null);
  const [selectedBioPerson, setSelectedBioPerson] = useState<string | null>(null);

  // Categoria selecionada para visualização de artigos em sheet dedicado
  const [selectedCategorySheet, setSelectedCategorySheet] = useState<BlogTema | string | null>(null);

  // Favoritos (Aberto via FAB ou evento)
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => readFavoritesFromStorage());

  const { canUse, register, used, config } = useFeatureLimit("blog_read");
  const { posts: dbPosts, loaded: blogLoaded } = useBlogPostsCache();

  // Custom hooks gerenciam o cache de trending e filtragem de postagens
  const { trendingIds } = useBlogTrending(selectedFilter);

  const { allPosts, posts, visiblePosts } = useBlogPostsFilter(
    dbPosts,
    selectedFilter,
    "blogger",
    trendingIds,
    blogLoaded,
  );

  // Métrica dinâmica para os artigos em alta
  const { topTrendingPosts, registerPostClick, getPostViewCount } = useBlogDynamicTrending(allPosts);

  // Categorias disponíveis com contagem de artigos
  const { categoriasDisponiveis } = useMemo(() => {
    const counts: Record<string, number> = {};
    allPosts.forEach((p) => {
      if (p.tema) {
        counts[p.tema] = (counts[p.tema] || 0) + 1;
      }
    });
    const sorted = Object.keys(counts).sort((a, b) => a.localeCompare(b, "pt-BR"));
    return { categoriasDisponiveis: sorted };
  }, [allPosts]);

  // Posts filtrados da categoria aberta no sheet
  const categorySheetPosts = useMemo(() => {
    if (!selectedCategorySheet) return [];
    if (selectedCategorySheet === "Leis" || selectedCategorySheet === "Conceitos Fundamentais") {
      return allPosts.filter((p) => p.tema === "Leis" || p.tema === "Conceitos Fundamentais");
    }
    return allPosts.filter((p) => p.tema === selectedCategorySheet);
  }, [allPosts, selectedCategorySheet]);

  // Posts favoritados
  const favoritePosts = useMemo(() => {
    if (!favoriteIds.length || !allPosts.length) return [];
    const favSet = new Set(favoriteIds);
    return allPosts.filter((p) => favSet.has(p.id));
  }, [allPosts, favoriteIds]);

  // Listener para sincronizar os favoritos em tempo real
  useEffect(() => {
    const syncFavs = () => {
      setFavoriteIds(readFavoritesFromStorage());
    };
    window.addEventListener("blog:favorites-updated", syncFavs);
    window.addEventListener("storage", syncFavs);
    return () => {
      window.removeEventListener("blog:favorites-updated", syncFavs);
      window.removeEventListener("storage", syncFavs);
    };
  }, []);

  const handleRemoveFavorite = useCallback((postId: string) => {
    try {
      const current = readFavoritesFromStorage().filter((id) => id !== postId);
      localStorage.setItem("blog:favorites", JSON.stringify(current));
      setFavoriteIds(current);
      window.dispatchEvent(new Event("blog:favorites-updated"));
    } catch {
      /* ignore */
    }
  }, []);

  // SEO
  useEffect(() => {
    if (selectedPost) {
      document.title = `${selectedPost.titulo} | Blogger Jurídico`;
    } else if (mainTab === "biografia") {
      document.title = "Biografias do Direito | Blogger Jurídico";
    } else if (selectedFilter === "trending") {
      document.title = "Blogger Jurídico - Em Alta | Vade Mecum PRIME";
    } else if (selectedFilter !== "todos") {
      document.title = `Blogger Jurídico - ${selectedFilter} | Vade Mecum PRIME`;
    } else {
      document.title = "Blogger Jurídico | Vade Mecum PRIME";
    }
  }, [selectedPost, selectedFilter, mainTab]);

  const { slug: routeSlug } = useParams<{ slug?: string }>();
  // Compartilhamento via query string (?post=...) ou rota direta (/blog/:slug)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const target = params.get("post") || routeSlug;
    if (target && allPosts.length) {
      const found = allPosts.find((p) => p.id === target || (p as any).slug === target);
      if (found) setSelectedPost(found);
    }
  }, [location.search, routeSlug, allPosts]);

  // Preload Above-the-fold e capas Em Alta
  useEffect(() => {
    const toPreload = [
      ...visiblePosts.slice(0, 3).map((p) => p.imagem_url),
      ...topTrendingPosts.slice(0, 4).map((p) => p.imagem_url),
    ].filter(Boolean);

    toPreload.forEach((url) => {
      const img = new Image();
      img.src = blogThumb(url, 320);
    });
  }, [visiblePosts, topTrendingPosts]);

  const handleOpenPost = useCallback(
    (post: BlogPost) => {
      if (!canUse) {
        setGateOpen(true);
        return;
      }
      blogTracking.registrarLeitura(post);
      registerPostClick(post.id);
      setSelectedPost(post);
      register(post.id);
      recordActivity({ path: `/blog?post=${post.id}`, label: post.titulo, kind: "blog" });
    },
    [canUse, register, registerPostClick],
  );

  const handleOpenCategory = useCallback((tema: BlogTema | string) => {
    if (tema === "todos") {
      setSelectedFilter("todos");
      setSelectedCategorySheet(null);
      return;
    }
    setSelectedFilter(tema as BlogFilter);
    setSelectedCategorySheet(tema);
  }, []);

  const handleCloseCategorySheet = useCallback(() => {
    setSelectedCategorySheet(null);
    setSelectedFilter("todos");
  }, []);

  return (
    <div className="min-h-dvh bg-[#0D0D0D] text-white relative overflow-x-hidden pb-[calc(7rem+var(--sai-bottom,0px))]">
      {/* Fundo ShapeGrid Dinâmico padrão do app */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ShapeGrid
          speed={0.5}
          squareSize={40}
          direction="diagonal"
          borderColor="rgba(226, 62, 87, 0.06)"
        />
      </div>

      <div className="relative z-10">
        {/* Cabeçalho de Navegação Superior Original do Blog */}
        <BlogInfoHeader
          infoOpen={infoOpen}
          onToggleInfo={() => setInfoOpen((v) => !v)}
          onBack={() => goBack()}
        />

        {/* Painel Hero Original do Blog (com ilustrações jurídicas clássicas e tipografia autoral) */}
        <BlogHeroHeader
          selectedTema={
            selectedFilter === "trending" || selectedFilter === "todos" ? null : selectedFilter
          }
        />

        {/* Conteúdo Principal com Margens Elegantes */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 space-y-7 mt-5">
          {/* Seção Em Alta: Somente "EM ALTA", sem TOP 20, botão sem ícones, capas com degradê e títulos dentro */}
          <BlogEmAltaCarousel
            posts={topTrendingPosts}
            onSelectPost={handleOpenPost}
            getViewCount={getPostViewCount}
            onRegisterClick={registerPostClick}
          />

          {/* Seção Todas as Categorias: Margens refinadas, sem tag de blog jurídico, sem verde artificial */}
          <BlogCategoriasListSection
            posts={allPosts}
            selectedCategory={selectedCategorySheet}
            onSelectCategory={handleOpenCategory}
            temas={categoriasDisponiveis}
          />
        </main>
      </div>

      {/* Botão Flutuante de Favoritos (FAB) */}
      <BlogFavoritesFab
        count={favoriteIds.length}
        onClick={() => setFavoritesOpen(true)}
      />

      {/* Sheet de Favoritos (Abre de baixo para cima) */}
      <BlogFavoritesSheet
        open={favoritesOpen}
        onClose={() => setFavoritesOpen(false)}
        favoritePosts={favoritePosts}
        onSelectPost={handleOpenPost}
        onRemoveFavorite={handleRemoveFavorite}
      />

      {/* Sheet de Artigos da Categoria Selecionada */}
      <BlogCategoriaSheet
        open={Boolean(selectedCategorySheet)}
        onClose={handleCloseCategorySheet}
        categoria={selectedCategorySheet}
        posts={categorySheetPosts}
        onSelectPost={handleOpenPost}
        canUse={canUse}
        isDesktop={isDesktop}
      />

      {/* Aba de Biografia se acionada */}
      <KeepAlive active={mainTab === "biografia"}>
        <BlogBioTabContainer
          selectedBioPerson={selectedBioPerson}
          setSelectedBioPerson={setSelectedBioPerson}
          selectedBioCategory={selectedBioCategory}
          setSelectedBioCategory={setSelectedBioCategory}
        />
      </KeepAlive>

      {/* Aba de Categorias se acionada */}
      <KeepAlive active={mainTab === "categorias"}>
        <BlogCategoriasView
          posts={posts}
          onSelectCategoria={handleOpenCategory}
        />
      </KeepAlive>

      {!isDesktop && <BlogPostSheet post={selectedPost} onClose={() => setSelectedPost(null)} />}

      <PremiumGate
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        feature="blog"
        title="Limite de leituras atingido"
        description="Assinantes leem todos os artigos do Blog Jurídico sem limites."
        usageLabel={
          config ? `Você leu ${used} de ${config.limit_value} artigos este mês` : undefined
        }
      />
    </div>
  );
};

export default Blog;
