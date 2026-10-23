import { useEffect, useRef } from "react";
import { haptic } from "@/lib/nativeHaptics";

interface UseResumoParagraphHighlighterParams {
  containerRef: React.RefObject<HTMLElement | null>;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (timeSec: number) => void;
  isScrolling?: boolean;
}

interface ParagraphTiming {
  element: HTMLElement;
  start: number;
  end: number;
}

export function useResumoParagraphHighlighter({
  containerRef,
  currentTime,
  duration,
  isPlaying,
  onSeek,
  isScrolling = false,
}: UseResumoParagraphHighlighterParams) {
  const timingsRef = useRef<ParagraphTiming[]>([]);
  const activeIdxRef = useRef<number>(-1);

  // 1. Mapeia parágrafos e calcula proporções de tempo com base no tamanho do texto
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const elements = Array.from(
      container.querySelectorAll<HTMLElement>(".resumo-narracao-p")
    ).filter((el) => (el.textContent || "").trim().length > 3);

    if (elements.length === 0 || duration <= 0) {
      timingsRef.current = [];
      return;
    }

    const lengths = elements.map((el) => Math.max(10, (el.textContent || "").trim().length));
    const totalChars = lengths.reduce((acc, len) => acc + len, 0);

    let accumulated = 0;
    const timings: ParagraphTiming[] = elements.map((el, idx) => {
      const len = lengths[idx];
      const start = (accumulated / totalChars) * duration;
      accumulated += len;
      const end = (accumulated / totalChars) * duration;

      el.dataset.pStart = start.toFixed(2);
      el.dataset.pEnd = end.toFixed(2);
      el.style.cursor = "pointer";
      el.title = "Toque para ouvir a partir deste parágrafo";

      // Clique no parágrafo busca a posição de áudio correspondente
      el.onclick = (e) => {
        // Se o usuário selecionou texto para copiar, não faz seek
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) return;

        e.stopPropagation();
        haptic.selection();
        onSeek(start);
      };

      return { element: el, start, end };
    });

    timingsRef.current = timings;

    return () => {
      timings.forEach(({ element }) => {
        element.classList.remove("resumo-p-active");
        element.onclick = null;
        element.style.cursor = "";
        element.title = "";
      });
    };
  }, [containerRef, duration, onSeek]);

  // 2. Atualiza o parágrafo ativo em tempo real com latência zero (sem re-renderizar ReactMarkdown)
  useEffect(() => {
    const timings = timingsRef.current;
    if (!timings.length || duration <= 0) return;

    if (!isPlaying) {
      if (activeIdxRef.current !== -1) {
        timings.forEach(({ element }) => element.classList.remove("resumo-p-active"));
        activeIdxRef.current = -1;
      }
      return;
    }

    // Localiza o parágrafo do tempo atual
    let targetIdx = timings.findIndex(
      (p) => currentTime >= p.start && currentTime < p.end
    );

    if (targetIdx === -1 && currentTime >= duration - 1.0) {
      targetIdx = timings.length - 1;
    }

    if (targetIdx !== -1 && targetIdx !== activeIdxRef.current) {
      // Remove do anterior
      if (activeIdxRef.current >= 0 && timings[activeIdxRef.current]) {
        timings[activeIdxRef.current].element.classList.remove("resumo-p-active");
      }

      // Adiciona no novo parágrafo
      const activeEl = timings[targetIdx].element;
      activeEl.classList.add("resumo-p-active");
      activeIdxRef.current = targetIdx;

      // Scroll suave se o usuário não estiver interagindo ativamente com a tela
      if (!isScrolling) {
        const rect = activeEl.getBoundingClientRect();
        const isOffscreen = rect.top < 80 || rect.bottom > window.innerHeight - 100;
        if (isOffscreen) {
          activeEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }
    }
  }, [currentTime, duration, isPlaying, isScrolling]);
}
