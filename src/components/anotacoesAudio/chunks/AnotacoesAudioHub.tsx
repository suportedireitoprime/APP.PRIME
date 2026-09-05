import React from 'react';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { View, HUB_ITENS } from './anotacoesAudioConstants';

interface AnotacoesAudioHubProps {
  goto: (v: View) => void;
}

export const AnotacoesAudioHub: React.FC<AnotacoesAudioHubProps> = ({ goto }) => {
  return (
    <>
      <p className="mb-8 text-sm text-muted-foreground">
        Grave, importe e transforme aulas em resumos prontos pra estudar.
      </p>
      <div className="space-y-2">
        {HUB_ITENS.map((f, i) => {
          const Icon = f.icon;
          const primary = f.id === 'gravar';

          if (primary) {
            return (
              <motion.button
                key={f.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => goto(f.id)}
                className="flex items-center gap-4 p-5 min-h-[88px] rounded-3xl border w-full transition-all group text-left bg-primary/10 border-primary/40 hover:border-primary mb-6"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                  <Icon className="w-7 h-7" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    {f.label}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-tight">{f.desc}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </motion.button>
            );
          }

          return (
            <motion.button
              key={f.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => goto(f.id)}
              className="flex items-center gap-4 p-4 rounded-2xl w-full transition-all group text-left bg-transparent hover:bg-secondary/40 active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-secondary/80 text-primary">
                <Icon className="w-6 h-6" strokeWidth={1.6} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-[15px] font-bold text-foreground group-hover:text-primary transition-colors uppercase tracking-wider">
                  {f.label}
                </p>
                <p className="text-[13px] text-muted-foreground mt-0.5 leading-tight">{f.desc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
            </motion.button>
          );
        })}
      </div>
    </>
  );
};
