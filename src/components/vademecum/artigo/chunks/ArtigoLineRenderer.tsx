import React, { memo } from "react";
import { motion } from "framer-motion";
import {
  stripRedacao,
  isLineRevogado,
  highlightTermos,
  classifyLine,
  applyHighlightsToText,
} from "../artigoTextUtils";
import type { ArtigoLei } from "@/data/mockData";
import {
  MAGIC_COLORS,
  FONT_FAMILY_CLASSES,
  LINE_HEIGHT_CLASSES,
  type ModificationInfo,
  type MagicGrifo,
  type VadeMecumFontFamily,
  type VadeMecumLineHeight,
} from "../artigoConstants";
import type { Highlight } from "@/hooks/useHighlights";

export interface ArtigoLineRendererProps {
  line: string;
  lineIndex: number;
  isFirst: boolean;
  modificationInfo: ModificationInfo | undefined;
  showRedacao: boolean;
  isRevogado: boolean;
  fontSize: number;
  fontFamily?: VadeMecumFontFamily;
  lineHeight?: VadeMecumLineHeight;
  bionicReading?: boolean;
  readingGuide?: boolean;
  highlightMode: boolean;
  focusedSegment: string | null;
  selectedColor: string;
  lineSegmentMap: Record<number, string> | string[] | Map<number, string>;
  artigoNumero: number | string | undefined;
  magicMode: boolean;
  magicHighlights: MagicGrifo[];
  handleRemoveSingleMagicHighlight: (grifo: MagicGrifo) => void;
  setMagicTooltip: React.Dispatch<
    React.SetStateAction<{ grifo: MagicGrifo; rect: DOMRect } | null>
  >;
  narracaoPlaying?: boolean;
  isLineActive?: boolean;
  activeRenderedWordIndex?: number;
  lineWordStartIndex?: number;
  lineHighlights: Highlight[];
  removeHighlight: (id: string) => void;
  handleHoverHighlight: (id: string | null, rect?: DOMRect) => void;
  handleTapHighlight: (id: string, rect: DOMRect) => void;
  setFocusedSegment: (segment: string) => void;
}

// ─── Bionic Reading Engine (Item 01) ───
function renderBionicWord(word: string, key: string): React.ReactNode {
  if (!word || !/[\p{L}\p{N}]/u.test(word)) return word;

  const match = word.match(
    /^([^\p{L}\p{N}]*)([\p{L}\p{N}]+(?:[-–][\p{L}\p{N}]+)*)([^\p{L}\p{N}]*)$/u,
  );
  if (!match) return word;

  const [, leadingPunct, coreWord, trailingPunct] = match;
  const len = coreWord.length;
  if (len <= 1) {
    return (
      <span key={key}>
        {leadingPunct}
        <b className="font-bold text-foreground">{coreWord}</b>
        {trailingPunct}
      </span>
    );
  }

  const fixLen = len <= 3 ? 1 : Math.ceil(len * 0.44);
  const boldPart = coreWord.slice(0, fixLen);
  const restPart = coreWord.slice(fixLen);

  return (
    <span key={key}>
      {leadingPunct}
      <b className="font-bold text-foreground drop-shadow-[0_0_1px_rgba(255,255,255,0.15)]">
        {boldPart}
      </b>
      <span className="opacity-90">{restPart}</span>
      {trailingPunct}
    </span>
  );
}

function processBionicText(text: string, keyPrefix: string): React.ReactNode[] {
  const tokens = text.split(/(\s+)/);
  return tokens.map((token, idx) => {
    if (!token || /^\s+$/.test(token)) return token;
    return renderBionicWord(token, `${keyPrefix}-bw-${idx}`);
  });
}

function applyBionicReading(nodes: React.ReactNode[], keyPrefix: string): React.ReactNode[] {
  return nodes
    .map((node, index) => {
      if (typeof node === "string") {
        const parts = processBionicText(node, `${keyPrefix}-${index}`);
        return parts.length === 1 ? parts[0] : parts;
      }
      if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
        const children = node.props?.children;
        if (typeof children === "string") {
          const parts = processBionicText(children, `${keyPrefix}-${index}`);
          return React.cloneElement(
            node,
            { key: node.key || `${keyPrefix}-${index}` },
            parts.length === 1 ? parts[0] : parts,
          );
        }
        if (Array.isArray(children)) {
          return React.cloneElement(
            node,
            { key: node.key || `${keyPrefix}-${index}` },
            applyBionicReading(children, `${keyPrefix}-${index}`),
          );
        }
      }
      return node;
    })
    .flat();
}

const ArtigoLineRendererComponent = ({
  line,
  lineIndex,
  isFirst,
  modificationInfo,
  showRedacao,
  isRevogado,
  fontSize,
  fontFamily = "sans",
  lineHeight = "1.8",
  bionicReading = false,
  readingGuide = false,
  highlightMode,
  focusedSegment,
  selectedColor,
  lineSegmentMap,
  artigoNumero,
  magicMode,
  magicHighlights,
  handleRemoveSingleMagicHighlight,
  setMagicTooltip,
  narracaoPlaying = false,
  isLineActive = false,
  activeRenderedWordIndex = -1,
  lineWordStartIndex = 0,
  lineHighlights,
  removeHighlight,
  handleHoverHighlight,
  handleTapHighlight,
  setFocusedSegment,
}: ArtigoLineRendererProps) => {
  const classified = classifyLine(line);
  const lineIsRevogado = isLineRevogado(line);

  const leadingClass = LINE_HEIGHT_CLASSES[lineHeight] || "leading-[1.8]";
  const fontClass = FONT_FAMILY_CLASSES[fontFamily] || "font-sans";

  const isModifiedLine = modificationInfo && modificationInfo.linhasModificadas.includes(lineIndex);
  const displayText = modificationInfo
    ? isModifiedLine && showRedacao
      ? line
      : stripRedacao(line)
    : showRedacao
      ? line
      : stripRedacao(line);

  if (lineIsRevogado && !isRevogado) {
    const revogadoDisplay = showRedacao ? line : line;
    return (
      <p
        data-line-index={lineIndex}
        className={`italic ${fontClass} ${leadingClass} ${
          classified.type === "inciso"
            ? "pl-4 border-l-2 border-purple-400/30"
            : classified.type === "alinea"
              ? "pl-8"
              : classified.type === "paragrafo"
                ? "mt-2"
                : ""
        }`}
        style={{ fontSize: `${Math.max(fontSize - 1, 10)}px` }}
      >
        <span className="bg-purple-500/20 text-purple-300 rounded px-1 py-0.5">
          {revogadoDisplay}
        </span>
      </p>
    );
  }

  let baseNodes: React.ReactNode[];
  let offsetShift = 0;
  if (isFirst && !isRevogado) {
    const cleanedText = displayText.replace(/^Art\s*\.\s*\d+[ºº]?(?:-[A-Z])?\s*[–-]?\s*/i, "");
    offsetShift = displayText.length - cleanedText.length;
    baseNodes = highlightTermos(
      cleanedText,
      modificationInfo ? !!isModifiedLine && showRedacao : showRedacao,
    );
  } else {
    baseNodes = highlightTermos(
      displayText,
      modificationInfo ? !!isModifiedLine && showRedacao : showRedacao,
    );
  }

  const adjustedHighlights =
    offsetShift > 0
      ? lineHighlights
          .map((h) => ({
            ...h,
            startOffset: Math.max(0, h.startOffset - offsetShift),
            endOffset: h.endOffset - offsetShift,
          }))
          .filter((h) => h.endOffset > 0 && h.endOffset > h.startOffset)
      : lineHighlights;

  let finalNodes = applyHighlightsToText(
    baseNodes,
    adjustedHighlights,
    removeHighlight,
    highlightMode,
    handleHoverHighlight,
    handleTapHighlight,
  );

  if (magicMode && magicHighlights.length > 0) {
    const extractText = (nodes: React.ReactNode[]): string => {
      return nodes
        .map((n) => {
          if (typeof n === "string") return n;
          if (React.isValidElement<{ children?: React.ReactNode }>(n)) {
            const children = n.props?.children;
            if (typeof children === "string") return children;
            if (Array.isArray(children)) return extractText(children);
          }
          return "";
        })
        .join("");
    };

    const fullLineText = extractText(finalNodes);

    const magicMatches: { start: number; end: number; grifo: (typeof magicHighlights)[0] }[] = [];
    for (const grifo of magicHighlights) {
      const idx = fullLineText.indexOf(grifo.trechoExato);
      if (idx !== -1) {
        magicMatches.push({ start: idx, end: idx + grifo.trechoExato.length, grifo });
      }
    }

    if (magicMatches.length > 0) {
      magicMatches.sort((a, b) => a.start - b.start);
      const filtered: typeof magicMatches = [];
      for (const m of magicMatches) {
        if (filtered.length === 0 || m.start >= filtered[filtered.length - 1].end) {
          filtered.push(m);
        }
      }

      let charPos = 0;

      const wrapWithMagic = (
        text: string,
        offsetInLine: number,
        nodeKey: string,
      ): React.ReactNode[] => {
        const parts: React.ReactNode[] = [];
        let localPos = 0;
        for (const m of filtered) {
          const relStart = m.start - offsetInLine;
          const relEnd = m.end - offsetInLine;
          if (relEnd <= 0 || relStart >= text.length) continue;
          const clampStart = Math.max(0, relStart);
          const clampEnd = Math.min(text.length, relEnd);
          if (clampStart > localPos) parts.push(text.slice(localPos, clampStart));
          parts.push(
            <mark
              key={`magic-${nodeKey}-${m.start}`}
              style={{
                backgroundColor: MAGIC_COLORS[m.grifo.cor] || MAGIC_COLORS.amarelo,
                color: "white",
                borderRadius: "3px",
                padding: "1px 3px",
                cursor: "pointer",
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (highlightMode) {
                  handleRemoveSingleMagicHighlight(m.grifo);
                } else {
                  const targetEl = e.currentTarget as HTMLElement;
                  requestAnimationFrame(() => {
                    if (!targetEl.isConnected) return;
                    const rect = targetEl.getBoundingClientRect();
                    setMagicTooltip((prev) =>
                      prev?.grifo.trechoExato === m.grifo.trechoExato
                        ? null
                        : { grifo: m.grifo, rect },
                    );
                  });
                }
              }}
            >
              {text.slice(clampStart, clampEnd)}
            </mark>,
          );
          localPos = clampEnd;
        }
        if (localPos < text.length) parts.push(text.slice(localPos));
        return parts.length > 0 ? parts : [text];
      };

      const processNode = (node: React.ReactNode, idx: number): React.ReactNode => {
        if (typeof node === "string") {
          const result = wrapWithMagic(node, charPos, `s${idx}`);
          charPos += node.length;
          return result.length === 1 ? result[0] : result;
        }
        if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
          const el = node;
          const children = el.props?.children;
          if (typeof children === "string") {
            const result = wrapWithMagic(children, charPos, `e${idx}`);
            charPos += children.length;
            if (result.length === 1 && typeof result[0] === "string") return node;
            const { children: _, ...restProps } = (el.props || {}) as Record<string, unknown>;
            return React.cloneElement(el, { ...restProps, key: el.key || `mn${idx}` }, result);
          }
          if (Array.isArray(children)) {
            const newChildren = children.map((c: React.ReactNode, ci: number) =>
              processNode(c, idx * 100 + ci),
            );
            const { children: _, ...restProps } = (el.props || {}) as Record<string, unknown>;
            return React.cloneElement(el, { ...restProps, key: el.key || `mn${idx}` }, newChildren);
          }
        }
        return node;
      };

      finalNodes = finalNodes.map((n, i) => processNode(n, i)).flat();
    }
  }

  // Item 01: Aplicação do Motor Bionic Reading nos nós de texto resultantes
  if (bionicReading) {
    finalNodes = applyBionicReading(finalNodes, `bionic-${lineIndex}`);
  }

  if (isRevogado) {
    return (
      <p
        data-line-index={lineIndex}
        className={`${fontClass} ${leadingClass}`}
        style={{ fontSize: `${Math.max(fontSize - 2, 10)}px` }}
      >
        <span className="bg-purple-500/20 text-purple-300 rounded px-1 py-0.5">{line}</span>
      </p>
    );
  }

  const currentSegmentId = lineSegmentMap[lineIndex] || "caput";

  if (classified.type === "epigrafe") {
    return (
      <p
        data-line-index={lineIndex}
        data-segment-id={currentSegmentId}
        onClick={() => {
          if (!highlightMode) setFocusedSegment(currentSegmentId);
        }}
        className={`font-bold text-red-400 tracking-wide pt-3.5 pb-1 select-text ${fontClass} ${
          isLineActive
            ? "bg-primary/20 border-l-4 border-primary rounded-r-xl px-3 -mx-3 py-1.5 ring-1 ring-primary/35 shadow-[0_0_20px_rgba(225,29,72,0.18)] transition-all duration-300"
            : "transition-all duration-300"
        }`}
        style={{ fontSize: `${Math.max(fontSize - 1, 14)}px` }}
      >
        {finalNodes}
      </p>
    );
  }

  const isInciso = classified.type === "inciso";
  const isAlinea = classified.type === "alinea";
  const isParagrafo = classified.type === "paragrafo";

  const extra = isInciso
    ? isLineActive
      ? "ml-0.5 pl-4 pr-3 border-l-4 border-primary"
      : "pl-4 border-l-2 border-primary/30"
    : isAlinea
      ? isLineActive
        ? "ml-3.5 pl-4 pr-3 border-l-4 border-primary"
        : "pl-8"
      : isParagrafo
        ? "mt-2"
        : "";

  const highlightBg = isModifiedLine
    ? "bg-violet-500/20 border-l-3 border-violet-400 pl-3 rounded-r-lg"
    : !modificationInfo &&
        showRedacao &&
        /\((?:Redação|Incluído|Acrescido|Alterado|Revogado|Vetado|Vigência)[^)]*\)/i.test(line)
      ? "bg-primary/5 border-l-2 border-primary/40 pl-2 rounded-r"
      : "";

  const artLabel = (() => {
    const num = String(artigoNumero || "").trim();
    if (/^\d/.test(num)) return `Art. ${num}`;
    return num;
  })();

  // Item 01: Guia Óptico (foco suave na linha ativa e leitura confortável)
  const readingGuideClass = readingGuide
    ? "reading-line-focus hover:bg-amber-400/[0.045] hover:border-l-2 hover:border-amber-400/80 hover:pl-2.5 transition-all duration-150 cursor-pointer rounded-r-md"
    : "";

  // Grifo estrutural contínuo da narração por dispositivo completo (Caput, Parágrafo Único, Inciso, Alínea)
  const activeNarracaoClass = isLineActive
    ? `bg-primary/20 ${isInciso || isAlinea ? "" : "border-l-4 border-primary px-3 -mx-3"} rounded-r-xl py-2 ring-1 ring-primary/35 shadow-[0_0_20px_rgba(225,29,72,0.18)] transition-all duration-300`
    : "transition-all duration-300";

  return (
    <p
      data-line-index={lineIndex}
      data-segment-id={currentSegmentId}
      onClick={() => {
        if (!highlightMode) setFocusedSegment(currentSegmentId);
      }}
      className={`text-foreground ${fontClass} ${leadingClass} ${extra} ${highlightBg} ${readingGuideClass} ${activeNarracaoClass} ${
        !highlightMode && focusedSegment && focusedSegment === currentSegmentId
          ? "rounded-md ring-1 ring-primary/25 bg-primary/3"
          : ""
      }`}
      style={{ fontSize: `${fontSize}px` }}
    >
      {isFirst && !isRevogado && artLabel && (
        <>
          <span className="font-bold text-red-400">{artLabel}</span>
          <span className="text-foreground/60"> — </span>
        </>
      )}
      {finalNodes}
    </p>
  );
};

// Use React.memo for performance optimization
export const ArtigoLineRenderer = memo(ArtigoLineRendererComponent, (prev, next) => {
  // Return true if props are EQUAL (no re-render needed)
  if (
    prev.line !== next.line ||
    prev.lineIndex !== next.lineIndex ||
    prev.isFirst !== next.isFirst ||
    prev.showRedacao !== next.showRedacao ||
    prev.isRevogado !== next.isRevogado ||
    prev.fontSize !== next.fontSize ||
    prev.fontFamily !== next.fontFamily ||
    prev.lineHeight !== next.lineHeight ||
    prev.bionicReading !== next.bionicReading ||
    prev.readingGuide !== next.readingGuide ||
    prev.highlightMode !== next.highlightMode ||
    prev.focusedSegment !== next.focusedSegment ||
    prev.selectedColor !== next.selectedColor ||
    prev.artigoNumero !== next.artigoNumero ||
    prev.magicMode !== next.magicMode ||
    prev.narracaoPlaying !== next.narracaoPlaying ||
    prev.isLineActive !== next.isLineActive
  ) {
    return false;
  }

  if (prev.modificationInfo !== next.modificationInfo) return false;

  // Shallow array comparison for highlights (they are usually referentially stable if unchanged, but just in case)
  if (prev.lineHighlights !== next.lineHighlights) return false;
  if (prev.magicHighlights !== next.magicHighlights) return false;

  // Assume other functions (handlers) are stable via useCallback from the parent
  return true;
});
