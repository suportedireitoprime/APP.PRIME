import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/vademecum/PageHeader';
const VideoaulaAcoesBar = lazy(() => import('@/components/videoaulas/VideoaulaAcoesBar'));
import { AnotacoesAulaSheet } from '@/components/videoaulas/AnotacoesAulaSheet';
import { useVideoaulaResumo, type AulaCtxInput } from '@/hooks/useVideoaulaAcao';
import { preaquecerYoutubeApi, useYoutubePlayer } from '@/hooks/useYoutubePlayer';
import { getCatalogo, limparTitulo, ytThumb } from '@/lib/videoaulasCatalogos';
import { useAuth } from '@/hooks/useAuth';
import { normalizarMarkdown } from '@/lib/markdown';
import { CheckCircle2, FileText, Loader2, Play, Star } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getCachedAula, invalidarFavoritos, invalidarProgresso } from '@/lib/videoaulasStore';
import { telaAcesa } from '@/lib/nativo/telaAcordada';
import { haptic } from '@/lib/nativeHaptics';
import { useVideoaulasPlayer } from '@/contexts/VideoaulasPlayerContext';


type Aula = {
  id: string | number;
  video_id: string;
  titulo: string;
  area?: string | null;
  descricao?: string | null;
  sobre_aula?: string | null;
  thumb?: string | null;
  thumbnail?: string | null;
};

function formatTempo(s: number) {
  if (!s || !isFinite(s)) return '0:00';
  const t = Math.floor(s);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const sec = t % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`;
}


const VideoaulaView = () => {
  const { catalogo: catalogoId, area: areaSlug, videoId } = useParams();
  const navigate = useNavigate();
  const catalogo = getCatalogo(catalogoId);
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { tocarVideo, tocando, togglePlay, tempo, duracao } = useVideoaulasPlayer();
  
  // Semente vinda do cache da lista: título e capa aparecem no mesmo frame.
  const [aula, setAula] = useState<Aula | null>(() =>
    catalogo && videoId ? (getCachedAula(catalogo.id, videoId) as Aula | null) : null,
  );
  const [aulasDaArea, setAulasDaArea] = useState<Aula[]>([]);
  const [favorito, setFavorito] = useState(false);
  const [concluida, setConcluida] = useState(false);
  const [carregado, setCarregado] = useState(false);
  const [showAnotacoes, setShowAnotacoes] = useState(false);
  const pctAtual = duracao > 0 ? Math.min(100, Math.round((tempo / duracao) * 100)) : 0;

  const [inicio, setInicio] = useState(0);

  useEffect(() => {
    if (aula && (!carregado || aula.video_id !== videoId)) {
      tocarVideo({
        id: aula.id,
        video_id: aula.video_id,
        titulo: aula.titulo,
        area: aula.area,
        descricao: aula.descricao,
        thumb: aula.thumb,
        thumbnail: aula.thumbnail,
        catalogoId,
        areaSlug,
        tempoInicial: inicio,
      });
    }
  }, [aula, catalogoId, areaSlug, tocarVideo, videoId, carregado, inicio]);

  useEffect(() => {
    if (!catalogo || !videoId) return;
    let alive = true;
    setAula(getCachedAula(catalogo.id, videoId) as Aula | null);
    preaquecerYoutubeApi();

    void (async () => {
      const cols = `id, video_id, titulo, descricao, sobre_aula, ${catalogo.thumbCol}${
        catalogo.temAreas ? ', area' : ''
      }`;
      // Aula + progresso + favorito em paralelo (antes eram 2 rodadas sequenciais).
      const [aulaRes, progRes, favRes] = await Promise.all([
        supabase.from(catalogo.tabela as 'videoaulas_areas_direito').select(cols).eq('video_id', videoId).maybeSingle(),
        userId
          ? supabase
              .from('videoaulas_progresso')
              .select('tempo_atual, concluida')
              .eq('user_id', userId)
              .eq('tabela', catalogo.tabela)
              .eq('video_id', videoId)
              .maybeSingle()
          : Promise.resolve({ data: null } as { data: null }),
        userId
          ? supabase
              .from('videoaulas_favoritos')
              .select('id')
              .eq('user_id', userId)
              .eq('tabela', catalogo.tabela)
              .eq('video_id', videoId)
              .maybeSingle()
          : Promise.resolve({ data: null } as { data: null }),
      ]);
      if (!alive) return;
      const aulaData = aulaRes.data as unknown as Aula | null;
      if (aulaData) setAula(aulaData);
      setCarregado(true);
      const prog = progRes?.data as { tempo_atual?: number; concluida?: boolean } | null;
      if (prog) {
        setInicio(Number(prog.tempo_atual) || 0);
        setConcluida(!!prog.concluida);
      }
      setFavorito(!!favRes?.data);

      // Busca aulas da mesma área para a Sidebar Lateral Esquerda no Desktop
      let qArea = supabase.from(catalogo.tabela as 'videoaulas_areas_direito').select(cols);
      if (catalogo.temAreas && aulaData?.area) {
        qArea = qArea.eq('area', aulaData.area);
      }
      const { data: listaArea } = await qArea.limit(60);
      if (alive && listaArea) {
        setAulasDaArea(listaArea as unknown as Aula[]);
      }
    })();

    return () => {
      alive = false;
    };
  }, [catalogo, videoId, userId]);

  const tituloLimpo = useMemo(
    () => (aula?.titulo ? limparTitulo(aula.titulo) : 'Aula'),
    [aula?.titulo],
  );

  const input: AulaCtxInput | null = useMemo(() => {
    if (!catalogo || !videoId || !aula) return null;
    return {
      tabela: catalogo.tabela,
      videoId,
      titulo: tituloLimpo,
      area: aula.area ?? catalogo.titulo,
      descricao: aula.sobre_aula || aula.descricao || undefined,
    };
  }, [catalogo, videoId, aula, tituloLimpo]);

  const [podeResumir, setPodeResumir] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setPodeResumir(true), 600);
    return () => window.clearTimeout(t);
  }, [videoId]);

  const resumo = useVideoaulaResumo(podeResumir ? input : null);

  const tituloHeader = useMemo(() => {
    if (!aulasDaArea.length || !videoId) return 'Aula';
    const idx = aulasDaArea.findIndex((a) => a.video_id === videoId);
    if (idx !== -1) return `Aula ${idx + 1}`;
    return 'Aula';
  }, [aulasDaArea, videoId]);

  const toggleFavorito = async () => {
    if (!userId || !catalogo || !aula) return;
    haptic.selection();
    if (favorito) {
      await supabase
        .from('videoaulas_favoritos')
        .delete()
        .eq('user_id', userId)
        .eq('tabela', catalogo.tabela)
        .eq('video_id', aula.video_id);
      setFavorito(false);
    } else {
      await supabase.from('videoaulas_favoritos').insert({
        user_id: userId,
        tabela: catalogo.tabela,
        registro_id: String(aula.id),
        video_id: aula.video_id,
        titulo: tituloLimpo,
        area: aula.area ?? null,
        thumb: aula.thumb ?? aula.thumbnail ?? null,
      });
      setFavorito(true);
    }
    invalidarFavoritos();
  };

  const marcarConcluida = async () => {
    haptic.success();
    // A lógica de salvar progresso verdadeiro foi movida para GlobalVideoaulaMiniPlayer.
    // Aqui apenas atualizamos visualmente ou despachamos evento pro context se necessário.
    setConcluida(true);
    toast.success('Aula marcada como concluída.');
  };

  if (!catalogo || !videoId) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <p className="text-sm text-muted-foreground">Aula não encontrada.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-40 lg:pb-16">
      <PageHeader
        title={tituloHeader}
        subtitle={aula?.area ?? catalogo.titulo}
        onBack={() =>
          navigate(
            areaSlug && areaSlug !== 'todas'
              ? `/videoaulas/${catalogo.id}/${areaSlug}`
              : `/videoaulas/${catalogo.id}`,
          )
        }
      />

      <div className="w-full 2xl:max-w-[1750px] mx-auto px-2 sm:px-4 lg:px-6 lg:pt-4 lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start">
        {/* ── Sidebar Lateral Esquerda: Lista de Aulas da Matéria (Desktop - Colada na Esquerda) ───── */}
        <aside className="hidden lg:block lg:col-span-3 xl:col-span-3 space-y-3 bg-card/40 border border-border/60 rounded-2xl p-4 shadow-sm max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
            <h2 className="text-sm font-bold text-foreground">Aulas da Matéria</h2>
            <span className="text-[11px] font-semibold text-primary px-2 py-0.5 rounded-full bg-primary/10">
              {aulasDaArea.length} aulas
            </span>
          </div>
          <div className="space-y-2">
            {aulasDaArea.map((item) => {
              const eAtivo = item.video_id === videoId;
              const tLimpo = limparTitulo(item.titulo);
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    haptic.selection();
                    navigate(`/videoaulas/${catalogo.id}/${areaSlug ?? 'todas'}/${item.video_id}`);
                  }}
                  className={cn(
                    'w-full text-left flex items-start gap-2.5 p-2 rounded-xl border transition-colors group',
                    eAtivo
                      ? 'border-primary/60 bg-primary/15'
                      : 'border-border/40 hover:border-border hover:bg-muted/50',
                  )}
                >
                  <div className="relative w-16 h-10 shrink-0 rounded-lg overflow-hidden bg-black/60 border border-white/10">
                    <img
                      src={item.thumb ?? item.thumbnail ?? ytThumb(item.video_id, 'mq')}
                      alt=""
                      loading="eager"
                      decoding="async"
                      {...({ fetchpriority: 'high' } as React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>)}
                      className="w-full h-full object-cover"
                    />
                    {eAtivo && (
                      <div className="absolute inset-0 bg-primary/40 flex items-center justify-center">
                        <Play className="w-4 h-4 text-white fill-current" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-xs font-medium line-clamp-2 leading-tight', eAtivo ? 'text-primary font-bold' : 'text-foreground group-hover:text-primary')}>
                      {tLimpo}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── Coluna Principal Central: Player de Vídeo Expandido & Centralizado ───────────── */}
        <div className="lg:col-span-6 xl:col-span-6 space-y-4">
          <div 
            id="videoaula-placeholder"
            className="relative w-full bg-transparent aspect-video lg:rounded-2xl lg:overflow-hidden"
          >
            {/* O GlobalVideoaulaMiniPlayer.tsx vai teletransportar o player para cá */}
            {/* O próprio placeholder não precisa de fundo porque o player global preenche */}
            
            {/* Fallback caso demore a teletransportar: */}
            <div className="absolute inset-0 bg-black/10 animate-pulse pointer-events-none" />
          </div>

          <div className="w-full flex items-start gap-4">
            <div className="flex-1 space-y-2">      </div>
          </div>

          <div className="px-3 lg:px-0 space-y-2">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${pctAtual}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[12px] text-muted-foreground tabular-nums">
              <span>{formatTempo(tempo)}</span>
              <span>{duracao > 0 ? formatTempo(duracao) : '--:--'}</span>
            </div>
            <h1 className="text-[17px] sm:text-xl lg:text-2xl font-bold leading-snug text-foreground">{tituloLimpo}</h1>
            <p className="text-[12px] sm:text-sm text-muted-foreground">
              {aula?.area ?? catalogo.titulo}
              {duracao > 0 ? ` • ${formatTempo(duracao)}` : ''}
              {concluida ? ' • Assistida' : pctAtual > 0 ? ` • ${pctAtual}% assistido` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 lg:px-0 flex-wrap">
            <button
              onClick={toggleFavorito}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors',
                favorito
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              <Star className={cn('h-4 w-4', favorito && 'fill-current')} /> Favoritar
            </button>
            <button
              onClick={marcarConcluida}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors',
                concluida
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              <CheckCircle2 className="h-4 w-4" /> {concluida ? 'Concluída' : 'Concluir'}
            </button>
            <button
              onClick={() => setShowAnotacoes(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 text-primary px-3.5 py-1.5 text-[13px] font-semibold transition-colors hover:bg-primary/20"
            >
              <FileText className="h-4 w-4" /> Anotações (Áudio/IA)
            </button>
          </div>
        </div>

        {/* ── Coluna Lateral Direita: Ações da Aula (Desktop Cards Alinhados à Direita) & Panorama ──── */}
        <div className="lg:col-span-3 xl:col-span-3 pt-3 lg:pt-0 space-y-4 lg:bg-card/40 lg:border lg:border-white/10 lg:rounded-2xl lg:p-4 lg:shadow-xl">
          {/* No Desktop: Renderiza a Barra de Ações em formato de cards no painel direito */}
          <div className="hidden lg:block space-y-2 border-b border-border/60 pb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">Recursos da Aula</h2>
            <Suspense fallback={<div className="h-20 animate-pulse bg-muted rounded-xl" />}>
              <VideoaulaAcoesBar input={input} gridLayout gridCols={3} onOpenAnotacoes={() => setShowAnotacoes(true)} />
            </Suspense>
          </div>

          <h2 className="hidden lg:block text-sm font-bold text-foreground pb-2 border-b border-border">
            Panorama & Estudo com IA
          </h2>

          <section className="px-3 lg:px-0">
            {/* Descrição / Panorama da Aula */}
            {(aula?.sobre_aula || aula?.descricao) && !resumo.data?.resumo && (
              <div className="space-y-2 mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                  Do que trata a aula
                </h3>
                <div className="text-[14.5px] leading-relaxed text-foreground/90 font-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {aula.sobre_aula || aula.descricao || ''}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {resumo.data?.resumo && (
              <div className="text-[15px] leading-relaxed text-foreground/90 space-y-3">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h2 className="text-[17px] font-semibold text-foreground mt-4 first:mt-0">
                        {children}
                      </h2>
                    ),
                    h2: ({ children }) => (
                      <h3 className="text-[16px] font-semibold text-primary mt-4 first:mt-0">
                        {children}
                      </h3>
                    ),
                    h3: ({ children }) => (
                      <h4 className="text-[15px] font-semibold text-foreground mt-3">{children}</h4>
                    ),
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => (
                      <ul className="list-disc pl-5 space-y-1 mb-2">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal pl-5 space-y-1 mb-2">{children}</ol>
                    ),
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    strong: ({ children }) => (
                      <strong className="font-semibold text-foreground">{children}</strong>
                    ),
                    em: ({ children }) => <em className="italic text-foreground/80">{children}</em>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-primary/50 pl-3 italic text-foreground/80">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="rounded bg-muted px-1 py-0.5 text-[12px]">{children}</code>
                    ),
                    hr: () => <hr className="border-border my-3" />,
                    a: ({ children, href }) => (
                      <a href={href} target="_blank" rel="noreferrer" className="text-primary underline">
                        {children}
                      </a>
                    ),
                  }}
                >
                  {normalizarMarkdown(resumo.data?.resumo || '')}
                </ReactMarkdown>
              </div>
            )}

            {resumo.isLoading && !(resumo.data as { resumo?: string } | undefined)?.resumo && !aula?.sobre_aula && !aula?.descricao && (
              <div className="py-4 flex items-center gap-2 text-muted-foreground text-xs">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> Carregando panorama...
              </div>
            )}

            {resumo.error && !aula?.sobre_aula && !aula?.descricao && (
              <p className="text-sm text-muted-foreground">
                Não foi possível carregar a descrição no momento.
              </p>
            )}
          </section>
        </div>
      </div>

      {/* ── Footer Fixo de Ações APENAS para Telas Mobile (lg:hidden) ───────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden pointer-events-none">
        <div className="pointer-events-auto">
          <Suspense fallback={<div className="h-[76px] bg-hero-panel rounded-t-2xl border-t border-white/10" />}>
            <VideoaulaAcoesBar input={input} onOpenAnotacoes={() => setShowAnotacoes(true)} />
          </Suspense>
        </div>
      </div>

      <AnotacoesAulaSheet
        open={showAnotacoes}
        onClose={() => setShowAnotacoes(false)}
        videoId={videoId ?? ''}
        aulaTitulo={tituloLimpo}
        areaSlug={areaSlug}
      />
    </div>
  );
};

export default VideoaulaView;
