import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
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

// Novos componentes arquiteturais do Blog
import type { BlogMainTab } from "@/components/vademecum/blog/BlogNavTabs";
import BlogEmAltaCarousel from "@/components/vademecum/blog/BlogEmAltaCarousel";
import BlogCategoriasListSection from "@/components/vademecum/blog/BlogCategoriasListSection";
import BlogFavoritesFab from "@/components/vademecum/blog/BlogFavoritesFab";
import BlogFavoritesSheet from "@/components/vademecum/blog/BlogFavoritesSheet";

// Hooks de trending dinâmico e filtragem
import { useBlogDynamicTrending } from "@/hooks/useBlogDynamicTrending";
import { useBlogTrending } from "@/hooks/useBlogTrending";
import { useBlogPostsFilter } from "@/hooks/useBlogPostsFilter";

// Chunks modulares
import {
  type BlogFilter,
  BlogInfoHeader,
  BlogFiltersBar,
  BlogBioTabContainer,
  BlogFeedView,
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

  // Menu de alternância principal: Artigos | Categorias | Carreiras | Biografia
  const [mainTab, setMainTab] = useState<BlogMainTab>("artigos");
  const [selectedBioCategory, setSelectedBioCategory] = useState<string | null>(null);
  const [selectedBioPerson, setSelectedBioPerson] = useState<string | null>(null);

  // Favoritos (Botão Flutuante)
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => readFavoritesFromStorage());

  const { canUse, register, used, config } = useFeatureLimit("blog_read");
  const { posts: dbPosts, loaded: blogLoaded } = useBlogPostsCache();

  // Custom hooks gerenciam o cache de trending e filtragem final de postagens
  const { trendingIds } = useBlogTrending(selectedFilter);

  // Mapeia mainTab para a aba esperada pelo filtro
  const bottomTabMapped = useMemo(() => {
    if (mainTab === "carreiras") return "carreiras";
    if (mainTab === "biografia") return "biografia";
    if (mainTab === "categorias") return "categorias";
    return "blogger";
  }, [mainTab]);

  const { allPosts, posts, visiblePosts } = useBlogPostsFilter(
    dbPosts,
    selectedFilter,
    bottomTabMapped,
    trendingIds,
    blogLoaded,
  );

  // Métrica dinâmica para os artigos em alta
  const { topTrendingPosts, registerPostClick, getPostViewCount } = useBlogDynamicTrending(allPosts);

  // Categorias criadas disponíveis com contagem de artigos
  const { categoriasDisponiveis, countsByTema } = useMemo(() => {
    const counts: Record<string, number> = {};
    allPosts.forEach((p) => {
      if (p.tema) {
        counts[p.tema] = (counts[p.tema] || 0) + 1;
      }
    });
    const sorted = Object.keys(counts).sort((a, b) => a.localeCompare(b, "pt-BR"));
    return { categoriasDisponiveis: sorted, countsByTema: counts };
  }, [allPosts]);

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
    } else if (mainTab === "carreiras") {
      document.title = "Carreiras Jurídicas | Blogger Jurídico";
    } else if (mainTab === "biografia") {
      document.title = "Biografias do Direito | Blogger Jurídico";
    } else if (mainTab === "categorias") {
      document.title = "Categorias | Blogger Jurídico";
    } else if (selectedFilter === "trending") {
      document.title = "Blogger Jurídico - Em Alta | Vade Mecum PRIME";
    } else if (selectedFilter !== "todos") {
      document.title = `Blogger Jurídico - ${selectedFilter} | Vade Mecum PRIME`;
    } else {
      document.title = "Blogger Jurídico | Vade Mecum PRIME";
    }
  }, [selectedPost, selectedFilter, mainTab]);

  // Compartilhamento via query string
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("post");
    if (id) {
      const found = allPosts.find((p) => p.id === id);
      if (found) setSelectedPost(found);
    }
  }, [location.search, allPosts]);

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
      registerPostClick(post.id);
      setSelectedPost(post);
      register(post.id);
      recordActivity({ path: `/blog?post=${post.id}`, label: post.titulo, kind: "blog" });
    },
    [canUse, register, registerPostClick],
  );

  const handleSelectCategoryFromList = useCallback((tema: BlogTema) => {
    setSelectedFilter(tema);
    setMainTab("artigos");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-dvh bg-background pb-16">
      <BlogInfoHeader
        infoOpen={infoOpen}
        onToggleInfo={() => setInfoOpen((v) => !v)}
        onBack={() => goBack()}
      />

      {mainTab === "artigos" && (
        <BlogHeroHeader
          selectedTema={
            selectedFilter === "trending" || selectedFilter === "todos" ? null : selectedFilter
          }
        />
      )}

      {mainTab === "artigos" && (
        <>
          {/* Seção Em Alta em Carrossel Infinito com Métrica Dinâmica */}
          <BlogEmAltaCarousel
            posts={topTrendingPosts}
            onSelectPost={handleOpenPost}
            getViewCount={getPostViewCount}
            onRegisterClick={registerPostClick}
          />

          {/* Menu de Alternância por Categoria logo abaixo de Em Alta */}
          <BlogFiltersBar
            selectedFilter={selectedFilter}
            onSelectFilter={(filter) => {
              setSelectedFilter(filter);
            }}
            categorias={categoriasDisponiveis}
            countsByTema={countsByTema}
          />
        </>
      )}

      {/* Aba de Biografia */}
      <KeepAlive active={mainTab === "biografia"}>
        <BlogBioTabContainer
          selectedBioPerson={selectedBioPerson}
          setSelectedBioPerson={setSelectedBioPerson}
          selectedBioCategory={selectedBioCategory}
          setSelectedBioCategory={setSelectedBioCategory}
        />
      </KeepAlive>

      {/* Aba de Categorias (Visualização em Lista) */}
      <KeepAlive active={mainTab === "categorias"}>
        <BlogCategoriasListSection
          posts={allPosts}
          selectedCategory={selectedFilter}
          onSelectCategory={handleSelectCategoryFromList}
        />
        <div className="border-t border-border/40 mt-4">
          <BlogCategoriasView
            posts={posts}
            onSelectCategoria={handleSelectCategoryFromList}
          />
        </div>
      </KeepAlive>

      {/* Aba de Artigos e Carreiras (Feed) */}
      <KeepAlive active={mainTab === "artigos" || mainTab === "carreiras"}>
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

        {/* Seção de Categorias em Lista abaixo do feed quando na aba Artigos */}
        {mainTab === "artigos" && selectedFilter === "todos" && (
          <div className="border-t border-border/30 mt-6 pt-2">
            <BlogCategoriasListSection
              posts={allPosts}
              selectedCategory={selectedFilter}
              onSelectCategory={handleSelectCategoryFromList}
            />
          </div>
        )}
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
    </div>
  );
};

export default Blog;

