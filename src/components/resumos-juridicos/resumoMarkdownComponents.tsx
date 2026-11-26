import React from "react";
import {
  Quote,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  Info,
} from "lucide-react";

const extractText = (c: any): string => {
  if (typeof c === "string") return c;
  if (Array.isArray(c)) return c.map(extractText).join("");
  if (c?.props?.children) return extractText(c.props.children);
  return "";
};

const ALERT_CONFIG = {
  IMPORTANT: { label: "Importante", icon: AlertCircle, bg: "bg-amber-500/10", border: "border-amber-500/40", text: "text-amber-400" },
  WARNING: { label: "Atenção", icon: AlertTriangle, bg: "bg-rose-500/10", border: "border-rose-500/40", text: "text-rose-400" },
  CAUTION: { label: "Cuidado", icon: AlertTriangle, bg: "bg-rose-500/10", border: "border-rose-500/40", text: "text-rose-400" },
  TIP: { label: "Dica de Fixação", icon: Sparkles, bg: "bg-emerald-500/10", border: "border-emerald-500/40", text: "text-emerald-400" },
  NOTE: { label: "Nota Explicativa", icon: Info, bg: "bg-sky-500/10", border: "border-sky-500/40", text: "text-sky-400" },
} as const;

export const markdownComponents = {
  h1: ({ node: _node, children, ...props }: any) => {
    const cleanHeaderChildren = (ch: any): any => {
      if (typeof ch === "string") return ch.replace(/^\d+[\.\-\s_]+\s*/i, "");
      if (Array.isArray(ch) && ch.length > 0 && typeof ch[0] === "string") {
        return [ch[0].replace(/^\d+[\.\-\s_]+\s*/i, ""), ...ch.slice(1)];
      }
      return ch;
    };
    return (
      <h1
        className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-6 mb-4 border-b border-border/40 pb-3 font-display leading-tight"
        {...props}
      >
        {cleanHeaderChildren(children)}
      </h1>
    );
  },
  h2: ({ node: _node, ...props }: any) => (
    <h2
      className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-8 mb-4 font-display leading-snug border-b-2 border-amber-500/80 dark:border-amber-500 pb-2"
      {...props}
    />
  ),
  h3: ({ node: _node, children, ...props }: any) => (
    <h3
      className="text-base sm:text-lg font-bold tracking-tight text-[#C0563F] dark:text-[#E26D5C] mt-6 mb-2.5 font-display leading-snug"
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ node: _node, ...props }: any) => (
    <h4
      className="text-[15px] sm:text-base font-semibold tracking-tight text-amber-500 dark:text-amber-400 mt-4 mb-2 font-display leading-snug"
      {...props}
    />
  ),
  p: ({ node: _node, children, ...props }: any) => {
    const hasImageChild = Array.isArray(children)
      ? children.some((c: any) => c?.type === "img" || c?.props?.node?.tagName === "img" || c?.props?.src)
      : (children as any)?.type === "img" || (children as any)?.props?.src;

    if (hasImageChild) {
      return <div className="my-3.5 not-prose" {...props}>{children}</div>;
    }

    return (
      <p
        className="resumo-narracao-p my-3.5 text-foreground/90 leading-[1.8] text-[15px] sm:text-[16px]"
        {...props}
      >
        {children}
      </p>
    );
  },
  ul: ({ node: _node, ...props }: any) => (
    <ul className="my-4 space-y-2 pl-0 list-none" {...props} />
  ),
  ol: ({ node: _node, ...props }: any) => (
    <ol className="my-4 space-y-2 pl-4 list-decimal" {...props} />
  ),
  li: ({ node: _node, children, ...props }: any) => {
    const text = extractText(children);

    if (text.includes("⚠")) {
      const cleanChildren = (ch: any): any => {
        if (typeof ch === "string") return ch.replace(/^\s*⚠\s*/, "");
        if (Array.isArray(ch)) return ch.map(cleanChildren);
        if (ch?.props?.children) return { ...ch, props: { ...ch.props, children: cleanChildren(ch.props.children) } };
        return ch;
      };
      return (
        <li className="my-2.5 pl-0 leading-relaxed text-foreground/95 flex items-start gap-2.5 list-none font-normal">
          <span
            className="shrink-0 mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/15 text-amber-500 dark:text-amber-400 text-xs font-bold"
            aria-hidden="true"
          >
            ⚠
          </span>
          <div className="flex-1 text-[15px] sm:text-[16px] leading-relaxed font-normal text-foreground/90">{cleanChildren(children)}</div>
        </li>
      );
    }

    if (text.includes("✓")) {
      const cleanChildren = (ch: any): any => {
        if (typeof ch === "string") return ch.replace(/^\s*✓\s*/, "");
        if (Array.isArray(ch)) return ch.map(cleanChildren);
        if (ch?.props?.children) return { ...ch, props: { ...ch.props, children: cleanChildren(ch.props.children) } };
        return ch;
      };
      return (
        <li className="my-2 pl-0 leading-relaxed text-foreground/95 flex items-start gap-2.5 list-none font-normal">
          <span
            className="shrink-0 mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 text-xs font-bold"
            aria-hidden="true"
          >
            ✓
          </span>
          <div className="flex-1 text-[15px] sm:text-[16px] leading-relaxed font-normal text-foreground/90">{cleanChildren(children)}</div>
        </li>
      );
    }

    return (
      <li className="my-2 pl-0 leading-relaxed text-foreground/90 text-[15px] sm:text-[16px] flex items-start gap-2.5 list-none font-normal" {...props}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80 dark:bg-amber-400 mt-2.5 shrink-0" aria-hidden="true" />
        <div className="flex-1 font-normal text-foreground/90 leading-relaxed">{children}</div>
      </li>
    );
  },
  table: ({ node: _node, ...props }: any) => (
    <div className="my-6 w-full overflow-x-auto rounded-2xl border border-border/80 bg-card/70 shadow-lg backdrop-blur-md not-prose">
      <table className="w-full text-left text-xs sm:text-sm border-collapse" {...props} />
    </div>
  ),
  th: ({ node: _node, ...props }: any) => (
    <th className="bg-[#1B2A4A] text-white px-4 py-3.5 border-b border-white/10 font-display font-bold text-xs sm:text-sm uppercase tracking-wider text-left" {...props} />
  ),
  td: ({ node: _node, ...props }: any) => (
    <td className="px-4 py-3.5 border-b border-border/30 text-foreground/90 font-body leading-relaxed first:font-bold first:text-foreground first:bg-secondary/20 first:w-[35%] sm:first:w-[30%]" {...props} />
  ),
  blockquote: ({ node: _node, children, ...props }: any) => {
    const text = extractText(children);

    const isExemplo = /\[!EXEMPLO\]/i.test(text) || /exemplo\s*pr[aá]tico/i.test(text);
    if (isExemplo) {
      const cleanChildren = (ch: any): any => {
        if (typeof ch === "string") {
          return ch
            .replace(/^\s*\[!(?:EXEMPLO|TIP|NOTE|WARNING|IMPORTANT)\]\s*/gi, "")
            .replace(/^\s*Exemplo\s*pr[aá]tico\s*:?\s*/gi, "")
            .trimStart();
        }
        if (Array.isArray(ch)) {
          return ch.map(cleanChildren).filter((item) => item !== null && item !== undefined && item !== "");
        }
        if (ch?.type === "strong" || ch?.props?.node?.tagName === "strong") {
          const inner = extractText(ch).trim();
          if (/^(?:\[!(?:TIP|NOTE|WARNING|IMPORTANT)\]\s*)?Exemplo\s*pr[aá]tico$/i.test(inner)) {
            return null;
          }
        }
        if (ch?.props?.children) {
          return { ...ch, props: { ...ch.props, children: cleanChildren(ch.props.children) } };
        }
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

    const isCuriosidade =
      /\[!CURIOSIDADE\]/i.test(text) ||
      (/aten[cç][aã]o\s*[—\-–]?\s*curiosidade/i.test(text) && !/exemplo\s*pr[aá]tico/i.test(text)) ||
      /^\s*(?:>|\s)*\[!(?:WARNING|IMPORTANT)\]\s*(?:\*\*)?Atenção/i.test(text);

    if (isCuriosidade) {
      const cleanChildren = (ch: any): any => {
        if (typeof ch === "string") {
          return ch
            .replace(/^\s*\[!(?:CURIOSIDADE|WARNING|IMPORTANT|TIP|NOTE)\]\s*/gi, "")
            .replace(/^\s*Atenção\s*[—\-–]?\s*Curiosidade\s*:?\s*/gi, "")
            .replace(/^\s*Curiosidade:\s*/gi, "")
            .trimStart();
        }
        if (Array.isArray(ch)) {
          return ch.map(cleanChildren).filter((item) => item !== null && item !== undefined && item !== "");
        }
        if (ch?.type === "strong" || ch?.props?.node?.tagName === "strong") {
          const inner = extractText(ch).trim();
          if (/^(?:\[!(?:WARNING|IMPORTANT|TIP|NOTE)\]\s*)?(?:Atenção\s*[—\-–]?\s*Curiosidade|Curiosidade)$/i.test(inner)) {
            return null;
          }
        }
        if (ch?.props?.children) {
          return { ...ch, props: { ...ch.props, children: cleanChildren(ch.props.children) } };
        }
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
      const type = alertMatch[1].toUpperCase() as keyof typeof ALERT_CONFIG;
      const alertConfig = ALERT_CONFIG[type] || { label: "Nota", icon: Info, bg: "bg-sky-500/10", border: "border-sky-500/40", text: "text-sky-400" };
      const Icon = alertConfig.icon;
      const cleanChildren = (ch: any): any => {
        if (typeof ch === "string") return ch.replace(/^\s*\[!(NOTE|IMPORTANT|WARNING|TIP|CAUTION)\]\s*/i, "").trimStart();
        if (Array.isArray(ch)) {
          return ch.map(cleanChildren).filter((item) => item !== null && item !== undefined && item !== "");
        }
        if (ch?.type === "strong" || ch?.props?.node?.tagName === "strong") {
          const inner = extractText(ch).trim().replace(/:$/, "");
          if (/^(?:Importante|Atenção|Cuidado|Dica de Fixação|Dica|Nota Explicativa|Nota)$/i.test(inner)) {
            return null;
          }
        }
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
  pre: ({ node: _node, ...props }: any) => (
    <pre className="my-6 p-4 md:p-5 rounded-2xl bg-zinc-950/90 border border-border/80 text-slate-100 font-mono text-xs md:text-sm overflow-x-auto shadow-xl leading-relaxed tracking-wide" {...props} />
  ),
  code: ({ node: _node, inline, ...props }: any) =>
    inline ? (
      <code className="px-1.5 py-0.5 rounded-md bg-secondary text-foreground font-mono text-xs font-semibold" {...props} />
    ) : (
      <code className="text-slate-100 font-mono text-xs md:text-sm" {...props} />
    ),
  hr: ({ node: _node, ...props }: any) => (
    <hr className="my-6 border-border/60" {...props} />
  ),
  img: ({ node: _node, src, alt, ...props }: any) => (
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
