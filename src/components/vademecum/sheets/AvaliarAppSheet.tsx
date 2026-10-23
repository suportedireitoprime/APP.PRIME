/**
 * Bottom-sheet "Avaliar o app" — sobe de baixo para cima.
 *
 * Fluxo:
 *  1. Pergunta se está gostando.
 *  2. Se sim: dispara o prompt nativo do Play/App Store (In-App Review).
 *     Se falhar ou for web, abre a página da loja em nova aba.
 *  3. Se não: abre o SuporteSheet para a pessoa relatar o problema.
 */
import { AnimatePresence, motion } from 'framer-motion';
import { Star, X, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { requestReviewNow } from '@/lib/inAppReview';
import { openExternal } from '@/lib/nativeBrowser';

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456';
const PLAY_MARKET_URL =
  'market://details?id=br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456';
const APP_STORE_URL = 'https://apps.apple.com/br/app/vacatio/id6793608690';
const APP_STORE_REVIEW_URL =
  'https://apps.apple.com/br/app/vacatio/id6793608690?action=write-review';
const APP_STORE_NATIVE_URL =
  'itms-apps://itunes.apple.com/app/id6793608690?action=write-review';

/**
 * Detecta se o usuário está em ambiente Apple (iOS nativo ou Safari/navegador no iPhone/iPad).
 */
function isIosPlatform(): boolean {
  if (Capacitor.getPlatform() === 'ios') return true;
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent || '';
    if (/iphone|ipad|ipod/i.test(ua)) return true;
    if (
      /macintosh/i.test(ua) &&
      typeof navigator.maxTouchPoints === 'number' &&
      navigator.maxTouchPoints > 1
    ) {
      return true;
    }
  }
  return false;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onFeedback?: () => void; // abre suporte quando "não estou gostando"
}

/**
 * Redireciona o usuário para o aplicativo da loja fora do app.
 */
async function openStoreFallback() {
  const isIos = isIosPlatform();
  const webUrl = isIos ? APP_STORE_REVIEW_URL : PLAY_STORE_URL;
  const nativeAppUrl = isIos ? APP_STORE_NATIVE_URL : PLAY_MARKET_URL;

  // 1. Se estiver no app nativo (Capacitor Android / iOS), tenta abrir o app da loja diretamente
  if (Capacitor.isNativePlatform()) {
    try {
      const { AppLauncher } = await import('@capacitor/app-launcher');
      await AppLauncher.openUrl({ url: nativeAppUrl });
      return;
    } catch {
      /* segue para tentar via webUrl */
    }

    try {
      const { AppLauncher } = await import('@capacitor/app-launcher');
      await AppLauncher.openUrl({ url: webUrl });
      return;
    } catch {
      /* segue para browser */
    }
  }

  // 2. No navegador Web, PWA ou fallback geral: abre fora do app
  try {
    const win = window.open(webUrl, '_blank', 'noopener,noreferrer');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      window.location.href = webUrl;
    }
  } catch {
    window.location.href = webUrl;
  }
}

const AvaliarAppSheet = ({ open, onClose, onFeedback }: Props) => {
  const handleGostei = async () => {
    // Fecha o sheet primeiro
    onClose();
    
    // Loga o clique intencional do usuário no botão de avaliar
    void import('@/lib/appEvents').then(({ logDb }) => {
      logDb('avaliacao_loja_click');
    });

    toast.success('Redirecionando para a loja para você avaliar. Obrigado!');
    await openStoreFallback();
  };

  const handleNaoGostei = () => {
    onClose();
    onFeedback?.();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[2100] bg-black/80"
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Avaliar o aplicativo"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-[2101] bg-card border-t border-border rounded-t-3xl pb-[calc(var(--sai-bottom)+1rem)] max-w-lg mx-auto shadow-2xl"
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            <button
              onClick={onClose}
              aria-label="Fechar"
              className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/70 text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="px-6 pt-4 pb-2 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/15 flex items-center justify-center">
                <Star className="w-8 h-8 text-amber-400 fill-amber-400" strokeWidth={1.5} />
              </div>
              <div className="space-y-1.5">
                <h2 className="font-display text-xl text-foreground font-bold">
                  Está gostando do Direito Prime?
                </h2>
                <p className="font-body text-sm text-muted-foreground">
                  Sua avaliação ajuda muitos outros estudantes a nos encontrarem.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-1.5 py-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={handleGostei}
                    className="p-1 rounded-full hover:scale-125 transition-transform active:scale-95 focus:outline-none"
                    aria-label={`Avaliar com ${n} estrelas na loja`}
                  >
                    <Star
                      className="w-7 h-7 text-amber-400 fill-amber-400 drop-shadow-sm"
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="px-5 pb-5 pt-3 space-y-3">
              <button
                onClick={handleGostei}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-body font-semibold hover:brightness-110 active:scale-[0.98] transition-all shadow-md shadow-primary/25"
              >
                <ThumbsUp className="w-4 h-4" />
                Sim, quero avaliar na loja
              </button>
              <button
                onClick={handleNaoGostei}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary text-foreground/80 font-body text-sm hover:bg-secondary/70 active:scale-[0.98] transition-all"
              >
                <ThumbsDown className="w-4 h-4" />
                Prefiro dar uma sugestão
              </button>
              <button
                onClick={onClose}
                className="w-full py-2 text-xs font-body text-muted-foreground hover:text-foreground transition-colors"
              >
                Talvez mais tarde
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AvaliarAppSheet;
