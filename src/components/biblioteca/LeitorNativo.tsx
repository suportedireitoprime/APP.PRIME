import { useCallback, useEffect, useRef, useState } from 'react';
import { pushLeituraProgress } from '@/lib/leituraProgressSync';
import {
  ArrowLeft,
  List,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X,
  Sliders,
  WandSparkles,
  Share2,
  Volume2,
  Square,
  Maximize2,
  Minimize2,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import OcrProgressOverlay from './OcrProgressOverlay';
import { getLocalLeituraNativa, cacheLeituraOnDemand } from '@/services/leituraNativaPrefetch';
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
import { useLeitorPaginas, type Pagina } from '@/hooks/domain/useLeitorPaginas';
import { useLeitorBookmarks } from '@/hooks/domain/useLeitorBookmarks';



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

const LeitorNativo = ({ livroId, livroTabela, pdfUrl, titulo, onClose, autor, ano, editora, sobre, curiosidades, capa }: Props) => {
  const { status, conteudo, sumario, capitulos, erro, etapa, progresso, totalEtapas, totalPaginas, refinoStatus, resumeOcrPage } = useLeitorData(livroTabela, livroId, pdfUrl, titulo, autor, capa);
  const { paginas, tocItems, chapterRanges } = useLeitorPaginas(conteudo, capitulos, sumario);
  const { bookmarks, toggleBookmark, removeBookmark } = useLeitorBookmarks(livroTabela, livroId);

  const [speaking, setSpeaking] = useState(false);
  const [narracoes, setNarracoes] = useState<Map<number, string>>(new Map());
  const audioNarracaoRef = useRef<HTMLAudioElement | null>(null);
  
  const [showToc, setShowToc] = useState(false);
  const [railExpanded, setRailExpanded] = useState<boolean>(() => localStorage.getItem('leitura-nativa:rail-open') !== '0');
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showAjustes, setShowAjustes] = useState(false);
  const [showAssistente, setShowAssistente] = useState(false);
  const [showCompartilhar, setShowCompartilhar] = useState(false);
  const [highlightTerm, setHighlightTerm] = useState<string>('');
  const { prefs, update, tema, fonte, lineHeight } = useLeitorPrefs();
  const alinhamentoEfetivo: 'justify' | 'left' = livroTabela === 'biblioteca_estudos' ? 'left' : prefs.alinhamento;
  const dark = tema.isDark;
  const isDesktop = useIsDesktop();
  const DESKTOP_FN_RAIL = 76;
  const [modoFoco, setModoFoco] = useState(false);
  const [tocQuery, setTocQuery] = useState('');
  
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
    try { window.dispatchEvent(new CustomEvent('biblioteca:tracking', { detail: { key } })); } catch {}
    pushLeituraProgress(livroTabela, livroId);
  }, [currentIndex, paginas, status, livroTabela, livroId, bookmarks, totalPaginas]);

  // Rastreia tempo de leitura (apenas com aba visível e reader pronto)
  useEffect(() => {
    if (status !== 'pronto') return;
    const key = LOCAL_KEY(livroTabela, livroId);
    let last = Date.now();
    const raf: number | null = null;
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
    const onVis = () => { last = Date.now(); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
      if (raf) cancelAnimationFrame(raf);
      tick();
      pushLeituraProgress(livroTabela, livroId, 0);
    };
  }, [status, livroTabela, livroId]);

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
        // A StPageFlip cuida da animação — só sincronizamos via onFlip
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
    // Encontra a página cujo ocrPage seja o mais próximo (>=) do alvo
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

  // ============================================================
  // BOOKMARKS
  // ============================================================
  const currentPage = paginas[currentIndex];

  // ============================================================
  // NARRAÇÃO (áudio gerado) — substitui o TTS nativo
  // ============================================================
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
    return () => { cancel = true; };
  }, [livroTabela, livroId]);

  const audioPaginaAtual = currentPage ? narracoes.get(currentPage.ocrPage) || null : null;

  const pararNarracao = useCallback(() => {
    const a = audioNarracaoRef.current;
    if (a) { a.pause(); a.currentTime = 0; }
    audioNarracaoRef.current = null;
    setSpeaking(false);
  }, []);

  const toggleNarracao = useCallback(() => {
    if (speaking) { pararNarracao(); return; }
    if (!audioPaginaAtual) {
      toast.info('Em breve', { description: 'A narração desta página ainda está sendo produzida.' });
      return;
    }
    const a = new Audio(audioPaginaAtual);
    audioNarracaoRef.current = a;
    a.onended = () => { audioNarracaoRef.current = null; setSpeaking(false); };
    a.onerror = () => { audioNarracaoRef.current = null; setSpeaking(false); toast.error('Não foi possível tocar a narração.'); };
    setSpeaking(true);
    a.play().catch(() => { setSpeaking(false); toast.error('Não foi possível tocar a narração.'); });
  }, [speaking, audioPaginaAtual, pararNarracao]);

  // troca de página interrompe o áudio
  useEffect(() => { pararNarracao(); }, [currentIndex, pararNarracao]);
  useEffect(() => () => { pararNarracao(); }, [pararNarracao]);

  const isCurrentBookmarked = !!(
    currentPage && bookmarks.find((b) => b.ocrPage === currentPage.ocrPage)
  );
  const toggleCurrentBookmark = () => {
    if (!currentPage) return;
    toggleBookmark(currentPage.ocrPage, currentPage.chapterTitulo);
  };

  // Teclado (setas e atalhos de desktop)
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


  // Destaque da busca: envolve ocorrências em <mark> percorrendo os nós de texto
  useEffect(() => {
    const article = document.querySelector<HTMLElement>('[data-reader-article]');
    if (!article) return;
    // Remove destaques antigos
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



  // Cores do tema aplicadas inline (5 temas dinâmicos)

  const fontSize = prefs.fontSize;

  const menuOpen = showToc || showBookmarks || showAjustes;


  // Título do capítulo atual para o header
  const headerSub =
    status === 'pronto' && currentPage
      ? `${currentPage.chapterTitulo} · pág. ${currentPage.ocrPage}`
      : refinoStatus === 'processando'
        ? 'IA refinando o texto…'
        : null;

  const focoOn = isDesktop && modoFoco && status === 'pronto';
  const tocRailW = focoOn ? 0 : tocItems.length > 0 ? (railExpanded ? 300 : 56) : 0;
  const fnRailW = focoOn ? 0 : DESKTOP_FN_RAIL;
  const tocFiltrado = tocQuery.trim()
    ? tocItems.filter((s: any) =>
        String(s.titulo || '').toLowerCase().includes(tocQuery.trim().toLowerCase()),
      )
    : tocItems;

  const reader = (
    <div
      className="fixed inset-0 z-[1300] h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col"
      style={{ background: tema.bg, color: tema.text }}
    >

      {/* Header */}
      <header
        className="flex items-center gap-3 px-4 py-3.5 md:py-2 shrink-0 border-b backdrop-blur"
        style={{
          paddingTop: isDesktop
            ? '0.5rem'
            : 'calc(var(--sai-top) + 0.875rem)',

          minHeight: isDesktop
            ? '3.5rem'
            : 'calc(5rem + var(--sai-top))',

          display: focoOn ? 'none' : undefined,
          paddingLeft:
            isDesktop && status === 'pronto' && tocRailW
              ? `calc(${tocRailW}px + 1rem)`
              : undefined,
          paddingRight:
            isDesktop && status === 'pronto' && fnRailW
              ? `calc(${fnRailW}px + 1rem)`
              : undefined,
          background: dark ? 'rgba(0,0,0,0.28)' : `${tema.bg}cc`,
          borderColor: tema.border,
          color: tema.text,
        }}
      >
        <button
          onClick={onClose}
          aria-label="Voltar"
          className="w-12 h-12 md:w-11 md:h-11 rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-transform border"
          style={{
            background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            borderColor: tema.border,
            color: tema.text,
          }}
        >
          <ArrowLeft className="w-[22px] h-[22px]" />
        </button>
        <div className="flex-1 min-w-0 text-center md:text-left">
          <h1 className="font-display text-[15px] md:text-[16px] font-semibold tracking-wide line-clamp-2 leading-tight">
            {titulo}
          </h1>
          {headerSub && (
            <p className="text-[11px] md:text-[12px] font-body opacity-70 line-clamp-1 mt-0.5 leading-tight">{headerSub}</p>
          )}
        </div>
        <div className="w-12 md:w-11 shrink-0 flex items-center justify-center">
          <button
            onClick={() => setShowCompartilhar(true)}
            aria-label="Compartilhar"
            className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform"
            style={{ color: dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)' }}
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </header>


      {/* Sumário lateral (rail recolhido) — tablet/desktop */}
      {status === 'pronto' && tocItems.length > 0 && !focoOn && (

        <aside
          aria-label="Sumário do livro"
          onMouseEnter={() => setRailExpanded(true)}
          onMouseLeave={() => {
            if (localStorage.getItem('leitura-nativa:rail-open') === '0') {
              setRailExpanded(false);
            }
          }}
          className="hidden md:flex md:flex-col fixed left-0 top-0 bottom-0 z-[1305] border-r transition-[width] duration-300 ease-out backdrop-blur-md pt-[3.75rem]"
          style={{ width: railExpanded ? 300 : 56, background: `${tema.bg}f2`, borderColor: tema.border, color: tema.text }}
        >
          <div
            className={`flex items-center gap-2 border-b shrink-0 ${railExpanded ? 'px-3 h-12' : 'px-2 h-12'}`}
            style={{ borderColor: `${tema.text}1a` }}
          >
            <button
              onClick={() => {
                const next = !railExpanded;
                setRailExpanded(next);
                localStorage.setItem('leitura-nativa:rail-open', next ? '1' : '0');
              }}
              className="w-10 h-10 flex items-center justify-center rounded-lg transition shrink-0"
              aria-label={railExpanded ? 'Recolher sumário' : 'Expandir sumário'}
              title={railExpanded ? 'Recolher sumário' : 'Expandir sumário'}
            >
              <List className="w-5 h-5" />
            </button>
            {railExpanded && (
              <div className="flex-1 min-w-0 flex items-baseline gap-2">
                <p className="text-[15px] font-semibold truncate leading-tight">Sumário</p>
                <p className="text-[11px] opacity-55 truncate shrink-0">
                  {tocItems.length} {tocItems.length === 1 ? 'cap.' : 'caps.'}
                </p>
              </div>
            )}
          </div>
          {railExpanded && (
            <div className="px-3 pt-2 pb-1 shrink-0">

              <div
                className="flex items-center gap-2 rounded-lg px-3 h-10 border"
                style={{ borderColor: `${tema.text}1f`, background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
              >
                <Search className="w-4 h-4 opacity-50 shrink-0" />
                <input
                  value={tocQuery}
                  onChange={(e) => setTocQuery(e.target.value)}
                  placeholder="Buscar capítulo…"
                  className="flex-1 bg-transparent outline-none text-sm placeholder:opacity-50"
                  style={{ color: tema.text }}
                />
                {tocQuery && (
                  <button onClick={() => setTocQuery('')} aria-label="Limpar busca" className="opacity-60 hover:opacity-100">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
          <div className={railExpanded ? 'flex-1 overflow-y-auto py-2' : 'flex-1 overflow-y-auto p-2 space-y-1'}>
            {railExpanded && tocFiltrado.length === 0 && (
              <p className="px-4 py-6 text-sm opacity-60">Nenhum capítulo encontrado.</p>
            )}
            {(railExpanded ? tocFiltrado : tocItems).map((s: any, idx) => {
              const active = currentPage && s.chapterIdx === currentPage.chapterIdx;
              const onClick =
                typeof s.chapterIdx === 'number' && capitulos.length
                  ? () => jumpToChapter(s.chapterIdx)
                  : () => jumpToOcrPage(s.ocrPage);
              if (!railExpanded) {
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setRailExpanded(true);
                      localStorage.setItem('leitura-nativa:rail-open', '1');
                      onClick();
                    }}
                    className={`group relative w-10 h-9 mx-auto flex items-center justify-center rounded-md text-[12px] font-semibold tabular-nums transition ${active ? (dark ? 'bg-primary/25 text-primary' : 'bg-primary/15 text-primary') : (dark ? 'text-white/60 hover:bg-white/5 hover:text-white' : 'text-black/60 hover:bg-black/5 hover:text-black')}`}
                    aria-label={`${s.titulo} — pág. ${s.ocrPage ?? ''}`}
                    title={`${s.titulo} — pág. ${s.ocrPage ?? ''}`}
                  >
                    {s.ocrPage ?? idx + 1}
                  </button>
                );
              }

              const range =
                typeof s.chapterIdx === 'number' ? chapterRanges.get(s.chapterIdx) : undefined;
              const rangeLabel = range
                ? range.start === range.end
                  ? `p. ${range.start}`
                  : `p. ${range.start}–${range.end}`
                : s.ocrPage
                  ? `p. ${s.ocrPage}`
                  : null;
              const isLast = idx === tocItems.length - 1;

              return (
                <div key={idx} className="px-2">
                  <button
                    onClick={onClick}
                    className={`w-full text-left px-3 py-3 rounded-lg transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${active ? (dark ? 'bg-primary/20 text-primary' : 'bg-primary/15 text-primary') : (dark ? 'hover:bg-white/5' : 'hover:bg-black/5')}`}
                    style={{ paddingLeft: 12 + (s.nivel - 1) * 14 }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[15px] leading-snug font-medium flex-1 min-w-0">
                        {s.titulo}
                      </span>
                      {rangeLabel && (
                        <span
                          className={`text-[11px] tabular-nums shrink-0 mt-0.5 px-2 py-0.5 rounded-full ${active ? 'bg-primary/20 text-primary' : dark ? 'bg-white/5 text-white/60' : 'bg-black/5 text-black/60'}`}
                        >
                          {rangeLabel}
                        </span>
                      )}
                    </div>
                  </button>
                  {!isLast && (
                    <div
                      className="mx-3 h-px"
                      style={{ background: `${tema.text}14` }}
                    />
                  )}
                </div>
              );
            })}
          </div>

        </aside>
      )}

      {/* Rail de funções — desktop (direita) */}
      {isDesktop && status === 'pronto' && currentPage && !focoOn && (
        <aside
          aria-label="Ferramentas de leitura"
          className="hidden md:flex md:flex-col fixed right-0 top-0 bottom-0 z-[1305] border-l backdrop-blur-md pt-[3.75rem] pb-4"
          style={{ width: DESKTOP_FN_RAIL, background: `${tema.bg}f2`, borderColor: tema.border, color: tema.text }}
        >
          <div className="flex flex-col items-center gap-2 px-2 pt-3">
            <button
              onClick={prev}
              disabled={currentIndex === 0}
              aria-label="Página anterior"
              title="Página anterior"
              className={`w-12 h-12 rounded-full flex items-center justify-center transition active:scale-95 disabled:opacity-30 ${dark ? 'bg-white/[0.06] hover:bg-white/10' : 'bg-black/[0.04] hover:bg-black/10'}`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              disabled={currentIndex >= paginas.length - 1}
              aria-label="Próxima página"
              title="Próxima página"
              className={`w-12 h-12 rounded-full flex items-center justify-center transition active:scale-95 disabled:opacity-30 ${dark ? 'bg-white/[0.06] hover:bg-white/10' : 'bg-black/[0.04] hover:bg-black/10'}`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div
              className="w-8 h-px my-1"
              style={{ background: `${tema.text}22` }}
            />

            <button
              onClick={() => setShowAjustes(true)}
              aria-label="Ajustes de leitura"
              title="Ajustes"
              className={`w-12 h-12 rounded-full flex items-center justify-center transition active:scale-95 ${dark ? 'bg-white/[0.06] hover:bg-white/10' : 'bg-black/[0.04] hover:bg-black/10'}`}
            >
              <Sliders className="w-[20px] h-[20px]" />
            </button>

            <button
              onClick={toggleNarracao}
              aria-label={speaking ? 'Parar narração' : 'Ouvir narração'}
              title={speaking ? 'Parar narração' : audioPaginaAtual ? 'Ouvir narração' : 'Narração em breve'}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition active:scale-95 ${speaking ? 'bg-primary text-primary-foreground' : dark ? 'bg-white/[0.06] hover:bg-white/10' : 'bg-black/[0.04] hover:bg-black/10'} ${!audioPaginaAtual && !speaking ? 'opacity-50' : ''}`}
            >
              {speaking ? <Square className="w-[18px] h-[18px]" /> : <Volume2 className="w-[20px] h-[20px]" />}
            </button>

            <button
              onClick={() => setShowBookmarks(true)}
              aria-label="Marcadores"
              title="Marcadores"
              className={`w-12 h-12 rounded-full flex items-center justify-center transition active:scale-95 relative ${dark ? 'bg-white/[0.06] hover:bg-white/10' : 'bg-black/[0.04] hover:bg-black/10'}`}
            >
              {isCurrentBookmarked ? (
                <BookmarkCheck className="w-[20px] h-[20px] text-primary" />
              ) : (
                <Bookmark className="w-[20px] h-[20px]" />
              )}
              {bookmarks.length > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-semibold flex items-center justify-center">
                  {bookmarks.length}
                </span>
              )}
            </button>

            {currentPage.kind === 'content' && (currentPage.md || '').trim().length > 40 && (
              <>
                <div className="w-8 h-px my-1" style={{ background: `${tema.text}22` }} />

                <button
                  onClick={() => setShowAssistente(true)}
                  aria-label="Assistente de leitura"
                  title="Assistente IA"
                  className="w-12 h-12 rounded-full flex items-center justify-center transition active:scale-95 shadow-lg"
                  style={{
                    background: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                    boxShadow: '0 8px 20px -6px hsl(var(--primary) / 0.5)',
                  }}
                >
                  <WandSparkles className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setShowCompartilhar(true)}
                  aria-label="Compartilhar frase"
                  title="Compartilhar"
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition active:scale-95 ${dark ? 'bg-white/[0.06] hover:bg-white/10' : 'bg-black/[0.04] hover:bg-black/10'}`}
                >
                  <Share2 className="w-[18px] h-[18px]" />
                </button>
              </>
            )}
          </div>

          {/* Progresso vertical */}
          <div className="mt-auto flex flex-col items-center gap-2 px-2">
            <span className="text-[10px] opacity-60 tabular-nums">p.{currentPage.ocrPage}</span>
            <div
              className={`w-1 h-24 rounded-full overflow-hidden ${dark ? 'bg-white/10' : 'bg-black/10'} relative`}
            >
              <motion.div
                className="absolute left-0 right-0 bottom-0 bg-primary rounded-full"
                style={{ transformOrigin: "bottom" }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: (currentIndex + 1) / paginas.length }}
                transition={{ type: 'tween', ease: 'easeOut', duration: 0.15 }}
              />
            </div>
            <span className="text-[10px] opacity-60 tabular-nums">
              {currentIndex + 1}/{paginas.length}
            </span>
          </div>
        </aside>
      )}


      {/* Conteúdo */}
      <div
        className="flex-1 min-h-0 relative overflow-hidden transition-[margin] duration-300 ease-out"
        style={{
          // Usa MARGEM (não padding): os filhos são absolutos (inset-0) e ignorariam
          // o padding, fazendo o texto passar por baixo do sumário lateral.
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
                // Modo Folhear: StPageFlip renderiza o curl real com curvatura e sombra dinâmicas
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

              {/* Overlay de tonalidade quente (âmbar) */}
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



            {/* Tap zones removidas: navegação por toque nas laterais é feita via onPointerUp
                do container rolável para não bloquear o scroll vertical nas bordas. */}
          </>

        )}
      </div>

      {/* Botão de modo foco — desktop */}
      {isDesktop && status === 'pronto' && currentPage && (
        <button
          onClick={() => setModoFoco((v) => !v)}
          aria-label={focoOn ? 'Sair do modo foco (F)' : 'Modo foco (F)'}
          title={focoOn ? 'Sair do modo foco (F)' : 'Modo foco (F)'}
          className={`hidden md:flex fixed top-4 right-4 z-[1320] w-11 h-11 rounded-full items-center justify-center border backdrop-blur transition active:scale-95 ${focoOn ? 'opacity-40 hover:opacity-100' : ''}`}
          style={{
            background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            borderColor: tema.border,
            color: tema.text,
          }}
        >
          {focoOn ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      )}

      {/* Barra de contexto de leitura — desktop */}
      {isDesktop && status === 'pronto' && currentPage && (
        <div
          className="hidden md:flex items-center gap-4 shrink-0 border-t px-6 text-[12px] backdrop-blur"
          style={{
            height: 40,
            marginLeft: tocRailW,
            marginRight: fnRailW,
            background: dark ? 'rgba(0,0,0,0.28)' : `${tema.bg}cc`,
            borderColor: tema.border,
            color: tema.text,
          }}
        >
          <span className="truncate opacity-70 max-w-[38%]">{currentPage.chapterTitulo}</span>
          <span className="opacity-40">·</span>
          <span className="tabular-nums opacity-70">
            pág. {currentIndex + 1} de {paginas.length}
          </span>
          <div className={`flex-1 h-1 rounded-full overflow-hidden ${dark ? 'bg-white/10' : 'bg-black/10'}`}>
            <motion.div
              className="h-full w-full bg-primary"
              style={{ transformOrigin: "left" }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: (currentIndex + 1) / paginas.length }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.15 }}
            />
          </div>
          <span className="tabular-nums opacity-70">
            {Math.round(((currentIndex + 1) / paginas.length) * 100)}% lido
          </span>
          <span className="opacity-40">·</span>
          <span className="tabular-nums opacity-70">
            ≈ {Math.max(1, Math.round((paginas.length - currentIndex - 1) * 1.5))} min restantes
          </span>
          <span className="opacity-40 hidden xl:inline">·</span>
          <span className="opacity-45 hidden xl:inline">← → páginas · T sumário · A ajustes · F foco</span>
        </div>
      )}



      {/* Menu de rodapé — some quando drawer/sheet abertos */}
      <AnimatePresence>
        {status === 'pronto' && currentPage && !menuOpen && !isDesktop && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'tween', duration: 0.2 }}
            className="fixed z-[1310] inset-x-0 bottom-0 border-t shadow-2xl"
            style={{
              paddingBottom: 'var(--sai-bottom)',
              maxWidth:
                typeof window !== 'undefined' && window.innerWidth >= 768
                  ? `min(720px, calc(100vw - ${(railExpanded ? 380 : 56) + 32}px))`
                  : undefined,
              background: dark ? '#0b0b0b' : tema.bg,
              borderColor: tema.border,
              color: tema.text,
            }}
          >

            <div className="px-5 pt-3 pb-2 flex items-center gap-3 text-[11px]">
              <span className="opacity-60 tabular-nums">
                {currentIndex + 1} / {paginas.length}
              </span>
              <div className={`flex-1 h-1 rounded-full overflow-hidden ${dark ? 'bg-white/10' : 'bg-black/10'}`}>
                <motion.div
                  className="h-full w-full bg-primary"
                  style={{ transformOrigin: "left" }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: (currentIndex + 1) / paginas.length }}
                  transition={{ type: 'tween', ease: 'easeOut', duration: 0.15 }}
                />
              </div>
              <span className="opacity-60 tabular-nums">p.{currentPage.ocrPage}</span>
            </div>

            <div className="flex items-center justify-around px-2 pb-4 pt-2 gap-1">
              <button
                onClick={prev}
                disabled={currentIndex === 0}
                aria-label="Página anterior"
                className={`w-14 h-14 rounded-full flex items-center justify-center transition active:scale-95 disabled:opacity-30 ${dark ? 'bg-white/[0.06] hover:bg-white/10' : 'bg-black/[0.04] hover:bg-black/10'}`}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => setShowAjustes(true)}
                aria-label="Ajustes de leitura"
                className={`w-14 h-14 rounded-full flex items-center justify-center transition active:scale-95 ${dark ? 'bg-white/[0.06] hover:bg-white/10' : 'bg-black/[0.04] hover:bg-black/10'}`}
              >
                <Sliders className="w-[22px] h-[22px]" />
              </button>

              <button
                onClick={() => setShowAssistente(true)}
                aria-label="Assistente IA"
                title="Assistente IA"
                className={`w-14 h-14 rounded-full flex items-center justify-center transition active:scale-95 text-white shadow-lg`}
                style={{
                  background: 'hsl(var(--primary))',
                  boxShadow: '0 8px 20px -6px hsl(var(--primary) / 0.5)',
                }}
              >
                <WandSparkles className="w-[20px] h-[20px]" />
              </button>



              <button
                onClick={() => setShowBookmarks(true)}
                aria-label="Marcadores"
                className={`w-14 h-14 rounded-full flex items-center justify-center transition active:scale-95 relative ${dark ? 'bg-white/[0.06] hover:bg-white/10' : 'bg-black/[0.04] hover:bg-black/10'}`}
              >
                {isCurrentBookmarked ? (
                  <BookmarkCheck className="w-[22px] h-[22px] text-primary" />
                ) : (
                  <Bookmark className="w-[22px] h-[22px]" />
                )}
                {bookmarks.length > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center">
                    {bookmarks.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowToc(true)}
                aria-label="Sumário"
                className={`w-14 h-14 rounded-full flex items-center justify-center transition active:scale-95 ${dark ? 'bg-white/[0.06] hover:bg-white/10' : 'bg-black/[0.04] hover:bg-black/10'}`}
              >
                <List className="w-[22px] h-[22px]" />
              </button>
              <button
                onClick={next}
                disabled={currentIndex >= paginas.length - 1}
                aria-label="Próxima página"
                className={`w-14 h-14 rounded-full flex items-center justify-center transition active:scale-95 disabled:opacity-30 ${dark ? 'bg-white/[0.06] hover:bg-white/10' : 'bg-black/[0.04] hover:bg-black/10'}`}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card retomar leitura */}
      <AnimatePresence>
        {status === 'pronto' && paginas.length > 0 && resumeOcrPage !== null && !resumeDismissed && introDismissed && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1320] bg-black/50 backdrop-blur-sm"
              onClick={() => setResumeDismissed(true)}
            />
            <div
              className="fixed inset-0 z-[1321] flex items-center justify-center px-4 pointer-events-none"
              style={{
                paddingTop: 'calc(var(--sai-top))',
                paddingBottom: 'calc(var(--sai-bottom))',
              }}
            >
              <motion.div
                initial={{ y: 24, opacity: 0, scale: 0.92 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -12, opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 260, damping: 24, mass: 0.9 }}
                className={`relative w-full max-w-sm rounded-[28px] p-6 pointer-events-auto overflow-hidden ${dark ? 'bg-neutral-900/95 text-white' : 'bg-white/95 text-neutral-900'}`}
                style={{
                  boxShadow: dark
                    ? '0 30px 80px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.08)'
                    : '0 30px 80px -20px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
                }}
              >
                {/* Glow ambiente animado */}
                <motion.div
                  aria-hidden
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.35, 0.6, 0.35] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full"
                  style={{ background: 'radial-gradient(circle, hsl(var(--primary)/0.35), transparent 70%)' }}
                />

              {(() => {
                // Resolve alvo
                let targetIdx = 0;
                let targetPage: Pagina | undefined;
                if (resumeOcrPage < 0) {
                  const legacyIdx = Math.min(-resumeOcrPage, paginas.length - 1);
                  targetIdx = legacyIdx;
                  targetPage = paginas[legacyIdx];
                } else {
                  let bestDiff = Infinity;
                  paginas.forEach((p, i) => {
                    const d = Math.abs(p.ocrPage - resumeOcrPage);
                    if (d < bestDiff) {
                      bestDiff = d;
                      targetIdx = i;
                      targetPage = p;
                    }
                  });
                }
                return (
                  <div className="relative">
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="flex items-center gap-3 mb-5"
                    >
                      <motion.div
                        initial={{ scale: 0, rotate: -30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.08, type: 'spring', stiffness: 380, damping: 18 }}
                        className={`w-11 h-11 rounded-full flex items-center justify-center ${dark ? 'bg-primary/15' : 'bg-primary/10'}`}
                      >
                        <BookmarkCheck className="w-5 h-5 text-primary" />
                      </motion.div>
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-widest opacity-60">Bem-vindo de volta</p>
                        <p className="text-sm font-medium truncate">
                          {targetPage ? `${targetPage.chapterTitulo} · pág. ${targetPage.ocrPage}` : 'Continuar leitura'}
                        </p>
                      </div>
                    </motion.div>
                    <motion.button
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.22, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                      onClick={() => {
                        setDirection(1);
                        setCurrentIndex(targetIdx);
                        setResumeDismissed(true);
                      }}
                      className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition shadow-lg shadow-primary/30"
                    >
                      Continuar leitura
                    </motion.button>
                    <motion.button
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.32, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      onClick={() => {
                        setDirection(-1);
                        setCurrentIndex(0);
                        setResumeDismissed(true);
                      }}
                      className={`w-full h-11 mt-2 rounded-xl text-sm font-medium transition active:scale-[0.98] ${dark ? 'text-white/70 hover:text-white hover:bg-white/[0.06]' : 'text-neutral-600 hover:text-neutral-900 hover:bg-black/[0.04]'}`}
                    >
                      Começar do início
                    </motion.button>
                  </div>
                );
              })()}
              </motion.div>
            </div>
          </>

        )}
      </AnimatePresence>

      {/* Sumário — drawer mobile em tela cheia */}
      <AnimatePresence>
        {showToc && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1322] md:hidden"
              onClick={() => setShowToc(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="fixed top-0 right-0 bottom-0 w-[90%] max-w-sm z-[1323] md:hidden shadow-2xl flex flex-col"
              style={{ background: tema.bg, color: tema.text, paddingTop: 'var(--sai-top)' }}
            >
              <div className="px-4 h-14 flex items-center gap-3 border-b border-current/10 shrink-0">
                <p className="text-sm font-semibold flex-1">Sumário</p>
                <button
                  onClick={() => setShowToc(false)}
                  aria-label="Fechar sumário"
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${dark ? 'bg-white/[0.06] hover:bg-white/10' : 'bg-black/[0.04] hover:bg-black/10'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {tocItems.length === 0 && (
                  <p className="text-xs opacity-60 px-2 py-4">Este livro não tem sumário detectado.</p>
                )}
                {tocItems.map((s: any, idx) => {
                  const active = currentPage && s.chapterIdx === currentPage.chapterIdx;
                  const onClick =
                    typeof s.chapterIdx === 'number' && capitulos.length
                      ? () => jumpToChapter(s.chapterIdx)
                      : () => jumpToOcrPage(s.ocrPage);
                  return (
                    <button
                      key={idx}
                      onClick={onClick}
                      className={`w-full text-left px-3 py-3 rounded-lg transition text-sm ${active ? (dark ? 'bg-primary/20 text-primary' : 'bg-primary/15 text-primary') : (dark ? 'hover:bg-white/5' : 'hover:bg-black/5')}`}
                      style={{ paddingLeft: 12 + (s.nivel - 1) * 14 }}
                    >
                      <span className="opacity-90">{s.titulo}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bookmarks — bottom sheet */}
      <AnimatePresence>
        {showBookmarks && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`fixed inset-0 z-[1324] ${isDesktop ? 'bg-black/25' : 'bg-black/50 backdrop-blur-sm'}`}
              onClick={() => setShowBookmarks(false)}
            />
            <motion.div
              initial={isDesktop ? { opacity: 0, x: 48, scale: 0.97 } : { y: '100%' }}
              animate={isDesktop ? { opacity: 1, x: 0, scale: 1 } : { y: 0 }}
              exit={isDesktop ? { opacity: 0, x: 48, scale: 0.97 } : { y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className={
                isDesktop
                  ? 'fixed z-[1325] rounded-3xl shadow-2xl flex flex-col overflow-hidden'
                  : 'fixed inset-x-0 bottom-0 z-[1325] mx-auto w-full md:max-w-[720px] rounded-t-3xl shadow-2xl flex flex-col max-h-[80vh]'
              }
              style={
                isDesktop
                  ? {
                      background: tema.bg,
                      color: tema.text,
                      right: 'max(16px, var(--sai-right))',
                      top: 'calc(var(--sai-top) + 5.25rem)',
                      bottom: 'calc(var(--sai-bottom) + 1.5rem)',
                      width: 'min(400px, calc(100vw - 32px))',
                      border: `1px solid ${tema.border}`,
                    }
                  : {
                      background: tema.bg,
                      color: tema.text,
                      paddingBottom: 'var(--sai-bottom)',
                    }
              }
            >
              {!isDesktop && (
                <div className="flex justify-center pt-3 pb-1">
                  <div className={`w-10 h-1 rounded-full ${dark ? 'bg-white/20' : 'bg-black/20'}`} />
                </div>
              )}
              <div className="px-5 pt-2 pb-3 flex items-center gap-3">
                <p className="text-base font-semibold flex-1">Marcadores</p>
                <button
                  onClick={() => setShowBookmarks(false)}
                  aria-label="Fechar marcadores"
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${dark ? 'bg-white/[0.06] hover:bg-white/10' : 'bg-black/[0.04] hover:bg-black/10'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-5 pb-3">
                <button
                  onClick={toggleCurrentBookmark}
                  className={`w-full h-14 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition shadow-lg ${isCurrentBookmarked ? (dark ? 'bg-white/10 text-[#e8e2d4]' : 'bg-black/5 text-[#2a2418]') : 'bg-primary text-primary-foreground shadow-primary/20'}`}
                >
                  {isCurrentBookmarked ? (
                    <>
                      <Trash2 className="w-5 h-5" />
                      Remover marcador desta página
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Marcar esta página
                    </>
                  )}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 pb-6 space-y-1">
                {bookmarks.length === 0 && (
                  <p className="text-xs opacity-60 px-4 py-6 text-center">
                    Nenhuma página marcada ainda. Toque em "Marcar esta página" para começar.
                  </p>
                )}
                {bookmarks.map((b) => (
                  <div
                    key={b.ocrPage}
                    className={`flex items-center gap-2 rounded-2xl p-3 ${dark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.03]'}`}
                  >
                    <button
                      onClick={() => {
                        jumpToOcrPage(b.ocrPage);
                        setShowBookmarks(false);
                      }}
                      className="flex-1 text-left min-w-0"
                    >
                      <p className="text-sm font-medium truncate">{b.chapterTitulo}</p>
                      <p className="text-[11px] opacity-60 mt-0.5">Página {b.ocrPage}</p>
                    </button>
                    <button
                      onClick={() => removeBookmark(b.ocrPage)}
                      aria-label={`Remover marcador da página ${b.ocrPage}`}
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${dark ? 'bg-white/[0.06] hover:bg-white/10' : 'bg-black/[0.04] hover:bg-black/10'}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Painel flutuante de Ajustes (Temas · Texto · Brilho · Página · Busca) */}
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

      {/* FABs removidos para uma leitura mais limpa */}

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

      {/* Painel de Compartilhar */}
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

      {/* Introdução do livro (capa + ficha + sumário) */}
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
