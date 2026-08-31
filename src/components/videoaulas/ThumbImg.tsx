import { useState, type ReactNode } from 'react';
import CoverAnimatedOverlay from './CoverAnimatedOverlay';
import { directImg } from '@/lib/cdnImg';

type Props = {
  src?: string | null;
  alt: string;
  fallback?: ReactNode;
  className?: string;
  /** Capas visíveis de cara devem carregar com prioridade (sem lazy). */
  priority?: boolean;
  /** Ativa elementos jurídicos flutuantes e folhas de louro caindo. */
  animatedOverlay?: boolean;
};

/** Capa com fallback, fade-in e overlay animado, usada nos cards de videoaulas. */
const ThumbImg = ({
  src,
  alt,
  fallback,
  className = '',
  priority = false,
  animatedOverlay = true,
}: Props) => {
  const [erro, setErro] = useState(false);
  const [carregou, setCarregou] = useState(false);

  if (!src || erro) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-muted">
        {fallback ?? null}
      </div>
    );
  }

  const cdnUrl = directImg(src, 320);

  return (
    <>
      <img
        src={cdnUrl}
        alt={alt}
        width={320}
        height={180}
        loading={priority ? 'eager' : 'lazy'}
        // @ts-expect-error atributo nativo do <img>
        fetchpriority={priority ? 'high' : 'low'}
        decoding="async"
        onLoad={() => setCarregou(true)}
        onError={() => setErro(true)}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
          carregou ? 'opacity-100' : 'opacity-0'
        } ${className}`}
      />
      {carregou && animatedOverlay && <CoverAnimatedOverlay />}
    </>
  );
};

export default ThumbImg;
