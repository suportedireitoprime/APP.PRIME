import { useState, useMemo, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { Puzzle, CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { normalizarMarkdown } from '@/lib/markdown';
import { haptic } from '@/lib/nativeHaptics';

interface LacunasInterativasBlockProps {
  rawContent: string;
  onComplete?: () => void;
}

export function LacunasInterativasBlock({ rawContent, onComplete }: LacunasInterativasBlockProps) {
  const [respostas, setRespostas] = useState<Record<number, string>>({});
  const [lacunaAtiva, setLacunaAtiva] = useState<number | null>(null);
  
  // Parse do conteúdo
  const parsedData = useMemo(() => {
    const data = {
      enunciado: '',
      opcoes: {} as Record<number, string[]>,
      gabarito: ''
    };

    const enunciadoMatch = rawContent.match(/(?:#*\s*Enunciado da Atividade:?)([\s\S]*?)(?:#*\s*Opções do Menu Suspenso:?)/i);
    if (enunciadoMatch) {
      data.enunciado = enunciadoMatch[1].trim();
    }

    const opcoesMatch = rawContent.match(/(?:#*\s*Opções do Menu Suspenso:?)([\s\S]*?)(?:#*\s*Gabarito Comentado:?)/i);
    if (opcoesMatch) {
      const opcoesText = opcoesMatch[1].trim();
      const lines = opcoesText.split('\n');
      lines.forEach(line => {
        const match = line.match(/Para a Lacuna (\d+)/i);
        if (match) {
          const lacunaId = parseInt(match[1], 10);
          const ops: string[] = [];
          const optionRegex = /\[\s*([^\]]+?)\s*\]/g;
          let optMatch;
          while ((optMatch = optionRegex.exec(line)) !== null) {
            if (!optMatch[1].toLowerCase().includes('lacuna')) {
               ops.push(optMatch[1].trim());
            }
          }
          if (ops.length > 0) {
            data.opcoes[lacunaId] = ops;
          }
        }
      });
    }

    const gabaritoMatch = rawContent.match(/(?:#*\s*Gabarito Comentado:?)([\s\S]*)/i);
    if (gabaritoMatch) {
      data.gabarito = gabaritoMatch[1].trim();
    }

    return data;
  }, [rawContent]);

  const lacunasTotais = Object.keys(parsedData.opcoes).length;
  const todasRespondidas = useMemo(() => {
    return lacunasTotais > 0 && Object.keys(respostas).length === lacunasTotais;
  }, [respostas, lacunasTotais]);

  useEffect(() => {
    if (todasRespondidas && onComplete) {
      onComplete();
    }
  }, [todasRespondidas, onComplete]);

  // Handle seleçãor a primeira vez renderizando, foca na primeira lacuna
  useEffect(() => {
    if (lacunaAtiva === null && lacunasTotais > 0 && !todasRespondidas) {
      setLacunaAtiva(1);
    }
  }, [lacunaAtiva, lacunasTotais, todasRespondidas]);

  const handleLacunaClick = (id: number) => {
    if (todasRespondidas) return;
    haptic.selection();
    setLacunaAtiva(id);
  };

  const handleSelectOption = (opcao: string) => {
    if (lacunaAtiva === null) return;
    haptic.impact();
    
    setRespostas(prev => {
      const novasRespostas = { ...prev, [lacunaAtiva]: opcao };
      
      // Auto-avançar para a próxima lacuna não respondida
      if (Object.keys(novasRespostas).length < lacunasTotais) {
        let proxima = lacunaAtiva + 1;
        while (proxima <= lacunasTotais && novasRespostas[proxima]) {
          proxima++;
        }
        if (proxima <= lacunasTotais) {
          setLacunaAtiva(proxima);
        } else {
          // Busca a primeira vazia
          for (let i = 1; i <= lacunasTotais; i++) {
            if (!novasRespostas[i]) {
              setLacunaAtiva(i);
              break;
            }
          }
        }
      } else {
        setLacunaAtiva(null);
      }
      
      return novasRespostas;
    });
  };

  return (
    <article className="max-w-[70ch] lg:max-w-[76ch] mx-auto py-3 px-1 sm:px-2 pb-8">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-amber-400">
        <Puzzle className="h-3.5 w-3.5" />
        <span>Atividade de Fixação Interativa</span>
      </div>

      {/* Box do Enunciado */}
      <div className="p-5 sm:p-7 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md shadow-xl mb-6">
        <div className="prose prose-base sm:prose-lg max-w-none prose-invert prose-p:leading-[1.85] prose-p:text-neutral-200">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code: ({ children, className }) => {
                const isInline = !className;
                const txt = String(children);
                
                // Mapeamento interativo para lacunas
                const lacunaMatch = txt.match(/^\[\s*LACUNA\s*(\d+)\s*\]$/i);
                if (isInline && lacunaMatch) {
                  const id = parseInt(lacunaMatch[1], 10);
                  const isRespondida = !!respostas[id];
                  const isAtiva = lacunaAtiva === id;
                  
                  return (
                    <button
                      type="button"
                      onClick={() => handleLacunaClick(id)}
                      disabled={todasRespondidas}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 mx-1 align-middle whitespace-nowrap transition-all rounded-lg text-sm sm:text-base font-bold font-display shadow-sm cursor-pointer ${
                        todasRespondidas
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-emerald-500/20'
                          : isAtiva
                          ? 'bg-primary/20 text-white border-2 border-primary shadow-[0_0_12px_hsl(var(--primary)/0.4)] scale-105'
                          : isRespondida
                          ? 'bg-white/10 text-white border border-white/30 hover:bg-white/15'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/40 border-dashed hover:bg-amber-500/20 animate-pulse'
                      }`}
                    >
                      {respostas[id] ? (
                        <>
                          {todasRespondidas && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                          {respostas[id]}
                        </>
                      ) : (
                        <>
                          <Circle className="w-3.5 h-3.5 opacity-70" />
                          Lacuna {id}
                        </>
                      )}
                    </button>
                  );
                }
                
                return isInline ? (
                  <code className="rounded-md bg-white/10 px-1.5 py-0.5 text-xs sm:text-sm font-mono text-neutral-300">
                    {children}
                  </code>
                ) : (
                  <code>{children}</code>
                );
              }
            }}
          >
            {normalizarMarkdown(parsedData.enunciado)}
          </ReactMarkdown>
        </div>
      </div>

      {/* Opções Flutuantes (Bottom Sheet/Menu Overlay) */}
      <AnimatePresence mode="wait">
        {!todasRespondidas && lacunaAtiva !== null && parsedData.opcoes[lacunaAtiva] && (
          <div className="fixed inset-0 z-[100] flex flex-col justify-end pointer-events-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setLacunaAtiva(null)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-10 w-full rounded-t-[2.5rem] border-t border-white/10 bg-[#161616] p-6 sm:p-8 pb-[calc(2rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] shadow-2xl"
            >
              <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-white/20" />
              <h4 className="text-sm sm:text-[15px] font-bold uppercase tracking-widest text-primary mb-5 flex items-center gap-2">
                <ChevronRight className="w-4 h-4" />
                Selecione o termo para a Lacuna {lacunaAtiva}:
              </h4>
              <div className="flex flex-col gap-3">
                {parsedData.opcoes[lacunaAtiva].map((opcao, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(opcao)}
                    className="w-full text-left px-5 py-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/50 text-neutral-200 font-semibold text-[15px] sm:text-base transition-all active:scale-[0.98] shadow-sm"
                  >
                    {opcao}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Gabarito Final Revelado */}
      <AnimatePresence>
        {todasRespondidas && (
          <motion.div
            key="gabarito-revelado"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 border-l-4 border-emerald-500 bg-emerald-500/[0.06] border-y border-r border-white/[0.04] text-neutral-200 py-5 px-5 sm:px-6 rounded-r-2xl shadow-sm backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-black tracking-tight text-emerald-300">
                Gabarito Comentado
              </h3>
            </div>
            <div className="prose prose-sm sm:prose-base max-w-none prose-invert prose-p:leading-relaxed prose-strong:text-white">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {normalizarMarkdown(parsedData.gabarito)}
              </ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
