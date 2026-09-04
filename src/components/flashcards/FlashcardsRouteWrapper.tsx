import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { NativeFlashcards } from '@/plugins/NativeFlashcardsPlugin';
import { supabase } from '@/integrations/supabase/client';

interface FlashcardsRouteWrapperProps {
  children: React.ReactNode;
}

/**
 * Encapsulador de rota para Flashcards com estratégia Dual-Stack:
 * - No Mobile Nativo (Android/iOS): Abre instantaneamente o Hub Nativo em Kotlin (Compose) ou Swift (SwiftUI).
 * - Na Web & Desktop: Renderiza a árvore React normalmente com máxima responsividade.
 */
export const FlashcardsRouteWrapper: React.FC<FlashcardsRouteWrapperProps> = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      let isMounted = true;

      // Listener para salvar respostas dos flashcards no Supabase mesmo que feitas nativamente
      const subCard = NativeFlashcards.addListener('onCardAnswered', async ({ cardId, status, area, tema }) => {
        try {
          const { data: auth } = await supabase.auth.getUser();
          if (auth.user) {
            await supabase.from('flashcards_progresso').upsert({
              user_id: auth.user.id,
              card_id: cardId,
              area: area,
              tema: tema,
              status: status,
              ultima_resposta_em: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.warn('[FlashcardsRouteWrapper] Falha ao persistir progresso nativo no Supabase:', e);
        }
      });

      const subClose = NativeFlashcards.addListener('onClose', () => {
        if (isMounted) {
          navigate('/');
        }
      });

      // Dispara o Hub Nativo
      NativeFlashcards.openHub().catch((err) => {
        console.warn('[FlashcardsRouteWrapper] Erro ao abrir Hub nativo, usando fallback web:', err);
      });

      return () => {
        isMounted = false;
        subCard.then(h => h.remove()).catch(() => {});
        subClose.then(h => h.remove()).catch(() => {});
      };
    }
  }, [navigate]);

  return <>{children}</>;
};

export default FlashcardsRouteWrapper;
