import { useEffect, useRef, useState } from 'react';
import CircularGallery from './CircularGallery';
import { Loader2 } from 'lucide-react';

interface LazyCircularGalleryProps {
  items: any[];
  bend?: number;
  textColor?: string;
  borderRadius?: number;
  font?: string;
  scrollEase?: number;
  onItemClick?: (item: any) => void;
}

export function LazyCircularGallery({ items, bend = 1.5, ...rest }: LazyCircularGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Adicionamos rootMargin para que o carrossel comece a ser renderizado ANTES
    // de entrar totalmente na tela, evitando piscar para o usuário.
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin: '2500px' } 
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} style={{ height: '100%', position: 'relative', minHeight: '350px' }}>
      {isVisible ? (
        <CircularGallery items={items} bend={bend} {...rest} />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {/* Placeholder enquanto não está no viewport - não deve ser invasivo */}
          <Loader2 className="w-6 h-6 text-white/10 animate-spin" />
        </div>
      )}
    </div>
  );
}
