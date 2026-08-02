import { useState, type ReactNode } from 'react';

type Props = {
  src?: string | null;
  alt: string;
  fallback?: ReactNode;
  className?: string;
  /** Capas visíveis de cara devem carregar com prioridade (sem lazy). */
  priority?: boolean;
};

/** Capa com fallback e fade-in, usada nos cards de videoaulas. */
const ThumbImg = ({ src, alt, fallback, className = '', priority = false }: Props) => {
  const [erro, setErro] = useState(false);
  const [carregou, setCarregou] = useState(false);

  if (!src || erro) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-muted">
        {fallback ?? null}
      </div>
    );
  }

  return (
    <img
      src={src}
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
  );
};

export default ThumbImg;
