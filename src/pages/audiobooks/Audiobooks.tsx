import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Headphones,
  Play,
  Clock,
  Search,
  Bell,
  ChevronRight,
  X,
  Heart,
  Bookmark,
  Check,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ShapeGrid from "@/components/ui/ShapeGrid";
import { haptic } from "@/lib/nativeHaptics";
import {
  AUDIOBOOKS_CATALOGO,
  O_CASO_DOS_EXPLORADORES_DE_CAVERNAS,
  AudiobookLivro,
} from "@/data/audiobooksCatalogo";
import { criarLivroPlayerResumo, hasResumoDisponivel, getResumoForLivro } from "@/data/audiobooksResumosMap";
import { AudiobookDetailSheet } from "@/components/audiobooks/AudiobookDetailSheet";
import { AudiobookModalidadeDialog } from "@/components/audiobooks/AudiobookModalidadeDialog";
import { AudiobooksHeroPanel } from "@/components/audiobooks/AudiobooksHeroPanel";
import { AudiobooksContinuarOuvindoCard } from "@/components/audiobooks/AudiobooksContinuarOuvindoCard";
import {
  AudiobooksQuickActionSheet,
  AudiobookQuickActionType,
} from "@/components/audiobooks/AudiobooksQuickActionSheet";
import { audiobooksTracking, AudiobookRecenteItem } from "@/lib/audiobooksTracking";
import { useAudiobookPlayer } from "@/contexts/AudiobookPlayerContext";
import { hydrateAudiobook } from "@/lib/audiobooksLoader";

export type AudiobookCategoriaTab = "classicos" | "lideranca" | "fora_da_toga" | "oratoria";

export function getAudiobookCategoria(livro: AudiobookLivro): "classicos" | "lideranca" | "fora_da_toga" | "oratoria" {
  const t = (livro.titulo || "").toLowerCase();
  const id = (livro.id || "").toLowerCase();
  const tagsStr = (livro.tags || []).join(" ").toLowerCase();

  // 1. Oratória
  if (
    t.includes("discurso") ||
    t.includes("oratória") ||
    t.includes("oratoria") ||
    t.includes("retórica") ||
    t.includes("retorica") ||
    t.includes("falar em público") ||
    t.includes("comunic") ||
    id.includes("discurso") ||
    id.includes("oratoria") ||
    tagsStr.includes("oratória") ||
    tagsStr.includes("oratoria")
  ) {
    return "oratoria";
  }

  // 2. Liderança
  if (
    t.includes("monge") ||
    t.includes("arte da guerra") ||
    t.includes("virando a própria mesa") ||
    t.includes("meta: um processo") ||
    t.includes("príncipe") ||
    t.includes("principe") ||
    t.includes("liderança") ||
    t.includes("lideranca") ||
    t.includes("gestão") ||
    t.includes("gestao") ||
    id.includes("monge") ||
    id.includes("arte-da-guerra") ||
    id.includes("virando") ||
    id.includes("meta") ||
    tagsStr.includes("liderança") ||
    tagsStr.includes("lideranca")
  ) {
    return "lideranca";
  }

  // 3. Fora da Toga (Ficção, Literatura, Sociedade, Filosofia geral)
  if (
    t.includes("revolução dos bichos") ||
    t.includes("1984") ||
    t.includes("como as democracias") ||
    t.includes("mundo assombrado") ||
    t.includes("mundo de sofia") ||
    t.includes("o processo") ||
    t.includes("advogado do diabo") ||
    t.includes("riqueza das nações") ||
    t.includes("crime e castigo") ||
    id.includes("1984") ||
    id.includes("revolucao") ||
    id.includes("processo") ||
    id.includes("democracias") ||
    id.includes("sofia") ||
    id.includes("assombrado") ||
    id.includes("diabo") ||
    id.includes("riqueza") ||
    id.includes("crime-e-castigo")
  ) {
    return "fora_da_toga";
  }

  // 4. Clássicos (Clássicos do Direito e da Filosofia Jurídica)
  return "classicos";
}

export function getAudiobookDuracaoBadge(livro: AudiobookLivro): string {
  if (livro.duracaoTotalFormatada && livro.duracaoTotalFormatada.includes("min")) {
    return livro.duracaoTotalFormatada.replace("~", "").trim();
  }
  if (livro.duracaoTotalSegundos && livro.duracaoTotalSegundos > 0) {
    return `${Math.round(livro.duracaoTotalSegundos / 60)} min`;
  }
  const resumo = getResumoForLivro(livro);
  if (resumo?.duracaoFormatada) {
    return resumo.duracaoFormatada.replace("~", "").trim();
  }
  if (livro.totalCapitulos && livro.totalCapitulos > 0) {
    return `${livro.totalCapitulos * 10} min`;
  }
  return "35 min";
}

export interface CategoriaTema {
  id: AudiobookCategoriaTab;
  label: string;
  subtitulo: string;
  corPrimaria: string;       // tab background & button bg
  corSecundaria: string;     // border, glow, title accent
  corBadgeNum: string;       // duration numbers color
  corSombra: string;         // shadow color
  corHoverBotao: string;
  corFundoBotao: string;
}

export const CATEGORIAS_THEMES: Record<AudiobookCategoriaTab, CategoriaTema> = {
  classicos: {
    id: "classicos",
    label: "Clássicos",
    subtitulo: "Grandes obras e fundamentos do pensamento jurídico",
    corPrimaria: "#7C3AED",       // Roxo Imperial
    corSecundaria: "#A855F7",
    corBadgeNum: "#C084FC",
    corSombra: "rgba(124, 58, 237, 0.55)",
    corHoverBotao: "#6D28D9",
    corFundoBotao: "#7C3AED",
  },
  lideranca: {
    id: "lideranca",
    label: "Liderança",
    subtitulo: "Estratégia, poder, negociação e alta performance",
    corPrimaria: "#D97706",       // Âmbar / Ouro Nobre
    corSecundaria: "#F59E0B",
    corBadgeNum: "#FCD34D",
    corSombra: "rgba(217, 119, 6, 0.55)",
    corHoverBotao: "#B45309",
    corFundoBotao: "#D97706",
  },
  fora_da_toga: {
    id: "fora_da_toga",
    label: "Fora da Toga",
    subtitulo: "Ficção, distopias, sociedade e visão de mundo",
    corPrimaria: "#2563EB",       // Azul Royal Safira
    corSecundaria: "#3B82F6",
    corBadgeNum: "#93C5FD",
    corSombra: "rgba(37, 99, 235, 0.55)",
    corHoverBotao: "#1D4ED8",
    corFundoBotao: "#2563EB",
  },
  oratoria: {
    id: "oratoria",
    label: "Oratória",
    subtitulo: "Retórica, argumentação, fala em público e júri",
    corPrimaria: "#DC2626",       // Carmim / Rubi
    corSecundaria: "#EF4444",
    corBadgeNum: "#FCA5A5",
    corSombra: "rgba(220, 38, 38, 0.55)",
    corHoverBotao: "#B91C1C",
    corFundoBotao: "#DC2626",
  },
};

/** Formata a duração destacando os números na cor temática da categoria selecionada */
export function formatDuracaoComNumeros(duracao: string, corNumero = "#C084FC") {
  if (!duracao) return null;
  const parts = duracao.split(/(\d+)/);
  return parts.map((part, i) =>
    /^\d+$/.test(part) ? (
      <span key={i} className="font-extrabold font-mono" style={{ color: corNumero }}>
        {part}
      </span>
    ) : (
      <span key={i} className="text-white/60 font-mono">
        {part}
      </span>
    )
  );
}

export const formatDuracaoComNumerosRoxos = (duracao: string) =>
  formatDuracaoComNumeros(duracao, "#C084FC");

export default function AudiobooksPage() {
  const navigate = useNavigate();
  const player = useAudiobookPlayer();

  // Livro aberto no Painel de Detalhes
  const [livroSelecionado, setLivroSelecionado] = useState<AudiobookLivro | null>(() => {
    if (typeof window !== "undefined") {
      const idParam = new URLSearchParams(window.location.search).get("livro");
      if (idParam) {
        return AUDIOBOOKS_CATALOGO.find((b) => b.id === idParam) ?? null;
      }
    }
    return null;
  });

  // Livro selecionado para escolher modalidade (Audiobook Completo vs Resumo Analítico)
  const [livroModalidade, setLivroModalidade] = useState<AudiobookLivro | null>(null);

  // Sheet de Ações Rápidas do Painel Hero (Favoritos | Recentes | Estatísticas | Outros)
  const [activeQuickSheet, setActiveQuickSheet] = useState<AudiobookQuickActionType | null>(null);

  // IDs favoritados
  const [favIds, setFavIds] = useState<Set<string>>(() =>
    new Set(audiobooksTracking.getFavoritos().map((f) => f.id))
  );

  // Lembretes de notificação salvos em localStorage
  const [notificados, setNotificados] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem("audiobooks_notificacoes");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // Busca e Filtros de Categoria (inicia por padrão em "classicos": "classicos", "lideranca", "fora_da_toga", "oratoria")
  const [termoBusca, setTermoBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<AudiobookCategoriaTab>("classicos");

  // Tema visual ativo de acordo com a categoria selecionada (para guiar o usuário com cores distintas)
  const temaAtivo = useMemo(() => {
    return CATEGORIAS_THEMES[filtroCategoria] || CATEGORIAS_THEMES.classicos;
  }, [filtroCategoria]);

  // Rastreamento dos livros iniciados pelo usuário (onde ele já deu play)
  const [livrosIniciados, setLivrosIniciados] = useState<Set<string>>(() =>
    audiobooksTracking.getLivrosIniciadosIds()
  );

  // Último livro ouvido para atualizar dinamicamente o Continuar Ouvindo
  const [ultimoOuvido, setUltimoOuvido] = useState<AudiobookRecenteItem | null>(() =>
    audiobooksTracking.getUltimoOuvido()
  );

  // Escuta atualizações de progresso em tempo real
  useEffect(() => {
    const handleUpdate = () => {
      setLivrosIniciados(audiobooksTracking.getLivrosIniciadosIds());
      setUltimoOuvido(audiobooksTracking.getUltimoOuvido());
    };
    window.addEventListener("audiobook-progresso-updated", handleUpdate);
    return () => {
      window.removeEventListener("audiobook-progresso-updated", handleUpdate);
    };
  }, []);

  // Determina o livro exibido no card de "Continuar Ouvindo"
  const livroContinuarOuvindo = useMemo(() => {
    if (player.livroAtual) return player.livroAtual;
    if (ultimoOuvido) {
      const match = AUDIOBOOKS_CATALOGO.find((l) => l.id === ultimoOuvido.id);
      if (match) return match;
    }
    return O_CASO_DOS_EXPLORADORES_DE_CAVERNAS;
  }, [player.livroAtual, ultimoOuvido]);

  // Progresso a exibir no card Continuar Ouvindo
  const progressoContinuarOuvindo = useMemo(() => {
    if (player.livroAtual && player.capituloAtual) {
      return {
        capituloIndex: player.capituloIndex,
        time: player.tempo,
      };
    }
    if (ultimoOuvido && ultimoOuvido.id === livroContinuarOuvindo.id) {
      return {
        capituloIndex: ultimoOuvido.capituloIndex,
        time: ultimoOuvido.tempoSegundos,
      };
    }
    const salvo = audiobooksTracking.getProgresso(livroContinuarOuvindo.id);
    if (salvo) {
      return {
        capituloIndex: salvo.capituloIndex,
        time: salvo.tempoSegundos,
      };
    }
    return null;
  }, [player.livroAtual, player.capituloAtual, player.capituloIndex, player.tempo, ultimoOuvido, livroContinuarOuvindo]);

  const abrirCapitulo = useCallback((index: number, livroAlvo?: AudiobookLivro) => {
    haptic.selection();
    const targetLivro = livroAlvo || livroSelecionado || livroContinuarOuvindo;
    setLivroSelecionado(null);
    setActiveQuickSheet(null);

    // Inicia reprodução via player global com persistência no Supabase
    if (targetLivro) {
      player.tocarLivro(targetLivro, index);
    }
  }, [livroSelecionado, livroContinuarOuvindo, player]);

  const abrirResumo = useCallback((livroAlvo: AudiobookLivro, capIdx = 0) => {
    haptic.selection();
    const livroResumo = criarLivroPlayerResumo(livroAlvo);
    setLivroSelecionado(null);
    setActiveQuickSheet(null);

    // Inicia reprodução do resumo no capítulo selecionado com legendas sincronizadas via player global
    player.tocarLivro(livroResumo, capIdx);
  }, [player]);

  // Alterna favorito de uma obra
  const toggleFavorito = useCallback((livro: AudiobookLivro, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    haptic.impact();
    const added = audiobooksTracking.toggleFavorito(livro);
    setFavIds(new Set(audiobooksTracking.getFavoritos().map((f) => f.id)));
    if (added) {
      toast.success(`"${livro.titulo}" adicionado aos favoritos!`);
    } else {
      toast.info(`"${livro.titulo}" removido dos favoritos.`);
    }
  }, []);

  // Alterna notificação do usuário para obras "Em Breve"
  const toggleNotificacao = useCallback((livroId: string, titulo: string) => {
    haptic.impact();
    setNotificados((prev) => {
      const novoEstado = !prev[livroId];
      const atualizado = { ...prev, [livroId]: novoEstado };
      try {
        localStorage.setItem("audiobooks_notificacoes", JSON.stringify(atualizado));
      } catch {}

      if (novoEstado) {
        toast.success(`Notificação ativada para "${titulo}"! Você será avisado no lançamento.`);
      } else {
        toast.info(`Notificação cancelada para "${titulo}".`);
      }

      return atualizado;
    });
  }, []);

  // Lista filtrada do catálogo completo por Categoria e Busca
  const livrosFiltrados = useMemo(() => {
    return AUDIOBOOKS_CATALOGO.filter((livro) => {
      // Filtro de Categoria (inicia com Clássicos)
      const cat = getAudiobookCategoria(livro);
      if (cat !== filtroCategoria) return false;

      // Filtro de Busca por Título, Autor ou Tags
      if (termoBusca.trim()) {
        const query = termoBusca.toLowerCase();
        const matchTitulo = livro.titulo.toLowerCase().includes(query);
        const matchAutor = livro.autor?.toLowerCase().includes(query);
        const matchTag = livro.tags?.some((t) => t.toLowerCase().includes(query));
        return matchTitulo || matchAutor || matchTag;
      }

      return true;
    });
  }, [termoBusca, filtroCategoria]);

  // Livros recomendados para a seção de destaque
  const livrosRecomendados = useMemo(() => {
    const disponiveis = AUDIOBOOKS_CATALOGO.filter((l) => l.status === "disponivel");
    const emBreve = AUDIOBOOKS_CATALOGO.filter((l) => l.status !== "disponivel");
    return [...disponiveis, ...emBreve].slice(0, 12);
  }, []);

  // Contadores dinâmicos para as abas 3D estilo pasta (inicia com Clássicos)
  const categoriasCounts = useMemo(() => {
    const counts: Record<AudiobookCategoriaTab, number> = {
      classicos: 0,
      lideranca: 0,
      fora_da_toga: 0,
      oratoria: 0,
    };
    for (const livro of AUDIOBOOKS_CATALOGO) {
      const cat = getAudiobookCategoria(livro);
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, []);

  const CATEGORIAS_TABS = useMemo(() => [
    { id: "classicos" as const, label: "Clássicos", count: categoriasCounts.classicos },
    { id: "lideranca" as const, label: "Liderança", count: categoriasCounts.lideranca },
    { id: "fora_da_toga" as const, label: "Fora da Toga", count: categoriasCounts.fora_da_toga },
    { id: "oratoria" as const, label: "Oratória", count: categoriasCounts.oratoria },
  ], [categoriasCounts]);

  // 4 cópias para permitir rolagem contínua infinita sem margem morta na esquerda (idêntico a Leis em Alta)
  const loopedItems = useMemo(() => {
    if (livrosRecomendados.length === 0) return [];
    return [
      ...livrosRecomendados,
      ...livrosRecomendados,
      ...livrosRecomendados,
      ...livrosRecomendados,
    ];
  }, [livrosRecomendados]);

  const carouselScrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  // Pré-carrega capas dos livros em memória para exibição instantânea a 0ms
  useEffect(() => {
    AUDIOBOOKS_CATALOGO.slice(0, 16).forEach((livro) => {
      if (livro.capaUrl) {
        const img = new Image();
        img.src = livro.capaUrl;
      }
    });
  }, []);
  const [isReady, setIsReady] = useState(false);
  const isInteractingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);

  const pauseAutoplay = useCallback(() => {
    isInteractingRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, 4000);
  }, []);

  // Centraliza um card específico do carrossel suavemente ou instantaneamente
  const scrollCarouselToIndex = useCallback(
    (idx: number, behavior: ScrollBehavior = "smooth") => {
      const el = carouselScrollerRef.current;
      if (!el) return;
      const child = el.children[idx] as HTMLElement | undefined;
      if (!child) return;
      const target = child.offsetLeft - (el.clientWidth - child.clientWidth) / 2;
      el.scrollTo({ left: target, behavior });
      setActiveCarouselIndex(idx);
    },
    [],
  );

  // Inicializa o carrossel centralizado no segundo bloco (sem margem morta na esquerda, padrão Leis em Alta)
  useEffect(() => {
    if (livrosRecomendados.length > 0 && !isReady) {
      const initialIndex = livrosRecomendados.length;
      setActiveCarouselIndex(initialIndex);
      const timer = setTimeout(() => {
        scrollCarouselToIndex(initialIndex, "instant" as ScrollBehavior);
        setIsReady(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [livrosRecomendados.length, isReady, scrollCarouselToIndex]);

  // Escuta a rolagem e realiza o teleporte silencioso de 0ms nas bordas para loop infinito contínuo
  const handleCarouselScroll = useCallback(() => {
    const el = carouselScrollerRef.current;
    if (!el) return;

    const center = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i] as HTMLElement;
      const mid = child.offsetLeft + child.clientWidth / 2;
      const dist = Math.abs(mid - center);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }

    const N = livrosRecomendados.length;
    if (N > 0) {
      if (best <= 1) {
        const jumpTo = best + N * 2;
        const child = el.children[jumpTo] as HTMLElement;
        if (child) {
          el.scrollTo({
            left: child.offsetLeft - (el.clientWidth - child.clientWidth) / 2,
            behavior: "auto",
          });
          setActiveCarouselIndex(jumpTo);
          return;
        }
      } else if (best >= loopedItems.length - 2) {
        const jumpTo = best - N * 2;
        const child = el.children[jumpTo] as HTMLElement;
        if (child) {
          el.scrollTo({
            left: child.offsetLeft - (el.clientWidth - child.clientWidth) / 2,
            behavior: "auto",
          });
          setActiveCarouselIndex(jumpTo);
          return;
        }
      }
    }

    setActiveCarouselIndex(best);
  }, [livrosRecomendados.length, loopedItems.length]);

  // Autoplay contínuo suave (idêntico a Leis em Alta)
  useEffect(() => {
    if (livrosRecomendados.length <= 1 || !isReady) return;

    const interval = setInterval(() => {
      if (isInteractingRef.current || document.hidden) return;

      const el = carouselScrollerRef.current;
      setActiveCarouselIndex((prev) => {
        let current = prev;
        const N = livrosRecomendados.length;

        // Teleporte silencioso nas proximidades da borda
        if (N > 0 && current >= loopedItems.length - N - 2 && el) {
          const equivalent = (current % N) + N * 2;
          const childCurr = el.children[current] as HTMLElement | undefined;
          const childEq = el.children[equivalent] as HTMLElement | undefined;
          if (childCurr && childEq) {
            const diff = childCurr.offsetLeft - childEq.offsetLeft;
            el.style.scrollBehavior = "auto";
            el.style.scrollSnapType = "none";
            el.scrollLeft -= diff;
            void el.offsetHeight;
            el.style.scrollSnapType = "";
            el.style.scrollBehavior = "";
            current = equivalent;
          }
        }

        const nextIndex = current + 1;
        scrollCarouselToIndex(nextIndex);
        return nextIndex;
      });
    }, 5000);

    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [livrosRecomendados.length, isReady, scrollCarouselToIndex, loopedItems.length]);

  // Detecção cirúrgica de arrasto (drag) para não abrir o card acidentalmente durante rolagem
  const handlePointerDown = (e: React.PointerEvent) => {
    pauseAutoplay();
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerStartRef.current) return;
    const dx = Math.abs(e.clientX - pointerStartRef.current.x);
    const dy = Math.abs(e.clientY - pointerStartRef.current.y);
    if (dx > 8 || dy > 8) {
      isDraggingRef.current = true;
    }
  };

  const handlePointerUp = () => {
    pointerStartRef.current = null;
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 60);
  };

  const handleCarouselCardClick = (livro: AudiobookLivro, idx: number) => {
    if (isDraggingRef.current) return;
    pauseAutoplay();
    haptic.selection();
    if (idx !== activeCarouselIndex) {
      scrollCarouselToIndex(idx);
    }
    if (livro.status === 'disponivel' && (!livro.capitulos || livro.capitulos.length === 0)) {
      void hydrateAudiobook(livro);
    }
    setLivroModalidade(livro);
  };

  const handleCardClick = (livro: AudiobookLivro) => {
    haptic.selection();
    if (livro.status === 'disponivel' && (!livro.capitulos || livro.capitulos.length === 0)) {
      void hydrateAudiobook(livro);
    }
    setLivroModalidade(livro);
  };

  return (
    <div className="min-h-dvh bg-[#0D0D0D] text-white relative overflow-x-hidden pb-[calc(7rem+var(--sai-bottom,0px))]">
      {/* Fundo Oficial Idêntico ao Início do App */}
      <div className="fixed inset-0 z-0">
        <ShapeGrid />
      </div>

      {/* Painel Hero Estilo Vade Mecum (Full-Bleed, sem margens laterais, botão de voltar embutido e 4 funções) */}
      <AudiobooksHeroPanel
        onBack={() => {
          haptic.selection();
          navigate('/');
        }}
        onSelectAction={(action) => {
          setActiveQuickSheet(action);
        }}
        activeAction={activeQuickSheet}
      />

      {/* Conteúdo Principal com Margens Laterais e Layout Fluido */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 mt-4 sm:mt-6 space-y-6">
        {/* Banner Continuar Ouvindo Dinâmico (atualiza ao abrir qualquer audiobook) */}
        <AudiobooksContinuarOuvindoCard
          livro={livroContinuarOuvindo}
          progressoSalvo={progressoContinuarOuvindo}
          onPlay={(idx) => abrirCapitulo(idx, livroContinuarOuvindo)}
        />

        {/* ======================================================== */}
        {/* SEÇÃO RECOMENDAÇÕES (DESTAQUES DA COLEÇÃO)               */}
        {/* ======================================================== */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="min-w-0 flex-1">
              <h3 className="font-sans text-white text-[15px] sm:text-[16px] font-bold flex items-center gap-2 uppercase tracking-wider">
                <span className="w-1 h-5 rounded-full bg-[#7C3AED] shrink-0" />
                <span>RECOMENDAÇÕES</span>
              </h3>
              <p className="text-white/60 text-[11.5px] sm:text-[12px] leading-snug ml-3">
                Obras clássicas recomendadas para você
              </p>
            </div>
          </div>

          <div
            ref={carouselScrollerRef}
            onScroll={handleCarouselScroll}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onTouchStart={pauseAutoplay}
            className="-mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 px-[calc(50vw-68px)] sm:px-[calc(50vw-76px)] flex gap-3.5 sm:gap-4 overflow-x-auto snap-x snap-mandatory pb-3 pt-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none touch-manipulation"
            style={{ visibility: isReady ? "visible" : "hidden" }}
          >
            {loopedItems.map((livro, idx) => {
              const isDisponivel = livro.status === "disponivel";
              const isFav = favIds.has(livro.id);
              const isActive = idx === activeCarouselIndex;

              return (
                <div
                  key={`rec-${livro.id}-${idx}`}
                  onClick={() => handleCarouselCardClick(livro, idx)}
                  className={`snap-center shrink-0 w-[136px] sm:w-[152px] flex flex-col text-left group cursor-pointer focus-visible:outline-none transition-all duration-300 ${
                    isActive
                      ? "opacity-100 z-10"
                      : "opacity-75 z-0 hover:opacity-90"
                  }`}
                >
                  <div
                    className={`relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-[#161618] transform-gpu transition-all duration-300 ${
                      isActive
                        ? "scale-100 border-2 border-[#A855F7]"
                        : "scale-[0.94] border border-white/10 group-hover:border-white/20"
                    }`}
                  >

                    <img
                      src={livro.capaUrl}
                      alt={livro.titulo}
                      loading={idx < 4 ? "eager" : "lazy"}
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none" />

                    {/* Tag Minimalista com Círculo e Check (substitui a tag grande de Finalizado) */}
                    <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                      {isDisponivel ? (
                        <div
                          title="Audiobook Completo"
                          className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-950/60 border border-emerald-300/40 backdrop-blur-sm"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.8]" />
                        </div>
                      ) : (
                        <div
                          title="Em Gravação"
                          className="w-6 h-6 rounded-full bg-black/80 text-amber-300 flex items-center justify-center shadow-md border border-amber-500/30 backdrop-blur-sm"
                        >
                          <Clock className="w-3.5 h-3.5 stroke-[2.2]" />
                        </div>
                      )}
                    </div>

                    {/* Botão de Favorito / Salvar no topo direito */}
                    <button
                      type="button"
                      onClick={(e) => toggleFavorito(livro, e)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white/70 hover:text-amber-400 hover:scale-110 active:scale-90 transition-all z-10 cursor-pointer"
                      aria-label={isFav ? "Remover dos favoritos" : "Salvar nos favoritos"}
                    >
                      <Bookmark
                        className={cn(
                          "w-3.5 h-3.5 transition-colors",
                          isFav
                            ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                            : "text-white/70"
                        )}
                        strokeWidth={2}
                      />
                    </button>
                  </div>

                  <p
                    className={`font-sans font-bold text-xs sm:text-[13px] mt-2 leading-snug transition-colors ${
                      isActive
                        ? "text-[#DDD6FE]"
                        : "text-white group-hover:text-[#C4B5FD]"
                    }`}
                  >
                    {livro.titulo}
                  </p>
                  <p className="text-[10.5px] text-white/50 truncate mt-0.5">
                    {livro.autor}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Indicador de Bolinhas Minimalista */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {livrosRecomendados.map((_, i) => {
              const N = livrosRecomendados.length;
              const currentNorm = ((activeCarouselIndex % N) + N) % N;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    pauseAutoplay();
                    const currentBlock = Math.floor(activeCarouselIndex / N);
                    const targetIdx = currentBlock * N + i;
                    scrollCarouselToIndex(targetIdx);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentNorm
                      ? "w-5 bg-[#7C3AED] shadow-sm shadow-[#7C3AED]/60"
                      : "w-1.5 bg-purple-500/30 hover:bg-purple-400/50"
                  }`}
                  aria-label={`Ver recomendação ${i + 1}`}
                />
              );
            })}
          </div>
        </section>

        {/* ======================================================== */}
        {/* SEÇÃO DO ACERVO NO FORMATO PADRÃO DA BIBLIOTECA         */}
        {/* ======================================================== */}
        <section className="pt-2">
          {/* Header da Seção com Identidade Visual Dinâmica da Categoria Selecionada */}
          <div className="mb-4">
            <p
              className="text-[10px] uppercase tracking-[0.22em] font-bold transition-colors duration-300"
              style={{ color: temaAtivo.corSecundaria }}
            >
              ACERVO DE AUDIOBOOKS • {temaAtivo.label.toUpperCase()}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="w-1 h-6 rounded-full transition-colors duration-300"
                style={{ backgroundColor: temaAtivo.corPrimaria }}
              />
              <h2 className="font-sans text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
                {temaAtivo.label}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-white/60 mt-1 ml-3">
              {temaAtivo.subtitulo}
            </p>
          </div>

          {/* Campo de Busca Rápida Idêntico à Biblioteca */}
          <div className="relative mb-4">
            <Search className="w-5 h-5 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              placeholder="Buscar livro, autor ou tema…"
              className="w-full pl-11 pr-10 h-14 text-sm sm:text-base rounded-2xl bg-[#141416]/95 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors shadow-lg shadow-black/40"
            />
            {termoBusca && (
              <button
                type="button"
                onClick={() => setTermoBusca("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Abas 3D Estilo Pasta (Sem margem na direita para efeito contínuo/infinito e cores dinâmicas por categoria) */}
          <div className="relative -mr-4 sm:-mr-6 overflow-x-auto no-scrollbar mb-5">
            <div className="flex w-max min-w-full items-end no-scrollbar h-11 sm:h-12 pt-1 pr-6 sm:pr-8">
              {CATEGORIAS_TABS.map((tab, index) => {
                const isActive = filtroCategoria === tab.id;
                const tabTema = CATEGORIAS_THEMES[tab.id];
                const zIndex = isActive ? 40 : 30 - Math.min(index, 20);

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      setFiltroCategoria(tab.id);
                    }}
                    className={cn(
                      "relative shrink-0 h-full flex items-center justify-center gap-1.5 px-4 sm:px-5 rounded-t-2xl border-x border-t text-[10.5px] sm:text-[11.5px] uppercase tracking-wider cursor-pointer select-none transition-colors duration-200",
                      isActive
                        ? "text-white font-bold border-transparent"
                        : "bg-[#141416] text-white/50 hover:bg-[#1A1A1E] shadow-[inset_0_-4px_10px_rgba(0,0,0,0.8)] hover:text-white border-white/10 opacity-80 font-medium"
                    )}
                    style={{
                      zIndex,
                      marginLeft: index > 0 ? "-10px" : "0",
                    }}
                  >
                    {/* Fundo Deslizante Ativo com Física de Mola Fluida (Spring Physics) */}
                    {isActive && (
                      <motion.div
                        layoutId="activeAudiobooksFolderTabPill"
                        className="absolute inset-0 rounded-t-2xl border-x border-t z-0 overflow-hidden"
                        style={{
                          backgroundColor: tabTema.corPrimaria,
                          borderColor: tabTema.corSecundaria,
                          boxShadow: `0 -6px 20px ${tabTema.corSombra}`,
                        }}
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 450,
                          damping: 35,
                          mass: 0.6,
                        }}
                      >
                        {/* Brilho Superior Suave */}
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/25 opacity-90 pointer-events-none" />
                        <div
                          className="absolute inset-0 rounded-t-2xl border-x border-t pointer-events-none shadow-[inset_0_2px_10px_rgba(255,255,255,0.35)]"
                          style={{ borderColor: tabTema.corBadgeNum }}
                        />
                      </motion.div>
                    )}

                    <span
                      className={cn(
                        "relative z-10 whitespace-nowrap transition-transform duration-200 font-bold",
                        isActive ? "scale-105 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" : "scale-100"
                      )}
                    >
                      {tab.label}
                    </span>

                    <span
                      className={cn(
                        "relative z-10 text-[9.5px] px-1.5 py-0.2 rounded-full font-mono font-bold tracking-tight transition-colors duration-200",
                        isActive
                          ? "bg-zinc-900/85 text-zinc-300 border border-zinc-700/60 shadow-inner"
                          : "bg-white/5 text-white/40"
                      )}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Linha de Base da Pasta Oficial com Transição Suave de Cor */}
            <motion.div
              className="min-w-full w-max h-0.5 relative z-20"
              animate={{
                backgroundColor: temaAtivo.corPrimaria,
                boxShadow: `0 0 14px ${temaAtivo.corSombra}`,
              }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            />
          </div>

          {/* Listagem de Livros — Somente Lista Vertical com Altura Padronizada e Títulos Finos */}
          <AnimatePresence mode="wait">
            {livrosFiltrados.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="py-16 text-center text-white/60 text-sm bg-purple-950/20 border border-purple-500/20 rounded-3xl px-4"
              >
                <p className="font-semibold text-white">Nenhum audiobook encontrado</p>
                <p className="text-xs text-white/50 max-w-sm mx-auto mt-1">
                  Tente buscar outro termo ou selecione outra categoria de áudio.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setTermoBusca("");
                    setFiltroCategoria("classicos");
                  }}
                  className="mt-3 px-4 py-1.5 rounded-full bg-[#7C3AED] text-white text-xs font-bold hover:bg-[#6D28D9] transition-colors"
                >
                  Ver Obras Clássicas
                </button>
              </motion.div>
            ) : (
              <motion.div
                key={filtroCategoria}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex flex-col gap-2.5"
              >
                {livrosFiltrados.map((livro, index) => {
                const isDisponivel = livro.status === "disponivel";
                const isNotificado = notificados[livro.id];
                const isFav = favIds.has(livro.id);

                return (
                  <motion.div
                    key={livro.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: Math.min(index * 0.03, 0.3),
                      type: "spring",
                      stiffness: 300,
                      damping: 24,
                    }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => handleCardClick(livro)}
                    aria-label={`Abrir audiobook ${livro.titulo}${livro.autor ? ` de ${livro.autor}` : ""}`}
                    className="group flex items-stretch gap-3.5 p-3 rounded-2xl bg-[#141416]/95 hover:bg-[#1C1C1E] border border-white/10 hover:border-[#7C3AED]/40 transition-all text-left w-full relative overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.6)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.8)] cursor-pointer select-none min-h-[116px] sm:min-h-[122px] h-auto"
                  >
                    {/* Capa Retangular à Esquerda */}
                    <div className="w-[72px] sm:w-[78px] min-h-[92px] sm:min-h-[98px] shrink-0 rounded-xl overflow-hidden bg-[#0A0518] border border-[#7C3AED]/25 shadow-md relative self-stretch">
                      <img
                        src={livro.capaUrl}
                        alt={`Capa do livro: ${livro.titulo}`}
                        loading={index < 6 ? "eager" : "lazy"}
                        decoding="async"
                        fetchPriority={index < 4 ? "high" : "auto"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Selo no topo da capinha: Círculo minimalista com Check */}
                      <div className="absolute top-1.5 left-1.5 z-10 pointer-events-none">
                        {isDisponivel ? (
                          <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md border border-emerald-300/40">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-black/80 border border-amber-500/40 text-amber-300 flex items-center justify-center shadow-md">
                            <Clock className="w-2.5 h-2.5 stroke-[2.2]" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Informações da Obra — Título e Autor com Espaço Amplo + Rodapé com Tempo, Salvar e Ouvir */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 gap-2">
                      <div>
                        {/* Título com espaço livre total, sem abreviações e traços finos */}
                        <p className="font-sans font-normal text-[14.5px] sm:text-[15.5px] text-white/95 leading-snug tracking-wide group-hover:text-[#D8B4FE] transition-colors">
                          {livro.titulo}
                        </p>

                        <p className="mt-0.5 text-[11px] sm:text-[11.5px] text-white/50 leading-snug">
                          {livro.autor} {livro.ano && `• ${livro.ano}`}
                        </p>
                      </div>

                      {/* Linha Inferior: Duração + Ícone de Salvar ao lado do tempo + Botão Ouvir à Direita com Cor do Tema */}
                      <div className="flex items-center justify-between gap-2 mt-auto pt-1 w-full">
                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                          {/* Duração com os NÚMEROS na cor dinâmica da categoria */}
                          <span
                            className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono px-2 py-0.5 rounded-md border shadow-sm shrink-0 transition-colors duration-300"
                            style={{
                              backgroundColor: `${temaAtivo.corPrimaria}1A`,
                              borderColor: `${temaAtivo.corPrimaria}45`,
                            }}
                          >
                            <Clock
                              className="w-3 h-3 stroke-[2.4]"
                              style={{ color: temaAtivo.corSecundaria }}
                            />
                            <span className="flex items-center gap-0.5">
                              {formatDuracaoComNumeros(getAudiobookDuracaoBadge(livro), temaAtivo.corBadgeNum)}
                            </span>
                          </span>

                          {/* Ícone de Salvar ao lado do tempo (libera espaço no topo para o título) */}
                          <button
                            type="button"
                            onClick={(e) => toggleFavorito(livro, e)}
                            className="p-1 rounded-md hover:bg-white/10 text-white/50 hover:text-amber-400 active:scale-90 transition-all cursor-pointer flex items-center justify-center shrink-0"
                            aria-label={isFav ? "Remover dos favoritos" : "Salvar nos favoritos"}
                          >
                            <Bookmark
                              className={cn(
                                "w-3.5 h-3.5 transition-colors",
                                isFav
                                  ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                                  : "text-zinc-500 hover:text-zinc-300"
                              )}
                              strokeWidth={2}
                            />
                          </button>

                          {isNotificado && !isDisponivel && (
                            <span
                              className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md border shrink-0 transition-colors duration-300"
                              style={{
                                backgroundColor: `${temaAtivo.corPrimaria}26`,
                                color: temaAtivo.corBadgeNum,
                                borderColor: `${temaAtivo.corPrimaria}4D`,
                              }}
                            >
                              <Bell className="w-2.5 h-2.5 fill-current" />
                              Aviso Ativo
                            </span>
                          )}
                        </div>

                        {/* Botão Ouvir / Painel posicionado embaixo à direita na cor do tema */}
                        <div className="shrink-0">
                          {isDisponivel ? (
                            <span
                              className="text-[11px] uppercase tracking-wide font-bold text-white px-3 py-1.5 rounded-full transition-all duration-200 shadow-md flex items-center gap-1 cursor-pointer hover:opacity-95 active:scale-95"
                              style={{
                                backgroundColor: temaAtivo.corFundoBotao,
                                boxShadow: `0 3px 12px ${temaAtivo.corSombra}`,
                              }}
                            >
                              <Play className="w-3 h-3 fill-white" />
                              Ouvir
                            </span>
                          ) : (
                            <span className="text-[11px] uppercase tracking-wide font-semibold text-white/70 px-2.5 py-1.5 rounded-full bg-white/5 border border-white/10 transition-colors flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-400" />
                              Painel
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* ======================================================== */}
      {/* SHEET DE AÇÕES RÁPIDAS (FAVORITOS, RECENTES, ESTATÍSTICAS, EM ALTA) */}
      {/* ======================================================== */}
      <AudiobooksQuickActionSheet
        activeSheet={activeQuickSheet}
        onClose={() => setActiveQuickSheet(null)}
        onSelectLivro={(livro) => {
          if (livro.status === 'disponivel' && (!livro.capitulos || livro.capitulos.length === 0)) {
            void hydrateAudiobook(livro);
          }
          setLivroModalidade(livro);
        }}
        onPlayLivro={(livro, idx) => {
          player.tocarLivro(livro, idx ?? 0);
        }}
        onPlayResumo={(livro, idx) => {
          abrirResumo(livro, idx ?? 0);
        }}
      />

      {/* ======================================================== */}
      {/* DIÁLOGO MINIMALISTA: ESCOLHA ENTRE AUDIOBOOK COMPLETO OU RESUMO ANALÍTICO */}
      {/* ======================================================== */}
      <AudiobookModalidadeDialog
        open={!!livroModalidade}
        livro={livroModalidade}
        onClose={() => setLivroModalidade(null)}
        onSelectCompleto={(livro) => {
          setLivroModalidade(null);
          setLivroSelecionado(livro);
          if (livro.status === 'disponivel' && (!livro.capitulos || livro.capitulos.length === 0)) {
            void hydrateAudiobook(livro).then((full) => {
              setLivroSelecionado((curr) => (curr && curr.id === full.id ? full : curr));
            });
          }
        }}
        onSelectResumo={(livro) => {
          setLivroModalidade(null);
          abrirResumo(livro);
        }}
      />

      {/* ======================================================== */}
      {/* PAINEL DE AJUSTE / DETALHES DO AUDIOBOOK (PADRÃO BIBLIOTECA) */}
      {/* ======================================================== */}
      <AudiobookDetailSheet
        open={!!livroSelecionado}
        livro={livroSelecionado}
        onClose={() => setLivroSelecionado(null)}
        onPlayCapitulo={(index, livroAlvo) => {
          abrirCapitulo(index, livroAlvo || livroSelecionado || undefined);
        }}
        onPlayResumo={abrirResumo}
        progressoSalvo={
          livroSelecionado
            ? (() => {
                try {
                  const raw = localStorage.getItem(`audiobook_prog_${livroSelecionado.id}`);
                  return raw ? JSON.parse(raw) : null;
                } catch {
                  return null;
                }
              })()
            : null
        }
        isNotificado={livroSelecionado ? !!notificados[livroSelecionado.id] : false}
        onToggleNotificacao={toggleNotificacao}
      />
    </div>
  );
}
