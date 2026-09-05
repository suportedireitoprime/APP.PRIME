import React, { memo } from 'react';
import { motion } from 'framer-motion';
import {
  stripRedacao,
  isLineRevogado,
  highlightTermos,
  classifyLine,
  applyHighlightsToText,
} from '../artigoTextUtils';
import type { ArtigoLei } from '@/data/mockData';
import { MAGIC_COLORS, type ModificationInfo, type MagicGrifo } from '../artigoConstants';
import type { Highlight } from '@/hooks/useHighlights';

export interface ArtigoLineRendererProps {
  line: string;
  lineIndex: number;
  isFirst: boolean;
  modificationInfo: ModificationInfo | undefined;
  showRedacao: boolean;
  isRevogado: boolean;
  fontSize: number;
  highlightMode: boolean;
  focusedSegment: string | null;
  selectedColor: string;
  lineSegmentMap: Record<number, string>;
  artigoNumero: number | string | undefined;
  magicMode: boolean;
  magicHighlights: MagicGrifo[];
  handleRemoveSingleMagicHighlight: (grifo: MagicGrifo) => void;
  setMagicTooltip: React.Dispatch<React.SetStateAction<{ grifo: MagicGrifo; rect: DOMRect } | null>>;
  narracaoPlaying: boolean;
  activeRenderedWordIndex: number;
  lineWordStartIndex: number;
  lineHighlights: Highlight[];
  removeHighlight: (id: string) => void;
  handleHoverHighlight: (id: string | null, rect?: DOMRect) => void;
  handleTapHighlight: (id: string, rect: DOMRect) => void;
  setFocusedSegment: (segment: string) => void;
}

const ArtigoLineRendererComponent = ({
  line,
  lineIndex,
  isFirst,
  modificationInfo,
  showRedacao,
  isRevogado,
  fontSize,
  highlightMode,
  focusedSegment,
  selectedColor,
  lineSegmentMap,
  artigoNumero,
  magicMode,
  magicHighlights,
  handleRemoveSingleMagicHighlight,
  setMagicTooltip,
  narracaoPlaying,
  activeRenderedWordIndex,
  lineWordStartIndex,
  lineHighlights,
  removeHighlight,
  handleHoverHighlight,
  handleTapHighlight,
  setFocusedSegment,
}: ArtigoLineRendererProps) => {
  const classified = classifyLine(line);
  const lineIsRevogado = isLineRevogado(line);

  const isModifiedLine = modificationInfo && modificationInfo.linhasModificadas.includes(lineIndex);
  const displayText = modificationInfo
    ? (isModifiedLine && showRedacao ? line : stripRedacao(line))
    : (showRedacao ? line : stripRedacao(line));

  if (lineIsRevogado && !isRevogado) {
    const revogadoDisplay = showRedacao ? line : line;
    return (
      <p data-line-index={lineIndex} className={`italic leading-[1.8] ${classified.type === 'inciso' ? 'pl-4 border-l-2 border-purple-400/30' : classified.type === 'alinea' ? 'pl-8' : classified.type === 'paragrafo' ? 'mt-2' : ''}`} style={{ fontSize: `${Math.max(fontSize - 1, 10)}px` }}>
        <span className="bg-purple-500/20 text-purple-300 rounded px-1 py-0.5">{revogadoDisplay}</span>
      </p>
    );
  }

  let baseNodes: React.ReactNode[];
  let offsetShift = 0;
  if (isFirst && !isRevogado) {
    const cleanedText = displayText.replace(/^Art\s*\.\s*\d+[ºº]?(?:-[A-Z])?\s*[–-]?\s*/i, '');
    offsetShift = displayText.length - cleanedText.length;
    baseNodes = highlightTermos(cleanedText, modificationInfo ? (!!isModifiedLine && showRedacao) : showRedacao);
  } else {
    baseNodes = highlightTermos(displayText, modificationInfo ? (!!isModifiedLine && showRedacao) : showRedacao);
  }

  const adjustedHighlights = offsetShift > 0
    ? lineHighlights
        .map(h => ({
          ...h,
          startOffset: Math.max(0, h.startOffset - offsetShift),
          endOffset: h.endOffset - offsetShift,
        }))
        .filter(h => h.endOffset > 0 && h.endOffset > h.startOffset)
    : lineHighlights;

  let finalNodes = applyHighlightsToText(baseNodes, adjustedHighlights, removeHighlight, highlightMode, handleHoverHighlight, handleTapHighlight);

  if (magicMode && magicHighlights.length > 0) {
    const extractText = (nodes: React.ReactNode[]): string => {
      return nodes.map(n => {
        if (typeof n === 'string') return n;
        if (n && typeof n === 'object' && 'props' in (n as any)) {
          const props = (n as any).props;
          if (typeof props?.children === 'string') return props.children;
          if (Array.isArray(props?.children)) return extractText(props.children);
        }
        return '';
      }).join('');
    };
    
    const fullLineText = extractText(finalNodes);
    
    const magicMatches: { start: number; end: number; grifo: typeof magicHighlights[0] }[] = [];
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
      
      const wrapWithMagic = (text: string, offsetInLine: number, nodeKey: string): React.ReactNode[] => {
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
              style={{ backgroundColor: MAGIC_COLORS[m.grifo.cor] || MAGIC_COLORS.amarelo, color: 'white', borderRadius: '3px', padding: '1px 3px', cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                if (highlightMode) {
                  handleRemoveSingleMagicHighlight(m.grifo);
                } else {
                  const rect = (e.target as HTMLElement).getBoundingClientRect();
                  setMagicTooltip(prev => prev?.grifo.trechoExato === m.grifo.trechoExato ? null : { grifo: m.grifo, rect });
                }
              }}
            >
              {text.slice(clampStart, clampEnd)}
            </mark>
          );
          localPos = clampEnd;
        }
        if (localPos < text.length) parts.push(text.slice(localPos));
        return parts.length > 0 ? parts : [text];
      };
      
      const processNode = (node: React.ReactNode, idx: number): React.ReactNode => {
        if (typeof node === 'string') {
          const result = wrapWithMagic(node, charPos, `s${idx}`);
          charPos += node.length;
          return result.length === 1 ? result[0] : result;
        }
        if (node && typeof node === 'object' && 'props' in (node as any)) {
          const el = node as React.ReactElement;
          const children = el.props?.children;
          if (typeof children === 'string') {
            const result = wrapWithMagic(children, charPos, `e${idx}`);
            charPos += children.length;
            if (result.length === 1 && typeof result[0] === 'string') return node;
            const { children: _, ...restProps } = el.props;
            return <el.type {...restProps} key={el.key || `mn${idx}`}>{result}</el.type>;
          }
          if (Array.isArray(children)) {
            const newChildren = children.map((c: React.ReactNode, ci: number) => processNode(c, idx * 100 + ci));
            const { children: _, ...restProps } = el.props;
            return <el.type {...restProps} key={el.key || `mn${idx}`}>{newChildren}</el.type>;
          }
        }
        return node;
      };
      
      finalNodes = finalNodes.map((n, i) => processNode(n, i)).flat();
    }
  }

  if (narracaoPlaying && activeRenderedWordIndex >= 0) {
    let wordIndex = lineWordStartIndex || 0;
    const highlightTextNode = (text: string, keyPrefix: string): React.ReactNode[] => {
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      const matches = Array.from(text.matchAll(/[\p{L}\p{N}]+(?:[-–][\p{L}\p{N}]+)*/gu));

      matches.forEach((match, matchIndex) => {
        const start = match.index ?? 0;
        const end = start + match[0].length;
        const currentWordIndex = wordIndex++;
        if (currentWordIndex !== activeRenderedWordIndex) return;

        if (start > lastIndex) parts.push(text.slice(lastIndex, start));
        parts.push(
          <motion.mark
            key={`narracao-${keyPrefix}-${matchIndex}`}
            initial={{ backgroundSize: '0% 108%' }}
            animate={{ backgroundSize: '100% 108%' }}
            transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
            className="rounded-[4px] bg-transparent text-inherit"
            style={{
              backgroundImage: 'linear-gradient(hsl(var(--primary) / 0.62), hsl(var(--primary) / 0.62))',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'left 50%',
              padding: '0 1px',
              boxDecorationBreak: 'clone',
              WebkitBoxDecorationBreak: 'clone',
            }}
          >
            {match[0]}
          </motion.mark>
        );
        lastIndex = end;
      });

      if (lastIndex < text.length) parts.push(text.slice(lastIndex));
      return parts.length ? parts : [text];
    };

    const processNarracaoNode = (node: React.ReactNode, keyPrefix: string): React.ReactNode => {
      if (typeof node === 'string') {
        const parts = highlightTextNode(node, keyPrefix);
        return parts.length === 1 ? parts[0] : parts;
      }
      if (React.isValidElement(node)) {
        const children = (node.props as any)?.children;
        if (typeof children === 'string') {
          const parts = highlightTextNode(children, keyPrefix);
          return React.cloneElement(node as React.ReactElement<any>, { key: node.key || keyPrefix }, parts.length === 1 ? parts[0] : parts);
        }
        if (Array.isArray(children)) {
          return React.cloneElement(
            node as React.ReactElement<any>,
            { key: node.key || keyPrefix },
            children.map((child, index) => processNarracaoNode(child, `${keyPrefix}-${index}`))
          );
        }
      }
      return node;
    };

    finalNodes = finalNodes.map((node, index) => processNarracaoNode(node, `l${lineIndex}-${index}`)).flat();
  }

  if (isRevogado) {
    return (
      <p data-line-index={lineIndex} className="leading-[1.8]" style={{ fontSize: `${Math.max(fontSize - 2, 10)}px` }}>
        <span className="bg-purple-500/20 text-purple-300 rounded px-1 py-0.5">{line}</span>
      </p>
    );
  }

  const extra =
    classified.type === 'inciso' ? 'pl-4 border-l-2 border-primary/30' :
    classified.type === 'alinea' ? 'pl-8' :
    classified.type === 'paragrafo' ? 'mt-2' : '';

  const highlightBg = isModifiedLine
    ? 'bg-violet-500/20 border-l-3 border-violet-400 pl-3 rounded-r-lg'
    : !modificationInfo && showRedacao && /\((?:Redação|Incluído|Acrescido|Alterado|Revogado|Vetado|Vigência)[^)]*\)/i.test(line)
      ? 'bg-primary/5 border-l-2 border-primary/40 pl-2 rounded-r'
      : '';

  const artLabel = (() => {
    const num = String(artigoNumero || '').trim();
    if (/^\d/.test(num)) return `Art. ${num}`;
    return num;
  })();

  const currentSegmentId = lineSegmentMap[lineIndex] || 'caput';

  return (
    <p
      data-line-index={lineIndex}
      data-segment-id={currentSegmentId}
      onClick={() => {
        if (!highlightMode) setFocusedSegment(currentSegmentId);
      }}
      className={`text-foreground leading-[1.8] ${extra} ${highlightBg} ${!highlightMode && focusedSegment && focusedSegment === currentSegmentId ? 'rounded-md ring-1 ring-primary/25' : ''}`}
      style={{ fontSize: `${fontSize}px` }}
    >
      {isFirst && !isRevogado && artLabel && (
        <>
          <span className="font-bold text-primary">{artLabel}</span>
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
    prev.highlightMode !== next.highlightMode ||
    prev.focusedSegment !== next.focusedSegment ||
    prev.selectedColor !== next.selectedColor ||
    prev.artigoNumero !== next.artigoNumero ||
    prev.magicMode !== next.magicMode ||
    prev.narracaoPlaying !== next.narracaoPlaying ||
    prev.activeRenderedWordIndex !== next.activeRenderedWordIndex ||
    prev.lineWordStartIndex !== next.lineWordStartIndex
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
