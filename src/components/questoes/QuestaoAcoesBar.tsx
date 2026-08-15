import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Layers, Scale, AlertTriangle, Workflow, NotebookPen, Clock,
  X, Loader2, Sparkles, ChevronRight, MessageSquare, BookOpenText, BookA, Check,
  Type, Plus, Minus, Shuffle, RotateCw, Lightbulb, ChevronLeft,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import flipSoundAsset from '@/assets/flipcard.mp3.asset.json';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useQuestaoAcao, type AcaoTipo, type QuestaoInline } from '@/hooks/useQuestaoAcao';
import { useGatedFeature } from '@/hooks/useGatedFeature';
import { srcOf } from '@/lib/assetUrl';

type Fonte = string | QuestaoInline;
type Aba = AcaoTipo | 'revisar' | null;

const INTERVALOS = [
  { dias: 1, label: 'Amanhã' },
  { dias: 3, label: 'Em 3 dias' },
  { dias: 7, label: 'Em 7 dias' },
  { dias: 15, label: 'Em 15 dias' },
];

const TITULOS: Record<AcaoTipo, string> = {
  aula: 'Mini-aula',
  flashcards: 'Flashcards',
  lei: 'Lei seca',
  'lei-erradas': 'Outras alternativas',
  pegadinhas: 'Pegadinhas',
  mapa: 'Mapa mental',
  cornell: 'Resumo Cornell',
  comentario: 'Comentário',
  termos: 'Termos da questão',
};

export function agendarRevisao(chave: string, dias: number) {
  if (typeof window === 'undefined') return;
  const KEY = 'questoes:revisar';
  let lista: Array<{ chave: string; dueAt: string; intervalo: number }> = [];
  try { lista = JSON.parse(localStorage.getItem(KEY) ?? '[]') ?? []; } catch { /* noop */ }
  lista = lista.filter((x) => x.chave !== chave);
  const due = new Date();
  due.setDate(due.getDate() + dias);
  lista.push({ chave, dueAt: due.toISOString(), intervalo: dias });
  localStorage.setItem(KEY, JSON.stringify(lista));
  toast.success(`Revisão agendada para ${due.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`);
}

type SeletorTipo = 'resumos' | 'flash' | null;
type SeletorOpcao = { key: string; tipo: AcaoTipo; label: string; desc: string; icon: any };

const OPCOES_RESUMOS: SeletorOpcao[] = [
  { key: 'cornell', tipo: 'cornell', label: 'Cornell', desc: 'Notas + perguntas-chave + síntese', icon: NotebookPen },
  { key: 'mapa', tipo: 'mapa', label: 'Mapa mental', desc: 'Hierarquia visual dos conceitos', icon: Workflow },
];

/** Trilho de recursos da questão (mini-aula, flashcards, resumos, termos, pegadinhas, lei seca, revisar). */
export function QuestaoAcoesBar({ source, chaveRevisao }: { source: Fonte; chaveRevisao: string }) {
  const [aba, setAba] = useState<Aba>(null);
  const [seletor, setSeletor] = useState<SeletorTipo>(null);
  const gate = useGatedFeature('questao_funcoes', 'questao_funcoes');

  useEffect(() => { setAba(null); setSeletor(null); }, [chaveRevisao]);

  const RailBtn = ({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) => (
    <button
      type="button"
      onClick={() => { if (gate.blocked) { gate.openGate(); return; } onClick(); }}
      className="flex shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground min-w-[76px]"
    >
      <Icon className="h-8 w-8" strokeWidth={1.2} />
      <span className="whitespace-nowrap text-[12px] font-medium leading-tight">{label}</span>
    </button>
  );


  return (
    <>
      {gate.gateNode}

      <div className="scrollbar-none -mx-1 flex w-full snap-x snap-mandatory items-stretch gap-1 overflow-x-auto px-1">
        <RailBtn icon={BookOpen} label="Aula" onClick={() => setAba('aula')} />
        <RailBtn icon={Layers} label="Flashcards" onClick={() => setAba('flashcards')} />
        <RailBtn icon={BookOpenText} label="Resumos" onClick={() => setSeletor('resumos')} />
        <RailBtn icon={BookA} label="Termos" onClick={() => setAba('termos')} />
        <RailBtn icon={AlertTriangle} label="Pegadinhas" onClick={() => setAba('pegadinhas')} />
        <RailBtn icon={Scale} label="Lei seca" onClick={() => setAba('lei')} />
        <RailBtn icon={Clock} label="Revisar" onClick={() => setAba('revisar')} />
      </div>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {aba === 'revisar' && (
            <Overlay key="revisar" onClose={() => setAba(null)} titulo="Revisar depois" icone={Clock}>
              <p className="mb-4 text-sm text-muted-foreground">Quando você quer revisar esta questão?</p>
              <div className="grid grid-cols-2 gap-2">
                {INTERVALOS.map((i) => (
                  <button
                    key={i.dias}
                    onClick={() => { agendarRevisao(chaveRevisao, i.dias); setAba(null); }}
                    className="h-12 rounded-xl border border-border bg-background text-sm font-medium transition-colors hover:border-primary/60 hover:bg-primary/5"
                  >
                    {i.label}
                  </button>
                ))}
              </div>
            </Overlay>
          )}

          {seletor && (
            <Overlay key="seletor" onClose={() => setSeletor(null)} titulo="Tipo de resumo" icone={Sparkles}>
              <div className="flex flex-col gap-2">
                {OPCOES_RESUMOS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => { setSeletor(null); setAba(opt.tipo); }}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3.5 text-left transition-colors hover:border-primary/50 hover:bg-muted/40"
                    >
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-tight">{opt.label}</p>
                        <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{opt.desc}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            </Overlay>
          )}

          {aba && aba !== 'revisar' && (
            <Overlay key="painel" onClose={() => setAba(null)} titulo={TITULOS[aba]} icone={Sparkles} alto={aba === 'flashcards'}>
              <PainelAcao source={source} tipo={aba} />
            </Overlay>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

function Overlay({
  titulo, icone: Icone, children, onClose, alto,
}: { titulo: string; icone: any; children: React.ReactNode; onClose: () => void; alto?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, pointerEvents: 'none' }}
      transition={{ duration: 0.2 }}
      className="theme-questoes fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0, pointerEvents: 'none' }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative flex w-full flex-col rounded-t-3xl border border-border bg-card shadow-2xl pb-[calc(1.25rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] sm:max-w-lg sm:rounded-3xl sm:pb-0',
          alto ? 'h-[90vh]' : 'max-h-[92vh] overflow-y-auto',
        )}
      >
        <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
            <Icone className="h-3 w-3" /> {titulo}
          </p>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="grid h-11 w-11 place-items-center rounded-full border border-border/70 bg-muted/70 text-foreground transition-colors hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className={cn('p-4 md:p-5', alto && 'flex min-h-0 flex-1 flex-col overflow-y-auto')}>{children}</div>
      </motion.div>
    </motion.div>
  );
}


function Md({ texto, className }: { texto?: string; className?: string }) {
  if (!texto) return null;
  return (
    <div
      className={cn(
        'prose prose-sm max-w-none text-[15px] leading-[1.7] text-foreground/90',
        'prose-headings:text-foreground prose-headings:font-bold prose-headings:text-[15px]',
        'prose-strong:font-bold prose-strong:text-foreground',
        'prose-p:my-2 prose-li:my-0.5 prose-ul:my-2 prose-ol:my-2',
        'prose-a:text-primary',
        'prose-blockquote:border-l-2 prose-blockquote:border-primary prose-blockquote:bg-primary/5',
        'prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:px-3 prose-blockquote:py-2',
        'prose-blockquote:text-foreground/90 prose-code:text-primary',
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{texto}</ReactMarkdown>
    </div>
  );
}

/** Loader em checklist: cada etapa é marcada em sequência enquanto a IA responde. */
function Checklist({ passos }: { passos: string[] }) {
  const [feito, setFeito] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setFeito((f) => (f < passos.length - 1 ? f + 1 : f)), 1100);
    return () => clearInterval(t);
  }, [passos.length]);

  return (
    <div className="space-y-2.5 py-6">
      {passos.map((p, i) => {
        const pronto = i < feito;
        const ativo = i === feito;
        return (
          <motion.div
            key={p}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: pronto || ativo ? 1 : 0.4, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className={cn(
              'flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors',
              pronto ? 'border-primary/30 bg-primary/5' : ativo ? 'border-border bg-muted/40' : 'border-border/50',
            )}
          >
            <span className={cn(
              'grid h-6 w-6 shrink-0 place-items-center rounded-full border',
              pronto ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground',
            )}>
              {pronto ? <Check className="h-3.5 w-3.5" />
                : ativo ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />}
            </span>
            <span className={cn('text-sm', pronto || ativo ? 'text-foreground' : 'text-muted-foreground')}>{p}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

function Carregando({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}


function Erro({ onRetry, msg }: { onRetry: () => void; msg?: any }) {
  const textoErro = typeof msg === 'object' ? JSON.stringify(msg) : String(msg || 'Erro desconhecido');
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center px-4">
      <p className="text-sm text-destructive">Não foi possível gerar o conteúdo.</p>
      <p className="text-xs text-muted-foreground break-all">{textoErro}</p>
      <button onClick={onRetry} className="text-xs text-primary underline">Tentar de novo</button>
    </div>
  );
}

function PainelAcao({ source, tipo }: { source: Fonte; tipo: AcaoTipo }) {
  const { data, isLoading, error, refetch } = useQuestaoAcao(source, tipo, true);
  if (isLoading) return <Carregando label={`Gerando ${TITULOS[tipo].toLowerCase()}…`} />;
  if (error || !data) return <Erro msg={error?.message} onRetry={() => refetch()} />;

  if (tipo === 'aula') {
    const slides = data.slides ?? [];
    return (
      <div className="space-y-3">
        {slides.map((s: any, i: number) => (
          <div key={i} className="rounded-xl border border-border bg-background p-4">
            <p className="mb-1.5 text-sm font-bold text-primary">{s.titulo}</p>
            <Md texto={s.conteudo} />
          </div>
        ))}
      </div>
    );
  }

  if (tipo === 'flashcards') return <Flashcards cards={data.cards ?? []} />;

  if (tipo === 'lei') {
    const itens = data.dispositivos ?? [];
    return (
      <div className="space-y-3">
        {itens.map((d: any, i: number) => (
          <div key={i} className="rounded-xl border border-border bg-background p-4">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">{d.referencia}</p>
            <p className="text-[15px] italic leading-relaxed text-foreground/85">{d.texto}</p>
            {d.comentario && <p className="mt-2 text-sm text-muted-foreground">{d.comentario}</p>}
          </div>
        ))}
      </div>
    );
  }

  if (tipo === 'pegadinhas') {
    const itens = data.pegadinhas ?? [];
    return (
      <div className="space-y-3">
        {itens.map((p: any, i: number) => (
          <div key={i} className="rounded-xl border border-border bg-background p-4">
            <p className="mb-1 inline-flex items-center gap-1.5 text-sm font-bold text-foreground">
              <AlertTriangle className="h-4 w-4 text-primary" /> {p.titulo}
            </p>
            <p className="text-sm leading-relaxed text-foreground/85">{p.texto}</p>
          </div>
        ))}
      </div>
    );
  }

  if (tipo === 'mapa') return <Md texto={data.markdown} />;

  if (tipo === 'cornell') {
    return (
      <div className="space-y-3">
        {(data.perguntas ?? []).length > 0 && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-primary">Perguntas-chave</p>
            <ul className="list-disc space-y-1 pl-4 text-sm text-foreground/90">
              {(data.perguntas ?? []).map((p: string, i: number) => <li key={i}>{p}</li>)}
            </ul>
          </div>
        )}
        <div className="rounded-xl border border-border bg-background p-4"><Md texto={data.notas} /></div>
        {data.sintese && (
          <div className="rounded-xl border-l-2 border-primary bg-muted/50 px-4 py-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-primary">Síntese</p>
            <p className="text-sm leading-relaxed text-foreground/90">{data.sintese}</p>
          </div>
        )}
      </div>
    );
  }

  const termos = data.termos ?? [];
  return (
    <div className="space-y-3">
      {termos.map((t: any, i: number) => (
        <div key={i} className="rounded-xl border border-border bg-background p-4">
          <p className="mb-1.5 text-base font-bold text-primary">{t.termo}</p>
          <p className="text-sm leading-relaxed text-foreground/90">{t.definicao}</p>
          {t.exemplo && (
            <div className="mt-2.5 rounded-lg border-l-2 border-primary bg-muted/50 px-3 py-2">
              <p className="text-sm italic leading-relaxed text-foreground/80">{t.exemplo}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const embaralharArr = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** Realça *ênfase* / **negrito** sem exibir os asteriscos crus. */
const renderEnfase = (texto: string) =>
  String(texto ?? '').split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((parte, i) => {
    const m = parte.match(/^\*\*?([^*]+)\*\*?$/);
    if (m) return <strong key={i} className="font-bold">{m[1]}</strong>;
    return <span key={i}>{parte}</span>;
  });

type CardIA = { frente: string; verso: string; explicacao?: string; exemplo?: string; dica?: string };

/** Flashcards no mesmo padrão do Aprender: flip 3D, som e navegação. */
function Flashcards({ cards }: { cards: CardIA[] }) {
  const [ordem, setOrdem] = useState<CardIA[]>([]);
  const [i, setI] = useState(0);
  const [virado, setVirado] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || audioRef.current) return;
    audioRef.current = new Audio(srcOf(flipSoundAsset));
    audioRef.current.volume = 0.5;
  }, []);

  useEffect(() => { setOrdem(embaralharArr(cards)); setI(0); setVirado(false); }, [cards]);

  const total = ordem.length;
  const card = ordem[i];

  const flip = () => {
    setVirado((v) => !v);
    try { const a = audioRef.current; if (a) { a.currentTime = 0; void a.play(); } } catch { /* noop */ }
  };
  const ir = (d: number) => { setVirado(false); setI((v) => Math.max(0, Math.min(total - 1, v + d))); };

  if (!total || !card) return <p className="py-6 text-center text-sm text-muted-foreground">Nenhum flashcard gerado.</p>;

  const versoTexto = card.explicacao || card.verso || '';

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="text-[12px] font-semibold tabular-nums text-muted-foreground">{i + 1} / {total}</span>
        <button
          onClick={() => { setOrdem(embaralharArr(ordem)); setI(0); setVirado(false); }}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-[13px] font-semibold text-foreground transition-colors hover:bg-accent/50"
        >
          <Shuffle className="h-3.5 w-3.5" /> Embaralhar
        </button>
      </div>

      <div className="w-full min-h-0 flex-1" style={{ perspective: '1200px' }}>
        <motion.div
          className="relative h-full min-h-[360px] w-full cursor-pointer"
          animate={{ rotateY: virado ? 180 : 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformStyle: 'preserve-3d' }}
          onClick={flip}
        >
          <div
            className="absolute inset-0 flex flex-col rounded-3xl border-2 border-primary/40 bg-gradient-to-br from-card via-card to-secondary p-6 shadow-2xl"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-primary">Frente</span>
              <Sparkles className="h-4 w-4 text-primary/60" />
            </div>
            <div className="flex flex-1 items-center justify-center overflow-y-auto text-center">
              <p className="text-[22px] font-semibold leading-relaxed text-foreground sm:text-[24px]">
                {renderEnfase(card.frente)}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 border-t border-border/40 pt-3 text-[13px] text-muted-foreground">
              <RotateCw className="h-4 w-4" /> Toque para virar
            </div>
          </div>

          <div
            className="absolute inset-0 flex flex-col rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-5 shadow-2xl"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-primary-foreground/80">Verso · Resposta</span>
              <Check className="h-4 w-4 text-primary-foreground/80" />
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto pr-1 text-left">
              <p className="text-[19px] font-medium leading-relaxed text-primary-foreground sm:text-[20px]">
                {renderEnfase(versoTexto)}
              </p>
              {card.exemplo && (
                <div className="rounded-xl border border-black/15 bg-black/10 p-4">
                  <p className="mb-2 flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-widest text-primary-foreground/90">
                    <Lightbulb className="h-4 w-4" /> Exemplo prático
                  </p>
                  <p className="text-[17px] font-medium leading-relaxed text-primary-foreground sm:text-[18px]">
                    {renderEnfase(card.exemplo)}
                  </p>
                </div>
              )}
              {card.dica && (
                <div className="rounded-xl border border-black/10 bg-black/5 p-4">
                  <p className="mb-2 text-[12px] font-extrabold uppercase tracking-widest text-primary-foreground/80">Dica</p>
                  <p className="text-[17px] font-medium leading-relaxed text-primary-foreground sm:text-[18px]">
                    {renderEnfase(card.dica)}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-2 flex items-center justify-center gap-2 border-t border-white/20 pt-3 text-[13px] text-primary-foreground/70">
              <RotateCw className="h-4 w-4" /> Toque para voltar
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mt-4 flex shrink-0 items-center justify-between gap-3">
        <button
          onClick={() => ir(-1)}
          disabled={i === 0}
          className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card text-[14px] font-semibold text-foreground transition-colors hover:bg-accent/50 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" /> Anterior
        </button>
        <button
          onClick={() => ir(1)}
          disabled={i >= total - 1}
          className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary text-[14px] font-bold text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-40"
        >
          Próximo <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

}

/** Sheet inferior do comentário, com abas "Resposta correta" e "Outras alternativas". */
export function ComentarioSheet({
  aberto, source, onClose,
}: { aberto: boolean; source: Fonte; onClose: () => void }) {
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

const FS_KEY = 'questoes:comentario-fs';
const FS_MIN = 15;
const FS_MAX = 24;

/** Botão flutuante "T" que expande em - / + para ajustar o tamanho do texto. */
function TamanhoTextoFab({ fs, setFs }: { fs: number; setFs: (n: number) => void }) {
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
        className="pointer-events-auto grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform active:scale-95"
      >
        {aberto ? <X className="h-5 w-5" /> : <Type className="h-5 w-5" />}
      </button>
    </div>
  );
}

export function ComentarioInner({ source }: { source: Fonte }) {
  const [view, setView] = useState<'correta' | 'erradas'>('correta');
  const [fs, setFsState] = useState(17);
  const { data, isLoading, error, refetch } = useQuestaoAcao(source, 'comentario', true);
  const erradasQ = useQuestaoAcao(source, 'lei-erradas', view === 'erradas');
  const erradas: any[] = erradasQ.data?.erradas ?? [];

  useEffect(() => {
    const salvo = Number(localStorage.getItem(FS_KEY));
    if (salvo >= FS_MIN && salvo <= FS_MAX) setFsState(salvo);
  }, []);

  const setFs = (n: number) => { setFsState(n); localStorage.setItem(FS_KEY, String(n)); };
  const mdClass = 'text-[1em] prose-headings:text-[1.02em]';

  return (
    <div className="space-y-3" style={{ fontSize: `${fs}px` }}>
      <TamanhoTextoFab fs={fs} setFs={setFs} />

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
            <Checklist passos={[
              'Lendo o enunciado e o gabarito',
              'Localizando a base legal aplicável',
              'Montando a explicação didática',
              'Formatando o comentário',
            ]} />
          )}
          {error && !isLoading && <Erro onRetry={() => refetch()} />}
          {!isLoading && !error && data && (
            <div className="space-y-3">
              <Md texto={data.texto} className={mdClass} />
              {data.fundamento && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
                  <p className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    <Scale className="h-3 w-3" /> Fundamento
                  </p>
                  <Md texto={data.fundamento} className={mdClass} />
                </div>
              )}
              {data.dica && (
                <div className="rounded-xl border-l-2 border-primary bg-muted/50 px-4 py-3">
                  <p className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    <Sparkles className="h-3 w-3" /> Dica de prova
                  </p>
                  <Md texto={data.dica} className={mdClass} />

                </div>
              )}
            </div>
          )}
        </>
      )}

      {view === 'erradas' && (
        <>
          {erradasQ.isLoading && (
            <Checklist passos={[
              'Separando as alternativas que não são o gabarito',
              'Confrontando cada uma com a lei e a jurisprudência',
              'Identificando o erro central de cada alternativa',
              'Escrevendo as explicações',
            ]} />
          )}
          {erradasQ.error && !erradasQ.isLoading && <Erro onRetry={() => erradasQ.refetch()} />}
          {!erradasQ.isLoading && !erradasQ.error && erradas.length === 0 && erradasQ.data && (
            <p className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
              Não foi possível identificar alternativas erradas para explicar.
            </p>
          )}

          {erradas.length > 0 && (
            <div className="space-y-2.5">
              {erradas.map((e, i) => (
                <motion.div
                  key={`${e.letra}-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                  className="overflow-hidden rounded-xl border border-destructive/25 bg-background/40"
                >
                  <div className="border-b border-destructive/20 bg-destructive/10 px-4 py-3">
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-full border border-destructive/40 bg-destructive/20 text-xs font-bold text-destructive">
                        {e.letra}
                      </span>
                      {e.dispositivo_chave && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                          {e.dispositivo_chave}
                        </span>
                      )}
                    </div>
                    {e.texto && <p className="text-[0.95em] italic leading-relaxed text-foreground/80">"{e.texto}"</p>}
                  </div>
                  <div className="bg-foreground/[0.03] px-4 py-3">
                    <p className="mb-1.5 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <AlertTriangle className="h-3 w-3" /> Por que está errada
                    </p>
                    <Md texto={e.motivo} className={cn(mdClass, 'leading-relaxed')} />

                  </div>

                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
