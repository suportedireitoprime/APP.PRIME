import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network } from 'lucide-react';

type No = { id: string; rotulo: string; definicao?: string };
type Aresta = { de: string; para: string; relacao: string };

export function MapaConceitualBlock({ payload }: { payload: any }) {
  const titulo: string | undefined = payload?.titulo;
  const nos: No[] = Array.isArray(payload?.nos) ? payload.nos : [];
  const arestas: Aresta[] = Array.isArray(payload?.arestas) ? payload.arestas : [];

  const [activeNo, setActiveNo] = useState<string | null>(null);

  const posicoes = useMemo(() => {
    const n = nos.length || 1;
    // Base layout na estrutura do viewBox: 0 0 500 500
    const cx = 250;
    const cy = 250;
    // Ajusta o raio dinamicamente: grafos maiores precisam de mais espaço, mas limitamos no 500x500
    const radius = n <= 3 ? 150 : n <= 5 ? 180 : 200;
    const map: Record<string, { x: number; y: number }> = {};
    
    if (n === 1) {
      map[nos[0].id] = { x: cx, y: cy };
      return map;
    }

    // Para grafos pequenos (ex: 3), fica melhor um triângulo ponta pra cima
    // Para maiores, distribuição normal
    const offsetAngle = n === 3 ? -Math.PI / 2 : -Math.PI / 2;

    nos.forEach((no, i) => {
      const angle = (2 * Math.PI * i) / n + offsetAngle;
      map[no.id] = { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
    });
    return map;
  }, [nos]);

  if (!nos.length) return null;

  // Animações
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 }
    }
  };

  const edgeVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { 
      pathLength: 1, 
      opacity: 1, 
      transition: { duration: 1.2, ease: "easeOut" } 
    }
  };

  const nodeVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1, 
      transition: { type: "spring", stiffness: 200, damping: 15 } 
    }
  };

  const labelVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <article className="max-w-[68ch] lg:max-w-none">
      {titulo && (
        <h3 className="mb-4 font-display text-[20px] sm:text-[24px] font-bold text-foreground">
          {titulo}
        </h3>
      )}
      
      <div className="rounded-3xl border border-border/50 bg-card/40 p-1 sm:p-4 backdrop-blur-sm shadow-sm relative overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="relative z-10 w-full"
        >
          <svg viewBox="0 0 500 500" className="w-full h-auto max-h-[65vh] drop-shadow-md">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Arestas desenhadas primeiro */}
            {arestas.map((a, i) => {
              const p1 = posicoes[a.de];
              const p2 = posicoes[a.para];
              if (!p1 || !p2) return null;
              
              const mx = (p1.x + p2.x) / 2;
              const my = (p1.y + p2.y) / 2;
              
              // Ajusta o tamanho da badge dependendo do tamanho da label (aproximado)
              const labelWidth = Math.max(60, a.relacao.length * 7);

              return (
                <g key={`aresta-${i}`}>
                  <motion.line 
                    variants={edgeVariants}
                    x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                    stroke="hsl(var(--primary))" 
                    strokeOpacity="0.4" 
                    strokeWidth="2" 
                    strokeLinecap="round"
                  />
                  <motion.g variants={labelVariants}>
                    <rect 
                      x={mx - labelWidth/2} y={my - 12} 
                      width={labelWidth} height="24" rx="12"
                      fill="hsl(var(--background))" 
                      stroke="hsl(var(--primary))" 
                      strokeOpacity="0.6" 
                      strokeWidth="1.5"
                    />
                    <text x={mx} y={my + 4} textAnchor="middle" fontSize="11"
                      fill="hsl(var(--primary))" fontWeight="700">
                      {a.relacao}
                    </text>
                  </motion.g>
                </g>
              );
            })}

            {/* Nós desenhados por cima */}
            {nos.map((no) => {
              const p = posicoes[no.id];
              if (!p) return null;
              
              const isActive = activeNo === no.id;
              // Separa a label em duas linhas se for grande (rudimentar, mas elegante)
              const words = no.rotulo.split(' ');
              let l1 = no.rotulo;
              let l2 = '';
              if (no.rotulo.length > 12 && words.length > 1) {
                const mid = Math.ceil(words.length / 2);
                l1 = words.slice(0, mid).join(' ');
                l2 = words.slice(mid).join(' ');
              }

              return (
                <motion.g 
                  key={`no-${no.id}`} 
                  variants={nodeVariants}
                  onClick={() => setActiveNo(isActive ? null : no.id)}
                  style={{ cursor: no.definicao ? 'pointer' : 'default' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <circle 
                    cx={p.x} cy={p.y} r="46" 
                    fill="hsl(var(--primary))" fillOpacity={isActive ? "0.2" : "0.08"}
                    stroke="hsl(var(--primary))" strokeWidth={isActive ? "3" : "2"}
                    filter={isActive ? "url(#glow)" : undefined}
                    className="transition-all duration-300"
                  />
                  
                  {l2 ? (
                    <>
                      <text x={p.x} y={p.y - 4} textAnchor="middle" fontSize="12" fill="hsl(var(--foreground))" fontWeight="800">
                        {l1}
                      </text>
                      <text x={p.x} y={p.y + 12} textAnchor="middle" fontSize="12" fill="hsl(var(--foreground))" fontWeight="800">
                        {l2}
                      </text>
                    </>
                  ) : (
                    <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="12" fill="hsl(var(--foreground))" fontWeight="800">
                      {no.rotulo.length > 20 ? no.rotulo.slice(0, 18) + '…' : no.rotulo}
                    </text>
                  )}
                  
                  {/* Indicador tátil se houver definição */}
                  {no.definicao && !isActive && (
                    <circle cx={p.x + 32} cy={p.y - 32} r="6" fill="hsl(var(--primary))" className="animate-pulse" />
                  )}
                </motion.g>
              );
            })}
          </svg>
        </motion.div>
        
        {/* Definições interativas */}
        <AnimatePresence mode="wait">
          {activeNo && nos.find(n => n.id === activeNo)?.definicao && (
            <motion.div 
              key={activeNo}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4 p-4 rounded-2xl bg-primary/10 border border-primary/20 flex gap-3"
            >
              <Network className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-foreground text-sm uppercase tracking-wide mb-1">
                  {nos.find(n => n.id === activeNo)?.rotulo}
                </p>
                <p className="text-[15px] leading-relaxed text-foreground/90 font-medium">
                  {nos.find(n => n.id === activeNo)?.definicao}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Fallback definitions (if not interacting) */}
        {!activeNo && nos.some(n => n.definicao) && (
          <ul className="mt-4 space-y-2 px-2 pb-2">
            {nos.filter((n) => n.definicao).map((n) => (
              <li key={`def-${n.id}`} className="text-[14px] sm:text-[15px] leading-relaxed flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0 mt-2" />
                <span>
                  <strong className="text-foreground">{n.rotulo}: </strong>
                  <span className="text-muted-foreground">{n.definicao}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
