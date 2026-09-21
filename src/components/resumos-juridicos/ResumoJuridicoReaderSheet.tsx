import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Share2,
  Heart,
  FileDown,
  Copy,
  Check,
  Type,
  Minus,
  Plus,
  Quote,
  Sparkles,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Info,
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
import ShapeGrid from "@/components/ui/ShapeGrid";

import {
  CornellContent,
  FeynmanContent,
  Metodo,
  cornellParaMarkdown,
  feynmanParaMarkdown,
} from "./metodologias";
import { copiarTexto } from '@/lib/nativo/copiar';
import { abrirLink } from '@/lib/nativo';
import { compartilharNativo, podeCompartilhar } from '@/lib/nativo/compartilhar';
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/nativeHaptics";

export interface ResumoRow {
  id: string;
  area: string;
  tema: string;
  subtema: string | null;
  ordem_subtema: number | null;
  markdown: string | null;
  exemplos: string | null;
  termos: string | null;
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
}

type Tab = "resumo" | "exemplos" | "termos";

/** Vermelho oficial do app (mesmo do rodapé / início) */
const RED = "#ef4444";

const METODOS: { id: Metodo; label: string }[] = [
  { id: "conceitos", label: "Conceitos" },
  { id: "cornell", label: "Cornell" },
  { id: "feynman", label: "Feynman" },
];

export default function ResumoJuridicoReaderSheet({
  resumo,
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
}: Props) {
  const hasAutoStarted = useRef<string | null>(null);
  const isDesktop = useIsDesktop();
  const gateResumo = useGatedFeature('resumo_ver', 'resumo', { scope: resumo?.id ? String(resumo.id) : null });
  const gateDownload = useGatedFeature('resumo_download', 'resumo_download');
  const coverUrl = useMemo(() => resumo?.area ? getAreaCover(resumo.area)?.cover : null, [resumo?.area]);
  const [fontSize, setFontSize] = useState(17);
  const [salvandoDrive, setSalvandoDrive] = useState(false);
  const [tab, setTab] = useState<Tab>("resumo");
  const [metodo, setMetodo] = useState<Metodo>("conceitos");
  const [cornell, setCornell] = useState<CornellContent | null>(null);
  const [feynman, setFeynman] = useState<FeynmanContent | null>(null);
  const [gerando, setGerando] = useState<Metodo | null>(null);
  const [erroGerar, setErroGerar] = useState<string | null>(null);
  const [fontOpen, setFontOpen] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [fav, setFav] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [bloqueadoLeitura, setBloqueadoLeitura] = useState(false);

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
      scrollRef.current.scrollTo({ top: 0, behavior: "auto" });
    }
    setTab(initialTab || "resumo");
    const targetMetodo = autoStartMetodo || defaultMetodo || initialMetodo || "conceitos";
    setMetodo(targetMetodo);
    setConceitosData(null);
    setBasicData(null);
    setCornell(null);
    setFeynman(null);
    setErroGerar(null);
    setFontOpen(false);
    setCopiado(false);
    setFav(resumosLocal.isFavorito(resumo.id));

    // Busca fallback básico em resumos_juridicos se necessário
    if (!resumo.markdown) {
      supabase
        .from("resumos_juridicos")
        .select("markdown, exemplos, termos")
        .eq("id", resumo.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setBasicData(data);
        });
    } else {
      setBasicData({
        markdown: resumo.markdown,
        exemplos: resumo.exemplos,
        termos: resumo.termos,
      });
    }

    // Carrega metodologias existentes no Supabase
    let ativo = true;
    (async () => {
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

      // Se o método inicial for conceitos e ainda NÃO tiver sido aprofundado, gera AUTOMATICAMENTE!
      if (targetMetodo === "conceitos" && !existentes.has("conceitos")) {
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

  const incFont = () => setFontSize((s) => Math.min(26, s + 1));
  const decFont = () => setFontSize((s) => Math.max(13, s - 1));

  const currentMarkdown = conceitosData?.markdown ?? (erroGerar ? basicData?.markdown : null);
  const currentExemplos = conceitosData?.exemplos ?? (erroGerar ? basicData?.exemplos : null);
  const currentTermos = conceitosData?.termos ?? (erroGerar ? basicData?.termos : null);

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
    const novo = resumosLocal.toggleFavorito({
      id: resumo.id,
      area: resumo.area,
      tema: resumo.tema,
      subtema: resumo.subtema,
    });
    setFav(novo);
    onFavoritoChange?.();
  };

  const textoAtivo = () => {
    if (!resumo) return "";
    if (metodo === "conceitos" || !markdownAtivo) {
      return resumoParaTexto({
        ...resumo,
        markdown: normalizarResumo(conceitosData?.markdown || basicData?.markdown || resumo.markdown),
        exemplos: normalizarResumo(conceitosData?.exemplos || basicData?.exemplos || resumo.exemplos),
        termos: normalizarResumo(conceitosData?.termos || basicData?.termos || resumo.termos),
      });
    }
    const cabecalho = `${resumo.area} · ${resumo.tema}\n${resumo.subtema || ""}\nMétodo ${
      metodo === "cornell" ? "Cornell" : "Feynman"
    }\n\n`;
    return cabecalho + markdownAtivo.replace(/[#*]/g, "");
  };

  const copiar = async () => {
    if (!resumo) return;
    try {
      await copiarTexto(textoAtivo());
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      /* noop */
    }
  };

  const baixarPdf = async () => {
    if (!resumo || salvandoDrive) return;
    setSalvandoDrive(true);
    toast.loading("Preparando PDF no Google Drive...", { id: "salvar-drive-pdf" });
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
              ...resumo,
              markdown: normalizarResumo(conceitosData?.markdown || basicData?.markdown || resumo.markdown),
              exemplos: normalizarResumo(conceitosData?.exemplos || basicData?.exemplos || resumo.exemplos),
              termos: normalizarResumo(conceitosData?.termos || basicData?.termos || resumo.termos),
            };

      const tituloDoc = `${resumo.tema} - ${resumo.subtema || resumo.tema}${
        metodo !== "conceitos" ? ` (${metodo})` : ""
      }`;

      const resultado = await obterOuSalvarResumoNoDrive({
        titulo: tituloDoc,
        gerarBase64: async () => {
          const { base64 } = await gerarResumoPdfBase64(dadosPdf);
          return base64;
        },
      });

      if (resultado?.link) {
        toast.success(
          resultado.reutilizado
            ? "Abrindo PDF no Google Drive..."
            : "PDF salvo no Google Drive! Abrindo...",
          { id: "salvar-drive-pdf" }
        );
        await abrirLink(resultado.link);
      } else {
        toast.error("Não foi possível salvar no Google Drive agora. Tente novamente.", {
          id: "salvar-drive-pdf",
        });
      }
    } catch (err) {
      console.error("Erro ao salvar PDF no Drive:", err);
      toast.error("Falha ao salvar PDF no Google Drive.", { id: "salvar-drive-pdf" });
    } finally {
      setSalvandoDrive(false);
    }
  };

  const share = async () => {
    if (!resumo) return;
    const text = textoAtivo();
    try {
      if (podeCompartilhar()) {
        await compartilharNativo({ title: resumo.subtema || resumo.tema, text });
      } else {
        void abrirLink(`https://wa.me/?text=${encodeURIComponent(text.slice(0, 1500))}`);
      }
    } catch {
      /* noop */
    }
  };

  const abas = (["resumo", "exemplos", "termos"] as Tab[]).filter((t) =>
    t === "resumo" ? !!currentMarkdown : t === "exemplos" ? !!currentExemplos : !!currentTermos
  );

  const isVisible = open && !!resumo;

  // Atalho de teclado (Esc = Fechar leitor no Desktop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isVisible) {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible]);

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
              className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-md"
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
                : "fixed inset-0 z-[91] flex flex-col bg-card text-foreground shadow-2xl overflow-hidden pb-[var(--sai-bottom,0px)]"
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
                    className="w-11 h-11 flex items-center justify-center rounded-full bg-secondary text-foreground shrink-0 hover:bg-secondary/80 active:scale-95 transition-all"
                  >
                    <ChevronDown className="w-5 h-5" strokeWidth={2.5} />
                  </button>
                  <div className="flex-1 min-w-0 text-center">
                    <h1 className="font-display text-[17px] md:text-[19px] font-semibold text-foreground tracking-wide truncate">
                      {resumo.subtema || resumo.tema}
                    </h1>
                    <p className="text-xs md:text-[11px] font-body text-muted-foreground truncate mt-0.5">
                      {resumo.area} · {resumo.tema}
                    </p>
                  </div>
                  <button
                    onClick={toggleFav}
                    aria-label={fav ? "Remover dos favoritos" : "Favoritar"}
                    className="w-11 h-11 flex items-center justify-center rounded-full bg-secondary text-foreground shrink-0 hover:bg-secondary/80 active:scale-95 transition-all"
                  >
                    <Heart
                      className="w-5 h-5 transition-transform"
                      style={fav ? { color: RED, fill: RED } : undefined}
                      strokeWidth={2.5}
                    />
                  </button>
                </div>
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
                              className="absolute left-3 right-3 -bottom-[1px] h-[2px] rounded-full bg-[#ef4444]"
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
                        style={{ fontSize: `${fontSize}px` }}
                        className="
                          prose prose-sm md:prose-base max-w-none dark:prose-invert font-body
                          prose-headings:font-display prose-headings:text-foreground
                          prose-p:text-foreground/90 prose-p:leading-[1.8] prose-p:my-3.5
                          prose-a:text-[#ef4444] prose-a:no-underline hover:prose-a:underline
                          prose-strong:text-foreground
                          prose-ul:my-3 prose-li:my-1
                        "
                      >
                        {gerando === "conceitos" || (!conceitosData && !erroGerar) ? (
                          <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4 not-prose">
                            <div className="relative">
                              <div className="w-16 h-16 rounded-2xl bg-[#ef4444]/10 border border-[#ef4444]/30 flex items-center justify-center text-[#ef4444] shadow-lg shadow-[#ef4444]/20 animate-pulse">
                                <Sparkles className="w-8 h-8" />
                              </div>
                              <Loader2 className="w-6 h-6 animate-spin text-[#ef4444] absolute -bottom-2 -right-2" />
                            </div>
                            <div className="space-y-1.5 max-w-sm">
                              <h3 className="text-base font-semibold text-white tracking-wide uppercase font-display">
                                Aprofundando conteúdo com IA
                              </h3>
                              <p className="text-xs text-white/60 leading-relaxed">
                                Analisando doutrina, legislação e jurisprudência para estruturar o estudo completo ponto a ponto...
                              </p>
                            </div>
                          </div>
                        ) : content ? (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({ node, ...props }) => (
                                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-8 mb-4 border-b border-border/50 pb-2.5 font-display leading-tight" {...props} />
                              ),
                              h2: ({ node, ...props }) => (
                                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white/95 mt-7 mb-3 font-display leading-snug" {...props} />
                              ),
                              h3: ({ node, ...props }) => (
                                <h3 className="text-base sm:text-lg font-semibold tracking-tight text-white/90 mt-5 mb-2 font-display leading-snug" {...props} />
                              ),
                              h4: ({ node, ...props }) => (
                                <h4 className="text-[14px] sm:text-base font-semibold tracking-tight text-white/85 mt-4 mb-1.5 font-display leading-snug" {...props} />
                              ),
                              p: ({ node, ...props }) => (
                                <p className="my-3.5 text-foreground/90 leading-[1.8] text-[15px] sm:text-[16px]" {...props} />
                              ),
                              table: ({ node, ...props }) => (
                                <div className="my-6 w-full overflow-x-auto rounded-2xl border border-primary/20 bg-card/70 shadow-lg backdrop-blur-md">
                                  <table className="w-full text-left text-xs md:text-sm border-collapse" {...props} />
                                </div>
                              ),
                              th: ({ node, ...props }) => (
                                <th className="bg-secondary/40 px-4 py-3.5 border-b border-border/50 text-slate-200 font-display font-bold text-sm tracking-wide uppercase" {...props} />
                              ),
                              td: ({ node, ...props }) => (
                                <td className="px-4 py-3 border-b border-border/30 text-foreground/90 font-body leading-relaxed" {...props} />
                              ),
                              blockquote: ({ node, children, ...props }: any) => {
                                const extractText = (c: any): string => {
                                  if (typeof c === "string") return c;
                                  if (Array.isArray(c)) return c.map(extractText).join("");
                                  if (c?.props?.children) return extractText(c.props.children);
                                  return "";
                                };

                                const text = extractText(children);
                                const alertMatch = text.match(/^\s*\[!(NOTE|IMPORTANT|WARNING|TIP|CAUTION)\]\s*/i);

                                if (alertMatch) {
                                  const type = alertMatch[1].toUpperCase();
                                  const alertConfig = {
                                    IMPORTANT: {
                                      label: "Importante",
                                      icon: AlertCircle,
                                      bg: "bg-amber-500/10",
                                      border: "border-amber-500/40",
                                      text: "text-amber-400",
                                    },
                                    WARNING: {
                                      label: "Atenção",
                                      icon: AlertTriangle,
                                      bg: "bg-rose-500/10",
                                      border: "border-rose-500/40",
                                      text: "text-rose-400",
                                    },
                                    CAUTION: {
                                      label: "Cuidado",
                                      icon: AlertTriangle,
                                      bg: "bg-rose-500/10",
                                      border: "border-rose-500/40",
                                      text: "text-rose-400",
                                    },
                                    TIP: {
                                      label: "Dica de Fixação",
                                      icon: Sparkles,
                                      bg: "bg-emerald-500/10",
                                      border: "border-emerald-500/40",
                                      text: "text-emerald-400",
                                    },
                                    NOTE: {
                                      label: "Nota Explicativa",
                                      icon: Info,
                                      bg: "bg-sky-500/10",
                                      border: "border-sky-500/40",
                                      text: "text-sky-400",
                                    },
                                  }[type] || {
                                    label: "Nota",
                                    icon: Info,
                                    bg: "bg-sky-500/10",
                                    border: "border-sky-500/40",
                                    text: "text-sky-400",
                                  };

                                  const Icon = alertConfig.icon;

                                  const cleanChildren = (ch: any): any => {
                                    if (typeof ch === "string") {
                                      return ch.replace(/^\s*\[!(NOTE|IMPORTANT|WARNING|TIP|CAUTION)\]\s*/i, "");
                                    }
                                    if (Array.isArray(ch)) {
                                      return ch.map(cleanChildren);
                                    }
                                    if (ch?.props?.children) {
                                      return {
                                        ...ch,
                                        props: {
                                          ...ch.props,
                                          children: cleanChildren(ch.props.children),
                                        },
                                      };
                                    }
                                    return ch;
                                  };

                                  return (
                                    <div className={`my-5 rounded-2xl border ${alertConfig.border} ${alertConfig.bg} p-4 md:p-5 shadow-sm text-foreground/95 not-prose`}>
                                      <div className={`flex items-center gap-2 mb-2 font-display font-bold text-xs uppercase tracking-wider ${alertConfig.text}`}>
                                        <Icon className="w-4 h-4 shrink-0" />
                                        <span>{alertConfig.label}</span>
                                      </div>
                                      <div className="text-foreground/90 text-sm md:text-[15px] leading-relaxed">
                                        {cleanChildren(children)}
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <blockquote className="my-5 rounded-2xl border-l-4 border-primary bg-primary/10 p-4 md:p-5 shadow-sm text-foreground/95 not-italic" {...props}>
                                    <div className="flex items-start gap-3">
                                      <Quote className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                                      <div className="text-foreground/90 leading-relaxed">{children}</div>
                                    </div>
                                  </blockquote>
                                );
                              },
                              pre: ({ node, ...props }) => (
                                <pre className="my-6 p-4 md:p-5 rounded-2xl bg-zinc-950/90 border border-border/80 text-slate-100 font-mono text-xs md:text-sm overflow-x-auto shadow-xl leading-relaxed tracking-wide" {...props} />
                              ),
                              code: ({ node, inline, ...props }: any) =>
                                inline ? (
                                  <code className="px-1.5 py-0.5 rounded-md bg-secondary text-foreground font-mono text-xs font-semibold" {...props} />
                                ) : (
                                  <code className="text-slate-100 font-mono text-xs md:text-sm" {...props} />
                                ),
                              hr: ({ node, ...props }) => (
                                <hr className="my-6 border-border/60" {...props} />
                              ),
                            }}
                          >
                            {content}
                          </ReactMarkdown>
                        ) : erroGerar ? (
                          <div className="rounded-2xl border border-border p-6 text-center space-y-4 mt-4 bg-secondary/30 not-prose">
                            <p className="text-sm text-destructive font-medium">{erroGerar}</p>
                            <button
                              onClick={() => gerarMetodologia("conceitos", true)}
                              disabled={!!gerando}
                              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-display font-bold text-sm tracking-wide active:scale-95 transition bg-[#ef4444] text-white hover:bg-[#ef4444]/90"
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
                      <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4 not-prose">
                        <div className="relative">
                          <div
                            className={`w-16 h-16 rounded-2xl border flex items-center justify-center shadow-lg animate-pulse ${
                              metodo === "cornell"
                                ? "bg-[#38bdf8]/10 border-[#38bdf8]/30 text-[#38bdf8] shadow-[#38bdf8]/20"
                                : "bg-[#fbbf24]/10 border-[#fbbf24]/30 text-[#fbbf24] shadow-[#fbbf24]/20"
                            }`}
                          >
                            <Sparkles className="w-8 h-8" />
                          </div>
                          <Loader2
                            className={`w-6 h-6 animate-spin absolute -bottom-2 -right-2 ${
                              metodo === "cornell" ? "text-[#38bdf8]" : "text-[#fbbf24]"
                            }`}
                          />
                        </div>
                        <div className="space-y-1.5 max-w-sm">
                          <h3 className="text-base font-bold text-white tracking-wide uppercase font-display">
                            Gerando Método {metodo === "cornell" ? "Cornell" : "Feynman"} com IA
                          </h3>
                          <p className="text-xs text-white/60 leading-relaxed">
                            {metodo === "cornell"
                              ? "Organizando palavras-chave, perguntas de revisão e anotações para fixação ativa..."
                              : "Decompondo conceitos complexos em linguagem simples, analogias e lacunas de estudo..."}
                          </p>
                        </div>
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
                          className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-display font-bold text-sm tracking-wide active:scale-95 transition disabled:opacity-60 shadow-xl ${
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

            {/* Ações flutuantes idênticas ao design system do app */}
            <div className="pointer-events-none absolute bottom-[calc(1.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] right-4 flex flex-col items-end gap-3 z-20">
              <AnimatePresence>
                {fontOpen && (
                  <motion.div
                    key="font-controls"
                    initial={{ opacity: 0, scale: 0.95, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 4 }}
                    transition={{ duration: 0.18 }}
                    className="pointer-events-auto flex items-center bg-card/95 backdrop-blur-md border border-border rounded-full shadow-xl overflow-hidden"
                  >
                    <button
                      onClick={decFont}
                      aria-label="Diminuir fonte"
                      className="w-10 h-11 flex items-center justify-center text-foreground hover:bg-secondary active:scale-95 transition-all"
                    >
                      <Minus className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                    <span className="min-w-[44px] text-center text-[11px] font-bold tabular-nums text-foreground">
                      {fontSize}px
                    </span>
                    <button
                      onClick={incFont}
                      aria-label="Aumentar fonte"
                      className="w-10 h-11 flex items-center justify-center text-foreground hover:bg-secondary active:scale-95 transition-all"
                    >
                      <Plus className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="pointer-events-auto flex flex-col gap-2 items-end">
                <button
                  onClick={() => setFontOpen((v) => !v)}
                  aria-label="Tamanho da fonte"
                  aria-expanded={fontOpen}
                  className="w-11 h-11 flex items-center justify-center rounded-full bg-card/95 backdrop-blur-md border border-border shadow-xl text-foreground hover:bg-secondary active:scale-95 transition-all"
                >
                  <Type className="w-5 h-5" strokeWidth={2.5} />
                </button>
                <button
                  onClick={copiar}
                  aria-label="Copiar resumo"
                  className="w-11 h-11 flex items-center justify-center rounded-full bg-card/95 backdrop-blur-md border border-border shadow-xl text-foreground hover:bg-secondary active:scale-95 transition-all"
                >
                  {copiado ? (
                    <Check className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => {
                    if (gateDownload.blocked) {
                      gateDownload.openGate();
                      return;
                    }
                    void baixarPdf();
                  }}
                  disabled={salvandoDrive}
                  aria-label="Salvar PDF no Google Drive"
                  className="w-11 h-11 flex items-center justify-center rounded-full bg-card/95 backdrop-blur-md border border-border shadow-xl text-foreground hover:bg-secondary active:scale-95 transition-all disabled:opacity-60"
                >
                  {salvandoDrive ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#ef4444]" />
                  ) : (
                    <FileDown className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={share}
                  aria-label="Compartilhar"
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl hover:brightness-110 active:scale-95 transition-all"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
