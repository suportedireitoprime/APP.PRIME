import React, { useEffect, useRef } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { createCourtSceneClass } from '@/lib/tribunal/CourtScene';
import { CharacterRole } from '@/lib/tribunal/courtGameData';

interface PhaserCourtroomProps {
  speaker?: CharacterRole;
  actionNonce?: number;
}

const PhaserCourtroom: React.FC<PhaserCourtroomProps> = ({ speaker, actionNonce = 0 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameInstance = useRef<any>(null);
  const sceneRef = useRef<any>(null);
  const pendingSpeaker = useRef<CharacterRole | undefined>(speaker);

  useEffect(() => {
    if (!containerRef.current || gameInstance.current) return;

    let disposed = false;

    import('phaser')
      .then((phaserModule) => {
        if (disposed || !containerRef.current) return;

        const Phaser = phaserModule.default || phaserModule;
        const CourtScene = createCourtSceneClass(Phaser);

        const config = {
          type: Phaser.AUTO,
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
          parent: containerRef.current,
          backgroundColor: '#090705',
          scene: CourtScene,
          transparent: true,
          scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH,
          },
        };

        gameInstance.current = new Phaser.Game(config);
        gameInstance.current.events.once('ready', () => {
          sceneRef.current = gameInstance.current.scene.getScene('CourtScene');
          if (pendingSpeaker.current) {
            sceneRef.current?.setActiveSpeaker?.(pendingSpeaker.current);
          }
        });
      })
      .catch((err) => console.error('Failed to load Phaser', err));

    return () => {
      disposed = true;
      sceneRef.current = null;
      if (gameInstance.current) {
        gameInstance.current.destroy(true);
        gameInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    pendingSpeaker.current = speaker;
    if (speaker) {
      sceneRef.current?.setActiveSpeaker?.(speaker);
    }
  }, [speaker]);

  useEffect(() => {
    if (actionNonce > 0) {
      sceneRef.current?.playCourtAction?.('objection');
    }
  }, [actionNonce]);

  return (
    <div className="absolute inset-0 h-full w-full bg-[#090705]">
      <ErrorBoundary>
        <div ref={containerRef} className="h-full w-full" />
      </ErrorBoundary>
    </div>
  );
};

export default PhaserCourtroom;
