import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Scale, CheckCircle2, ArrowRight } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

export type ComparativoData = {
  titulo?: string;
  col1: {
    titulo?: string;
    itens: string[];
  };
  col2: {
    titulo?: string;
    itens: string[];
  };
};

export function isComparativeBlock(raw: string): boolean {
  if (!raw) return false;
  const t = raw.trim();
  const brackets = [...t.matchAll(/\[\s*([A-Z0-9\s\(\)ªº]+)\s*\]/gi)];
  return brackets.length >= 2 && t.includes('•');
}

export function parseComparative(raw: string): ComparativoData {
  const lines = raw.split('\n');
  const brackets = [...raw.matchAll(/\[\s*([A-Z0-9\s\(\)ªº\-]+)\s*\]/gi)];

  let colTitles: string[] = [];
  let mainTitle: string | undefined = undefined;

  if (brackets.length === 2) {
    colTitles = [brackets[0][1].trim(), brackets[1][1].trim()];
  } else if (brackets.length >= 3) {
    mainTitle = brackets[0][1].trim();
    colTitles = [brackets[1][1].trim(), brackets[2][1].trim()];
  }

  const col1Items: string[] = [];
  const col2Items: string[] = [];

  for (const line of lines) {
    if (!line.includes('•')) continue;
    const parts = line.split(/•/);
    if (parts.length >= 3) {
      col1Items.push(parts[1].trim());
      col2Items.push(parts[2].trim());
    } else if (parts.length === 2) {
      col1Items.push(parts[1].trim());
    }
  }

  return {
    titulo: mainTitle,
    col1: {
      titulo: colTitles[0] || 'Hipótese A',
      itens: col1Items,
    },
    col2: {
      titulo: colTitles[1] || 'Hipótese B',
      itens: col2Items,
    },
  };
}

export function ComparativoBlocos({ raw }: { raw: string }) {
  const data = useMemo(() => parseComparative(raw), [raw]);

  if (!data.col1.itens.length && !data.col2.itens.length) return null;

  return (
    <div className="my-8 rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#18181b] to-[#121214] p-4 sm:p-6 shadow-2xl overflow-hidden">
      {data.titulo && (
        <div className="flex items-center gap-2 mb-6 pb-3 border-b border-white/[0.06]">
          <Scale className="w-5 h-5 text-primary" />
          <h4 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-white">
            {data.titulo}
          </h4>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Coluna 1 */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl border border-primary/30 bg-[#1c1c20]/90 p-4 sm:p-5 shadow-lg flex flex-col"
        >
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/[0.08]">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            <h5 className="font-sans font-bold text-white text-base sm:text-lg leading-snug">
              {data.col1.titulo}
            </h5>
          </div>

          <ul className="space-y-3 flex-1">
            {data.col1.itens.map((item, idx) => (
              <li
                key={idx}
                className="text-xs sm:text-sm text-neutral-200 leading-relaxed flex items-start gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Coluna 2 */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="rounded-2xl border border-amber-400/30 bg-[#1c1c20]/90 p-4 sm:p-5 shadow-lg flex flex-col"
        >
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/[0.08]">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <h5 className="font-sans font-bold text-white text-base sm:text-lg leading-snug">
              {data.col2.titulo}
            </h5>
          </div>

          <ul className="space-y-3 flex-1">
            {data.col2.itens.map((item, idx) => (
              <li
                key={idx}
                className="text-xs sm:text-sm text-neutral-200 leading-relaxed flex items-start gap-2"
              >
                <ArrowRight className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
