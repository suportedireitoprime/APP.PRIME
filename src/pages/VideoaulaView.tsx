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
  // Semente vinda do cache da lista: título e capa aparecem no mesmo frame.
  const [aula, setAula] = useState<Aula | null>(() =>
    catalogo && videoId ? (getCachedAula(catalogo.id, videoId) as Aula | null) : null,
  );
  const [favorito, setFavorito] = useState(false);
  const [concluida, setConcluida] = useState(false);
  const [inicio, setInicio] = useState(0);
  const [carregado, setCarregado] = useState(false);
  const [tocando, setTocando] = useState(false);
  const [tempoAtual, setTempoAtual] = useState(0);
  const [duracao, setDuracao] = useState(0);
  const salvandoRef = useRef(false);
  const pctAtual = duracao > 0 ? Math.min(100, Math.round((tempoAtual / duracao) * 100)) : 0;


  useEffect(() => {
    if (!catalogo || !videoId) return;
    let alive = true;
    setAula(getCachedAula(catalogo.id, videoId) as Aula | null);
    setTocando(false);
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


  const marcarConcluida = async () => {
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
    <div className="min-h-screen bg-background pb-40">
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

      <div className="relative w-full bg-black aspect-video">
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

      <div className="pt-3 space-y-4">
        <div className="px-3 space-y-2">
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
          <h1 className="text-[17px] leading-snug text-foreground">{tituloLimpo}</h1>
          <p className="text-[12px] text-muted-foreground">
            {aula?.area ?? catalogo.titulo}
            {duracao > 0 ? ` • ${formatTempo(duracao)}` : ''}
            {concluida ? ' • Assistida' : pctAtual > 0 ? ` • ${pctAtual}% assistido` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 px-3">
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

        <section className="px-3">

          {resumo.isLoading && (
            <div className="py-6 flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Analisando a aula…
            </div>
          )}
          {resumo.error && (
            <p className="text-sm text-muted-foreground">
              Não foi possível gerar o panorama agora.
            </p>
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
                {normalizarMarkdown(resumo.data.resumo)}
              </ReactMarkdown>
            </div>
          )}
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        <Suspense fallback={<div className="h-14" />}>
          <VideoaulaAcoesBar input={input} gridLayout gridCols={6} />
        </Suspense>
      </div>
    </div>
  );
};

export default VideoaulaView;
