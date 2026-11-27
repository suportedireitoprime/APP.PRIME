import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Search, X, Clock, Star, Bookmark, BookOpen } from "lucide-react";
import { toast } from "sonner";
import type { BlogPost } from "@/data/blogPosts";
import BlogPostSheet from "@/components/vademecum/blog/BlogPostSheet";
import { useBlogPostsCache } from "@/hooks/useBlogPostsCache";
import { useFeatureLimit } from "@/hooks/useFeatureLimit";
import PremiumGate from "@/components/PremiumGate";
import { recordActivity } from "@/lib/continuity";
import { blogThumb, blogHero } from "@/lib/blogImg";
import { prefetchImage, prefetchImages } from "@/lib/cdnImg";
import ShapeGrid from "@/components/ui/ShapeGrid";
import { useIsDesktop } from "@/hooks/use-desktop";
import { blogTracking } from "@/lib/blogTracking";
import { useBlogDynamicTrending } from "@/hooks/useBlogDynamicTrending";
import { useBlogTrending } from "@/hooks/useBlogTrending";
import { haptic } from "@/lib/nativeHaptics";
import BlogHero from "@/components/blog/BlogHero";

// Capas de alta resolução
import blogRomaCover from "@/assets/blog/blog-roma-antiga-cover.webp";
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
    title: "Siga sua curiosidade jurídica.",
    subtitle: "Descubra teses, artigos e reflexões profundas que valem o seu tempo.",
    coverImg: blogRomaCover,
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
  {
    id: "recentes",
    label: "Recentes",
    title: "Lidos recentemente.",
    subtitle: "Continue a leitura de artigos consultados recentemente.",
    coverImg: blogRomaCover,
  },
];

function readFavoritesFromStorage(): string[] {
  try {
    const raw = localStorage.getItem("blog:favorites");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function readRecentsFromStorage(): string[] {
  try {
    const raw = localStorage.getItem("blog:recentes");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

const Blog = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = useIsDesktop();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [activeCategory, setActiveCategory] = useState<string>("todos");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => readFavoritesFromStorage());
  const [recentIds, setRecentIds] = useState<string[]>(() => readRecentsFromStorage());

  const { canUse, register, used, config } = useFeatureLimit("blog_read");
  const { posts: allPosts } = useBlogPostsCache();
  const { trendingIds } = useBlogTrending("todos");
  const { registerPostClick } = useBlogDynamicTrending(allPosts);

  // Categoria ativa atual
  const currentCategory = useMemo(() => {
    return CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0];
  }, [activeCategory]);

  // Pré-carregamento instantâneo (0ms) das capas de categorias na memória
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
      setRecentIds(readRecentsFromStorage());
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
    } else if (activeCategory === "recentes") {
      result = result.filter((p) => recentIds.includes(p.id));
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
  }, [allPosts, activeCategory, searchQuery, trendingIds, favoriteIds, recentIds]);

  // SEO & título da aba
  useEffect(() => {
    if (selectedPost) {
      document.title = `${selectedPost.titulo} | Blog Jurídico`;
    } else {
      document.title = `${currentCategory.title} | Blog Jurídico`;
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

      // Salva histórico de recentes
      try {
        const cur = readRecentsFromStorage().filter((id) => id !== post.id);
        const upd = [post.id, ...cur].slice(0, 30);
        localStorage.setItem("blog:recentes", JSON.stringify(upd));
        setRecentIds(upd);
      } catch {}
    },
    [canUse, register, registerPostClick]
  );

  const handleFocusSearch = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="min-h-dvh bg-[#09090B] text-white relative overflow-x-hidden pb-[calc(4rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] lg:pb-10">
      {/* Fundo Oficial apenas no mobile/tablet */}
      {!isDesktop && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <ShapeGrid />
        </div>
      )}

      {/* ── Painel de Topo Idêntico ao de Áudio Aulas com Capa de Roma Antiga & Céu Azul Claro ── */}
      <BlogHero
        totalArtigos={allPosts.length}
        totalFavoritos={favoriteIds.length}
        totalRecentes={recentIds.length}
        onVoltar={() => navigate('/')}
        onRecentes={() => {
          haptic.selection();
          setActiveCategory("recentes");
        }}
        onEmAlta={() => {
          haptic.selection();
          setActiveCategory("em-alta");
        }}
        onEstatistica={() => {
          haptic.selection();
          setActiveCategory("filosofia");
        }}
        onFavoritos={() => {
          haptic.selection();
          setActiveCategory("salvos");
        }}
        categoriaAtual={activeCategory}
      />

      {/* ── Conteúdo Principal em Layout Responsivo (Mobile, Tablet, Desktop) ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Barra de Pesquisa com Ícone Azul Claro em Destaque */}
        <div className="relative mb-5 max-w-2xl">
          <Search className="w-5 h-5 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.7)] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" strokeWidth={2.4} />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar teses, doutrina, autores ou temas..."
            className="w-full rounded-2xl bg-[#141416]/95 border border-white/10 pl-12 pr-10 py-3.5 text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/30 transition-all font-sans shadow-lg shadow-black/40 backdrop-blur-md"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-zinc-400 hover:text-white cursor-pointer z-10"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Menu de Alternância (Pílulas Horizontais com Scroll Infinito até a Borda Direita) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 mb-6 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  haptic.selection();
                  setActiveCategory(cat.id);
                }}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-lg shadow-sky-500/30 border border-sky-400/40"
                    : "bg-[#141416] text-zinc-300 hover:text-white border border-white/10 hover:bg-[#1A1A1E]"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
          {/* Espaçador final para scroll infinito sem cortar o último item */}
          <div className="w-4 shrink-0" aria-hidden="true" />
        </div>

        {/* ── Cabeçalho da Seção: TÍTULO EM UMA LINHA GARANTIDA ── */}
        <div className="mb-6 px-1">
          {/* Linha de Metadados: Badge e Categoria no topo */}
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-400/25 text-[11px] font-bold font-serif text-sky-300 tabular-nums shadow-sm">
              <BookOpen className="w-3 h-3 text-sky-400" />
              <span>{filteredPosts.length} artigos</span>
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-xs font-serif italic text-zinc-400">
              {currentCategory.label}
            </span>
          </div>

          {/* Título Oficial: 100% em uma única linha com truncate e tipografia de Audiobook */}
          <h2 className="font-serif font-bold text-xl sm:text-2xl md:text-3xl tracking-tight text-white truncate max-w-full leading-tight drop-shadow-sm">
            {currentCategory.title}
          </h2>

          {/* Subtítulo suave */}
          <p className="font-serif italic text-xs sm:text-sm md:text-base text-zinc-400 mt-1 leading-relaxed truncate max-w-full">
            {currentCategory.subtitle}
          </p>
        </div>

        {/* ── Lista de Artigos Responsiva (1 col Mobile, 2 cols Tablet, 3 cols Desktop) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filteredPosts.length === 0 ? (
            <div className="col-span-full py-16 text-center text-zinc-400 text-sm font-serif italic bg-[#141416]/40 rounded-3xl border border-white/5 p-8">
              <BookOpen className="w-10 h-10 text-sky-400/40 mx-auto mb-3" />
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
                  className="group relative flex items-start gap-4 p-4 rounded-3xl bg-[#141416]/95 hover:bg-[#1A1A1E] border border-white/10 hover:border-sky-400/30 transition-all duration-200 active:scale-[0.99] cursor-pointer shadow-lg shadow-black/30 backdrop-blur-md h-full flex-col justify-between"
                >
                  <div className="flex items-start gap-3.5 sm:gap-4 w-full">
                    {/* Capa em Proporção de Livro / Audiobook (3:4) com cantos curvados */}
                    <div className="relative w-[76px] h-[102px] sm:w-[84px] sm:h-[112px] shrink-0 rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shadow-md">
                      <img
                        src={blogThumb(post.imagem_url, 160)}
                        alt={post.titulo}
                        loading={idx < 8 ? "eager" : "lazy"}
                        fetchPriority={idx < 4 ? "high" : "auto"}
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = blogRomaCover;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    </div>

                    {/* Informações Editoriais no Padrão de Audiobook */}
                    <div className="flex-1 min-w-0 pr-1">
                      {/* Categoria / Tema em Badge Azul Claro e Botão Salvar na mesma linha */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-400/25 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-sky-300 font-sans truncate">
                          {post.tema || "Doutrina"}
                        </span>

                        {/* Botão Salvar / Estante */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(post.id);
                          }}
                          aria-label="Salvar artigo"
                          className="w-8 h-8 -mr-1 rounded-full flex items-center justify-center shrink-0 hover:bg-sky-500/15 active:scale-90 text-zinc-400 hover:text-sky-300 transition-all cursor-pointer"
                        >
                          <Bookmark
                            className={`w-4 h-4 transition-transform ${
                              isSaved ? "fill-sky-400 text-sky-400 scale-110 drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]" : "text-zinc-400"
                            }`}
                            strokeWidth={1.8}
                          />
                        </button>
                      </div>

                      {/* Título do Artigo em Playfair Display / Serif */}
                      <h3 className="font-serif font-bold text-base sm:text-[17px] text-white leading-snug group-hover:text-sky-300 transition-colors line-clamp-2 drop-shadow-sm">
                        {post.titulo}
                      </h3>

                      {/* Resumo sutil em 1-2 linhas */}
                      {post.resumo && (
                        <p className="font-sans text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                          {post.resumo}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Metadados no Rodapé do Card */}
                  <div className="w-full flex items-center justify-between flex-wrap gap-2 pt-2.5 mt-2 border-t border-white/[0.06] text-xs text-zinc-400 font-sans">
                    {post.autor ? (
                      <span className="font-serif italic text-zinc-300 text-xs truncate max-w-[150px]">
                        {post.autor}
                      </span>
                    ) : (
                      <span className="text-zinc-500 text-xs">Estudos Jurídicos</span>
                    )}

                    <div className="flex items-center gap-2.5">
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Clock className="w-3.5 h-3.5 text-sky-400" />
                        <span>{post.tempo_leitura_min || 8} min</span>
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span className="flex items-center gap-1 font-semibold text-zinc-300">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>4.9</span>
                      </span>
                    </div>
                  </div>
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
