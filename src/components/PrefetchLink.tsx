import { Link, LinkProps } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { prefetchNearby } from "@/lib/nearbyPrefetch";

export function PrefetchLink({ children, onMouseEnter, onTouchStart, to, ...props }: LinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [hasPrefetched, setHasPrefetched] = useState(false);

  useEffect(() => {
    if (hasPrefetched || typeof to !== 'string') return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          prefetchNearby(to);
          setHasPrefetched(true);
          observer.disconnect();
        }
      },
      { rootMargin: "50px" } // trigger slightly before it enters the viewport
    );

    if (linkRef.current) {
      observer.observe(linkRef.current);
    }

    return () => observer.disconnect();
  }, [to, hasPrefetched]);

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!hasPrefetched && typeof to === 'string') {
      prefetchNearby(to);
      setHasPrefetched(true);
    }
    onMouseEnter?.(e);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLAnchorElement>) => {
    if (!hasPrefetched && typeof to === 'string') {
      prefetchNearby(to);
      setHasPrefetched(true);
    }
    onTouchStart?.(e);
  };

  return (
    <Link
      ref={linkRef}
      to={to}
      onMouseEnter={handleMouseEnter}
      onTouchStart={handleTouchStart}
      {...props}
    >
      {children}
    </Link>
  );
}
