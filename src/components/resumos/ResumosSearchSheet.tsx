import React, { useState, useEffect, useMemo, useRef, useDeferredValue } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getResumosCatalog,
  cleanResumoString,
  type AreaItem,
  type TemaItem,
  type SubtemaItem,
} from "@/services/resumosCatalog";
import { getDisciplinaVisualTheme } from "@/lib/disciplinasTheme";
import { getAreaCover } from "@/lib/areasDireitoCovers";
import { haptic } from "@/lib/nativeHaptics";
import constCover from "@/assets/biblioteca/areas/direito-constitucional.webp";

interface ResumosSearchSheetProps {
  open: boolean;
  onClose: () => void;
  onSelectAreaTab?: (area: string) => void;
}

type ResultType = "area" | "tema" | "topico";

interface IndexedItem {
  id: string;
  type: ResultType;
  title: string;
  area: string;
  tema?: string;
  subtema?: string;
  caminho: string[];
  previa: string;
  total?: number;
  coverUrl: string;
  searchKey: string;
}

function stripMarkdown(md?: string): string {
  if (!md) return "";
  return md
    .replace(/^#+\s+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/\n+/g, " ")
    .trim();
}

export const ResumosSearchSheet: React.FC<ResumosSearchSheetProps> = ({
  open,
  onClose,
  onSelectAreaTab,
}) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const deferredQ = useDeferredValue(q);
  const [catalog, setCatalog] = useState<AreaItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"todos" | "area" | "tema" | "topico">("todos");

  // Carrega o catálogo de resumos apenas uma vez
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingCatalog(true);
      try {
        const data = await getResumosCatalog();
        if (mounted && Array.isArray(data)) {
          setCatalog(data);
        }
      } catch (err) {
        console.error("Erro ao carregar catálogo para busca:", err);
      } finally {
        if (mounted) setLoadingCatalog(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Foco automático e bloqueio de scroll de fundo
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = "";
      };
    } else {
      document.body.style.overflow = "";
      setQ("");
      setActiveFilter("todos");
    }
  }, [open]);

  // Tecla Esc fecha o modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // 1. PRÉ-INDEXAÇÃO EM MEMÓRIA (Executada UMA ÚNICA VEZ ao carregar o catálogo)
  // Elimina processamento pesado de regex/markdown durante a digitação, garantindo fluidez a 120fps
  const searchIndex = useMemo<IndexedItem[]>(() => {
    if (!catalog || catalog.length === 0) return [];
    const items: IndexedItem[] = [];

    for (const a of catalog) {
      const areaCover =
        getDisciplinaVisualTheme(a.area)?.fundoAssetUrl ||
        getAreaCover(a.area)?.cover ||
        a.coverUrl ||
        constCover;
      const cleanArea = cleanResumoString(a.area);

      // Matéria
      items.push({
        id: `area-${a.area}`,
        type: "area",
        title: a.area,
        area: a.area,
        caminho: [a.area],
        previa: `${a.total || 0} tópicos disponíveis organizados em ${a.temas?.length || 0} temas`,
        total: a.total,
        coverUrl: areaCover,
        searchKey: cleanArea,
      });

      for (const t of a.temas || []) {
        const cleanTema = cleanResumoString(t.tema);

        // Tema
        items.push({
          id: `tema-${a.area}-${t.tema}`,
          type: "tema",
          title: t.tema,
          area: a.area,
          tema: t.tema,
          caminho: [a.area, t.tema],
          previa: `${t.total || t.subtemas?.length || 0} tópicos neste tema`,
          total: t.total,
          coverUrl: areaCover,
          searchKey: `${cleanArea} ${cleanTema}`,
        });

        // Tópicos
        for (const s of t.subtemas || []) {
          const cleanSubtema = cleanResumoString(s.subtema);
          const rawMd = stripMarkdown(s.markdown);
          const cleanMd = rawMd ? cleanResumoString(rawMd.slice(0, 300)) : "";
          const previewText = rawMd
            ? rawMd.slice(0, 130) + (rawMd.length > 130 ? "…" : "")
            : "Conteúdo completo deste tópico disponível para leitura.";

          items.push({
            id: `topico-${s.id || s.subtema}`,
            type: "topico",
            title: s.subtema,
            area: a.area,
            tema: t.tema,
            subtema: s.subtema,
            caminho: [a.area, t.tema],
            previa: previewText,
            coverUrl: areaCover,
            searchKey: `${cleanArea} ${cleanTema} ${cleanSubtema} ${cleanMd}`,
          });
        }
      }
    }

    return items;
  }, [catalog]);

  // 2. BUSCA INSTANTÂNEA (< 1ms por keystroke sobre o índice pré-calculado)
  const allResults = useMemo(() => {
    const query = cleanResumoString(deferredQ);
    if (!query || query.length < 2) return [];

    return searchIndex.filter((item) => item.searchKey.includes(query));
  }, [deferredQ, searchIndex]);

  // Filtra por tipo selecionado
  const filteredResults = useMemo(() => {
    if (activeFilter === "todos") return allResults;
    return allResults.filter((r) => r.type === activeFilter);
  }, [allResults, activeFilter]);

  const counts = useMemo(() => {
    let areasCount = 0;
    let temasCount = 0;
    let topicosCount = 0;
    for (const r of allResults) {
      if (r.type === "area") areasCount++;
      else if (r.type === "tema") temasCount++;
      else if (r.type === "topico") topicosCount++;
    }
    return {
      todos: allResults.length,
      area: areasCount,
      tema: temasCount,
      topico: topicosCount,
    };
  }, [allResults]);

  // Ação ao selecionar um resultado
  const handleSelectResult = (item: IndexedItem) => {
    haptic.selection();
    onClose();

    if (item.type === "area") {
      if (onSelectAreaTab) {
        onSelectAreaTab(item.area);
      } else {
        navigate(`/resumos-juridicos/${encodeURIComponent(item.area)}`);
      }
    } else if (item.type === "tema") {
      navigate(
        `/resumos-juridicos/${encodeURIComponent(item.area)}/${encodeURIComponent(item.tema!)}`
      );
    } else if (item.type === "topico") {
      navigate(
        `/resumos-juridicos/${encodeURIComponent(item.area)}/${encodeURIComponent(item.tema!)}?subtema=${encodeURIComponent(item.subtema!)}`
      );
    }
  };

  // Sugestões populares
  const sugestoesRapidas = [
    "Direito Penal",
    "Direito Constitucional",
    "Direito Administrativo",
    "Direito Civil",
    "Direito Tributário",
    "Teoria Geral do Delito",
    "Atos Administrativos",
    "Contratos",
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop escurecido */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
          />

          {/* Bottom Sheet ocupando 90% da tela */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-50 h-[90vh] max-h-[90dvh] flex flex-col bg-[#121215] border-t border-white/10 rounded-t-3xl shadow-2xl overflow-hidden"
          >
            {/* Grab Handle discreto */}
            <div className="pt-2.5 pb-1 flex justify-center shrink-0">
              <div className="w-12 h-1.5 rounded-full bg-white/20" />
            </div>

            {/* Cabeçalho de Busca com Input Dedicado */}
            <div className="px-4 sm:px-6 pt-2 pb-3 shrink-0 border-b border-white/10 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar matéria, tema ou tópico"
                    className="w-full pl-11 pr-10 h-12 text-[14.5px] sm:text-[15.5px] rounded-2xl bg-[#18181c] border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/70 transition-colors shadow-inner"
                  />
                  {q && (
                    <button
                      type="button"
                      onClick={() => {
                        setQ("");
                        inputRef.current?.focus();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors"
                      title="Limpar busca"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="h-12 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-semibold flex items-center justify-center transition-colors shrink-0"
                >
                  Fechar
                </button>
              </div>

              {/* Filtros de Categoria (Todos, Matérias, Temas, Tópicos) */}
              {allResults.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                  <button
                    type="button"
                    onClick={() => setActiveFilter("todos")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      activeFilter === "todos"
                        ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20 font-bold"
                        : "bg-white/5 text-white/60 hover:text-white border border-white/5"
                    }`}
                  >
                    Todos ({counts.todos})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter("area")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      activeFilter === "area"
                        ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20 font-bold"
                        : "bg-white/5 text-white/60 hover:text-white border border-white/5"
                    }`}
                  >
                    Matérias ({counts.area})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter("tema")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      activeFilter === "tema"
                        ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20 font-bold"
                        : "bg-white/5 text-white/60 hover:text-white border border-white/5"
                    }`}
                  >
                    Temas ({counts.tema})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter("topico")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      activeFilter === "topico"
                        ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20 font-bold"
                        : "bg-white/5 text-white/60 hover:text-white border border-white/5"
                    }`}
                  >
                    Tópicos ({counts.topico})
                  </button>
                </div>
              )}
            </div>

            {/* Conteúdo com Scroll */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3 pb-[calc(2.5rem+var(--sai-bottom,0px))]">
              {/* ESTADO 1: Campo vazio — Sugestões */}
              {!q.trim() && (
                <div className="space-y-6 pt-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-white/50 uppercase tracking-widest mb-3">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Sugestões Populares</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sugestoesRapidas.map((sugestao) => (
                        <button
                          key={sugestao}
                          type="button"
                          onClick={() => {
                            setQ(sugestao);
                            inputRef.current?.focus();
                          }}
                          className="px-3.5 py-2 rounded-xl bg-[#18181c] hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/40 text-xs font-medium text-white/80 hover:text-emerald-300 transition-colors flex items-center gap-1.5"
                        >
                          <Search className="w-3 h-3 text-white/40" />
                          <span>{sugestao}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#16161a] p-4 text-left">
                    <p className="text-xs text-white/70 leading-relaxed font-sans">
                      💡 <strong className="text-white">Busca Ultra Rápida:</strong> Pesquise por
                      matérias, temas ou tópicos. Os resultados exibem capas exclusivas, caminhos
                      completos sem abreviações e a paleta de cores oficial de cada disciplina.
                    </p>
                  </div>
                </div>
              )}

              {/* ESTADO 2: Caractere insuficiente */}
              {q.trim().length === 1 && (
                <div className="text-center py-12 text-white/40 text-xs">
                  Digite ao menos 2 caracteres para pesquisar...
                </div>
              )}

              {/* ESTADO 3: Resultados Encontrados (Sem Abreviações e com Cores do Tema) */}
              {q.trim().length >= 2 && filteredResults.length > 0 && (
                <div className="space-y-2.5">
                  <p className="text-[11.5px] font-semibold text-white/50 uppercase tracking-wider px-1">
                    {filteredResults.length}{" "}
                    {filteredResults.length === 1 ? "resultado encontrado" : "resultados encontrados"}
                  </p>

                  {filteredResults.map((item) => {
                    const theme = getDisciplinaVisualTheme(item.area);

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => handleSelectResult(item)}
                        style={{
                          borderColor: "rgba(255, 255, 255, 0.08)",
                        }}
                        className="group cursor-pointer rounded-2xl bg-[#16161a] hover:bg-[#1a1a20] border p-2.5 sm:p-3 transition-all relative overflow-hidden text-left flex items-start gap-3 sm:gap-3.5"
                      >
                        {/* Linha vertical de destaque na cor da matéria */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                          style={{ backgroundColor: theme.primary }}
                        />

                        {/* Capa à esquerda */}
                        <div className="w-[52px] h-[70px] sm:w-[60px] sm:h-[80px] rounded-xl overflow-hidden shrink-0 border border-white/10 relative bg-black shadow-md ml-1 mt-0.5">
                          <img
                            src={item.coverUrl || constCover}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />
                        </div>

                        {/* Informações detalhadas sem abreviação */}
                        <div className="flex-1 min-w-0">
                          {/* Trilha do Caminho Completa (Sem ícones e sem cortar palavras) */}
                          <div
                            className="flex flex-wrap items-center gap-1 text-[11px] sm:text-[11.5px] font-medium mb-1 leading-snug"
                            style={{ color: theme.accent }}
                          >
                            {item.caminho.map((step, idx) => (
                              <React.Fragment key={idx}>
                                <span className="break-words">{step}</span>
                                {idx < item.caminho.length - 1 && (
                                  <span className="text-white/30 shrink-0 mx-1">&gt;</span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>

                          {/* Título e Badge */}
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-sans font-semibold text-[14px] sm:text-[15px] text-white leading-snug break-words flex-1">
                              {item.title}
                            </h4>

                            <span
                              style={{
                                borderColor: theme.border,
                                color: theme.accent,
                                backgroundColor: theme.glowSoft,
                              }}
                              className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border mt-0.5"
                            >
                              {item.type === "area"
                                ? "Matéria"
                                : item.type === "tema"
                                ? "Tema"
                                : "Tópico"}
                            </span>
                          </div>

                          {/* Prévia Completa sem truncamentos desnecessários */}
                          {item.previa && (
                            <p className="font-sans text-[11.5px] sm:text-[12px] text-white/60 mt-1 leading-relaxed break-words">
                              {item.previa}
                            </p>
                          )}
                        </div>

                        {/* Seta à direita na cor do tema */}
                        <div className="shrink-0 self-center pr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowRight className="w-4 h-4" style={{ color: theme.accent }} />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* ESTADO 4: Nenhum Resultado Encontrado */}
              {q.trim().length >= 2 && filteredResults.length === 0 && (
                <div className="text-center py-16 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/40">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="font-sans text-[15px] font-semibold text-white">
                    Nenhum resultado encontrado
                  </h3>
                  <p className="font-sans text-xs text-white/50 max-w-xs mx-auto">
                    Não encontramos matérias, temas ou tópicos para "<strong>{q}</strong>". Tente
                    buscar com outros termos ou selecione uma matéria sugerida.
                  </p>
                  <button
                    type="button"
                    onClick={() => setQ("")}
                    className="mt-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition"
                  >
                    Limpar pesquisa
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
