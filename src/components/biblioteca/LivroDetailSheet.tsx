import { useEffect, useLayoutEffect, useRef, useState, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

import type { LivroNormalizado } from '@/lib/bibliotecaColecoes';
import { formatarSobreLivro, estimarMinutosLeitura } from '@/lib/livroSobreFormat';
import { useLivroPageCount } from '@/hooks/useLivroPageCount';
import { useBibliotecaCapa } from '@/hooks/useBibliotecaAsset';
import { useIsDesktop } from '@/hooks/use-desktop';
import { useFeatureLimit } from '@/hooks/useFeatureLimit';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useResumoLivroPlayer } from '@/contexts/ResumoLivroPlayerContext';
import { getLocalPdfUrl, isPdfCached, downloadPdf } from '@/services/bibliotecaPdfCache';
import { pushRecente, subscribeTracking } from '@/lib/bibliotecaTracking';
import { copiarTexto } from '@/lib/nativo/copiar';
import { compartilharNativo, podeCompartilhar } from '@/lib/nativo/compartilhar';
import { haptic } from '@/lib/nativeHaptics';
import { setDynamicOgImage, setDynamicJsonLdBook, removeDynamicJsonLdBook } from '@/lib/seoImageMeta';
import { useBibliotecaFav } from '@/hooks/useBibliotecaFav';

import { PrimeBottomSheet } from '@/components/vademecum/overlays/PrimeBottomSheet';
import { Network } from '@capacitor/network';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import PremiumGate from '@/components/PremiumGate';
import LembreteSheet from '@/components/lembretes/LembreteSheet';
import LeitorNativo from './LeitorNativo';
import LerAgoraDialog, { LerModo } from './LerAgoraDialog';
import InAppWebView from './InAppWebView';

import {
  LivroFloatingActions,
  LivroHeaderBackdrop,
  LivroAcoesSection,
  LivroFichaTecnica,
  LivroTabsContent,
} from './detail';

const PdfScrollReader = lazy(() => import('./PdfScrollReader'));
const PdfPaginatedReader = lazy(() => import('./PdfPaginatedReader'));

interface LivroDetailSheetProps {
  livro: LivroNormalizado | null;
  open: boolean;
  onClose: () => void;
  inline?: boolean;
}

const LivroDetailSheet = ({ livro, open, onClose, inline }: LivroDetailSheetProps) => {
  const mountedAt = useRef(0);
  useEffect(() => {
    if (open) mountedAt.current = Date.now();
  }, [open]);

  const handleCloseSafe = () => {
    if (Date.now() - mountedAt.current < 400) return;
    onClose();
  };

  useEscapeKey(open, handleCloseSafe);
  const isDesktop = useIsDesktop();
  const contentRef = useRef<HTMLDivElement>(null);
  const [readerMode, setReaderMode] = useState<null | 'pdf' | 'nativa' | 'online'>(null);
  const [lerDialog, setLerDialog] = useState(false);

  // Cache do livro para não quebrar a animação de exit da AnimatePresence
  const [cachedLivro, setCachedLivro] = useState<LivroNormalizado | null>(livro);
  useEffect(() => {
    if (livro) setCachedLivro(livro);
  }, [livro]);

  const currentLivro = livro || cachedLivro;

  const { fav, handleToggleFav } = useBibliotecaFav(currentLivro);

  const [pdfCached, setPdfCached] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState<null | number>(null);
  const [pdfUrlForReader, setPdfUrlForReader] = useState<string | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [lembreteOpen, setLembreteOpen] = useState(false);
  const { canUse, register, config } = useFeatureLimit('biblioteca_ler', {
    scope: livro ? String(livro.id) : null,
  });

  const { tocar: tocarResumo, setAberto: abrirPlayerResumo } = useResumoLivroPlayer();

  // Ficha técnica: nº de páginas + tempo médio de leitura (lazy via pdfjs)
  const calculatedNumPages = useLivroPageCount(open && !livro?.paginas ? livro?.download : null);
  const numPages = livro?.paginas || calculatedNumPages;

  const rawSobre = (livro?.sobre && livro.sobre.trim().length >= 15)
    ? livro.sobre
    : (livro ? `**${livro.titulo}**${livro.autor ? ` de *${livro.autor}*` : ''} é uma obra fundamental de referência na categoria **${livro.area || 'Clássicos'}**. O texto apresenta um panorama aprofundado sobre a evolução dos conceitos institucionais, oferecendo uma visão analítica indispensável para estudantes, juristas e acadêmicos. Através de uma abordagem clara e estruturada, aborda a aplicação prática da matéria e as transformações contemporâneas.` : '');

  const sobreMarkdown = livro ? formatarSobreLivro(rawSobre, { titulo: livro.titulo, autor: livro.autor }) : '';

  const analiseDetalhadaTexto = (livro?.analiseDetalhada && livro.analiseDetalhada.trim().length >= 15)
    ? livro.analiseDetalhada
    : (livro ? `**Análise Técnica & Conceitual**\n\n` +
      `A obra **${livro.titulo}** articula conceitos essenciais de ${livro.area || 'Conhecimento Jurídico'}, estruturando o debate em torno de três pilares centrais:\n\n` +
      `1. **Fundamentação Doutrinária**: Sistematização dos princípios informadores e preceitos norteadores do tema.\n` +
      `2. **Aplicação Prática e Jurisprudencial**: Reflexão sobre a aplicação direta no cotidiano profissional e institucional.\n` +
      `3. **Visão Crítica e Contemporânea**: Análise das tendências modernas e desafios de adequação normativa.\n\n` +
      `**Relevância para Estudos**: Recomendado para consolidação de repertório técnico e fundamentação prática.` : '');

  const temAnaliseTecnica = true;
  const minutosLeitura = livro?.minutosLeitura || estimarMinutosLeitura(numPages);

  const capaUrl = useBibliotecaCapa(livro?.capa, 500);
  const capaHorizontalUrl = useBibliotecaCapa(livro?.capaHorizontal, 1400);

  useEffect(() => {
    if (!livro?.download) return;
    if (!Capacitor.isNativePlatform()) { setPdfCached(false); return; }
    isPdfCached(livro.download).then(setPdfCached).catch(() => setPdfCached(false));
  }, [livro?.download]);

  // Sync favorito + registra recente quando abre um livro
  useEffect(() => {
    if (!livro || !open) return;
    haptic.light();
    pushRecente(livro);
    setDynamicOgImage(capaUrl || livro.capa, livro.titulo);
    setDynamicJsonLdBook({
      title: livro.titulo,
      author: livro.autor,
      coverUrl: capaUrl || livro.capa,
      description: livro.sobre,
      isbn: (livro as any).isbn || null,
    });
    return () => {
      removeDynamicJsonLdBook();
    };
  }, [livro, open, capaUrl]);

  // Monitoramento offline para o leitor de PDF
  useEffect(() => {
    if (readerMode === 'pdf') {
      const listener = Network.addListener('networkStatusChange', status => {
        if (!status.connected && !pdfCached) {
          toast.warning('Conexão perdida', { description: 'Sem internet, o livro pode falhar ao carregar novas páginas. Considere baixar o PDF offline.' });
        }
      });
      return () => { listener.then(l => l.remove()).catch(() => {}); };
    }
  }, [readerMode, pdfCached]);

  // Trava scroll do fundo enquanto a folha estiver aberta, exceto se for renderizado inline (já feito no PrimeBottomSheet, mantendo apenas para inline se aplicável)
  useBodyScrollLock(open && !inline);

  // Reset síncrono do scroll no mount/troca de livro.
  useLayoutEffect(() => {
    if (!open || !currentLivro) return;
    const el = contentRef.current;
    if (el) el.scrollTop = 0;
  }, [open, currentLivro?.id]);

  if (!currentLivro) return null;

  const hasOnline = !!currentLivro.link;
  const hasPdf = !!currentLivro.download;

  const ensurePdfLocalUrl = async (): Promise<string> => {
    if (!currentLivro.download) return '';
    if (Capacitor.isNativePlatform()) {
      const local = await getLocalPdfUrl(currentLivro.download);
      if (local) return local;
    }
    return currentLivro.download;
  };

  const handleDownloadPdf = async () => {
    if (!livro?.download) return;
    if (!Capacitor.isNativePlatform()) {
      const { openExternal } = await import('@/lib/nativeBrowser');
      openExternal(livro.download);
      return;
    }
    try {
      setDownloadingPdf(0);
      await downloadPdf(livro.download, (loaded, total) => {
        if (total > 0) setDownloadingPdf(Math.round((loaded / total) * 100));
      });
      setDownloadingPdf(null);
      setPdfCached(true);
      toast.success('PDF disponível offline');
    } catch (e: any) {
      setDownloadingPdf(null);
      toast.error('Falha ao baixar PDF', { description: e?.message });
    }
  };

  const onSelectModo = async (modo: LerModo) => {
    haptic.selection();
    // Bloqueio de leitura: 1 livro por mês (bypass se este mesmo livro já foi liberado)
    if (!canUse) { setLerDialog(false); setGateOpen(true); return; }
    // Registra o uso antes de liberar qualquer modo (scope/ref = id do livro)
    register(String(currentLivro.id));

    if (modo === 'download') { handleDownloadPdf(); return; }
    if (modo === 'desktop') {
      const url = typeof window !== 'undefined' ? window.location.href : '';
      try {
        if (podeCompartilhar()) {
          await compartilharNativo({ title: currentLivro.titulo, url });
        } else if (navigator.clipboard && url) {
          await copiarTexto(url);
          toast.success('Link copiado', { description: 'Cole no navegador do desktop para continuar lendo.' });
        }
      } catch { /* usuário cancelou */ }
      setLerDialog(false);
      return;
    }
    setLerDialog(false);
    if (modo === 'nativa') setReaderMode('nativa');
    else if (modo === 'pdf') {
      const url = await ensurePdfLocalUrl();
      setPdfUrlForReader(url);
      setReaderMode('pdf');
    } else if (modo === 'online' && currentLivro.link) {
      setReaderMode('online');
    }
  };

  const renderContent = () => (
    <>
      {inline ? (
        open && (
          <motion.div
            key="sheet"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="relative w-full h-full flex flex-col overflow-hidden rounded-3xl bg-card border border-border/50 shadow-xl"
          >
            <LivroFloatingActions
              fav={fav}
              onToggleFav={handleToggleFav}
              onOpenLembrete={() => setLembreteOpen(true)}
              onClose={handleCloseSafe}
              inline={inline}
              isDesktop={isDesktop}
            />
            <div key={String(currentLivro.id)} ref={contentRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              <LivroHeaderBackdrop
                capaHorizontalUrl={capaHorizontalUrl}
                capaUrl={capaUrl}
                titulo={currentLivro.titulo}
                autor={currentLivro.autor}
                area={currentLivro.area}
                contentRef={contentRef}
              />
              <div className="px-5 pb-[calc(1.5rem+var(--sai-bottom,0px))] space-y-4 max-w-2xl mx-auto pt-4">
                <LivroAcoesSection
                  hasPdf={hasPdf}
                  hasOnline={hasOnline}
                  audioResumoUrl={currentLivro.audioResumoUrl}
                  onLerAgora={() => {
                    if (!canUse) { setGateOpen(true); return; }
                    setLerDialog(true);
                  }}
                  onOuvirResumo={() => {
                    haptic.selection();
                    tocarResumo(currentLivro);
                    abrirPlayerResumo(true);
                  }}
                />
                <LivroFichaTecnica
                  numPages={numPages}
                  minutosLeitura={minutosLeitura}
                  anoLancamento={currentLivro.anoLancamento}
                  hasDownload={!!currentLivro.download}
                />
                <LivroTabsContent
                  sobreMarkdown={sobreMarkdown}
                  temAnaliseTecnica={temAnaliseTecnica}
                  anoLancamento={currentLivro.anoLancamento}
                  editora={currentLivro.editora}
                  curiosidades={currentLivro.curiosidades}
                  analiseDetalhadaTexto={analiseDetalhadaTexto}
                />
              </div>
            </div>
          </motion.div>
        )
      ) : (
        <PrimeBottomSheet 
          open={open} 
          onClose={handleCloseSafe} 
          zIndex={1001} 
          className={isDesktop ? "m-auto !inset-auto top-[7.5dvh] !h-[85dvh] max-w-[720px] rounded-3xl border border-border shadow-2xl" : "mt-[10dvh] !h-[90dvh] rounded-t-3xl shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.5)]"}
        >
          <LivroFloatingActions
            fav={fav}
            onToggleFav={handleToggleFav}
            onOpenLembrete={() => setLembreteOpen(true)}
            onClose={handleCloseSafe}
            inline={inline}
            isDesktop={isDesktop}
          />
          <div key={String(currentLivro.id)} ref={contentRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            <LivroHeaderBackdrop
              capaHorizontalUrl={capaHorizontalUrl}
              capaUrl={capaUrl}
              titulo={currentLivro.titulo}
              autor={currentLivro.autor}
              area={currentLivro.area}
              contentRef={contentRef}
            />
            <div className="px-5 pb-[calc(1.5rem+var(--sai-bottom,0px))] space-y-4 max-w-2xl mx-auto pt-4">
              <LivroAcoesSection
                hasPdf={hasPdf}
                hasOnline={hasOnline}
                audioResumoUrl={currentLivro.audioResumoUrl}
                onLerAgora={() => {
                  if (!canUse) { setGateOpen(true); return; }
                  setLerDialog(true);
                }}
                onOuvirResumo={() => {
                  haptic.selection();
                  tocarResumo(currentLivro);
                  abrirPlayerResumo(true);
                }}
              />
              <LivroFichaTecnica
                numPages={numPages}
                minutosLeitura={minutosLeitura}
                anoLancamento={currentLivro.anoLancamento}
                hasDownload={!!currentLivro.download}
              />
              <LivroTabsContent
                sobreMarkdown={sobreMarkdown}
                temAnaliseTecnica={temAnaliseTecnica}
                anoLancamento={currentLivro.anoLancamento}
                editora={currentLivro.editora}
                curiosidades={currentLivro.curiosidades}
                analiseDetalhadaTexto={analiseDetalhadaTexto}
              />
            </div>
          </div>
        </PrimeBottomSheet>
      )}

      {/* Diálogo de escolha de modo */}
      <LerAgoraDialog
        open={lerDialog}
        onClose={() => setLerDialog(false)}
        onSelect={onSelectModo}
        hasPdf={hasPdf}
        hasOnline={hasOnline}
        pdfCached={pdfCached}
        downloadProgress={downloadingPdf}
        livroTitulo={currentLivro?.titulo}
        livroAutor={currentLivro?.autor}
      />

      {/* Leitores em fullscreen */}
      <AnimatePresence>
        {readerMode === 'pdf' && (pdfUrlForReader || currentLivro.download) && (
          <ErrorBoundary key="pdf-reader">
            <Suspense fallback={<div className="flex h-full items-center justify-center p-8 text-zinc-400">Carregando leitor...</div>}>
              {isDesktop ? (
                <PdfPaginatedReader
                  url={pdfUrlForReader || currentLivro.download!}
                  titulo={currentLivro.titulo}
                  livroId={String(currentLivro.id)}
                  capaUrl={capaUrl}
                  onClose={() => { setReaderMode(null); setPdfUrlForReader(null); }}
                />
              ) : (
                <PdfScrollReader
                  url={pdfUrlForReader || currentLivro.download!}
                  titulo={currentLivro.titulo}
                  livroId={String(currentLivro.id)}
                  capaUrl={capaUrl}
                  onClose={() => { setReaderMode(null); setPdfUrlForReader(null); }}
                />
              )}
            </Suspense>
          </ErrorBoundary>
        )}
        {readerMode === 'nativa' && currentLivro.download && (
          <LeitorNativo
            key="nativa-reader"
            livroId={String(currentLivro.id)}
            livroTabela={currentLivro.colecaoId}
            pdfUrl={currentLivro.download}
            titulo={currentLivro.titulo}
            autor={currentLivro.autor}
            ano={currentLivro.anoLancamento}
            editora={currentLivro.editora}
            sobre={currentLivro.sobre}
            curiosidades={currentLivro.curiosidades}
            capa={currentLivro.capa}
            onClose={() => setReaderMode(null)}
          />
        )}
        {readerMode === 'online' && currentLivro.link && (
          <InAppWebView key="online-reader" url={currentLivro.link} titulo={currentLivro.titulo} onClose={() => setReaderMode(null)} />
        )}
      </AnimatePresence>

      <PremiumGate
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        feature="biblioteca"
        title="Você já leu seu livro grátis deste mês"
        description="No plano gratuito você lê 1 livro por mês — com leitura nativa, PDF, folheada, offline e desktop. Assine para liberar todo o acervo."
        usageLabel={config ? 'Livro gratuito do mês já utilizado' : undefined}
      />

      <LembreteSheet
        open={lembreteOpen}
        onClose={() => setLembreteOpen(false)}
        livroId={String(currentLivro.id)}
        livroArea={currentLivro.colecaoId}
        livroTitulo={currentLivro.titulo}
        livroCapa={capaUrl}
      />
    </>
  );

  if (inline) {
    return renderContent();
  }

  return createPortal(renderContent(), document.body);
};

export default LivroDetailSheet;
