import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/vademecum/PageHeader';
const VideoaulaAcoesBar = lazy(() => import('@/components/videoaulas/VideoaulaAcoesBar'));
import { useVideoaulaResumo, type AulaCtxInput } from '@/hooks/useVideoaulaAcao';
import { preaquecerYoutubeApi, useYoutubePlayer } from '@/hooks/useYoutubePlayer';
import { getCatalogo, limparTitulo, ytThumb } from '@/lib/videoaulasCatalogos';
import { useAuth } from '@/hooks/useAuth';
import { normalizarMarkdown } from '@/lib/markdown';
import { CheckCircle2, Loader2, Play, Star } from 'lucide-react';
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
  const { tocarVideo, setTocandoState, setTempoState, setDuracaoState } = useVideoaulasPlayer();
  // Semente vinda do cache da lista: título e capa aparecem no mesmo frame.
  const [aula, setAula] = useState<Aula | null>(() =>
    catalogo && videoId ? (getCachedAula(catalogo.id, videoId) as Aula | null) : null,
  );
  const [favorito, setFavorito] = useState(false);
  const [concluida, setConcluida] = useState(false);
  const [inicio, setInicio] = useState(0);
  const [carregado, setCarregado] = useState(false);
  const [tocando, setTocando] = useState(true);
  const [tempoAtual, setTempoAtual] = useState(0);
  const [duracao, setDuracao] = useState(0);
  const salvandoRef = useRef(false);
  const pctAtual = duracao > 0 ? Math.min(100, Math.round((tempoAtual / duracao) * 100)) : 0;

  useEffect(() => {
    if (aula) {
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
      });
    }
  }, [aula, catalogoId, areaSlug, tocarVideo]);

  useEffect(() => {
    setTocandoState(tocando);
  }, [tocando, setTocandoState]);

  useEffect(() => {
    setTempoState(tempoAtual);
    setDuracaoState(duracao);
  }, [tempoAtual, duracao, setTempoState, setDuracaoState]);


  useEffect(() => {
    if (!catalogo || !videoId) return;
    let alive = true;
    setAula(getCachedAula(catalogo.id, videoId) as Aula | null);
    setTocando(true);
    preaquecerYoutubeApi();

    void (async () => {
      const cols = `id, video_id, titulo, descricao, sobre_aula, ${catalogo.thumbCol}${
        catalogo.temAreas ? ', area' : ''
      }`;
      // Aula + progresso + favorito em paralelo (antes eram 2 rodadas sequenciais).
      const [aulaRes, progRes, favRes] = await Promise.all([
        supabase.from(catalogo.tabela as any).select(cols).eq('video_id', videoId).maybeSingle(),
        userId
          ? supabase
              .from('videoaulas_progresso')
              .select('tempo_atual, concluida')
              .eq('user_id', userId)
              .eq('tabela', catalogo.tabela)
              .eq('video_id', videoId)
              .maybeSingle()
          : Promise.resolve({ data: null } as any),
        userId
          ? supabase
              .from('videoaulas_favoritos')
              .select('id')
              .eq('user_id', userId)
              .eq('tabela', catalogo.tabela)
              .eq('video_id', videoId)
              .maybeSingle()
          : Promise.resolve({ data: null } as any),
      ]);
      if (!alive) return;
      if (aulaRes.data) setAula(aulaRes.data as unknown as Aula);
      setCarregado(true);
      const prog = progRes?.data as any;
      if (prog) {
        setInicio(Number(prog.tempo_atual) || 0);
        setConcluida(!!prog.concluida);
      }
      setFavorito(!!favRes?.data);
    })();

    return () => {
      alive = false;
    };
  }, [catalogo, videoId, userId]);

  const salvarProgresso = useCallback(
    async (tempo: number, duracao: number, forcarConclusao = false) => {
      if (!userId || !catalogo || !videoId || !aula || salvandoRef.current) return;
      salvandoRef.current = true;
      const percentual = duracao > 0 ? Math.min(100, Math.round((tempo / duracao) * 100)) : 0;
      const done = forcarConclusao || percentual >= 92;
      const { error } = await supabase.from('videoaulas_progresso').upsert(
        {
          user_id: userId,
          tabela: catalogo.tabela,
          registro_id: String(aula.id),
          video_id: videoId,
          tempo_atual: Math.round(tempo),
          duracao: Math.round(duracao),
          percentual,
          concluida: done,
        },
        { onConflict: 'user_id,tabela,registro_id' },
      );
      salvandoRef.current = false;
      if (error) console.error('[videoaula] progresso', error.message);
      else {
        if (done) setConcluida(true);
        invalidarProgresso();
      }

    },
    [userId, catalogo, videoId, aula],
  );

  const { containerRef, playerRef } = useYoutubePlayer({
    videoId: videoId ?? '',
    ativo: tocando,
    autoplay: true,
    startAt: carregado ? inicio : 0,
    onTick: (t, d) => salvarProgresso(t, d),
    onEnded: () => {
      const p = playerRef.current;
      salvarProgresso(p?.getDuration?.() ?? 0, p?.getDuration?.() ?? 0, true);
    },
  });

  // Acompanha o tempo do vídeo para a barra de progresso.
  useEffect(() => {
    if (!tocando) return;
    const id = window.setInterval(() => {
      const p = playerRef.current;
      if (!p?.getCurrentTime) return;
      setTempoAtual(p.getCurrentTime() || 0);
      setDuracao(p.getDuration?.() || 0);
    }, 500);
    return () => window.clearInterval(id);
  }, [tocando, playerRef]);

  useEffect(() => {
    if (!tocando && inicio > 0) setTempoAtual(inicio);
  }, [inicio, tocando]);



  const tituloLimpo = useMemo(() => limparTitulo(aula?.titulo ?? 'Videoaula'), [aula]);

  const input: AulaCtxInput | null = useMemo(
    () =>
      aula && catalogo
        ? {
            videoId: aula.video_id,
            titulo: tituloLimpo,
            tabela: catalogo.tabela,
            area: aula.area ?? '',
            conteudo: aula.sobre_aula ?? '',
            descricao: aula.descricao ?? '',
          }
        : null,
    [aula, catalogo, tituloLimpo],
  );

  // O panorama por IA só é pedido depois do primeiro paint, para não competir
  // com o carregamento da tela.
  const [podeResumir, setPodeResumir] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setPodeResumir(true), 600);
    return () => window.clearTimeout(t);
  }, [videoId]);

  const resumo = useVideoaulaResumo(
    podeResumir && aula && catalogo
      ? { videoId: aula.video_id, titulo: tituloLimpo, area: aula.area ?? '', tabela: catalogo.tabela }
      : null,
  );

  const toggleFavorito = async () => {
    haptic.selection();
    if (!userId || !catalogo || !aula) {
      toast.info('Entre na sua conta para favoritar.');
      return;
    }
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


  // Manter tela acesa no aparelho celular enquanto a videoaula estiver rodando
  useEffect(() => {
    void telaAcesa('videoaulas', tocando);
    return () => {
      void telaAcesa('videoaulas', false);
    };
  }, [tocando]);

  // Atalhos de teclado no Desktop (Espaço / 'k' = Play/Pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        setTocando((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const marcarConcluida = async () => {
    haptic.success();
    const p = playerRef.current;
    const d = p?.getDuration?.() ?? 0;
    await salvarProgresso(d, d, true);
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
        title={tituloLimpo}
        subtitle={aula?.area ?? catalogo.titulo}
        onBack={() =>
          navigate(
            areaSlug && areaSlug !== 'todas'
              ? `/videoaulas/${catalogo.id}/${areaSlug}`
              : `/videoaulas/${catalogo.id}`,
          )
        }
      />

      <div className="lg:max-w-7xl lg:mx-auto lg:px-6 lg:pt-4 lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
        {/* Coluna Principal: Player de Vídeo (7/12 ou 8/12 no Desktop) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <div className="relative w-full bg-black aspect-video lg:rounded-2xl lg:overflow-hidden lg:shadow-2xl lg:border lg:border-white/10">
            {tocando ? (
              <div ref={containerRef} className="h-full w-full" />
            ) : (
              <button
                type="button"
                onClick={() => setTocando(true)}
                aria-label="Reproduzir aula"
                className="group absolute inset-0 h-full w-full"
              >
                <img
                  src={aula?.thumb ?? aula?.thumbnail ?? ytThumb(videoId, 'hq')}
                  alt={`Capa da aula ${tituloLimpo}`}
                  width={480}
                  height={360}
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <span className="absolute inset-0 grid place-items-center bg-black/30">
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform group-active:scale-95">
                    <Play className="h-7 w-7 translate-x-0.5 fill-current" />
                  </span>
                </span>
              </button>
            )}
          </div>

          <div className="px-3 lg:px-0 space-y-2">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${pctAtual}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[12px] text-muted-foreground tabular-nums">
              <span>{formatTempo(tempoAtual)}</span>
              <span>{duracao > 0 ? formatTempo(duracao) : '--:--'}</span>
            </div>
            <h1 className="text-[17px] sm:text-xl lg:text-2xl font-bold leading-snug text-foreground">{tituloLimpo}</h1>
            <p className="text-[12px] sm:text-sm text-muted-foreground">
              {aula?.area ?? catalogo.titulo}
              {duracao > 0 ? ` • ${formatTempo(duracao)}` : ''}
              {concluida ? ' • Assistida' : pctAtual > 0 ? ` • ${pctAtual}% assistido` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 lg:px-0">
            <button
              onClick={toggleFavorito}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors',
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
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors',
                concluida
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              <CheckCircle2 className="h-4 w-4" /> {concluida ? 'Concluída' : 'Concluir'}
            </button>
          </div>
        </div>

        {/* Coluna Lateral: Resumo de IA & Ações (5/12 ou 4/12 no Desktop) */}
        <div className="lg:col-span-5 xl:col-span-4 pt-3 lg:pt-0 space-y-4 lg:bg-card/40 lg:border lg:border-white/10 lg:rounded-2xl lg:p-5 lg:shadow-xl">
          <h2 className="hidden lg:block text-base font-bold text-foreground pb-2 border-b border-border">
            Panorama & Estudo com IA
          </h2>

          <section className="px-3 lg:px-0">
            {/* Descrição / Panorama da Aula instantâneo (sem spinner quando já houver conteúdo disponível) */}
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

            {/* Spinner de carregamento só aparece se NÃO houver descrição nem resumo no banco */}
            {resumo.isLoading && !resumo.data?.resumo && !aula?.sobre_aula && !aula?.descricao && (
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

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur px-2 py-2 pb-[calc(12px+var(--sai-bottom,0px))]">
        <Suspense fallback={<div className="h-14" />}>
          <VideoaulaAcoesBar input={input} gridLayout gridCols={6} />
        </Suspense>
      </div>
    </div>
  );
};

export default VideoaulaView;
