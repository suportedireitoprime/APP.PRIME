// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Heart,
  FileDown,
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
import { GeracaoAnimacaoOverlay } from "@/components/vademecum/overlays/GeracaoAnimacaoOverlay";

import {
  CornellContent,
  FeynmanContent,
  Metodo,
  cornellParaMarkdown,
  feynmanParaMarkdown,
} from "./metodologias";
import { abrirLink } from '@/lib/nativo';
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/nativeHaptics";
import { ResumoAudioPlayer } from "./ResumoAudioPlayer";

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
}

type Tab = "resumo" | "exemplos" | "termos";

/** Vermelho oficial do app (mesmo do painel de início / hero-panel) */
const RED = "#E11D48";

const METODOS: { id: Metodo; label: string }[] = [
  { id: "conceitos", label: "Conceitos" },
  { id: "cornell", label: "Cornell" },
  { id: "feynman", label: "Feynman" },
];

// Função de normalização on-the-fly para garantir fidelidade visual ao Word em todo o catálogo
function normalizarMarkdownWord(raw?: string | null): string {
  if (!raw) return "";
  let md = raw;

  // 0. Remove comentários HTML e tags de áudio para não vazar no texto renderizado
  md = md.replace(/<!--[\s\S]*?-->/g, "");
  md = md.replace(/\[audio:\s*[^\s\]]+\s*\]/gi, "");

  // 1. Converte headers legacy de seções para ##
  md = md.replace(
    /^###\s*(?:[🎯💡📋📌]\s*)?(Em linguagem simples|Para entender melhor|De olho na prova|Ficha do tema|Ficha do crime|Ficha do conceito|Para guardar|Antes de começar|Como usar este material|Sumário)/gim,
    "## $1"
  );

  // 2. Se "De olho na prova" contiver múltiplos `> [!WARNING]\n> **Topic:** desc`, converte para bullets limpos com ⚠
  md = md.replace(/>\s*\[!WARNING\]\s*\n>\s*\*\*([^\n*]+)\*\*/g, (match, p1) => {
    if (p1.includes(":") || p1.startsWith("⚠")) {
      const clean = p1.replace(/^⚠\s*/, "").trim();
      const cIdx = clean.indexOf(":");
      if (cIdx > 0 && cIdx < 60) {
        return `- ⚠ **${clean.slice(0, cIdx).trim()}:** ${clean.slice(cIdx + 1).trim()}`;
      }
      return `- ⚠ **${clean}**`;
    }
    return match;
  });

  // 3. Se "Exemplo prático" estiver como ## Exemplo prático\n\nTexto ou ### 💡 Exemplo prático
  md = md.replace(
    /#{2,3}\s*(?:💡\s*)?Exemplo prático\s*\n+([\s\S]*?)(?=\n#{1,3}\s|\n---|$)/i,
    (match, body) => {
      const cleanBody = body.trim();
      if (!cleanBody.startsWith(">")) {
        return `> [!TIP] **Exemplo prático**\n> *${cleanBody}*\n\n`;
      }
      return match;
    }
  );

  // 4. Se "Ficha do tema" estiver sem pipe de tabela (linhas soltas alternadas)
  md = md.replace(
    /#{2,3}\s*(?:📋\s*)?(Ficha do (?:tema|crime|conceito))\s*\n+([\s\S]*?)(?=\n#{1,3}\s|\n---|$)/i,
    (match, headerTitle, body) => {
      const trimmedBody = body.trim();
      if (trimmedBody.includes("|")) return `## ${headerTitle}\n\n${trimmedBody}\n\n`;

      const lines = trimmedBody.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length >= 4) {
        const rows = [];
        rows.push(`| ${headerTitle} | Detalhamento |`);
        rows.push(`| :--- | :--- |`);
        for (let i = 0; i < lines.length; i += 2) {
          const k = lines[i];
          const v = lines[i + 1] || "";
          if (k && v) {
            rows.push(`| **${k}** | ${v} |`);
          }
        }
        return `## ${headerTitle}\n\n` + rows.join("\n") + "\n\n";
      }
      return match;
    }
  );

  // 5. Se houver subtítulos dentro de "Para entender melhor" que ficaram como parágrafos normais
  md = md.replace(/(##\s*Para entender melhor[\s\S]*?)(?=\n##|\n---|$)/i, (match, sectionBody) => {
    const lines = sectionBody.split("\n");
    const newLines = [];

    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const trimmed = l.trim();

      if (
        trimmed &&
        !trimmed.startsWith("#") &&
        !trimmed.startsWith("-") &&
        !trimmed.startsWith(">") &&
        !trimmed.startsWith("|") &&
        trimmed.length >= 10 &&
        trimmed.length <= 80 &&
        !trimmed.endsWith(".") &&
        !trimmed.endsWith(":") &&
        !trimmed.endsWith(",") &&
        lines[i + 1] === "" &&
        lines[i + 2] &&
        lines[i + 2].trim().length > 60
      ) {
        newLines.push(`### ${trimmed}`);
      } else {
        newLines.push(l);
      }
    }
    return newLines.join("\n");
  });

  return md;
}

const markdownComponents = {
  h1: ({ node, ...props }: any) => (
    <h1
      className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-6 mb-4 border-b border-border/40 pb-3 font-display leading-tight"
      {...props}
    />
  ),
  h2: ({ node, ...props }: any) => (
    <h2
      className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-8 mb-4 font-display leading-snug border-b-2 border-amber-500/80 dark:border-amber-500 pb-2"
      {...props}
    />
  ),
  h3: ({ node, children, ...props }: any) => (
    <h3
      className="text-base sm:text-lg font-bold tracking-tight text-[#C0563F] dark:text-[#E26D5C] mt-6 mb-2.5 font-display leading-snug"
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ node, ...props }: any) => (
    <h4
      className="text-[15px] sm:text-base font-semibold tracking-tight text-amber-500 dark:text-amber-400 mt-4 mb-2 font-display leading-snug"
      {...props}
    />
  ),
  p: ({ node, ...props }: any) => (
    <p className="my-3.5 text-foreground/90 leading-[1.8] text-[15px] sm:text-[16px]" {...props} />
  ),
  ul: ({ node, ...props }: any) => (
    <ul className="my-4 space-y-2 pl-0 list-none" {...props} />
  ),
  ol: ({ node, ...props }: any) => (
    <ol className="my-4 space-y-2 pl-4 list-decimal" {...props} />
  ),
  li: ({ node, children, ...props }: any) => {
    const extractText = (c: any): string => {
      if (typeof c === "string") return c;
      if (Array.isArray(c)) return c.map(extractText).join("");
      if (c?.props?.children) return extractText(c.props.children);
      return "";
    };
    const text = extractText(children);

    if (text.includes("⚠")) {
      return (
        <li className="my-2.5 pl-0 leading-relaxed text-foreground/95 flex items-start gap-2.5 list-none">
          <span
            className="shrink-0 mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/15 text-amber-500 dark:text-amber-400 text-xs font-bold"
            aria-hidden="true"
          >
            ⚠
          </span>
          <div className="flex-1 text-[15px] sm:text-[16px] leading-relaxed">{children}</div>
        </li>
      );
    }

    if (text.includes("✓")) {
      return (
        <li className="my-2 pl-0 leading-relaxed text-foreground/95 flex items-start gap-2.5 list-none">
          <span
            className="shrink-0 mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 text-xs font-bold"
            aria-hidden="true"
          >
            ✓
          </span>
          <div className="flex-1 text-[15px] sm:text-[16px] leading-relaxed">{children}</div>
        </li>
      );
    }

    return (
      <li className="my-1.5 pl-1 leading-relaxed text-foreground/90 text-[15px] sm:text-[16px] list-disc list-inside" {...props}>
        {children}
      </li>
    );
  },
  table: ({ node, ...props }: any) => (
    <div className="my-6 w-full overflow-x-auto rounded-2xl border border-border/80 bg-card/70 shadow-lg backdrop-blur-md not-prose">
      <table className="w-full text-left text-xs sm:text-sm border-collapse" {...props} />
    </div>
  ),
  th: ({ node, ...props }: any) => (
    <th className="bg-[#1B2A4A] text-white px-4 py-3.5 border-b border-white/10 font-display font-bold text-xs sm:text-sm uppercase tracking-wider text-left" {...props} />
  ),
  td: ({ node, ...props }: any) => (
    <td className="px-4 py-3.5 border-b border-border/30 text-foreground/90 font-body leading-relaxed first:font-bold first:text-foreground first:bg-secondary/20 first:w-[35%] sm:first:w-[30%]" {...props} />
  ),
  blockquote: ({ node, children, ...props }: any) => {
    const extractText = (c: any): string => {
      if (typeof c === "string") return c;
      if (Array.isArray(c)) return c.map(extractText).join("");
      if (c?.props?.children) return extractText(c.props.children);
      return "";
    };
    const text = extractText(children);

    // Callout de Exemplo Prático (Word styling: fundo quente, borda âmbar espessa na esquerda e itálico)
    if (/exemplo\s*pr[aá]tico/i.test(text)) {
      const cleanChildren = (ch: any): any => {
        if (typeof ch === "string") {
          return ch.replace(/^\s*\[!(?:TIP|NOTE|WARNING|IMPORTANT)\]\s*(?:\*\*)?Exemplo\s*pr[aá]tico(?:\*\*)?\s*/i, "");
        }
        if (Array.isArray(ch)) return ch.map(cleanChildren);
        if (ch?.props?.children) return { ...ch, props: { ...ch.props, children: cleanChildren(ch.props.children) } };
        return ch;
      };
      return (
        <div className="my-6 rounded-r-2xl border-l-4 border-amber-500 bg-amber-500/10 dark:bg-amber-950/20 p-4 sm:p-5 shadow-sm text-foreground/95 not-prose">
          <div className="flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-400 font-display font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Exemplo prático</span>
          </div>
          <div className="italic text-[15px] sm:text-[16px] text-foreground/90 font-body leading-relaxed">
            {cleanChildren(children)}
          </div>
        </div>
      );
    }

    // Callout de Atenção / Curiosidade
    if (/aten[cç][aã]o\s*[—\-–]?\s*curiosidade/i.test(text) || /curiosidade:/i.test(text)) {
      const cleanChildren = (ch: any): any => {
        if (typeof ch === "string") {
          return ch.replace(/^\s*\[!(?:WARNING|IMPORTANT|TIP|NOTE)\]\s*(?:\*\*)?Atenção\s*[—\-–]?\s*Curiosidade(?:\*\*)?\s*/i, "");
        }
        if (Array.isArray(ch)) return ch.map(cleanChildren);
        if (ch?.props?.children) return { ...ch, props: { ...ch.props, children: cleanChildren(ch.props.children) } };
        return ch;
      };
      return (
        <div className="my-6 rounded-r-2xl border-l-4 border-rose-500 bg-rose-500/10 dark:bg-rose-950/20 p-4 sm:p-5 shadow-sm text-foreground/95 not-prose">
          <div className="flex items-center gap-2 mb-2 text-rose-500 dark:text-rose-400 font-display font-bold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Atenção — Curiosidade</span>
          </div>
          <div className="italic text-[15px] sm:text-[16px] text-foreground/90 font-body leading-relaxed">
            {cleanChildren(children)}
          </div>
        </div>
      );
    }

    const alertMatch = text.match(/^\s*\[!(NOTE|IMPORTANT|WARNING|TIP|CAUTION)\]\s*/i);
    if (alertMatch) {
      const type = alertMatch[1].toUpperCase();
      const alertConfig = {
        IMPORTANT: { label: "Importante", icon: AlertCircle, bg: "bg-amber-500/10", border: "border-amber-500/40", text: "text-amber-400" },
        WARNING: { label: "Atenção", icon: AlertTriangle, bg: "bg-rose-500/10", border: "border-rose-500/40", text: "text-rose-400" },
        CAUTION: { label: "Cuidado", icon: AlertTriangle, bg: "bg-rose-500/10", border: "border-rose-500/40", text: "text-rose-400" },
        TIP: { label: "Dica de Fixação", icon: Sparkles, bg: "bg-emerald-500/10", border: "border-emerald-500/40", text: "text-emerald-400" },
        NOTE: { label: "Nota Explicativa", icon: Info, bg: "bg-sky-500/10", border: "border-sky-500/40", text: "text-sky-400" },
      }[type] || { label: "Nota", icon: Info, bg: "bg-sky-500/10", border: "border-sky-500/40", text: "text-sky-400" };
      const Icon = alertConfig.icon;
      const cleanChildren = (ch: any): any => {
        if (typeof ch === "string") return ch.replace(/^\s*\[!(NOTE|IMPORTANT|WARNING|TIP|CAUTION)\]\s*/i, "");
        if (Array.isArray(ch)) return ch.map(cleanChildren);
        if (ch?.props?.children) return { ...ch, props: { ...ch.props, children: cleanChildren(ch.props.children) } };
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
      <blockquote className="my-5 rounded-2xl border-l-4 border-amber-500 bg-amber-500/10 p-4 md:p-5 shadow-sm text-foreground/95 not-italic" {...props}>
        <div className="flex items-start gap-3">
          <Quote className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-foreground/90 leading-relaxed italic">{children}</div>
        </div>
      </blockquote>
    );
  },
  pre: ({ node, ...props }: any) => (
    <pre className="my-6 p-4 md:p-5 rounded-2xl bg-zinc-950/90 border border-border/80 text-slate-100 font-mono text-xs md:text-sm overflow-x-auto shadow-xl leading-relaxed tracking-wide" {...props} />
  ),
  code: ({ node, inline, ...props }: any) =>
    inline ? (
      <code className="px-1.5 py-0.5 rounded-md bg-secondary text-foreground font-mono text-xs font-semibold" {...props} />
    ) : (
      <code className="text-slate-100 font-mono text-xs md:text-sm" {...props} />
    ),
  hr: ({ node, ...props }: any) => (
    <hr className="my-6 border-border/60" {...props} />
  ),
  img: ({ node, src, alt, ...props }: any) => (
    <div className="my-6 rounded-2xl overflow-hidden border border-border/60 bg-zinc-950/40 shadow-xl max-w-full not-prose">
      <img
        src={src}
        alt={alt || "Ilustração do resumo jurídico"}
        loading="lazy"
        decoding="async"
        className="w-full h-auto object-contain max-h-[520px] mx-auto rounded-xl"
        {...props}
      />
      {alt && (
        <p className="text-center text-xs text-muted-foreground/80 py-2.5 px-3 border-t border-border/30 italic font-body">
          {alt}
        </p>
      )}
    </div>
  ),
};

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
  const [catalogSubtema, setCatalogSubtema] = useState<{
    id: string;
    subtema: string;
    markdown: string;
    audio_url?: string | null;
    imageUrl?: string | null;
    exemplos?: string | null;
    termos?: string | null;
  } | null>(null);

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

    // 1. Sempre priorizar catálogo oficial dos resumos Word / Cloudflare R2
    let ativo = true;
    (async () => {
      try {
        const { getResumosCatalog, findSubtemaInCatalog } = await import("@/services/resumosCatalog");
        const catalog = await getResumosCatalog();
        const found = findSubtemaInCatalog(catalog, resumo.area, resumo.tema, resumo.id || resumo.subtema);
        if (found && found.markdown && ativo) {
          setCatalogSubtema(found);
          if (found.audio_url && !resumo.audio_url) {
            resumo.audio_url = found.audio_url;
          }
          return;
        }
      } catch (err) {
        console.warn("[ResumoReader] Falha ao consultar catálogo:", err);
      }

      // Fallback para Supabase apenas se não encontrado no catálogo
      if (!ativo) return;
      if (!resumo.markdown) {
        supabase
          .from("resumos_juridicos")
          .select("markdown, exemplos, termos")
          .eq("id", resumo.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data && ativo) setBasicData(data);
          });
      } else {
        setBasicData({
          markdown: resumo.markdown,
          exemplos: resumo.exemplos,
          termos: resumo.termos,
        });
      }
    })();

    // Carrega metodologias existentes no Supabase
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

      // Se o método inicial for conceitos e ainda NÃO tiver sido aprofundado e NÃO tiver markdown pronto, gera
      const jaTemMarkdown = Boolean(resumo.markdown || basicData?.markdown || catalogSubtema?.markdown);
      if (targetMetodo === "conceitos" && !existentes.has("conceitos") && !jaTemMarkdown) {
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

  const currentTitle =
    catalogSubtema?.subtema ||
    (resumo?.subtema && resumo.subtema !== resumo.tema ? resumo.subtema : null) ||
    catalogSubtema?.subtema ||
    resumo?.subtema ||
    resumo?.tema ||
    "Resumo Jurídico";

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
              </div>

              <div className="space-y-4 px-4 pt-4 md:px-6 md:pt-6 max-w-4xl mx-auto w-full">
                {audioUrl && (
                  <div className="mb-3">
                    <ResumoAudioPlayer
                      audioUrl={audioUrl}
                      titulo={currentTitle}
                      subtitulo={resumo.area}
                    />
                  </div>
                )}

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
                        {gerando === "conceitos" || (!content && !erroGerar) ? (
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

            {/* Ações flutuantes idênticas ao design system do app */}
            <div 
              className={`pointer-events-none absolute bottom-[calc(1.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] right-4 flex flex-col items-end gap-3 z-20 transition-all duration-300 ${
                isScrolling ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
              }`}
            >
              <AnimatePresence>
                {fontOpen && !isScrolling && (
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
                      className="w-10 h-11 flex items-center justify-center text-foreground hover:bg-secondary active:opacity-70 transition-all"
                    >
                      <Minus className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                    <span className="min-w-[44px] text-center text-[11px] font-bold tabular-nums text-foreground">
                      {fontSize}px
                    </span>
                    <button
                      onClick={incFont}
                      aria-label="Aumentar fonte"
                      className="w-10 h-11 flex items-center justify-center text-foreground hover:bg-secondary active:opacity-70 transition-all"
                    >
                      <Plus className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className={`pointer-events-auto flex flex-col gap-2.5 items-end ${isScrolling ? "pointer-events-none" : ""}`}>
                <button
                  onClick={() => setFontOpen((v) => !v)}
                  aria-label="Tamanho da fonte"
                  aria-expanded={fontOpen}
                  className="w-11 h-11 flex items-center justify-center rounded-full bg-card/95 backdrop-blur-md border border-border shadow-xl text-foreground hover:bg-secondary active:opacity-70 transition-all"
                >
                  <Type className="w-5 h-5" strokeWidth={2.5} />
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
                  aria-label="Baixar em PDF"
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-[#E11D48] text-white shadow-2xl hover:brightness-110 active:opacity-70 transition-all disabled:opacity-60"
                >
                  {salvandoDrive ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <FileDown className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
