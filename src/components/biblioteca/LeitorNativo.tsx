import { useCallback, useEffect, useRef, useState } from 'react';
import { pushLeituraProgress } from '@/lib/leituraProgressSync';
import { Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import OcrProgressOverlay from './OcrProgressOverlay';
import pageTurnAsset from '@/assets/page-turn.mp3.asset.json';
import { useLeitorPrefs } from '@/hooks/useLeitorPrefs';
import { useIsDesktop } from '@/hooks/use-desktop';
import AjustesPanel from './leitor/AjustesPanel';
import PaginaConteudo from './leitor/PaginaConteudo';
import LeitorFolhear, { type LeitorFolhearHandle } from './leitor/LeitorFolhear';
import AssistenteIA from './leitor/AssistenteIA';
import CompartilharFrase from './leitor/CompartilharFrase';
import IntroLivro from './leitor/IntroLivro';
import { srcOf } from '@/lib/assetUrl';
import { useLeitorData, LOCAL_KEY } from '@/hooks/domain/useLeitorData';
import { useLeitorPaginas } from '@/hooks/domain/useLeitorPaginas';
import { useLeitorBookmarks } from '@/hooks/domain/useLeitorBookmarks';

// Chunks modulares extraídos para alta manutenibilidade
import { LeitorHeader } from './leitor/LeitorHeader';
import { LeitorTocRailDesktop } from './leitor/LeitorTocRailDesktop';
import { LeitorFnRailDesktop } from './leitor/LeitorFnRailDesktop';
import { LeitorBottomBarMobile } from './leitor/LeitorBottomBarMobile';
import { LeitorContextBarDesktop } from './leitor/LeitorContextBarDesktop';
import { LeitorRetomarCard } from './leitor/LeitorRetomarCard';
import { LeitorBookmarksSheet } from './leitor/LeitorBookmarksSheet';
import { LeitorTocDrawerMobile } from './leitor/LeitorTocDrawerMobile';

interface Props {
  livroId: string;
  livroTabela: string;
  pdfUrl: string;
  titulo: string;
  onClose: () => void;
  autor?: string | null;
  ano?: string | null;
  editora?: string | null;
  sobre?: string | null;
  curiosidades?: string[] | null;
  capa?: string | null;
}

const LeitorNativo = ({
  livroId,
  livroTabela,
  pdfUrl,
  titulo,
  onClose,
  autor,
  ano,
  editora,
  sobre,
  curiosidades,
  capa,
}: Props) => {
  const {
    status,
    conteudo,
    sumario,
    capitulos,
    erro,
    etapa,
    progresso,
    totalEtapas,
    totalPaginas,
    refinoStatus,
    resumeOcrPage,
  } = useLeitorData(livroTabela, livroId, pdfUrl, titulo, autor, capa);

  const { paginas, tocItems, chapterRanges } = useLeitorPaginas(conteudo, capitulos, sumario);
  const { bookmarks, toggleBookmark, removeBookmark } = useLeitorBookmarks(livroTabela, livroId);

  const [speaking, setSpeaking] = useState(false);
  const [narracoes, setNarracoes] = useState<Map<number, string>>(new Map());
  const audioNarracaoRef = useRef<HTMLAudioElement | null>(null);

  const [showToc, setShowToc] = useState(false);
  const [railExpanded, setRailExpanded] = useState<boolean>(
    () => localStorage.getItem('leitura-nativa:rail-open') !== '0'
  );
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showAjustes, setShowAjustes] = useState(false);
  const [showAssistente, setShowAssistente] = useState(false);
  const [showCompartilhar, setShowCompartilhar] = useState(false);
  const [highlightTerm, setHighlightTerm] = useState<string>('');

  const { prefs, update, tema, fonte, lineHeight } = useLeitorPrefs();
  const alinhamentoEfetivo: 'justify' | 'left' =
    livroTabela === 'biblioteca_estudos' ? 'left' : prefs.alinhamento;
  const dark = tema.isDark;
  const isDesktop = useIsDesktop();
  const DESKTOP_FN_RAIL = 76;
  const [modoFoco, setModoFoco] = useState(false);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [direction, setDirection] = useState<number>(0);
  const [resumeDismissed, setResumeDismissed] = useState<boolean>(false);
  const [introDismissed, setIntroDismissed] = useState<boolean>(false);

  // Persiste posição por ocrPage
  useEffect(() => {
    if (status !== 'pronto') return;
    const p = paginas[currentIndex];
    if (!p) return;
    const key = LOCAL_KEY(livroTabela, livroId);
    const prev = (() => {
      try {
        return JSON.parse(localStorage.getItem(key) || '{}');
      } catch {
        return {};
      }
    })();
    localStorage.setItem(
      key,
      JSON.stringify({
        ...prev,
        ocrPage: p.ocrPage,
        index: currentIndex,
        total: paginas.length,
        totalOcr: totalPaginas ?? prev.totalOcr ?? null,
        updatedAt: Date.now(),
        bookmarks,
        titulo,
        autor: autor ?? prev.autor ?? null,
        capa: capa ?? prev.capa ?? null,
      })
    );
    try {
      window.dispatchEvent(new CustomEvent('biblioteca:tracking', { detail: { key } }));
    } catch {}
    pushLeituraProgress(livroTabela, livroId);
  }, [currentIndex, paginas, status, livroTabela, livroId, bookmarks, totalPaginas, titulo, autor, capa]);

  // Rastreia tempo de leitura
  useEffect(() => {
    if (status !== 'pronto') return;
    const key = LOCAL_KEY(livroTabela, livroId);
    let last = Date.now();
    const tick = () => {
      const now = Date.now();
      const delta = now - last;
      last = now;
      if (document.visibilityState === 'visible' && delta < 30_000) {
        try {
          const prev = JSON.parse(localStorage.getItem(key) || '{}');
          const readTimeMs = Number(prev.readTimeMs || 0) + delta;
          localStorage.setItem(key, JSON.stringify({ ...prev, readTimeMs, updatedAt: now }));
        } catch {}
      }
    };
    const id = window.setInterval(tick, 15_000);
    const onVis = () => {
      last = Date.now();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
      tick();
      pushLeituraProgress(livroTabela, livroId, 0);
    };
  }, [status, livroTabela, livroId]);

  // Áudio de folhear páginas
  const pageTurnAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayRef = useRef(0);
  const playPageTurn = () => {
    const now = Date.now();
    if (now - lastPlayRef.current < 180) return;
    lastPlayRef.current = now;
    try {
      if (!pageTurnAudioRef.current) {
        const a = new Audio(srcOf(pageTurnAsset));
        a.preload = 'auto';
        a.volume = 0.55;
        pageTurnAudioRef.current = a;
      }
      const audio = pageTurnAudioRef.current;
      audio.currentTime = 0;
      void audio.play().catch(() => {});
    } catch {}
  };

  const flipRef = useRef<LeitorFolhearHandle>(null);
  const isCurlMode = prefs.pageMode === 'curl';

  const goTo = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= paginas.length) return;
      setDirection(idx > currentIndex ? 1 : -1);
      if (isCurlMode) {
        flipRef.current?.flip(idx);
      } else {
        setCurrentIndex(idx);
      }
      playPageTurn();
    },
    [currentIndex, paginas.length, isCurlMode]
  );

  const next = useCallback(() => {
    if (isCurlMode) {
      flipRef.current?.flipNext();
      playPageTurn();
    } else {
      goTo(currentIndex + 1);
    }
  }, [goTo, currentIndex, isCurlMode]);

  const prev = useCallback(() => {
    if (isCurlMode) {
      flipRef.current?.flipPrev();
      playPageTurn();
    } else {
      goTo(currentIndex - 1);
    }
  }, [goTo, currentIndex, isCurlMode]);

  const jumpToChapter = (chapterIdx: number) => {
    const idx = paginas.findIndex((p) => p.chapterIdx === chapterIdx && p.kind === 'cover');
    if (idx >= 0) goTo(idx);
    else {
      const alt = paginas.findIndex((p) => p.chapterIdx === chapterIdx);
      if (alt >= 0) goTo(alt);
    }
    setShowToc(false);
  };

  const jumpToOcrPage = (ocrPage: number) => {
    let bestIdx = -1;
    let bestDiff = Infinity;
    paginas.forEach((p, i) => {
      const d = Math.abs(p.ocrPage - ocrPage);
      if (d < bestDiff) {
        bestDiff = d;
        bestIdx = i;
      }
    });
    if (bestIdx >= 0) goTo(bestIdx);
    setShowToc(false);
  };

  const currentPage = paginas[currentIndex];

  // Narração em áudio gerado
  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data } = await supabase
        .from('narracao_livro_paginas')
        .select('pagina_label, audio_url, status')
        .eq('livro_tabela', livroTabela)
        .eq('livro_id', String(livroId));
      if (cancel || !data) return;
      const mapa = new Map<number, string>();
      for (const n of data as any[]) {
        const num = Number(String(n.pagina_label || '').match(/(\d+)/)?.[1]);
        if (Number.isFinite(num) && n.audio_url) mapa.set(num, n.audio_url as string);
      }
      setNarracoes(mapa);
    })();
    return () => {
      cancel = true;
    };
  }, [livroTabela, livroId]);

  const audioPaginaAtual = currentPage ? narracoes.get(currentPage.ocrPage) || null : null;

  const pararNarracao = useCallback(() => {
    const a = audioNarracaoRef.current;
    if (a) {
      a.pause();
      a.currentTime = 0;
    }
    audioNarracaoRef.current = null;
    setSpeaking(false);
  }, []);

  const toggleNarracao = useCallback(() => {
    if (speaking) {
      pararNarracao();
      return;
    }
    if (!audioPaginaAtual) {
      toast.info('Em breve', { description: 'A narração desta página ainda está sendo produzida.' });
      return;
    }
    const a = new Audio(audioPaginaAtual);
    audioNarracaoRef.current = a;
    a.onended = () => {
      audioNarracaoRef.current = null;
      setSpeaking(false);
    };
    a.onerror = () => {
      audioNarracaoRef.current = null;
      setSpeaking(false);
      toast.error('Não foi possível tocar a narração.');
    };
    setSpeaking(true);
    a.play().catch(() => {
      setSpeaking(false);
      toast.error('Não foi possível tocar a narração.');
    });
  }, [speaking, audioPaginaAtual, pararNarracao]);

  useEffect(() => {
    pararNarracao();
  }, [currentIndex, pararNarracao]);

  const isCurrentBookmarked = !!(
    currentPage && bookmarks.find((b) => b.ocrPage === currentPage.ocrPage)
  );

  const toggleCurrentBookmark = () => {
    if (!currentPage) return;
    toggleBookmark(currentPage.ocrPage, currentPage.chapterTitulo);
  };

  // Teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') next();
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') prev();
      else if (e.key === ' ') {
        e.preventDefault();
        if (e.shiftKey) prev();
        else next();
      } else if (e.key === 't' || e.key === 'T') {
        setRailExpanded((prev) => {
          const nextOpen = !prev;
          localStorage.setItem('leitura-nativa:rail-open', nextOpen ? '1' : '0');
          return nextOpen;
        });
      } else if (e.key === 'a' || e.key === 'A') {
        setShowAjustes((v) => !v);
      } else if (e.key === 'f' || e.key === 'F') {
        setModoFoco((v) => !v);
      } else if (e.key === 'Escape') {
        if (modoFoco) setModoFoco(false);
        else if (showToc) setShowToc(false);
        else if (showBookmarks) setShowBookmarks(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, showToc, showBookmarks, modoFoco]);

  // Destaque da busca
  useEffect(() => {
    const article = document.querySelector<HTMLElement>('[data-reader-article]');
    if (!article) return;
    article.querySelectorAll('mark[data-search]').forEach((m) => {
      const parent = m.parentNode;
      if (parent) {
        while (m.firstChild) parent.insertBefore(m.firstChild, m);
        parent.removeChild(m);
        parent.normalize();
      }
    });
    const term = highlightTerm.trim();
    if (term.length < 3) return;
    const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    let n: Node | null = walker.nextNode();
    while (n) {
      if (n.nodeValue && re.test(n.nodeValue)) nodes.push(n as Text);
      re.lastIndex = 0;
      n = walker.nextNode();
    }
    let firstMark: HTMLElement | null = null;
    for (const textNode of nodes) {
      const frag = document.createDocumentFragment();
      const raw = textNode.nodeValue || '';
      let last = 0;
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(raw)) !== null) {
        if (m.index > last) frag.appendChild(document.createTextNode(raw.slice(last, m.index)));
        const mark = document.createElement('mark');
        mark.setAttribute('data-search', '1');
        mark.style.background = 'hsl(var(--primary) / 0.4)';
        mark.style.color = 'inherit';
        mark.style.padding = '0 2px';
        mark.style.borderRadius = '3px';
        mark.textContent = m[0];
        if (!firstMark) firstMark = mark;
        frag.appendChild(mark);
        last = m.index + m[0].length;
      }
      if (last < raw.length) frag.appendChild(document.createTextNode(raw.slice(last)));
      textNode.parentNode?.replaceChild(frag, textNode);
    }
    if (firstMark) {
      firstMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightTerm, currentIndex, status]);

  const fontSize = prefs.fontSize;
  const menuOpen = showToc || showBookmarks || showAjustes;

  const headerSub =
    status === 'pronto' && currentPage
      ? `${currentPage.chapterTitulo} · pág. ${currentPage.ocrPage}`
      : refinoStatus === 'processando'
      ? 'IA refinando o texto…'
      : null;

  const focoOn = isDesktop && modoFoco && status === 'pronto';
  const tocRailW = focoOn ? 0 : tocItems.length > 0 ? (railExpanded ? 300 : 56) : 0;
  const fnRailW = focoOn ? 0 : DESKTOP_FN_RAIL;

  const reader = (
    <div
      className="fixed inset-0 z-[1300] h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col"
      style={{ background: tema.bg, color: tema.text }}
    >
      {/* ── HEADER CHUNK ── */}
      <LeitorHeader
        titulo={titulo}
        headerSub={headerSub}
        onClose={onClose}
        onShare={() => setShowCompartilhar(true)}
        isDesktop={isDesktop}
        focoOn={focoOn}
        dark={dark}
        status={status}
        tocRailW={tocRailW}
        fnRailW={fnRailW}
        tema={tema}
      />

      {/* ── SUMÁRIO LATERAL DESKTOP CHUNK ── */}
      {status === 'pronto' && tocItems.length > 0 && !focoOn && (
        <LeitorTocRailDesktop
          tocItems={tocItems}
          currentPage={currentPage}
          capitulos={capitulos}
          chapterRanges={chapterRanges}
          railExpanded={railExpanded}
          setRailExpanded={setRailExpanded}
          jumpToChapter={jumpToChapter}
          jumpToOcrPage={jumpToOcrPage}
          tema={tema}
          dark={dark}
        />
      )}

      {/* ── RAIL DE FUNÇÕES DESKTOP CHUNK ── */}
      {isDesktop && status === 'pronto' && currentPage && !focoOn && (
        <LeitorFnRailDesktop
          currentIndex={currentIndex}
          paginasLength={paginas.length}
          currentPage={currentPage}
          prev={prev}
          next={next}
          onOpenAjustes={() => setShowAjustes(true)}
          onOpenBookmarks={() => setShowBookmarks(true)}
          onOpenAssistente={() => setShowAssistente(true)}
          onOpenCompartilhar={() => setShowCompartilhar(true)}
          toggleNarracao={toggleNarracao}
          speaking={speaking}
          audioPaginaAtual={audioPaginaAtual}
          isCurrentBookmarked={isCurrentBookmarked}
          bookmarksCount={bookmarks.length}
          tema={tema}
          dark={dark}
          width={DESKTOP_FN_RAIL}
        />
      )}

      {/* ── ÁREA DE LEITURA DAS PÁGINAS ── */}
      <div
        className="flex-1 min-h-0 relative overflow-hidden transition-[margin] duration-300 ease-out"
        style={{
          marginLeft: isDesktop && status === 'pronto' ? tocRailW + 32 : 0,
          marginRight: isDesktop && status === 'pronto' ? fnRailW + 32 : 0,
        }}
      >
        {status === 'processando' && (
          <OcrProgressOverlay
            etapa={etapa}
            progresso={progresso}
            total={totalEtapas}
            totalPaginas={totalPaginas}
            titulo={titulo}
          />
        )}
        {status === 'pendente' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-8 h-8 rounded-full border-2 border-current border-t-transparent animate-spin opacity-30" />
          </div>
        )}
        {status === 'erro' && (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
            <p className="text-sm font-semibold">Não foi possível preparar a leitura.</p>
            <p className="text-xs opacity-60 max-w-md">{erro}</p>
          </div>
        )}
        {status === 'pronto' && currentPage && (
          <>
            <div
              className="absolute inset-0"
              style={{
                filter: prefs.brilho !== 1 ? `brightness(${prefs.brilho})` : undefined,
              }}
            >
              {isCurlMode ? (
                <LeitorFolhear
                  ref={flipRef}
                  paginas={paginas.map((p) => ({
                    index: p.index,
                    ocrPage: p.ocrPage,
                    chapterTitulo: p.chapterTitulo,
                    md: p.md,
                    cover: p.cover,
                  }))}
                  currentIndex={currentIndex}
                  onChangeIndex={(idx) => {
                    setDirection(idx > currentIndex ? 1 : -1);
                    setCurrentIndex(idx);
                  }}
                  tema={tema}
                  fonte={fonte}
                  fontSize={fontSize}
                  lineHeight={lineHeight}
                  alinhamento={alinhamentoEfetivo}
                />
              ) : (
                <AnimatePresence mode="wait" custom={direction} initial={false}>
                  <motion.div
                    key={currentPage.index}
                    ref={(el) => {
                      if (el) el.scrollTop = 0;
                    }}
                    custom={direction}
                    initial={
                      prefs.pageMode === 'fade'
                        ? { opacity: 0 }
                        : prefs.pageMode === 'scroll'
                        ? { opacity: 1 }
                        : { x: direction >= 0 ? '100%' : '-100%', opacity: 0.5 }
                    }
                    animate={
                      prefs.pageMode === 'fade'
                        ? { opacity: 1 }
                        : prefs.pageMode === 'scroll'
                        ? { opacity: 1 }
                        : { x: 0, opacity: 1 }
                    }
                    exit={
                      prefs.pageMode === 'fade'
                        ? { opacity: 0 }
                        : prefs.pageMode === 'scroll'
                        ? { opacity: 1 }
                        : { x: direction >= 0 ? '-40%' : '40%', opacity: 0 }
                    }
                    transition={{
                      type: 'tween',
                      ease: [0.32, 0.72, 0, 1],
                      duration:
                        prefs.pageMode === 'scroll'
                          ? 0
                          : prefs.pageMode === 'fade'
                          ? 0.28
                          : 0.34,
                    }}
                    drag="x"
                    dragDirectionLock
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.18}
                    dragMomentum={false}
                    onDragEnd={(_, info) => {
                      const threshold = 70;
                      if (Math.abs(info.offset.x) < Math.abs(info.offset.y)) return;
                      if (info.offset.x < -threshold || info.velocity.x < -400) next();
                      else if (info.offset.x > threshold || info.velocity.x > 400) prev();
                    }}
                    onPointerDown={(e) => {
                      (e.currentTarget as any)._tap = {
                        x: e.clientX,
                        y: e.clientY,
                        t: Date.now(),
                      };
                    }}
                    onPointerUp={(e) => {
                      const start = (e.currentTarget as any)._tap;
                      if (!start) return;
                      const dx = e.clientX - start.x;
                      const dy = e.clientY - start.y;
                      const dt = Date.now() - start.t;
                      if (dt > 350) return;
                      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) return;
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      const rel = (e.clientX - rect.left) / rect.width;
                      const relY = (e.clientY - rect.top) / rect.height;
                      if (relY > 0.85) return;
                      if (rel < 0.25) prev();
                      else if (rel > 0.75) next();
                    }}
                    style={{
                      touchAction: 'pan-y',
                      willChange: 'transform',
                      background: tema.bg,
                    }}
                    className="absolute inset-0 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
                  >
                    <PaginaConteudo
                      pagina={{
                        index: currentPage.index,
                        ocrPage: currentPage.ocrPage,
                        chapterTitulo: currentPage.chapterTitulo,
                        md: currentPage.md,
                        cover: currentPage.cover,
                      }}
                      tema={tema}
                      fonte={fonte}
                      fontSize={fontSize}
                      lineHeight={lineHeight}
                      alinhamento={alinhamentoEfetivo}
                    />
                  </motion.div>
                </AnimatePresence>
              )}

              {/* Overlay de tonalidade âmbar */}
              {prefs.tonalidade > 0 && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: `rgba(239,68,68, ${prefs.tonalidade})`,
                    mixBlendMode: 'multiply',
                  }}
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* Botão de modo foco — desktop */}
      {isDesktop && status === 'pronto' && currentPage && (
        <button
          onClick={() => setModoFoco((v) => !v)}
          aria-label={focoOn ? 'Sair do modo foco (F)' : 'Modo foco (F)'}
          title={focoOn ? 'Sair do modo foco (F)' : 'Modo foco (F)'}
          className={`hidden md:flex fixed top-4 right-4 z-[1320] w-11 h-11 rounded-full items-center justify-center border backdrop-blur transition active:scale-95 ${
            focoOn ? 'opacity-40 hover:opacity-100' : ''
          }`}
          style={{
            background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            borderColor: tema.border,
            color: tema.text,
          }}
        >
          {focoOn ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      )}

      {/* ── BARRA DE CONTEXTO DESKTOP CHUNK ── */}
      {isDesktop && status === 'pronto' && currentPage && (
        <LeitorContextBarDesktop
          currentPage={currentPage}
          currentIndex={currentIndex}
          paginasLength={paginas.length}
          tocRailW={tocRailW}
          fnRailW={fnRailW}
          tema={tema}
          dark={dark}
        />
      )}

      {/* ── MENU DE RODAPÉ MOBILE CHUNK ── */}
      <AnimatePresence>
        {status === 'pronto' && currentPage && !menuOpen && !isDesktop && (
          <LeitorBottomBarMobile
            currentIndex={currentIndex}
            paginasLength={paginas.length}
            currentPage={currentPage}
            prev={prev}
            next={next}
            onOpenAjustes={() => setShowAjustes(true)}
            onOpenAssistente={() => setShowAssistente(true)}
            onOpenBookmarks={() => setShowBookmarks(true)}
            onOpenToc={() => setShowToc(true)}
            isCurrentBookmarked={isCurrentBookmarked}
            bookmarksCount={bookmarks.length}
            railExpanded={railExpanded}
            tema={tema}
            dark={dark}
          />
        )}
      </AnimatePresence>

      {/* ── CARD RETOMAR LEITURA CHUNK ── */}
      <AnimatePresence>
        {status === 'pronto' &&
          paginas.length > 0 &&
          resumeOcrPage !== null &&
          !resumeDismissed &&
          introDismissed && (
            <LeitorRetomarCard
              paginas={paginas}
              resumeOcrPage={resumeOcrPage}
              onResume={(targetIdx) => {
                setDirection(1);
                setCurrentIndex(targetIdx);
                setResumeDismissed(true);
              }}
              onRestart={() => {
                setDirection(-1);
                setCurrentIndex(0);
                setResumeDismissed(true);
              }}
              onDismiss={() => setResumeDismissed(true)}
              dark={dark}
            />
          )}
      </AnimatePresence>

      {/* ── SUMÁRIO DRAWER MOBILE CHUNK ── */}
      <AnimatePresence>
        <LeitorTocDrawerMobile
          open={showToc}
          onClose={() => setShowToc(false)}
          tocItems={tocItems}
          currentPage={currentPage}
          capitulos={capitulos}
          jumpToChapter={jumpToChapter}
          jumpToOcrPage={jumpToOcrPage}
          dark={dark}
          tema={tema}
        />
      </AnimatePresence>

      {/* ── MARCADORES SHEET CHUNK ── */}
      <AnimatePresence>
        <LeitorBookmarksSheet
          open={showBookmarks}
          onClose={() => setShowBookmarks(false)}
          bookmarks={bookmarks}
          isCurrentBookmarked={isCurrentBookmarked}
          toggleCurrentBookmark={toggleCurrentBookmark}
          jumpToOcrPage={jumpToOcrPage}
          removeBookmark={removeBookmark}
          isDesktop={isDesktop}
          dark={dark}
          tema={tema}
        />
      </AnimatePresence>

      {/* Painel flutuante de Ajustes */}
      <AjustesPanel
        open={showAjustes}
        onClose={() => setShowAjustes(false)}
        prefs={prefs}
        tema={tema}
        update={update}
        paginas={paginas.map((p) => ({
          index: p.index,
          ocrPage: p.ocrPage,
          chapterTitulo: p.chapterTitulo,
          md: p.md,
        }))}
        onJumpPage={(idx) => {
          setDirection(idx > currentIndex ? 1 : -1);
          setCurrentIndex(idx);
        }}
        onHighlight={setHighlightTerm}
      />

      {/* Painel do Assistente de IA */}
      {currentPage && (
        <AssistenteIA
          open={showAssistente}
          onClose={() => setShowAssistente(false)}
          paginaMd={currentPage.md || ''}
          livroTitulo={titulo}
          capituloTitulo={currentPage.chapterTitulo || titulo}
          paginaNum={currentPage.ocrPage}
          livroId={`${livroTabela}:${livroId}`}
          tema={tema}
          fonteFamily={fonte.family}
          lateral={isDesktop}
        />
      )}

      {/* Painel de Compartilhar Frase */}
      {currentPage && (
        <CompartilharFrase
          open={showCompartilhar}
          onClose={() => setShowCompartilhar(false)}
          paginaMd={currentPage.md || ''}
          livroTitulo={titulo}
          autor={autor}
          capa={capa}
          capituloTitulo={currentPage.chapterTitulo || titulo}
          paginaNum={currentPage.ocrPage}
          livroTabela={livroTabela}
          livroId={livroId}
          tema={tema}
          lateral={isDesktop}
        />
      )}

      {/* Introdução do livro */}
      <AnimatePresence>
        {status === 'pronto' && paginas.length > 0 && !introDismissed && (
          <IntroLivro
            titulo={titulo}
            autor={autor}
            ano={ano}
            editora={editora}
            sobre={sobre}
            curiosidades={curiosidades}
            capa={capa}
            totalPaginas={totalPaginas}
            tocItems={tocItems.map((s: any) => {
              const ocrPage =
                typeof s.chapterIdx === 'number' && capitulos.length
                  ? paginas.find((p) => p.chapterIdx === s.chapterIdx)?.ocrPage
                  : s.ocrPage;
              return { titulo: s.titulo, ocrPage, chapterIdx: s.chapterIdx };
            })}
            tema={tema}
            onStart={() => setIntroDismissed(true)}
            onSkip={() => setIntroDismissed(true)}
          />
        )}
      </AnimatePresence>
    </div>
  );

  return typeof document === 'undefined' ? reader : createPortal(reader, document.body);
};

export default LeitorNativo;
