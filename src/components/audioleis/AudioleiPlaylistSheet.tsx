import React, { useState, useMemo } from "react";
import {
  Play,
  Pause,
  Volume2,
  Headphones,
  Search,
  X,
  ListMusic,
  Clock,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { haptic } from "@/lib/nativeHaptics";
import type { LeiCapituloItem } from "@/lib/leiStructure";
import type { ArtigoLei } from "@/data/mockData";
import { formatArtigoNumeroOnly } from "@/lib/leiStructure";

export interface CapituloComAudiosData {
  capitulo: LeiCapituloItem;
  realArtigos: ArtigoLei[];
  audiosDisponiveis: Array<{ artigo: ArtigoLei; narracao: NarracaoItem }>;
  totalArts: number;
  totalAudios: number;
  pctGravado: number;
}

export interface NarracaoItem {
  artigo_numero: string;
  audio_url: string;
  titulo_artigo?: string;
  word_timings?: unknown;
}

interface AudioleiPlaylistSheetProps {
  isOpen: boolean;
  onClose: () => void;
  capituloData: CapituloComAudiosData | null;
  leiNome: string;
  leiSigla: string;
  audioMap: Map<string, NarracaoItem>;
  currentArtigo: NarracaoItem | null;
  isPlaying: boolean;
  onPlayAudio: (narracao: NarracaoItem) => void;
  onTogglePlay: () => void;
}

export const AudioleiPlaylistSheet: React.FC<AudioleiPlaylistSheetProps> = ({
  isOpen,
  onClose,
  capituloData,
  leiNome,
  leiSigla,
  audioMap,
  currentArtigo,
  isPlaying,
  onPlayAudio,
  onTogglePlay,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const realArtigos = capituloData?.realArtigos ?? [];

  // Verifica se o artigo que está tocando pertence a este capítulo
  const isPlayingInThisChapter = useMemo(() => {
    if (!currentArtigo || !isPlaying || !realArtigos.length) return false;
    return realArtigos.some((a) => {
      const numClean = formatArtigoNumeroOnly(a.numero).toLowerCase();
      return numClean === currentArtigo.artigo_numero.toLowerCase();
    });
  }, [currentArtigo, isPlaying, realArtigos]);

  // Filtra artigos dentro do capítulo pela busca interna
  const filteredArtigos = useMemo(() => {
    if (!realArtigos.length) return [];
    if (!searchQuery.trim()) return realArtigos;
    const q = searchQuery.toLowerCase().trim().replace(/^art(?:igo|\.)?\s*/i, "");
    return realArtigos.filter((art) => {
      const numClean = formatArtigoNumeroOnly(art.numero).toLowerCase();
      const caput = (art.caput || "").toLowerCase();
      return numClean.includes(q) || caput.includes(q);
    });
  }, [realArtigos, searchQuery]);

  if (!capituloData) return null;

  const {
    capitulo,
    audiosDisponiveis,
    totalArts,
    totalAudios,
  } = capituloData;

  const rangeText =
    capitulo.primeiroArtigo && capitulo.ultimoArtigo
      ? capitulo.primeiroArtigo === capitulo.ultimoArtigo
        ? `Art. ${capitulo.primeiroArtigo}`
        : `Arts. ${capitulo.primeiroArtigo} a ${capitulo.ultimoArtigo}`
      : "";

  const handlePlayFirstAvailable = () => {
    haptic.impact();
    if (isPlayingInThisChapter) {
      onTogglePlay();
      return;
    }
    if (audiosDisponiveis.length > 0) {
      onPlayAudio(audiosDisponiveis[0].narracao);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="h-[90vh] sm:h-[84vh] max-h-[880px] p-0 rounded-t-[28px] border-t border-border bg-[#0d0f12]/98 backdrop-blur-2xl shadow-2xl flex flex-col overflow-hidden outline-none z-[100]"
      >
        {/* Puxador tátil (Drag indicator) */}
        <div className="pt-2.5 pb-1 flex justify-center shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Cabeçalho da Playlist */}
        <div className="px-5 sm:px-6 pt-2 pb-4 border-b border-border/60 shrink-0 bg-background/40">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5 min-w-0 flex-1">
              {/* Badge/Miniatura da Lei */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-linear-to-br from-primary/30 via-primary/10 to-amber-500/10 border border-primary/30 flex flex-col items-center justify-center shrink-0 shadow-lg shadow-black/40">
                <span className="text-xs sm:text-sm font-black text-primary tracking-wider uppercase">
                  {leiSigla || "LEI"}
                </span>
                <ListMusic className="w-3.5 h-3.5 text-primary/80 mt-0.5" />
              </div>

              {/* Informações do Capítulo */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                    {capitulo.capituloHead || "CAPÍTULO"}
                  </span>
                  {rangeText && (
                    <span className="text-xs text-muted-foreground font-medium">
                      • {rangeText}
                    </span>
                  )}
                  {capitulo.parentContext && (
                    <span className="text-xs text-muted-foreground/80 truncate hidden md:inline">
                      • {capitulo.parentContext}
                    </span>
                  )}
                </div>

                <h2 className="text-base sm:text-xl font-bold text-foreground leading-snug tracking-normal line-clamp-2">
                  {capitulo.capituloNome}
                </h2>

                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/80">
                    {leiNome}
                  </span>
                  <span>•</span>
                  <span>
                    {totalArts} {totalArts === 1 ? "artigo" : "artigos"}
                  </span>
                  <span>•</span>
                  <span
                    className={
                      totalAudios > 0
                        ? "text-emerald-400 font-semibold"
                        : "text-muted-foreground"
                    }
                  >
                    {totalAudios}{" "}
                    {totalAudios === 1 ? "áudio disponível" : "áudios disponíveis"}
                  </span>
                </div>
              </div>
            </div>

            {/* Botão Fechar com estilo padrão do app */}
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                onClose();
              }}
              className="w-10 h-10 rounded-full bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0 transition-transform active:scale-95 border border-border/40"
              aria-label="Fechar playlist"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Barra de Ações Rápidas: Tocar Tudo & Busca */}
          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border/40">
            {audiosDisponiveis.length > 0 && (
              <Button
                variant="default"
                size="default"
                onClick={handlePlayFirstAvailable}
                className="gap-2.5 font-bold shadow-lg shadow-primary/25 h-11 px-5 rounded-xl shrink-0 transition-transform active:scale-95"
              >
                {isPlayingInThisChapter ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Pausar Capítulo</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                    <span>Tocar Capítulo</span>
                  </>
                )}
              </Button>
            )}

            {/* Input de filtro interno */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar artigo neste capítulo..."
                className="pl-9.5 pr-8 h-11 bg-secondary/50 border-border/60 text-sm rounded-xl focus-visible:ring-primary/40"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Lista de Artigos Estilo Playlist (Spotify / Apple Music) */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-2.5 divide-y divide-border/20">
          {filteredArtigos.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Search className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">Nenhum artigo encontrado</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tente buscar por outro número ou palavra-chave.
              </p>
            </div>
          ) : (
            filteredArtigos.map((art, idx) => {
              const numClean = formatArtigoNumeroOnly(art.numero);
              const narracao =
                audioMap.get(numClean.toLowerCase()) ||
                audioMap.get(String(art.numero).trim().toLowerCase());
              const isSelected =
                currentArtigo?.artigo_numero.toLowerCase() ===
                numClean.toLowerCase();
              const activeThis = isSelected && isPlaying;
              const hasAudio = Boolean(narracao);

              return (
                <div
                  key={art.id || numClean || idx}
                  className={`pt-2.5 first:pt-0 group relative p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 flex items-start gap-3.5 ${
                    isSelected
                      ? "bg-primary/10 border-primary/50 shadow-md shadow-primary/10 ring-1 ring-primary/30"
                      : "bg-card/70 border-border/70 hover:border-border hover:bg-card"
                  }`}
                >
                  {/* Botão Play / Indicador Numérico */}
                  <div className="shrink-0 pt-0.5">
                    {hasAudio ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          haptic.selection();
                          if (isSelected) {
                            onTogglePlay();
                          } else if (narracao) {
                            onPlayAudio(narracao);
                          }
                        }}
                        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
                          activeThis
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                            : "bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30"
                        }`}
                        aria-label={
                          activeThis
                            ? `Pausar Artigo ${numClean}`
                            : `Tocar Artigo ${numClean}`
                        }
                      >
                        {activeThis ? (
                          <div className="flex items-center gap-0.5">
                            <span className="w-1 h-3.5 bg-current rounded-full animate-pulse" />
                            <span
                              className="w-1 h-5 bg-current rounded-full animate-pulse"
                              style={{ animationDelay: "150ms" }}
                            />
                            <span
                              className="w-1 h-2 bg-current rounded-full animate-pulse"
                              style={{ animationDelay: "300ms" }}
                            />
                          </div>
                        ) : (
                          <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
                        )}
                      </Button>
                    ) : (
                      <div
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-secondary/50 border border-border/60 flex items-center justify-center text-muted-foreground/60 shrink-0"
                        title="Narração em gravação"
                      >
                        <Clock className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Detalhes do Artigo (Faixa da Playlist) */}
                  <div
                    className="min-w-0 flex-1 cursor-pointer"
                    onClick={() => {
                      if (hasAudio && narracao) {
                        haptic.selection();
                        if (isSelected) {
                          onTogglePlay();
                        } else {
                          onPlayAudio(narracao);
                        }
                      }
                    }}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm sm:text-base font-bold tracking-tight ${
                            isSelected ? "text-primary" : "text-foreground"
                          }`}
                        >
                          Art. {numClean}
                        </span>
                        {activeThis && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-[10px] font-bold tracking-wider uppercase animate-pulse">
                            <Volume2 className="w-2.5 h-2.5" />
                            <span>Tocando</span>
                          </span>
                        )}
                      </div>

                      {hasAudio ? (
                        <span className="text-[10.5px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                          <Headphones className="w-3 h-3" />
                          <span>Áudio pronto</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-muted-foreground bg-muted/40 border border-border px-2 py-0.5 rounded-full shrink-0">
                          Em gravação
                        </span>
                      )}
                    </div>

                    {/* Texto Caput do Artigo */}
                    {art.caput ? (
                      <p className="text-xs sm:text-[13px] text-muted-foreground/90 font-normal leading-relaxed line-clamp-2 select-text">
                        {art.caput}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground/60 italic">
                        {narracao?.titulo_artigo || "Dispositivo legal"}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Espaçador de Safe Area no rodapé */}
          <div className="h-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]" />
        </div>
      </SheetContent>
    </Sheet>
  );
};
