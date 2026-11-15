import React, { useState, useEffect, useMemo, useRef } from "react";
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

interface SearchResultItem {
  id: string;
  type: ResultType;
  title: string;
  area: string;
  tema?: string;
  subtema?: string;
  caminho: string[];
  previa?: string;
  total?: number;
  coverUrl?: string;
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
  const [catalog, setCatalog] = useState<AreaItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"todos" | "area" | "tema" | "topico">("todos");

  // Carrega o catálogo completo de resumos uma vez
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

  // Foco automático ao abrir e trava de scroll no fundo
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
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

  // Indexação e busca dinâmica e imediata
  const allResults = useMemo(() => {
    const query = cleanResumoString(q);
    if (!query || query.length < 2) return [];

    const results: SearchResultItem[] = [];

    for (const a of catalog) {
      const areaNorm = cleanResumoString(a.area);
      const isAreaMatch = areaNorm.includes(query);
      const areaCover =
        getDisciplinaVisualTheme(a.area)?.fundoAssetUrl ||
        getAreaCover(a.area)?.cover ||
        a.coverUrl ||
        constCover;

      // 1. Match em Matéria (Área)
      if (isAreaMatch) {
        results.push({
          id: `area-${a.area}`,
          type: "area",
          title: a.area,
          area: a.area,
          caminho: ["Resumos Jurídicos", a.area],
          previa: `${a.total || 0} tópicos disponíveis · ${a.temas?.length || 0} módulos organizados`,
          total: a.total,
          coverUrl: areaCover,
        });
      }

      // 2. Match em Temas (Módulos)
      for (const t of a.temas || []) {
        const temaNorm = cleanResumoString(t.tema);
        const isTemaMatch = temaNorm.includes(query);

        if (isTemaMatch) {
          results.push({
            id: `tema-${a.area}-${t.tema}`,
            type: "tema",
            title: t.tema,
            area: a.area,
            tema: t.tema,
            caminho: [a.area, t.tema],
            previa: `${t.total || t.subtemas?.length || 0} tópicos neste tema`,
            total: t.total,
            coverUrl: areaCover,
          });
        }

        // 3. Match em Tópicos / Capítulos (Subtemas)
        for (const s of t.subtemas || []) {
          const subtemaNorm = cleanResumoString(s.subtema);
          const isSubMatch = subtemaNorm.includes(query);
          const rawMd = stripMarkdown(s.markdown);
          const mdNorm = cleanResumoString(rawMd);
          const isMdMatch = !isSubMatch && mdNorm.includes(query);

          if (isSubMatch || isMdMatch) {
            let previaText = "";
            if (rawMd) {
              if (isMdMatch) {
                // Destaca o trecho do conteúdo onde o termo apareceu
                const idx = rawMd.toLowerCase().indexOf(q.trim().toLowerCase());
                if (idx !== -1) {
                  const start = Math.max(0, idx - 35);
                  const end = Math.min(rawMd.length, idx + 110);
                  previaText = (start > 0 ? "…" : "") + rawMd.slice(start, end) + (end < rawMd.length ? "…" : "");
                } else {
                  previaText = rawMd.slice(0, 110) + (rawMd.length > 110 ? "…" : "");
                }
              } else {
                previaText = rawMd.slice(0, 110) + (rawMd.length > 110 ? "…" : "");
              }
            } else if (s.exemplos) {
              previaText = stripMarkdown(s.exemplos).slice(0, 110) + "…";
            }

            results.push({
              id: `topico-${s.id || s.subtema}`,
              type: "topico",
              title: s.subtema,
              area: a.area,
              tema: t.tema,
              subtema: s.subtema,
              caminho: [a.area, t.tema, s.subtema],
              previa: previaText || "Conteúdo completo deste tópico.",
              coverUrl: areaCover,
            });
          }
        }
      }
    }

    return results;
  }, [q, catalog]);

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

  // Ação ao clicar em um resultado
  const handleSelectResult = (item: SearchResultItem) => {
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

  // Sugestões rápidas quando o campo está vazio
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
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
          />

          {/* Bottom Sheet ocupando 90% da tela */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed inset-x-0 bottom-0 z-50 h-[90vh] max-h-[90dvh] flex flex-col bg-[#121215] border-t border-white/10 rounded-t-3xl shadow-2xl overflow-hidden"
          >
            {/* Grab Handle discreto */}
            <div className="pt-2.5 pb-1 flex justify-center shrink-0">
              <div className="w-12 h-1.5 rounded-full bg-white/20" />
            </div>

            {/* Cabeçalho de Busca com Input Dedicado e Botão Fechar */}
            <div className="px-4 sm:px-6 pt-2 pb-3 shrink-0 border-b border-white/10 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Digite uma matéria, tema ou tópico…"
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
                  className="h-12 px-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-semibold flex items-center justify-center transition-colors shrink-0"
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

            {/* Conteúdo Dinâmico com Scroll */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3 pb-[calc(2.5rem+var(--sai-bottom,0px))]">
              {/* ESTADO 1: Campo vazio — Exibe sugestões */}
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
                      💡 <strong className="text-white">Busca Organizada:</strong> Digite o nome de
                      uma matéria, tema ou conteúdo específico. Os tópicos exibirão sua respectiva
                      capa, a trilha completa e as cores exclusivas de cada disciplina.
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

              {/* ESTADO 3: Resultados Encontrados */}
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
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => handleSelectResult(item)}
                        style={{
                          borderColor: "rgba(255, 255, 255, 0.08)",
                        }}
                        className="group cursor-pointer rounded-2xl bg-[#16161a] hover:bg-[#1a1a20] border p-2.5 sm:p-3 transition-all relative overflow-hidden text-left flex items-center gap-3 sm:gap-3.5"
                      >
                        {/* Indicador de cor do tema na borda esquerda */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                          style={{ backgroundColor: theme.primary }}
                        />

                        {/* Capa à esquerda */}
                        <div className="w-[52px] h-[68px] sm:w-[60px] sm:h-[78px] rounded-xl overflow-hidden shrink-0 border border-white/10 relative bg-black shadow-md ml-1">
                          <img
                            src={item.coverUrl || constCover}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />
                        </div>

                        {/* Informações centrais */}
                        <div className="flex-1 min-w-0 py-0.5">
                          {/* Trilha do Caminho (SEM ÍCONES, com a cor da disciplina) */}
                          <div
                            className="flex items-center gap-1 text-[11px] font-medium mb-1 overflow-hidden truncate"
                            style={{ color: theme.accent }}
                          >
                            {item.caminho.map((step, idx) => (
                              <React.Fragment key={idx}>
                                <span className="truncate">{step}</span>
                                {idx < item.caminho.length - 1 && (
                                  <span className="text-white/30 shrink-0 mx-0.5">&gt;</span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>

                          {/* Título e Badge */}
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-sans font-semibold text-[14px] sm:text-[15px] text-white group-hover:text-white transition-colors leading-snug line-clamp-1 flex-1">
                              {item.title}
                            </h4>

                            <span
                              style={{
                                borderColor: theme.border,
                                color: theme.accent,
                                backgroundColor: theme.glowSoft,
                              }}
                              className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
                            >
                              {item.type === "area"
                                ? "Matéria"
                                : item.type === "tema"
                                ? "Tema"
                                : "Tópico"}
                            </span>
                          </div>

                          {/* Prévia textual limpa */}
                          {item.previa && (
                            <p className="font-sans text-[11.5px] sm:text-[12px] text-white/55 line-clamp-1 mt-1 leading-normal">
                              {item.previa}
                            </p>
                          )}
                        </div>

                        {/* Ícone de seta discreto na cor da matéria */}
                        <div className="shrink-0 pr-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
