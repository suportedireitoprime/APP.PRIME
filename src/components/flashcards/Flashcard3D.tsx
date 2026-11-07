import { memo, useRef, useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, Scale, RotateCcw, CheckCircle2, Lightbulb, BookOpen,
  ListOrdered, XCircle, Mic, AlertTriangle, Edit3, HelpCircle, Undo2
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

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function toSentence(s: string): string {
  const minors = new Set(['da', 'de', 'do', 'das', 'dos', 'e', 'em', 'no', 'na', 'nos', 'nas', 'ao', 'à', 'às', 'por', 'para', 'com', 'sem', 'sob', 'ou']);
  return s.toLowerCase().split(/\s+/).map((word, i) => {
    if (i === 0 || !minors.has(word)) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return word;
  }).join(' ');
}

function cleanTextoTitulo(raw: string | null | undefined): string {
  if (!raw) return '';
  let s = raw.trim();
  // Remove prefixos numéricos como "01. ", "07 - ", "12. ", "1.", "3 -", "04. "
  s = s.replace(/^\d+[\s.\-_–:]+\s*/, '');
  // Remove sufixos isolados
  s = s.replace(/\s*[-–]\s*$/, '');
  return toSentence(s.trim());
}

function cleanTemaTitulo(raw: string | null | undefined, areaFallback?: string | null): string {
  const base = raw?.trim() || areaFallback?.trim() || 'Direito';
  const parts = base.split(/\s*(?:>|›|\/|\|)\s*/).filter(Boolean);
  const main = parts[0] || base;
  const stripped = main.replace(/^\d+[\s.\-_–:]+\s*/, '').trim();
  return toSentence(stripped || main);
}

function formatNivelArtigo(raw: string | null | undefined): { label: string; isArtigo: boolean } | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Ex: "1 - CONCEITO" ou "2 - APLICAÇÃO" -> "1 · Conceito"
  const m = trimmed.match(/^(\d+)\s*[-–]\s*(.+)$/i);
  if (m) {
    return {
      label: `${m[1]} · ${toSentence(m[2].trim())}`,
      isArtigo: false,
    };
  }

  // Ex: "Art. 121", "Artigo 5º"
  if (/^art/i.test(trimmed)) {
    return { label: trimmed, isArtigo: true };
  }

  return { label: toSentence(trimmed), isArtigo: false };
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

function getSmartDistractors(word: string, context?: string): string[] {
  const w = (word || '').trim();
  const lower = w.toLowerCase();

  // 1. Doutrinadores / Autores Jurídicos
  const autores = ['Roxin', 'Jakobs', 'Welzel', 'Beccaria', 'Ferrajoli', 'Lombroso', 'Zaffaroni', 'Binding', 'von Liszt', 'Kelsen', 'Pontes de Miranda', 'Nelson Hungria'];
  if (autores.some(a => a.toLowerCase() === lower)) {
    return autores.filter(a => a.toLowerCase() !== lower).slice(0, 3);
  }

  // 2. Anos / Números
  if (/^\d{4}$/.test(w)) {
    const num = parseInt(w, 10);
    return [String(num - 3), String(num + 3), String(num + 24)];
  }
  if (/^\d+$/.test(w)) {
    const num = parseInt(w, 10);
    return [String(Math.max(1, num - 2)), String(num + 2), String(num + 5)];
  }

  // 3. Prazos / Dias / Meses / Anos
  if (lower.includes('dia')) return ['5 dias', '15 dias', '30 dias', '10 dias'].filter(x => x.toLowerCase() !== lower).slice(0, 3);
  if (lower.includes('ano')) return ['1 ano', '2 anos', '4 anos', '8 anos'].filter(x => x.toLowerCase() !== lower).slice(0, 3);
  if (lower.includes('mês') || lower.includes('mes')) return ['1 mês', '3 meses', '6 meses'].filter(x => x.toLowerCase() !== lower).slice(0, 3);

  // 4. Pares conceituais doutrinários frequentes
  const pares: Record<string, string[]> = {
    'alteridade': ['confiança', 'insignificância', 'adequação social'],
    'confiança': ['alteridade', 'lesividade', 'ofensividade'],
    'material': ['formal', 'de mera conduta', 'de perigo'],
    'formal': ['material', 'de mera conduta', 'complexo'],
    'doloso': ['culposo', 'preterdoloso', 'tentado'],
    'culposo': ['doloso', 'preterdoloso', 'eventual'],
    'absoluta': ['relativa', 'provisória', 'parcial'],
    'relativa': ['absoluta', 'plena', 'subsidiária'],
    'pública': ['privada', 'condicionada', 'personalíssima'],
    'privada': ['pública incondicionada', 'pública condicionada', 'subsidiária'],
    'originário': ['derivado', 'decorrente', 'revisor'],
    'derivado': ['originário', 'difuso', 'supranacional'],
    'analítica': ['sintética', 'outorgada', 'promulgada'],
    'sintética': ['analítica', 'prolixa', 'heterodoxa'],
    'promulgada': ['outorgada', 'pactuada', 'cesarista'],
    'outorgada': ['promulgada', 'democrática', 'revolucionária'],
    'subjetivo': ['objetivo', 'normativo', 'funcional'],
    'objetivo': ['subjetivo', 'circunstancial', 'formal'],
    'direto': ['indireto', 'eventual', 'alternativo'],
    'indireto': ['direto', 'reflexo', 'subsidiário'],
    'unilateral': ['bilateral', 'plurilateral', 'sinalagmático'],
    'bilateral': ['unilateral', 'plurilateral', 'gratuito'],
    'reclusão': ['detenção', 'prisão simples', 'multa'],
    'detenção': ['reclusão', 'prisão simples', 'advertência'],
    'perigo': ['dano', 'lesão', 'ofensa'],
    'dano': ['perigo abstrato', 'perigo concreto', 'ameaça'],
    'emergência': ['sítio', 'defesa', 'calamidade'],
    'jurisdicional': ['administrativo', 'legislativo', 'político'],
    'comunista': ['integralista', 'anarquista', 'liberal'],
    'vermelha': ['constitucionalista', 'paulista', 'farroupilha'],
    'prestes': ['Vargas', 'Campos', 'Lampião'],
    'benário': ['Prestigiada', 'Krupp', 'Vargas'],
    'nazistas': ['aliados', 'soviéticos', 'britânicos'],
    'pena': ['medida de segurança', 'multa', 'reparação dos danos'],
    'segurança': ['pena', 'reparação dos danos', 'transação penal'],
    'reparação': ['punição', 'segregação', 'retribuição'],
  };

  for (const [key, dists] of Object.entries(pares)) {
    if (lower === key || lower.includes(key)) {
      return dists.slice(0, 3);
    }
  }

  // 5. Fallback com termos jurídicos sólidos
  const fallback = ['Tipicidade', 'Culpabilidade', 'Ilicitude', 'Legalidade', 'Proporcionalidade', 'Razoabilidade', 'Ofensividade', 'Subsidiariedade'];
  return fallback.filter(f => f.toLowerCase() !== lower).slice(0, 3);
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

  // Estados de Completar Lacunas
  const palavrasCorretas = useMemo(() => {
    if (tipoCard !== 'Completar Lacunas') return [];
    if (Array.isArray(parsedData?.palavras)) {
      return parsedData.palavras.filter(Boolean).map(String);
    }
    return [];
  }, [tipoCard, parsedData]);

  const [lacunasPreenchidas, setLacunasPreenchidas] = useState<string[]>([]);
  const [lacunaStatus, setLacunaStatus] = useState<'idle' | 'correto' | 'erro'>('idle');
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  // Opções de palavras para preencher a lacuna
  const lacunaOptions = useMemo(() => {
    if (tipoCard !== 'Completar Lacunas' || palavrasCorretas.length === 0) return [];
    
    // Se for 1 palavra (ex: Claus Roxin):
    if (palavrasCorretas.length === 1) {
      const correct = palavrasCorretas[0];
      const dists = getSmartDistractors(correct, atual.pergunta);
      const combined = [correct, ...dists.slice(0, 3)];
      return combined.sort((a, b) => hashString(a + atual.id) - hashString(b + atual.id));
    }

    // Se forem múltiplas palavras (ex: Comunista, Vermelha, Prestes):
    const dists = getSmartDistractors(palavrasCorretas[0], atual.pergunta);
    const combined = [...palavrasCorretas];
    if (dists.length > 0 && !combined.includes(dists[0])) {
      combined.push(dists[0]);
    }
    return combined.sort((a, b) => hashString(a + atual.id) - hashString(b + atual.id));
  }, [tipoCard, palavrasCorretas, atual.id, atual.pergunta]);

  // Pergunta renderizada na frente (substitui ___ pelas palavras selecionadas dinamicamente)
  const displayPergunta = useMemo(() => {
    if (tipoCard !== 'Completar Lacunas' || lacunasPreenchidas.length === 0) {
      return atual.pergunta;
    }
    let p = atual.pergunta;
    lacunasPreenchidas.forEach((word) => {
      p = p.replace(/_{2,}/, `**${word}**`);
    });
    return p;
  }, [atual.pergunta, tipoCard, lacunasPreenchidas]);

  // Estados do Ditado / Voz
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  // Limpa estados ao trocar de card
  useEffect(() => {
    setSelectedOption(null);
    setSelectedVF(null);
    setSelectedPegadinha(null);
    setLacunasPreenchidas([]);
    setLacunaStatus('idle');
    setSelectedWord(null);
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

  // Preenchimento de Lacuna Única (4 opções)
  const handleSelectSingleLacuna = (word: string) => {
    if (selectedWord) return;
    setSelectedWord(word);
    setLacunasPreenchidas([word]);

    const isCorreto = word.trim().toLowerCase() === palavrasCorretas[0].trim().toLowerCase();
    if (isCorreto) {
      setLacunaStatus('correto');
      haptic.success?.();
      toast.success('Correto! Lacuna preenchida com perfeição.', { duration: 1500 });
    } else {
      setLacunaStatus('erro');
      haptic.error?.();
      toast.error(`Incorreto! A palavra correta é "${palavrasCorretas[0]}".`, { duration: 2000 });
    }
    playFlipSound();
    setTimeout(() => onVirar(), 750);
  };

  const isFormatoPadrao = tipoCard === 'Pergunta e Resposta';

  const cleanAssunto = useMemo(() => {
    return cleanTextoTitulo(atual.subtema);
  }, [atual.subtema]);

  const cleanTema = useMemo(() => {
    return cleanTemaTitulo(atual.tema, atual.area);
  }, [atual.tema, atual.area]);

  const nivelInfo = useMemo(() => {
    return formatNivelArtigo(atual.artigo_numero);
  }, [atual.artigo_numero]);

  const handleCardClick = () => {
    // Se o card já está virado (mostrando o verso/resposta), o usuário pode clicar para virar de volta
    if (virado) {
      onVirar();
      return;
    }

    // Se estiver na frente:
    if (isFormatoPadrao) {
      // Formato padrão (Pergunta e Resposta): vira normalmente com o clique
      onVirar();
    } else {
      // Formatos interativos (Completar Lacunas, Múltipla Escolha, V/F, Ditado, Ache o Erro, Pegadinha):
      // SÓ VIRA SE A PESSOA SELECIONAR AS OPÇÕES/RESPOSTAS!
      haptic.selection?.();
      const dicasInterativas: Record<string, string> = {
        'Completar Lacunas': 'Selecione uma palavra nas opções abaixo para preencher a lacuna.',
        'Múltipla Escolha': 'Selecione uma das alternativas abaixo para responder.',
        'Verdadeiro ou Falso': 'Escolha Verdadeiro ou Falso abaixo para responder.',
        'Ache o Erro': 'Identifique o termo com erro nas opções abaixo.',
        'Ditado': 'Toque no microfone abaixo para ditar sua resposta.',
        'Pegadinha': 'Avalie se há pegadinha nas opções abaixo.',
      };
      toast.info(dicasInterativas[tipoCard] || 'Selecione uma resposta abaixo para virar o card.', {
        id: 'flashcard-interactive-hint',
        duration: 1800,
      });
    }
  };

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
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
            onClick={handleCardClick}
            onKeyDown={handleCardKeyDown}
            aria-label={virado ? 'Ver pergunta' : isFormatoPadrao ? 'Ver resposta' : 'Flashcard interativo'}
            className={cn(
              "relative w-full h-full text-left focus:outline-none select-none",
              virado || isFormatoPadrao ? "cursor-pointer" : "cursor-default"
            )}
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

                {/* Topo Harmônico: Badges de Tipo & Nível/Artigo */}
                <div className="relative z-10 mb-2.5 flex items-center justify-between gap-2">
                  {/* Badge do Tipo de Flashcard com visual Glassmorphism refinado */}
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-black uppercase tracking-wider shadow-sm backdrop-blur-md border transition-all',
                      tipoCard === 'Pergunta e Resposta' && 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200',
                      tipoCard === 'Completar Lacunas' && 'bg-violet-950/70 border-violet-500/40 text-violet-200',
                      tipoCard === 'Múltipla Escolha' && 'bg-cyan-950/70 border-cyan-500/40 text-cyan-200',
                      tipoCard === 'Verdadeiro ou Falso' && 'bg-teal-950/70 border-teal-500/40 text-teal-200',
                      tipoCard === 'Ache o Erro' && 'bg-rose-950/70 border-rose-500/40 text-rose-200',
                      tipoCard === 'Ditado' && 'bg-amber-950/70 border-amber-500/40 text-amber-200',
                      tipoCard === 'Pegadinha' && 'bg-yellow-950/70 border-yellow-500/40 text-yellow-200'
                    )}
                  >
                    {tipoCard === 'Múltipla Escolha' && <ListOrdered className="h-3 w-3 text-cyan-400" />}
                    {tipoCard === 'Verdadeiro ou Falso' && <CheckCircle2 className="h-3 w-3 text-teal-400" />}
                    {tipoCard === 'Ditado' && <Mic className="h-3 w-3 text-amber-400 animate-pulse" />}
                    {tipoCard === 'Pegadinha' && <AlertTriangle className="h-3 w-3 text-yellow-400" />}
                    {tipoCard === 'Completar Lacunas' && <Edit3 className="h-3 w-3 text-violet-400" />}
                    {tipoCard === 'Ache o Erro' && <XCircle className="h-3 w-3 text-rose-400" />}
                    {tipoCard === 'Pergunta e Resposta' && <HelpCircle className="h-3 w-3 text-emerald-400" />}
                    <span>{tipoCard}</span>
                  </span>

                  {/* Badge de Nível / Fase / Artigo */}
                  {nivelInfo && (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase bg-white/10 border border-white/15 text-white/90 backdrop-blur-md shadow-sm">
                      {nivelInfo.isArtigo ? (
                        <BookOpen className="h-2.5 w-2.5 text-white/70 shrink-0" />
                      ) : (
                        <Scale className="h-2.5 w-2.5 text-white/70 shrink-0" />
                      )}
                      <span>{nivelInfo.label}</span>
                    </span>
                  )}
                </div>

                {/* Placa Editorial Translúcida: Tema e Assunto (Harmônicos e sem poluição de números) */}
                <div className="relative z-10 mb-2 rounded-2xl bg-black/40 border border-white/10 px-3.5 py-2 backdrop-blur-md shadow-inner">
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-white/75">
                    <span className="truncate">{cleanTema}</span>
                    {cleanAssunto && (
                      <ChevronRight className="h-2.5 w-2.5 shrink-0 text-white/40" />
                    )}
                    <span className="text-[9.5px] font-medium tracking-normal text-white/50 lowercase">
                      {atual.area}
                    </span>
                  </div>

                  {cleanAssunto && (
                    <h3 className="text-[12.5px] sm:text-[13.5px] font-bold text-white leading-snug line-clamp-2 mt-0.5 drop-shadow-sm">
                      {cleanAssunto}
                    </h3>
                  )}
                </div>
                
                {/* Pergunta (com interpolação dinâmica de lacunas preenchidas) */}
                <div className="relative z-10 flex-1 flex items-center justify-center text-center px-2 py-2">
                  <motion.div 
                    initial={{ opacity: 0, y: 6 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 0.1, duration: 0.3 }} 
                    className="prose prose-invert max-w-none text-lg md:text-2xl leading-snug font-normal text-white drop-shadow-md prose-p:my-1 prose-strong:text-emerald-400 prose-strong:underline prose-strong:underline-offset-4 prose-em:text-white/80" 
                    style={{ 
                      fontFamily: "'Merriweather','Georgia',serif", 
                      textShadow: "0 2px 14px rgba(0,0,0,0.85)" 
                    }}
                  >
                    <PremiumMarkdown remarkPlugins={[remarkGfm]}>{displayPergunta}</PremiumMarkdown>
                  </motion.div>
                </div>
                
                {/* Rodapé da Frente com instrução contextualizada */}
                <div className="relative z-10 mt-auto shrink-0 flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-medium tracking-wide text-white/80 pt-2">
                  {isFormatoPadrao ? (
                    <>
                      <RotateCcw className="h-3.5 w-3.5 text-white/75" />
                      <span>Toque ou aperte espaço para virar</span>
                    </>
                  ) : tipoCard === 'Completar Lacunas' ? (
                    <>
                      <Edit3 className="h-3.5 w-3.5 text-violet-300" />
                      <span>Selecione a palavra correta abaixo para preencher</span>
                    </>
                  ) : tipoCard === 'Múltipla Escolha' ? (
                    <>
                      <ListOrdered className="h-3.5 w-3.5 text-cyan-300" />
                      <span>Selecione uma alternativa abaixo para responder</span>
                    </>
                  ) : tipoCard === 'Verdadeiro ou Falso' ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-teal-300" />
                      <span>Julgue a afirmação como Verdadeira ou Falsa abaixo</span>
                    </>
                  ) : tipoCard === 'Ache o Erro' ? (
                    <>
                      <XCircle className="h-3.5 w-3.5 text-rose-300" />
                      <span>Identifique o termo com erro nas opções abaixo</span>
                    </>
                  ) : tipoCard === 'Ditado' ? (
                    <>
                      <Mic className="h-3.5 w-3.5 text-amber-300" />
                      <span>Grave sua fala no microfone abaixo para responder</span>
                    </>
                  ) : tipoCard === 'Pegadinha' ? (
                    <>
                      <AlertTriangle className="h-3.5 w-3.5 text-yellow-300" />
                      <span>Avalie se há pegadinha nas opções abaixo</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-3.5 w-3.5 text-white/75" />
                      <span>Selecione uma resposta abaixo para virar</span>
                    </>
                  )}
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

                  <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2 gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] uppercase tracking-[0.2em] font-black" style={{ color: palette.primary }}>
                        Resposta Explicada
                      </p>
                      {cleanAssunto && (
                        <p className="text-[11px] font-semibold text-white/70 truncate mt-0.5">
                          {cleanAssunto}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest shrink-0 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
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

            {/* 5. COMPLETAR LACUNAS — ESCOLHA DE PALAVRAS INTERATIVA */}
            {tipoCard === 'Completar Lacunas' && palavrasCorretas.length === 1 && (
              <div className="space-y-2">
                <p className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider text-center">
                  Selecione a palavra para preencher a lacuna:
                </p>
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  {lacunaOptions.map((word) => {
                    const isChosen = selectedWord === word;
                    const isCorreta = word.trim().toLowerCase() === palavrasCorretas[0].trim().toLowerCase();

                    let btnColor = 'border-border/80 bg-zinc-900/95 hover:border-zinc-700 text-zinc-100';
                    if (selectedWord) {
                      if (isCorreta) {
                        btnColor = 'border-emerald-500 bg-emerald-500/25 text-emerald-200 ring-2 ring-emerald-500/40';
                      } else if (isChosen) {
                        btnColor = 'border-rose-500 bg-rose-500/25 text-rose-200 ring-2 ring-rose-500/40';
                      } else {
                        btnColor = 'border-zinc-800 bg-zinc-900/40 opacity-40 text-zinc-400';
                      }
                    }

                    return (
                      <button
                        key={word}
                        type="button"
                        disabled={!!selectedWord}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectSingleLacuna(word);
                        }}
                        className={cn(
                          'h-14 sm:h-16 flex items-center justify-center p-3 rounded-2xl border font-bold text-[15px] sm:text-[16px] transition-all active:scale-[0.98] shadow-md group',
                          btnColor
                        )}
                      >
                        <span className="truncate">{word}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5B. COMPLETAR LACUNAS — MÚLTIPLAS LACUNAS (BANCO DE PALAVRAS) */}
            {tipoCard === 'Completar Lacunas' && palavrasCorretas.length > 1 && (
              <div className="space-y-2.5 bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-zinc-300 uppercase tracking-wider">
                    {lacunasPreenchidas.length < palavrasCorretas.length
                      ? `Preencha a lacuna ${lacunasPreenchidas.length + 1} de ${palavrasCorretas.length}:`
                      : 'Todas as lacunas preenchidas!'}
                  </span>
                  {lacunasPreenchidas.length > 0 && lacunaStatus === 'idle' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLacunasPreenchidas(prev => prev.slice(0, -1));
                      }}
                      className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300"
                    >
                      <Undo2 className="h-3 w-3" /> Desfazer
                    </button>
                  )}
                </div>

                {/* Chips de Palavras do Banco */}
                <div className="flex flex-wrap gap-2 justify-center pt-1">
                  {lacunaOptions.map((word, wIdx) => {
                    const jaUsada = lacunasPreenchidas.includes(word);
                    return (
                      <button
                        key={`${word}-${wIdx}`}
                        type="button"
                        disabled={jaUsada || lacunaStatus !== 'idle'}
                        onClick={(e) => {
                          e.stopPropagation();
                          const next = [...lacunasPreenchidas, word];
                          setLacunasPreenchidas(next);
                          haptic.selection?.();

                          if (next.length === palavrasCorretas.length) {
                            const todasCorretas = next.every((w, i) => w.trim().toLowerCase() === palavrasCorretas[i].trim().toLowerCase());
                            if (todasCorretas) {
                              setLacunaStatus('correto');
                              haptic.success?.();
                              toast.success('Excelente! Todas as lacunas corretas.', { duration: 1500 });
                            } else {
                              setLacunaStatus('erro');
                              haptic.error?.();
                              toast.error('Incorreto! Conferindo a frase correta...', { duration: 2000 });
                            }
                            playFlipSound();
                            setTimeout(() => onVirar(), 800);
                          }
                        }}
                        className={cn(
                          'px-3.5 py-2 rounded-xl border text-[14px] font-bold transition-all shadow-sm active:scale-95',
                          jaUsada
                            ? 'bg-zinc-800/40 border-zinc-800 text-zinc-600 opacity-40 line-through'
                            : 'bg-zinc-800/90 border-zinc-700/80 text-zinc-100 hover:border-[#36AF85] hover:bg-[#36AF85]/15'
                        )}
                      >
                        {word}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 6. ACHE O ERRO */}
            {tipoCard === 'Ache o Erro' && (
              <div className="space-y-2">
                <p className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider text-center">
                  Identifique o erro na afirmação:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      haptic.success?.();
                      toast.info(`Palavra com erro: "${parsedData?.palavraErrada || 'Identificada'}".`, { duration: 1500 });
                      playFlipSound();
                      setTimeout(() => onVirar(), 750);
                    }}
                    className="h-14 sm:h-16 flex items-center justify-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-[14.5px] transition-all active:scale-[0.98] shadow-md"
                  >
                    <XCircle className="h-5 w-5 text-rose-400 shrink-0" />
                    <span>Ver Palavra Errada</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      haptic.selection?.();
                      playFlipSound();
                      onVirar();
                    }}
                    className="h-14 sm:h-16 flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold text-[14.5px] transition-all active:scale-[0.98] shadow-md"
                  >
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                    <span>Ver Frase Correta</span>
                  </button>
                </div>
              </div>
            )}

            {/* 7. PERGUNTA E RESPOSTA (OU FALLBACK) */}
            {(tipoCard === 'Pergunta e Resposta' || (!parsedData?.alternativas && tipoCard !== 'Verdadeiro ou Falso' && tipoCard !== 'Ditado' && tipoCard !== 'Pegadinha' && tipoCard !== 'Completar Lacunas' && tipoCard !== 'Ache o Erro')) && (
              <Button
                variant="outline"
                className="w-full h-14 sm:h-16 rounded-2xl text-[15px] sm:text-base font-black gap-2 border-border/80 bg-zinc-900/90 text-zinc-100 hover:border-[#36AF85]/50 hover:bg-[#36AF85]/10 active:opacity-70 transition-all shadow-md"
                onClick={() => {
                  playFlipSound();
                  onVirar();
                }}
              >
                <RotateCcw className="h-5 w-5 text-[#36AF85]" />
                <span>Virar Flashcard (Ver Resposta)</span>
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
