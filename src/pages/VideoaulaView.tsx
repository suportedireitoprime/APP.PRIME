import { Suspense, useMemo, useState, useEffect } from 'react';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
const VideoaulaAcoesBar = lazyWithRetry(() => import('@/components/videoaulas/VideoaulaAcoesBar'));
import { AnotacoesAulaSheet } from '@/components/videoaulas/AnotacoesAulaSheet';
import { TrilhaAula } from '@/components/videoaulas/TrilhaAula';
import { useVideoaulaResumo, type AulaCtxInput } from '@/hooks/useVideoaulaAcao';
import { limparTitulo } from '@/lib/videoaulasCatalogos';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/lib/nativeHaptics';
import { useVideoaulasPlayer } from '@/contexts/VideoaulasPlayerContext';

import { useVideoaulaView } from '@/hooks/useVideoaulaView';
import { VideoaulaSidebarDesktop } from '@/components/videoaulas/view/VideoaulaSidebarDesktop';
import { VideoaulaPanoramaIA } from '@/components/videoaulas/view/VideoaulaPanoramaIA';
import { VideoaulaControlesAcao } from '@/components/videoaulas/view/VideoaulaControlesAcao';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { tocarVideo, tempo, duracao, setTocandoState, seek } = useVideoaulasPlayer();
  
  const state = useVideoaulaView({ catalogoId, videoId, userId, setTocandoState });
  
  const [showAnotacoes, setShowAnotacoes] = useState(false);
  const [podeResumir, setPodeResumir] = useState(false);

  const displayDuracao = duracao > 0 ? duracao : (state.aula?.duracao_segundos || 0);
  const pctAtual = displayDuracao > 0 ? Math.min(100, Math.round((tempo / displayDuracao) * 100)) : 0;

  useEffect(() => {
    if (state.aula && (!state.carregado || state.aula.video_id !== videoId)) {
      tocarVideo({
        id: state.aula.id,
        video_id: state.aula.video_id,
        titulo: state.aula.titulo,
        area: state.aula.area,
        descricao: state.aula.descricao,
        thumb: state.aula.thumb,
        thumbnail: state.aula.thumbnail,
        catalogoId,
        areaSlug,
        tempoInicial: state.inicio,
      });
    }
  }, [state.aula, catalogoId, areaSlug, tocarVideo, videoId, state.carregado, state.inicio]);

  useEffect(() => {
    const t = window.setTimeout(() => setPodeResumir(true), 600);
    return () => window.clearTimeout(t);
  }, [videoId]);

  const tituloLimpo = useMemo(
    () => (state.aula?.titulo ? limparTitulo(state.aula.titulo) : 'Aula'),
    [state.aula?.titulo],
  );

  const input: AulaCtxInput | null = useMemo(() => {
    if (!state.catalogo || !videoId || !state.aula) return null;
    return {
      tabela: state.catalogo.tabela,
      videoId,
      titulo: tituloLimpo,
      area: state.aula.area ?? state.catalogo.titulo,
      descricao: state.aula.sobre_aula || state.aula.descricao || undefined,
    };
  }, [state.catalogo, videoId, state.aula, tituloLimpo]);

  const resumo = useVideoaulaResumo(podeResumir ? input : null);

  const tituloHeader = useMemo(() => {
    if (!state.aulasDaArea.length || !videoId) return 'Aula';
    const idx = state.aulasDaArea.findIndex((a) => a.video_id === videoId);
    if (idx !== -1) return `Aula ${idx + 1}`;
    return 'Aula';
  }, [state.aulasDaArea, videoId]);

  const toggleFavorito = async () => {
    if (!userId || !state.catalogo || !state.aula) return;
    haptic.selection();
    try {
      if (state.favorito) {
        await supabase
          .from('videoaulas_favoritos')
          .delete()
          .eq('user_id', userId)
          .eq('tabela', state.catalogo.tabela)
          .eq('video_id', state.aula.video_id);
        state.setFavorito(false);
      } else {
        await supabase.from('videoaulas_favoritos').insert({
          user_id: userId,
          tabela: state.catalogo.tabela,
          registro_id: String(state.aula.id),
          video_id: state.aula.video_id,
          titulo: tituloLimpo,
          area: state.aula.area ?? null,
          thumb: state.aula.thumb ?? state.aula.thumbnail ?? null,
        });
        state.setFavorito(true);
      }
    } catch (error) {
      console.error(error);
      toast.error('Ocorreu um erro ao atualizar favoritos.');
    }
  };

  const marcarConcluida = async () => {
    haptic.selection();
    try {
      if (state.concluida) {
        state.setConcluida(false);
        if (userId && state.catalogo && videoId) {
          await supabase
            .from('videoaulas_progresso')
            .update({ concluida: false })
            .eq('user_id', userId)
            .eq('tabela', state.catalogo.tabela)
            .eq('video_id', videoId);
        }
        toast('Marcação de aula removida.');
      } else {
        state.setConcluida(true);
        if (userId && state.catalogo && videoId) {
          await supabase
            .from('videoaulas_progresso')
            .upsert({ 
              user_id: userId, 
              tabela: state.catalogo.tabela,
              registro_id: String(state.aula?.id),
              video_id: videoId, 
              concluida: true,
              tempo_atual: tempo || 0
            });
        }
        toast.success('Aula marcada como concluída.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar progresso da aula.');
    }
  };

  if (!state.catalogo || !videoId) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <p className="text-sm text-muted-foreground">Aula não encontrada.</p>
      </div>
    );
  }

  const handleAlertClose = (v: boolean) => {
    if (!v) state.setShowResumePrompt({ show: false, tempo: 0 });
  };

  return (
    <div className="min-h-screen bg-background pb-40 lg:pb-16">
      <PageHeader
        title={tituloHeader}
        subtitle={state.aula?.area ?? state.catalogo.titulo}
        onBack={() =>
          navigate(
            areaSlug && areaSlug !== 'todas'
              ? `/videoaulas/${state.catalogo?.id}/${areaSlug}`
              : `/videoaulas/${state.catalogo?.id}`,
          )
        }
      />

      <div className="w-full 2xl:max-w-[1750px] mx-auto px-2 sm:px-4 lg:px-6 lg:pt-4 lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start">
        {/* Sidebar Lateral Esquerda Desktop */}
        <VideoaulaSidebarDesktop 
          aulasDaArea={state.aulasDaArea}
          videoId={videoId}
          catalogoId={state.catalogo.id}
          areaSlug={areaSlug}
        />

        {/* Coluna Principal Central: Player de Vídeo Expandido & Centralizado */}
        <div className="lg:col-span-6 xl:col-span-6 space-y-4">
          <div 
            id="videoaula-placeholder"
            className="relative w-[calc(100%+1rem)] sm:w-[calc(100%+2rem)] lg:w-full -mx-2 sm:-mx-4 lg:mx-0 bg-transparent aspect-video lg:rounded-2xl lg:overflow-hidden"
          >
            <div className="absolute inset-0 bg-black/10 animate-pulse pointer-events-none" />
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
              <span>{displayDuracao > 0 ? formatTempo(displayDuracao) : '--:--'}</span>
            </div>
            <h1 className="text-[17px] sm:text-xl lg:text-2xl font-bold leading-snug text-foreground">{tituloLimpo}</h1>
          </div>

          <div className="px-3 lg:px-0 py-2 mt-4 space-y-2">
            <p className="text-[11px] sm:text-[12px] uppercase tracking-wider text-muted-foreground font-bold pl-1">
              Siga estas etapas para concluir a aula
            </p>
            {videoId && (
              <TrilhaAula 
                videoId={videoId} 
                concluida={state.concluida} 
                pctAtual={pctAtual} 
                onMarcarConcluida={marcarConcluida} 
              />
            )}
          </div>

          <VideoaulaControlesAcao 
            concluida={state.concluida}
            favorito={state.favorito}
            marcarConcluida={marcarConcluida}
            toggleFavorito={toggleFavorito}
            user={user}
            area={state.aula?.area ?? state.catalogo?.titulo ?? 'Estudos Jurídicos'}
            videoId={videoId}
          />
        </div>

        {/* Coluna Lateral Direita: Ações da Aula & Panorama */}
        <div className="lg:col-span-3 xl:col-span-3 pt-3 lg:pt-0 space-y-4 lg:bg-card/40 lg:border lg:border-white/10 lg:rounded-2xl lg:p-4 lg:shadow-xl">
          <div className="hidden lg:block space-y-2 border-b border-border/60 pb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">Recursos da Aula</h2>
            <Suspense fallback={<div className="h-20 animate-pulse bg-muted rounded-xl" />}>
              <VideoaulaAcoesBar input={input} gridLayout gridCols={3} onOpenAnotacoes={() => setShowAnotacoes(true)} />
            </Suspense>
          </div>

          <h2 className="hidden lg:block text-sm font-bold text-foreground pb-2 border-b border-border">
            Panorama & Estudo com IA
          </h2>

          <VideoaulaPanoramaIA 
            resumo={resumo.data?.resumo}
            sobreAula={state.aula?.sobre_aula}
            descricao={state.aula?.descricao}
            isLoading={resumo.isLoading}
          />
        </div>
      </div>

      <AlertDialog open={state.showResumePrompt.show} onOpenChange={handleAlertClose}>
        <AlertDialogContent className="w-11/12 max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Continuar assistindo?</AlertDialogTitle>
            <AlertDialogDescription>
              Você já começou esta aula. Deseja continuar de {formatTempo(state.showResumePrompt.tempo)} ou recomeçar do zero?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel 
              onClick={() => {
                state.setInicio(0);
                seek(0);
                setTocandoState(true);
                state.setShowResumePrompt({ show: false, tempo: 0 });
              }}
              className="mt-0"
            >
              Começar do zero
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                state.setInicio(state.showResumePrompt.tempo);
                seek(state.showResumePrompt.tempo);
                setTocandoState(true);
                state.setShowResumePrompt({ show: false, tempo: 0 });
              }}
            >
              Continuar de onde parei
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer Fixo de Ações APENAS para Telas Mobile */}
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
