import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, GitFork } from 'lucide-react';

/**
 * Detecta se o texto bruto de um bloco `<pre>` contém um fluxograma.
 */
export function isFlowchartBlock(raw: string): boolean {
  if (!raw) return false;
  const hasArrows = raw.includes('▼') || raw.includes('──>') || raw.includes('-->') || raw.includes('│');
  const hasBrackets = (raw.match(/\[/g) || []).length >= 2;
  return hasArrows && hasBrackets;
}

type FlowNode = { text: string; desc?: string };
type FlowLevel = FlowNode[];

/** Detecta se é uma árvore com ramificações (┌┴┐ ou 2+ nós na mesma linha). */
function hasBranching(raw: string): boolean {
  return raw.includes('┌') || raw.includes('┴') || raw.includes('┐') ||
    /\]\s{2,}\[/.test(raw); // dois colchetes na mesma linha
}

/**
 * Parseia o texto ASCII em níveis de nós. Agrupa nós por nível vertical.
 */
function parseFlowTree(raw: string): FlowLevel[] {
  const lines = raw.split('\n');
  const levels: FlowLevel[] = [];
  let pendingNodes: FlowNode[] = [];
  let collecting = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Extrair todos os [texto] da linha
    const nodeMatches: string[] = [];
    const regex = /\[([^\]]+)\]/g;
    let m;
    while ((m = regex.exec(line)) !== null) {
      const t = m[1].trim();
      if (t.length > 1 &&
        !t.toLowerCase().startsWith('animação') &&
        !t.toLowerCase().startsWith('fluxo visual') &&
        !t.toLowerCase().startsWith('interatividade')) {
        nodeMatches.push(t);
      }
    }

    if (nodeMatches.length > 0) {
      // Checar se a próxima linha contém continuação multi-linha de nós (ex: "A CULPA: ISENTO ]")
      const nextLine = lines[i + 1] || '';
      const nextClosers = nextLine.match(/([^[\]]+)\]/g);

      // Checar se a linha seguinte tem descrições em parênteses
      const descLine = lines[i + 1] || '';
      const descMatches: string[] = [];
      const descRegex = /\(([^)]+)\)/g;
      let dm;
      while ((dm = descRegex.exec(descLine)) !== null) {
        descMatches.push(dm[1].trim());
      }

      const nodes: FlowNode[] = nodeMatches.map((text, idx) => ({
        text,
        desc: descMatches[idx] || undefined,
      }));

      if (pendingNodes.length > 0 && pendingNodes.length === nodes.length) {
        // Merge multi-line nodes
        for (let j = 0; j < nodes.length; j++) {
          pendingNodes[j].text += ' ' + nodes[j].text;
          if (nodes[j].desc) pendingNodes[j].desc = nodes[j].desc;
        }
        levels.push(pendingNodes);
        pendingNodes = [];
        collecting = false;
      } else if (pendingNodes.length > 0) {
        levels.push(pendingNodes);
        pendingNodes = [];
        collecting = false;
      }

      // Check if next lines have continuation brackets (multi-line node)
      if (nextClosers && !nextLine.includes('[') && nextLine.includes(']')) {
        pendingNodes = nodes;
        collecting = true;
      } else {
        levels.push(nodes);
      }
    }
  }

  if (pendingNodes.length > 0) {
    levels.push(pendingNodes);
  }

  return levels.filter(l => l.length > 0);
}

/** Parse linear (sem ramificação) */
function parseLinearNodes(raw: string): string[] {
  const nodes: string[] = [];
  const regex = /\[([^\]]+)\]/g;
  let m;
  while ((m = regex.exec(raw)) !== null) {
    const text = m[1].trim();
    if (text.length > 1 &&
      !text.toLowerCase().startsWith('animação') &&
      !text.toLowerCase().startsWith('fluxo visual')) {
      nodes.push(text);
    }
  }
  return nodes;
}

const COLORS = [
  { bg: 'from-primary/25 to-primary/10', border: 'border-primary/50', glow: 'shadow-[0_0_20px_hsl(var(--primary)/0.25)]', dot: 'bg-primary', line: 'bg-primary/50' },
  { bg: 'from-sky-500/20 to-sky-500/8', border: 'border-sky-400/40', glow: 'shadow-[0_0_20px_rgba(56,189,248,0.2)]', dot: 'bg-sky-400', line: 'bg-sky-400/40' },
  { bg: 'from-violet-500/20 to-violet-500/8', border: 'border-violet-400/40', glow: 'shadow-[0_0_20px_rgba(167,139,250,0.2)]', dot: 'bg-violet-400', line: 'bg-violet-400/40' },
  { bg: 'from-amber-500/20 to-amber-500/8', border: 'border-amber-400/40', glow: 'shadow-[0_0_20px_rgba(251,191,36,0.2)]', dot: 'bg-amber-400', line: 'bg-amber-400/40' },
  { bg: 'from-emerald-500/20 to-emerald-500/8', border: 'border-emerald-400/40', glow: 'shadow-[0_0_20px_rgba(52,211,153,0.2)]', dot: 'bg-emerald-400', line: 'bg-emerald-400/40' },
  { bg: 'from-rose-500/20 to-rose-500/8', border: 'border-rose-400/40', glow: 'shadow-[0_0_20px_rgba(251,113,133,0.2)]', dot: 'bg-rose-400', line: 'bg-rose-400/40' },
];

function NodeCard({ node, color, index, delay }: { node: FlowNode; color: typeof COLORS[0]; index: number; delay: number }) {
  return (
    <motion.div
      className={`relative z-10 w-full rounded-2xl border ${color.border} bg-gradient-to-br ${color.bg} backdrop-blur-md p-3.5 sm:p-4 ${color.glow}`}
      initial={{ opacity: 0, y: 25, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.21, 1.04, 0.58, 1] }}
    >
      <div className="absolute -top-2.5 -left-2">
        <motion.span
          className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full ${color.dot} text-black font-black text-[10px] sm:text-xs shadow-lg`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: delay + 0.15, type: 'spring', stiffness: 400 }}
        >
          {index + 1}
        </motion.span>
      </div>
      <p className="text-[13px] sm:text-[14px] md:text-[15px] font-semibold text-neutral-100 leading-snug pl-4">
        {node.text}
      </p>
      {node.desc && (
        <p className="text-[11px] sm:text-[12px] text-neutral-400 mt-1.5 pl-4 italic">
          {node.desc}
        </p>
      )}
    </motion.div>
  );
}

function Connector({ delay, branching }: { delay: number; branching?: boolean }) {
  return (
    <motion.div
      className="flex flex-col items-center py-1.5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, delay }}
    >
      <motion.div
        className="w-[2px] h-5 bg-white/15 rounded-full"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.3, delay }}
      />
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: delay + 0.15 }}
      >
        {branching ? (
          <GitFork className="w-4 h-4 text-primary/70 rotate-180" strokeWidth={2.5} />
        ) : (
          <ArrowDown className="w-4 h-4 text-primary/70" strokeWidth={2.5} />
        )}
      </motion.div>
    </motion.div>
  );
}

/** Layout de árvore com ramificações */
function TreeLayout({ levels }: { levels: FlowLevel[] }) {
  let nodeCounter = 0;

  return (
    <div className="my-6 sm:my-8 flex flex-col items-center gap-0 w-full">
      {levels.map((level, lIdx) => {
        const isBranch = level.length > 1;
        const prevIsBranch = lIdx > 0 && levels[lIdx - 1].length > 1;
        const delay = lIdx * 0.25;

        return (
          <div key={lIdx} className="flex flex-col items-center w-full">
            {/* Conector antes do nível */}
            {lIdx > 0 && (
              <Connector delay={delay - 0.1} branching={isBranch && !prevIsBranch} />
            )}

            {isBranch ? (
              /* Nível com ramificações */
              <div className="w-full">
                {/* Linha horizontal de conexão */}
                <motion.div
                  className="relative mx-auto flex items-start justify-center"
                  style={{ maxWidth: level.length * 220 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay }}
                >
                  {/* Barra horizontal */}
                  <motion.div
                    className="absolute top-0 h-[2px] bg-gradient-to-r from-sky-400/40 via-primary/40 to-violet-400/40 rounded-full"
                    style={{ left: `${100 / (level.length * 2)}%`, right: `${100 / (level.length * 2)}%` }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.5, delay: delay + 0.05 }}
                  />

                  <div className={`grid gap-3 sm:gap-4 w-full pt-4 ${level.length === 2 ? 'grid-cols-2' : level.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    {level.map((node, nIdx) => {
                      const color = COLORS[(nodeCounter) % COLORS.length];
                      const card = (
                        <div key={nIdx} className="flex flex-col items-center">
                          {/* Linha vertical descendo da barra */}
                          <motion.div
                            className="w-[2px] h-4 bg-white/15 rounded-full mb-1"
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{ duration: 0.2, delay: delay + 0.15 + nIdx * 0.1 }}
                          />
                          <NodeCard node={node} color={color} index={nodeCounter} delay={delay + 0.1 + nIdx * 0.15} />
                        </div>
                      );
                      nodeCounter++;
                      return card;
                    })}
                  </div>
                </motion.div>
              </div>
            ) : (
              /* Nível com nó único (raiz ou intermediário) */
              <div className="w-full max-w-[380px] mx-auto">
                {level.map((node, nIdx) => {
                  const color = COLORS[(nodeCounter) % COLORS.length];
                  const card = <NodeCard key={nIdx} node={node} color={color} index={nodeCounter} delay={delay} />;
                  nodeCounter++;
                  return card;
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Layout linear (sem ramificações) */
function LinearLayout({ nodes }: { nodes: string[] }) {
  return (
    <div className="my-6 sm:my-8 flex flex-col items-center gap-0 relative">
      {nodes.map((node, i) => {
        const color = COLORS[i % COLORS.length];
        const isLast = i === nodes.length - 1;

        return (
          <div key={i} className="flex flex-col items-center w-full">
            <div className="w-full max-w-[380px] mx-auto">
              <NodeCard node={{ text: node }} color={color} index={i} delay={i * 0.2} />
            </div>
            {!isLast && <Connector delay={i * 0.2 + 0.3} />}
          </div>
        );
      })}
    </div>
  );
}

export function FluxogramaAnimado({ raw }: { raw: string }) {
  const isBranching = useMemo(() => hasBranching(raw), [raw]);

  const treeLevels = useMemo(() => {
    if (!isBranching) return null;
    return parseFlowTree(raw);
  }, [raw, isBranching]);

  const linearNodes = useMemo(() => {
    if (isBranching) return null;
    return parseLinearNodes(raw);
  }, [raw, isBranching]);

  if (isBranching && treeLevels && treeLevels.length >= 2) {
    return <TreeLayout levels={treeLevels} />;
  }

  if (linearNodes && linearNodes.length >= 2) {
    return <LinearLayout nodes={linearNodes} />;
  }

  return null;
}
