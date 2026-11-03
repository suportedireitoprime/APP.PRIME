import React from 'react';
import { AudioaulasPlayerProvider } from './AudioaulasPlayerContext';
import { PilulasPlayerProvider } from './PilulasPlayerContext';
import { VideoaulasPlayerProvider } from './VideoaulasPlayerContext';
import { ResumoLivroPlayerProvider } from './ResumoLivroPlayerContext';
import { AudiobookPlayerProvider } from './AudiobookPlayerContext';

/**
 * UniversalMediaPlayerProvider
 * 
 * Agrupa os reprodutores de mídia da aplicação (Audioaulas,
 * Pílulas, Videoaulas, Resumo de Livros e Audiobooks) sob uma coordenação universal centralizada,
 * garantindo:
 * 1. Prevenção de reprodução simultânea (ao tocar um áudio, os outros pausam automaticamente).
 * 2. Gestão unificada de MediaSession e WakeLock.
 * 3. Redução drástica da profundidade da árvore de providers no App.tsx.
 */
export const UniversalMediaPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AudioaulasPlayerProvider>
    <AudiobookPlayerProvider>
      <PilulasPlayerProvider>
        <VideoaulasPlayerProvider>
          <ResumoLivroPlayerProvider>
            {children}
          </ResumoLivroPlayerProvider>
        </VideoaulasPlayerProvider>
      </PilulasPlayerProvider>
    </AudiobookPlayerProvider>
  </AudioaulasPlayerProvider>
);

export default UniversalMediaPlayerProvider;
