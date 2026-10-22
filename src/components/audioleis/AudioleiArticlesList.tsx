import React from "react";
import {
  Play,
  Pause,
  Volume2,
  BookOpen,
  CheckCircle2,
  Sparkles,
  Search,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { haptic } from "@/lib/nativeHaptics";
import type { NarracaoItem } from "./audioleiTypes";

interface AudioleiArticlesListProps {
  artigos: NarracaoItem[];
  currentArtigo: NarracaoItem | null;
  isPlaying: boolean;
  onPlayArticle: (item: NarracaoItem) => void;
  onOpenVadeMecum?: (artigoNum: string) => void;
  loading?: boolean;
}

export const AudioleiArticlesList: React.FC<AudioleiArticlesListProps> = ({
  artigos,
  currentArtigo,
  isPlaying,
  onPlayArticle,
  onOpenVadeMecum,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-24 bg-card/70 border border-border rounded-2xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (artigos.length === 0) {
    return (
      <div className="p-12 text-center bg-card/60 border border-border rounded-3xl space-y-2">
        <Volume2 className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
        <h3 className="text-base font-bold text-foreground">Nenhum artigo encontrado</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Tente outro termo na busca ou selecione outra lei no topo.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {artigos.map((item) => {
        const isThisPlaying =
          Boolean(currentArtigo && isPlaying) &&
          currentArtigo.artigo_numero.toLowerCase() === item.artigo_numero.toLowerCase();
        const isThisCurrent =
          Boolean(currentArtigo) &&
          currentArtigo.artigo_numero.toLowerCase() === item.artigo_numero.toLowerCase();

        return (
          <div
            key={item.artigo_numero}
            onClick={() => {
              haptic.selection();
              onPlayArticle(item);
            }}
            className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
              isThisPlaying
                ? "bg-primary/10 border-primary ring-2 ring-primary/40 shadow-lg shadow-primary/10"
                : isThisCurrent
                ? "bg-card border-primary/60"
                : "bg-card/80 hover:bg-card border-border hover:border-border/90 hover:shadow-md"
            }`}
          >
            {/* Lado esquerdo: Artigo e Texto */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold transition-all ${
                  isThisPlaying
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                    : isThisCurrent
                    ? "bg-primary/20 text-primary border border-primary/40"
                    : "bg-secondary/90 text-foreground group-hover:bg-primary/20 group-hover:text-primary"
                }`}
              >
                {isThisPlaying ? (
                  <span className="flex items-end gap-0.5 h-4">
                    <span className="w-1 bg-current rounded-full animate-[bounce_0.8s_infinite] h-3" />
                    <span className="w-1 bg-current rounded-full animate-[bounce_0.6s_infinite] h-4" />
                    <span className="w-1 bg-current rounded-full animate-[bounce_1s_infinite] h-2" />
                  </span>
                ) : (
                  <span className="text-xs font-mono">
                    Art. {item.artigo_numero.replace(/[^0-9A-Za-z-]/g, "")}
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                    Artigo {item.artigo_numero}
                  </span>
                  {isThisPlaying && (
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-primary/20 text-primary border border-primary/40 uppercase tracking-wider animate-pulse shrink-0">
                      Ouvindo
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {item.titulo_artigo || "Narração oficial em áudio de alta qualidade"}
                </p>
              </div>
            </div>

            {/* Lado direito: Botão Play com 1 Toque + Botão Vade Mecum */}
            <div className="flex items-center gap-2 shrink-0">
              {onOpenVadeMecum && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    haptic.selection();
                    onOpenVadeMecum(item.artigo_numero);
                  }}
                  title="Ler texto completo no Vade Mecum"
                  className="w-9 h-9 rounded-xl bg-secondary/60 hover:bg-white/10 text-muted-foreground hover:text-foreground flex items-center justify-center transition-all opacity-80 group-hover:opacity-100"
                >
                  <BookOpen className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  haptic.impact();
                  onPlayArticle(item);
                }}
                title={isThisPlaying ? "Pausar" : "Tocar Artigo"}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer shadow-sm ${
                  isThisPlaying
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                    : "bg-secondary/90 group-hover:bg-primary group-hover:text-primary-foreground text-foreground"
                }`}
              >
                {isThisPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
