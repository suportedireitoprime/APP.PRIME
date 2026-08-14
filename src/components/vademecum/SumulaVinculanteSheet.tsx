import { motion, AnimatePresence } from 'framer-motion';
import { X, BadgeCheck, Ban, ExternalLink, Copy, Check, Heart, Volume2, Target, Play } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { toast } from 'sonner';
import type { Sumula } from '@/services/sumulasService';
import { copiarTexto } from '@/lib/nativo/copiar';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import { Loader2 } from 'lucide-react';

const VideoaulasListSheet = lazy(() => import('./VideoaulasListSheet'));
const VideoaulaSheet = lazy(() => import('./VideoaulaSheet'));
const QuizView = lazy(() => import('@/components/estudar/QuizView'));


interface Props {
  sumula: Sumula;
  tribunal?: string;
  isFavorita?: boolean;
  onToggleFavorita?: () => void;
  onClose: () => void;
}

// Renders inline text with markdown-style links [label](url), **bold**, *italic*, _italic_.
// Also cleans up whitespace inside a broken pattern like "[label]\n(url)" and stray marker artifacts.
function renderInline(text: string): (string | JSX.Element)[] {
  // Normalize "[label] (url)" or "[label]\n(url)" -> "[label](url)"
  let normalized = text.replace(/\]\s+\(/g, '](');
  // Collapse "** **" (bold around whitespace) and orphan bold markers glued to punctuation
  normalized = normalized.replace(/\*\*\s+\*\*/g, ' ');

  // Token regex: link | bold | italic(*) | italic(_)
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
    } else if (match[4] !== undefined) {
      parts.push(<em key={key++}>{renderInline(match[4])}</em>);
    } else if (match[5] !== undefined) {
      parts.push(<em key={key++}>{renderInline(match[5])}</em>);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < normalized.length) {
    parts.push(normalized.slice(lastIndex));
  }
  // Final safety: strip any remaining stray "**" from plain string parts
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
            className="text-[14px] leading-relaxed text-foreground/85 whitespace-pre-wrap"
          >
            {renderInline(it)}
          </p>
        ))}
      </div>
    </section>
  );
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
  
  // Estados de Vídeo-Aulas
  const [showVideoaulasListSheet, setShowVideoaulasListSheet] = useState(false);
  const [showVideoaulaSheet, setShowVideoaulaSheet] = useState(false);
  const [videoaula, setVideoaula] = useState<any>(null);
  
  // Praticar (Quiz)
  const [showQuiz, setShowQuiz] = useState(false);

  const extras = sumula.extras ?? {};

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

  const handleNarrar = async () => {
    if (narracaoPlaying) {
      if (narracaoAudioRef.current) {
        narracaoAudioRef.current.pause();
      }
      setNarracaoPlaying(false);
      return;
    }

    if (narracaoUrl) {
      playAudio(narracaoUrl);
      return;
    }

    setNarracaoLoading(true);
    try {
      const payload = {
        tabela_nome: tribunal === 'STF_VINCULANTE' ? 'sumulas_vinculantes' : 'sumulas',
        artigo_numero: sumula.numero,
        artigo_texto: sumula.enunciado,
        lei_nome: tribunal === 'STF_VINCULANTE' ? 'Súmula Vinculante' : 'Súmula',
        is_sumula: true
      };

      const { data: json, error } = await supabase.functions.invoke('narrar-artigo', {
        body: payload
      });

      if (error) throw error;
      if (json?.error) throw new Error(json.error);

      if (json?.audio_url) {
        setNarracaoUrl(json.audio_url);
        playAudio(json.audio_url);
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

  const playAudio = (url: string) => {
    if (!narracaoAudioRef.current) {
      const audio = new Audio(url);
      audio.onended = () => setNarracaoPlaying(false);
      audio.onerror = () => { setNarracaoPlaying(false); toast.error('Falha ao reproduzir áudio.'); };
      narracaoAudioRef.current = audio;
    } else {
      narracaoAudioRef.current.src = url;
    }
    narracaoAudioRef.current.play().then(() => setNarracaoPlaying(true)).catch(() => {
      setNarracaoPlaying(false);
      toast.error('Sem permissão para autoplay.');
    });
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  async function copyEnunciado() {
    try {
      await copiarTexto(`${tribunal === 'STF_VINCULANTE' ? 'Súmula Vinculante' : 'Súmula'} ${sumula.numero}\n\n${sumula.enunciado}`);
      setCopied(true);
      toast.success('Enunciado copiado');
      setTimeout(() => setCopied(false), 1500);
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
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="absolute inset-x-0 bottom-0 top-4 bg-background rounded-t-3xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="shrink-0 border-b border-border/60 px-4 pt-3 pb-4">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted-foreground/30" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display text-xl font-bold text-primary-light">
                    {tribunal === 'STF_VINCULANTE' ? 'Súmula Vinculante' : 'Súmula'} {sumula.numero}
                  </h2>
                  {sumula.situacao === 'cancelada' ? (
                    <span className="text-[11px] bg-destructive/15 text-destructive px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <Ban className="w-3 h-3" /> Cancelada
                    </span>
                  ) : (
                    <span className="text-[11px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" /> Vigente
                    </span>
                  )}
                </div>
                {sumula.data_publicacao && (
                  <p className="text-[12px] text-muted-foreground mt-1">{sumula.data_publicacao}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={onToggleFavorita}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isFavorita ? 'bg-rose-500/15' : 'bg-secondary hover:bg-secondary/70'}`}
                  aria-label={isFavorita ? 'Remover favorito' : 'Adicionar aos favoritos'}
                >
                  <Heart className={`w-4 h-4 ${isFavorita ? 'fill-rose-500 text-rose-500' : 'text-muted-foreground'}`} />
                </button>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-secondary hover:bg-secondary/70 flex items-center justify-center"
                  aria-label="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Body and Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v !== 'sumula') fetchAiData(); }} className="flex-1 overflow-hidden flex flex-col min-h-0 relative">
            <div className="shrink-0 mt-4 mb-2">
              <TabsList className="mx-5 bg-secondary/60 rounded-2xl h-11 grid grid-cols-4 w-auto p-1">
                <TabsTrigger value="sumula" className="rounded-xl text-[11px] sm:text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-1 sm:px-4 py-2">Súmula</TabsTrigger>
                <TabsTrigger value="explicacao" className="rounded-xl text-[11px] sm:text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-1 sm:px-4 py-2">Explicação</TabsTrigger>
                <TabsTrigger value="exemplo" className="rounded-xl text-[11px] sm:text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-1 sm:px-4 py-2">Exemplo</TabsTrigger>
                <TabsTrigger value="termos" className="rounded-xl text-[11px] sm:text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-1 sm:px-4 py-2">Termos</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-[calc(7rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] pt-2 relative">
              <TabsContent value="sumula" className="mt-0 outline-none space-y-6">
                <div className="rounded-2xl bg-secondary/50 p-4 border border-border/40">
                  <p className="text-[15px] leading-relaxed text-foreground whitespace-pre-wrap">
                    {sumula.enunciado || 'Enunciado não disponível.'}
                  </p>
                </div>
                <Section title="Precedentes Representativos" items={extras.precedentes_representativos} />
                <Section title="Teses de Repercussão Geral" items={extras.teses_repercussao_geral} />
                <Section title="Jurisprudência Selecionada" items={extras.jurisprudencia_selecionada} />
                <Section title="Observação" items={extras.observacao} />
              </TabsContent>

              <TabsContent value="explicacao" className="mt-0 outline-none h-full">
                {aiLoading && !aiContent ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-primary">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <p className="text-sm font-medium">Gerando explicação...</p>
                  </div>
                ) : aiContent?.explicacao ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none font-body leading-relaxed [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 pb-10">
                    <ReactMarkdown>{aiContent.explicacao}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full"><p className="text-muted-foreground text-sm">Falha ao gerar explicação.</p></div>
                )}
              </TabsContent>
              <TabsContent value="exemplo" className="mt-0 outline-none h-full">
                {aiLoading && !aiContent ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-primary">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <p className="text-sm font-medium">Gerando exemplo prático...</p>
                  </div>
                ) : aiContent?.exemplo ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none font-body leading-relaxed [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 pb-10">
                    <ReactMarkdown>{aiContent.exemplo}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full"><p className="text-muted-foreground text-sm">Falha ao gerar exemplo.</p></div>
                )}
              </TabsContent>
              <TabsContent value="termos" className="mt-0 outline-none h-full">
                {aiLoading && !aiContent ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-primary">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <p className="text-sm font-medium">Desvendando termos...</p>
                  </div>
                ) : aiContent?.termos ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none font-body leading-relaxed [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 pb-10">
                    <ReactMarkdown>{aiContent.termos}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full"><p className="text-muted-foreground text-sm">Falha ao gerar dicionário.</p></div>
                )}
              </TabsContent>
            </div>
          </Tabs>

          {/* Floating actions menu (Rodapé) idêntico ao Vade Mecum (Ilha) */}
          <div className="fixed bottom-[var(--sai-bottom,env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 mb-4 z-[10002] transition-all duration-300 pointer-events-auto">
            <div className="bg-[#18181b]/80 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl p-1.5 flex items-center gap-1">
              <button
                onClick={() => toast.info('Menu de Funções extra em desenvolvimento.')}
                className="w-[46px] h-[46px] rounded-full flex items-center justify-center transition-colors hover:bg-white/10 text-white/90"
                aria-label="Funções"
              >
                <div className="flex flex-col items-center gap-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
                </div>
              </button>
              <button
                onClick={handleNarrar}
                disabled={narracaoLoading}
                className={`w-[46px] h-[46px] rounded-full flex items-center justify-center transition-colors hover:bg-white/10 ${narracaoPlaying ? 'bg-emerald-500/20 text-emerald-400' : 'text-emerald-400'}`}
                aria-label="Narrar"
              >
                {narracaoLoading ? (
                  <Loader2 className="w-[20px] h-[20px] animate-spin" />
                ) : (
                  <Volume2 className="w-[20px] h-[20px]" strokeWidth={2.5} />
                )}
              </button>
              <button
                onClick={() => setShowVideoaulasListSheet(true)}
                className="w-[46px] h-[46px] rounded-full flex items-center justify-center transition-colors hover:bg-white/10 text-rose-500"
                aria-label="Vídeo-Aulas"
              >
                <Play className="w-[20px] h-[20px] fill-current" strokeWidth={2.5} />
              </button>
              <button
                onClick={() => setShowQuiz(true)}
                className="w-[46px] h-[46px] rounded-full flex items-center justify-center transition-colors hover:bg-white/10 text-purple-400"
                aria-label="Praticar"
              >
                <Target className="w-[20px] h-[20px]" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </motion.div>

        <Suspense fallback={null}>
          {showVideoaulasListSheet && (
            <VideoaulasListSheet
              open={showVideoaulasListSheet}
              onClose={() => setShowVideoaulasListSheet(false)}
              tabelaNome={tribunal === 'STF_VINCULANTE' ? 'sumulas_vinculantes' : 'sumulas'}
              artigoNumero={sumula.numero}
              leiNome={tribunal === 'STF_VINCULANTE' ? 'Súmula Vinculante' : 'Súmula'}
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
              tabelaNome={tribunal === 'STF_VINCULANTE' ? 'sumulas_vinculantes' : 'sumulas'}
              artigoNumero={sumula.numero}
              artigoTexto={sumula.enunciado}
            />
          )}

          {showQuiz && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute inset-0 z-50 bg-[#0d0f12] overflow-hidden rounded-t-[1.5rem]"
            >
              <QuizView
                tabelaNome={tribunal === 'STF_VINCULANTE' ? 'sumulas_vinculantes' : 'sumulas'}
                artigoNumero={sumula.numero}
                leiNome={tribunal === 'STF_VINCULANTE' ? 'Súmula Vinculante' : 'Súmula'}
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