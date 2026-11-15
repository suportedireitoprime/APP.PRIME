import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  ChevronRight,
  BookOpen,
  Folder,
  FileText,
  Sparkles,
  ArrowRight,
  Layers,
} from "lucide-react";
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

type ResultType = "area" | "tema" | "resumo";

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
  const [activeFilter, setActiveFilter] = useState<"todos" | "area" | "tema" | "resumo">("todos");

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

      // 1. Match em Matéria (Área)
      if (isAreaMatch) {
        const cover =
          getDisciplinaVisualTheme(a.area)?.fundoAssetUrl ||
          getAreaCover(a.area)?.cover ||
          a.coverUrl ||
          constCover;
        results.push({
          id: `area-${a.area}`,
          type: "area",
          title: a.area,
          area: a.area,
          caminho: ["Resumos Jurídicos", a.area],
          previa: `${a.total || 0} resumos disponíveis · ${a.temas?.length || 0} módulos organizados`,
          total: a.total,
          coverUrl: cover,
        });
      }

      // 2. Match em Temas (Módulos)
      for (const t of a.temas || []) {
        const temaNorm = cleanResumoString(t.tema);
        const isTemaMatch = temaNorm.includes(query);

        if (isTemaMatch) {
          const cover =
            getDisciplinaVisualTheme(a.area)?.fundoAssetUrl ||
            getAreaCover(a.area)?.cover ||
            constCover;
          results.push({
            id: `tema-${a.area}-${t.tema}`,
            type: "tema",
            title: t.tema,
            area: a.area,
            tema: t.tema,
            caminho: [a.area, t.tema],
            previa: `${t.total || t.subtemas?.length || 0} resumos e tópicos neste módulo`,
            total: t.total,
            coverUrl: cover,
          });
        }

        // 3. Match em Resumos / Capítulos (Subtemas)
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
                  previaText = rawMd.slice(0, 120) + (rawMd.length > 120 ? "…" : "");
                }
              } else {
                previaText = rawMd.slice(0, 120) + (rawMd.length > 120 ? "…" : "");
              }
            } else if (s.exemplos) {
              previaText = stripMarkdown(s.exemplos).slice(0, 120) + "…";
            }

            results.push({
              id: `resumo-${s.id || s.subtema}`,
              type: "resumo",
              title: s.subtema,
              area: a.area,
              tema: t.tema,
              subtema: s.subtema,
              caminho: [a.area, t.tema, s.subtema],
              previa: previaText || "Toque para abrir a leitura completa deste resumo.",
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
    let resumosCount = 0;
    for (const r of allResults) {
      if (r.type === "area") areasCount++;
      else if (r.type === "tema") temasCount++;
      else if (r.type === "resumo") resumosCount++;
    }
    return {
      todos: allResults.length,
      area: areasCount,
      tema: temasCount,
      resumo: resumosCount,
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
    } else if (item.type === "resumo") {
      navigate(
        `/resumos-juridicos/${encodeURIComponent(item.area)}/${encodeURIComponent(item.tema!)}?subtema=${encodeURIComponent(item.subtema!)}`
      );
    }
  };

  // Sugestões rápidas quando o campo está vazio
  const sugestoesRapidas = [
    "Direito Constitucional",
    "Direito Penal",
    "Direito Administrativo",
    "Direito Civil",
    "Direito Tributário",
    "Atos Administrativos",
    "Origens e Definições",
    "Princípios Fundamentais",
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
                    placeholder="Digite uma matéria, tema ou conteúdo de resumo…"
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

              {/* Filtros de Categoria (Todos, Matérias, Temas, Resumos) */}
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
                    onClick={() => setActiveFilter("resumo")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      activeFilter === "resumo"
                        ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20 font-bold"
                        : "bg-white/5 text-white/60 hover:text-white border border-white/5"
                    }`}
                  >
                    Resumos ({counts.resumo})
                  </button>
                </div>
              )}
            </div>

            {/* Conteúdo Dinâmico com Scroll */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3 pb-[calc(2.5rem+var(--sai-bottom,0px))]">
              {/* ESTADO 1: Campo vazio — Exibe sugestões e histórico */}
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
                      💡 <strong className="text-white">Busca Inteligente em 360°:</strong> Você
                      pode buscar tanto pelo nome da matéria quanto pelo tema, capítulo ou trecho de
                      conteúdo. O resultado exibirá o caminho exato e a prévia do resumo.
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

                  {filteredResults.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => handleSelectResult(item)}
                      className="group cursor-pointer rounded-2xl bg-[#16161a] hover:bg-[#1c1c22] border border-white/10 hover:border-emerald-500/40 p-3.5 transition-all relative overflow-hidden text-left"
                    >
                      {/* Trilha do Caminho (Breadcrumb) */}
                      <div className="flex items-center gap-1.5 text-[10.5px] font-medium text-emerald-400/90 mb-1.5 overflow-hidden">
                        {item.type === "area" && <Folder className="w-3 h-3 shrink-0" />}
                        {item.type === "tema" && <Layers className="w-3 h-3 shrink-0" />}
                        {item.type === "resumo" && <FileText className="w-3 h-3 shrink-0" />}

                        {item.caminho.map((step, idx) => (
                          <React.Fragment key={idx}>
                            <span className="truncate max-w-[140px] sm:max-w-[200px]">{step}</span>
                            {idx < item.caminho.length - 1 && (
                              <ChevronRight className="w-3 h-3 text-white/30 shrink-0" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>

                      {/* Título e Tag de Identificação */}
                      <div className="flex items-start justify-between gap-2.5">
                        <h4 className="font-sans font-semibold text-[14.5px] sm:text-[15.5px] text-white group-hover:text-emerald-300 transition-colors leading-snug line-clamp-1 flex-1">
                          {item.title}
                        </h4>

                        <span
                          className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                            item.type === "area"
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : item.type === "tema"
                              ? "bg-sky-500/10 border-sky-500/30 text-sky-400"
                              : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                          }`}
                        >
                          {item.type === "area"
                            ? "Matéria"
                            : item.type === "tema"
                            ? "Tema"
                            : "Resumo"}
                        </span>
                      </div>

                      {/* Prévia do Conteúdo / Informação */}
                      {item.previa && (
                        <p className="font-sans text-[12px] sm:text-[12.5px] text-white/60 line-clamp-2 mt-1.5 leading-relaxed">
                          {item.previa}
                        </p>
                      )}

                      {/* Ícone de seta à direita discreto */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-4 h-4 text-emerald-400" />
                      </div>
                    </motion.div>
                  ))}
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
                    Não encontramos matérias, temas ou resumos para "<strong>{q}</strong>". Tente
                    buscar com outros termos ou selecione uma matéria abaixo.
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
