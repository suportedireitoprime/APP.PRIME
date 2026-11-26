import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Heart,
  FileDown,
  Type,
  Minus,
  Plus,
  Sparkles,
  Loader2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useIsDesktop } from "@/hooks/use-desktop";
import { resumosLocal } from "@/lib/resumosLocal";
import { gerarResumoPdf, gerarResumoPdfBase64, resumoParaTexto } from "@/lib/resumoPdf";
import { obterOuSalvarResumoNoDrive } from "@/services/driveMirror";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useGatedFeature } from "@/hooks/useGatedFeature";
import CornellView from "./CornellView";
import FeynmanView from "./FeynmanView";
import { normalizarResumo } from "@/lib/resumoNormalizer";
import { removerEmojis } from "@/lib/textoSemEmoji";
import { getAreaCover } from "@/lib/areasDireitoCovers";
import { getDisciplinaVisualTheme } from "@/lib/disciplinasTheme";
import ShapeGrid from "@/components/ui/ShapeGrid";
import { GeracaoAnimacaoOverlay } from "@/components/vademecum/overlays/GeracaoAnimacaoOverlay";

import {
  CornellContent,
  FeynmanContent,
  Metodo,
  cornellParaMarkdown,
  feynmanParaMarkdown,
} from "./metodologias";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/nativeHaptics";
import { ResumoBottomBar } from "./ResumoBottomBar";
import { useResumoAudio } from "./useResumoAudio";
import { useResumoParagraphHighlighter } from "./useResumoParagraphHighlighter";
import { cleanTitulo, normalizarMarkdownWord } from "./resumoMarkdownNormalizer";
import { markdownComponents } from "./resumoMarkdownComponents";

export { cleanTitulo };

export interface ResumoRow {
  id: string;
  area: string;
  tema: string;
  subtema: string | null;
  ordem_subtema: number | null;
  markdown: string | null;
  exemplos: string | null;
  termos: string | null;
  audio_url?: string | null;
  imageUrl?: string | null;
}

interface Props {
  resumo: ResumoRow | null;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  onFavoritoChange?: () => void;
  /** Gera Cornell e Feynman automaticamente quando ainda não existem. */
  pregerarMetodos?: boolean;
  initialMetodo?: Metodo;
  defaultMetodo?: Metodo;
  initialTab?: Tab;
  inline?: boolean;
  autoStartMetodo?: Metodo | null;
  todosSubtemas?: ResumoRow[];
  onSelectSubtema?: (subtema: ResumoRow) => void;
}

type Tab = "resumo" | "exemplos" | "termos";

/** Vermelho oficial do app (mesmo do painel de início / hero-panel) */
const RED = "#E11D48";

const METODOS: { id: Metodo; label: string }[] = [
  { id: "conceitos", label: "Conceitos" },
  { id: "cornell", label: "Cornell" },
  { id: "feynman", label: "Feynman" },
];

export default function ResumoJuridicoReaderSheet({
  resumo: propsResumo,
  onClose,
  onOpenChange,
  open = true,
  onFavoritoChange,
  pregerarMetodos,
  initialMetodo,
  defaultMetodo,
  initialTab,
  inline = false,
  autoStartMetodo,
  todosSubtemas,
  onSelectSubtema,
}: Props) {
  const [activeResumo, setActiveResumo] = useState<ResumoRow | null>(propsResumo);
  useEffect(() => {
    setActiveResumo(propsResumo);
  }, [propsResumo]);

  const resumo = activeResumo || propsResumo;

  const [siblings, setSiblings] = useState<ResumoRow[]>(todosSubtemas || []);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (todosSubtemas && todosSubtemas.length > 0) {
      setSiblings(todosSubtemas);
      return;
    }
    if (!resumo?.area || !resumo?.tema) return;
    let ativo = true;
    (async () => {
      try {
        const { getResumosCatalog, matchAreaInCatalog, matchTemaInArea } = await import("@/services/resumosCatalog");
        const catalog = await getResumosCatalog();
        const areaObj = matchAreaInCatalog(catalog, resumo.area);
        const temaObj = areaObj ? matchTemaInArea(areaObj.temas, resumo.tema) : undefined;
        if (temaObj?.subtemas && temaObj.subtemas.length > 0 && ativo) {
          const mapped: ResumoRow[] = temaObj.subtemas.map((s, idx) => ({
            id: s.id,
            area: areaObj?.area || resumo.area,
            tema: temaObj.tema || resumo.tema,
            subtema: s.subtema,
            ordem_subtema: s.ordem ?? idx + 1,
            markdown: s.markdown || null,
            exemplos: s.exemplos || null,
            termos: s.termos || null,
            audio_url: s.audio_url || null,
          }));
          setSiblings(mapped);
        }
      } catch {}
    })();
    return () => {
      ativo = false;
    };
  }, [todosSubtemas, resumo?.area, resumo?.tema]);

  const currentIndex = useMemo(() => {
    if (!resumo || !siblings.length) return -1;
    const byId = siblings.findIndex((s) => s.id === resumo.id);
    if (byId >= 0) return byId;
    const cleanCurrent = cleanTitulo(resumo.subtema || resumo.tema).toLowerCase();
    const byTitle = siblings.findIndex(
      (s) => cleanTitulo(s.subtema || s.tema).toLowerCase() === cleanCurrent
    );
    return byTitle >= 0 ? byTitle : 0;
  }, [resumo, siblings]);

  const materiaColor = useMemo(() => {
    if (!resumo?.area) return "#ea580c";
    const theme = getDisciplinaVisualTheme(resumo.area);
    return theme?.primary || "#ea580c";
  }, [resumo?.area]);

  const navegarSubtema = (novoIdx: number) => {
    if (novoIdx < 0 || novoIdx >= siblings.length) return;
    const proximo = siblings[novoIdx];
    haptic.selection();
    resumosLocal.registrarRecente({
      id: proximo.id,
      area: proximo.area,
      tema: proximo.tema,
      subtema: proximo.subtema,
    });
    setActiveResumo(proximo);
    onSelectSubtema?.(proximo);
  };

  useEffect(() => {
    if (timelineRef.current && currentIndex >= 0) {
      const activeEl = timelineRef.current.children[currentIndex] as HTMLElement | undefined;
      activeEl?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [currentIndex]);
  const hasAutoStarted = useRef<string | null>(null);
  const isDesktop = useIsDesktop();
  const gateResumo = useGatedFeature('resumo_ver', 'resumo', { scope: resumo?.id ? String(resumo.id) : null });
  const gateDownload = useGatedFeature('resumo_download', 'resumo_download');
  const coverUrl = useMemo(() => getAreaCover(resumo?.area || "default")?.cover || null, [resumo?.area]);
  const [fontSize, setFontSize] = useState(17);
  const [salvandoDrive, setSalvandoDrive] = useState(false);
  const [tab, setTab] = useState<Tab>("resumo");
  const [metodo, setMetodo] = useState<Metodo>("conceitos");
  const [cornell, setCornell] = useState<CornellContent | null>(null);
  const [feynman, setFeynman] = useState<FeynmanContent | null>(null);
  const [gerando, setGerando] = useState<Metodo | null>(null);
  const [erroGerar, setErroGerar] = useState<string | null>(null);
  const [fontOpen, setFontOpen] = useState(false);
  const [fav, setFav] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [bloqueadoLeitura, setBloqueadoLeitura] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Item oficial carregado do catálogo offline (Word/R2)
  const [catalogSubtema, setCatalogSubtema] = useState<import("@/services/resumosCatalog").SubtemaItem | null>(null);

  // Dados de Conceitos Aprofundados gerados pela IA (persistidos em resumo_metodologias)
  const [conceitosData, setConceitosData] = useState<{
    markdown: string | null;
    exemplos: string | null;
    termos: string | null;
  } | null>(null);

  // Fallback básico original de resumos_juridicos
  const [basicData, setBasicData] = useState<{
    markdown: string | null;
    exemplos: string | null;
    termos: string | null;
  } | null>(null);

  const [carregandoConteudo, setCarregandoConteudo] = useState<boolean>(false);

  const handleClose = () => {
    onClose?.();
    onOpenChange?.(false);
  };

  // Plano gratuito: 1 resumo por dia (o mesmo resumo não conta duas vezes).
  useEffect(() => {
    if (!resumo?.id || gateResumo.loading) return;
    if (gateResumo.blocked) {
      setBloqueadoLeitura(true);
      gateResumo.openGate();
    } else {
      setBloqueadoLeitura(false);
      void gateResumo.run();
    }
  }, [resumo?.id, gateResumo.loading, gateResumo.blocked]);

  const gerarMetodologia = async (alvo: Metodo, force = false) => {
    if (!resumo || gerando) return;
    setGerando(alvo);
    setErroGerar(null);
    try {
      const { data, error } = await supabase.functions.invoke("gerar-metodologia", {
        body: { resumo_id: resumo.id, metodo: alvo, force },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      if (alvo === "conceitos") {
        setConceitosData(data.conteudo);
      } else if (alvo === "cornell") {
        setCornell(data.conteudo as CornellContent);
      } else {
        setFeynman(data.conteudo as FeynmanContent);
      }
    } catch (e: any) {
      setErroGerar(e?.message || "Não foi possível gerar agora. Tente novamente.");
    } finally {
      setGerando(null);
    }
  };

  // Carrega dados e metodologias ao abrir o resumo
  useEffect(() => {
    if (!resumo) {
      hasAutoStarted.current = null;
      setConceitosData(null);
      setBasicData(null);
      setCornell(null);
      setFeynman(null);
      setGerando(null);
      setErroGerar(null);
      return;
    }

    if (scrollRef.current) {
      const savedPos = sessionStorage.getItem(`resumo_scroll_${resumo.id}`);
      if (savedPos) {
        scrollRef.current.scrollTo({ top: parseInt(savedPos, 10), behavior: "auto" });
      } else {
        scrollRef.current.scrollTo({ top: 0, behavior: "auto" });
      }
    }
    setTab(initialTab || "resumo");
    const targetMetodo = autoStartMetodo || defaultMetodo || initialMetodo || "conceitos";
    setMetodo(targetMetodo);
    setCatalogSubtema(null);
    setConceitosData(null);
    setBasicData(null);
    setCornell(null);
    setFeynman(null);
    setErroGerar(null);
    setFontOpen(false);
    setFav(resumosLocal.isFavorito(resumo.id));
    setCarregandoConteudo(true);

    // 1. Sempre priorizar catálogo oficial dos resumos Word / Cloudflare R2
    let ativo = true;
    (async () => {
      try {
        const { getOrFetchSubtemaContent } = await import("@/services/resumosCatalog");
        const found = await getOrFetchSubtemaContent(resumo.area, resumo.tema, resumo.id || resumo.subtema);
        if (found && found.markdown && ativo) {
          setCatalogSubtema(found);
          if (found.audio_url && !resumo.audio_url) {
            resumo.audio_url = found.audio_url;
          }
          setCarregandoConteudo(false);
          return;
        }
      } catch (err) {
        console.warn("[ResumoReader] Falha ao consultar catálogo:", err);
      }

      // Fallback para Supabase apenas se não encontrado no catálogo
      if (!ativo) return;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(resumo.id || ''));
      if (!resumo.markdown) {
        if (isUuid) {
          supabase
            .from("resumos_juridicos")
            .select("markdown, exemplos, termos")
            .eq("id", resumo.id)
            .maybeSingle()
            .then(
              ({ data }) => {
                if (data && ativo) setBasicData(data);
                if (ativo) setCarregandoConteudo(false);
              },
              () => {
                if (ativo) setCarregandoConteudo(false);
              }
            );
        } else {
          if (ativo) setCarregandoConteudo(false);
        }
      } else {
        setBasicData({
          markdown: resumo.markdown,
          exemplos: resumo.exemplos,
          termos: resumo.termos,
        });
        if (ativo) setCarregandoConteudo(false);
      }
    })();

    // Carrega metodologias existentes no Supabase
    (async () => {
      const isOfficial = Boolean(resumo.id && String(resumo.id).includes('_cap'));
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(resumo.id || ''));
      if (!isUuid || isOfficial) return;
      const { data } = await supabase
        .from("resumo_metodologias")
        .select("metodo, conteudo")
        .eq("resumo_id", resumo.id);

      if (!ativo) return;

      const existentes = new Set<string>();
      for (const row of data || []) {
        existentes.add(row.metodo);
        if (row.metodo === "cornell") setCornell(row.conteudo as unknown as CornellContent);
        if (row.metodo === "feynman") setFeynman(row.conteudo as unknown as FeynmanContent);
        if (row.metodo === "conceitos") setConceitosData(row.conteudo as any);
      }

      // Se o método inicial for conceitos e ainda NÃO tiver sido aprofundado e NÃO tiver markdown pronto, gera
      const jaTemMarkdown = Boolean(resumo.markdown || basicData?.markdown || catalogSubtema?.markdown);
      if (targetMetodo === "conceitos" && !isOfficial && !existentes.has("conceitos") && !jaTemMarkdown) {
        void gerarMetodologia("conceitos", false);
      } else if (targetMetodo === "cornell" && !existentes.has("cornell")) {
        void gerarMetodologia("cornell", false);
      } else if (targetMetodo === "feynman" && !existentes.has("feynman")) {
        void gerarMetodologia("feynman", false);
      }

      // Pré-gerar métodos secundários em background se solicitado
      if (pregerarMetodos) {
        for (const alvo of ["cornell", "feynman"] as const) {
          if (existentes.has(alvo)) continue;
          supabase.functions
            .invoke("gerar-metodologia", { body: { resumo_id: resumo.id, metodo: alvo } })
            .then(({ data: res }) => {
              if (!ativo || !res?.conteudo) return;
              if (alvo === "cornell") setCornell(res.conteudo as CornellContent);
              else setFeynman(res.conteudo as FeynmanContent);
            })
            .catch(() => {});
        }
      }
    })();

    return () => {
      ativo = false;
    };
  }, [resumo?.id, initialTab, defaultMetodo, initialMetodo, autoStartMetodo, pregerarMetodos]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!resumo?.id) return;
    sessionStorage.setItem(`resumo_scroll_${resumo.id}`, e.currentTarget.scrollTop.toString());
    
    setIsScrolling(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 600);
  };

  const incFont = () => setFontSize((s) => Math.min(26, s + 1));
  const decFont = () => setFontSize((s) => Math.max(13, s - 1));

  const isLegacyAiText = (txt?: string | null) => {
    if (!txt) return false;
    return (
      txt.includes("ARQUITETURA DO PODER") ||
      txt.includes("Olá! Seja muito bem-vindo a este mergulho") ||
      txt.includes("INTRODUÇÃO E CONTEXTUALIZAÇÃO")
    );
  };

  const rawTitle =
    catalogSubtema?.subtema ||
    (resumo?.subtema && resumo.subtema !== resumo.tema ? resumo.subtema : null) ||
    resumo?.subtema ||
    resumo?.tema ||
    "Resumo Jurídico";
  const currentTitle = cleanTitulo(rawTitle);

  const currentMarkdown =
    catalogSubtema?.markdown ||
    (!isLegacyAiText(resumo?.markdown) ? resumo?.markdown : null) ||
    (!isLegacyAiText(basicData?.markdown) ? basicData?.markdown : null) ||
    (!isLegacyAiText(conceitosData?.markdown) ? conceitosData?.markdown : null) ||
    resumo?.markdown ||
    basicData?.markdown ||
    null;

  const currentExemplos =
    catalogSubtema?.exemplos ||
    (!isLegacyAiText(conceitosData?.markdown) ? conceitosData?.exemplos : null) ||
    (!isLegacyAiText(resumo?.markdown) ? resumo?.exemplos : null) ||
    null;

  const currentTermos =
    catalogSubtema?.termos ||
    (!isLegacyAiText(conceitosData?.markdown) ? conceitosData?.termos : null) ||
    (!isLegacyAiText(resumo?.markdown) ? resumo?.termos : null) ||
    null;

  const audioUrl = useMemo(() => {
    if (catalogSubtema?.audio_url) return catalogSubtema.audio_url;
    if (resumo?.audio_url) return resumo.audio_url;
    const md = currentMarkdown || resumo?.markdown || "";
    const match =
      md.match(/<!--\s*audio:\s*([^\s>]+)\s*-->/i) ||
      md.match(/\[audio:\s*([^\s\]]+)\]/i);
    return match ? match[1] : null;
  }, [catalogSubtema?.audio_url, resumo?.audio_url, currentMarkdown, resumo?.markdown]);

  const audioCtrl = useResumoAudio({
    audioUrl,
    titulo: currentTitle,
    subtitulo: resumo?.area,
  });

  const articleContentRef = useRef<HTMLElement | null>(null);

  useResumoParagraphHighlighter({
    containerRef: articleContentRef,
    currentTime: audioCtrl.currentTime,
    duration: audioCtrl.duration,
    isPlaying: audioCtrl.isPlaying,
    onSeek: audioCtrl.seekTo,
    isScrolling,
  });

  const rawContent =
    tab === "resumo" ? currentMarkdown : tab === "exemplos" ? currentExemplos : currentTermos;

  const content = useMemo(() => {
    return normalizarResumo(removerEmojis(rawContent));
  }, [rawContent]);

  /** Markdown do método ativo — usado em copiar / enviar / PDF */
  const markdownAtivo =
    metodo === "cornell"
      ? cornell
        ? cornellParaMarkdown(cornell)
        : null
      : metodo === "feynman"
      ? feynman
        ? feynmanParaMarkdown(feynman)
        : null
      : null;

  const toggleFav = () => {
    if (!resumo) return;
    haptic.selection();
    const novo = resumosLocal.toggleFavorito({
      id: resumo.id,
      area: resumo.area,
      tema: resumo.tema,
      subtema: resumo.subtema,
    });
    setFav(novo);
    onFavoritoChange?.();
    if (novo) toast.success("Adicionado aos favoritos!");
    else toast.success("Removido dos favoritos");
  };

  const baixarPdf = async () => {
    if (!resumo || salvandoDrive) return;
    if (!navigator.onLine) {
      toast.error("Você precisa estar online para gerar o PDF.", { id: "baixar-pdf" });
      return;
    }
    setSalvandoDrive(true);
    toast.loading("Gerando PDF...", { id: "baixar-pdf" });
    try {
      const dadosPdf =
        metodo !== "conceitos" && markdownAtivo
          ? {
              area: resumo.area,
              tema: resumo.tema,
              subtema: `${resumo.subtema || resumo.tema} — Método ${
                metodo === "cornell" ? "Cornell" : "Feynman"
              }`,
              markdown: markdownAtivo,
            }
          : {
              area: resumo.area,
              tema: resumo.tema,
              subtema: resumo.subtema || resumo.tema,
              markdown: normalizarResumo(conceitosData?.markdown || basicData?.markdown || resumo.markdown),
              exemplos: normalizarResumo(conceitosData?.exemplos || basicData?.exemplos || resumo.exemplos),
              termos: normalizarResumo(conceitosData?.termos || basicData?.termos || resumo.termos),
            };

      await gerarResumoPdf(dadosPdf);
      toast.success("PDF baixado com sucesso!", { id: "baixar-pdf" });
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      toast.error("Falha ao gerar PDF.", { id: "baixar-pdf" });
    } finally {
      setSalvandoDrive(false);
    }
  };

  const abas = (["resumo", "exemplos", "termos"] as Tab[]).filter((t) =>
    t === "resumo" ? !!currentMarkdown : t === "exemplos" ? !!currentExemplos : !!currentTermos
  );

  const isVisible = open && !!resumo;

  // Atalhos de teclado (Esc = Fechar, Ctrl/Cmd+P = Baixar PDF)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        if (gateDownload.blocked) {
          gateDownload.openGate();
          return;
        }
        void baixarPdf();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, gateDownload.blocked, gateDownload.openGate, baixarPdf]);

  if (bloqueadoLeitura) {
    return <>{gateResumo.gateNode}</>;
  }

  return (
    <AnimatePresence>
      {gateResumo.gateNode}
      {gateDownload.gateNode}
      {isVisible && (
        <>
          {!inline && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[90] bg-black/80"
              onClick={handleClose}
            />
          )}
          <motion.div
            initial={inline ? { opacity: 0, y: 8 } : { y: "100%", opacity: 0 }}
            animate={inline ? { opacity: 1, y: 0 } : { y: 0, opacity: 1 }}
            exit={inline ? { opacity: 0, y: 8 } : { y: "100%", opacity: 0 }}
            transition={
              inline
                ? { duration: 0.22, ease: "easeOut" }
                : { type: "spring", damping: 28, stiffness: 280 }
            }
            className={
              inline
                ? "relative h-full w-full bg-card border border-border rounded-2xl flex flex-col overflow-hidden shadow-xl"
                : isDesktop
                ? "fixed z-[91] inset-x-0 mx-auto top-[4vh] bottom-0 bg-card border border-b-0 border-border rounded-t-2xl flex flex-col w-[1080px] max-w-[94vw] shadow-2xl overflow-hidden 2xl:w-[1200px]"
                : "fixed inset-0 z-[91] flex flex-col bg-card text-foreground shadow-2xl overflow-hidden"
            }
          >
            {/* Background da Matéria (Capa + Gradiente + ShapeGrid) */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
              {coverUrl && (
                <img
                  src={coverUrl}
                  alt=""
                  className="w-full h-full object-cover opacity-[0.14] blur-xl scale-105"
                  aria-hidden="true"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-[#0D0D0D]/60 via-[#0D0D0D]/85 to-[#0D0D0D]" />
              <div className="absolute inset-0 opacity-[0.12]">
                <ShapeGrid />
              </div>
            </div>

            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto pb-[calc(8rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] relative z-10"
            >
              {/* Header com estilo idêntico ao design do app / blog */}
              <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-md border-b border-border">
                <div
                  className="flex items-center gap-3 py-3 shrink-0"
                  style={{
                    paddingTop: "calc(var(--sai-top, 0px) + 0.75rem)",
                    paddingLeft: "calc(1rem + var(--sai-left, 0px))",
                    paddingRight: "calc(1rem + var(--sai-right, 0px))",
                    minHeight: "calc(4.5rem + var(--sai-top, 0px))",
                  }}
                >
                  <button
                    onClick={handleClose}
                    aria-label="Fechar"
                    className="w-11 h-11 flex items-center justify-center rounded-full bg-secondary text-foreground shrink-0 hover:bg-secondary/80 active:opacity-70 transition-all"
                  >
                    <ChevronDown className="w-5 h-5" strokeWidth={2.5} />
                  </button>
                  <div className="flex-1 min-w-0 text-center">
                    <h1 className="font-display text-[17px] md:text-[19px] font-semibold text-foreground tracking-wide truncate">
                      {currentTitle}
                    </h1>
                    <p className="text-xs md:text-[11px] font-body text-muted-foreground truncate mt-0.5">
                      {resumo.area} · {resumo.tema}
                    </p>
                  </div>
                  <button
                    onClick={toggleFav}
                    aria-label={fav ? "Remover dos favoritos" : "Favoritar"}
                    className="w-11 h-11 flex items-center justify-center rounded-full bg-secondary text-foreground shrink-0 hover:bg-secondary/80 active:opacity-70 transition-all"
                  >
                    <Heart
                      className="w-5 h-5 transition-transform"
                      style={fav ? { color: RED, fill: RED } : undefined}
                      strokeWidth={2.5}
                    />
                  </button>
                </div>

                {/* Linha de Cronologia com Setas */}
                {siblings.length > 1 && (
                  <div className="border-t border-white/5 bg-[#101012]/95 px-3 py-2 sm:px-4">
                    <div className="max-w-4xl mx-auto flex items-center gap-2">
                      {/* Botão Anterior */}
                      <button
                        onClick={() => navegarSubtema(currentIndex - 1)}
                        disabled={currentIndex <= 0}
                        aria-label="Tópico anterior na cronologia"
                        className={cn(
                          "w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all active:scale-95",
                          currentIndex > 0
                            ? "border-white/10 bg-white/5 text-white hover:bg-white/15 cursor-pointer"
                            : "border-transparent bg-transparent text-white/20 cursor-not-allowed"
                        )}
                      >
                        <ChevronLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={2.5} />
                      </button>

                      {/* Trilha Horizontal com Setas */}
                      <div
                        ref={timelineRef}
                        className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-1.5 py-0.5 scroll-smooth"
                      >
                        {siblings.map((sub, idx) => {
                          const isCurrent = idx === currentIndex;
                          const isPast = idx < currentIndex;
                          const numLabel = String(idx + 1).padStart(2, "0");
                          const cleanSubTitle = cleanTitulo(sub.subtema || sub.tema);

                          return (
                            <div key={sub.id || idx} className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => navegarSubtema(idx)}
                                className={cn(
                                  "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border text-xs sm:text-[13px] font-medium transition-all shrink-0 cursor-pointer active:scale-98 select-none",
                                  isCurrent
                                    ? "text-white shadow-md font-semibold"
                                    : isPast
                                    ? "border-white/10 bg-white/[0.04] text-zinc-300 hover:border-white/20 hover:text-white"
                                    : "border-white/5 bg-transparent text-zinc-500 hover:border-white/10 hover:text-zinc-300"
                                )}
                                style={
                                  isCurrent
                                    ? {
                                        borderColor: `${materiaColor}aa`,
                                        backgroundColor: `${materiaColor}26`,
                                        color: "#FFFFFF",
                                        boxShadow: `0 0 12px ${materiaColor}33`,
                                      }
                                    : undefined
                                }
                              >
                                <span
                                  className={cn(
                                    "w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-md flex items-center justify-center text-[9.5px] sm:text-[10px] font-mono font-bold shrink-0",
                                    isCurrent
                                      ? "text-white"
                                      : isPast
                                      ? "bg-white/10 text-zinc-300"
                                      : "bg-white/5 text-zinc-500"
                                  )}
                                  style={isCurrent ? { backgroundColor: materiaColor, color: "#FFFFFF" } : undefined}
                                >
                                  {numLabel}
                                </span>
                                <span className="truncate max-w-[120px] sm:max-w-[180px]">
                                  {cleanSubTitle}
                                </span>
                              </button>

                              {idx < siblings.length - 1 && (
                                <ArrowRight
                                  className={cn(
                                    "w-3.5 h-3.5 shrink-0 transition-colors",
                                    idx < currentIndex ? "text-zinc-400" : "text-white/20"
                                  )}
                                  strokeWidth={2.4}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Botão Próximo */}
                      <button
                        onClick={() => navegarSubtema(currentIndex + 1)}
                        disabled={currentIndex >= siblings.length - 1}
                        aria-label="Próximo tópico na cronologia"
                        className={cn(
                          "w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all active:scale-95",
                          currentIndex < siblings.length - 1
                            ? "border-white/10 bg-white/5 text-white hover:bg-white/15 cursor-pointer"
                            : "border-transparent bg-transparent text-white/20 cursor-not-allowed"
                        )}
                      >
                        <ChevronRight className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4 px-4 pt-4 md:px-6 md:pt-6 max-w-4xl mx-auto w-full">
                {metodo === "conceitos" && abas.length > 1 && (
                  <div className="flex w-full mt-2 border-b border-border">
                    {abas.map((t) => {
                      const label =
                        t === "resumo" ? "Resumo" : t === "exemplos" ? "Exemplos" : "Termos";
                      const ativo = tab === t;
                      return (
                        <button
                          key={t}
                          onClick={() => setTab(t)}
                          className="relative flex-1 py-3 text-[13px] font-display font-bold uppercase tracking-wider text-center transition-colors"
                          style={{ color: ativo ? RED : "hsl(var(--muted-foreground))" }}
                        >
                          {label}
                          {ativo && (
                            <motion.span
                              layoutId="ficha-aba"
                              transition={{ type: "spring", stiffness: 420, damping: 34 }}
                              className="absolute left-3 right-3 -bottom-[1px] h-[2px] rounded-full bg-[#E11D48]"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`${metodo}-${tab}`}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -18 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="pt-2"
                  >
                    {metodo === "conceitos" ? (
                      <article
                        ref={articleContentRef as any}
                        style={{ fontSize: `${fontSize}px` }}
                        className="
                          prose prose-sm md:prose-base max-w-none dark:prose-invert font-body
                          prose-headings:font-display
                          prose-p:text-foreground/90 prose-p:leading-[1.8] prose-p:my-3.5
                          prose-a:text-amber-500 prose-a:no-underline hover:prose-a:underline
                          prose-strong:text-foreground
                          prose-ul:my-3 prose-li:my-1
                        "
                      >
                        {gerando === "conceitos" ? (
                          <div className="w-full flex items-center justify-center py-10 not-prose">
                            <GeracaoAnimacaoOverlay
                              open={true}
                              inline
                              compact
                              titulo="Aprofundando conteúdo com IA"
                              steps={[
                                "Analisando doutrina e legislação",
                                "Buscando jurisprudência",
                                "Gerando exemplos práticos",
                                "Finalizando resumo",
                              ]}
                              estTotalSec={15}
                            />
                          </div>
                        ) : carregandoConteudo || (!content && !erroGerar) ? (
                          <div className="space-y-4 py-8 max-w-2xl mx-auto not-prose animate-pulse">
                            <div className="h-7 w-3/4 bg-white/10 rounded-lg" />
                            <div className="h-4 w-full bg-white/5 rounded-lg" />
                            <div className="h-4 w-5/6 bg-white/5 rounded-lg" />
                            <div className="h-4 w-2/3 bg-white/5 rounded-lg" />
                            <div className="h-28 w-full bg-white/[0.03] rounded-2xl border border-white/5 mt-6" />
                          </div>
                        ) : content ? (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                          >
                            {normalizarMarkdownWord(content)}
                          </ReactMarkdown>
                        ) : erroGerar ? (
                          <div className="rounded-2xl border border-border p-6 text-center space-y-4 mt-4 bg-secondary/30 not-prose">
                            <p className="text-sm text-destructive font-medium">{erroGerar}</p>
                            <button
                              onClick={() => gerarMetodologia("conceitos", true)}
                              disabled={!!gerando}
                              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-display font-bold text-sm tracking-wide active:opacity-70 transition bg-[#ef4444] text-white hover:bg-[#ef4444]/90"
                            >
                              <Sparkles className="w-4 h-4" /> TENTAR GERAR NOVAMENTE
                            </button>
                          </div>
                        ) : null}
                      </article>
                    ) : (metodo === "cornell" && cornell) || (metodo === "feynman" && feynman) ? (
                      <div style={{ fontSize: `${fontSize}px` }}>
                        {metodo === "cornell" ? (
                          <CornellView conteudo={cornell!} />
                        ) : (
                          <FeynmanView conteudo={feynman!} />
                        )}
                      </div>
                    ) : gerando === metodo ? (
                      <div className="w-full flex items-center justify-center py-10 not-prose">
                        <GeracaoAnimacaoOverlay
                          open={true}
                          inline
                          compact
                          titulo={`Gerando Método ${metodo === "cornell" ? "Cornell" : "Feynman"} com IA`}
                          steps={
                            metodo === "cornell"
                              ? ["Extraindo palavras-chave", "Gerando perguntas de revisão", "Estruturando anotações", "Pronto"]
                              : ["Decompondo conceitos", "Criando linguagem simples", "Gerando analogias práticas", "Pronto"]
                          }
                          estTotalSec={10}
                        />
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-border p-6 text-center space-y-4 mt-4 bg-secondary/30">
                        <p className="text-[14.5px] sm:text-[15px] text-foreground/85 font-body leading-relaxed max-w-md mx-auto">
                          {metodo === "cornell"
                            ? "O Método Cornell organiza o conteúdo em palavras-chave, perguntas de revisão e anotações para fixação ativa."
                            : "O Método Feynman explica o conteúdo em 4 passos, com linguagem simples e analogias para eliminar lacunas."}
                        </p>
                        {erroGerar && (
                          <p className="text-sm text-destructive font-medium">{erroGerar}</p>
                        )}
                        <button
                          onClick={() => gerarMetodologia(metodo)}
                          disabled={!!gerando}
                          className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-display font-bold text-sm tracking-wide active:opacity-70 transition disabled:opacity-60 shadow-xl ${
                            metodo === "cornell"
                              ? "bg-[#38bdf8] text-zinc-950 hover:bg-[#38bdf8]/90"
                              : "bg-[#fbbf24] text-zinc-950 hover:bg-[#fbbf24]/90"
                          }`}
                        >
                          <Sparkles className="w-4 h-4" /> GERAR {metodo === "cornell" ? "CORNELL" : "FEYNMAN"} COM IA
                        </button>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
                <div className="h-40" />
              </div>
            </div>

            {/* Barra de Rodapé Estilo Vade Mecum com 5 Ações */}
            <ResumoBottomBar
              metodo={metodo}
              onSelectMetodo={(m) => {
                setMetodo(m);
                if (m === "cornell" && !cornell && !gerando) {
                  void gerarMetodologia("cornell", false);
                } else if (m === "feynman" && !feynman && !gerando) {
                  void gerarMetodologia("feynman", false);
                }
              }}
              temCornell={!!cornell}
              temFeynman={!!feynman}
              gerandoMetodo={gerando}
              audioUrl={audioUrl}
              audioPlaying={audioCtrl.isPlaying}
              audioLoading={audioCtrl.isLoading}
              audioProgress={audioCtrl.progressPct}
              onToggleAudio={audioCtrl.togglePlay}
              onBaixarPdf={() => {
                if (gateDownload.blocked) {
                  gateDownload.openGate();
                  return;
                }
                void baixarPdf();
              }}
              salvandoPdf={salvandoDrive}
              fontSize={fontSize}
              onIncFont={incFont}
              onDecFont={decFont}
              fontOpen={fontOpen}
              onToggleFont={() => setFontOpen((v) => !v)}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
