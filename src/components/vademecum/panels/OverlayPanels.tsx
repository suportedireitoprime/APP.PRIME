import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Loader2, ListMusic, Play, Pause, CheckCircle2, StickyNote } from 'lucide-react';
import ArtigoCard from '@/components/vademecum/artigo/ArtigoCard';
import type { ArtigoLei } from '@/data/mockData';

// ─── Favoritos Panel ───
interface FavPanelProps {
  artigos: ArtigoLei[];
  isArtigoFav: (a: ArtigoLei) => boolean;
  onOpenArtigo: (artigo: ArtigoLei) => void;
  accentColor: string;
  grifadoNumeros: Set<string>;
  anotadoNumeros: Set<string>;
}

export const FavPanel: React.FC<FavPanelProps> = React.memo(({ artigos, isArtigoFav, onOpenArtigo, accentColor, grifadoNumeros, anotadoNumeros }) => {
  const favArtigos = artigos.filter(a => isArtigoFav(a));
  if (favArtigos.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 gap-3">
        <Heart className="w-10 h-10 text-muted-foreground/40" />
        <p className="text-foreground text-sm font-medium">Você não tem nenhum artigo favoritado</p>
        <p className="text-muted-foreground/70 text-xs text-center max-w-[240px]">Toque no coração ao abrir um artigo para favoritá-lo.</p>
      </div>
    );
  }
  return (
    <div className="space-y-2 pb-8">
      {favArtigos.map((artigo, i) => (
        <ArtigoCard key={artigo.id} artigo={artigo} index={i} onClick={() => onOpenArtigo(artigo)} accentColor={accentColor} tags={{ favorito: true, grifado: grifadoNumeros.has(artigo.numero), anotado: anotadoNumeros.has(artigo.numero) }} />
      ))}
    </div>
  );
});
FavPanel.displayName = 'FavPanel';

// ─── Playlist Panel ───
interface PlaylistPanelProps {
  artigos: ArtigoLei[];
  playlistNarracoes: Record<string, string>;
  loadingPlaylist: boolean;
  playingUrl: string | null;
  togglePlayAudio: (url: string) => void;
  onOpenArtigo: (artigo: ArtigoLei) => void;
}

export const PlaylistPanel: React.FC<PlaylistPanelProps> = React.memo(({ artigos, playlistNarracoes, loadingPlaylist, playingUrl, togglePlayAudio, onOpenArtigo }) => {
  if (loadingPlaylist) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm">Carregando playlist...</p>
      </div>
    );
  }

  const narradosEntries = Object.entries(playlistNarracoes);
  if (narradosEntries.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 gap-2">
        <ListMusic className="w-8 h-8 text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm">Nenhuma narração disponível.</p>
        <p className="text-muted-foreground/60 text-xs">Gere narrações na tela de Narração de Artigos.</p>
      </div>
    );
  }

  const seenNumeros = new Set<string>();
  const narradosArtigos = artigos.filter(a => {
    if (!playlistNarracoes[a.numero]) return false;
    if (seenNumeros.has(a.numero)) return false;
    seenNumeros.add(a.numero);
    return true;
  });

  return (
    <div className="space-y-2 pb-8">
      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-3">
        🎧 {narradosArtigos.length} artigo{narradosArtigos.length !== 1 ? 's' : ''} narrado{narradosArtigos.length !== 1 ? 's' : ''}
      </p>
      {narradosArtigos.map((artigo, i) => {
        const audioUrl = playlistNarracoes[artigo.numero];
        const isPlaying = playingUrl === audioUrl;
        return (
          <motion.div
            key={artigo.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            className="rounded-2xl bg-card hover:bg-secondary/60 transition-all flex overflow-hidden"
          >
            <div className="w-1.5 bg-primary rounded-l-2xl shrink-0" />
            <div className="flex items-center gap-3 p-3.5 flex-1 min-w-0">
              <button
                onClick={() => togglePlayAudio(audioUrl)}
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  isPlaying
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-primary/15 text-primary hover:bg-primary/25'
                }`}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => onOpenArtigo(artigo)}
              >
                <h4 className="font-display text-[15px] font-bold text-primary-light">{artigo.numero}</h4>
                <p className="text-[13px] leading-relaxed line-clamp-2 text-foreground/80 font-body">
                  {artigo.caput.substring(0, 120)}{artigo.caput.length > 120 ? '...' : ''}
                </p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
});
PlaylistPanel.displayName = 'PlaylistPanel';

// ─── Anotações Panel ───
export const AnotacoesPanel: React.FC = React.memo(() => (
  <div className="space-y-2 pb-8">
    <div className="flex flex-col items-center py-12 gap-2">
      <StickyNote className="w-8 h-8 text-muted-foreground/40" />
      <p className="text-muted-foreground text-sm">Nenhuma anotação ainda.</p>
      <p className="text-muted-foreground/60 text-xs">Grife um trecho e adicione um comentário para criar anotações.</p>
    </div>
  </div>
));
AnotacoesPanel.displayName = 'AnotacoesPanel';
