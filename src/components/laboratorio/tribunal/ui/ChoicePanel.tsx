import React from 'react';
import { motion } from 'framer-motion';
import { Gavel, MessageSquareText } from 'lucide-react';
import { Choice } from '@/lib/tribunal/courtGameData';

interface Props {
  choices: Choice[];
  onChoose: (choice: Choice) => void;
}

export const ChoicePanel: React.FC<Props> = ({ choices, onChoose }) => {
  return (
    <motion.div
      initial={{ scale: 0.97, opacity: 0, y: 12 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      className="w-full max-w-xl rounded-2xl border border-white/15 bg-slate-950/82 p-3 shadow-2xl backdrop-blur-xl sm:p-4"
    >
      <div className="mb-3 flex items-center gap-2 px-1 text-amber-100">
        <Gavel className="h-4 w-4" />
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em]">Escolha sua estratégia</h2>
      </div>

      <div className="grid gap-2">
        {choices.map((choice, idx) => (
          <motion.button
            key={choice.id}
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            onClick={() => onChoose(choice)}
            className="group flex min-h-14 w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.07] p-3 text-left text-sm font-semibold leading-snug text-white shadow-lg transition hover:border-amber-200/45 hover:bg-amber-100 hover:text-slate-950 active:scale-[0.99] sm:text-base"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black/35 text-amber-200 transition group-hover:bg-slate-950 group-hover:text-amber-200">
              <MessageSquareText className="h-4 w-4" />
            </span>
            <span className="min-w-0 break-words">{choice.text}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};
