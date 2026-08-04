import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, Download, Loader2, FileWarning } from 'lucide-react';

interface Props {
  /** Conteúdo já baixado do documento (preview 100% offline, dentro do app). */
  blob: Blob;
  nome: string;
  mime: string;
  onClose: () => void;
  onBaixar?: () => void;
  baixando?: boolean;
}

type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'imagem'; url: string }
  | { tipo: 'pdf' }
  | { tipo: 'html'; html: string }
  | { tipo: 'texto'; texto: string }
  | { tipo: 'paragrafos'; linhas: string[] }
  | { tipo: 'indisponivel'; motivo: string };

const extensao = (nome: string) => (nome.split('.').pop() || '').toLowerCase();

/**
 * Leitor in-app dos modelos de documentos.
 * PDF é renderizado em canvas (pdf.js), DOCX é convertido para HTML (mammoth) e
 * imagens/textos abrem direto — nada depende de app externo nem de plugin do WebView.
 */
const DocumentoViewer = ({ blob, nome, mime, onClose, onBaixar, baixando }: Props) => {
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' });
  const pdfRef = useRef<HTMLDivElement>(null);

  const ext = useMemo(() => extensao(nome), [nome]);

  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = anterior;
    };
  }, []);

  useEffect(() => {
    let cancelado = false;
    let urlCriada: string | null = null;

    (async () => {
      try {
        if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'heic'].includes(ext)) {
          urlCriada = URL.createObjectURL(blob);
          if (!cancelado) setEstado({ tipo: 'imagem', url: urlCriada });
          return;
        }

        if (mime === 'application/pdf' || ext === 'pdf') {
          if (!cancelado) setEstado({ tipo: 'pdf' });
          return;
        }

        if (
          ext === 'docx' ||
          mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
          const mammoth: any = await import('mammoth/mammoth.browser');
          const buf = await blob.arrayBuffer();
          const { value } = await (mammoth.default ?? mammoth).convertToHtml({ arrayBuffer: buf });
          if (!cancelado) setEstado({ tipo: 'html', html: value });
          return;
        }

        if (mime.startsWith('text/') || ['txt', 'md', 'csv', 'rtf'].includes(ext)) {
          const texto = await blob.text();
          if (!cancelado) setEstado({ tipo: 'texto', texto });
          return;
        }

        if (ext === 'doc' || mime === 'application/msword') {
          // .doc é o formato binário legado do Word: extraímos o texto real do stream.
          const { extrairTextoDoc } = await import('@/lib/documentos/docLegado');
          const linhas = await extrairTextoDoc(blob);
          if (!cancelado) {
            setEstado(
              linhas && linhas.length > 0
                ? { tipo: 'paragrafos', linhas }
                : {
                    tipo: 'indisponivel',
                    motivo: 'Este modelo está no formato antigo do Word (.doc). Baixe para abrir no editor.',
                  },
            );
          }
          return;
        }

        if (!cancelado)
          setEstado({
            tipo: 'indisponivel',
            motivo: 'Não é possível pré-visualizar este formato. Baixe o arquivo para abri-lo.',
          });
      } catch (e) {
        console.error('preview documento:', e);
        if (!cancelado)
          setEstado({
            tipo: 'indisponivel',
            motivo: 'Não consegui montar a pré-visualização deste arquivo. Baixe para abri-lo.',
          });
      }
    })();

    return () => {
      cancelado = true;
      if (urlCriada) URL.revokeObjectURL(urlCriada);
    };
  }, [blob, mime, ext]);

  // Renderização do PDF em canvas
  useEffect(() => {
    if (estado.tipo !== 'pdf') return;
    let cancelado = false;

    (async () => {
      try {
        const pdfjsLib: any = await import('pdfjs-dist');
        const workerMod: any = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
        if (pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = workerMod.default;
        }
        const data = new Uint8Array(await blob.arrayBuffer());
        const pdf = await pdfjsLib.getDocument({ data }).promise;
        const alvo = pdfRef.current;
        if (!alvo || cancelado) return;
        alvo.innerHTML = '';
        const largura = Math.min(alvo.clientWidth || 360, 900);

        for (let n = 1; n <= pdf.numPages; n++) {
          if (cancelado) return;
          const page = await pdf.getPage(n);
          const base = page.getViewport({ scale: 1 });
          const escala = (largura / base.width) * Math.min(window.devicePixelRatio || 1, 2);
          const viewport = page.getViewport({ scale: escala });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = '100%';
          canvas.style.height = 'auto';
          canvas.className = 'mb-3 rounded-xl bg-white shadow-sm';
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          await page.render({ canvasContext: ctx, viewport }).promise;
          if (cancelado) return;
          alvo.appendChild(canvas);
        }
      } catch (e) {
        console.error('preview pdf:', e);
        if (!cancelado)
          setEstado({
            tipo: 'indisponivel',
            motivo: 'Não consegui abrir este PDF aqui. Baixe o arquivo para lê-lo.',
          });
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [estado.tipo, blob]);

  return createPortal(
    <div className="fixed inset-0 z-[95] flex flex-col bg-background">
      <div className="flex items-start gap-3 border-b border-border/60 px-3 pt-[calc(env(safe-area-inset-top)+10px)] pb-3">
        <button
          onClick={onClose}
          aria-label="Voltar"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-card active:scale-95 transition"
        >
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </button>
        <p className="min-w-0 flex-1 break-words pt-1 font-display text-[15px] font-normal leading-snug text-foreground">
          {nome}
        </p>
        {onBaixar && (
          <button
            onClick={onBaixar}
            disabled={baixando}
            aria-label="Baixar documento"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-card active:scale-95 transition disabled:opacity-60"
          >
            {baixando ? (
              <Loader2 className="h-5 w-5 animate-spin text-foreground" />
            ) : (
              <Download className="h-5 w-5 text-foreground" />
            )}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain bg-muted/30 px-3 py-3">
        {estado.tipo === 'carregando' && (
          <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="font-body text-sm">Preparando a pré-visualização…</span>
          </div>
        )}

        {estado.tipo === 'imagem' && (
          <img src={estado.url} alt={nome} className="mx-auto w-full rounded-xl object-contain" />
        )}

        {estado.tipo === 'pdf' && (
          <div ref={pdfRef} className="mx-auto w-full max-w-[900px]">
            <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="font-body text-sm">Renderizando páginas…</span>
            </div>
          </div>
        )}

        {estado.tipo === 'html' && (
          <div className="mx-auto w-full max-w-[900px] rounded-2xl border border-border/60 bg-card p-5">
            <div
              className="doc-preview font-body text-[15px] leading-relaxed text-foreground"
              dangerouslySetInnerHTML={{ __html: estado.html }}
            />
          </div>
        )}

        {estado.tipo === 'paragrafos' && (
          <div className="mx-auto w-full max-w-[820px] rounded-2xl border border-border/60 bg-card px-5 py-7 sm:px-9 sm:py-10">
            {estado.linhas.map((linha, i) => {
              const semAcento = linha.replace(/[^A-Za-zÀ-ÿ]/g, '');
              const titulo =
                linha.length <= 120 &&
                semAcento.length > 2 &&
                semAcento === semAcento.toUpperCase();
              return titulo ? (
                <p
                  key={i}
                  className="mb-4 text-center font-display text-[15.5px] font-normal uppercase leading-snug tracking-wide text-foreground"
                >
                  {linha}
                </p>
              ) : (
                <p
                  key={i}
                  className="mb-3.5 indent-8 text-justify font-body text-[15.5px] leading-[1.75] text-foreground/90"
                >
                  {linha}
                </p>
              );
            })}
          </div>
        )}

        {estado.tipo === 'texto' && (
          <div className="mx-auto w-full max-w-[900px] rounded-2xl border border-border/60 bg-card p-5">
            <pre className="whitespace-pre-wrap break-words font-body text-[14.5px] leading-relaxed text-foreground">
              {estado.texto}
            </pre>
          </div>
        )}

        {estado.tipo === 'indisponivel' && (
          <div className="mx-auto mt-10 max-w-[340px] rounded-2xl border border-border/60 bg-card p-6 text-center">
            <FileWarning className="mx-auto h-9 w-9 text-muted-foreground/70" />
            <p className="mt-3 font-display text-[16px] font-normal text-foreground">Pré-visualização indisponível</p>
            <p className="mt-1 font-body text-[13px] text-muted-foreground">{estado.motivo}</p>
            {onBaixar && (
              <button
                onClick={onBaixar}
                disabled={baixando}
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-body text-[14px] font-semibold text-primary-foreground active:scale-95 transition disabled:opacity-60"
              >
                {baixando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Baixar documento
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default DocumentoViewer;
