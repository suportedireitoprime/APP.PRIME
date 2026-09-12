import { useState, useMemo, useEffect } from 'react';
import { PremiumMarkdown } from '@/components/ui/PremiumMarkdown';
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

    // Extrai o Enunciado (Tudo após 'Enunciado' até a próxima seção de opções, menu, gabarito ou fim do texto)
    const regexEnunciado = /(?:#*\s*Enunciado.*?:\s*)([\s\S]*?)(?=#*\s*(?:Op[çc][õo]es|Gabarito|Respostas|Menu)|$)/i;
    const enunciadoMatch = rawContent.match(regexEnunciado);
    if (enunciadoMatch) {
      // Envolvemos [ LACUNA 1 ] em crases para que o ReactMarkdown trate como código inline
      data.enunciado = enunciadoMatch[1].trim().replace(/\[\s*LACUNA\s*(\d+)\s*\]/gi, '`[ LACUNA $1 ]`');
    }

    // Extrai as Opções (Tudo após 'Opções' ou 'Menu' até o Gabarito ou fim do texto)
    const regexOpcoes = /(?:#*\s*(?:Op[çc][õo]es|Menu).*?:\s*)([\s\S]*?)(?=#*\s*(?:Gabarito|Respostas)|$)/i;
    const opcoesMatch = rawContent.match(regexOpcoes);
    if (opcoesMatch) {
      const opcoesText = opcoesMatch[1].trim();
      
      // Divide o bloco de opções por 'Lacuna X' (com ou sem 'Para a')
      const blocos = opcoesText.split(/(?:Para a )?Lacuna\s+(\d+)\s*[:-]?/i);
      
      for (let i = 1; i < blocos.length; i += 2) {
        const lacunaId = parseInt(blocos[i], 10);
        const optionsText = blocos[i + 1];
        if (!optionsText) continue;
        
        const ops: string[] = [];
        const optionRegex = /\[\s*([^\]]+?)\s*\]/g;
        let optMatch;
        while ((optMatch = optionRegex.exec(optionsText)) !== null) {
          if (!optMatch[1].toLowerCase().includes('lacuna')) {
             ops.push(optMatch[1].trim());
          }
        }
        if (ops.length > 0) {
          data.opcoes[lacunaId] = ops;
        }
      }
    }

    const regexGabarito = /(?:#*\s*(?:Gabarito|Respostas).*?:\s*)([\s\S]*)/i;
    const gabaritoMatch = rawContent.match(regexGabarito);
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

  // (Removido o auto-focus inicial na primeira lacuna)

  const handleLacunaClick = (id: number) => {
    if (todasRespondidas) return;
    haptic.selection();
    setLacunaAtiva(id);
  };

  const handleSelectOption = (opcao: string) => {
    if (lacunaAtiva === null) return;
    haptic.impact();
    
    const respondida = lacunaAtiva;
    const novasRespostas = { ...respostas, [respondida]: opcao };
    setRespostas(novasRespostas);
    
    // Adiciona um pequeno atraso para que o usuário veja o feedback de seleção
    setTimeout(() => {
      setLacunaAtiva((atual) => {
        // Só avança se a modal não tiver sido fechada ou mudada pelo usuário
        if (atual === respondida) {
          if (Object.keys(novasRespostas).length < lacunasTotais) {
            let proxima = respondida + 1;
            while (proxima <= lacunasTotais && novasRespostas[proxima]) {
              proxima++;
            }
            if (proxima <= lacunasTotais) {
              return proxima;
            } else {
              // Busca a primeira vazia
              for (let i = 1; i <= lacunasTotais; i++) {
                if (!novasRespostas[i]) {
                  return i;
                }
              }
            }
          }
        }
        return atual;
      });
    }, 150); // Reduzido para ser mais rápido (UX Snappy)
  };

  return (
    <article className="max-w-[70ch] lg:max-w-[76ch] mx-auto py-3 px-1 sm:px-2 pb-8 min-h-[55vh] flex flex-col justify-center">
      <div className="mb-6 inline-flex self-start items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-amber-400">
        <Puzzle className="h-3.5 w-3.5" />
        <span>Atividade de Fixação Interativa</span>
      </div>

      {/* Box do Enunciado */}
      <div className="p-5 sm:p-7 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md shadow-xl mb-6 relative">
        <p className="text-[11px] sm:text-xs text-neutral-400 uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Selecione as lacunas para responder
        </p>
        <div className="prose prose-base sm:prose-lg max-w-none prose-invert prose-p:leading-[1.85] prose-p:text-neutral-200">
        <PremiumMarkdown
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
                      className={`relative overflow-hidden inline-flex items-center gap-1.5 px-3 py-1 mx-1 align-middle whitespace-nowrap transition-all rounded-lg text-sm sm:text-base font-bold font-display shadow-sm cursor-pointer ${
                        isRespondida || todasRespondidas
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-emerald-500/20'
                          : isAtiva
                          ? 'bg-primary/20 text-white border-2 border-primary shadow-[0_0_12px_hsl(var(--primary)/0.4)] scale-105'
                          : 'bg-white/5 text-white/70 border border-white/20 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {!isRespondida && !isAtiva && !todasRespondidas && (
                        <motion.div
                          initial={{ x: '-100%' }}
                          animate={{ x: '200%' }}
                          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", repeatDelay: 1 }}
                          className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                        />
                      )}
                      
                      <span className="relative z-10 flex items-center gap-1.5">
                        {respostas[id] ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            {respostas[id]}
                          </>
                        ) : (
                          <>
                            <Circle className="w-3.5 h-3.5 opacity-70" />
                            Lacuna {id}
                          </>
                        )}
                      </span>
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
          </PremiumMarkdown>
        </div>
      </div>

      {/* Opções Flutuantes (Bottom Sheet/Menu Overlay) */}
      <AnimatePresence>
        {!todasRespondidas && lacunaAtiva !== null && parsedData.opcoes[lacunaAtiva] && (
          <div className="fixed inset-0 z-[100] flex flex-col justify-end pointer-events-auto" key="lacunas-sheet">
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
              <h3 className="font-display text-[14px] sm:text-[15px] font-black uppercase tracking-[0.2em] text-emerald-400">
                Gabarito Comentado
              </h3>
            </div>
            <div className="prose prose-sm sm:prose-base max-w-none prose-invert prose-p:leading-relaxed prose-strong:text-white">
              <PremiumMarkdown remarkPlugins={[remarkGfm]}>
                {normalizarMarkdown(parsedData.gabarito)}
              </PremiumMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
