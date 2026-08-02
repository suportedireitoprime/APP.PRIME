import { useEffect } from "react";
import { srcOf } from "@/lib/assetUrl";
import bgAsset from "@/assets/leis-cantadas-bg.webm.asset.json";
import capaAsset from "@/assets/leis-cantadas-cover.webp.asset.json";

export const VIDEO_URL = srcOf(bgAsset);
export const POSTER_URL = srcOf(capaAsset);

let precarregado = false;

/** Aquece o cache do vídeo (prefetch) assim que a tela monta. */
export function usePrewarmVideo() {
  useEffect(() => {
    if (precarregado) return;
    precarregado = true;
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "video";
    link.href = VIDEO_URL;
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
    const v = document.createElement("video");
    v.src = VIDEO_URL;
    v.muted = true;
    v.preload = "auto";
    v.load();
  }, []);
}

/** Vídeo de fundo em loop infinito, autoplay mudo. */
export function VideoCapa({ className = "", overlay = false }: { className?: string; overlay?: boolean }) {
  return (
    <span className={`relative block overflow-hidden ${className}`}>
      <video
        className="h-full w-full object-cover"
        src={VIDEO_URL}
        poster={POSTER_URL}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      {overlay && (
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      )}
    </span>
  );
}

/** Capa estática (imagem) — usada nas miniaturas. */
export function ImageCapa({ className = "", overlay = false }: { className?: string; overlay?: boolean }) {
  return (
    <span className={`relative block overflow-hidden ${className}`}>
      <img
        className="h-full w-full object-cover"
        src={POSTER_URL}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
      />
      {overlay && (
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      )}
    </span>
  );
}