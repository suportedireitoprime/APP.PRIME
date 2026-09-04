import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { NativeVideoaulas } from '@/plugins/NativeVideoaulasPlugin';
import { supabase } from '@/integrations/supabase/client';

interface VideoaulasRouteWrapperProps {
  children: React.ReactNode;
}

/**
 * Encapsulador de rota para Videoaulas com arquitetura Dual-Stack:
 * - No Mobile Nativo (Android/iOS): Executa em 100% Kotlin (Jetpack Compose) ou Swift (SwiftUI) a 120fps.
 * - Na Web & Desktop: Renderiza a árvore React normalmente com máxima fidelidade e responsividade.
 */
export const VideoaulasRouteWrapper: React.FC<VideoaulasRouteWrapperProps> = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      let isMounted = true;

      // Sincroniza progresso de videoaulas com o Supabase
      const subProgress = NativeVideoaulas.addListener('onVideoProgress', async ({ id, videoId, currentSeconds, durationSeconds, completed }) => {
        try {
          const { data: auth } = await supabase.auth.getUser();
          if (auth.user) {
            const percentual = durationSeconds > 0 ? Math.min(100, Math.round((currentSeconds / durationSeconds) * 100)) : (completed ? 100 : 0);
            await supabase.from('videoaulas_progresso').upsert({
              user_id: auth.user.id,
              tabela: 'videoaulas_areas_direito',
              registro_id: id,
              video_id: videoId || id,
              tempo_atual: currentSeconds,
              duracao: durationSeconds,
              percentual: percentual,
              concluida: completed,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,tabela,registro_id'
            });
          }
        } catch (e) {
          console.warn('[VideoaulasRouteWrapper] Falha ao persistir progresso de videoaula no Supabase:', e);
        }
      });

      const subClose = NativeVideoaulas.addListener('onClose', () => {
        if (isMounted) {
          navigate('/');
        }
      });

      // Abre o Hub Nativo
      NativeVideoaulas.openHub().catch((err) => {
        console.warn('[VideoaulasRouteWrapper] Erro ao abrir Hub nativo de videoaulas, usando fallback web:', err);
      });

      return () => {
        isMounted = false;
        subProgress.then(h => h.remove()).catch(() => {});
        subClose.then(h => h.remove()).catch(() => {});
      };
    }
  }, [navigate]);

  return <>{children}</>;
};

export default VideoaulasRouteWrapper;
