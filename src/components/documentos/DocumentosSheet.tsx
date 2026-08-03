import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Search, Eye, Download, Share2, Loader2,
  RefreshCw, FolderOpen, Folder,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFeatureLimit } from '@/hooks/useFeatureLimit';
import PremiumGate from '@/components/PremiumGate';
import { useConteudoPasta, useDownloadDocumento, type ItemDrive } from '@/hooks/useDocumentosDrive';
import { estiloPasta, formatarTamanho, extensaoDe } from '@/lib/documentosTipos';
import { baixarBlob } from '@/lib/nativo/baixarArquivo';
import { compartilhar } from '@/lib/nativo/compartilhar';
import DocumentoViewer from './DocumentoViewer';

interface Props {
  /** Pasta raiz da categoria escolhida na aba Documentos. */
  categoria: { id: string; nome: string } | null;
  open: boolean;
  onClose: () => void;
}

const FEATURE = 'documentos_download';

const DocumentosSheet = ({ categoria, open, onClose }: Props) => {
  const { user } = useAuth();
  const { config, isPremium, isAdmin, refresh } = useFeatureLimit(FEATURE);
  const [trilha, setTrilha] = useState<Array<{ id: string; nome: string }>>([]);
  const [busca, setBusca] = useState('');
  const [buscaDebounce, setBuscaDebounce] = useState('');
  const [gateOpen, setGateOpen] = useState(false);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [visualizando, setVisualizando] = useState<{ doc: ItemDrive; blob: Blob } | null>(null);
  const baixarBlobDoc = useDownloadDocumento();

  const atual = trilha[trilha.length - 1] ?? null;
  const { itens, isLoading, isError, error, refetch, isFetching, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useConteudoPasta(atual?.id ?? null, buscaDebounce);

  useEffect(() => {
    if (open && categoria) setTrilha([categoria]);
    if (!open) {
      setTrilha([]);
      setBusca('');
      setBuscaDebounce('');
      setVisualizando(null);
    }
  }, [open, categoria?.id]);

  useEffect(() => {
    const t = setTimeout(() => setBuscaDebounce(busca), 350);
    return () => clearTimeout(t);
  }, [busca]);

  const { pastas, arquivos } = useMemo(
    () => ({ pastas: itens.filter((i) => i.pasta), arquivos: itens.filter((i) => !i.pasta) }),
    [itens],
  );

  const estilo = estiloPasta(atual?.nome ?? '');
  const Icone = estilo.icon;

  const voltar = () => {
    if (trilha.length > 1) {
      setTrilha((t) => t.slice(0, -1));
      setBusca('');
      setBuscaDebounce('');
      return;
    }
    onClose();
  };

  const abrirPasta = (p: ItemDrive) => {
    setTrilha((t) => [...t, { id: p.id, nome: p.nome }]);
    setBusca('');
    setBuscaDebounce('');
  };

  /** Limite diário para quem não é assinante (o mesmo arquivo segue liberado no dia). */
  const podeUsar = async (docId: string): Promise<boolean> => {
    if (isAdmin || isPremium || !config?.enabled || !user) return true;
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from('feature_usage' as any)
      .select('scope_value')
      .eq('user_id', user.id)
      .eq('feature_key', FEATURE)
      .gte('used_at', inicio.toISOString());
    const linhas = ((data || []) as unknown) as Array<{ scope_value: string | null }>;
    if (linhas.some((l) => l.scope_value === docId)) return true;
    return linhas.length < (config.limit_value ?? 1);
  };

  const registrar = async (doc: ItemDrive) => {
    if (isAdmin || isPremium || !config?.enabled || !user) return;
    await supabase.from('feature_usage' as any).insert({
      user_id: user.id,
      feature_key: FEATURE,
      scope_value: doc.id,
      ref_key: doc.nome,
    });
    refresh();
  };

  const comLimite = async (doc: ItemDrive, acao: () => Promise<void>) => {
    if (!(await podeUsar(doc.id))) {
      setGateOpen(true);
      return;
    }
    setOcupado(doc.id);
    try {
      await acao();
      await registrar(doc);
    } catch (e) {
      console.error('documento:', e);
      toast.error('Não consegui abrir este documento');
    } finally {
      setOcupado(null);
    }
  };

  const ver = (doc: ItemDrive) =>
    comLimite(doc, async () => {
      const blob = await baixarBlobDoc(doc.id);
      setVisualizando({ doc, blob });
    });


  const baixar = (doc: ItemDrive) =>
    comLimite(doc, async () => {
      const blob = await baixarBlobDoc(doc.id);
      await baixarBlob(blob, doc.nome, { titulo: doc.nome });
    });

  const enviar = (doc: ItemDrive) =>
    comLimite(doc, async () => {
      const blob = await baixarBlobDoc(doc.id);
      await compartilhar({ titulo: doc.nome, texto: doc.nome, arquivo: { blob, nome: doc.nome } });
    });

  if (!open || !categoria) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 260 }}
        className="fixed inset-0 z-[80] flex flex-col bg-background"
      >
        {/* Cabeçalho */}
        <div className="flex items-center gap-3 border-b border-border/60 px-3 pt-[calc(env(safe-area-inset-top)+10px)] pb-3">
          <button
            onClick={voltar}
            aria-label="Voltar"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-card active:scale-95 transition"
          >
            <ChevronLeft className="h-6 w-6 text-foreground" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[18px] font-normal leading-tight text-foreground">{estilo.label}</p>
            <p className="truncate font-body text-[12px] text-muted-foreground">
              {trilha.length > 1
                ? trilha.slice(0, -1).map((t) => estiloPasta(t.nome).label).join(' › ')
                : `${pastas.length} subpastas · ${arquivos.length}${hasNextPage ? '+' : ''} modelos`}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            aria-label="Atualizar lista"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-card active:scale-95 transition"
          >
            <RefreshCw className={`h-5 w-5 text-muted-foreground ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Busca */}
        <div className="px-4 pt-3">
          <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card px-3 h-12">
            <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar nesta pasta pelo nome…"
              className="h-full w-full bg-transparent font-body text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-3">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="font-body text-sm">Carregando modelos…</span>
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-border/60 bg-card p-5 text-center">
              <p className="font-display text-[16px] font-normal text-foreground">Não consegui carregar os documentos</p>
              <p className="mt-1 font-body text-[13px] text-muted-foreground">
                Verifique se a pasta do Drive continua compartilhada com o app.
              </p>
              <p className="mt-2 font-body text-[11px] text-muted-foreground/70">
                {String((error as Error)?.message ?? '')}
              </p>
            </div>
          ) : itens.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <FolderOpen className="h-10 w-10 text-muted-foreground/60" />
              <p className="font-display text-[16px] font-normal text-foreground">Nada por aqui</p>
              <p className="max-w-[260px] font-body text-[13px] text-muted-foreground">
                Assim que novos arquivos forem adicionados à pasta, eles aparecem automaticamente.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Subpastas */}
              {pastas.map((p) => (
                <button
                  key={p.id}
                  onClick={() => abrirPasta(p)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-card p-3.5 text-left active:scale-[0.99] transition"
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${estilo.color}1f` }}
                  >
                    <Folder className="h-5 w-5" style={{ color: estilo.color }} strokeWidth={1.5} />
                  </div>
                  <span className="min-w-0 flex-1 break-words font-display text-[15.5px] font-normal leading-snug text-foreground">
                    {estiloPasta(p.nome).label}
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </button>
              ))}

              {/* Arquivos */}
              {arquivos.map((doc, i) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.015, 0.18) }}
                  className="rounded-2xl border border-border/60 bg-card p-3.5"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${estilo.color}1f` }}
                    >
                      <Icone className="h-5 w-5" style={{ color: estilo.color }} strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-display text-[15.5px] font-normal leading-snug text-foreground">
                        {doc.nome.replace(/\.[a-z0-9]{2,5}$/i, '')}
                      </p>
                      <p className="mt-0.5 font-body text-[11.5px] text-muted-foreground">
                        {[extensaoDe(doc.nome, doc.mime), formatarTamanho(doc.tamanho)].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <button
                      onClick={() => ver(doc)}
                      disabled={ocupado === doc.id}
                      className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary text-primary-foreground font-body text-[13px] font-semibold active:scale-95 transition disabled:opacity-60"
                    >
                      {ocupado === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                      Ver
                    </button>
                    <button
                      onClick={() => baixar(doc)}
                      disabled={ocupado === doc.id}
                      className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-background font-body text-[13px] font-semibold text-foreground active:scale-95 transition disabled:opacity-60"
                    >
                      <Download className="h-4 w-4" />
                      Baixar
                    </button>
                    <button
                      onClick={() => enviar(doc)}
                      disabled={ocupado === doc.id}
                      className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-background font-body text-[13px] font-semibold text-foreground active:scale-95 transition disabled:opacity-60"
                    >
                      <Share2 className="h-4 w-4" />
                      Enviar
                    </button>
                  </div>
                </motion.div>
              ))}

              {hasNextPage && (
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card font-body text-[14px] font-semibold text-foreground active:scale-95 transition disabled:opacity-60"
                >
                  {isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin" />}
                  Carregar mais modelos
                </button>
              )}
            </div>
          )}
        </div>

        {visualizando && (
          <DocumentoViewer
            nome={visualizando.doc.nome}
            blob={visualizando.blob}
            mime={visualizando.doc.mime}
            baixando={ocupado === visualizando.doc.id}
            onBaixar={async () => {
              setOcupado(visualizando.doc.id);
              try {
                await baixarBlob(visualizando.blob, visualizando.doc.nome, { titulo: visualizando.doc.nome });
              } catch (e) {
                console.error('download documento:', e);
                toast.error('Não consegui salvar este documento');
              } finally {
                setOcupado(null);
              }
            }}
            onClose={() => setVisualizando(null)}
          />
        )}


        <PremiumGate
          open={gateOpen}
          onClose={() => setGateOpen(false)}
          title="Documentos ilimitados"
          description="No plano gratuito você abre 1 documento por dia. Assine para baixar quantos modelos quiser."
        />

      </motion.div>
    </AnimatePresence>,
    document.body,
  );
};

export default DocumentosSheet;
