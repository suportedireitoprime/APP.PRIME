import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Workflow,
  Sparkles,
  Scale,
  Brain,
  Gavel,
  Copy,
  Check,
  Layers,
  ArrowDown,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { toast } from 'sonner';
import { haptic } from '@/lib/nativeHaptics';

export interface ExemploLayer {
  step: number;
  layerTitle: string;
  badge: string;
  icon: any;
  accentColor: string;
  badgeBg: string;
  borderColor: string;
  text: string;
  detail?: string;
}

interface AssistenteExemploGrafoModalProps {
  open: boolean;
  onClose: () => void;
  content: string;
  pergunta?: string;
}

/**
 * Analisa o markdown da resposta e extrai estritamente o exemplo prático em 4 camadas de subsunção jurídica.
 * Evita vazamento de tabelas, fluxogramas ou markdown não renderizado.
 */
function parseExemploEmCamadas(markdown: string): ExemploLayer[] {
  if (!markdown) return [];

  // 1. Extrai EXCLUSIVAMENTE a seção do Exemplo Prático, parando no próximo cabeçalho ou tabela
  const exemploRegex = /(?:###?\s*(?:EXEMPLO\s*PRÁTICO|CASO\s*CONCRETO|NA\s*PRÁTICA)[^\n]*)([\s\S]*?)(?=(?:\n\s*#{1,4}\s+[A-ZÀ-Ú])|(?:\n\s*\|)|$)/i;
  const match = markdown.match(exemploRegex);
  const exemploBlock = match ? match[1].trim() : '';

  // 2. Filtra linhas válidas limpando qualquer tabela, fluxograma ou lixo de sintaxe
  const candidateText = exemploBlock || markdown;
  const rawLines = candidateText
    .split('\n')
    .map((l) => l.trim())
    .filter(
      (l) =>
        l.length > 0 &&
        !l.startsWith('|') &&
        !l.startsWith('---') &&
        !l.startsWith('###') &&
        !l.startsWith('##') &&
        !l.includes('->') &&
        !l.includes('-->')
    );

  let fato = '';
  let conduta = '';
  let enquadramento = '';
  let desfecho = '';

  for (const line of rawLines) {
    const lower = line.toLowerCase();
    if (
      !fato &&
      (lower.includes('fato') || lower.includes('caso concreto') || lower.includes('camada 1') || lower.includes('1.'))
    ) {
      fato = line.replace(/^[#*>\-\d\.\s\[\]]+(fato|caso concreto|camada 1|passo 1)?[:\]\s]*/i, '').trim();
    } else if (
      !conduta &&
      (lower.includes('conduta') ||
        lower.includes('elemento subjetivo') ||
        lower.includes('dolo') ||
        lower.includes('culpa') ||
        lower.includes('camada 2') ||
        lower.includes('2.'))
    ) {
      conduta = line.replace(/^[#*>\-\d\.\s\[\]]+(conduta|elemento subjetivo|dolo ou culpa|camada 2|passo 2)?[:\]\s]*/i, '').trim();
    } else if (
      !enquadramento &&
      (lower.includes('enquadramento') ||
        lower.includes('norma') ||
        lower.includes('lei') ||
        lower.includes('artigo') ||
        lower.includes('camada 3') ||
        lower.includes('3.'))
    ) {
      enquadramento = line.replace(/^[#*>\-\d\.\s\[\]]+(enquadramento|norma aplicável|subsunção|lei|camada 3|passo 3)?[:\]\s]*/i, '').trim();
    } else if (
      !desfecho &&
      (lower.includes('desfecho') ||
        lower.includes('decisão') ||
        lower.includes('consequência') ||
        lower.includes('solução') ||
        lower.includes('camada 4') ||
        lower.includes('4.'))
    ) {
      desfecho = line.replace(/^[#*>\-\d\.\s\[\]]+(desfecho|decisão|consequência|solução jurídica|camada 4|passo 4)?[:\]\s]*/i, '').trim();
    }
  }

  // 3. Fallback seguro: se não encontrou as chaves, usa até 4 linhas limpas individuais (nunca concatena tudo)
  if (!fato && rawLines.length > 0) fato = rawLines[0];
  if (!conduta && rawLines.length > 1) conduta = rawLines[1];
  if (!enquadramento && rawLines.length > 2) enquadramento = rawLines[2];
  if (!desfecho && rawLines.length > 3) desfecho = rawLines[3];

  // 4. Fallback padrão didático para o caso de texto insuficiente
  if (!fato) {
    fato = 'O agente pratica conduta fática com repercussão jurídica relevante no mundo real.';
  }
  if (!conduta) {
    conduta = 'Avaliação da intenção voluntária (Dolo Direto ou Eventual) versus negligência/imprudência (Culpa).';
  }
  if (!enquadramento) {
    enquadramento = 'Subsunção estrita do fato à norma penal ou civil, verificando a incidência de causas excludentes.';
  }
  if (!desfecho) {
    desfecho = 'Aplicação da consequência jurídica pelo magistrado, fixação da sanção ou decisão definitiva.';
  }

  // Remove qualquer resíduo markdown grosseiro das strings
  const sanitize = (s: string) => s.replace(/\|/g, '').replace(/###+/g, '').trim();

  return [
    {
      step: 1,
      layerTitle: 'CAMADA 1 • O FATO CONCRETO (MUNDO REAL)',
      badge: '1º PASSO • FATO TÍPICO',
      icon: Sparkles,
      accentColor: 'text-amber-400',
      badgeBg: 'bg-amber-400/15 border-amber-400/30 text-amber-300',
      borderColor: 'border-amber-400/40 hover:border-amber-400/70',
      text: sanitize(fato),
      detail: 'Acontecimentos fáticos ocorridos no plano real que desencadeiam a incidência do Direito.',
    },
    {
      step: 2,
      layerTitle: 'CAMADA 2 • ELEMENTO SUBJETIVO & CONDUTA',
      badge: '2º PASSO • CONDUTA & VONTADE',
      icon: Brain,
      accentColor: 'text-sky-400',
      badgeBg: 'bg-sky-400/15 border-sky-400/30 text-sky-300',
      borderColor: 'border-sky-400/40 hover:border-sky-400/70',
      text: sanitize(conduta),
      detail: 'Exame da voluntariedade, intenção do sujeito ativo (dolo) ou previsibilidade violada (culpa).',
    },
    {
      step: 3,
      layerTitle: 'CAMADA 3 • ENQUADRAMENTO LEGAL & SUBSUNÇÃO',
      badge: '3º PASSO • NORMA & TIPICIDADE',
      icon: Scale,
      accentColor: 'text-rose-400',
      badgeBg: 'bg-rose-400/15 border-rose-400/30 text-rose-300',
      borderColor: 'border-rose-400/40 hover:border-rose-400/70',
      text: sanitize(enquadramento),
      detail: 'Adequação perfeita do fato à descrição da lei (juízo de tipicidade e legalidade estrita).',
    },
    {
      step: 4,
      layerTitle: 'CAMADA 4 • DESFECHO JURÍDICO & DECISÃO',
      badge: '4º PASSO • CONSEQUÊNCIA JURÍDICA',
      icon: Gavel,
      accentColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-400/15 border-emerald-400/30 text-emerald-300',
      borderColor: 'border-emerald-400/40 hover:border-emerald-400/70',
      text: sanitize(desfecho),
      detail: 'Resolução da controvérsia, fixação da pena ou indenização com amparo na jurisprudência.',
    },
  ];
}

export const AssistenteExemploGrafoModal: React.FC<AssistenteExemploGrafoModalProps> = ({
  open,
  onClose,
  content,
  pergunta,
}) => {
  const [copied, setCopied] = useState(false);
  const layers = useMemo(() => parseExemploEmCamadas(content), [content]);

  if (!open) return null;

  const handleCopy = () => {
    const textToCopy = `📌 GRAFO DO EXEMPLO PRÁTICO EM CAMADAS\n${
      pergunta ? `Questão: ${pergunta}\n\n` : ''
    }${layers
      .map(
        (l) =>
          `🔹 ${l.layerTitle}\n(${l.badge})\n${l.text}\nFundamento: ${l.detail || ''}`
      )
      .join('\n\n')}`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      haptic.success();
      toast.success('Grafo copiado com sucesso!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6">
        {/* Backdrop escuro com blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            haptic.light();
            onClose();
          }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Card do Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-[#0D0F12] border border-white/15 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-rose-500/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center shrink-0 shadow-lg">
                <Workflow className="w-5 h-5 text-sky-400" strokeWidth={2.4} />
              </div>
              <div>
                <span className="block text-[10px] font-mono font-bold tracking-widest uppercase text-sky-300">
                  Estruturação em Grafo
                </span>
                <h3
                  className="text-base sm:text-lg font-black tracking-wide uppercase text-white font-sans leading-none flex items-center mt-1"
                  style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}
                >
                  Exemplo Prático em Camadas
                </h3>
              </div>
            </div>

            <button
              onClick={() => {
                haptic.light();
                onClose();
              }}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-all"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>

          {/* Subheader / Info bar */}
          <div className="px-5 py-2.5 bg-white/[0.02] border-b border-white/5 flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-1.5 font-sans">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Subsunção estruturada em 4 etapas lógicas sequenciais</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider hidden sm:inline">
              Visão Dinâmica
            </span>
          </div>

          {/* Conteúdo com rolagem do Grafo */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5 scrollbar-thin scrollbar-thumb-white/10">
            {layers.map((layer, index) => {
              const Icon = layer.icon;
              const isLast = index === layers.length - 1;

              return (
                <div key={layer.step} className="relative">
                  {/* Card da Camada */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className={`relative rounded-2xl bg-gradient-to-b from-zinc-900/90 to-zinc-950/95 border ${layer.borderColor} p-4 sm:p-5 shadow-xl transition-all`}
                  >
                    {/* Linha superior do card */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${layer.badgeBg}`}
                        >
                          <Icon className={`w-4 h-4 ${layer.accentColor}`} strokeWidth={2.4} />
                        </div>
                        <h4
                          className="text-[13px] sm:text-[14px] font-black uppercase tracking-wider text-zinc-100 font-sans leading-none flex items-center translate-y-[-0.5px]"
                          style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}
                        >
                          {layer.layerTitle}
                        </h4>
                      </div>

                      <span
                        className={`text-[9.5px] sm:text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-md border ${layer.badgeBg}`}
                      >
                        {layer.badge}
                      </span>
                    </div>

                    {/* Texto explicativo renderizado com ReactMarkdown para formatação perfeita */}
                    <div className="text-[14px] sm:text-[15px] text-zinc-200 leading-relaxed font-sans font-normal pl-9 prose prose-sm prose-invert max-w-none [&_p]:my-1">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                        {layer.text}
                      </ReactMarkdown>
                    </div>

                    {/* Nota técnica de rodapé do card */}
                    {layer.detail && (
                      <div className="mt-3 pt-2.5 border-t border-white/5 pl-9 flex items-center gap-2 text-[11.5px] text-zinc-400 italic font-sans">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" />
                        <span>{layer.detail}</span>
                      </div>
                    )}
                  </motion.div>

                  {/* Conector de Grafo entre as camadas */}
                  {!isLast && (
                    <div className="flex flex-col items-center justify-center my-1.5">
                      <div className="w-[2px] h-4 bg-gradient-to-b from-white/25 via-sky-400/50 to-white/10" />
                      <div className="w-5 h-5 rounded-full bg-zinc-900 border border-white/20 flex items-center justify-center text-zinc-400 shadow-md">
                        <ArrowDown className="w-3 h-3 text-sky-400 animate-bounce" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer com Ações */}
          <div className="px-5 py-3.5 border-t border-white/10 bg-zinc-950 flex items-center justify-between gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 border border-white/10 text-xs sm:text-sm font-bold text-zinc-200 hover:text-white transition-all shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-amber-400" />
                  <span>Copiar Grafo Completo</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                haptic.light();
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:scale-95 text-xs sm:text-sm font-bold text-white transition-all shadow-lg"
            >
              Concluído
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
