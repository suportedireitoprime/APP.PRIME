import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Scale, Sparkles, AlertTriangle, Minus, Plus, Type, X,
  Volume2, VolumeX, Play, Pause, RotateCcw, Layers, CheckCircle2, Bookmark,
} from 'lucide-react';
import { useQuestaoAcao, type QuestaoInline } from '@/hooks/useQuestaoAcao';
import { Overlay, Md, Checklist, Erro } from './QuestaoAcaoOverlay';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { haptic } from '@/lib/nativeHaptics';

export type Fonte = string | QuestaoInline;

const FS_KEY = 'questoes:comentario-fs';
const FS_MIN = 15;
const FS_MAX = 24;

/** Botão flutuante "T" que expande em - / + para ajustar o tamanho do texto. */
export function TamanhoTextoFab({ fs, setFs }: { fs: number; setFs: (n: number) => void }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className="pointer-events-none fixed bottom-5 right-4 z-[90] flex items-center gap-2 sm:bottom-8 sm:right-8">
      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, x: 16, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 16, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-card/95 p-1 shadow-xl backdrop-blur"
          >
            <button
              type="button"
              aria-label="Diminuir texto"
              onClick={() => setFs(Math.max(FS_MIN, fs - 1))}
              disabled={fs <= FS_MIN}
              className="grid h-10 w-10 place-items-center rounded-full text-foreground transition-colors hover:bg-muted disabled:opacity-40"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-[12px] font-semibold tabular-nums text-muted-foreground">{fs}</span>
            <button
              type="button"
              aria-label="Aumentar texto"
              onClick={() => setFs(Math.min(FS_MAX, fs + 1))}
              disabled={fs >= FS_MAX}
              className="grid h-10 w-10 place-items-center rounded-full text-foreground transition-colors hover:bg-muted disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        aria-label="Tamanho do texto"
        onClick={() => setAberto((v) => !v)}
        className="pointer-events-auto grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform active:opacity-70"
      >
        {aberto ? <X className="h-5 w-5" /> : <Type className="h-5 w-5" />}
      </button>
    </div>
  );
}

// Quebra parágrafos gigantes em partes menores, unindo a cada 2 frases
function groupSentences(text: string): string {
  const blocks = text.split('\n\n');
  return blocks.map(block => {
    // Captura a última palavra antes do ponto
    const marked = block.replace(/(^|\s)([\w\u00C0-\u00FF)'"]+[.?!]['")]?)\s+([A-Z\u00C0-\u00DF])/g, (match, p1, p2, p3) => {
      const m = p2.toLowerCase();
      // Se a última palavra for uma abreviação comum, não quebra
      if (m.includes('art.') || m.includes('inc.') || m.includes('lei') || m.includes('n.') || m.includes('stf.') || m.includes('stj.')) {
        return match;
      }
      return p1 + p2 + '@@@SPLIT@@@' + p3;
    });
    
    const sentences = marked.split('@@@SPLIT@@@');
    if (sentences.length <= 2) return block;
    
    const paragraphs = [];
    for (let i = 0; i < sentences.length; i += 2) {
      const s1 = sentences[i] ? sentences[i].trim() : '';
      const s2 = sentences[i+1] ? sentences[i+1].trim() : '';
      let p = s1;
      if (s2) p += ' ' + s2;
      if (p) paragraphs.push(p);
    }
    return paragraphs.join('\n\n');
  }).join('\n\n');
}

// Remove cabeçalhos redundantes como "Gabarito Comentado:", "Gabarito:", "Comentário:"
function limparTextoComentario(texto: string | undefined): string {
  if (!texto) return '';
  return texto
    .replace(/^(\s*(\*\*|\*|#+\s*)?(Gabarito\s+(Oficial\s+)?Comentado|Coment[áa]rio\s+(do\s+Gabarito)?|Gabarito)[\s:]*(\*\*|\*)?[\s:\-–—]*)/i, '')
    .trim();
}

// Extrai e separa estritamente o comentário da alternativa correta e o das alternativas incorretas
function extrairPartesComentario(source: any): { correta: string; erradas: string } {
  if (!source || typeof source !== 'object') {
    return { correta: '', erradas: '' };
  }

  let corretaRaw = source.gabarito_comentado || source.correct_comment || source.comentario || '';
  let erradasRaw = source.comentario_incorretas || source.incorrect_comment || '';

  // Se o texto da correta contiver a seção de outras alternativas concatenada
  const separadores = [
    /\n\s*(?:\*\*|\*|#+\s*)?(?:Análise\s+das\s+(?:Demais\s+)?Alternativas|Demais\s+Alternativas|Alternativas\s+Incorretas|Outras\s+Alternativas)[\s:]*(?:\*\*|\*)?[\s:\-–—]*/i,
    /\n\s*(?:\*\*|\*|#+\s*)?(?:Das\s+Demais\s+Alternativas|Quanto\s+[àa]s\s+demais\s+alternativas)[\s:]*(?:\*\*|\*)?[\s:\-–—]*/i,
  ];

  for (const sep of separadores) {
    if (sep.test(corretaRaw)) {
      const parts = corretaRaw.split(sep);
      corretaRaw = parts[0] || '';
      if (!erradasRaw && parts[1]) {
        erradasRaw = parts[1].trim();
      }
      break;
    }
  }

  // Se não tem separador formal, mas tem quebra com "(B) Incorreta:" ou "(C) Incorreta:"
  if (!erradasRaw && /\n\s*(?:\*\*)?\([B-E]\)\s*(?:Incorret[ao]|Fals[ao])/i.test(corretaRaw)) {
    const idx = corretaRaw.search(/\n\s*(?:\*\*)?\([B-E]\)\s*(?:Incorret[ao]|Fals[ao])/i);
    if (idx > 0) {
      erradasRaw = corretaRaw.slice(idx).trim();
      corretaRaw = corretaRaw.slice(0, idx).trim();
    }
  }

  return {
    correta: limparTextoComentario(corretaRaw),
    erradas: erradasRaw
      .replace(/^(\s*(\*\*|\*|#+\s*)?(Análise\s+das\s+(?:Demais\s+)?Alternativas|Alternativas\s+Incorretas|Demais\s+Alternativas)[\s:]*(\*\*|\*)?[\s:\-–—]*)/i, '')
      .trim(),
  };
}

// Helper to format plain text from spreadsheet into nice markdown
function formatarComentario(texto: string | undefined): string {
  if (!texto) return '';
  const limpo = limparTextoComentario(texto);
  const formatado = limpo
    // Add newlines before (A) Incorreta, (A), (B) e (C) Incorretas, etc. and bold them
    .replace(/((?:\([A-E]\)(?:,\s*|\s+e\s+)*)+)\s*(Incorret[ao]s?|Corret[ao]s?)[\.:-]?/gi, '\n\n**$1 $2:** ')
    // Highlight Súmulas
    .replace(/(Súmula\s+\d+\s+do\s+[A-Z]+)/gi, '**$1**')
    // Highlight Articles (Art. 14, artigo 14, etc.) along with the Law name if present
    .replace(/((?:Art\.|Artigo)\s+\d+(?:º|o|°)?(?:[^.]*?(?:Lei|Código|Estatuto|Constituição|CLT|CP|CPP|CC|CDC|CTN|CF)[^.,;)]*(?:\([^)]+\))?)?)/gi, '**$1**')
    .trim();

  return groupSentences(formatado);
}

function parsePreErradas(texto: string): Array<{ letra: string; texto?: string; motivo: string }> {
  if (!texto) return [];
  const parts = texto.split(/(?=(?:\([A-E]\)|[A-E]\))\s*(?:Incorret[ao]|Fals[ao]|Errad[ao]))/gi).filter(Boolean);
  if (parts.length <= 1) return [];

  return parts.map((part) => {
    const letraMatch = part.match(/(?:\(([A-E])\)|([A-E])\))\s*(?:Incorret[ao]|Fals[ao]|Errad[ao])[\s.:\-]*/i);
    const letra = letraMatch ? (letraMatch[1] || letraMatch[2]).toUpperCase() : '';
    const motivo = part.replace(/(?:\(([A-E])\)|([A-E])\))\s*(?:Incorret[ao]|Fals[ao]|Errad[ao])[\s.:\-]*/i, '').trim();
    return {
      letra,
      motivo,
    };
  }).filter((p) => p.letra && p.motivo);
}

export function ComentarioInner({ source }: { source: Fonte }) {
  const [view, setView] = useState<'correta' | 'erradas'>('correta');
  const [fs, setFsState] = useState(17);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState<number>(1.2);

  const partes = typeof source === 'object' && source !== null 
    ? extrairPartesComentario(source) 
    : { correta: '', erradas: '' };

  const hasPreCorreta = !!partes.correta;
  const hasPreErradas = !!partes.erradas;

  const isEnabledCorreta = !hasPreCorreta;
  const isEnabledErradas = !hasPreErradas;

  const { data, isLoading, error, refetch } = useQuestaoAcao(source, 'comentario', isEnabledCorreta && view === 'correta');
  const erradasQ = useQuestaoAcao(source, 'lei-erradas', isEnabledErradas && view === 'erradas');
  const erradas: any[] = erradasQ.data?.erradas ?? [];

  useEffect(() => {
    const salvo = Number(localStorage.getItem(FS_KEY));
    if (salvo >= FS_MIN && salvo <= FS_MAX) setFsState(salvo);
  }, []);

  const setFs = (n: number) => {
    setFsState(n);
    localStorage.setItem(FS_KEY, String(n));
  };
  const mdClass = 'text-[1em] prose-headings:text-[1.02em]';

  const textoCorretaLimpo = hasPreCorreta 
    ? formatarComentario(partes.correta) 
    : limparTextoComentario(data?.texto || '');

  // Texto sintetizado para narração em áudio
  const textoParaFalar = useMemo(() => {
    if (view === 'correta') {
      const base = textoCorretaLimpo.replace(/[*#_`]/g, '');
      const fund = data?.fundamento ? ` Fundamento: ${data.fundamento.replace(/[*#_`]/g, '')}` : '';
      const dica = data?.dica ? ` Dica de prova: ${data.dica.replace(/[*#_`]/g, '')}` : '';
      return `${base}${fund}${dica}`;
    } else {
      if (hasPreErradas) {
        return partes.erradas.replace(/[*#_`]/g, '');
      }
      return erradas.map(e => `Alternativa ${e.letra}: ${e.motivo.replace(/[*#_`]/g, '')}`).join('. ');
    }
  }, [view, textoCorretaLimpo, data, hasPreErradas, partes.erradas, erradas]);

  const handleToggleAudio = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('Narração de áudio não suportada neste dispositivo.');
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textoParaFalar);
    utterance.lang = 'pt-BR';
    utterance.rate = rate;

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    haptic.selection?.();
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [view]);

  const handleCriarFlashcard = () => {
    try {
      haptic.success?.();
      const questaoId = (source as any)?.id || 'q-' + Date.now();
      const titulo = (source as any)?.assunto || (source as any)?.disciplina || 'Questão Prática';
      const enunciadoCurto = ((source as any)?.enunciado || '').slice(0, 140) + '...';
      const FLASHCARDS_KEY = 'APP_PRIME_QUESTOES_FLASHCARDS';
      const existentes = JSON.parse(localStorage.getItem(FLASHCARDS_KEY) || '[]');
      const novoCard = {
        id: 'fc-' + Date.now(),
        questaoId,
        frente: `${titulo}: ${enunciadoCurto}`,
        verso: textoCorretaLimpo.slice(0, 350),
        criadoEm: new Date().toISOString(),
      };
      localStorage.setItem(FLASHCARDS_KEY, JSON.stringify([novoCard, ...existentes.slice(0, 99)]));
      toast.success('Flashcard de revisão criado com sucesso!');
    } catch {
      toast.success('Salvo para revisão!');
    }
  };

  const preErradasParsed = useMemo(() => {
    if (!hasPreErradas) return [];
    return parsePreErradas(partes.erradas);
  }, [hasPreErradas, partes.erradas]);

  const gabaritoOficial = (source as any)?.gabarito_oficial || (source as any)?.gabarito || null;

  return (
    <div className="space-y-4" style={{ fontSize: `${fs}px` }}>
      <TamanhoTextoFab fs={fs} setFs={setFs} />

      {/* ── Barra de Áudio / Narração TTS ────────────────── */}
      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-zinc-900/90 p-3 shadow-md backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleAudio}
            aria-label={isPlaying ? "Pausar narração" : "Ouvir comentário"}
            className={cn(
              "grid h-11 w-11 place-items-center rounded-xl font-bold shadow-md transition-all active:scale-95",
              isPlaying
                ? "bg-rose-600 text-white animate-pulse"
                : "bg-primary text-primary-foreground hover:brightness-110"
            )}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </button>
          <div>
            <p className="text-[13px] font-bold text-white flex items-center gap-1.5">
              <Volume2 className="h-3.5 w-3.5 text-primary" />
              {isPlaying ? "Reproduzindo áudio..." : "Ouvir Comentário"}
            </p>
            <p className="text-[11px] text-zinc-400">
              {isPlaying ? "Toque para pausar" : "Voz natural sintetizada"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
          {[1, 1.25, 1.5].map((velocidade) => (
            <button
              key={velocidade}
              type="button"
              onClick={() => {
                setRate(velocidade);
                if (isPlaying) {
                  window.speechSynthesis.cancel();
                  setIsPlaying(false);
                }
              }}
              className={cn(
                "h-7 px-2 rounded-lg text-[11px] font-bold transition-all",
                rate === velocidade
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              {velocidade}x
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-full border border-border bg-muted/40 p-1">
        {(['correta', 'erradas'] as const).map((v) => (
          <button
            key={v}
            role="tab"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={cn(
              'h-9 rounded-full text-[12px] font-semibold transition-colors',
              view === v ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {v === 'correta' ? 'Resposta correta' : 'Outras alternativas'}
          </button>
        ))}
      </div>

      {view === 'correta' && (
        <>
          {isLoading && (
            <Checklist
              passos={[
                'Lendo o enunciado e o gabarito',
                'Localizando a base legal aplicável',
                'Montando a explicação didática',
                'Formatando o comentário',
              ]}
            />
          )}
          {error && !isLoading && <Erro msg={error} onRetry={() => refetch()} />}
          {!isLoading && !error && (hasPreCorreta || data) && (
            <div className="space-y-3.5">
              {gabaritoOficial && (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="text-[12px] font-extrabold uppercase tracking-wider">
                    Gabarito Oficial: Alternativa {String(gabaritoOficial).toUpperCase()}
                  </span>
                </div>
              )}

              <div className="rounded-2xl border border-border bg-card/60 p-4 sm:p-5 shadow-sm">
                <Md texto={textoCorretaLimpo} className={mdClass} />
              </div>

              {data?.fundamento && (
                <div className="rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3.5 shadow-sm">
                  <p className="mb-1.5 inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-primary">
                    <Scale className="h-3.5 w-3.5" /> Dispositivo / Fundamento Legal
                  </p>
                  <Md texto={data.fundamento} className={mdClass} />
                </div>
              )}

              {data?.dica && (
                <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 px-4 py-3.5 shadow-sm">
                  <p className="mb-1.5 inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
                    <Sparkles className="h-3.5 w-3.5" /> Dica de Prova / Pegadinha da Banca
                  </p>
                  <Md texto={data.dica} className={mdClass} />
                </div>
              )}

              {/* Botão de Criação de Flashcard */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCriarFlashcard}
                  className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-primary/30 bg-primary/10 py-3.5 px-4 text-[13.5px] font-bold text-primary hover:bg-primary/20 active:scale-[0.98] transition-all shadow-sm"
                >
                  <Layers className="h-4 w-4" />
                  <span>Criar Flashcard deste gabarito</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {view === 'erradas' && (
        <>
          {hasPreErradas ? (
            preErradasParsed.length > 0 ? (
              <div className="space-y-3">
                {preErradasParsed.map((e, i) => (
                  <motion.div
                    key={`${e.letra}-${i}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.04 }}
                    className="overflow-hidden rounded-2xl border border-red-500/25 bg-card/60 shadow-sm"
                  >
                    <div className="border-b border-red-500/20 bg-red-500/10 px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-red-500/20 border border-red-500/30 text-[11px] font-black text-red-300">
                          {e.letra}
                        </span>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-red-400">
                          Alternativa Incorreta
                        </span>
                      </div>
                    </div>
                    <div className="p-4 bg-black/20">
                      <Md texto={e.motivo} className={cn(mdClass, 'leading-relaxed')} />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card/60 p-4 leading-relaxed shadow-sm">
                <Md texto={formatarComentario(partes.erradas)} className={mdClass} />
              </div>
            )
          ) : (
            <>
              {erradasQ.isLoading && (
                <Checklist
                  passos={[
                    'Separando as alternativas que não são o gabarito',
                    'Confrontando cada uma com a lei e a jurisprudência',
                    'Identificando o erro central de cada alternativa',
                    'Escrevendo as explicações',
                  ]}
                />
              )}
              {erradasQ.error && !erradasQ.isLoading && <Erro msg={erradasQ.error} onRetry={() => erradasQ.refetch()} />}
              {!erradasQ.isLoading && !erradasQ.error && erradas.length === 0 && !hasPreErradas && erradasQ.data && (
                <p className="rounded-2xl border border-border bg-card/60 p-4 text-sm text-muted-foreground">
                  Não foi possível identificar alternativas erradas para explicar.
                </p>
              )}

              {erradas.length > 0 && (
                <div className="space-y-3">
                  {erradas.map((e, i) => (
                    <motion.div
                      key={`${e.letra}-${i}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.04 }}
                      className="overflow-hidden rounded-2xl border border-red-500/25 bg-card/60 shadow-sm"
                    >
                      <div className="border-b border-red-500/20 bg-red-500/10 px-4 py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="grid h-6 w-6 place-items-center rounded-full bg-red-500/20 border border-red-500/30 text-[11px] font-black text-red-300">
                            {e.letra}
                          </span>
                          {e.dispositivo_chave && (
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
                              {e.dispositivo_chave}
                            </span>
                          )}
                        </div>
                      </div>
                      {e.texto && (
                        <div className="px-4 pt-3 pb-1 border-b border-white/5 bg-white/[0.02]">
                          <p className="text-[0.95em] italic leading-relaxed text-zinc-300">"{e.texto}"</p>
                        </div>
                      )}
                      <div className="p-4 bg-black/20">
                        <p className="mb-1.5 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                          <AlertTriangle className="h-3 w-3 text-amber-400" /> Motivo do Erro
                        </p>
                        <Md texto={e.motivo} className={cn(mdClass, 'leading-relaxed')} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

/** Sheet inferior do comentário, com abas "Resposta correta" e "Outras alternativas". */
export function ComentarioSheet({
  aberto,
  source,
  onClose,
}: {
  aberto: boolean;
  source: Fonte;
  onClose: () => void;
}) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {aberto && (
        <Overlay onClose={onClose} titulo="Comentário" icone={MessageSquare}>
          <ComentarioInner source={source} />
        </Overlay>
      )}
    </AnimatePresence>,
    document.body,
  );
}
