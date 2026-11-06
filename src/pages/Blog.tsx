import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";
import { ChevronLeft, Search, X, Clock, Star, Bookmark } from "lucide-react";
import { toast } from "sonner";
import type { BlogPost } from "@/data/blogPosts";
import BlogPostSheet from "@/components/vademecum/blog/BlogPostSheet";
import { useBlogPostsCache } from "@/hooks/useBlogPostsCache";
import { useFeatureLimit } from "@/hooks/useFeatureLimit";
import PremiumGate from "@/components/PremiumGate";
import { recordActivity } from "@/lib/continuity";
import { useGoBack } from "@/hooks/useGoBack";
import { blogThumb, blogHero } from "@/lib/blogImg";
import { prefetchImage, prefetchImages } from "@/lib/cdnImg";
import ShapeGrid from "@/components/ui/ShapeGrid";
import { blogTracking } from "@/lib/blogTracking";
import { useBlogDynamicTrending } from "@/hooks/useBlogDynamicTrending";
import { useBlogTrending } from "@/hooks/useBlogTrending";
import { haptic } from "@/lib/nativeHaptics";

// Capas de alta resolução que mudam dinamicamente conforme o menu de alternância
import bibliotecaCoverImg from "@/assets/biblioteca-cover.webp";
import filosofiaImg from "@/assets/capa-filosofia.webp";
import stfImg from "@/assets/blog/stf.webp";
import constitucionalImg from "@/assets/lei-cover-cf88.webp";
import penalImg from "@/assets/capa-lei-penal-especial.webp";
import civilImg from "@/assets/blog/inquilinato.webp";
import carreirasImg from "@/assets/covers/vademecum-judge.webp";
import emAltaImg from "@/assets/covers/hero-advogados-tribunal.webp";
import salvosImg from "@/assets/covers/resumos-philosophers-hero.webp";

interface CategoryItem {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  coverImg: string;
}

const CATEGORIES: CategoryItem[] = [
  {
    id: "todos",
    label: "Todos",
    title: "Siga sua curiosidade.",
    subtitle: "Descubra artigos, teses e reflexões jurídicas que valem o seu tempo.",
    coverImg: bibliotecaCoverImg,
  },
  {
    id: "em-alta",
    label: "Em Alta",
    title: "O que o mundo jurídico debate agora.",
    subtitle: "Os temas mais consultados, comentados e lidos pela comunidade jurídica.",
    coverImg: emAltaImg,
  },
  {
    id: "filosofia",
    label: "Filosofia",
    title: "Pense além da letra fria da lei.",
    subtitle: "Grandes pensadores, dilemas éticos e as origens da teoria da justiça.",
    coverImg: filosofiaImg,
  },
  {
    id: "constitucional",
    label: "Constitucional",
    title: "O guardião dos direitos fundamentais.",
    subtitle: "Controle de constitucionalidade, garantias individuais e o pacto republicano.",
    coverImg: constitucionalImg,
  },
  {
    id: "penal",
    label: "Direito Penal",
    title: "Garantismo e dogmática penal.",
    subtitle: "Teoria do crime, execução da pena e limites do poder punitivo estatal.",
    coverImg: penalImg,
  },
  {
    id: "stf",
    label: "STF & Tribunais",
    title: "Precedentes que moldam o país.",
    subtitle: "Grandes julgamentos, repercussão geral e as teses da Suprema Corte.",
    coverImg: stfImg,
  },
  {
    id: "civil",
    label: "Civil & Contratos",
    title: "Relações privadas em evolução.",
    subtitle: "Contratos modernos, responsabilidade civil, direito imobiliário e famílias.",
    coverImg: civilImg,
  },
  {
    id: "carreiras",
    label: "Carreiras",
    title: "Estratégia e prática jurídica.",
    subtitle: "Técnicas de estudo para concursos de ponta, advocacia e rotina forense.",
    coverImg: carreirasImg,
  },
  {
    id: "salvos",
    label: "Salvos",
    title: "Sua estante de leituras.",
    subtitle: "Artigos que você marcou para ler com atenção ou consultar mais tarde.",
    coverImg: salvosImg,
  },
];

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

  const [activeCategory, setActiveCategory] = useState<string>("todos");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => readFavoritesFromStorage());

  const { canUse, register, used, config } = useFeatureLimit("blog_read");
  const { posts: allPosts } = useBlogPostsCache();
  const { trendingIds } = useBlogTrending("todos");
  const { registerPostClick } = useBlogDynamicTrending(allPosts);

  // Categoria ativa atual
  const currentCategory = useMemo(() => {
    return CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0];
  }, [activeCategory]);

  // Pré-carregamento instantâneo (0ms) de todas as capas de categorias na memória
  useEffect(() => {
    CATEGORIES.forEach((cat) => {
      const img = new Image();
      img.decoding = "async";
      img.src = cat.coverImg;
    });
  }, []);

  // Pré-aquecimento em background das capas dos artigos em lote para carregamento instantâneo
  useEffect(() => {
    if (!allPosts || allPosts.length === 0) return;
    const urls = allPosts
      .slice(0, 30)
      .map((p) => blogThumb(p.imagem_url, 160))
      .filter(Boolean);
    prefetchImages(urls);
  }, [allPosts]);

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

  const handleToggleFavorite = useCallback((postId: string) => {
    haptic.selection();
    const current = readFavoritesFromStorage();
    let updated: string[];
    if (current.includes(postId)) {
      updated = current.filter((id) => id !== postId);
      toast.success("Artigo removido dos salvos");
    } else {
      updated = [...current, postId];
      toast.success("Artigo salvo na sua estante!");
    }
    try {
      localStorage.setItem("blog:favorites", JSON.stringify(updated));
    } catch {}
    setFavoriteIds(updated);
    window.dispatchEvent(new Event("blog:favorites-updated"));
  }, []);

  // Filtragem dos posts
  const filteredPosts = useMemo(() => {
    let result = allPosts;

    // Filtro por categoria da pílula
    if (activeCategory === "em-alta") {
      if (trendingIds && trendingIds.length) {
        result = result.filter((p) => trendingIds.includes(p.id));
      }
    } else if (activeCategory === "filosofia") {
      result = result.filter(
        (p) =>
          p.tema?.toLowerCase().includes("filosofia") ||
          p.tema === "Clássicos"
      );
    } else if (activeCategory === "constitucional") {
      result = result.filter(
        (p) =>
          p.tema?.toLowerCase().includes("constitucional") ||
          p.tema?.toLowerCase().includes("leis")
      );
    } else if (activeCategory === "penal") {
      result = result.filter(
        (p) =>
          p.tema?.toLowerCase().includes("penal") ||
          p.tema?.toLowerCase().includes("inquisicao")
      );
    } else if (activeCategory === "stf") {
      result = result.filter(
        (p) =>
          p.tema?.toLowerCase().includes("stf") ||
          p.tema?.toLowerCase().includes("jurisprudência")
      );
    } else if (activeCategory === "civil") {
      result = result.filter(
        (p) =>
          p.tema?.toLowerCase().includes("civil") ||
          p.tema?.toLowerCase().includes("trabalho") ||
          p.tema?.toLowerCase().includes("tributário")
      );
    } else if (activeCategory === "carreiras") {
      result = result.filter(
        (p) =>
          p.tema?.toLowerCase().includes("carreira") ||
          p.tema?.toLowerCase().includes("iniciante") ||
          p.tema?.toLowerCase().includes("curiosidade")
      );
    } else if (activeCategory === "salvos") {
      result = result.filter((p) => favoriteIds.includes(p.id));
    }

    // Filtro de busca textual
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.titulo?.toLowerCase().includes(q) ||
          p.resumo?.toLowerCase().includes(q) ||
          p.autor?.toLowerCase().includes(q) ||
          p.tema?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [allPosts, activeCategory, searchQuery, trendingIds, favoriteIds]);

  // SEO & título da aba
  useEffect(() => {
    if (selectedPost) {
      document.title = `${selectedPost.titulo} | Blogger Jurídico`;
    } else {
      document.title = `${currentCategory.title} | Blogger Jurídico`;
    }
  }, [selectedPost, currentCategory]);

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
    [canUse, register, registerPostClick]
  );

  return (
    <div className="min-h-dvh bg-[#0D0D0D] text-white relative overflow-x-hidden pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-[calc(2.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]">
      {/* Fundo ShapeGrid Padrão Oficial do App */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ShapeGrid
          speed={0.5}
          squareSize={40}
          direction="diagonal"
          borderColor="rgba(124, 58, 237, 0.05)"
        />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6">
        {/* Top Header estilo App 12min */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => goBack()}
            aria-label="Voltar"
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-7 h-7" strokeWidth={2.4} />
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-sans tracking-tight">
            Todos os artigos
          </h1>
        </div>

        {/* Barra de Pesquisa Arredondada */}
        <div className="relative mb-3.5">
          <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar livros, ideias ou autores..."
            className="w-full rounded-2xl bg-[#171520] sm:bg-zinc-900/90 border border-white/10 pl-11 pr-10 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/25 transition-all font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Menu de Alternância (Pílulas Horizontais no Topo) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 mb-5">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  haptic.selection();
                  setActiveCategory(cat.id);
                }}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 cursor-pointer ${
                  isActive
                    ? "bg-[#7C3AED] text-white shadow-lg shadow-purple-600/30"
                    : "bg-[#1E1B2E] text-zinc-300 hover:text-white border border-white/10 hover:bg-zinc-800"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Capa que muda conforme o menu de alternância */}
        <div className="mb-7">
          <div className="w-full aspect-[16/9] max-h-[220px] sm:max-h-[300px] rounded-3xl overflow-hidden shadow-2xl relative border border-white/10 bg-zinc-900 group">
            <img
              src={currentCategory.coverImg}
              alt={currentCategory.title}
              className="w-full h-full object-cover transform-gpu"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Tipografia Moderna e Dinâmica sob a Capa */}
          <div className="mt-4 px-0.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
              {currentCategory.title}
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 font-normal leading-relaxed mt-1.5 font-sans">
              {currentCategory.subtitle}
            </p>
          </div>
        </div>

        {/* Título da Seção */}
        <div className="flex items-center justify-between mb-2 px-0.5">
          <h3 className="text-lg sm:text-xl font-bold text-white font-sans tracking-tight">
            {activeCategory === "todos"
              ? "Selecionados para você"
              : `Artigos em ${currentCategory.label}`}
          </h3>
          <span className="text-xs sm:text-sm font-semibold text-purple-400 font-sans">
            {filteredPosts.length} artigos
          </span>
        </div>

        {/* Lista de Artigos: Apenas uma linha fina dividindo cada item */}
        <div className="divide-y divide-white/[0.08]">
          {filteredPosts.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 text-sm font-sans">
              Nenhum artigo encontrado nesta categoria.
            </div>
          ) : (
            filteredPosts.map((post, idx) => {
              const isSaved = favoriteIds.includes(post.id);
              return (
                <div
                  key={post.id}
                  onClick={() => handleOpenPost(post)}
                  onPointerEnter={() => {
                    if (post.imagem_url) prefetchImage(blogHero(post.imagem_url));
                  }}
                  onTouchStart={() => {
                    if (post.imagem_url) prefetchImage(blogHero(post.imagem_url));
                  }}
                  className="flex items-center gap-3.5 sm:gap-4 py-3.5 sm:py-4 cursor-pointer group hover:bg-white/[0.03] px-2 rounded-2xl transition-all active:scale-[0.99]"
                >
                  {/* Capa em miniatura (proporção 3:4 com cantos arredondados) */}
                  <div className="relative w-[56px] h-[74px] sm:w-[64px] sm:h-[84px] shrink-0 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 shadow-md">
                    <img
                      src={blogThumb(post.imagem_url, 160)}
                      alt={post.titulo}
                      loading={idx < 10 ? "eager" : "lazy"}
                      fetchPriority={idx < 6 ? "high" : "auto"}
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = bibliotecaCoverImg;
                      }}
                    />
                  </div>

                  {/* Detalhes do Artigo */}
                  <div className="flex-1 min-w-0 pr-1">
                    <h4 className="font-bold text-sm sm:text-base text-white leading-snug line-clamp-2 group-hover:text-purple-300 transition-colors font-sans">
                      {post.titulo}
                    </h4>
                    <p className="text-xs text-zinc-400 font-medium mt-1 truncate font-sans">
                      {post.autor || post.tema}
                    </p>
                    <div className="flex items-center gap-2.5 mt-1.5 text-xs text-zinc-400 font-sans">
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{post.tempo_leitura_min || 8} min</span>
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span className="flex items-center gap-1 font-semibold text-zinc-300">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>4.8</span>
                      </span>
                    </div>
                  </div>

                  {/* Ícone de Salvar / Estante */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(post.id);
                    }}
                    aria-label="Salvar artigo"
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 hover:bg-white/10 active:scale-90 text-zinc-400 hover:text-white transition-all cursor-pointer"
                  >
                    <Bookmark
                      className={`w-5 h-5 transition-transform ${
                        isSaved ? "fill-purple-500 text-purple-500 scale-110" : "text-zinc-400"
                      }`}
                      strokeWidth={1.8}
                    />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Leitor Completo do Artigo */}
      <BlogPostSheet post={selectedPost} onClose={() => setSelectedPost(null)} />

      {/* Portão Premium se atingir limite */}
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
