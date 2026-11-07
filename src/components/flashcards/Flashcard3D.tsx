import { memo, useRef, useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, Scale, RotateCcw, CheckCircle2, Lightbulb, BookOpen,
  ListOrdered, XCircle, Mic, AlertTriangle, Edit3, HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FlashcardCard } from '@/lib/flashcardsQueries';
import { getAreaThemePalette } from '@/lib/areasDireitoIcons';
import { PremiumMarkdown } from '@/components/ui/PremiumMarkdown';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { haptic } from '@/lib/nativeHaptics';
import { playFlipSound } from '@/lib/flipSound';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Flashcard3DProps = {
  atual: FlashcardCard;
  idx: number;
  virado: boolean;
  onVirar: () => void;
  onResponder: (status: 'compreendido' | 'revisar', shakeCallback?: () => void) => void;
  exitDirection: 'left' | 'down';
  accent?: string;
  areaNome?: string | null;
};

function toSentence(s: string): string {
  const minors = new Set(['da', 'de', 'do', 'das', 'dos', 'e', 'em', 'no', 'na', 'nos', 'nas', 'ao', 'à', 'às', 'por', 'para', 'com', 'sem', 'sob', 'ou']);
  return s.toLowerCase().split(/\s+/).map((word, i) => {
    if (i === 0 || !minors.has(word)) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return word;
  }).join(' ');
}

function formatTemaBreadcrumb(raw: string): string[] {
  const cleanRaw = raw.replace(/^\d+[\.\-\s]+/, '').trim();
  const dashIdx = cleanRaw.search(/\s[-–]\s/);
  if (dashIdx === -1) return [toSentence(cleanRaw)];
  const leiName = cleanRaw.slice(0, dashIdx).trim();
  let remaining = cleanRaw.slice(dashIdx).replace(/^\s*[-–]\s*/, '').trim();
  const badges: string[] = [];
  const structRegex = /^(?:PARTE|LIVRO|T[ÍI]TULO|CAP[ÍI]TULO|SE[ÇC][ÃA]O|SUBSE[ÇC][ÃA]O)\s+[\wºª]+(?:-[\wºª]+)?/i;
  
  while (true) {
    const match = remaining.match(structRegex);
    if (!match) break;
    badges.push(toSentence(match[0]));
    remaining = remaining.slice(match[0].length).trim();
    if (remaining.startsWith('-') || remaining.startsWith('–') || remaining.startsWith(':')) {
      remaining = remaining.replace(/^[-–—:]+\s*/, '').trim();
    }
  }
  const result = [leiName, ...badges];
  if (remaining) {
    result.push(toSentence(remaining));
  }
  return result;
}

function Bloco({ icon: Icon, titulo, texto }: { icon: any; titulo: string; texto: string }) {
  return (
    <div className="rounded-2xl bg-muted/50 p-3">
      <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {titulo}
      </p>
      <div className="prose prose-invert max-w-none text-sm leading-relaxed prose-p:my-1 prose-strong:text-emerald-400 prose-ul:my-1 prose-li:my-0">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{texto}</ReactMarkdown>
      </div>
    </div>
  );
}

const Flashcard3D = memo(function Flashcard3D({
  atual,
  idx,
  virado,
  onVirar,
  onResponder,
  exitDirection,
  accent = '#10b981',
  areaNome,
}: Flashcard3DProps) {
  const cardContainerRef = useRef<HTMLDivElement>(null);

  const effectiveArea = atual.area || areaNome;
  const palette = useMemo(() => getAreaThemePalette(effectiveArea || accent), [effectiveArea, accent]);

  // Identificação do Formato / Tipo do Flashcard
  const tipoCard = useMemo(() => {
    const raw = (atual.tipo || atual.resumo_ia || 'Pergunta e Resposta').trim();
    if (raw.toLowerCase().includes('múltipla') || raw.toLowerCase().includes('multipla')) return 'Múltipla Escolha';
    if (raw.toLowerCase().includes('verdadeiro') || raw.toLowerCase().includes('v/f')) return 'Verdadeiro ou Falso';
    if (raw.toLowerCase().includes('lacuna')) return 'Completar Lacunas';
    if (raw.toLowerCase().includes('erro')) return 'Ache o Erro';
    if (raw.toLowerCase().includes('ditado') || raw.toLowerCase().includes('fala')) return 'Ditado';
    if (raw.toLowerCase().includes('pegadinha')) return 'Pegadinha';
    return 'Pergunta e Resposta';
  }, [atual.tipo, atual.resumo_ia]);

  // Dados auxiliares decodificados de reforco_conteudo
  const parsedData = useMemo(() => {
    if (!atual.reforco_conteudo) return null;
    try {
      return JSON.parse(atual.reforco_conteudo);
    } catch {
      return null;
    }
  }, [atual.reforco_conteudo]);

  // Estados locais interativos
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedVF, setSelectedVF] = useState<boolean | null>(null);
  const [selectedPegadinha, setSelectedPegadinha] = useState<boolean | null>(null);

  // Estados do Ditado / Voz
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  // Limpa estados ao trocar de card
  useEffect(() => {
    setSelectedOption(null);
    setSelectedVF(null);
    setSelectedPegadinha(null);
    setIsListening(false);
    setTranscript('');
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }
  }, [atual.id, idx]);

  const handleResponder = (status: 'compreendido' | 'revisar') => {
    onResponder(status, () => {
      if (cardContainerRef.current) {
        cardContainerRef.current.animate(
          [
            { transform: 'translateX(-8px)' },
            { transform: 'translateX(8px)' }
          ],
          { duration: 50, iterations: 6, direction: 'alternate', easing: 'ease-in-out' }
        );
      }
    });
  };

  // Reconhecimento de Voz (Ditado)
  const toggleSpeechRecognition = () => {
    const SpeechRec = typeof window !== 'undefined'
      ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
      : null;

    if (!SpeechRec) {
      toast.info('Reconhecimento de voz não suportado neste navegador. Toque para conferir a resposta.');
      return;
    }

    if (isListening) {
      try { recognitionRef.current?.stop(); } catch {}
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = 'pt-BR';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
        haptic.selection?.();
      };

      recognition.onresult = (event: any) => {
        let text = '';
        for (let i = 0; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }
        setTranscript(text);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast.error('Permissão de microfone negada no navegador.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        haptic.success?.();
        toast.success('Fala capturada! Virando card para conferir a resposta...', { duration: 1500 });
        playFlipSound();
        setTimeout(() => {
          onVirar();
        }, 800);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={atual.id || idx}
          initial={{ opacity: 0, y: -15, scale: 0.94, rotateX: 12 }}
          animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
          exit={
            exitDirection === 'down'
              ? { opacity: 0, y: 180, rotateX: -55, scale: 0.82, transition: { duration: 0.32, ease: [0.32, 0.72, 0, 1] } }
              : { opacity: 0, x: -160, rotateZ: -14, scale: 0.88, transition: { duration: 0.28, ease: 'easeInOut' } }
          }
          transition={{ duration: 0.35, ease: [0.34, 1.25, 0.64, 1] }}
          className="relative z-10 w-full h-full [perspective:1600px]"
        >
          <div
            role="button"
            tabIndex={0}
            onClick={onVirar}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onVirar(); }}
            aria-label={virado ? 'Ver pergunta' : 'Ver resposta'}
            className="relative w-full h-full text-left focus:outline-none cursor-pointer select-none"
          >
            <div
              ref={cardContainerRef}
              data-flashcard="true"
              className="relative h-full w-full transition-transform duration-[800ms] [transform-style:preserve-3d] contain-layout"
              style={{
                transform: virado ? 'rotateY(180deg)' : 'rotateY(0deg)',
                transitionTimingFunction: 'cubic-bezier(0.34, 1.25, 0.64, 1)',
              }}
            >
              {/* Frente da Carta */}
              <div
                className="absolute inset-0 rounded-[32px] border p-6 md:p-8 flex flex-col justify-between overflow-hidden text-white [backface-visibility:hidden] [-webkit-backface-visibility:hidden] shadow-2xl"
                style={{
                  borderColor: `${palette.primary}55`,
                  boxShadow: `0 24px 60px -24px ${palette.primary}65, inset 0 0 0 1px rgba(255,255,255,0.15)`,
                  background: palette.cardGradient,
                }}
              >
                {/* Vinheta gradiente interna */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/65 pointer-events-none z-[1]" />

                {/* Moldura Interna */}
                <div className="absolute inset-2 sm:inset-2.5 rounded-[24px] border border-white/20 pointer-events-none z-[2]" />

                {/* Acabamento Laminado */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.12] pointer-events-none z-[2]" />

                {/* Gravura Majestosa da Deusa Têmis Vazada */}
                <img
                  src="/images/gamificacao/deusa_temis_vazada.webp"
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className="pointer-events-none absolute -right-3 -bottom-3 w-[150px] sm:w-[190px] md:w-[230px] h-auto object-contain opacity-35 select-none filter drop-shadow-[0_4px_14px_rgba(0,0,0,0.7)] z-0"
                />

                {/* Topo: Tipo do Card & Nível */}
                <div className="relative z-10 mb-2 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-black uppercase tracking-wider bg-black/50 border border-white/20 text-white shadow-sm backdrop-blur-md">
                    {tipoCard === 'Múltipla Escolha' && <ListOrdered className="h-3 w-3 text-cyan-400" />}
                    {tipoCard === 'Verdadeiro ou Falso' && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                    {tipoCard === 'Ditado' && <Mic className="h-3 w-3 text-amber-400 animate-pulse" />}
                    {tipoCard === 'Pegadinha' && <AlertTriangle className="h-3 w-3 text-yellow-400" />}
                    {tipoCard === 'Completar Lacunas' && <Edit3 className="h-3 w-3 text-violet-400" />}
                    {tipoCard === 'Ache o Erro' && <XCircle className="h-3 w-3 text-rose-400" />}
                    {tipoCard === 'Pergunta e Resposta' && <HelpCircle className="h-3 w-3 text-emerald-400" />}
                    <span>{tipoCard}</span>
                  </span>

                  {atual.artigo_numero && (
                    <span className="text-[10px] font-bold text-white/75 uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                      {atual.artigo_numero}
                    </span>
                  )}
                </div>

                {/* Cabeçalho do Card: Breadcrumb do Tema / Subtema */}
                <div className="relative z-10 mb-2 flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0 flex-1">
                    {atual.area === 'Termos Jurídicos' && (
                      <span className="mr-1.5 flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
                        <BookOpen className="h-2.5 w-2.5" />
                        Glossário
                      </span>
                    )}
                    {(() => {
                      const baseTema = atual.tema ?? atual.area ?? 'Flashcard';
                      const parts = formatTemaBreadcrumb(baseTema);
                      if (atual.subtema && !parts.some(p => p.toLowerCase() === atual.subtema?.toLowerCase())) {
                        parts.push(toSentence(atual.subtema));
                      }
                      return parts.map((part, i, arr) => (
                        <span key={i} className="flex items-center gap-1">
                          <span className="text-[11px] md:text-xs font-semibold leading-snug text-white/95 drop-shadow-sm">
                            {part}
                          </span>
                          {i < arr.length - 1 && (
                            <ChevronRight className="h-2.5 w-2.5 shrink-0 text-white/50" />
                          )}
                        </span>
                      ));
                    })()}
                  </div>
                  <Scale className="h-4 w-4 shrink-0 mt-0.5 text-white/80 drop-shadow-sm" aria-hidden />
                </div>
                
                {/* Pergunta */}
                <div className="relative z-10 flex-1 flex items-center justify-center text-center px-2 py-2">
                  <motion.div 
                    initial={{ opacity: 0, y: 6 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 0.1, duration: 0.3 }} 
                    className="prose prose-invert max-w-none text-lg md:text-2xl leading-snug font-normal text-white drop-shadow-md prose-p:my-1 prose-strong:text-white prose-em:text-white/80" 
                    style={{ 
                      fontFamily: "'Merriweather','Georgia',serif", 
                      textShadow: "0 2px 14px rgba(0,0,0,0.85)" 
                    }}
                  >
                    <PremiumMarkdown remarkPlugins={[remarkGfm]}>{atual.pergunta}</PremiumMarkdown>
                  </motion.div>
                </div>
                
                {/* Rodapé da Frente */}
                <div className="relative z-10 mt-auto shrink-0 flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-normal tracking-wide text-white/75 pt-2">
                  <RotateCcw className="h-3 w-3 text-white/75" />
                  {tipoCard === 'Múltipla Escolha' ? 'Selecione uma alternativa abaixo' :
                   tipoCard === 'Verdadeiro ou Falso' ? 'Julgue a afirmação abaixo' :
                   tipoCard === 'Ditado' ? 'Grave sua fala no microfone abaixo' :
                   tipoCard === 'Pegadinha' ? 'Avalie se há pegadinha abaixo' :
                   'Toque ou aperte espaço para virar'}
                </div>
              </div>

              {/* Verso da Carta — Estilo Obsidian com Tint do Tema e Deusa Têmis */}
              <div
                className="absolute inset-0 rounded-[32px] border p-5 md:p-7 overflow-y-auto scrollbar-hide flex flex-col [backface-visibility:hidden] [-webkit-backface-visibility:hidden] shadow-2xl"
                style={{
                  transform: 'rotateY(180deg)',
                  borderColor: `${palette.primary}45`,
                  boxShadow: `0 24px 60px -24px ${palette.primary}50, inset 0 0 0 1px rgba(255,255,255,0.08)`,
                  background: `linear-gradient(155deg, rgba(26, 25, 30, 0.98) 0%, rgba(13, 13, 16, 0.99) 100%)`,
                }}
              >
                {/* Moldura Interna Chanfrada */}
                <div className="absolute inset-2 sm:inset-2.5 rounded-[24px] border border-white/10 pointer-events-none z-[2]" />

                {/* Marca d'água / Gravura da Deusa Têmis no Verso */}
                <img
                  src="/images/gamificacao/deusa_temis_vazada.webp"
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className="pointer-events-none absolute -right-3 -bottom-3 w-[150px] sm:w-[190px] md:w-[230px] h-auto object-contain opacity-20 select-none filter drop-shadow-[0_4px_14px_rgba(0,0,0,0.7)] z-0"
                />

                <div className="relative z-10 flex-1 flex flex-col">
                  {atual.area === 'Termos Jurídicos' && (
                    <div className="flex justify-center mb-1">
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
                        <BookOpen className="h-2.5 w-2.5" />
                        Glossário
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-black" style={{ color: palette.primary }}>
                      Resposta Explicada
                    </p>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      {tipoCard}
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center space-y-4 pb-4">
                    <div className={`prose prose-invert max-w-prose text-center flex-1 flex flex-col justify-center ${
                      atual.resposta.length < 40 ? 'text-2xl sm:text-3xl prose-p:text-2xl sm:prose-p:text-3xl' :
                      atual.resposta.length < 80 ? 'text-xl sm:text-2xl prose-p:text-xl sm:prose-p:text-2xl' :
                      atual.resposta.length < 150 ? 'text-lg sm:text-xl prose-p:text-lg sm:prose-p:text-xl' :
                      'text-base sm:text-lg prose-p:text-base sm:prose-p:text-lg'
                    } prose-strong:text-emerald-400 prose-ul:text-left prose-ul:mx-auto prose-li:my-1 prose-headings:mb-2`}>
                      <PremiumMarkdown remarkPlugins={[remarkGfm]}>{atual.resposta}</PremiumMarkdown>
                    </div>
                  </div>
                  
                  {(atual.exemplo || atual.base_legal || atual.dica) && (
                    <div className="mt-3 border-t border-border pt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
                      {atual.exemplo && <Bloco icon={BookOpen} titulo="Exemplo Prático" texto={atual.exemplo} />}
                      {atual.base_legal && <Bloco icon={Scale} titulo="Base Legal / Artigo" texto={atual.base_legal} />}
                      {atual.dica && <Bloco icon={Lightbulb} titulo="Dica de Ouro" texto={atual.dica} />}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Controles Interativos por Tipo — exibidos ANTES de virar o card */}
      <AnimatePresence>
        {!virado && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="pt-3 pb-[calc(6.5rem+var(--sai-bottom))]"
          >
            {/* 1. MÚLTIPLA ESCOLHA (4 alternativas em 2x2) */}
            {tipoCard === 'Múltipla Escolha' && parsedData?.alternativas && (
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {(['A', 'B', 'C', 'D'] as const).map(letter => {
                  const text = parsedData?.alternativas?.[letter];
                  if (!text) return null;
                  const isSelected = selectedOption === letter;
                  const isCorrect = letter === parsedData?.gabarito?.trim();
                  
                  let btnColor = 'border-border/80 bg-zinc-900/95 hover:border-zinc-700 text-zinc-100';
                  if (selectedOption) {
                    if (isCorrect) {
                      btnColor = 'border-emerald-500 bg-emerald-500/25 text-emerald-200 ring-2 ring-emerald-500/40';
                    } else if (isSelected) {
                      btnColor = 'border-rose-500 bg-rose-500/25 text-rose-200 ring-2 ring-rose-500/40';
                    } else {
                      btnColor = 'border-zinc-800 bg-zinc-900/40 opacity-40 text-zinc-400';
                    }
                  }

                  return (
                    <button
                      key={letter}
                      type="button"
                      disabled={!!selectedOption}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOption(letter);
                        if (isCorrect) {
                          haptic.success?.();
                          toast.success('Correto! Excelente raciocínio.', { duration: 1500 });
                        } else {
                          haptic.error?.();
                          toast.error(`Incorreto! O gabarito é letra ${parsedData?.gabarito}.`, { duration: 2000 });
                        }
                        playFlipSound();
                        setTimeout(() => onVirar(), 750);
                      }}
                      className={cn(
                        'flex flex-col text-left p-3 sm:p-3.5 rounded-2xl border transition-all active:scale-[0.98] shadow-md group',
                        btnColor
                      )}
                    >
                      <span className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          'grid h-6 w-6 place-items-center rounded-lg text-xs font-black shadow-sm',
                          selectedOption && isCorrect ? 'bg-emerald-500 text-white' :
                          selectedOption && isSelected ? 'bg-rose-500 text-white' :
                          'bg-zinc-800 text-zinc-200 border border-zinc-700/60 group-hover:bg-zinc-700'
                        )}>
                          {letter}
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                          Opção {letter}
                        </span>
                      </span>
                      <span className="text-[12.5px] sm:text-[13.5px] font-medium leading-snug line-clamp-2">
                        {text}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 2. VERDADEIRO OU FALSO */}
            {tipoCard === 'Verdadeiro ou Falso' && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={selectedVF !== null}
                  onClick={(e) => {
                    e.stopPropagation();
                    const isV = atual.resposta?.trim().toLowerCase().startsWith('v');
                    setSelectedVF(true);
                    if (isV) {
                      haptic.success?.();
                      toast.success('Correto! Afirmação verdadeira.', { duration: 1500 });
                    } else {
                      haptic.error?.();
                      toast.error('Incorreto! A afirmação é Falsa.', { duration: 2000 });
                    }
                    playFlipSound();
                    setTimeout(() => onVirar(), 750);
                  }}
                  className={cn(
                    'h-14 sm:h-16 flex items-center justify-center gap-2.5 rounded-2xl border font-black text-base transition-all active:scale-[0.98] shadow-md',
                    selectedVF === true
                      ? (atual.resposta?.trim().toLowerCase().startsWith('v')
                          ? 'border-emerald-500 bg-emerald-500/25 text-emerald-200 ring-2 ring-emerald-500/40'
                          : 'border-rose-500 bg-rose-500/25 text-rose-200 ring-2 ring-rose-500/40')
                      : 'border-border/80 bg-zinc-900/90 text-zinc-100 hover:border-emerald-500/50 hover:bg-emerald-500/10'
                  )}
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span>Verdadeiro</span>
                </button>
                <button
                  type="button"
                  disabled={selectedVF !== null}
                  onClick={(e) => {
                    e.stopPropagation();
                    const isF = atual.resposta?.trim().toLowerCase().startsWith('f');
                    setSelectedVF(false);
                    if (isF) {
                      haptic.success?.();
                      toast.success('Correto! Afirmação falsa.', { duration: 1500 });
                    } else {
                      haptic.error?.();
                      toast.error('Incorreto! A afirmação é Verdadeira.', { duration: 2000 });
                    }
                    playFlipSound();
                    setTimeout(() => onVirar(), 750);
                  }}
                  className={cn(
                    'h-14 sm:h-16 flex items-center justify-center gap-2.5 rounded-2xl border font-black text-base transition-all active:scale-[0.98] shadow-md',
                    selectedVF === false
                      ? (atual.resposta?.trim().toLowerCase().startsWith('f')
                          ? 'border-emerald-500 bg-emerald-500/25 text-emerald-200 ring-2 ring-emerald-500/40'
                          : 'border-rose-500 bg-rose-500/25 text-rose-200 ring-2 ring-rose-500/40')
                      : 'border-border/80 bg-zinc-900/90 text-zinc-100 hover:border-rose-500/50 hover:bg-rose-500/10'
                  )}
                >
                  <XCircle className="h-5 w-5 text-rose-400" />
                  <span>Falso</span>
                </button>
              </div>
            )}

            {/* 3. DITADO (ÁUDIO / VOZ) */}
            {tipoCard === 'Ditado' && (
              <div className="flex flex-col items-center gap-3 bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-3 w-full justify-between">
                  <div className="flex items-center gap-2">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                      <Mic className={cn('h-5 w-5', isListening && 'animate-bounce text-amber-300')} />
                    </span>
                    <div>
                      <p className="text-[14px] font-bold text-zinc-100">Treino por Voz</p>
                      <p className="text-[12px] text-zinc-400">
                        {isListening ? 'Ouvindo... Fale a resposta agora' : 'Fale a resposta no microfone'}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSpeechRecognition();
                    }}
                    className={cn(
                      'rounded-xl px-4 font-black transition-all shadow-md',
                      isListening ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse' : 'bg-amber-500 hover:bg-amber-600 text-black'
                    )}
                  >
                    {isListening ? 'Parar Fala' : 'Falar Agora'}
                  </Button>
                </div>

                {transcript && (
                  <div className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-300 italic">
                    "{transcript}"
                  </div>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    playFlipSound();
                    onVirar();
                  }}
                  className="w-full text-center text-[12px] font-semibold text-zinc-400 hover:text-white pt-1 transition-colors"
                >
                  Prefiro ler sem áudio ➔ Ver Resposta
                </button>
              </div>
            )}

            {/* 4. PEGADINHA */}
            {tipoCard === 'Pegadinha' && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={selectedPegadinha !== null}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPegadinha(true);
                    const tem = String(parsedData?.temPegadinha || '').toLowerCase().startsWith('s');
                    if (tem) {
                      haptic.success?.();
                      toast.success('Pegou a armadilha! Tem pegadinha sim.', { duration: 1500 });
                    } else {
                      haptic.error?.();
                      toast.error('Não tinha pegadinha! A afirmação era correta.', { duration: 2000 });
                    }
                    playFlipSound();
                    setTimeout(() => onVirar(), 750);
                  }}
                  className={cn(
                    'h-14 sm:h-16 flex items-center justify-center gap-2 rounded-2xl border font-black text-[15px] transition-all active:scale-[0.98] shadow-md',
                    selectedPegadinha === true
                      ? 'border-yellow-500 bg-yellow-500/25 text-yellow-200 ring-2 ring-yellow-500/40'
                      : 'border-border/80 bg-zinc-900/90 text-zinc-100 hover:border-yellow-500/50 hover:bg-yellow-500/10'
                  )}
                >
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  <span>Tem Pegadinha!</span>
                </button>
                <button
                  type="button"
                  disabled={selectedPegadinha !== null}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPegadinha(false);
                    const naoTem = String(parsedData?.temPegadinha || '').toLowerCase().startsWith('n');
                    if (naoTem) {
                      haptic.success?.();
                      toast.success('Acertou! A frase não tem armadilha.', { duration: 1500 });
                    } else {
                      haptic.error?.();
                      toast.error('Caiu na armadilha! Tinha pegadinha.', { duration: 2000 });
                    }
                    playFlipSound();
                    setTimeout(() => onVirar(), 750);
                  }}
                  className={cn(
                    'h-14 sm:h-16 flex items-center justify-center gap-2 rounded-2xl border font-black text-[15px] transition-all active:scale-[0.98] shadow-md',
                    selectedPegadinha === false
                      ? 'border-emerald-500 bg-emerald-500/25 text-emerald-200 ring-2 ring-emerald-500/40'
                      : 'border-border/80 bg-zinc-900/90 text-zinc-100 hover:border-emerald-500/50 hover:bg-emerald-500/10'
                  )}
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span>Sem Pegadinha</span>
                </button>
              </div>
            )}

            {/* 5. COMPLETAR LACUNAS, ACHE O ERRO, PERGUNTA E RESPOSTA */}
            {(tipoCard === 'Completar Lacunas' || tipoCard === 'Ache o Erro' || tipoCard === 'Pergunta e Resposta' || (!parsedData?.alternativas && tipoCard !== 'Verdadeiro ou Falso' && tipoCard !== 'Ditado' && tipoCard !== 'Pegadinha')) && (
              <Button
                variant="outline"
                className="w-full h-14 sm:h-16 rounded-2xl text-[15px] sm:text-base font-black gap-2 border-border/80 bg-zinc-900/90 text-zinc-100 hover:border-[#36AF85]/50 hover:bg-[#36AF85]/10 active:opacity-70 transition-all shadow-md"
                onClick={() => {
                  playFlipSound();
                  onVirar();
                }}
              >
                <RotateCcw className="h-5 w-5 text-[#36AF85]" />
                <span>
                  {tipoCard === 'Completar Lacunas' ? 'Conferir Palavras das Lacunas' :
                   tipoCard === 'Ache o Erro' ? 'Descobrir Onde Está o Erro' :
                   'Virar Flashcard (Ver Resposta)'}
                </span>
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botões de Ação — só aparecem após virar o card */}
      <AnimatePresence>
        {virado && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="pt-2 pb-[calc(6.5rem+var(--sai-bottom))] grid grid-cols-2 gap-3"
          >
            <Button
              variant="outline"
              className="h-14 sm:h-16 rounded-2xl text-base font-bold gap-2 border-border/80 hover:border-emerald-500/50 hover:bg-emerald-500/10 active:opacity-70 transition-all shadow-sm"
              onClick={() => handleResponder('revisar')}
            >
              <RotateCcw className="h-5 w-5 text-emerald-500" />
              <span>Revisar</span>
            </Button>
            <Button
              className="h-14 sm:h-16 rounded-2xl text-base font-black gap-2 active:opacity-70 transition-all shadow-md hover:opacity-90"
              style={{ backgroundColor: palette.primary, color: '#ffffff' }}
              onClick={() => handleResponder('compreendido')}
            >
              <CheckCircle2 className="h-5 w-5 text-white" />
              <span>Compreendi</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

export default Flashcard3D;
