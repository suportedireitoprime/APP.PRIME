import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, BadgeCheck, Ban, Copy, Check, Heart, Volume2, Pause, 
  Target, Play, LayoutGrid, Loader2, Sparkles, BookOpen, Layers, 
  ChevronRight, ExternalLink, Calendar, RotateCw 
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { toast } from 'sonner';
import type { Sumula } from '@/services/sumulasService';
import { copiarTexto } from '@/lib/nativo/copiar';
import { supabase } from '@/integrations/supabase/client';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';
import ReactMarkdown from 'react-markdown';
import brasaoImgAsset from '@/assets/brasao-republica.webp';

const VideoaulasListSheet = lazyWithRetry(() => import('./VideoaulasListSheet'));
const VideoaulaSheet = lazyWithRetry(() => import('./VideoaulaSheet'));
const QuizView = lazyWithRetry(() => import('@/components/estudar/QuizView'));

interface Props {
  sumula: Sumula;
  tribunal?: string;
  isFavorita?: boolean;
  onToggleFavorita?: () => void;
  onClose: () => void;
}

// Renders inline text with markdown-style links [label](url), **bold**, *italic*, _italic_.
function renderInline(text: string): (string | JSX.Element)[] {
  let normalized = text.replace(/\]\s+\(/g, '](');
  normalized = normalized.replace(/\*\*\s+\*\*/g, ' ');

  const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([\s\S]+?)\*\*|(?<![*\w])\*([^*\n]+?)\*(?!\*)|(?<![_\w])_([^_\n]+?)_(?!_)/g;
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(normalized)) !== null) {
    if (match.index > lastIndex) {
      parts.push(normalized.slice(lastIndex, match.index));
    }
    if (match[1] !== undefined) {
      parts.push(
        <a
          key={key++}
          href={match[2]}
          target="_blank"
          rel="noreferrer"
          className="text-primary-light underline decoration-primary-light/40 hover:decoration-primary-light font-medium"
        >
          {renderInline(match[1])}
        </a>
      );
    } else if (match[3] !== undefined) {
      parts.push(
        <strong key={key++} className="font-semibold text-foreground">
          {renderInline(match[3])}
        </strong>
      );
    } else if (match[4] !== undefined || match[5] !== undefined) {
      parts.push(<em key={key++}>{renderInline(match[4] ?? match[5] ?? '')}</em>);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < normalized.length) {
    parts.push(normalized.slice(lastIndex));
  }
  return parts.map((p) => (typeof p === 'string' ? p.replace(/\*\*/g, '') : p));
}

function Section({ title, items }: { title: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <section className="mt-5">
      <h3 className="font-display text-[13px] uppercase tracking-wide text-primary-light/90 font-bold mb-2">
        {title}
      </h3>
      <div className="space-y-3">
        {items.map((it, idx) => (
          <p
            key={idx}
            className="text-[14.5px] leading-relaxed text-foreground/85 whitespace-pre-wrap"
          >
            {renderInline(it)}
          </p>
        ))}
      </div>
    </section>
  );
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function formatarDataPublicacao(dataStr: string | null | undefined): string | null {
  if (!dataStr) return null;
  const limpo = dataStr.trim();
  if (!limpo) return null;

  // Formato ISO: YYYY-MM-DD
  const isoMatch = limpo.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const ano = parseInt(isoMatch[1], 10);
    const mes = parseInt(isoMatch[2], 10);
    const dia = parseInt(isoMatch[3], 10);
    const meses = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    const mesNome = meses[mes - 1] || `${mes}`;
    return `${dia < 10 ? '0' : ''}${dia} de ${mesNome} de ${ano}`;
  }

  // Formato DD/MM/YYYY
  const dmyMatch = limpo.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmyMatch) {
    const dia = parseInt(dmyMatch[1], 10);
    const mes = parseInt(dmyMatch[2], 10);
    const ano = parseInt(dmyMatch[3], 10);
    const meses = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    const mesNome = meses[mes - 1] || `${mes}`;
    return `${dia < 10 ? '0' : ''}${dia} de ${mesNome} de ${ano}`;
  }

  return limpo;
}

export function SumulaVinculanteSheet({ sumula, tribunal, isFavorita = false, onToggleFavorita, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('sumula');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiContent, setAiContent] = useState<{ explicacao?: string; exemplo?: string; termos?: string } | null>(null);

  // Estados de Narração
  const [narracaoLoading, setNarracaoLoading] = useState(false);
  const [narracaoPlaying, setNarracaoPlaying] = useState(false);
  const [narracaoUrl, setNarracaoUrl] = useState<string | null>(null);
  const narracaoAudioRef = useRef<HTMLAudioElement | null>(null);
  const narracaoProgressFillRef = useRef<HTMLDivElement | null>(null);
  const narracaoTimeRef = useRef<HTMLSpanElement | null>(null);
  const narracaoTotalTimeRef = useRef<HTMLSpanElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Estados de Sheets Secundários
  const [showFuncoesSheet, setShowFuncoesSheet] = useState(false);
  const [showVideoaulasListSheet, setShowVideoaulasListSheet] = useState(false);
  const [showVideoaulaSheet, setShowVideoaulaSheet] = useState(false);
  const [videoaula, setVideoaula] = useState<any>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  const extras = sumula.extras ?? {};
  const isVinculante = tribunal === 'STF_VINCULANTE';
  const sumulaTitulo = `${isVinculante ? 'Súmula Vinculante' : 'Súmula'} ${sumula.numero}`;

  const stopProgressTracking = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  const clearAudioState = useCallback(() => {
    setNarracaoPlaying(false);
    stopProgressTracking();
    if (narracaoProgressFillRef.current) narracaoProgressFillRef.current.style.width = '0%';
    if (narracaoTimeRef.current) narracaoTimeRef.current.textContent = '0:00';
  }, [stopProgressTracking]);

  const startProgressTracking = useCallback((audio: HTMLAudioElement) => {
    stopProgressTracking();
    const update = () => {
      if (audio && audio.duration && !audio.paused) {
        const cur = audio.currentTime;
        const dur = audio.duration;
        const pct = Math.min(100, Math.max(0, (cur / dur) * 100));
        if (narracaoProgressFillRef.current) narracaoProgressFillRef.current.style.width = `${pct}%`;
        if (narracaoTimeRef.current) narracaoTimeRef.current.textContent = formatTime(cur);
        if (narracaoTotalTimeRef.current) narracaoTotalTimeRef.current.textContent = formatTime(dur);
        animFrameRef.current = requestAnimationFrame(update);
      }
    };
    animFrameRef.current = requestAnimationFrame(update);
  }, [stopProgressTracking]);

  const playAudio = useCallback(async (url: string) => {
    let audio = narracaoAudioRef.current;
    if (!audio) {
      audio = new Audio(url);
      narracaoAudioRef.current = audio;
    } else if (audio.src !== url) {
      audio.src = url;
    }

    audio.onended = () => clearAudioState();
    audio.onerror = () => {
      clearAudioState();
      toast.error('Falha ao reproduzir áudio da narração.');
    };

    audio.onloadedmetadata = () => {
      if (narracaoTotalTimeRef.current && audio) {
        narracaoTotalTimeRef.current.textContent = formatTime(audio.duration);
      }
    };

    try {
      await audio.play();
      setNarracaoPlaying(true);
      startProgressTracking(audio);
    } catch (err: any) {
      clearAudioState();
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        toast.info('Narração pronta! Toque em Ouvir para iniciar.');
      } else {
        toast.error('Toque em Ouvir para reproduzir.');
      }
    }
  }, [clearAudioState, startProgressTracking]);

  const handleNarrar = async () => {
    if (narracaoPlaying) {
      if (narracaoAudioRef.current) {
        narracaoAudioRef.current.pause();
      }
      clearAudioState();
      return;
    }

    if (narracaoUrl) {
      await playAudio(narracaoUrl);
      return;
    }

    setNarracaoLoading(true);
    try {
      const payload = {
        tabela_nome: isVinculante ? 'sumulas_vinculantes' : 'sumulas',
        artigo_numero: sumula.numero,
        artigo_texto: sumula.enunciado,
        lei_nome: isVinculante ? 'Súmula Vinculante' : 'Súmula',
        is_sumula: true
      };

      const { data: json, error } = await supabase.functions.invoke('narrar-artigo', {
        body: payload
      });

      if (error) throw error;
      if (json?.error) throw new Error(json.error);

      if (json?.audio_url) {
        setNarracaoUrl(json.audio_url);
        await playAudio(json.audio_url);
      } else {
        toast.error('Áudio não gerado pela IA.');
      }
    } catch (e: any) {
      console.error('Erro na narração:', e);
      toast.error('Erro na narração: ' + (e?.message || 'Falha na conexão'));
    } finally {
      setNarracaoLoading(false);
    }
  };

  const fetchAiData = async () => {
    if (aiContent || aiLoading) return;
    setAiLoading(true);
    try {
      const { data: resp, error } = await supabase.functions.invoke('jurisprudencia-explicar', {
        body: {
          modo: 'sumula-tabs',
          sumulaId: sumula.id,
          tribunal: tribunal || 'STF',
          numero: sumula.numero,
          enunciado: sumula.enunciado,
          precedentes: extras?.precedentes_representativos?.join('\n') || ''
        }
      });
      if (error) throw error;
      if (resp?.error) throw new Error(resp.error);
      if (resp?.data) {
        setAiContent(resp.data);
      }
    } catch (e: any) {
      toast.error('Falha ao gerar explicação da IA: ' + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  useBodyScrollLock(true);

  useEffect(() => {
    return () => {
      if (narracaoAudioRef.current) {
        narracaoAudioRef.current.pause();
        narracaoAudioRef.current = null;
      }
      stopProgressTracking();
    };
  }, [stopProgressTracking]);

  async function copyEnunciado() {
    try {
      await copiarTexto(`${sumulaTitulo}\n\n${sumula.enunciado}`);
      setCopied(true);
      toast.success('Enunciado copiado para a área de transferência');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Falha ao copiar');
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="absolute inset-x-0 bottom-0 top-[5%] md:top-[8%] bg-[#0f0f0f] text-foreground rounded-t-3xl border-t border-white/10 shadow-2xl flex flex-col max-w-4xl mx-auto overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Pílula de arrasto */}
          <div className="shrink-0 flex justify-center pt-3 pb-1 bg-[#0f0f0f]">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Top bar (Favorito + Fechar) idêntico ao Código Penal */}
          <div className="px-4 pt-1 pb-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <motion.button
                onClick={onToggleFavorita}
                whileTap={{ scale: 0.85 }}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${isFavorita ? 'bg-rose-500/15' : 'hover:bg-secondary active:bg-secondary'}`}
                title={isFavorita ? 'Remover favorito' : 'Favoritar'}
                aria-label={isFavorita ? 'Remover favorito' : 'Favoritar'}
              >
                <motion.span
                  key={isFavorita ? 'on' : 'off'}
                  initial={{ scale: isFavorita ? 0.6 : 1 }}
                  animate={{ scale: isFavorita ? [0.6, 1.35, 1] : 1 }}
                  transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
                  className="inline-flex"
                >
                  <Heart
                    className={`w-6 h-6 transition-colors ${isFavorita ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.55)]' : 'text-muted-foreground'}`}
                    strokeWidth={2}
                  />
                </motion.span>
              </motion.button>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => { import('@/lib/nativeHaptics').then((m) => m.haptic.selection()); onClose(); }} 
                className="w-11 h-11 rounded-full bg-primary hover:bg-primary/90 transition-colors flex items-center justify-center shadow-lg active:scale-95" 
                aria-label="Fechar"
              >
                <X className="w-5 h-5 text-primary-foreground" />
              </button>
            </div>
          </div>

          {/* Título Principal */}
          <div className="px-5 pt-1 pb-3 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                {sumulaTitulo}
              </h2>
              {sumula.situacao === 'cancelada' ? (
                <span className="text-[11px] bg-destructive/15 text-destructive px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <Ban className="w-3 h-3" /> Cancelada
                </span>
              ) : (
                <span className="text-[11px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5" /> Vigente
                </span>
              )}
            </div>
          </div>

          {/* Menu de Alternância (Tabs) idêntico ao Código Penal */}
          <Tabs 
            value={activeTab} 
            onValueChange={(v) => { 
              setActiveTab(v); 
              if (v !== 'sumula') fetchAiData(); 
            }} 
            className="flex-1 overflow-hidden flex flex-col min-h-0 relative"
          >
            <div className="shrink-0 mx-5 mb-3">
              <TabsList className="bg-secondary/60 rounded-2xl h-11 grid grid-cols-4 w-full p-1 border border-white/5">
                <TabsTrigger value="sumula" className="rounded-xl text-[12px] sm:text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 py-2 transition-all">
                  Súmula
                </TabsTrigger>
                <TabsTrigger value="explicacao" className="rounded-xl text-[12px] sm:text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 py-2 transition-all">
                  Explicação
                </TabsTrigger>
                <TabsTrigger value="exemplo" className="rounded-xl text-[12px] sm:text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 py-2 transition-all">
                  Exemplo
                </TabsTrigger>
                <TabsTrigger value="termos" className="rounded-xl text-[12px] sm:text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 py-2 transition-all">
                  Termos
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Conteúdo rolável */}
            <div className="flex-1 overflow-y-auto px-5 pb-[calc(7.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] relative overscroll-contain">
              
              {/* Barra de progresso de áudio sticky no topo idêntica ao Código Penal */}
              {narracaoPlaying && (
                <div className="sticky top-0 z-30 -mx-5 -mt-2 mb-4 bg-[#0f0f0f]/95 backdrop-blur-md border-b border-white/10 px-5 py-2.5 shadow-lg">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={handleNarrar}
                      className="flex-shrink-0 w-7 h-7 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-colors"
                      aria-label="Pausar narração"
                    >
                      <Pause className="w-3.5 h-3.5 text-primary-foreground" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div
                        className="h-1.5 rounded-full bg-white/10 overflow-hidden cursor-pointer"
                        onClick={(e) => {
                          const audio = narracaoAudioRef.current;
                          if (!audio || !audio.duration) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                          audio.currentTime = pct * audio.duration;
                        }}
                      >
                        <div
                          ref={narracaoProgressFillRef}
                          className="h-full bg-gradient-to-r from-primary to-primary-light transition-[width] duration-100 ease-out"
                          style={{ width: '0%' }}
                        />
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-[10.5px] font-mono text-foreground/70 tabular-nums">
                      <span ref={narracaoTimeRef}>0:00</span>
                      <span className="text-foreground/40"> / </span>
                      <span ref={narracaoTotalTimeRef}>0:00</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Marca d'água brasão */}
              <div className="sticky top-1/2 -translate-y-1/2 left-0 right-0 flex items-center justify-center pointer-events-none z-0" style={{ height: 0 }}>
                <img src={brasaoImgAsset} alt="" className="w-48 h-48 opacity-[0.05] object-contain" />
              </div>

              <TabsContent value="sumula" className="mt-0 outline-none space-y-5 relative z-10">
                <div className="rounded-2xl bg-secondary/40 p-4 border border-white/5 shadow-inner">
                  <p className="text-[15.5px] leading-relaxed text-foreground whitespace-pre-wrap font-sans">
                    {sumula.enunciado || 'Enunciado não disponível.'}
                  </p>

                  {/* Data de Publicação / Aprovação */}
                  {(sumula.data_publicacao || sumula.referencia) && (
                    <div className="mt-3.5 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[12.5px] text-muted-foreground">
                      {sumula.data_publicacao && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-primary-light shrink-0" />
                          <span>
                            Publicação: <strong className="font-medium text-foreground/90">{formatarDataPublicacao(sumula.data_publicacao)}</strong>
                          </span>
                        </div>
                      )}
                      {sumula.referencia && (
                        <span className="text-[11px] text-muted-foreground/80 bg-white/5 px-2 py-0.5 rounded-md" title={sumula.referencia}>
                          {sumula.referencia}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <Section title="Precedentes Representativos" items={extras.precedentes_representativos} />
                <Section title="Teses de Repercussão Geral" items={extras.teses_repercussao_geral} />
                <Section title="Jurisprudência Selecionada" items={extras.jurisprudencia_selecionada} />
                <Section title="Observação" items={extras.observacao} />
              </TabsContent>

              <TabsContent value="explicacao" className="mt-0 outline-none h-full relative z-10">
                {aiLoading && !aiContent ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-primary">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="text-sm font-medium text-muted-foreground">Gerando explicação com IA...</p>
                  </div>
                ) : aiContent?.explicacao ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none font-body leading-relaxed [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 pb-10">
                    <ReactMarkdown>{aiContent.explicacao}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                    <p className="text-muted-foreground text-sm">Não foi possível carregar a explicação.</p>
                    <button
                      onClick={fetchAiData}
                      disabled={aiLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary-light text-xs font-semibold transition-colors border border-primary/20"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                      Tentar novamente
                    </button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="exemplo" className="mt-0 outline-none h-full relative z-10">
                {aiLoading && !aiContent ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-primary">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="text-sm font-medium text-muted-foreground">Gerando exemplo prático...</p>
                  </div>
                ) : aiContent?.exemplo ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none font-body leading-relaxed [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 pb-10">
                    <ReactMarkdown>{aiContent.exemplo}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                    <p className="text-muted-foreground text-sm">Não foi possível carregar o exemplo prático.</p>
                    <button
                      onClick={fetchAiData}
                      disabled={aiLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary-light text-xs font-semibold transition-colors border border-primary/20"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                      Tentar novamente
                    </button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="termos" className="mt-0 outline-none h-full relative z-10">
                {aiLoading && !aiContent ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-primary">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="text-sm font-medium text-muted-foreground">Analisando termos jurídicos...</p>
                  </div>
                ) : aiContent?.termos ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none font-body leading-relaxed [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 pb-10">
                    <ReactMarkdown>{aiContent.termos}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                    <p className="text-muted-foreground text-sm">Não foi possível carregar os termos.</p>
                    <button
                      onClick={fetchAiData}
                      disabled={aiLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary-light text-xs font-semibold transition-colors border border-primary/20"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                      Tentar novamente
                    </button>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>

          {/* Rodapé de Ações com 5 colunas IDÊNTICO ao Código Penal */}
          <div className="shrink-0 relative z-[55] bg-card/95 backdrop-blur-md border-t border-border rounded-t-3xl shadow-lg shadow-black/20 pb-[var(--sai-bottom,env(safe-area-inset-bottom,0px))]">
            <div className="relative grid grid-cols-5 items-end px-1 pt-3 pb-3 max-w-lg mx-auto">
              {/* 1. Funções */}
              <button
                onClick={() => setShowFuncoesSheet(true)}
                className="flex flex-col items-center justify-end gap-1.5 py-1.5 text-foreground hover:text-primary transition-colors"
                aria-label="Funções"
              >
                <LayoutGrid className="w-7 h-7 sm:w-8 sm:h-8" />
                <span className="font-body text-[11px] sm:text-[12px] leading-tight">Funções</span>
              </button>

              {/* 2. Praticar */}
              <button
                onClick={() => setShowQuiz(true)}
                className="flex flex-col items-center justify-end gap-1.5 py-1.5 text-foreground hover:text-primary transition-colors"
                aria-label="Praticar"
              >
                <Target className="w-7 h-7 sm:w-8 sm:h-8" />
                <span className="font-body text-[11px] sm:text-[12px] leading-tight">Praticar</span>
              </button>

              {/* 3. FAB Central: Narrar / Ouvir / Pausar */}
              <button
                onClick={handleNarrar}
                disabled={narracaoLoading}
                className="relative z-[80] flex flex-col items-center justify-end gap-1.5 py-1.5 touch-manipulation select-none"
                aria-label="Narrar"
              >
                <div className="absolute bottom-[28px] pointer-events-none">
                  <span className={`relative w-[4.5rem] h-[4.5rem] sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-lg ring-4 ring-card transition-all duration-300 pointer-events-auto ${narracaoPlaying ? 'bg-primary shadow-primary/40 scale-105' : 'bg-primary shadow-primary/30 hover:bg-primary/90'}`}>
                    {narracaoPlaying && (
                      <>
                        <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: '1.5s' }} />
                        <span className="absolute -inset-1 rounded-full bg-primary/15 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
                      </>
                    )}
                    {narracaoLoading ? (
                      <Loader2 className="w-8 h-8 sm:w-9 sm:h-9 text-primary-foreground animate-spin relative z-20" />
                    ) : narracaoPlaying ? (
                      <Pause className="w-8 h-8 sm:w-9 sm:h-9 text-primary-foreground relative z-20" />
                    ) : (
                      <Volume2 className="w-8 h-8 sm:w-9 sm:h-9 text-primary-foreground relative z-20" />
                    )}
                  </span>
                </div>
                <span className="font-body text-[11px] sm:text-[12px] font-semibold text-primary leading-tight">
                  {narracaoPlaying ? 'Pausar' : narracaoUrl ? 'Ouvir' : 'Narrar'}
                </span>
              </button>

              {/* 4. Vídeo-aulas */}
              <button
                onClick={() => setShowVideoaulasListSheet(true)}
                className="flex flex-col items-center justify-end gap-1.5 py-1.5 text-foreground hover:text-primary transition-colors"
                aria-label="Vídeo-aulas"
              >
                <Play className="w-7 h-7 sm:w-8 sm:h-8" />
                <span className="font-body text-[11px] sm:text-[12px] leading-tight">Vídeos</span>
              </button>

              {/* 5. Copiar Enunciado */}
              <button
                onClick={copyEnunciado}
                className="flex flex-col items-center justify-end gap-1.5 py-1.5 text-foreground hover:text-primary transition-colors"
                aria-label="Copiar"
              >
                {copied ? (
                  <Check className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400" />
                ) : (
                  <Copy className="w-7 h-7 sm:w-8 sm:h-8" />
                )}
                <span className="font-body text-[11px] sm:text-[12px] leading-tight">
                  {copied ? 'Copiado' : 'Copiar'}
                </span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Funções Sheet */}
        <AnimatePresence>
          {showFuncoesSheet && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-[10040]"
                onClick={() => setShowFuncoesSheet(false)}
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-[10041] bg-card rounded-t-3xl border-t border-border pb-[var(--sai-bottom,env(safe-area-inset-bottom,0px))] max-h-[85vh] overflow-y-auto mx-auto max-w-lg flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="pt-3 pb-2 flex justify-center">
                  <span className="w-10 h-1 rounded-full bg-border" />
                </div>
                <div className="flex items-center justify-between px-5 pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5 text-primary" />
                    <h3 className="font-heading text-base font-semibold text-foreground">Funções da Súmula</h3>
                  </div>
                  <button
                    onClick={() => setShowFuncoesSheet(false)}
                    className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center text-foreground/70"
                    aria-label="Fechar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="py-2">
                  {[
                    {
                      icon: Target,
                      label: 'Praticar Quiz',
                      desc: 'Desafios e questões geradas por IA sobre a súmula',
                      color: '#DC2626',
                      onClick: () => {
                        setShowFuncoesSheet(false);
                        setShowQuiz(true);
                      }
                    },
                    {
                      icon: Play,
                      label: 'Vídeo-aulas no YouTube',
                      desc: 'Aulas e comentários em vídeo dos principais professores',
                      color: '#DC2626',
                      onClick: () => {
                        setShowFuncoesSheet(false);
                        setShowVideoaulasListSheet(true);
                      }
                    },
                    {
                      icon: Copy,
                      label: 'Copiar Enunciado',
                      desc: 'Copiar texto integral formatado com número',
                      color: '#DC2626',
                      onClick: () => {
                        setShowFuncoesSheet(false);
                        copyEnunciado();
                      }
                    }
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={i}
                        onClick={item.onClick}
                        className="w-full flex items-center gap-4 px-5 py-4 transition-colors text-left hover:bg-secondary/60 border-b border-border/40 last:border-0"
                      >
                        <span className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0" style={{ color: item.color }}>
                          <Icon className="w-5 h-5" />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[14.5px] font-medium text-foreground">{item.label}</span>
                          <span className="block text-[12px] text-foreground/60 mt-0.5">{item.desc}</span>
                        </span>
                        <ChevronRight className="w-5 h-5 text-foreground/40 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Sub-sheets carregadas sob demanda */}
        <Suspense fallback={null}>
          {showVideoaulasListSheet && (
            <VideoaulasListSheet
              open={showVideoaulasListSheet}
              onClose={() => setShowVideoaulasListSheet(false)}
              tabelaNome={isVinculante ? 'sumulas_vinculantes' : 'sumulas'}
              artigoNumero={sumula.numero}
              leiNome={isVinculante ? 'Súmula Vinculante' : 'Súmula'}
              onSelectVideo={(v) => {
                setVideoaula(v);
                setShowVideoaulasListSheet(false);
                setShowVideoaulaSheet(true);
              }}
            />
          )}

          {showVideoaulaSheet && (
            <VideoaulaSheet
              open={showVideoaulaSheet}
              onClose={() => setShowVideoaulaSheet(false)}
              video={videoaula}
              tabelaNome={isVinculante ? 'sumulas_vinculantes' : 'sumulas'}
              artigoNumero={sumula.numero}
              artigoTexto={sumula.enunciado}
            />
          )}

          {showQuiz && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute inset-0 z-50 bg-[#0d0f12] overflow-hidden rounded-t-3xl"
            >
              <QuizView
                tabelaNome={isVinculante ? 'sumulas_vinculantes' : 'sumulas'}
                artigoNumero={sumula.numero}
                leiNome={isVinculante ? 'Súmula Vinculante' : 'Súmula'}
                onBack={() => setShowQuiz(false)}
                isSumula={true}
                conteudoTexto={sumula.enunciado}
              />
            </motion.div>
          )}
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

export default SumulaVinculanteSheet;