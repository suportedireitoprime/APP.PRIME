import { lazy, Suspense } from 'react';

import { useVideoaulasPlayer } from '@/contexts/VideoaulasPlayerContext';
import { useAudioaulasPlayer } from '@/contexts/AudioaulasPlayerContext';
import { useLeisCantadasPlayer } from '@/contexts/LeisCantadasPlayerContext';
import { useResumoLivroPlayer } from '@/contexts/ResumoLivroPlayerContext';
import { useRecording } from '@/contexts/RecordingContext';
import { useNarracaoFlutuante } from '@/stores/useNarracaoFlutuante';

const GlobalVideoaulaMiniPlayer = lazy(() => import("@/components/videoaulas/GlobalVideoaulaMiniPlayer"));
const GlobalAudioaulasMiniPlayer = lazy(() => import("@/components/audioaulas/GlobalAudioaulasMiniPlayer"));
const GlobalLeisCantadasMiniPlayer = lazy(() => import("@/components/leis-cantadas/GlobalLeisCantadasMiniPlayer"));
const GlobalResumoMiniPlayer = lazy(() => import("@/components/biblioteca/GlobalResumoMiniPlayer").then(m => ({ default: m.GlobalResumoMiniPlayer })));
const ResumoLivroAudioSheet = lazy(() => import("@/components/biblioteca/ResumoLivroAudioSheet"));
const GravacaoFlutuante = lazy(() => import("@/components/GravacaoFlutuante").then(m => ({ default: m.GravacaoFlutuante })));
const NarracaoMiniPlayer = lazy(() => import("@/components/vademecum/NarracaoMiniPlayer"));

const VideoaulaWrapper = () => {
  const { atual } = useVideoaulasPlayer();
  if (!atual) return null;
  return <Suspense fallback={null}><GlobalVideoaulaMiniPlayer /></Suspense>;
};

const AudioaulasWrapper = () => {
  const { atualId } = useAudioaulasPlayer();
  if (!atualId) return null;
  return <Suspense fallback={null}><GlobalAudioaulasMiniPlayer /></Suspense>;
};

const LeisCantadasWrapper = () => {
  const { atualId } = useLeisCantadasPlayer();
  if (!atualId) return null;
  return <Suspense fallback={null}><GlobalLeisCantadasMiniPlayer /></Suspense>;
};

const ResumoWrapper = () => {
  const { livroAtual } = useResumoLivroPlayer();
  if (!livroAtual) return null;
  return (
    <Suspense fallback={null}>
      <GlobalResumoMiniPlayer />
      <ResumoLivroAudioSheet />
    </Suspense>
  );
};

const GravacaoWrapper = () => {
  const { status } = useRecording();
  if (status === 'idle') return null;
  return <Suspense fallback={null}><GravacaoFlutuante /></Suspense>;
};

const NarracaoWrapper = () => {
  const audio = useNarracaoFlutuante((s) => s.audio);
  if (!audio) return null;
  return <Suspense fallback={null}><NarracaoMiniPlayer /></Suspense>;
};

/**
 * Concentra todos os componentes de UI de mídia globais.
 * Os componentes pesados (com React Player, iframes, waveforms, etc)
 * só têm o JS baixado e parseado QUANDO seus respectivos contextos
 * indicam que há uma mídia ativa tocando ou pausada.
 */
export function LazyMediaPlayers() {
  return (
    <>
      <NarracaoWrapper />
      <GravacaoWrapper />
      <LeisCantadasWrapper />
      <AudioaulasWrapper />
      <VideoaulaWrapper />
      <ResumoWrapper />
    </>
  );
}
