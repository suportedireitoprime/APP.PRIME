import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { DialogueNode } from '@/lib/tribunal/courtGameData';
import { courtAudio } from '@/lib/tribunal/useCourtGame';

interface Props {
  dialogue: DialogueNode;
  onNext: () => void;
  canAdvance: boolean;
}

const speakerNames: Record<string, string> = {
  juiz: 'Juiz',
  promotor: 'Promotor',
  defesa: 'Defesa',
  reu: 'Cliente',
  testemunha: 'Testemunha',
  professor: 'Professor',
};

const speakerStyles: Record<string, string> = {
  juiz: 'bg-slate-950 text-amber-100 border-amber-300/35',
  promotor: 'bg-rose-950 text-rose-50 border-rose-300/30',
  defesa: 'bg-blue-950 text-blue-50 border-blue-300/30',
  reu: 'bg-amber-950 text-amber-50 border-amber-300/30',
  testemunha: 'bg-teal-950 text-teal-50 border-teal-300/30',
  professor: 'bg-violet-950 text-violet-50 border-violet-300/30',
};

export const DialoguePanel: React.FC<Props> = ({ dialogue, onNext, canAdvance }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (!dialogue) return;

    setDisplayedText('');
    let index = 0;

    const intervalId = window.setInterval(() => {
      if (index < dialogue.text.length) {
        setDisplayedText(dialogue.text.slice(0, index + 1));
        index += 1;

        if (index % 2 === 0 && dialogue.text.charAt(index - 1) !== ' ') {
          courtAudio.playBlip(dialogue.speaker);
        }
      } else {
        window.clearInterval(intervalId);
      }
    }, 18);

    return () => window.clearInterval(intervalId);
  }, [dialogue]);

  if (!dialogue) return null;

  const finishedTyping = displayedText.length >= dialogue.text.length;

  const handleInteraction = () => {
    courtAudio.init();

    if (!finishedTyping) {
      setDisplayedText(dialogue.text);
      return;
    }

    if (canAdvance) {
      onNext();
    }
  };

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      onPointerDown={() => courtAudio.init()}
      onClick={handleInteraction}
      className="group w-full max-w-4xl rounded-2xl border border-white/25 bg-white/[0.96] p-4 text-left shadow-[0_-18px_55px_rgba(0,0,0,0.45)] backdrop-blur-xl transition hover:bg-white sm:p-5"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span
          className={`inline-flex max-w-full items-center rounded-lg border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] ${
            speakerStyles[dialogue.speaker] || 'bg-slate-900 text-white border-white/20'
          }`}
        >
          {speakerNames[dialogue.speaker] || dialogue.speaker}
        </span>

        {canAdvance && finishedTyping && (
          <span className="hidden items-center gap-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 group-hover:text-slate-900 sm:inline-flex">
            Avançar
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        )}
      </div>

      <p className="min-h-[4.75rem] text-[1.02rem] font-medium leading-7 text-slate-950 sm:min-h-[5.25rem] sm:text-lg sm:leading-8">
        {displayedText}
      </p>

      {canAdvance && finishedTyping && (
        <div className="mt-3 flex justify-end sm:hidden">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">
            Tocar
            <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      )}
    </motion.button>
  );
};
