import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Heart, Loader2, ListMusic, Play, Pause, CheckCircle2, StickyNote, Trash2, ExternalLink } from 'lucide-react';
import ArtigoCard from '@/components/vademecum/artigo/ArtigoCard';
import type { ArtigoLei } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/lib/nativeHaptics';

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

interface AnotacaoDBItem {
  id: string;
  user_id?: string;
  tabela_codigo?: string;
  numero_artigo?: string;
  artigo_id?: string;
  anotacao: string;
  created_at?: string;
  updated_at?: string;
}

// ─── Anotações Panel ───
export interface AnotacoesPanelProps {
  tabelaNome?: string | null;
  artigos?: ArtigoLei[];
  onOpenArtigo?: (artigo: ArtigoLei) => void;
  accentColor?: string;
}

export const AnotacoesPanel: React.FC<AnotacoesPanelProps> = React.memo(({
  tabelaNome,
  artigos = [],
  onOpenArtigo,
  accentColor = '#f59e0b',
}) => {
  const [anotacoes, setAnotacoes] = useState<AnotacaoDBItem[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarAnotacoes = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAnotacoes([]);
        return;
      }

      let query = supabase
        .from('artigos_anotacoes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (tabelaNome) {
        query = query.or(`tabela_codigo.eq.${tabelaNome},artigo_id.like.${tabelaNome}::%`);
      }

      const { data, error } = await query;
      if (!error && data) {
        setAnotacoes(data);
      }
    } catch (e) {
      console.warn('Erro ao carregar anotações da lei:', e);
    } finally {
      setLoading(false);
    }
  }, [tabelaNome]);

  useEffect(() => {
    carregarAnotacoes();
  }, [carregarAnotacoes]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.impact();
    try {
      await supabase.from('artigos_anotacoes').delete().eq('id', id);
      setAnotacoes((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.warn('Erro ao deletar anotação:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-xs text-muted-foreground">Carregando anotações...</p>
      </div>
    );
  }

  if (anotacoes.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 gap-3 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <StickyNote className="w-7 h-7 text-amber-500/80" />
        </div>
        <p className="text-foreground text-sm font-semibold">Nenhuma anotação nesta lei</p>
        <p className="text-muted-foreground/70 text-xs max-w-[260px] leading-relaxed">
          Abra um artigo e utilize o botão de anotação ou grife trechos para adicionar seus comentários.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-8">
      <div className="text-xs font-semibold text-muted-foreground px-1 flex items-center justify-between">
        <span>{anotacoes.length} {anotacoes.length === 1 ? 'anotação encontrada' : 'anotações encontradas'}</span>
      </div>

      {anotacoes.map((item, i) => {
        const numArt = item.numero_artigo || (item.artigo_id ? String(item.artigo_id).split('::')[1] : null);
        const artigoCorrespondente = artigos.find((a) => String(a.numero).trim() === String(numArt).trim());
        const dataFormatada = item.updated_at || item.created_at
          ? new Date(item.updated_at || item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
          : null;

        return (
          <motion.div
            key={item.id || i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => {
              haptic.selection();
              if (artigoCorrespondente && onOpenArtigo) {
                onOpenArtigo(artigoCorrespondente);
              } else if (onOpenArtigo && numArt) {
                onOpenArtigo({
                  id: item.artigo_id || `${tabelaNome}::${numArt}`,
                  numero: numArt,
                  texto: item.anotacao,
                } as unknown as ArtigoLei);
              }
            }}
            className="group relative p-4 rounded-2xl bg-[#14151a] hover:bg-[#181920] border border-white/10 hover:border-amber-500/40 transition-all cursor-pointer shadow-lg shadow-black/40 flex flex-col gap-2.5 active:scale-[0.99]"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/25 text-xs font-bold font-mono">
                  {numArt ? `Art. ${numArt}` : 'Artigo'}
                </span>
                {dataFormatada && (
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {dataFormatada}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => handleDelete(item.id, e)}
                  aria-label="Excluir anotação"
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <div className="w-7 h-7 rounded-lg bg-white/[0.05] group-hover:bg-amber-500/20 flex items-center justify-center text-zinc-400 group-hover:text-amber-400 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed line-clamp-4 whitespace-pre-wrap">
              {item.anotacao}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
});
AnotacoesPanel.displayName = 'AnotacoesPanel';

