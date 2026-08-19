import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Scale } from 'lucide-react';
import PhaserCourtroom from '@/components/laboratorio/tribunal/PhaserCourtroom';
import { DialoguePanel } from '@/components/laboratorio/tribunal/ui/DialoguePanel';
import { ChoicePanel } from '@/components/laboratorio/tribunal/ui/ChoicePanel';
import { ScoreMeter } from '@/components/laboratorio/tribunal/ui/ScoreMeter';
import { VerdictModal } from '@/components/laboratorio/tribunal/ui/VerdictModal';
import { useCourtGame } from '@/lib/tribunal/useCourtGame';

const TribunalSimulado = () => {
  const game = useCourtGame();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 h-full w-full overflow-hidden bg-[#090705] text-white">
      <div className="absolute inset-0 z-0">
        <PhaserCourtroom speaker={game.dialogue?.speaker} actionNonce={game.actionNonce} />
      </div>

      <div className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_50%_20%,rgba(255,244,214,0.16),transparent_35%),linear-gradient(180deg,rgba(8,6,5,0.16)_0%,rgba(8,6,5,0.05)_43%,rgba(8,6,5,0.88)_100%)]" />

      <div className="pointer-events-none relative z-10 flex h-full flex-col">
        <header className="pointer-events-auto px-4 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] sm:px-6">
          <div className="mx-auto flex max-w-6xl items-start gap-3">
            <button
              onClick={() => navigate('/laboratorio')}
              className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-white/15 bg-black/55 px-3 text-sm font-semibold text-white/90 shadow-lg backdrop-blur-md transition hover:bg-black/75"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>

            <div className="min-w-0 flex-1 rounded-xl border border-white/12 bg-black/45 px-3 py-2 shadow-lg backdrop-blur-md sm:px-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Scale className="h-4 w-4 shrink-0 text-amber-300" />
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-black uppercase tracking-[0.2em] text-amber-200/80">
                      Tribunal: Defesa Criminal
                    </p>
                    <h1 className="truncate text-sm font-black leading-tight text-white sm:text-base">
                      {game.phase.title}
                    </h1>
                  </div>
                </div>
                <span className="hidden rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/70 sm:inline-flex">
                  Fase atual
                </span>
              </div>
              <ScoreMeter scores={game.scores} />
            </div>
          </div>
        </header>

        <main className="relative flex-1">
          {game.isLastDialogue && game.phase.choices && !game.verdict && (
            <div className="pointer-events-auto absolute inset-x-0 top-[38%] flex -translate-y-1/2 justify-center px-4 sm:top-1/2">
              <ChoicePanel choices={game.phase.choices} onChoose={game.makeChoice} />
            </div>
          )}

          {!game.verdict && (
            <div className="pointer-events-auto absolute inset-x-0 bottom-0 flex justify-center px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:px-6 sm:pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]">
              <DialoguePanel
                dialogue={game.dialogue}
                onNext={game.advanceDialogue}
                canAdvance={!game.isLastDialogue || !game.phase.choices}
              />
            </div>
          )}
        </main>

        {game.verdict && (
          <div className="pointer-events-auto">
            <VerdictModal verdict={game.verdict} feedbacks={game.feedbacks} onRestart={game.resetGame} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TribunalSimulado;
