import React, { useState, useEffect } from "react";
import { Headphones } from "lucide-react";
import { cn } from "@/lib/utils";

interface CapaOtimizadaProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  animacaoEntrada?: boolean;
}

export const CapaOtimizada = React.memo(function CapaOtimizada({
  className,
  animacaoEntrada = false,
  src,
  alt,
  ...props
}: CapaOtimizadaProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={cn("relative overflow-hidden w-full h-full bg-zinc-900", className)}>
      {!loaded && !error && <div className="absolute inset-0 bg-white/5 animate-pulse" />}
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-linear-to-br from-zinc-900 via-zinc-950 to-primary/10 text-zinc-500 p-2 text-center select-none">
          <Headphones className="w-6 h-6 text-primary/60 mb-1" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 line-clamp-1">
            {alt || "Áudio"}
          </span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={cn(
            "w-full h-full object-cover transition-all duration-[800ms] ease-out",
            !loaded ? "opacity-0" : "opacity-100",
            animacaoEntrada && mounted && loaded ? "scale-100" : animacaoEntrada ? "scale-115" : "",
          )}
          {...props}
        />
      )}
    </div>
  );
});
