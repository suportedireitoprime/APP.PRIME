import { Suspense } from 'react';
import { lazyWithRetry } from "@/utils/lazyWithRetry";

import { useVideoaulasPlayer } from '@/contexts/VideoaulasPlayerContext';
import { useAudioaulasPlayer } from '@/contexts/AudioaulasPlayerContext';
import { usePilulasPlayer } from '@/contexts/PilulasPlayerContext';
import { useLeisCantadasPlayer } from '@/contexts/LeisCantadasPlayerContext';
import { useResumoLivroPlayer } from '@/contexts/ResumoLivroPlayerContext';
import { useRecording } from '@/contexts/RecordingContext';
import { useNarracaoFlutuante } from '@/stores/useNarracaoFlutuante';

const GlobalVideoaulaMiniPlayer = lazyWithRetry(() => import("@/components/videoaulas/GlobalVideoaulaMiniPlayer"));
const GlobalAudioaulasMiniPlayer = lazyWithRetry(() => import("@/components/audioaulas/GlobalAudioaulasMiniPlayer"));
const GlobalPilulasMiniPlayer = lazyWithRetry(() => import("@/components/pilulas/GlobalPilulasMiniPlayer"));
const GlobalLeisCantadasMiniPlayer = lazyWithRetry(() => import("@/components/leis-cantadas/GlobalLeisCantadasMiniPlayer"));
const GlobalResumoMiniPlayer = lazyWithRetry(() => import("@/components/biblioteca/GlobalResumoMiniPlayer").then(m => ({ default: m.GlobalResumoMiniPlayer })));
const ResumoLivroAudioSheet = lazyWithRetry(() => import("@/components/biblioteca/ResumoLivroAudioSheet"));
const GravacaoFlutuante = lazyWithRetry(() => import("@/components/GravacaoFlutuante").then(m => ({ default: m.GravacaoFlutuante })));
const NarracaoMiniPlayer = lazyWithRetry(() => import('@/components/vademecum/media/NarracaoMiniPlayer'));

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

const PilulasWrapper = () => {
  const { livro } = usePilulasPlayer();
  if (!livro) return null;
  return <Suspense fallback={null}><GlobalPilulasMiniPlayer /></Suspense>;
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
      <PilulasWrapper />
      <AudioaulasWrapper />
      <VideoaulaWrapper />
      <ResumoWrapper />
    </>
  );
}
