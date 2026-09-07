import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { directImg } from '@/lib/cdnImg';
import fallbackCover from '@/assets/covers/fundamentos-da-lei.webp';
import { BookOpen, Maximize2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { getImageOfflineUrl, fetchAndCacheImageOffline } from '@/services/imageOfflineStore';
import { getOfflineCover } from '@/hooks/useBibliotecaAsset';
import { ImageLightboxModal } from './ImageLightboxModal';
import { haptic } from '@/lib/nativeHaptics';
import { recordImageLoadMetric } from '@/lib/imageTelemetry';

export interface PrimeImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  alt: string;
  /** Proporção geométrica fixa para eliminar 100% de Cumulative Layout Shift (CLS) */
  aspectRatio?: '2/3' | '16/9' | '1/1' | '3/4' | '4/3' | 'auto' | string;
  /** Largura máxima esperada para otimização de redimensionamento dinâmico (default: 400px) */
  targetWidth?: number;
  /** Se true, marca como imagem principal above-the-fold (LCP) com loading eager e alta prioridade */
  priority?: boolean;
  /** Imagem alternativa caso a principal falhe ou seja nula */
  fallbackSrc?: string;
  /** Ícone ou elemento customizado de fallback */
  fallbackIcon?: React.ReactNode;
  /** Texto ou sigla de fallback exibido sobre o gradiente */
  fallbackText?: string;
  /** Classe para o contêiner externo fixador de layout */
  containerClassName?: string;
  /** Se true, marca a imagem como puramente decorativa no leitor de tela (WCAG 2.2) */
  decorative?: boolean;
  /** Callback disparado quando a imagem estiver 100% decodificada e visível */
  onLoadComplete?: () => void;
  /** Se true, permite abrir a imagem em tela cheia com zoom tátil (Item 64) */
  zoomable?: boolean;
  /** Título opcional exibido no topo do Lightbox */
  zoomTitle?: string;
  /** Subtítulo opcional exibido no topo do Lightbox */
  zoomSubtitle?: string;
}

const ASPECT_RATIO_CLASSES: Record<string, string> = {
  '2/3': 'aspect-[2/3]',
  '16/9': 'aspect-video',
  '1/1': 'aspect-square',
  '3/4': 'aspect-[3/4]',
  '4/3': 'aspect-[4/3]',
  'auto': '',
};

/**
 * PrimeImage - Componente Universal de Imagem e Capa do APP.PRIME.
 * 
 * Benefícios de Engenharia:
 * 1. Zero Cumulative Layout Shift (CLS < 0.01) garantido por aspect-ratio e container estrito.
 * 2. Otimização automática de LCP via fetchPriority="high" e loading="eager" quando priority=true.
 * 3. Lazy loading nativo e decoding="async" desacoplado da thread da UI para rolagem a 120fps.
 * 4. Redimensionamento dinâmico via directImg() evitando download de imagens 4K em cards pequenos.
 * 5. Skeleton escuro grafite (sem flashes brancos em tema escuro) com transição de opacidade suave.
 * 6. Fallback gracioso com auto-recuperação em IndexedDB / bundle offline antes da capa de contingência.
 */
export const PrimeImage = React.memo(function PrimeImage({
  src,
  alt,
  aspectRatio = '2/3',
  targetWidth = 400,
  priority = false,
  fallbackSrc = fallbackCover,
  fallbackIcon,
  fallbackText,
  className,
  containerClassName,
  decorative = false,
  onLoadComplete,
  onError,
  zoomable = false,
  zoomTitle,
  zoomSubtitle,
  onClick,
  ...rest
}: PrimeImageProps) {
  const [attemptLevel, setAttemptLevel] = useState<'optimized' | 'raw' | 'offline' | 'fallback'>('optimized');
  const [offlineCandidateSrc, setOfflineCandidateSrc] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const mountTimeRef = useRef<number>(Date.now());
  const hasRetriedRef = useRef<boolean>(false);
  const activeSrcRef = useRef<string | null>(null);

  // Sanitização de URL: evita requisições GET /undefined quando src é inválido
  const cleanSrc = src && typeof src === 'string' && src.trim().length > 0 ? src.trim() : null;
  const optimizedSrc = cleanSrc ? directImg(cleanSrc, targetWidth) : null;

  let activeSrc: string | null = null;
  if (attemptLevel === 'optimized') {
    activeSrc = optimizedSrc || cleanSrc || fallbackSrc || null;
  } else if (attemptLevel === 'raw') {
    activeSrc = cleanSrc || fallbackSrc || null;
  } else if (attemptLevel === 'offline') {
    activeSrc = offlineCandidateSrc || fallbackSrc || null;
  } else {
    activeSrc = fallbackSrc || null;
  }

  const hasFailed = attemptLevel === 'fallback';

  useEffect(() => {
    setIsLoaded(false);
    setAttemptLevel('optimized');
    setOfflineCandidateSrc(null);
    mountTimeRef.current = Date.now();
    hasRetriedRef.current = false;
  }, [src]);

  // Fase 18: Revogação de Object URLs retidas no unmount (Item 33 — zero memory leak)
  useEffect(() => {
    return () => {
      // Revoga apenas object URLs geradas localmente (blob: ou data:)
      const lastSrc = activeSrcRef.current;
      if (lastSrc && lastSrc.startsWith('blob:')) {
        try { URL.revokeObjectURL(lastSrc); } catch {}
      }
    };
  }, []);

  // Mantém referência atualizada do activeSrc para cleanup
  useEffect(() => {
    activeSrcRef.current = activeSrc;
  }, [activeSrc]);

  const handleLoad = () => {
    setIsLoaded(true);
    const durationMs = Date.now() - mountTimeRef.current;
    if (activeSrc) {
      recordImageLoadMetric(activeSrc, durationMs);
    }
    onLoadComplete?.();

    // Sincronização offline em background (apenas na Web/PWA e se conectado)
    if (
      cleanSrc &&
      cleanSrc.startsWith('http') &&
      typeof window !== 'undefined' &&
      !Capacitor.isNativePlatform() &&
      typeof navigator !== 'undefined' &&
      navigator.onLine
    ) {
      fetchAndCacheImageOffline(cleanSrc).catch(() => {});
    }
  };

  const handleError = async (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // 1. Tenta a URL bruta caso a transformação da CDN/Supabase retorne erro transitório
    if (attemptLevel === 'optimized' && cleanSrc && optimizedSrc !== cleanSrc) {
      setAttemptLevel('raw');
      return;
    }

    // 2. Tenta auto-recuperação offline: verifica bundle estático e IndexedDB
    if (attemptLevel === 'raw' || (attemptLevel === 'optimized' && optimizedSrc === cleanSrc)) {
      if (cleanSrc) {
        const bundled = await getOfflineCover(cleanSrc);
        if (bundled) {
          setOfflineCandidateSrc(bundled);
          setAttemptLevel('offline');
          return;
        }
        const idb = await getImageOfflineUrl(cleanSrc);
        if (idb) {
          setOfflineCandidateSrc(idb);
          setAttemptLevel('offline');
          return;
        }
      }
    }

    // 3. Auto-retry resiliente com backoff de 1.2s antes de cair no fallback final
    if (!hasRetriedRef.current && cleanSrc) {
      hasRetriedRef.current = true;
      setTimeout(() => {
        setAttemptLevel('raw');
      }, 1200);
      return;
    }

    if (attemptLevel !== 'fallback') {
      setAttemptLevel('fallback');
      onError?.(e);
    }
  };

  const aspectClass = ASPECT_RATIO_CLASSES[aspectRatio] || '';
  const customAspectStyle = !aspectClass && aspectRatio !== 'auto' ? { aspectRatio } : undefined;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomable && activeSrc) {
      haptic.light();
      setIsLightboxOpen(true);
    }
    onClick?.(e as unknown as React.MouseEvent<HTMLImageElement>);
  };

  return (
    <>
      <div
        onClick={handleClick}
        className={cn(
          "relative overflow-hidden bg-zinc-900/90 w-full select-none transform-gpu backface-hidden contrast-more:border contrast-more:border-amber-400/80 contrast-more:ring-1",
          zoomable && "cursor-zoom-in group/prime-zoom",
          aspectClass,
          containerClassName
        )}
        style={customAspectStyle}
        data-prime-image="true"
      >
        {/* Skeleton de alta precisão calibrado para o tema dark (Zero Flash Branco) */}
        {!isLoaded && !hasFailed && (
          <div 
            aria-hidden="true" 
            className="absolute inset-0 bg-gradient-to-br from-zinc-900/90 via-zinc-800/50 to-zinc-900/90 animate-pulse z-0" 
          />
        )}

        {/* Indicador de Zoom no Hover */}
        {zoomable && isLoaded && !hasFailed && (
          <div
            aria-hidden="true"
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white/90 opacity-0 group-hover/prime-zoom:opacity-100 transition-opacity z-20 backdrop-blur-sm pointer-events-none"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </div>
        )}

      {/* Renderização da Imagem Otimizada */}
      {activeSrc ? (
        <img
          src={activeSrc}
          alt={decorative ? "" : (alt || "")}
          aria-hidden={decorative ? "true" : undefined}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          // @ts-expect-error React 18 / 19 fetchPriority compatibility
          fetchpriority={priority ? "high" : "low"}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300 ease-out relative z-10 transform-gpu will-change-transform",
            !isLoaded && !hasFailed ? "opacity-0" : "opacity-100",
            className
          )}
          crossOrigin="anonymous"
          {...rest}
        />
      ) : (
        /* Fallback resiliente com textura editorial e monograma jurídico */
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 text-zinc-400 z-10 border border-white/5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-2 shadow-inner">
            {fallbackIcon || <BookOpen className="w-6 h-6 text-amber-400/90" strokeWidth={1.8} />}
          </div>
          {(fallbackText || alt) && (
            <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-300 max-w-[90%] line-clamp-2 leading-tight">
              {fallbackText || alt}
            </span>
          )}
        </div>
      )}
      </div>

      {/* Lightbox Modal com Zoom Tátil quando zoomable=true */}
      {zoomable && (
        <ImageLightboxModal
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          src={cleanSrc || activeSrc}
          alt={alt}
          title={zoomTitle || alt}
          subtitle={zoomSubtitle}
        />
      )}
    </>
  );
});

export default PrimeImage;
