import React from 'react';
import { AudioaulasPlayerProvider } from './AudioaulasPlayerContext';
import { PilulasPlayerProvider } from './PilulasPlayerContext';
import { VideoaulasPlayerProvider } from './VideoaulasPlayerContext';
import { ResumoLivroPlayerProvider } from './ResumoLivroPlayerContext';

/**
 * UniversalMediaPlayerProvider
 * 
 * Agrupa os reprodutores de mídia da aplicação (Audioaulas,
 * Pílulas, Videoaulas e Resumo de Livros) sob uma coordenação universal centralizada,
 * garantindo:
 * 1. Prevenção de reprodução simultânea (ao tocar um áudio, os outros pausam automaticamente).
 * 2. Gestão unificada de MediaSession e WakeLock.
 * 3. Redução drástica da profundidade da árvore de providers no App.tsx.
 */
export const UniversalMediaPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AudioaulasPlayerProvider>
    <PilulasPlayerProvider>
      <VideoaulasPlayerProvider>
        <ResumoLivroPlayerProvider>
          {children}
        </ResumoLivroPlayerProvider>
      </VideoaulasPlayerProvider>
    </PilulasPlayerProvider>
  </AudioaulasPlayerProvider>
);

export default UniversalMediaPlayerProvider;
