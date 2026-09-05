import { useState, useMemo, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, PlayCircle, Search } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { LEIS_CATALOG } from '@/data/leisCatalog';
import { fetchArtigosPaginado } from '@/services/legislacaoService';
import type { ArtigoLei } from '@/data/mockData';
import { lazyWithRetry } from '@/utils/lazyWithRetry';
import { haptic } from '@/lib/nativeHaptics';
import { Skeleton } from '@/components/ui/skeleton';

const VideoaulaSheet = lazyWithRetry(() => import('@/components/vademecum/sheets/VideoaulaSheet'));
const VideoaulasListSheet = lazyWithRetry(() => import('@/components/vademecum/sheets/VideoaulasListSheet'));

const VideoaulasLeiSecaArtigos = () => {
  const { leiId } = useParams();
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const lei = useMemo(() => LEIS_CATALOG.find((l) => l.id === leiId), [leiId]);

  const { data: artigosRaw = [], isLoading } = useQuery({
    queryKey: ['videoaulas', 'artigos', lei?.tabela_nome],
    queryFn: async () => {
      if (!lei?.tabela_nome) return [];
      return fetchArtigosPaginado(lei.tabela_nome, 0, 10000);
    },
    enabled: !!lei?.tabela_nome,
    staleTime: 1000 * 60 * 60,
  });

  const artigosFiltrados = useMemo(() => {
    let result = artigosRaw.filter((art) => {
      const num = (art.numero || '').toLowerCase().trim();
      // Keep only actual articles (Art. X or Xº). Use startsWith to avoid matching "pARTe geral"
      return num.startsWith('art') || /^\d/.test(num);
    });

    if (q.trim()) {
      const query = q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      result = result.filter(art => {
        const t = (art.caput + ' ' + (art.numero || '')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return t.includes(query);
      });
    }
    return result;
  }, [artigosRaw, q]);

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

  // Extrai apenas o número (ex: "Art. 1º" -> "1º") para o ícone
  const getNumeroCurto = (num: string) => {
    return num.replace(/^Art\.\s*/i, '').trim();
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <PageHeader
        title={lei.sigla || lei.nome}
        description="Selecione o artigo para buscar aulas"
        onBack={() => navigate(-1)}
        theme="red"
      />
      <div className="px-4 mt-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por número ou texto..."
            className="w-full h-12 pl-11 pr-4 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="space-y-3">
          {isLoading && (
            Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] w-full rounded-2xl bg-card border border-border/50" />
            ))
          )}

          {!isLoading && artigosFiltrados.map((art) => (
            <button
              key={art.id}
              onClick={() => {
                haptic.selection();
                setOpenArtigo(art);
              }}
              className="w-full text-left rounded-3xl bg-card hover:bg-secondary/60 transition-all border border-border/80 group flex items-stretch min-h-[72px] active:scale-[0.99] shadow-sm"
            >
              <div className="w-16 flex flex-col items-center justify-center shrink-0 p-2">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 group-hover:bg-rose-500 group-hover:border-rose-500 transition-colors">
                  <span className="text-[14px] font-bold text-rose-400 group-hover:text-white transition-colors">
                    {getNumeroCurto(art.numero)}
                  </span>
                </div>
              </div>
              <div className="p-4 flex flex-col justify-center min-w-0 flex-1">
                <p className="text-[14.5px] font-medium leading-snug text-foreground/90 line-clamp-2">
                  {art.caput}
                </p>
              </div>
              <div className="w-14 flex items-center justify-center shrink-0">
                <PlayCircle className="w-6 h-6 text-rose-500/50 group-hover:text-rose-400 transition-colors" />
              </div>
            </button>
          ))}

          {!isLoading && artigosFiltrados.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-10">Nenhum artigo encontrado.</p>
          )}
        </div>
      </div>

      {openArtigo && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}

      {showVideoaulaSheet && videoaula && (
        <Suspense fallback={null}>
          <VideoaulaSheet
            open={showVideoaulaSheet}
            onClose={() => setShowVideoaulaSheet(false)}
            video={videoaula}
            tabelaNome={lei.tabela_nome}
            artigoNumero={openArtigo?.numero || ''}
          />
        </Suspense>
      )}
    </div>
  );
};

export default VideoaulasLeiSecaArtigos;
