import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Headphones,
  Play,
  Clock,
  Search,
  Bell,
  ChevronRight,
  X,
  Heart,
  Check,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import ShapeGrid from "@/components/ui/ShapeGrid";
import { haptic } from "@/lib/nativeHaptics";
import {
  AUDIOBOOKS_CATALOGO,
  O_CASO_DOS_EXPLORADORES_DE_CAVERNAS,
  AudiobookLivro,
} from "@/data/audiobooksCatalogo";
import { criarLivroPlayerResumo, hasResumoDisponivel } from "@/data/audiobooksResumosMap";
import { AudiobookDetailSheet } from "@/components/audiobooks/AudiobookDetailSheet";
import { AudiobooksHeroPanel } from "@/components/audiobooks/AudiobooksHeroPanel";
import { AudiobooksContinuarOuvindoCard } from "@/components/audiobooks/AudiobooksContinuarOuvindoCard";
import {
  AudiobooksQuickActionSheet,
  AudiobookQuickActionType,
} from "@/components/audiobooks/AudiobooksQuickActionSheet";
import { audiobooksTracking, AudiobookRecenteItem } from "@/lib/audiobooksTracking";
import { useAudiobookPlayer } from "@/contexts/AudiobookPlayerContext";

export default function AudiobooksPage() {
  const navigate = useNavigate();
  const player = useAudiobookPlayer();

  // Livro aberto no Painel de Detalhes
  const [livroSelecionado, setLivroSelecionado] = useState<AudiobookLivro | null>(null);

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

  // Busca e Filtros: Ordem obrigatória: Todos, Terminando e Finalizados
  const [termoBusca, setTermoBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "terminando" | "finalizados">("todos");

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

  // Lista filtrada do catálogo completo
  const livrosFiltrados = useMemo(() => {
    return AUDIOBOOKS_CATALOGO.filter((livro) => {
      // Filtro de Status
      if (filtroStatus === "finalizados" && livro.status !== "disponivel") return false;
      if (filtroStatus === "terminando") {
        // "Terminando deve ser só os que ele já deu play"
        const jaDeuPlay = livrosIniciados.has(livro.id) || (player.livroAtual?.id === livro.id);
        if (!jaDeuPlay) return false;
      }

      // Filtro de Busca por Título ou Autor
      if (termoBusca.trim()) {
        const query = termoBusca.toLowerCase();
        const matchTitulo = livro.titulo.toLowerCase().includes(query);
        const matchAutor = livro.autor?.toLowerCase().includes(query);
        const matchTag = livro.tags?.some((t) => t.toLowerCase().includes(query));
        return matchTitulo || matchAutor || matchTag;
      }

      return true;
    });
  }, [termoBusca, filtroStatus, livrosIniciados, player.livroAtual]);

  // Livros recomendados para a seção de destaque
  const livrosRecomendados = useMemo(() => {
    const disponiveis = AUDIOBOOKS_CATALOGO.filter((l) => l.status === "disponivel");
    const emBreve = AUDIOBOOKS_CATALOGO.filter((l) => l.status !== "disponivel");
    return [...disponiveis, ...emBreve].slice(0, 12);
  }, []);

  // Contadores para as abas
  const totalCount = AUDIOBOOKS_CATALOGO.length;
  const terminandoCount = useMemo(() => {
    return AUDIOBOOKS_CATALOGO.filter(
      (l) => livrosIniciados.has(l.id) || (player.livroAtual?.id === l.id)
    ).length;
  }, [livrosIniciados, player.livroAtual]);
  const finalizadosCount = useMemo(
    () => AUDIOBOOKS_CATALOGO.filter((l) => l.status === "disponivel").length,
    [],
  );

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
    setLivroSelecionado(livro);
  };

  const handleCardClick = (livro: AudiobookLivro) => {
    haptic.selection();
    setLivroSelecionado(livro);
  };

  return (
    <div className="min-h-dvh bg-[#0D0D0D] text-white relative overflow-x-hidden pb-[calc(7rem+var(--sai-bottom,0px))]">
      {/* Fundo Padrão ShapeGrid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <ShapeGrid />
      </div>

      {/* Painel Hero Estilo Vade Mecum (Full-Bleed, sem margens laterais, botão de voltar embutido e 4 funções) */}
      <AudiobooksHeroPanel
        onBack={() => {
          haptic.selection();
          navigate(-1);
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
                    className={`relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-zinc-950 border transform-gpu transition-all duration-300 ${
                      isActive
                        ? "scale-100 border-[#8B5CF6]/80 shadow-2xl shadow-[#7C3AED]/30 ring-2 ring-[#7C3AED]/50"
                        : "scale-[0.94] border-white/10 shadow-md group-hover:border-[#7C3AED]/40"
                    }`}
                  >
                    {/* Efeito de Pulso Leve na capa centralizada ativa (padrão Layers/Leis em Alta) */}
                    {isActive && (
                      <>
                        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#7C3AED]/35 via-[#A855F7]/25 to-[#7C3AED]/35 blur-md pointer-events-none animate-pulse" />
                        <div className="absolute inset-0 rounded-2xl ring-2 ring-[#8B5CF6]/80 pointer-events-none animate-[pulse_2.5s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
                      </>
                    )}

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

                    {/* Botão de Favorito no topo direito */}
                    <button
                      type="button"
                      onClick={(e) => toggleFavorito(livro, e)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white/70 hover:text-rose-400 hover:scale-110 active:scale-90 transition-all z-10"
                      aria-label="Favoritar"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          isFav ? "fill-rose-500 text-rose-500" : ""
                        }`}
                      />
                    </button>
                  </div>

                  <p
                    className={`font-sans font-bold text-xs sm:text-[13px] line-clamp-2 mt-2 leading-snug transition-colors ${
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
                      : "w-1.5 bg-white/20 hover:bg-white/40"
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
          {/* Header da Seção Idêntico à Biblioteca — Apenas Lista */}
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#A78BFA] font-bold">
              ACERVO DE AUDIOBOOKS
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-1 h-6 rounded-full bg-[#7C3AED]" />
              <h2 className="font-sans text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
                Todos os Livros
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-white/60 mt-1 ml-3">
              Toque em qualquer obra para ouvir
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
              className="w-full pl-11 pr-10 h-14 text-sm sm:text-base rounded-2xl bg-[#141416] border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#7C3AED]/60 transition-colors shadow-sm"
            />
            {termoBusca && (
              <button
                type="button"
                onClick={() => setTermoBusca("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Abas de Filtro de Status na Ordem Solicitada: Todos, Terminando e Finalizados */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
            {/* 1. Todos */}
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setFiltroStatus("todos");
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                filtroStatus === "todos"
                  ? "bg-[#7C3AED] border-[#8B5CF6] text-white shadow-md shadow-[#7C3AED]/35"
                  : "bg-white/5 border-white/10 text-white/70 hover:text-white"
              }`}
            >
              Todos ({totalCount})
            </button>

            {/* 2. Terminando (Apenas os que o usuário já deu play) */}
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setFiltroStatus("terminando");
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                filtroStatus === "terminando"
                  ? "bg-[#7C3AED] border-[#8B5CF6] text-white shadow-md shadow-[#7C3AED]/35"
                  : "bg-white/5 border-white/10 text-white/70 hover:text-white"
              }`}
            >
              <Clock className={`w-3 h-3 ${filtroStatus === "terminando" ? "text-white" : "text-amber-300"}`} />
              Terminando ({terminandoCount})
            </button>

            {/* 3. Finalizados (Disponíveis completos no acervo) */}
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setFiltroStatus("finalizados");
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                filtroStatus === "finalizados"
                  ? "bg-[#7C3AED] border-[#8B5CF6] text-white shadow-md shadow-[#7C3AED]/35"
                  : "bg-white/5 border-white/10 text-white/70 hover:text-white"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${filtroStatus === "finalizados" ? "bg-white" : "bg-emerald-400"}`} />
              Finalizados ({finalizadosCount})
            </button>
          </div>

          {/* Listagem de Livros — Somente Lista Vertical */}
          {livrosFiltrados.length === 0 ? (
            <div className="py-16 text-center text-white/60 text-sm bg-white/[0.02] border border-white/5 rounded-3xl px-4">
              {filtroStatus === "terminando" ? (
                <div className="flex flex-col items-center justify-center space-y-2">
                  <Clock className="w-8 h-8 text-amber-400/60 mb-1" />
                  <p className="font-semibold text-white">Nenhum audiobook em andamento</p>
                  <p className="text-xs text-white/50 max-w-sm">
                    Dê o play em qualquer obra da coleção para que ela apareça aqui em &quot;Terminando&quot;.
                  </p>
                  <button
                    type="button"
                    onClick={() => setFiltroStatus("todos")}
                    className="mt-3 px-4 py-1.5 rounded-full bg-[#7C3AED] text-white text-xs font-bold hover:bg-[#7C3AED]"
                  >
                    Ver Todos os Livros
                  </button>
                </div>
              ) : (
                "Nenhum livro encontrado com o termo informado."
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
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
                    className="group flex items-stretch gap-3.5 p-3 rounded-2xl bg-[#141416] hover:bg-[#1A1A1E] border border-white/10 hover:border-[#7C3AED]/40 transition-colors text-left w-full relative overflow-hidden shadow-sm cursor-pointer select-none"
                  >
                    {/* Capa Retangular à Esquerda */}
                    <div className="w-[72px] sm:w-[80px] h-[100px] sm:h-[110px] shrink-0 rounded-xl overflow-hidden bg-zinc-950 border border-white/10 shadow-md relative">
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

                    {/* Informações Centrais da Obra — Título e Descrição de 1 Linha */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                      <p className="font-sans text-[14.5px] sm:text-[15.5px] font-bold text-white leading-snug group-hover:text-[#C4B5FD] transition-colors">
                        {livro.titulo}
                      </p>

                      <p className="mt-1 text-[11.5px] sm:text-[12px] text-white/50 line-clamp-1 truncate">
                        {livro.autor} {livro.ano && `• ${livro.ano}`}
                      </p>

                      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                        {hasResumoDisponivel(livro) && (
                          <span className="inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-amber-400/15 text-amber-300 border border-amber-400/30">
                            <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                            Resumo em Áudio
                          </span>
                        )}

                        {isNotificado && !isDisponivel && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-[#7C3AED]/15 text-[#C4B5FD] border border-[#7C3AED]/30">
                            <Bell className="w-2.5 h-2.5 fill-current" />
                            Aviso Ativo
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Botões de Ação à Direita: Favorito e Abrir */}
                    <div className="flex flex-col items-center justify-between py-1 pl-1 pr-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => toggleFavorito(livro, e)}
                        className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-rose-400 active:scale-90 transition-all"
                        aria-label="Favoritar"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            isFav ? "fill-rose-500 text-rose-500" : ""
                          }`}
                        />
                      </button>

                      {isDisponivel ? (
                        <span className="text-[11px] uppercase tracking-wide font-bold text-white px-3 py-1.5 rounded-full bg-[#7C3AED] hover:bg-[#7C3AED] transition-colors shadow-md shadow-purple-600/20 flex items-center gap-1">
                          <Play className="w-3 h-3 fill-white" />
                          Ouvir
                        </span>
                      ) : (
                        <span className="text-[11px] uppercase tracking-wide font-semibold text-white/70 px-2.5 py-1.5 rounded-full bg-white/5 group-hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          Painel
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* ======================================================== */}
      {/* SHEET DE AÇÕES RÁPIDAS (FAVORITOS, RECENTES, ESTATÍSTICAS, RESUMOS) */}
      {/* ======================================================== */}
      <AudiobooksQuickActionSheet
        activeSheet={activeQuickSheet}
        onClose={() => setActiveQuickSheet(null)}
        onSelectLivro={(livro) => {
          setLivroSelecionado(livro);
        }}
        onPlayLivro={(livro, idx) => {
          player.tocarLivro(livro, idx ?? 0);
        }}
        onPlayResumo={(livro, idx) => {
          abrirResumo(livro, idx ?? 0);
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
