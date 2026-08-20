import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, PlayCircle } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { LEIS_CATALOG } from '@/data/leisCatalog';
import { fetchArtigosPaginado } from '@/services/legislacaoService';
import type { ArtigoLei } from '@/data/mockData';
import { lazyWithRetry } from '@/utils/lazyWithRetry';
import { haptic } from '@/lib/nativeHaptics';
import { Skeleton } from '@/components/ui/skeleton';

const VideoaulaSheet = lazyWithRetry(() => import('@/components/vademecum/VideoaulaSheet'));
const VideoaulasListSheet = lazyWithRetry(() => import('@/components/vademecum/VideoaulasListSheet'));

const VideoaulasLeiSecaArtigos = () => {
  const { leiId } = useParams();
  const navigate = useNavigate();

  const lei = useMemo(() => LEIS_CATALOG.find((l) => l.id === leiId), [leiId]);

  const { data: artigos = [], isLoading } = useQuery({
    queryKey: ['videoaulas', 'artigos', lei?.tabela_nome],
    queryFn: async () => {
      if (!lei?.tabela_nome) return [];
      return fetchArtigosPaginado(lei.tabela_nome, 0, 10000);
    },
    enabled: !!lei?.tabela_nome,
    staleTime: 1000 * 60 * 60,
  });

  const [openArtigo, setOpenArtigo] = useState<ArtigoLei | null>(null);
  const [videoaula, setVideoaula] = useState<{ titulo: string; url: string; canal: string; videoId: string; transcricao?: string } | null>(null);
  const [showVideoaulaSheet, setShowVideoaulaSheet] = useState(false);

  if (!lei) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <p className="text-muted-foreground text-sm">Lei não encontrada.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <PageHeader
        title={lei.nome}
        description="Selecione o artigo para buscar aulas"
        onBack={() => navigate(-1)}
        theme="red"
      />
      <div className="px-4 mt-6 space-y-3">
        {isLoading && (
          Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] w-full rounded-2xl bg-card border border-border/50" />
          ))
        )}

        {!isLoading && artigos.map((art) => (
          <button
            key={art.id}
            onClick={() => {
              haptic.selection();
              setOpenArtigo(art);
            }}
            className="w-full text-left rounded-2xl bg-card hover:bg-secondary/60 transition-all border border-border/80 group flex overflow-hidden min-h-[68px] active:scale-[0.99]"
          >
            <div className="w-1.5 bg-rose-500 rounded-l-2xl shrink-0" />
            <div className="p-4 flex flex-col justify-center min-w-0 flex-1">
              <span className="text-[13px] font-bold text-rose-500 mb-1">{art.numero}</span>
              <p className="text-[15px] font-medium leading-snug text-foreground/90 line-clamp-2">
                {art.caput}
              </p>
            </div>
            <div className="w-12 flex items-center justify-center shrink-0 border-l border-border/40 bg-muted/20">
              <PlayCircle className="w-5 h-5 text-rose-500/70 group-hover:text-rose-500 transition-colors" />
            </div>
          </button>
        ))}

        {!isLoading && artigos.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-10">Nenhum artigo encontrado.</p>
        )}
      </div>

      {openArtigo && (
        <VideoaulasListSheet
          open={!!openArtigo}
          onClose={() => setOpenArtigo(null)}
          tabelaNome={lei.tabela_nome}
          artigoNumero={openArtigo.numero || ''}
          leiNome={lei.nome}
          onSelectVideo={(v) => {
            setVideoaula({ titulo: v.titulo, url: v.url, canal: v.canal, videoId: v.videoId });
            setOpenArtigo(null);
            setShowVideoaulaSheet(true);
          }}
        />
      )}

      {showVideoaulaSheet && videoaula && (
        <VideoaulaSheet
          open={showVideoaulaSheet}
          onClose={() => setShowVideoaulaSheet(false)}
          video={videoaula}
          tabelaNome={lei.tabela_nome}
          artigoNumero={openArtigo?.numero || ''}
        />
      )}
    </div>
  );
};

export default VideoaulasLeiSecaArtigos;
