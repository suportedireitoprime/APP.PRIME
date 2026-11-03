import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  LayoutList,
  LayoutGrid,
  Heart,
} from "lucide-react";
import { toast } from "sonner";
import ShapeGrid from "@/components/ui/ShapeGrid";
import { haptic } from "@/lib/nativeHaptics";
import {
  AUDIOBOOKS_CATALOGO,
  O_CASO_DOS_EXPLORADORES_DE_CAVERNAS,
  AudiobookLivro,
} from "@/data/audiobooksCatalogo";
import { AudiobookPlayerModal } from "@/components/audiobooks/AudiobookPlayerModal";
import { AudiobookDetailSheet } from "@/components/audiobooks/AudiobookDetailSheet";
import { AudiobooksHeroPanel } from "@/components/audiobooks/AudiobooksHeroPanel";
import { AudiobooksContinuarOuvindoCard } from "@/components/audiobooks/AudiobooksContinuarOuvindoCard";
import {
  AudiobooksQuickActionSheet,
  AudiobookQuickActionType,
} from "@/components/audiobooks/AudiobooksQuickActionSheet";
import { audiobooksTracking } from "@/lib/audiobooksTracking";

export default function AudiobooksPage() {
  const navigate = useNavigate();

  // Livro aberto no Painel de Detalhes (Padrão Biblioteca)
  const [livroSelecionado, setLivroSelecionado] = useState<AudiobookLivro | null>(null);

  // Livro ativo no Player em Tela Cheia
  const [livroPlayer, setLivroPlayer] = useState<AudiobookLivro>(
    O_CASO_DOS_EXPLORADORES_DE_CAVERNAS,
  );

  // Modal do Player
  const [playerOpen, setPlayerOpen] = useState(false);
  const [selectedCapituloIndex, setSelectedCapituloIndex] = useState(0);

  // Sheet de Ações Rápidas do Painel Hero (Favoritos | Recentes | Estatísticas | Outros)
  const [activeQuickSheet, setActiveQuickSheet] = useState<AudiobookQuickActionType | null>(null);

  // Modo de visualização do catálogo: Lista (Padrão Biblioteca) vs Grade (Capas)
  const [visualizacao, setVisualizacao] = useState<"lista" | "grade">("lista");

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

  // Busca e Filtros
  const [termoBusca, setTermoBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "disponivel" | "em_breve">("todos");

  // Recupera onde o usuário parou em O Caso dos Exploradores de Cavernas
  const storageKey = `audiobook_prog_${O_CASO_DOS_EXPLORADORES_DE_CAVERNAS.id}`;
  const [progressoSalvo, setProgressoSalvo] = useState<{
    capituloIndex: number;
    time: number;
  } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setProgressoSalvo(JSON.parse(raw));
      }
    } catch {}
  }, [storageKey, playerOpen]);

  const abrirCapitulo = useCallback((index: number, livroAlvo?: AudiobookLivro) => {
    haptic.selection();
    const targetLivro = livroAlvo || livroSelecionado || O_CASO_DOS_EXPLORADORES_DE_CAVERNAS;
    setLivroPlayer(targetLivro);
    setSelectedCapituloIndex(index);
    setLivroSelecionado(null);
    setActiveQuickSheet(null);
    setPlayerOpen(true);
  }, [livroSelecionado]);

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
      if (filtroStatus === "disponivel" && livro.status !== "disponivel") return false;
      if (filtroStatus === "em_breve" && livro.status !== "em_breve") return false;

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
  }, [termoBusca, filtroStatus]);

  // Livros recomendados para a seção de destaque
  const livrosRecomendados = useMemo(() => {
    return AUDIOBOOKS_CATALOGO.slice(0, 6);
  }, []);

  // Contadores para as abas
  const totalCount = AUDIOBOOKS_CATALOGO.length;
  const disponivelCount = useMemo(
    () => AUDIOBOOKS_CATALOGO.filter((l) => l.status === "disponivel").length,
    [],
  );
  const emBreveCount = totalCount - disponivelCount;

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
        {/* Banner Continuar Ouvindo / Leitura (Padrão Vade Mecum com Capa do Livro) */}
        <AudiobooksContinuarOuvindoCard
          livro={O_CASO_DOS_EXPLORADORES_DE_CAVERNAS}
          progressoSalvo={progressoSalvo}
          onPlay={(idx) => abrirCapitulo(idx)}
        />

        {/* ======================================================== */}
        {/* SEÇÃO RECOMENDAÇÕES (DESTAQUES DA COLEÇÃO)               */}
        {/* ======================================================== */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-white text-[16px] sm:text-[17px] font-bold flex items-center gap-2 uppercase tracking-widest">
                <span className="w-1 h-5 rounded-full bg-purple-500 shrink-0" />
                <span className="truncate">RECOMENDAÇÕES</span>
              </h3>
              <p className="font-body text-white/60 text-[11.5px] sm:text-[12px] leading-snug ml-3 truncate">
                Obras fundamentais e mais recomendadas para a sua formação
              </p>
            </div>
          </div>

          <div className="-mx-4 sm:-mx-6 px-4 sm:px-6 flex gap-3 overflow-x-auto pb-2 pt-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none">
            {livrosRecomendados.map((livro) => {
              const isDisponivel = livro.status === "disponivel";
              const isFav = favIds.has(livro.id);

              return (
                <div
                  key={`rec-${livro.id}`}
                  onClick={() => handleCardClick(livro)}
                  className="snap-start shrink-0 w-[122px] sm:w-[136px] flex flex-col text-left group cursor-pointer focus-visible:outline-none"
                >
                  <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-zinc-950 border border-white/10 group-hover:border-purple-500/50 transition-all shadow-md group-hover:shadow-purple-950/40">
                    <img
                      src={livro.capaUrl}
                      alt={livro.titulo}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                    
                    {/* Badge de Status no topo esquerdo */}
                    <div className="absolute top-2 left-2">
                      {isDisponivel ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md">
                          <Play className="w-2 h-2 fill-white" />
                          Áudio HD
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-black/80 border border-amber-500/30 text-amber-300 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md backdrop-blur-md">
                          <Clock className="w-2 h-2" />
                          Em Breve
                        </span>
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
                  <p className="font-serif italic font-semibold text-xs sm:text-[13px] text-white group-hover:text-purple-300 transition-colors line-clamp-2 mt-2 leading-tight">
                    {livro.titulo}
                  </p>
                  <p className="text-[10.5px] text-white/50 truncate mt-0.5">
                    {livro.autor}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ======================================================== */}
        {/* SEÇÃO DO ACERVO NO FORMATO PADRÃO DA BIBLIOTECA         */}
        {/* ======================================================== */}
        <section className="pt-2">
          {/* Header da Seção Idêntico à Biblioteca */}
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-purple-400 font-bold">
              ACERVO DE AUDIOBOOKS
            </p>
            <div className="flex items-center justify-between gap-3 mt-1">
              <div className="flex items-center gap-2">
                <span className="w-1 h-6 rounded-full bg-purple-500" />
                <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                  Todos os livros
                </h2>
              </div>

              {/* Botões de Alternância: Lista (Biblioteca) vs Grade */}
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    setVisualizacao("lista");
                  }}
                  className={`p-1.5 rounded-lg transition-all ${
                    visualizacao === "lista"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-white/60 hover:text-white"
                  }`}
                  aria-label="Visualização em Lista"
                  title="Modo Lista (Padrão Biblioteca)"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    setVisualizacao("grade");
                  }}
                  className={`p-1.5 rounded-lg transition-all ${
                    visualizacao === "grade"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-white/60 hover:text-white"
                  }`}
                  aria-label="Visualização em Grade"
                  title="Modo Grade"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-white/60 mt-1 ml-3">
              Toque em qualquer livro para abrir o painel de detalhes, sinopse e capítulos.
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
              className="w-full pl-11 pr-10 h-14 text-sm sm:text-base rounded-2xl bg-[#141416] border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-purple-500/60 transition-colors shadow-sm"
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

          {/* Abas de Filtro de Status */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setFiltroStatus("todos");
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                filtroStatus === "todos"
                  ? "bg-purple-600 border-purple-500 text-white shadow-md"
                  : "bg-white/5 border-white/10 text-white/70 hover:text-white"
              }`}
            >
              Todos ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setFiltroStatus("disponivel");
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                filtroStatus === "disponivel"
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-md"
                  : "bg-white/5 border-white/10 text-white/70 hover:text-white"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Disponível ({disponivelCount})
            </button>
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setFiltroStatus("em_breve");
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                filtroStatus === "em_breve"
                  ? "bg-amber-600 border-amber-600 text-white shadow-md"
                  : "bg-white/5 border-white/10 text-white/70 hover:text-white"
              }`}
            >
              <Clock className="w-3 h-3 text-amber-300" />
              Em Breve ({emBreveCount})
            </button>
          </div>

          {/* Listagem de Livros */}
          {livrosFiltrados.length === 0 ? (
            <div className="py-16 text-center text-white/50 text-sm bg-white/[0.02] border border-white/5 rounded-3xl">
              Nenhum livro encontrado com o termo informado.
            </div>
          ) : visualizacao === "lista" ? (
            /* ======================================================== */
            /* MODO LISTA: DESIGN IDÊNTICO AO DA BIBLIOTECA DO APP     */
            /* ======================================================== */
            <div className="flex flex-col gap-2.5">
              {livrosFiltrados.map((livro, index) => {
                const isDisponivel = livro.status === "disponivel";
                const isNotificado = notificados[livro.id];
                const isFav = favIds.has(livro.id);
                const pct =
                  isDisponivel && progressoSalvo
                    ? Math.round(((progressoSalvo.capituloIndex + 1) / 8) * 100)
                    : 0;

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
                    className="group flex items-stretch gap-3.5 p-3 rounded-2xl bg-[#141416] hover:bg-[#1A1A1E] border border-white/10 hover:border-purple-500/40 transition-colors text-left w-full relative overflow-hidden shadow-sm cursor-pointer select-none"
                  >
                    {/* Capa Retangular à Esquerda (Padrão 72px x 100px) */}
                    <div className="w-[72px] sm:w-[80px] h-[100px] sm:h-[110px] shrink-0 rounded-xl overflow-hidden bg-zinc-950 border border-white/10 shadow-md relative">
                      <img
                        src={livro.capaUrl}
                        alt={`Capa do livro: ${livro.titulo}`}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Selo no topo da capinha */}
                      <div className="absolute top-1 left-1">
                        {isDisponivel ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 block shadow-md animate-pulse" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-amber-400/80 block shadow-md" />
                        )}
                      </div>
                    </div>

                    {/* Informações Centrais da Obra */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                      <p className="text-[14px] sm:text-[15.5px] font-bold text-white line-clamp-2 leading-snug group-hover:text-purple-300 transition-colors break-words">
                        {livro.titulo}
                      </p>

                      <p className="mt-1 text-[11px] sm:text-[12px] text-white/50 line-clamp-1">
                        {livro.autor} {livro.ano && `• ${livro.ano}`}
                      </p>

                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        {/* Tag de Coleção */}
                        <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 text-white/70 font-bold border border-white/10">
                          {livro.tags?.[0] || "CLÁSSICO"}
                        </span>

                        {/* Status: Disponível vs Em Breve */}
                        {isDisponivel ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <Headphones className="w-2.5 h-2.5" />
                            8 Capítulos Gravados
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <Clock className="w-2.5 h-2.5 text-amber-300" />
                            Em Breve
                          </span>
                        )}

                        {isNotificado && !isDisponivel && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30">
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
                        <span className="text-[11px] uppercase tracking-wide font-bold text-white px-3 py-1.5 rounded-full bg-purple-600 hover:bg-purple-500 transition-colors shadow-md shadow-purple-600/20 flex items-center gap-1">
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

                    {/* Barra de progresso na base se houver */}
                    {pct > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10">
                        <div
                          className="h-full bg-purple-500 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* ======================================================== */
            /* MODO GRADE: VISUALIZAÇÃO POR CAPAS                      */
            /* ======================================================== */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5">
              {livrosFiltrados.map((livro) => {
                const isDisponivel = livro.status === "disponivel";
                const isFav = favIds.has(livro.id);

                return (
                  <motion.div
                    key={livro.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCardClick(livro)}
                    className="group relative flex flex-col bg-[#141416] hover:bg-[#1C1C20] border border-white/10 hover:border-purple-500/40 rounded-2xl overflow-hidden shadow-lg transition-all cursor-pointer select-none"
                  >
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-950">
                      <img
                        src={livro.capaUrl}
                        alt={livro.titulo}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#141416] via-transparent to-transparent opacity-80" />

                      <div className="absolute top-2 left-2 z-10">
                        {isDisponivel ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9.5px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md">
                            <Play className="w-2.5 h-2.5 fill-white" />
                            Disponível
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-black/80 border border-amber-500/30 text-amber-300 text-[9.5px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md backdrop-blur-md">
                            <Clock className="w-2.5 h-2.5" />
                            Em Breve
                          </span>
                        )}
                      </div>

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

                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-display font-bold text-xs sm:text-sm text-white group-hover:text-purple-300 transition-colors line-clamp-2 leading-snug">
                          {livro.titulo}
                        </h4>
                        <p className="text-[11px] text-white/50 truncate mt-1">
                          {livro.autor} {livro.ano && `• ${livro.ano}`}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                        {isDisponivel ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <Headphones className="w-3 h-3" />
                            {livro.totalCapitulos} Capítulos
                          </span>
                        ) : (
                          <span className="text-white/40 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400/80" />
                            Em Produção
                          </span>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* ======================================================== */}
      {/* SHEET DE AÇÕES RÁPIDAS (FAVORITOS, RECENTES, ESTATÍSTICAS, OUTROS) */}
      {/* ======================================================== */}
      <AudiobooksQuickActionSheet
        activeSheet={activeQuickSheet}
        onClose={() => setActiveQuickSheet(null)}
        onSelectLivro={(livro) => {
          setLivroSelecionado(livro);
        }}
        onPlayLivro={(livro, idx) => {
          setLivroPlayer(livro);
          setSelectedCapituloIndex(idx ?? 0);
          setPlayerOpen(true);
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

      {/* Modal Player em Tela Cheia com Narração e Legendas */}
      <AudiobookPlayerModal
        livro={livroPlayer}
        capituloInicialIndex={selectedCapituloIndex}
        isOpen={playerOpen}
        onClose={() => setPlayerOpen(false)}
      />
    </div>
  );
}
