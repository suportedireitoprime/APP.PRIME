import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import type { BlogPost, BlogTema } from "@/data/blogPosts";
import BlogPostSheet from "@/components/vademecum/blog/BlogPostSheet";
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

// Novos componentes arquiteturais do Blog com Layout & Design idêntico ao Audiobooks
import { BlogHeroPanel, type BlogQuickActionType } from "@/components/vademecum/blog/BlogHeroPanel";
import { BlogContinuarLendoCard } from "@/components/vademecum/blog/BlogContinuarLendoCard";
import { BlogQuickActionSheet } from "@/components/vademecum/blog/BlogQuickActionSheet";
import BlogEmAltaCarousel from "@/components/vademecum/blog/BlogEmAltaCarousel";
import BlogCategoriasListSection from "@/components/vademecum/blog/BlogCategoriasListSection";
import BlogCategoriaSheet from "@/components/vademecum/blog/BlogCategoriaSheet";

// Tracking e métricas unificadas do blog
import { blogTracking, type BlogRecenteItem } from "@/lib/blogTracking";
import { useBlogDynamicTrending } from "@/hooks/useBlogDynamicTrending";
import { useBlogTrending } from "@/hooks/useBlogTrending";
import { useBlogPostsFilter } from "@/hooks/useBlogPostsFilter";

// Chunks modulares adicionais (biografia, feed etc.)
import {
  type BlogFilter,
  BlogBioTabContainer,
} from "@/components/vademecum/blog/chunks";

export type { BlogFilter };

const Blog = () => {
  const goBack = useGoBack();
  const location = useLocation();
  const isDesktop = useIsDesktop();

  const [selectedFilter, setSelectedFilter] = useState<BlogFilter>("todos");
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [gateOpen, setGateOpen] = useState(false);

  // Sheet de Ações Rápidas do Painel Hero (Favoritos | Recentes | Estatísticas | Temas)
  const [activeQuickSheet, setActiveQuickSheet] = useState<BlogQuickActionType | null>(null);

  // Sub-abas extras caso acionadas externamente (biografia, categorias em grade)
  const [mainTab, setMainTab] = useState<string>("artigos");
  const [selectedBioCategory, setSelectedBioCategory] = useState<string | null>(null);
  const [selectedBioPerson, setSelectedBioPerson] = useState<string | null>(null);

  // Categoria selecionada para visualização de artigos em tela dedicada
  const [selectedCategorySheet, setSelectedCategorySheet] = useState<BlogTema | string | null>(null);

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

  // Último artigo lido para atualizar dinamicamente o Continuar Lendo
  const [ultimoLido, setUltimoLido] = useState<BlogRecenteItem | null>(() =>
    blogTracking.getUltimoLido()
  );

  useEffect(() => {
    const handleRecUpdate = () => {
      setUltimoLido(blogTracking.getUltimoLido());
    };
    window.addEventListener("blog:recentes-updated", handleRecUpdate);
    return () => {
      window.removeEventListener("blog:recentes-updated", handleRecUpdate);
    };
  }, []);

  // Determina o artigo exibido no card "Continuar Lendo"
  const postContinuarLendo = useMemo(() => {
    if (ultimoLido) {
      const match = allPosts.find((p) => p.id === ultimoLido.id);
      if (match) return match;
    }
    return topTrendingPosts[0] || allPosts[0] || null;
  }, [ultimoLido, allPosts, topTrendingPosts]);

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

  // Compartilhamento via query string (?post=...)
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
      {/* Fundo ShapeGrid Dinâmico padrão do app (idêntico a Audiobooks) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ShapeGrid
          speed={0.5}
          squareSize={40}
          direction="diagonal"
          borderColor="rgba(226, 62, 87, 0.06)"
        />
      </div>

      {/* Painel Hero com Design & Layout Idêntico a Audiobooks (Full-Bleed, corte diagonal vermelho, botão de voltar premium e 4 botões de ação) */}
      <BlogHeroPanel
        onBack={() => goBack()}
        onSelectAction={(action) => setActiveQuickSheet(action)}
        activeAction={activeQuickSheet}
      />

      {/* Conteúdo Principal com Margens Laterais e Layout Fluido Idêntico a Audiobooks */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 mt-4 sm:mt-6 space-y-6">
        {/* Banner Continuar Lendo Dinâmico (atualiza ao abrir qualquer artigo) */}
        {postContinuarLendo && (
          <BlogContinuarLendoCard
            post={postContinuarLendo}
            onOpen={handleOpenPost}
          />
        )}

        {/* Seção Em Alta / Recomendações com Carrossel Fluido */}
        <BlogEmAltaCarousel
          posts={topTrendingPosts}
          onSelectPost={handleOpenPost}
          getViewCount={getPostViewCount}
          onRegisterClick={registerPostClick}
        />

        {/* Seção do Acervo de Categorias em Lista com Capas */}
        <BlogCategoriasListSection
          posts={allPosts}
          selectedCategory={selectedCategorySheet}
          onSelectCategory={handleOpenCategory}
          temas={categoriasDisponiveis}
        />
      </main>

      {/* Sheet de Ações Rápidas do Painel Hero (Favoritos | Recentes | Estatísticas | Temas) */}
      <BlogQuickActionSheet
        activeSheet={activeQuickSheet}
        onClose={() => setActiveQuickSheet(null)}
        allPosts={allPosts}
        temas={categoriasDisponiveis}
        onSelectPost={handleOpenPost}
        onSelectTema={handleOpenCategory}
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
