import { useMemo } from 'react';
import type { ArtigoLei } from '@/data/mockData';
import type { ModificationInfo } from '../artigoConstants';
import {
  stripRedacao,
  normalizeNarracaoToken,
  getWordTokens,
  alinharTimingsComTexto,
  isLineRevogado,
  normalizeLegalLineBreaks,
} from '../artigoTextUtils';
import { buildLineSegmentMap } from '@/lib/artigoSegments';

interface UseArtigoTextProcessingProps {
  artigo: ArtigoLei | null;
  tabelaNome?: string;
  showNomenJuris?: boolean;
  showRedacao: boolean;
  modificationInfo?: ModificationInfo;
  narracaoWordTimings: any[] | null;
  narracaoDuration: number;
  narracaoAudioRef: React.RefObject<HTMLAudioElement | null>;
  activeNarracaoWordIndex: number;
}

export function useArtigoTextProcessing({
  artigo,
  tabelaNome,
  showNomenJuris = false,
  showRedacao,
  modificationInfo,
  narracaoWordTimings,
  narracaoDuration,
  narracaoAudioRef,
  activeNarracaoWordIndex,
}: UseArtigoTextProcessingProps) {
  return useMemo(() => {
    if (!artigo) {
      return {
        nomenJuris: null,
        isRevogado: false,
        displayLines: [],
        renderedLineTexts: [],
        lineSegmentMap: new Map<number, string>(),
        lineWordStartIndexes: [],
        activeRenderedWordIndex: -1,
        timingsAtivos: null,
      };
    }

    const fullText = normalizeLegalLineBreaks(artigo.caput || '');
    const lines = fullText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    let nomenJuris: string | null = null;
    let contentLines = lines;
    const structuralPattern = /^(LIVRO|PARTE|TÍTULO)\s+/i;
    contentLines = contentLines.filter((l) => !structuralPattern.test(l.trim()));

    // Nomen juris apenas para CP e CPM
    const isCodigoPenal = tabelaNome && /^(CP_|CPM_)/i.test(tabelaNome);
    if (isCodigoPenal && showNomenJuris && contentLines.length > 1) {
      const firstLine = contentLines[0].trim();
      const firstLineClean = firstLine.replace(/\s*\([^)]*\)\s*/g, '').trim();
      const isNomen =
        firstLineClean.length > 0 &&
        firstLineClean.length <= 50 &&
        /^[A-ZÁÀÂÃÉÃˆÊÍÃ ÓÔÕÚÇ]/.test(firstLineClean) &&
        !/^(Art\.|§|Parágrafo|[IVXLC]+\s*[-–.]|[a-z]\))/i.test(firstLineClean) &&
        !/[.;:!?]/.test(firstLineClean) &&
        !/\b(não|será|é|foi|são|tem|houver|aplica|considera)\b/i.test(firstLineClean);

      if (isNomen) {
        nomenJuris = firstLine;
        contentLines = contentLines.slice(1);
      }
    }

    const rawContent = contentLines.join('\n');
    const rawLines = rawContent.split('\n').filter((l) => l.trim() !== '');
    const processedLines = rawLines
      .map((l) => {
        if (isLineRevogado(l)) return l;
        return showRedacao ? l : stripRedacao(l);
      })
      .filter((l) => l.trim() !== '');
    const isRevogado = processedLines.length === 0 && rawLines.length > 0;
    const displayLines = isRevogado ? rawLines : processedLines;

    const getRenderedLineText = (line: string, lineIndex: number, isFirst: boolean) => {
      const isModifiedLine =
        modificationInfo && modificationInfo.linhasModificadas.includes(lineIndex);
      const displayText = modificationInfo
        ? isModifiedLine && showRedacao
          ? line
          : stripRedacao(line)
        : showRedacao
        ? line
        : stripRedacao(line);

      if (isFirst && !isRevogado) {
        return displayText.replace(/^Art\s*\.\s*\d+[ºº]?(?:-[A-Z])?\s*[–-]?\s*/i, '');
      }
      return displayText;
    };

    const renderedLineTexts = displayLines.map((line, index) =>
      getRenderedLineText(line, index, index === 0)
    );

    const lineSegmentMap = buildLineSegmentMap(displayLines);

    const lineWordStartIndexes: number[] = [];
    let renderedWordCursor = 0;
    for (const text of renderedLineTexts) {
      lineWordStartIndexes.push(renderedWordCursor);
      renderedWordCursor += getWordTokens(text).length;
    }

    const renderedArticleTokens = renderedLineTexts
      .flatMap(getWordTokens)
      .map(normalizeNarracaoToken)
      .filter(Boolean);

    const duracaoAtual = narracaoDuration || narracaoAudioRef.current?.duration || 0;

    const alignedTimings = (() => {
      if (!narracaoWordTimings?.length || !renderedArticleTokens.length) return null;
      return alinharTimingsComTexto(renderedArticleTokens, narracaoWordTimings as any[], duracaoAtual);
    })();

    const syntheticTimings = (() => {
      if (alignedTimings?.length) return null;
      const dur = duracaoAtual;
      if (!renderedArticleTokens.length || !Number.isFinite(dur) || dur <= 0) return null;

      const pesos = renderedArticleTokens.map((tok) => tok.length + 1);
      const total = pesos.reduce((a, b) => a + b, 0) || 1;
      let acc = 0;
      return renderedArticleTokens.map((word, i) => {
        const start = (acc / total) * dur;
        acc += pesos[i];
        const end = (acc / total) * dur;
        return { word, start, end };
      });
    })();

    const timingsAtivos = alignedTimings ?? syntheticTimings ?? null;
    const startIndexAtivo = timingsAtivos ? 0 : -1;

    const activeRenderedWordIndex =
      startIndexAtivo >= 0 && activeNarracaoWordIndex >= startIndexAtivo
        ? activeNarracaoWordIndex - startIndexAtivo
        : -1;

    return {
      nomenJuris,
      isRevogado,
      displayLines,
      renderedLineTexts,
      lineSegmentMap,
      lineWordStartIndexes,
      activeRenderedWordIndex,
      timingsAtivos,
    };
  }, [
    artigo,
    tabelaNome,
    showNomenJuris,
    showRedacao,
    modificationInfo,
    narracaoWordTimings,
    narracaoDuration,
    narracaoAudioRef,
    activeNarracaoWordIndex,
  ]);
}
