import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, GitFork, Check, X } from 'lucide-react';

/**
 * Detecta se o texto bruto de um bloco `<pre>` contém um fluxograma.
 */
export function isFlowchartBlock(raw: string): boolean {
  if (!raw) return false;
  const hasArrows = raw.includes('▼') || raw.includes('──>') || raw.includes('-->') || raw.includes('│');
  const hasBoxes = raw.includes('┌') && raw.includes('┘');
  const hasBrackets = (raw.match(/\[/g) || []).length >= 2;
  return hasArrows && (hasBrackets || hasBoxes);
}

type FlowNode = { text: string; desc?: string };
type FlowLevel = FlowNode[];

/** Detecta se é uma árvore com ramificações (┌┴┐ ou 2+ nós na mesma linha). */
function hasBranching(raw: string): boolean {
  return raw.includes('┌') || raw.includes('┴') || raw.includes('┐') ||
    /\]\s{2,}\[/.test(raw);
}

/** Limpa numeração redundante (ex: "1. Fato Gerador" → "Fato Gerador") */
function cleanNodeText(text: string): string {
  return text.replace(/^\d+[\.\)\-]\s*/, '').trim();
}

/**
 * Parseia fluxograma linear com descrições ──> extraindo nós + descrições.
 */
function parseLinearWithDescriptions(raw: string): FlowNode[] {
  const nodes: FlowNode[] = [];
  const lines = raw.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match: [Node Text]  ──> Description
    const matchWithDesc = line.match(/\[([^\]]+)\]\s*(?:──>|-->|→)\s*(.+)/);
    if (matchWithDesc) {
      const text = cleanNodeText(matchWithDesc[1].trim());
      const desc = matchWithDesc[2].trim();
      if (text.length > 1 && !isIgnoredNode(text)) {
        nodes.push({ text, desc });
      }
      continue;
    }

    // Match: [Node Text] alone
    const matchSimple = line.match(/\[([^\]]+)\]/g);
    if (matchSimple) {
      for (const m of matchSimple) {
        const inner = m.slice(1, -1).trim();
        const text = cleanNodeText(inner);
        if (text.length > 1 && !isIgnoredNode(text)) {
          // Check next line for description in parentheses
          const nextLine = (lines[i + 1] || '').trim();
          const descMatch = nextLine.match(/^\(([^)]+)\)$/);
          nodes.push({ text, desc: descMatch ? descMatch[1] : undefined });
        }
      }
    }
  }

  return nodes;
}

function isIgnoredNode(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.startsWith('animação') ||
    lower.startsWith('fluxo visual') ||
    lower.startsWith('interatividade') ||
    lower.startsWith('transição');
}

/**
 * Parseia árvore com ramificações em níveis.
 */
function parseFlowTree(raw: string): FlowLevel[] {
  const lines = raw.split('\n');
  const levels: FlowLevel[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nodeMatches: FlowNode[] = [];
    const regex = /\[([^\]]+)\]/g;
    let m;
    while ((m = regex.exec(line)) !== null) {
      const text = cleanNodeText(m[1].trim());
      if (text.length > 1 && !isIgnoredNode(text)) {
        nodeMatches.push({ text });
      }
    }

    if (nodeMatches.length > 0) {
      // Check descriptions (parentheses) on next line
      const descLine = lines[i + 1] || '';
      const descRegex = /\(([^)]+)\)/g;
      let dm;
      const descs: string[] = [];
      while ((dm = descRegex.exec(descLine)) !== null) {
        descs.push(dm[1].trim());
      }
      for (let j = 0; j < nodeMatches.length; j++) {
        if (descs[j]) nodeMatches[j].desc = descs[j];
      }

      // Check if description comes via ──> on same line
      const arrowMatch = line.match(/\]\s*(?:──>|-->|→)\s*(.+)/);
      if (arrowMatch && nodeMatches.length === 1) {
        nodeMatches[0].desc = arrowMatch[1].trim();
      }

      // Try to merge with previous level if it's a continuation (multi-line brackets)
      const prevLevel = levels[levels.length - 1];
      if (prevLevel && prevLevel.length === nodeMatches.length) {
        // Check if lines between are only connectors
        let onlyConnectors = true;
        for (let k = i - 1; k >= 0; k--) {
          const checkLine = lines[k].trim();
          if (checkLine === '' || /^[│▼\|\s┌┴┐─]+$/.test(checkLine)) continue;
          if (/\[/.test(checkLine)) break;
          onlyConnectors = false;
          break;
        }
      }

      levels.push(nodeMatches);
    }
  }

  return levels.filter(l => l.length > 0);
}

/**
 * Parseia diagramas de caixas ASCII desenhadas com caracteres ┌ ┐ │ └ ┘ e bifurcações.
 */
export function parseAsciiBoxTree(rawText: string): FlowLevel[] {
  const lines = rawText.split('\n');
  const rawGroups: string[][][] = [];
  let currentGroup: string[][] | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isBottomBorder = /[└]/.test(line);
    const cellMatches = [...line.matchAll(/│([^│]+)│/g)];

    if (cellMatches.length > 0) {
      if (!currentGroup) {
        currentGroup = cellMatches.map((m) => [m[1].trim()]);
      } else {
        if (cellMatches.length === currentGroup.length) {
          cellMatches.forEach((m, idx) => {
            const val = m[1].trim();
            if (val) currentGroup![idx].push(val);
          });
        } else {
          rawGroups.push(currentGroup);
          currentGroup = cellMatches.map((m) => [m[1].trim()]);
        }
      }
    } else if (isBottomBorder && currentGroup) {
      rawGroups.push(currentGroup);
      currentGroup = null;
    }
  }
  if (currentGroup) rawGroups.push(currentGroup);

  const flowLevels: FlowLevel[] = [];

  for (const group of rawGroups) {
    const nodes: FlowNode[] = [];
    for (const col of group) {
      const filtered = col.filter(Boolean);
      if (!filtered.length) continue;
      const firstLine = filtered[0];
      const descLines = filtered.slice(1);
      const text = cleanNodeText(firstLine.replace(/^\[([^\]]+)\]$/, '$1'));
      const desc = descLines.join(' ').replace(/\s+/g, ' ').trim();
      if (text.length > 0 && !isIgnoredNode(text)) {
        nodes.push({ text, desc: desc.length > 0 ? desc : undefined });
      }
    }
    if (nodes.length > 0) {
      flowLevels.push(nodes);
    }
  }

  return flowLevels;
}

const COLORS = [
  { bg: 'from-primary/20 to-primary/8', border: 'border-primary/40', glow: 'shadow-[0_0_18px_hsl(var(--primary)/0.2)]', dot: 'bg-primary text-black', text: 'text-primary' },
  { bg: 'from-sky-500/18 to-sky-500/6', border: 'border-sky-400/35', glow: 'shadow-[0_0_18px_rgba(56,189,248,0.15)]', dot: 'bg-sky-400 text-black', text: 'text-sky-400' },
  { bg: 'from-violet-500/18 to-violet-500/6', border: 'border-violet-400/35', glow: 'shadow-[0_0_18px_rgba(167,139,250,0.15)]', dot: 'bg-violet-400 text-black', text: 'text-violet-400' },
  { bg: 'from-amber-500/18 to-amber-500/6', border: 'border-amber-400/35', glow: 'shadow-[0_0_18px_rgba(251,191,36,0.15)]', dot: 'bg-amber-400 text-black', text: 'text-amber-400' },
  { bg: 'from-emerald-500/18 to-emerald-500/6', border: 'border-emerald-400/35', glow: 'shadow-[0_0_18px_rgba(52,211,153,0.15)]', dot: 'bg-emerald-400 text-black', text: 'text-emerald-400' },
  { bg: 'from-rose-500/18 to-rose-500/6', border: 'border-rose-400/35', glow: 'shadow-[0_0_18px_rgba(251,113,133,0.15)]', dot: 'bg-rose-400 text-white', text: 'text-rose-400' },
];

function NodeCard({ node, color, index, delay }: { node: FlowNode; color: typeof COLORS[0]; index: number; delay: number }) {
  const cleanUpper = node.text.trim().toUpperCase();
  const isSim = cleanUpper === 'SIM';
  const isNao = cleanUpper === 'NÃO' || cleanUpper === 'NAO';

  const customColor = isSim
    ? {
        bg: 'from-emerald-500/25 via-emerald-500/10 to-transparent',
        border: 'border-emerald-400/60',
        glow: 'shadow-[0_0_20px_rgba(52,211,153,0.25)]',
        dot: 'bg-emerald-400 text-black',
        text: 'text-emerald-300',
      }
    : isNao
    ? {
        bg: 'from-rose-500/25 via-rose-500/10 to-transparent',
        border: 'border-rose-400/60',
        glow: 'shadow-[0_0_20px_rgba(251,113,133,0.25)]',
        dot: 'bg-rose-400 text-white',
        text: 'text-rose-300',
      }
    : color;

  return (
    <motion.div
      className={`relative z-10 w-full rounded-2xl border ${customColor.border} bg-gradient-to-br ${customColor.bg} backdrop-blur-md ${customColor.glow}`}
      initial={{ opacity: 0, y: 20, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay, ease: [0.21, 1.04, 0.58, 1] }}
    >
      {/* Badge numérico ou ícone SIM/NÃO */}
      <div className="absolute -top-2.5 -left-2">
        <motion.span
          className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full ${customColor.dot} font-black text-[10px] sm:text-xs shadow-lg ring-2 ring-black/30`}
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.35, delay: delay + 0.1, type: 'spring', stiffness: 500 }}
        >
          {isSim ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : isNao ? <X className="w-3.5 h-3.5" strokeWidth={3} /> : index + 1}
        </motion.span>
      </div>

      <div className="p-3.5 sm:p-4">
        <p className="text-[13px] sm:text-[14px] md:text-[15px] font-bold text-neutral-100 leading-snug pl-3.5 sm:pl-4">
          {node.text}
        </p>
        {node.desc && (
          <div className={`text-[11px] sm:text-[12px] ${customColor.text} mt-2 pl-3.5 sm:pl-4 font-medium opacity-90 space-y-1`}>
            {node.desc.includes('•') ? (
              node.desc.split(/(?=[•\-])/).map((part, pi) => (
                <p key={pi} className="leading-snug">
                  {part.trim()}
                </p>
              ))
            ) : (
              <p className="leading-snug">{node.desc}</p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function AnimatedConnector({ delay, branching }: { delay: number; branching?: boolean }) {
  return (
    <motion.div
      className="flex flex-col items-center py-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay }}
    >
      {/* Linha pulsante */}
      <motion.div
        className="w-[2px] h-5 rounded-full overflow-hidden relative"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.25, delay }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-white/5" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-primary/60 to-transparent"
          initial={{ y: '-100%' }}
          animate={{ y: '100%' }}
          transition={{ duration: 0.8, delay: delay + 0.1, repeat: 0 }}
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, delay: delay + 0.15, type: 'spring' }}
      >
        {branching ? (
          <GitFork className="w-4 h-4 text-primary/70 rotate-180" strokeWidth={2.5} />
        ) : (
          <ArrowDown className="w-3.5 h-3.5 text-primary/60" strokeWidth={2.5} />
        )}
      </motion.div>
    </motion.div>
  );
}

/** Layout de árvore com ramificações */
function TreeLayout({ levels }: { levels: FlowLevel[] }) {
  let nodeCounter = 0;

  return (
    <div className="my-5 sm:my-7 flex flex-col items-center gap-0 w-full">
      {levels.map((level, lIdx) => {
        const isBranch = level.length > 1;
        const prevIsBranch = lIdx > 0 && levels[lIdx - 1].length > 1;
        const delay = lIdx * 0.18;

        return (
          <div key={lIdx} className="flex flex-col items-center w-full">
            {lIdx > 0 && (
              prevIsBranch && isBranch && level.length === 2 ? (
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full py-0.5" style={{ maxWidth: Math.min(level.length * 280, 600) }}>
                  <div className="flex justify-center">
                    <AnimatedConnector delay={delay - 0.08} />
                  </div>
                  <div className="flex justify-center">
                    <AnimatedConnector delay={delay - 0.08} />
                  </div>
                </div>
              ) : (
                <AnimatedConnector delay={delay - 0.08} branching={isBranch && !prevIsBranch} />
              )
            )}

            {isBranch ? (
              <div className="w-full">
                <motion.div
                  className="relative mx-auto flex items-start justify-center"
                  style={{ maxWidth: Math.min(level.length * 280, 600) }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.35, delay }}
                >
                  {/* Barra horizontal animada no topo da bifurcação inicial */}
                  {!prevIsBranch && (
                    <motion.div
                      className="absolute top-0 h-[2px] bg-gradient-to-r from-emerald-400/40 via-primary/40 to-rose-400/40 rounded-full"
                      style={{ left: `${100 / (level.length * 2)}%`, right: `${100 / (level.length * 2)}%` }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.4, delay: delay + 0.05 }}
                    />
                  )}

                  <div className={`grid gap-2.5 sm:gap-3 w-full ${!prevIsBranch ? 'pt-3' : 'pt-0'} ${level.length === 2 ? 'grid-cols-2' : level.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    {level.map((node, nIdx) => {
                      const color = COLORS[(nodeCounter) % COLORS.length];
                      const card = (
                        <div key={nIdx} className="flex flex-col items-center w-full">
                          {!prevIsBranch && (
                            <motion.div
                              className="w-[2px] h-3 bg-white/15 rounded-full mb-1"
                              initial={{ scaleY: 0 }}
                              animate={{ scaleY: 1 }}
                              transition={{ duration: 0.2, delay: delay + 0.12 + nIdx * 0.08 }}
                            />
                          )}
                          <NodeCard node={node} color={color} index={nodeCounter} delay={delay + 0.08 + nIdx * 0.12} />
                        </div>
                      );
                      nodeCounter++;
                      return card;
                    })}
                  </div>
                </motion.div>
              </div>
            ) : (
              <div className="w-full max-w-[420px] mx-auto">
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
function LinearLayout({ nodes }: { nodes: FlowNode[] }) {
  return (
    <div className="my-5 sm:my-7 flex flex-col items-center gap-0 relative">
      {nodes.map((node, i) => {
        const color = COLORS[i % COLORS.length];
        const isLast = i === nodes.length - 1;

        return (
          <div key={i} className="flex flex-col items-center w-full">
            <div className="w-full max-w-[420px] mx-auto">
              <NodeCard node={node} color={color} index={i} delay={i * 0.18} />
            </div>
            {!isLast && <AnimatedConnector delay={i * 0.18 + 0.25} />}
          </div>
        );
      })}
    </div>
  );
}

export function FluxogramaAnimado({ raw }: { raw: string }) {
  const isAsciiBox = useMemo(() => raw.includes('┌') && raw.includes('┘'), [raw]);
  const isBranching = useMemo(() => hasBranching(raw) || isAsciiBox, [raw, isAsciiBox]);

  const treeLevels = useMemo(() => {
    if (isAsciiBox) {
      const asciiLevels = parseAsciiBoxTree(raw);
      if (asciiLevels.length >= 2) return asciiLevels;
    }
    if (!isBranching) return null;
    return parseFlowTree(raw);
  }, [raw, isBranching, isAsciiBox]);

  const linearNodes = useMemo(() => {
    if (isBranching) return null;
    return parseLinearWithDescriptions(raw);
  }, [raw, isBranching]);

  if (treeLevels && treeLevels.length >= 2) {
    return <TreeLayout levels={treeLevels} />;
  }

  if (linearNodes && linearNodes.length >= 2) {
    return <LinearLayout nodes={linearNodes} />;
  }

  return null;
}

