import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

/**
 * Detecta se o texto bruto de um bloco `<pre>` contém um fluxograma (nós conectados por setas ▼, │, ──>).
 */
export function isFlowchartBlock(raw: string): boolean {
  if (!raw) return false;
  const hasArrows = raw.includes('▼') || raw.includes('──>') || raw.includes('-->') || raw.includes('│');
  const hasBrackets = (raw.match(/\[/g) || []).length >= 2;
  return hasArrows && hasBrackets;
}

/** Extrai os nós de texto entre colchetes em sequência. */
function parseFlowNodes(raw: string): string[] {
  const nodes: string[] = [];
  const regex = /\[([^\]]+)\]/g;
  let m;
  while ((m = regex.exec(raw)) !== null) {
    const text = m[1].trim();
    if (text.length > 1 && !text.toLowerCase().startsWith('animação') && !text.toLowerCase().startsWith('fluxo visual')) {
      nodes.push(text);
    }
  }
  return nodes;
}

const NODE_COLORS = [
  { bg: 'from-primary/25 to-primary/10', border: 'border-primary/50', glow: 'shadow-[0_0_20px_hsl(var(--primary)/0.25)]', dot: 'bg-primary' },
  { bg: 'from-sky-500/20 to-sky-500/8', border: 'border-sky-400/40', glow: 'shadow-[0_0_20px_rgba(56,189,248,0.2)]', dot: 'bg-sky-400' },
  { bg: 'from-violet-500/20 to-violet-500/8', border: 'border-violet-400/40', glow: 'shadow-[0_0_20px_rgba(167,139,250,0.2)]', dot: 'bg-violet-400' },
  { bg: 'from-amber-500/20 to-amber-500/8', border: 'border-amber-400/40', glow: 'shadow-[0_0_20px_rgba(251,191,36,0.2)]', dot: 'bg-amber-400' },
  { bg: 'from-emerald-500/20 to-emerald-500/8', border: 'border-emerald-400/40', glow: 'shadow-[0_0_20px_rgba(52,211,153,0.2)]', dot: 'bg-emerald-400' },
  { bg: 'from-rose-500/20 to-rose-500/8', border: 'border-rose-400/40', glow: 'shadow-[0_0_20px_rgba(251,113,133,0.2)]', dot: 'bg-rose-400' },
];

export function FluxogramaAnimado({ raw }: { raw: string }) {
  const nodes = useMemo(() => parseFlowNodes(raw), [raw]);

  if (nodes.length < 2) return null;

  return (
    <div className="my-6 sm:my-8 flex flex-col items-center gap-0 relative">
      {/* Linha central contínua atrás dos nós */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 w-[2px] bg-gradient-to-b from-primary/60 via-white/15 to-transparent rounded-full"
        style={{ top: 40, bottom: 20 }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />

      {nodes.map((node, i) => {
        const color = NODE_COLORS[i % NODE_COLORS.length];
        const isLast = i === nodes.length - 1;

        return (
          <div key={i} className="flex flex-col items-center w-full">
            {/* Nó */}
            <motion.div
              className={`relative z-10 w-full max-w-[400px] rounded-2xl border ${color.border} bg-gradient-to-br ${color.bg} backdrop-blur-md p-4 sm:p-5 ${color.glow} transition-all`}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.5,
                delay: i * 0.2,
                ease: [0.21, 1.04, 0.58, 1],
              }}
            >
              {/* Indicador numérico */}
              <div className="absolute -top-3 -left-2 sm:-left-3">
                <span className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full ${color.dot} text-black font-black text-xs sm:text-sm shadow-lg`}>
                  {i + 1}
                </span>
              </div>
              <p className="text-[14px] sm:text-[15px] md:text-[16px] font-semibold text-neutral-100 leading-snug pl-4 sm:pl-5">
                {node}
              </p>
            </motion.div>

            {/* Conector animado entre nós */}
            {!isLast && (
              <motion.div
                className="flex flex-col items-center py-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: i * 0.2 + 0.3 }}
              >
                <motion.div
                  className="w-[2px] h-6 bg-white/15 rounded-full"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.2 + 0.3 }}
                />
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.2 + 0.45 }}
                >
                  <ArrowDown className="w-4 h-4 text-primary/70" strokeWidth={2.5} />
                </motion.div>
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}
