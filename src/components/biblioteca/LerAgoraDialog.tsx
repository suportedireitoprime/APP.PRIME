import { Smartphone, BookOpen, BookCopy, Download, Monitor, X, Check, Loader2, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

export type LerModo = 'nativa' | 'pdf' | 'online' | 'download' | 'desktop';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (modo: LerModo) => void;
  hasPdf: boolean;
  hasOnline: boolean;
  /** true se o PDF já foi baixado para offline no dispositivo */
  pdfCached?: boolean;
  /** progresso de download em %, null quando não está baixando */
  downloadProgress?: number | null;
}

const LerAgoraDialog = ({ open, onClose, onSelect, hasPdf, hasOnline, pdfCached, downloadProgress }: Props) => {
  const isDownloading = downloadProgress != null;
  const [online, setOnline] = useState<boolean>(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="ler-agora-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[1200] bg-black/70 flex items-center justify-center p-3 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ler-agora-title"
            className="relative w-full max-w-md rounded-3xl bg-card border border-border shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 pt-5">
              <h3 id="ler-agora-title" className="font-display text-base font-bold text-foreground">
                Escolha como ler
              </h3>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center"
                aria-label="Fechar"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>

            <div className="px-5 pb-5 space-y-3 mt-4">
              {hasPdf && (
                <>
                  {/* Leitura Nativa */}
                  <OptionRow
                    icon={Smartphone}
                    title="Leitura Nativa"
                    desc="Texto adaptado para a tela com busca inteligente."
                    onClick={() => onSelect('nativa')}
                    iconColor="text-primary"
                  />

                  {/* Ler em PDF */}
                  <OptionRow
                    icon={BookOpen}
                    title="Ler Arquivo Original (PDF)"
                    desc="Visualização idêntica ao documento original."
                    onClick={() => onSelect('pdf')}
                  />

                  {/* Baixar Offline */}
                  {Capacitor.isNativePlatform() && (
                    isDownloading ? (
                      <div className="w-full min-h-[64px] rounded-2xl bg-white/5 p-4 border border-white/10 flex flex-col justify-center">
                        <div className="flex items-center gap-3">
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          <div className="flex-1 text-sm font-semibold text-foreground">Baixando PDF… {downloadProgress}%</div>
                        </div>
                        <div className="mt-3 h-1.5 bg-background rounded-full overflow-hidden">
                          <div className="h-full bg-primary transition-all" style={{ width: `${downloadProgress}%` }} />
                        </div>
                      </div>
                    ) : pdfCached ? (
                      <OptionRow
                        icon={Check}
                        title="PDF disponível offline"
                        desc="Arquivo baixado no dispositivo."
                        onClick={() => onSelect('pdf')}
                        iconColor="text-emerald-400"
                      />
                    ) : (
                      <OptionRow
                        icon={Download}
                        title="Baixar para offline"
                        desc="Salva o PDF para ler sem internet."
                        onClick={() => onSelect('download')}
                      />
                    )
                  )}
                </>
              )}

              {/* Versão desktop */}
              {Capacitor.isNativePlatform() && (
                <OptionRow
                  icon={Monitor}
                  title="Versão desktop"
                  desc="Ler no computador com layout ampliado."
                  onClick={() => onSelect('desktop')}
                />
              )}

              {!hasPdf && !hasOnline && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Nenhum link de leitura disponível.
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

const OptionRow = ({
  icon: Icon,
  title,
  desc,
  onClick,
  iconColor = "text-muted-foreground",
}: {
  icon: typeof BookOpen;
  title: string;
  desc: string;
  onClick: () => void;
  iconColor?: string;
}) => (
  <button
    onClick={onClick}
    className="w-full min-h-[68px] rounded-2xl bg-white/5 hover:bg-white/10 active:scale-[0.99] p-4 text-left flex items-center gap-4 transition-all border border-white/10 hover:border-white/20"
  >
    <Icon className={`w-6 h-6 shrink-0 ${iconColor}`} strokeWidth={1.5} />
    <div className="flex-1 min-w-0">
      <div className="font-display font-semibold text-[15px] text-foreground">{title}</div>
      <div className="text-[12px] text-muted-foreground leading-snug mt-0.5">{desc}</div>
    </div>
  </button>
);

export default LerAgoraDialog;
