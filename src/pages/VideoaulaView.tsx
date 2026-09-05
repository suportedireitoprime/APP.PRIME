import { Suspense, useMemo, useState, useEffect } from 'react';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
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
import { VideoaulaPlayerHeader } from '@/components/videoaulas/view/VideoaulaPlayerHeader';
import { VideoaulaResumeDialog } from '@/components/videoaulas/view/VideoaulaResumeDialog';

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

      <div className="w-full 2xl:max-w-[1750px] mx-auto px-2 sm:px-4 lg:px-6 lg:pt-4 lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
        {/* Coluna Principal: Player de Vídeo e Recursos */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          <div className="space-y-4">
            <VideoaulaPlayerHeader
              tempo={tempo}
              displayDuracao={displayDuracao}
              pctAtual={pctAtual}
              tituloLimpo={tituloLimpo}
            />

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

          {/* Recursos da Aula e Panorama (abaixo do vídeo) */}
          <div className="hidden lg:block space-y-6 lg:bg-card/40 lg:border lg:border-border/60 lg:rounded-2xl lg:p-6 lg:shadow-sm">
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-2">Recursos da Aula</h2>
              <Suspense fallback={<div className="h-20 animate-pulse bg-muted rounded-xl" />}>
                <VideoaulaAcoesBar input={input} gridLayout gridCols={4} onOpenAnotacoes={() => setShowAnotacoes(true)} />
              </Suspense>
            </div>

            <div className="space-y-4 pt-2">
              <h2 className="text-sm font-bold text-foreground pb-2 border-b border-border/60">
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
        </div>

        {/* Coluna Direita: Aulas da Matéria */}
        <div className="hidden lg:block lg:col-span-4 xl:col-span-3">
          <VideoaulaSidebarDesktop 
            aulasDaArea={state.aulasDaArea}
            videoId={videoId}
            catalogoId={state.catalogo.id}
            areaSlug={areaSlug}
          />
        </div>
      </div>

      <VideoaulaResumeDialog
        open={state.showResumePrompt.show}
        tempo={state.showResumePrompt.tempo}
        onOpenChange={handleAlertClose}
        onRestart={() => {
          state.setInicio(0);
          seek(0);
          setTocandoState(true);
          state.setShowResumePrompt({ show: false, tempo: 0 });
        }}
        onResume={() => {
          state.setInicio(state.showResumePrompt.tempo);
          seek(state.showResumePrompt.tempo);
          setTocandoState(true);
          state.setShowResumePrompt({ show: false, tempo: 0 });
        }}
      />

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
