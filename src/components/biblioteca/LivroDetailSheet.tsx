import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, BookOpen, Heart, Info, FileText, Bell, Clock, Layers, Calendar, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatarSobreLivro, estimarMinutosLeitura, formatarDuracao } from '@/lib/livroSobreFormat';
import { useLivroPageCount } from '@/hooks/useLivroPageCount';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { directImg } from '@/lib/cdnImg';
import type { LivroNormalizado } from '@/lib/bibliotecaColecoes';
import { openPdfNative } from '@/lib/fileOpener';
import { useBibliotecaCapa } from '@/hooks/useBibliotecaAsset';
import { useIsDesktop } from '@/hooks/use-desktop';
import { lazy, Suspense } from 'react';
const PdfScrollReader = lazy(() => import('./PdfScrollReader'));
const PdfPaginatedReader = lazy(() => import('./PdfPaginatedReader'));
import LeitorNativo from './LeitorNativo';
import LerAgoraDialog, { LerModo } from './LerAgoraDialog';
import InAppWebView from './InAppWebView';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { getLocalPdfUrl, isPdfCached, downloadPdf } from '@/services/bibliotecaPdfCache';
import { isFavorito, toggleFavorito, pushRecente, subscribeTracking } from '@/lib/bibliotecaTracking';
import { useFeatureLimit } from '@/hooks/useFeatureLimit';
import PremiumGate from '@/components/PremiumGate';
import LembreteSheet from '@/components/lembretes/LembreteSheet';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useBodyScrollLock, resetBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useNavigate } from 'react-router-dom';
import { Library, Headphones } from 'lucide-react';
import { copiarTexto } from '@/lib/nativo/copiar';
import { compartilharNativo, podeCompartilhar } from '@/lib/nativo/compartilhar';
import { haptic } from '@/lib/nativeHaptics';
import { useResumoLivroPlayer } from '@/contexts/ResumoLivroPlayerContext';

interface LivroDetailSheetProps {
  livro: LivroNormalizado | null;
  open: boolean;
  onClose: () => void;
  inline?: boolean;
}

const LivroDetailSheet = ({ livro, open, onClose, inline }: LivroDetailSheetProps) => {
  useEscapeKey(open, onClose);
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const contentRef = useRef<HTMLDivElement>(null);
  const [readerMode, setReaderMode] = useState<null | 'pdf' | 'nativa' | 'online'>(null);
  const [lerDialog, setLerDialog] = useState(false);

  const [pdfCached, setPdfCached] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState<null | number>(null);
  const [pdfUrlForReader, setPdfUrlForReader] = useState<string | null>(null);
  const [fav, setFav] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [lembreteOpen, setLembreteOpen] = useState(false);
  const { canUse, register, used, config } = useFeatureLimit('biblioteca_ler', {
    scope: livro ? String(livro.id) : null,
  });

  const { tocar: tocarResumo, setAberto: abrirPlayerResumo } = useResumoLivroPlayer();


  // Ficha técnica: nº de páginas + tempo médio de leitura (lazy via pdfjs)
  const calculatedNumPages = useLivroPageCount(open && !livro?.paginas ? livro?.download : null);
  const numPages = livro?.paginas || calculatedNumPages;

  // Apresentações narradas de livros foram desativadas.
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

  // Capas resolvem localmente (filesystem) no app nativo quando pré-baixadas,
  // caindo para CDN no web/desktop. Chamadas de hook ficam antes de qualquer return.
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
    setFav(isFavorito(livro));
    pushRecente(livro);
    const unsub = subscribeTracking(() => setFav(isFavorito(livro)));
    return () => unsub();
  }, [livro, open]);

  // Trava scroll do fundo enquanto a folha estiver aberta, exceto se for renderizado inline
  useBodyScrollLock(open && !inline);

  // Reset síncrono do scroll no mount/troca de livro. O `key={livro.id}` no
  // container abaixo força remount, então este effect roda com scrollTop já 0.
  useLayoutEffect(() => {
    if (!open || !livro) return;
    const el = contentRef.current;
    if (el) el.scrollTop = 0;
  }, [open, livro?.id]);


  if (!livro && !open) return null;
  if (!livro) return null;

  const hasOnline = !!livro.link;
  const hasPdf = !!livro.download;

  const ensurePdfLocalUrl = async (): Promise<string> => {
    if (!livro.download) return '';
    if (Capacitor.isNativePlatform()) {
      const local = await getLocalPdfUrl(livro.download);
      if (local) return local;
    }
    return livro.download;
  };

  const handleDownloadPdf = async () => {
    if (!livro.download) return;
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
    register(String(livro.id));

    if (modo === 'download') { handleDownloadPdf(); return; }
    if (modo === 'desktop') {
      const url = typeof window !== 'undefined' ? window.location.href : '';
      try {
        if (podeCompartilhar()) {
          await compartilharNativo({ title: livro.titulo, url });
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
    } else if (modo === 'online' && livro.link) {
      setReaderMode('online');
    }
  };

  const renderContent = () => (
    <>
      <AnimatePresence>
        {open && !inline && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, pointerEvents: 'none' }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            onTouchMove={(e) => e.preventDefault()}
            onWheel={(e) => e.preventDefault()}
            style={{ touchAction: 'none' }}
            className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {open && (
          <motion.div
            key="sheet"
            initial={inline ? { opacity: 0, scale: 0.98 } : (isDesktop ? { opacity: 0, scale: 0.95 } : { y: '100%' })}
            animate={inline ? { opacity: 1, scale: 1 } : (isDesktop ? { opacity: 1, scale: 1 } : { y: 0 })}
            exit={inline ? { opacity: 0, scale: 0.98 } : (isDesktop ? { opacity: 0, scale: 0.95 } : { y: '100%', pointerEvents: 'none' })}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className={
              inline
                ? "relative w-full h-full flex flex-col overflow-hidden rounded-3xl bg-card border border-border/50 shadow-xl"
                : isDesktop
                  ? "fixed inset-0 m-auto z-[1001] w-full max-w-[720px] h-[85dvh] bg-background flex flex-col overflow-hidden rounded-3xl border border-border shadow-2xl"
                  : "fixed inset-x-0 bottom-0 z-[1001] h-[90dvh] w-full bg-background flex flex-col overflow-hidden rounded-t-3xl shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.5)]"
            }
          >

            {/* Header flutuante — botão chevron-down + favoritar */}
            <div className="absolute top-[calc(var(--sai-top,0px)+0.75rem)] left-4 z-20 flex gap-2">
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-xl backdrop-saturate-150 transition-colors flex items-center justify-center border border-white/25 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.25)]"
              >
                {(inline || isDesktop) ? <X className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
              </button>
            </div>
            <div className="absolute top-[calc(var(--sai-top,0px)+0.75rem)] right-4 z-20 flex gap-2">
              <button
                onClick={() => setLembreteOpen(true)}
                aria-label="Criar lembrete de leitura"
                className="w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-xl backdrop-saturate-150 transition-colors flex items-center justify-center border border-white/25 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.25)]"
              >
                <Bell className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => {
                  haptic.selection();
                  const now = toggleFavorito(livro);
                  setFav(now);
                  toast.success(now ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
                }}
                aria-label={fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                className="w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-xl backdrop-saturate-150 transition-colors flex items-center justify-center border border-white/25 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.25)]"
              >
                <Heart className={`w-5 h-5 ${fav ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
              </button>
            </div>

            {/* Content scroll */}
            <div key={String(livro.id)} ref={contentRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              {/* Backdrop horizontal — cover fills full landscape with palette-tinted gradient */}
              <div className="relative w-full h-[clamp(210px,28dvh,252px)] overflow-hidden bg-background">
                {(capaHorizontalUrl || capaUrl) && (
                  <img
                    src={capaHorizontalUrl || capaUrl}
                    alt=""
                    aria-hidden
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-60"
                  />
                )}
                {(capaHorizontalUrl || capaUrl) && (
                  <img
                    src={capaHorizontalUrl || capaUrl}
                    alt=""
                    aria-hidden
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ objectPosition: 'center' }}
                    onLoad={() => { const el = contentRef.current; if (el && el.scrollTop < 4) el.scrollTop = 0; }}
                  />
                )}
                {/* Palette-tinted gradients (uses theme primary/wine) to blend, not black-hollow */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-transparent to-primary/20 mix-blend-multiply" />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />

                {/* Capa vertical sobreposta */}
                {capaUrl && (
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-3 z-10">
                    <img
                      src={capaUrl}
                      alt={livro.titulo}
                      loading="eager"
                      fetchPriority="high"
                      decoding="async"
                      className="w-28 h-40 rounded-lg object-cover shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7)] ring-1 ring-white/10"
                      onLoad={() => { const el = contentRef.current; if (el && el.scrollTop < 4) el.scrollTop = 0; }}
                    />
                  </div>
                )}

              </div>

              <div className="px-5 pb-[calc(18px+var(--sai-bottom,0px))] space-y-4 max-w-2xl mx-auto pt-4">
                <div className="text-center space-y-1.5">
                  <h2 className="font-display text-lg sm:text-xl font-bold text-foreground leading-tight break-words px-2">
                    {livro.titulo}
                  </h2>
                  {livro.autor && (
                    <p className="text-sm text-muted-foreground">{livro.autor}</p>
                  )}
                  {livro.area && (
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium uppercase tracking-wider">
                        {livro.area}
                      </span>
                    </div>
                  )}
                </div>

                {/* Único botão de ação */}
                <div className="pt-1">
                  <Button
                    className="w-full h-14 text-lg font-semibold gap-2.5 rounded-2xl shadow-lg"
                    onClick={() => {
                      if (!canUse) { setGateOpen(true); return; }
                      setLerDialog(true);
                    }}
                    disabled={!hasPdf && !hasOnline}
                  >
                    <BookOpen className="w-5 h-5" />
                    Ler agora
                  </Button>

                  {livro.audioResumoUrl && (
                    <Button
                      variant="secondary"
                      className="w-full h-14 text-lg font-semibold gap-2.5 rounded-2xl shadow-sm mt-3 bg-secondary/80 hover:bg-secondary text-foreground border border-white/5"
                      onClick={() => {
                        haptic.selection();
                        tocarResumo(livro);
                        abrirPlayerResumo(true);
                      }}
                    >
                      <Headphones className="w-5 h-5 text-primary" />
                      Ouvir resumo
                    </Button>
                  )}
                </div>


                {/* Ficha técnica rápida — páginas, tempo médio, ano */}
                {(numPages || minutosLeitura || livro.anoLancamento) && (
                  <div className="grid grid-cols-3 gap-2">
                    <FichaItem
                      icon={Layers}
                      label="Páginas"
                      value={numPages ? String(numPages) : '—'}
                      loading={!numPages && !!livro.download}
                    />
                    <FichaItem
                      icon={Clock}
                      label="Leitura média"
                      value={formatarDuracao(minutosLeitura)}
                      loading={!minutosLeitura && !!livro.download}
                    />
                    <FichaItem
                      icon={Calendar}
                      label="Publicado"
                      value={livro.anoLancamento || '—'}
                    />
                  </div>
                )}

                {/* Tabs Sobre / Análise técnica — rounded */}
                <Tabs defaultValue="sobre" className="w-full">
                  <TabsList className="w-full grid grid-cols-2 bg-secondary/60 h-11 rounded-full p-1">
                    <TabsTrigger
                      value="sobre"
                      className="text-sm gap-1.5 rounded-full data-[state=active]:shadow-sm"
                    >
                      <Info className="w-4 h-4" />
                      Sobre
                    </TabsTrigger>
                    <TabsTrigger
                      value="analise"
                      className="text-sm gap-1.5 rounded-full data-[state=active]:shadow-sm"
                    >
                      <FileText className="w-4 h-4" />
                      Análise técnica
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="sobre" className="pt-4">
                    {sobreMarkdown ? (
                      <div className="text-[15px] text-foreground/85 leading-relaxed space-y-3 [&_p]:leading-relaxed [&_strong]:text-foreground [&_strong]:font-semibold">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {sobreMarkdown}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-[15px] text-muted-foreground text-center py-6">
                        Sinopse ainda não disponível para este livro.
                      </p>
                    )}
                  </TabsContent>

                  <TabsContent value="analise" className="pt-4 space-y-4">
                    {!temAnaliseTecnica && (
                      <p className="text-[15px] text-muted-foreground text-center py-6">
                        Análise técnica ainda não disponível para este livro.
                      </p>
                    )}
                    {(livro.anoLancamento || livro.editora) && (
                      <div className="grid grid-cols-2 gap-3">
                        {livro.anoLancamento && (
                          <InfoBlock label="Ano" value={livro.anoLancamento} />
                        )}
                        {livro.editora && (
                          <InfoBlock label="Editora" value={livro.editora} />
                        )}
                      </div>
                    )}

                    {livro.curiosidades && livro.curiosidades.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-display font-semibold uppercase tracking-widest text-primary/80">
                          Curiosidades
                        </h4>
                        <ul className="space-y-2">
                          {livro.curiosidades.map((c, i) => (
                            <li
                              key={i}
                              className="text-[15px] text-foreground/85 leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold"
                            >
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analiseDetalhadaTexto && (
                      <>
                        <div className="h-px bg-border" />
                        <div className="space-y-2">
                          <h4 className="text-xs font-display font-semibold uppercase tracking-widest text-primary/80">
                            Análise detalhada
                          </h4>
                          <div className="text-[15px] text-foreground/85 leading-relaxed space-y-3 [&_p]:leading-relaxed [&_strong]:text-foreground [&_strong]:font-semibold">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {analiseDetalhadaTexto}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            </motion.div>
        )}
      </AnimatePresence>



      {/* Diálogo de escolha de modo */}
      <LerAgoraDialog
        open={lerDialog}
        onClose={() => setLerDialog(false)}
        onSelect={onSelectModo}
        hasPdf={hasPdf}
        hasOnline={hasOnline}
        pdfCached={pdfCached}
        downloadProgress={downloadingPdf}
      />

      {/* Leitores em fullscreen */}
      {readerMode === 'pdf' && (pdfUrlForReader || livro.download) && (
        <ErrorBoundary>
          <Suspense fallback={<div className="flex h-full items-center justify-center p-8 text-zinc-400">Carregando leitor...</div>}>
            {isDesktop ? (
              <PdfPaginatedReader
                url={pdfUrlForReader || livro.download!}
                titulo={livro.titulo}
                livroId={String(livro.id)}
                capaUrl={capaUrl}
                onClose={() => { setReaderMode(null); setPdfUrlForReader(null); }}
              />
            ) : (
              <PdfScrollReader
                url={pdfUrlForReader || livro.download!}
                titulo={livro.titulo}
                livroId={String(livro.id)}
                capaUrl={capaUrl}
                onClose={() => { setReaderMode(null); setPdfUrlForReader(null); }}
              />
            )}
          </Suspense>
        </ErrorBoundary>
      )}
      {readerMode === 'nativa' && livro.download && (
        <LeitorNativo
          livroId={String(livro.id)}
          livroTabela={livro.colecaoId}
          pdfUrl={livro.download}
          titulo={livro.titulo}
          autor={livro.autor}
          ano={livro.anoLancamento}
          editora={livro.editora}
          sobre={livro.sobre}
          curiosidades={livro.curiosidades}
          capa={livro.capa}
          onClose={() => setReaderMode(null)}
        />
      )}
      {readerMode === 'online' && livro.link && (
        <InAppWebView url={livro.link} titulo={livro.titulo} onClose={() => setReaderMode(null)} />
      )}

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
        livroId={String(livro.id)}
        livroArea={livro.colecaoId}
        livroTitulo={livro.titulo}
        livroCapa={capaUrl}
      />
    </>
  );

  if (inline) {
    return renderContent();
  }

  return createPortal(renderContent(), document.body);
};

const InfoBlock = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl bg-secondary/40 border border-border/50 p-3">
    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
      {label}
    </div>
    <div className="text-sm font-semibold text-foreground mt-0.5">{value}</div>
  </div>
);

const FichaItem = ({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  loading?: boolean;
}) => (
  <div className="rounded-2xl bg-secondary/40 border border-border/50 p-3 flex flex-col items-center justify-center text-center gap-1">
    <Icon className="w-4 h-4 text-primary/80" />
    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold leading-tight">
      {label}
    </div>
    <div className={`text-sm font-bold leading-tight ${loading ? 'text-muted-foreground/60 animate-pulse' : 'text-foreground'}`}>
      {loading ? '…' : value}
    </div>
  </div>
);

export default LivroDetailSheet;
