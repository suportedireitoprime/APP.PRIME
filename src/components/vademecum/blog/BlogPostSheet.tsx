// @ts-nocheck
import React, { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Clock,
  BookOpen,
  Share2,
  ArrowUpRight,
  Heart,
  Type,
  Plus,
  Minus,
  MessageCircle,
  Quote,
  AlertTriangle,
  Lightbulb,
  Scale,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { useNavigate } from "react-router-dom";
import { useIsDesktop } from "@/hooks/use-desktop";
import ShareSheet from "@/components/vademecum/sheets/ShareSheet";
import BlogPostComments from "@/components/vademecum/blog/BlogPostComments";
import type { BlogPost } from "@/data/blogPosts";
import BlogCoverImage from "@/components/BlogCoverImage";
import { blogHero } from "@/lib/blogImg";
import { supabase } from "@/integrations/supabase/client";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { useBodyScrollLock, resetBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { removerEmojis } from "@/lib/textoSemEmoji";
import FloatingCoverIcons from "@/components/blog/FloatingCoverIcons";

interface CalloutInfo {
  type: "warning" | "tip" | "legal";
  title: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  cardBorder: string;
  cardBg: string;
  accentGradient: string;
  icon: React.ReactNode;
  cleanedChildren: React.ReactNode;
}

function parseCallout(children: React.ReactNode): CalloutInfo | null {
  const childArray = React.Children.toArray(children);
  const pIndex = childArray.findIndex(
    (c) =>
      React.isValidElement(c) &&
      (c.type === "p" || (typeof c.type === "string" && c.type.toLowerCase() === "p"))
  );

  if (pIndex === -1) return null;
  const pElem = childArray[pIndex] as React.ReactElement<{ children?: React.ReactNode }>;
  if (!pElem || !pElem.props?.children) return null;

  const pContent = React.Children.toArray(pElem.props.children);
  if (pContent.length === 0) return null;

  const firstNode = pContent[0];
  let prefix = "";

  if (React.isValidElement(firstNode) && (firstNode.type === "strong" || firstNode.type === "b")) {
    const rawStrong = firstNode.props.children;
    prefix = typeof rawStrong === "string" ? rawStrong : Array.isArray(rawStrong) ? rawStrong.join("") : String(rawStrong || "");
  } else if (typeof firstNode === "string") {
    prefix = firstNode;
  }

  const cleanPrefix = prefix.trim().replace(/^[:\s*–—-]+|[:\s*–—-]+$/g, "");

  let type: "warning" | "tip" | "legal" | null = null;
  let title = "";

  if (
    /ponto de aten[çc][ãa]o/i.test(cleanPrefix) ||
    /aten[çc][ãa]o/i.test(cleanPrefix) ||
    /cuidado/i.test(cleanPrefix) ||
    /alerta/i.test(cleanPrefix) ||
    /importante/i.test(cleanPrefix)
  ) {
    type = "warning";
    title = cleanPrefix.toUpperCase().includes("PONTO DE ATENÇÃO")
      ? "PONTO DE ATENÇÃO"
      : cleanPrefix.toUpperCase() || "ATENÇÃO";
  } else if (
    /destaque pr[áa]tico/i.test(cleanPrefix) ||
    /dica/i.test(cleanPrefix) ||
    /exemplo/i.test(cleanPrefix)
  ) {
    type = "tip";
    title = cleanPrefix.toUpperCase().includes("DESTAQUE PRÁTICO")
      ? "DESTAQUE PRÁTICO"
      : cleanPrefix.toUpperCase() || "DESTAQUE PRÁTICO";
  } else if (
    /defini[çc][ãa]o legal/i.test(cleanPrefix) ||
    /legisla[çc][ãa]o/i.test(cleanPrefix) ||
    /artigo/i.test(cleanPrefix) ||
    /jurisprud[êe]ncia/i.test(cleanPrefix)
  ) {
    type = "legal";
    title = cleanPrefix.toUpperCase().includes("DEFINIÇÃO LEGAL")
      ? "DEFINIÇÃO LEGAL"
      : cleanPrefix.toUpperCase() || "DEFINIÇÃO LEGAL";
  }

  if (!type) return null;

  // Limpa o parágrafo inicial removendo o prefixo em negrito e pontuação excedente
  const remainingInP = [...pContent.slice(1)];
  if (remainingInP.length > 0 && typeof remainingInP[0] === "string") {
    remainingInP[0] = (remainingInP[0] as string).replace(/^[\s:–—-]+/, "");
  }

  const newP =
    remainingInP.length > 0
      ? React.cloneElement(pElem, {
          ...pElem.props,
          children: remainingInP,
        })
      : null;

  const updatedChildren = [...childArray];
  if (newP) {
    updatedChildren[pIndex] = newP;
  } else {
    updatedChildren.splice(pIndex, 1);
  }

  if (type === "warning") {
    return {
      type,
      title,
      badgeBg: "bg-rose-500/15 dark:bg-rose-500/20",
      badgeBorder: "border-rose-500/40",
      badgeText: "text-rose-600 dark:text-rose-300",
      cardBorder: "border-rose-500/30",
      cardBg: "bg-gradient-to-br from-rose-500/[0.08] via-rose-500/[0.03] to-card",
      accentGradient: "from-rose-500 to-amber-500",
      icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />,
      cleanedChildren: updatedChildren,
    };
  }

  if (type === "tip") {
    return {
      type,
      title,
      badgeBg: "bg-emerald-500/15 dark:bg-emerald-500/20",
      badgeBorder: "border-emerald-500/40",
      badgeText: "text-emerald-600 dark:text-emerald-300",
      cardBorder: "border-emerald-500/30",
      cardBg: "bg-gradient-to-br from-emerald-500/[0.08] via-emerald-500/[0.03] to-card",
      accentGradient: "from-emerald-500 to-teal-400",
      icon: <Lightbulb className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />,
      cleanedChildren: updatedChildren,
    };
  }

  return {
    type,
    title,
    badgeBg: "bg-blue-500/15 dark:bg-blue-500/20",
    badgeBorder: "border-blue-500/40",
    badgeText: "text-blue-600 dark:text-blue-300",
    cardBorder: "border-blue-500/30",
    cardBg: "bg-gradient-to-br from-blue-500/[0.08] via-blue-500/[0.03] to-card",
    accentGradient: "from-blue-500 to-indigo-500",
    icon: <Scale className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />,
    cleanedChildren: updatedChildren,
  };
}

function sanitizeBlogMarkdown(raw?: string | null): string {
  if (!raw) return "";
  let text = raw.replace(/\\n/g, "\n");

  // Remove pictogramas/emojis brutos
  text = removerEmojis(text);

  // Remove aspas duplicadas ou soltas coladas a blockquotes ou asteriscos (ex: `> ""** Ponto de Atenção:**`)
  text = text.replace(/^(\s*>\s*)["”'“]{1,3}\s*\*\*/gm, "$1**");
  text = text.replace(/^(\s*>\s*)["”'“]{1,3}\s*/gm, "$1");

  // Corrige negrito do CommonMark onde espaços quebram o delimiter run (ex: `** Ponto` -> `**Ponto`)
  text = text.replace(/\*\*\s+([^\n*]+?)\s*\*\*/g, "**$1**");
  text = text.replace(/\*\*\s*([^\n*]+?)\s+\*\*/g, "**$1**");

  // Corrige itálico com espaços indevidos
  text = text.replace(/(^|[^*])\*\s+([^\n*]+?)\s*\*(?!\*)/g, "$1*$2*");

  // Remove aspas soltas no final de linhas de citação (ex: `específicas."`)
  text = text.replace(/^(\s*>[^\n]*?)["”'“]{1,3}\s*$/gm, "$1");

  // Normaliza divisórias
  text = text.replace(/([^\n])\n---/g, "$1\n\n---");
  text = text.replace(/\n---\n([^\n])/g, "\n---\n\n$1");

  // Garante espaço após títulos de markdown: `#Título` -> `# Título`
  text = text.replace(/^(#{1,6})([^\s#])/gm, "$1 $2");

  return text.trim();
}

interface Props {
  post: BlogPost | null;
  onClose: () => void;
  showGoTo?: boolean;
  /** Renderiza inline (para layout lista+detalhe no desktop) — sem portal, sem overlay, sem lock de scroll. */
  inline?: boolean;
}

export default function BlogPostSheet({ post, onClose, showGoTo = false, inline = false }: Props) {
  const mountedAt = useRef(0);
  useEffect(() => {
    if (post) mountedAt.current = Date.now();
  }, [!!post]);

  const handleClose = () => {
    if (Date.now() - mountedAt.current < 400) return;
    resetBodyScrollLock();
    onClose();
  };

  useEscapeKey(!!post && !inline, handleClose);
  const isDesktop = useIsDesktop();
  const navigate = useNavigate();
  const [fontSize, setFontSize] = useState(17);
  const [shareOpen, setShareOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [fontOpen, setFontOpen] = useState(false);
  // O conteúdo completo é carregado sob demanda (a lista vem sem markdown para
  // abrir o Blogger instantaneamente).
  const [conteudo, setConteudo] = useState<string>(post?.conteudo_md || "");
  const sanitizedContent = useMemo(() => sanitizeBlogMarkdown(conteudo), [conteudo]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const incFont = () => setFontSize((s) => Math.min(24, s + 2));
  const decFont = () => setFontSize((s) => Math.max(12, s - 2));

  useEffect(() => {
    if (post && scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [post?.id]);

  // Pré-carregamento imediato e em paralelo de todas as imagens inline do artigo
  useEffect(() => {
    if (!conteudo) return;
    const regex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
    let m;
    while ((m = regex.exec(conteudo)) !== null) {
      if (m[1]) {
        const img = new Image();
        img.decoding = "async";
        img.src = m[1];
      }
    }
    if (post?.imagem_url) {
      const cover = new Image();
      cover.decoding = "async";
      cover.src = post.imagem_url;
    }
  }, [conteudo, post?.imagem_url]);

  useEffect(() => {
    if (!post) return;
    if (post.conteudo_md) {
      setConteudo(post.conteudo_md);
      return;
    }
    let cancelled = false;
    setConteudo("");
    supabase
      .from("blog_edicao_posts")
      .select("conteudo_md")
      .eq("id", post.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data?.conteudo_md) setConteudo(data.conteudo_md as string);
      });
    return () => {
      cancelled = true;
    };
  }, [post?.id, post?.conteudo_md]);

  // Trava scroll do fundo enquanto o painel estiver aberto — usa o lock global
  // (contador compartilhado) para não conflitar com sheets empilhados
  // (comentários, compartilhar), que antes deixavam o body travado ao fechar.
  useBodyScrollLock(!!post && !inline);

  // Registra visualização + carrega estado de curtida do usuário
  useEffect(() => {
    if (!post) return;
    let cancelled = false;
    import("@/lib/appEvents")
      .then(({ appEvents }) => appEvents.abrirBlog({ post_id: post.id, titulo: post.titulo }))
      .catch(() => {});
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      // view (best-effort, sem bloquear UI)
      supabase
        .from("blog_post_views")
        .insert({
          post_id: post.id,
          user_id: user?.id ?? null,
          session_id:
            typeof window !== "undefined"
              ? window.sessionStorage.getItem("sid") ||
                (() => {
                  const s = crypto.randomUUID();
                  window.sessionStorage.setItem("sid", s);
                  return s;
                })()
              : null,
        })
        .then(() => {});
      if (!user) {
        if (!cancelled) setLiked(false);
        return;
      }
      const { data } = await supabase
        .from("blog_post_likes")
        .select("id")
        .eq("post_id", post.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled) setLiked(!!data);
    })();
    return () => {
      cancelled = true;
    };
  }, [post?.id]);

  const toggleLike = async () => {
    if (!post || likeBusy) return;
    setLikeBusy(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLikeBusy(false);
      return;
    }
    const next = !liked;
    setLiked(next); // otimista
    if (next) {
      const { error } = await supabase
        .from("blog_post_likes")
        .insert({ post_id: post.id, user_id: user.id });
      if (error) setLiked(false);
    } else {
      const { error } = await supabase
        .from("blog_post_likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", user.id);
      if (error) setLiked(true);
    }
    setLikeBusy(false);
  };

  const content = (
    <AnimatePresence>
      {post && (
        <>
          {!inline && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, pointerEvents: "none" }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 bg-black/80"
              onClick={handleClose}
            />
          )}
          <motion.div
            key={inline ? post.id : "sheet"}
            role={inline ? "region" : "dialog"}
            aria-label={post ? `Artigo: ${post.titulo}` : "Detalhes do artigo"}
            aria-modal={!inline}
            initial={inline ? { opacity: 0, y: 8 } : { y: "100%" }}
            animate={inline ? { opacity: 1, y: 0 } : { y: 0 }}
            exit={inline ? { opacity: 0, y: 8 } : { y: "100%", pointerEvents: "none" }}
            transition={
              inline
                ? { duration: 0.22, ease: "easeOut" }
                : { type: "spring", damping: 30, stiffness: 340 }
            }
            className={
              inline
                ? "relative h-full w-full bg-card border border-border rounded-2xl flex flex-col overflow-hidden shadow-xl"
                : isDesktop
                  ? "fixed z-50 inset-x-0 mx-auto top-[4vh] bottom-0 bg-card border border-b-0 border-border rounded-t-2xl flex flex-col w-[1080px] max-w-[94vw] shadow-2xl overflow-hidden 2xl:w-[1200px]"
                  : "fixed inset-x-0 bottom-0 z-50 h-[90vh] bg-card rounded-t-3xl flex flex-col overflow-hidden shadow-2xl mx-auto max-w-3xl pb-[var(--sai-bottom,0px)]"
            }
          >
            <div ref={scrollRef} className="flex-1 overflow-y-auto pb-8 relative">
              <div
                className={`relative w-full overflow-hidden ${
                  isDesktop
                    ? "aspect-[21/9] max-h-[46vh] min-h-[260px]"
                    : "aspect-[16/10] max-h-[420px] min-h-[240px]"
                }`}
              >
                <BlogCoverImage
                  postId={post.id}
                  remoteUrl={blogHero(post.imagem_url)}
                  alt={post.titulo}
                  className="absolute inset-0 h-full w-full object-cover object-top bg-black"
                  decoding="async"
                  fetchpriority="high"
                />

                <FloatingCoverIcons seed={post.id.length + (post.titulo?.length || 0)} count={7} />

                <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card/80 to-transparent" />
                <button
                  onClick={handleClose}
                  aria-label="Fechar"
                  className="absolute top-4 left-4 w-11 h-11 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-lg hover:bg-white/30 active:opacity-70 transition-all"
                >
                  <ChevronDown className="w-5 h-5" strokeWidth={2.5} />
                </button>

                <button
                  onClick={toggleLike}
                  aria-label={liked ? "Descurtir" : "Curtir"}
                  aria-pressed={liked}
                  className={`absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-full shadow-lg active:opacity-70 transition-all z-10 ${
                    liked
                      ? "bg-rose-500 text-white"
                      : "bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} strokeWidth={2.5} />
                </button>
              </div>

              {/* Barra de ações sticky — fica fixa no topo ao rolar, começando logo abaixo da capa */}
              <div className="sticky top-2 z-20 pointer-events-none flex flex-row-reverse items-center gap-2 px-3 -mt-6 mb-2">
                <button
                  onClick={() => setShareOpen(true)}
                  aria-label="Compartilhar"
                  className="pointer-events-auto w-11 h-11 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl hover:brightness-110 active:opacity-70 transition-all"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCommentsOpen(true)}
                  aria-label="Comentar"
                  className="pointer-events-auto w-11 h-11 flex items-center justify-center rounded-full bg-card/95 backdrop-blur-md border border-border text-foreground shadow-xl hover:bg-secondary active:opacity-70 transition-all"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
                <div className="pointer-events-auto flex flex-row items-center bg-card/95 backdrop-blur-md border border-border rounded-full shadow-xl overflow-hidden">
                  <AnimatePresence initial={false}>
                    {fontOpen && (
                      <motion.div
                        key="font-controls"
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: "auto", opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="flex items-center overflow-hidden"
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
                        <div className="w-px h-5 bg-border" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <button
                    onClick={() => setFontOpen((v) => !v)}
                    aria-label="Ajustar tamanho do texto"
                    aria-expanded={fontOpen}
                    className="w-11 h-11 flex items-center justify-center text-foreground hover:bg-secondary active:opacity-70 transition-all"
                  >
                    <Type className="w-5 h-5" strokeWidth={2.5} />
                  </button>
                </div>
                {showGoTo && (
                  <button
                    onClick={() => {
                      onClose();
                      navigate("/blog", { state: { postId: post.id } });
                    }}
                    aria-label="Ir para o Blog"
                    className="pointer-events-auto inline-flex items-center gap-1.5 h-11 px-4 rounded-full bg-card/95 backdrop-blur-md border border-border text-foreground text-xs font-semibold shadow-xl hover:bg-secondary active:opacity-70 transition-all"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    Ir para
                  </button>
                )}
              </div>

              <div className="space-y-4 px-5 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary text-primary-foreground uppercase tracking-wide">
                    <BookOpen className="w-3 h-3" />
                    Blog
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-primary/15 text-primary text-[10px] font-bold">
                    {post.tema}
                  </span>
                </div>
                <h2 className="font-display text-2xl md:text-3xl text-foreground leading-[1.15] font-bold tracking-tight">
                  {post.titulo}
                </h2>
                <p className="text-muted-foreground text-xs font-body flex items-center gap-3">
                  <span>{post.autor}</span>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {post.tempo_leitura_min} min de leitura
                  </span>
                </p>

                <article
                  style={{ fontSize: `${fontSize}px` }}
                  className="
                    prose prose-sm md:prose-base max-w-none dark:prose-invert font-body
                    prose-headings:font-display prose-headings:text-foreground prose-headings:mt-6 prose-headings:mb-3
                    prose-h2:text-xl prose-h3:text-lg
                    prose-p:text-foreground/90 prose-p:leading-[1.75] prose-p:my-4
                    prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-foreground
                    prose-blockquote:quotes-none
                    prose-p:before:content-none prose-p:after:content-none
                    prose-blockquote:before:content-none prose-blockquote:after:content-none
                    prose-q:before:content-none prose-q:after:content-none
                    prose-ul:my-4 prose-li:my-1
                  "
                >
                  {sanitizedContent ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkBreaks]}
                      components={{
                        table: ({ node, ...props }) => (
                          <div className="my-6 w-full overflow-x-auto rounded-2xl border border-primary/20 bg-card/70 shadow-lg backdrop-blur-md">
                            <table
                              className="w-full text-left text-xs md:text-sm border-collapse"
                              {...props}
                            />
                          </div>
                        ),
                        thead: ({ node, ...props }) => (
                          <thead
                            className="bg-primary/15 text-primary font-display font-bold border-b border-primary/20 uppercase tracking-wider text-[11px]"
                            {...props}
                          />
                        ),
                        th: ({ node, ...props }) => (
                          <th className="px-4 py-3 text-left font-bold" {...props} />
                        ),
                        td: ({ node, ...props }) => (
                          <td
                            className="px-4 py-3 border-b border-border/30 text-foreground/90 font-body leading-relaxed"
                            {...props}
                          />
                        ),
                        blockquote: ({ node, children, ...props }) => {
                          const callout = parseCallout(children);

                          if (callout) {
                            return (
                              <div
                                className={`my-6 rounded-2xl border ${callout.cardBorder} ${callout.cardBg} p-4 sm:p-5 shadow-md text-foreground/95 relative overflow-hidden not-italic`}
                              >
                                <div
                                  className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${callout.accentGradient}`}
                                />
                                <div className="flex items-center gap-2 mb-2.5">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border shadow-sm ${callout.badgeBg} ${callout.badgeBorder} ${callout.badgeText}`}
                                  >
                                    {callout.icon}
                                    {callout.title}
                                  </span>
                                </div>
                                <div className="text-foreground/90 leading-[1.8] text-sm md:text-base font-body">
                                  {callout.cleanedChildren}
                                </div>
                              </div>
                            );
                          }

                          return (
                            <blockquote
                              className="my-6 rounded-2xl border-l-4 border-primary/70 bg-primary/[0.06] p-4 md:p-5 pl-12 shadow-sm text-foreground/95 relative not-italic"
                              {...props}
                            >
                              <Quote
                                className="absolute left-3.5 top-5 h-4 w-4 text-primary/70"
                                aria-hidden="true"
                              />
                              <div className="text-foreground/90 leading-[1.8] italic">
                                {children}
                              </div>
                            </blockquote>
                          );
                        },
                        pre: ({ node, ...props }) => (
                          <pre
                            className="my-6 p-4 md:p-5 rounded-2xl bg-zinc-950/90 border border-border/80 text-slate-100 font-mono text-xs md:text-sm overflow-x-auto shadow-xl leading-relaxed tracking-wide"
                            {...props}
                          />
                        ),
                        code: ({ node, inline, ...props }: any) =>
                          inline ? (
                            <code
                              className="px-1.5 py-0.5 rounded-md bg-secondary text-foreground font-mono text-xs font-semibold"
                              {...props}
                            />
                          ) : (
                            <code
                              className="text-slate-100 font-mono text-xs md:text-sm"
                              {...props}
                            />
                          ),
                        ul: ({ node, ...props }) => (
                          <ul
                            className="my-4 space-y-2.5 list-disc pl-6 text-foreground/90 leading-relaxed marker:text-primary"
                            {...props}
                          />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol
                            className="my-4 space-y-2.5 list-decimal pl-6 text-foreground/90 leading-relaxed marker:text-primary font-medium"
                            {...props}
                          />
                        ),
                        li: ({ node, ...props }) => (
                          <li className="pl-1 text-foreground/90 leading-relaxed" {...props} />
                        ),
                        h2: ({ node, ...props }) => (
                          <h2
                            className="font-display text-xl md:text-2xl text-foreground font-bold tracking-tight mt-8 mb-3.5 border-b border-border/20 pb-2"
                            {...props}
                          />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3
                            className="font-display text-lg md:text-xl text-foreground font-bold tracking-tight mt-6 mb-2 text-primary"
                            {...props}
                          />
                        ),
                        p: ({ node, ...props }) => (
                          <p className="text-foreground/90 leading-[1.8] my-4" {...props} />
                        ),
                        strong: ({ node, ...props }) => (
                          <strong className="font-semibold text-foreground" {...props} />
                        ),
                        hr: ({ node, ...props }) => (
                          <hr className="my-8 border-border/40" {...props} />
                        ),
                        img: ({ node, src, alt, ...props }: any) => (
                          <span className="block my-6">
                            <span className="relative block overflow-hidden rounded-2xl border border-border/60 bg-muted/30 shadow-md min-h-[160px] sm:min-h-[220px]">
                              <img
                                src={src}
                                alt={alt || "Ilustração do artigo"}
                                loading="eager"
                                decoding="async"
                                className="w-full h-auto object-cover max-h-[520px] transition-opacity duration-300"
                                {...props}
                              />
                            </span>
                          </span>
                        ),
                      }}
                    >
                      {sanitizedContent}
                    </ReactMarkdown>
                  ) : (
                    <div className="space-y-3 animate-pulse" aria-label="Carregando artigo">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-3 rounded bg-muted/60"
                          style={{ width: `${90 - (i % 4) * 12}%` }}
                        />
                      ))}
                    </div>
                  )}
                </article>

                <div className="h-24" />
              </div>
            </div>
          </motion.div>

          <ShareSheet
            open={shareOpen}
            onClose={() => setShareOpen(false)}
            title={post.titulo}
            text={post.resumo}
            url={`${window.location.origin}/blog?post=${post.id}`}
          />

          <BlogPostComments
            postId={post.id}
            open={commentsOpen}
            onClose={() => setCommentsOpen(false)}
          />
        </>
      )}
    </AnimatePresence>
  );

  if (typeof document === "undefined") return null;
  if (inline) return content;
  return createPortal(content, document.body);
}
