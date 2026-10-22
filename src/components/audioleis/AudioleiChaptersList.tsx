import React from "react";
import {
  Play,
  Volume2,
  ChevronRight,
  ListMusic,
  Layers,
  Sparkles,
} from "lucide-react";
import { haptic } from "@/lib/nativeHaptics";
import type { CapituloComAudiosData, NarracaoItem } from "./audioleiTypes";

interface AudioleiChaptersListProps {
  capitulos: CapituloComAudiosData[];
  currentArtigo: NarracaoItem | null;
  isPlaying: boolean;
  onOpenPlaylistSheet: (capitulo: CapituloComAudiosData) => void;
  onPlayWholeChapter: (capitulo: CapituloComAudiosData) => void;
  loading?: boolean;
}

export const AudioleiChaptersList: React.FC<AudioleiChaptersListProps> = ({
  capitulos,
  currentArtigo,
  isPlaying,
  onOpenPlaylistSheet,
  onPlayWholeChapter,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-28 bg-card/70 border border-border rounded-2xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (capitulos.length === 0) {
    return (
      <div className="p-12 text-center bg-card/60 border border-border rounded-3xl space-y-2">
        <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
        <h3 className="text-base font-bold text-foreground">Nenhum capítulo encontrado</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Tente outro termo na busca ou alterne para a aba de Artigos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {capitulos.map((itemData, idx) => {
        const {
          capitulo,
          realArtigos,
          audiosDisponiveis,
          totalArts,
          totalAudios,
          pctGravado,
        } = itemData;

        const rangeText =
          capitulo.primeiroArtigo && capitulo.ultimoArtigo
            ? capitulo.primeiroArtigo === capitulo.ultimoArtigo
              ? `(Art. ${capitulo.primeiroArtigo})`
              : `(Arts. ${capitulo.primeiroArtigo} a ${capitulo.ultimoArtigo})`
            : "";

        const isPlayingInThisChapter =
          Boolean(currentArtigo && isPlaying) &&
          realArtigos.some(
            (a) =>
              String(a.numero || "")
                .toLowerCase()
                .replace(/[^0-9a-z]/g, "") ===
              currentArtigo?.artigo_numero.toLowerCase().replace(/[^0-9a-z]/g, "")
          );

        return (
          <div
            key={capitulo.id || idx}
            onClick={() => {
              haptic.selection();
              onOpenPlaylistSheet(itemData);
            }}
            className={`group rounded-2xl transition-all duration-200 border overflow-hidden shadow-xs hover:shadow-md cursor-pointer ${
              isPlayingInThisChapter
                ? "bg-card border-primary/60 ring-2 ring-primary/30 shadow-lg shadow-primary/10"
                : "bg-card/85 border-border hover:border-border/90 hover:bg-card"
            }`}
          >
            <div className="w-full text-left flex items-stretch p-0">
              {/* Barra lateral colorida de destaque */}
              <div
                className={`w-2.5 shrink-0 transition-all ${
                  isPlayingInThisChapter
                    ? "bg-primary animate-pulse"
                    : "bg-primary/40 group-hover:bg-primary"
                }`}
              />

              <div className="p-4 sm:p-5 flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 shrink-0">
                      {capitulo.capituloHead || "CAPÍTULO"}
                    </span>
                    {capitulo.parentContext && (
                      <span className="text-[11px] text-muted-foreground font-medium truncate hidden sm:inline">
                        • {capitulo.parentContext}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isPlayingInThisChapter && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/40 text-[10px] font-bold tracking-wider uppercase animate-pulse">
                        <Volume2 className="w-3 h-3" />
                        <span>Tocando</span>
                      </span>
                    )}
                    <span
                      className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full border tabular-nums shrink-0 ${
                        totalAudios > 0
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {totalAudios > 0
                        ? `${totalAudios} ${totalAudios === 1 ? "áudio" : "áudios"}`
                        : "Em breve"}
                    </span>
                  </div>
                </div>

                {/* Título com tipografia nítida e sem distorções */}
                <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug tracking-normal font-sans group-hover:text-primary transition-colors">
                  {capitulo.capituloNome}
                </h3>

                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground/80">
                    {totalArts} {totalArts === 1 ? "artigo" : "artigos"}
                  </span>
                  {rangeText && <span>• {rangeText}</span>}
                </div>

                {/* Barra de progresso de gravação */}
                {totalArts > 0 && (
                  <div className="mt-2.5 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-secondary/80">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        totalAudios > 0
                          ? "bg-linear-to-r from-primary to-emerald-400"
                          : "bg-muted"
                      }`}
                      style={{
                        width: `${Math.max(totalAudios > 0 ? 8 : 0, pctGravado)}%`,
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Ações à direita: Tocar Capítulo Direto + Ver Playlist */}
              <div className="flex items-center gap-2 pr-4 sm:pr-5 shrink-0">
                {totalAudios > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      haptic.impact();
                      onPlayWholeChapter(itemData);
                    }}
                    title="Tocar capítulo completo a partir do primeiro artigo"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/20 hover:bg-primary text-primary hover:text-primary-foreground font-bold text-xs border border-primary/40 transition-all active:scale-95 cursor-pointer shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span className="hidden sm:inline">Ouvir Capítulo</span>
                  </button>
                )}

                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-secondary/80 group-hover:bg-primary/20 group-hover:text-primary text-muted-foreground flex items-center justify-center transition-all shadow-xs">
                  <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
