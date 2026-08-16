import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  RotateCw,
  Trophy,
  Sparkles,
  BookOpen,
  Layers,
  HelpCircle,
  Link2,
  FileText,
  Lightbulb,
  Flag,
  List,
  MessageCircle,
  Settings2,
  ChevronLeft,
  ChevronRight,
  Check
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Zap, Flame, Info, AlertTriangle, Quote, Scale } from 'lucide-react';
import { normalizarMarkdown } from '@/lib/markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { proximaRevisao, rotuloIntervalo, type NivelFlashcard } from '@/lib/spacedRepetition';
import { HorusContextualSheet } from '@/components/aprender/HorusContextualSheet';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AulaSettingsSheet } from '@/components/aprender/AulaSettingsSheet';
import { MapaConceitualBlock } from '@/components/aprender/blocos/MapaConceitualBlock';
import { OrdenacaoBlock } from '@/components/aprender/blocos/OrdenacaoBlock';
import { CenaAnimadaBlock } from '@/components/aprender/blocos/CenaAnimadaBlock';
import { ConexaoBlock } from '@/components/aprender/blocos/ConexaoBlock';
import { CheckpointBlock } from '@/components/aprender/blocos/CheckpointBlock';
import { RecapBlock } from '@/components/aprender/blocos/RecapBlock';
import { LeituraBlock } from '@/components/aprender/blocos/LeituraBlock';

import { AulaPreviaScreen, type PreviaAula } from '@/components/aprender/AulaPreviaScreen';
import flipSoundAsset from '@/assets/flipcard.mp3.asset.json';
import pageTurnSoundAsset from '@/assets/page-turn.mp3.asset.json';
import { useTrackArea } from "@/hooks/useTrackArea";
import { srcOf } from '@/lib/assetUrl';
import { useGoBack } from '@/hooks/useGoBack';

type TipoBloco =
  | 'texto' | 'leitura' | 'intro' | 'conceito' | 'exemplo' | 'conclusao'
  | 'pergunta' | 'flashcard' | 'conexao'
  | 'citacao' | 'artigo_lei' | 'tabela' | 'mapa_mental' | 'mapa_conceitual'
  | 'infografico' | 'linha_tempo' | 'destaque' | 'fluxograma'
  | 'ordenacao' | 'cena_animada' | 'checkpoint' | 'recapitulacao';


type Bloco = {
  id: string;
  ordem: number;
  tipo: TipoBloco;
  payload: any;
  resposta_correta: any;
};

type Aula = {
  id: string;
  titulo: string;
  objetivo: string | null;
  duracao_est_min: number;
  previa?: PreviaAula | null;
};

const TIPOS_TEXTO = new Set<TipoBloco>(['texto', 'leitura', 'intro', 'conceito', 'exemplo', 'conclusao']);
const isBlocoTexto = (tipo: TipoBloco) => TIPOS_TEXTO.has(tipo);

const iconePorTipo = (tipo: TipoBloco) => {
  switch (tipo) {
    case 'intro': return BookOpen;
    case 'conceito': return Lightbulb;
    case 'exemplo': return BookOpen;
    case 'conclusao': return Flag;
    case 'leitura':
    case 'texto': return BookOpen;
    case 'pergunta': return HelpCircle;
    case 'flashcard': return Layers;
    case 'conexao': return Link2;
    case 'citacao': return Quote;
    case 'artigo_lei': return Scale;
    case 'tabela': return Layers;
    case 'mapa_mental': return Link2;
    case 'mapa_conceitual': return Link2;
    case 'ordenacao': return List;
    case 'cena_animada': return Sparkles;
    case 'infografico': return Sparkles;
    case 'linha_tempo': return Flag;
    case 'destaque': return Lightbulb;
    case 'fluxograma': return Flag;
    case 'checkpoint': return CheckCircle2;
    case 'recapitulacao': return Trophy;
    default: return BookOpen;
  }
};

const rotuloPorTipo = (tipo: TipoBloco) => {
  switch (tipo) {
    case 'intro': return 'Introdução';
    case 'conceito': return 'Conceito';
    case 'exemplo': return 'Exemplo';
    case 'conclusao': return 'Conclusão';
    case 'leitura':
    case 'texto': return 'Leitura';
    case 'pergunta': return 'Pergunta';
    case 'flashcard': return 'Flashcard';
    case 'conexao': return 'Conexões';
    case 'citacao': return 'Citação';
    case 'artigo_lei': return 'Artigo de Lei';
    case 'tabela': return 'Tabela';
    case 'mapa_mental': return 'Mapa mental';
    case 'mapa_conceitual': return 'Mapa conceitual';
    case 'ordenacao': return 'Coloque em ordem';
    case 'cena_animada': return 'Cena animada';
    case 'infografico': return 'Infográfico';
    case 'linha_tempo': return 'Linha do tempo';
    case 'destaque': return 'Destaque';
    case 'fluxograma': return 'Fluxograma';
    case 'checkpoint': return 'Checkpoint';
    case 'recapitulacao': return 'Recapitulando';
    default: return 'Bloco';
  }
};

/** Nome amigável do ato (etapa) da aula, exibido no cabeçalho. */
const ROTULO_ATO: Record<string, string> = {
  fundamentos: 'Fundamentos',
  aprofundamento: 'Aprofundamento',
  fixacao: 'Fixação',
};
const atoDoBloco = (b: { payload?: any }) => {
  const a = String(b?.payload?.ato ?? '').toLowerCase();
  return ROTULO_ATO[a] ? a : '';
};

const interleaveBlocos = (blocos: Bloco[]) => {
  const normalBlocos = blocos.filter(b => b.tipo !== 'pergunta' && b.tipo !== 'flashcard');
  const questionBlocos = blocos.filter(b => b.tipo === 'pergunta' || b.tipo === 'flashcard');
  
  if (normalBlocos.length === 0 || questionBlocos.length === 0) return blocos;
  
  const interleaved: Bloco[] = [];
  const step = normalBlocos.length / questionBlocos.length;
  let qIdx = 0;
  
  for (let i = 0; i < normalBlocos.length; i++) {
    interleaved.push(normalBlocos[i]);
    const expectedQs = Math.floor((i + 1) / step);
    while (qIdx < expectedQs && qIdx < questionBlocos.length) {
      interleaved.push(questionBlocos[qIdx]);
      qIdx++;
    }
  }
  
  while (qIdx < questionBlocos.length) {
    interleaved.push(questionBlocos[qIdx]);
    qIdx++;
  }
  
  return interleaved;
};


const AprenderAula = () => {
  useTrackArea("aprender_aula_iniciada");
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { aulaId } = useParams<{ aulaId: string }>();
  const { user } = useAuth();
  const [aula, setAula] = useState<Aula | null>(null);
  const [blocos, setBlocos] = useState<Bloco[]>([]);
  const [loading, setLoading] = useState(true);
  const [proximaAula, setProximaAula] = useState<{ id: string; titulo: string } | null>(null);
  const [proximasAulas, setProximasAulas] = useState<{ id: string; titulo: string }[]>([]);
  
  // Estados de Interação
  const [currentIdx, setCurrentIdx] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, { correta: boolean; escolha?: string }>>({});
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [conexoes, setConexoes] = useState<Record<string, Record<number, number | null>>>({});
  
  const [finalizada, setFinalizada] = useState(false);
  const [mostrarPrevia, setMostrarPrevia] = useState(true);
  const [progressoSalvo, setProgressoSalvo] = useState(0);
  const [sumarioOpen, setSumarioOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mentorOpen, setMentorOpen] = useState(false);
  
  const startedAt = useRef<number>(Date.now());
  const feedEndRef = useRef<HTMLDivElement | null>(null);
  
  const flipAudioRef = useRef<HTMLAudioElement | null>(null);
  const swooshAudioRef = useRef<HTMLAudioElement | null>(null);
  if (typeof window !== 'undefined' && !flipAudioRef.current) {
    flipAudioRef.current = new Audio(srcOf(flipSoundAsset));
    flipAudioRef.current.volume = 0.5;
    flipAudioRef.current.preload = 'auto';
  }
  if (typeof window !== 'undefined' && !swooshAudioRef.current) {
    swooshAudioRef.current = new Audio(srcOf(pageTurnSoundAsset));
    swooshAudioRef.current.volume = 0.55;
    swooshAudioRef.current.preload = 'auto';
  }
  const playFlipSound = () => {
    const a = flipAudioRef.current;
    if (!a) return;
    try { a.currentTime = 0; void a.play(); } catch {}
  };
  const playSwooshSound = () => {
    const a = swooshAudioRef.current;
    if (!a) return;
    try { a.currentTime = 0; void a.play(); } catch {}
  };

  useEffect(() => {
    if (!aulaId) return;
    (async () => {
      const [{ data: a }, { data: bs }] = await Promise.all([
        supabase.from('aprender_aulas').select('id, titulo, objetivo, duracao_est_min, previa, modulo_id, ordem').eq('id', aulaId).maybeSingle(),
        supabase.from('aprender_blocos').select('id, ordem, tipo, payload, resposta_correta').eq('aula_id', aulaId).order('ordem'),
      ]);
      setAula(a as Aula | null);
      
      const loadedBlocos = (bs ?? []) as Bloco[];
      setBlocos(interleaveBlocos(loadedBlocos));
      
      startedAt.current = Date.now();
      setLoading(false);

      if (a?.modulo_id != null) {
        const { data: prox } = await supabase
          .from('aprender_aulas')
          .select('id, titulo, ordem')
          .eq('modulo_id', a.modulo_id)
          .gt('ordem', a.ordem ?? 0)
          .order('ordem')
          .limit(8);
        const lista = (prox ?? []).map((p: any) => ({ id: p.id, titulo: p.titulo }));
        setProximasAulas(lista);
        setProximaAula(lista[0] ?? null);
      } else {
        setProximaAula(null);
        setProximasAulas([]);
      }
    })();
  }, [aulaId]);

  useEffect(() => {
    if (!aulaId || !user) return;
    (async () => {
      const { data } = await supabase
        .from('aprender_progresso_aula')
        .select('blocos_concluidos')
        .eq('user_id', user.id)
        .eq('aula_id', aulaId)
        .maybeSingle();
      setProgressoSalvo(Number(data?.blocos_concluidos ?? 0));
    })();
  }, [aulaId, user]);

  const total = blocos.length;
  const perguntas = useMemo(() => blocos.filter((b) => b.tipo === 'pergunta'), [blocos]);

  // Lógica principal do Feed: determina até qual bloco o usuário pode ver
  const maxRevealedIdx = useMemo(() => {
    if (!blocos || blocos.length === 0) return 0;
    let last = 0;
    for (let i = 0; i < blocos.length; i++) {
      last = i;
      const b = blocos[i];
      const isInteractive = ['pergunta', 'flashcard', 'conexao', 'ordenacao'].includes(b.tipo);
      
      let completed = false;
      if (i < progressoSalvo) {
        completed = true;
      } else {
        if (b.tipo === 'pergunta' && respostas[b.id]) completed = true;
        if (b.tipo === 'flashcard' && flipped[b.id]) completed = true;
        if (b.tipo === 'conexao' && conexoes[b.id]) {
          const map = conexoes[b.id];
          const pares = b.payload?.pares || [];
          if (pares.length > 0 && pares.every((_: any, idx: number) => map[idx] === idx)) {
             completed = true;
          }
        }
      }

      if (isInteractive && !completed) {
        break; // Bloqueia a revelação dos próximos blocos até resolver este
      }
    }
    return last;
  }, [blocos, respostas, flipped, conexoes, progressoSalvo]);

  // Auto-scroll para o topo ao mudar de página
  useEffect(() => {
    if (!mostrarPrevia) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Scroll da timeline para centralizar o item ativo
      setTimeout(() => {
        const el = document.getElementById(`timeline-item-${currentIdx}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }, 100);
    }
  }, [currentIdx, mostrarPrevia]);


  const atual = blocos[currentIdx] || blocos[0];
  const idx = currentIdx; // alias para compatibilidade com o sumário e cabeçalho
  const isGamificacao = atual && ['pergunta', 'conexao', 'flashcard'].includes(atual.tipo);

  const acertos = useMemo(
    () => perguntas.filter((p) => respostas[p.id]?.correta).length,
    [perguntas, respostas],
  );

  const salvarProgresso = async (concluida = false) => {
    if (!user || !aulaId) return;
    const payload = {
      user_id: user.id,
      aula_id: aulaId,
      blocos_concluidos: concluida ? total : Math.min(maxRevealedIdx + 1, total),
      acertos,
      total_perguntas: perguntas.length,
      tempo_ms: Date.now() - startedAt.current,
      concluida_em: concluida ? new Date().toISOString() : null,
    };
    await supabase.from('aprender_progresso_aula').upsert(payload, { onConflict: 'user_id,aula_id' });
  };

  const salvarBloco = async (
    bloco: Bloco,
    resposta: any,
    acertou: boolean | null,
    proxima_revisao_em?: string | null,
  ) => {
    if (!user) return;
    const payload: any = {
      user_id: user.id,
      bloco_id: bloco.id,
      resposta,
      acertou,
      tentativas: 1,
    };
    if (typeof proxima_revisao_em !== 'undefined') payload.proxima_revisao_em = proxima_revisao_em;
    await supabase.from('aprender_progresso_bloco').upsert(payload, { onConflict: 'user_id,bloco_id' });
  };

  const avaliarFlashcard = async (bloco: Bloco, nivel: NivelFlashcard) => {
    const { data: anterior } = user
      ? await supabase
          .from('aprender_progresso_bloco')
          .select('proxima_revisao_em')
          .eq('user_id', user.id)
          .eq('bloco_id', bloco.id)
          .maybeSingle()
      : { data: null as any };
    const nova = proximaRevisao(nivel, anterior?.proxima_revisao_em);
    await salvarBloco(bloco, { nivel }, nivel === 'sabia', nova);
    toast.success(`Revisão marcada para ${rotuloIntervalo(nova)}`);
    playSwooshSound();
  };

  const responderPergunta = async (bloco: Bloco, escolha: string) => {
    if (respostas[bloco.id]) return;
    const correta = String(bloco.resposta_correta?.id_correto || '').toLowerCase() === escolha.toLowerCase();
    setRespostas((r) => ({ ...r, [bloco.id]: { correta, escolha } }));
    await salvarBloco(bloco, { escolha }, correta);
    if (correta) playSwooshSound();
  };

  const concluirAula = async () => {
    await salvarProgresso(true);
    setFinalizada(true);
    toast.success('Aula concluída com sucesso!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="h-8 w-48 rounded bg-muted animate-pulse" />
          <div className="h-64 rounded-2xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  if (!aula || total === 0) {
    return (
      <div className="min-h-screen bg-background p-6 text-center">
        <p className="text-muted-foreground">Aula não encontrada ou sem conteúdo.</p>
        <button onClick={() => navigate('/aprender')} className="mt-4 text-primary underline">
          Voltar
        </button>
      </div>
    );
  }

  if (mostrarPrevia && !finalizada) {
    const previaFallback: PreviaAula | null = aula.previa ?? (aula.objetivo
      ? { porque_importa: aula.objetivo }
      : null);
    const continuarDe = Math.min(Math.max(progressoSalvo, 0), total - 1);
    const pctProgresso = total > 0 ? Math.round((Math.min(progressoSalvo, total) / total) * 100) : 0;
    return (
      <AulaPreviaScreen
        titulo={aula.titulo}
        objetivo={aula.objetivo}
        duracaoMin={aula.duracao_est_min || 10}
        previa={previaFallback}
        progressoPct={pctProgresso}
        podeContinuar={continuarDe > 0 && pctProgresso < 100}
        onVoltar={() => goBack()}
        onComecar={() => { setCurrentIdx(0); setProgressoSalvo(0); setRespostas({}); setFlipped({}); setConexoes({}); startedAt.current = Date.now(); setMostrarPrevia(false); }}
        onContinuar={() => { setCurrentIdx(continuarDe); startedAt.current = Date.now(); setMostrarPrevia(false); }}
      />
    );
  }

  if (finalizada) {
    const pct = perguntas.length ? Math.round((acertos / perguntas.length) * 100) : 100;
    const xpGanho = (total * 15) + (acertos * 25) + 100;
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-2xl px-4 py-12 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 shadow-xl shadow-amber-500/25 ring-4 ring-amber-400/30"
          >
            <Trophy className="h-14 w-14 text-slate-950 drop-shadow-md" />
          </motion.div>
          
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm font-extrabold text-amber-500 mb-3 shadow-sm">
            <Zap className="h-4 w-4 fill-amber-500 text-amber-500 animate-bounce" />
            <span>+{xpGanho} XP GANHOS!</span>
          </div>

          <h1 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">Aula concluída!</h1>
          <p className="mt-2 text-base text-muted-foreground">{aula.titulo}</p>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Etapas</p>
              <p className="mt-1 font-display text-2xl font-extrabold text-foreground">{total}</p>
            </div>
            {perguntas.length > 0 && (
              <>
                <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Acertos</p>
                  <p className="mt-1 font-display text-2xl font-extrabold text-emerald-500">{acertos}/{perguntas.length}</p>
                </div>
                <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm col-span-2 sm:col-span-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Aproveitamento</p>
                  <p className="mt-1 font-display text-2xl font-extrabold text-amber-500">{pct}%</p>
                </div>
              </>
            )}
          </div>

          <div className="mt-8 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => { setCurrentIdx(0); setProgressoSalvo(0); setRespostas({}); setFlipped({}); setConexoes({}); setFinalizada(false); startedAt.current = Date.now(); }}
                className="flex h-14 items-center justify-center rounded-xl border border-border/80 bg-card px-5 text-sm font-bold text-foreground hover:bg-accent active:scale-95 transition-transform"
              >
                <RotateCw className="mr-2 inline h-4 w-4" /> Refazer Aula
              </button>
              <button
                onClick={() => {
                  if (!proximaAula) return;
                  navigate(`/aprender/aula/${proximaAula.id}`);
                }}
                disabled={!proximaAula}
                className="flex h-14 items-center justify-center rounded-xl bg-primary px-5 text-sm font-extrabold text-white shadow-lg hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40 active:scale-95 transition-transform"
              >
                Próxima aula <ArrowRight className="ml-2 inline h-4 w-4 text-white" strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-border/60" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">ou</span>
              <span className="h-px flex-1 bg-border/60" />
            </div>
            <button
              onClick={() => navigate('/aprender')}
              className="flex h-14 w-full items-center justify-center rounded-xl border border-border/80 bg-card px-5 text-sm font-bold text-foreground hover:bg-accent active:scale-95 transition-transform"
            >
              Voltar para trilhas de estudo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background theme-aprender lg:pl-[19rem]">
      {/* Sidebar desktop — sumário da aula + próximas aulas */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[19rem] flex-col border-r border-border bg-card/40 lg:flex">
        <div className="border-b border-border px-5 py-5">
          <button
            onClick={() => goBack()}
            className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Aprender
          </button>
          <p className="font-display text-base font-bold leading-snug text-foreground">{aula.titulo}</p>
          <p className="mt-1 text-xs text-muted-foreground">{idx + 1} de {total} etapas</p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${Math.round(((idx + 1) / total) * 100)}%` }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Nesta aula</p>
          <div className="space-y-1">
            {blocos.map((b, i) => {
              const Icon = iconePorTipo(b.tipo);
              const isAtual = i === idx;
              const titulo = b.payload?.titulo || b.payload?.enunciado || b.payload?.frente || rotuloPorTipo(b.tipo);
              return (
                <button
                  key={b.id}
                  onClick={() => {
                     if (i > maxRevealedIdx) return;
                     setCurrentIdx(i);
                     setSumarioOpen(false);
                  }}
                  className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                    i <= maxRevealedIdx ? 'hover:bg-accent/50' : 'opacity-50 cursor-not-allowed'

                  }`}
                >
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${i <= idx ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`line-clamp-2 text-[13px] leading-snug ${isAtual ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                    {i + 1}. {titulo}
                  </span>
                </button>
              );
            })}
          </div>

          {proximasAulas.length > 0 && (
            <>
              <p className="px-2 pb-2 pt-6 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Próximas aulas</p>
              <div className="space-y-1">
                {proximasAulas.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/aprender/aula/${p.id}`)}
                    className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-accent/50"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="line-clamp-2 text-[13px] leading-snug text-muted-foreground">{p.titulo}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </aside>

      <AnimatePresence>
        {!isGamificacao && (
          <motion.header
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="sticky top-0 z-10 border-b border-white/5 bg-background/95 backdrop-blur-md"
            style={{
              paddingTop: 'calc(var(--sai-top, env(safe-area-inset-top, 0px)) + 0.5rem)',
            }}
          >
            <div
              className="mx-auto flex flex-col md:flex-row md:items-center gap-3 py-3 md:py-4 lg:max-w-none lg:px-10 2xl:px-16"
              style={{
                paddingLeft: 'calc(1rem + var(--sai-left, env(safe-area-inset-left, 0px)))',
                paddingRight: 'calc(1rem + var(--sai-right, env(safe-area-inset-right, 0px)))',
              }}
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={() => goBack()}
                  aria-label="Voltar"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-transform text-white lg:hidden mt-0.5"
                >
                  <ArrowLeft className="h-[18px] w-[18px]" />
                </button>
                <div className="flex-1 flex flex-col justify-center pl-1">
                  <p className="font-sans text-[15px] font-medium text-white/90 lg:hidden leading-snug tracking-tight line-clamp-2">
                    {aula.titulo}
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline horizontal - Dark estético */}
            <div
              className="relative overflow-x-auto bg-card/40 py-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth border-y border-white/5"
            >
              <div
                className="mx-auto flex max-w-3xl items-center lg:max-w-none lg:px-10 2xl:px-16"
                style={{
                  paddingLeft: 'calc(0.75rem + var(--sai-left, env(safe-area-inset-left, 0px)))',
                  paddingRight: 'calc(0.75rem + var(--sai-right, env(safe-area-inset-right, 0px)))',
                }}
              >
                {blocos.map((b, i) => {
                  const Icon = iconePorTipo(b.tipo);
                  const isAtual = i === idx;
                  const isFeito = i < idx;
                  const ativo = isAtual || isFeito;
                  const respondida = b.tipo === 'pergunta' ? respostas[b.id] : undefined;
                  const ok = respondida?.correta;
                  const err = respondida && !respondida.correta;
                  const isLast = i === blocos.length - 1;
                  const ato = atoDoBloco(b);
                  const iniciaAto = !!ato && ato !== atoDoBloco(blocos[i - 1] ?? {});
                  return (
                    <div key={b.id} id={`timeline-item-${i}`} className="relative flex shrink-0 items-center">

                      <button
                        onClick={() => {
                          if (i > maxRevealedIdx) return;
                          setCurrentIdx(i);
                        }}
                        aria-label={`${rotuloPorTipo(b.tipo)} ${i + 1}`}
                        className="relative flex h-11 w-11 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95"
                      >
                        {isAtual && (
                          <motion.span
                            layoutId="timeline-halo"
                            className="absolute inset-0 rounded-full border border-white/30 bg-white/5"
                            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                          />
                        )}
                        <Icon
                          className={`relative h-[22px] w-[22px] md:h-5 md:w-5 transition-colors ${
                            isAtual
                              ? 'text-white'
                              : isFeito
                              ? 'text-neutral-400'
                              : 'text-neutral-700'
                          }`}
                          strokeWidth={1.5}
                        />
                        {ok && (
                          <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-background shadow-md">
                            <CheckCircle2 className="h-3 w-3 text-white" strokeWidth={2.5} />
                          </span>
                        )}
                        {err && (
                          <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary ring-2 ring-background shadow-md">
                            <XCircle className="h-3 w-3 text-white" strokeWidth={2.5} />
                          </span>
                        )}
                      </button>
                      {!isLast && (
                        <div className="relative mx-1 h-[3px] w-6 md:w-8 overflow-hidden rounded-full bg-muted/60">
                          <motion.div
                            className="absolute inset-y-0 left-0 rounded-full bg-primary"
                            initial={false}
                            animate={{ width: isFeito ? '100%' : '0%' }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Feed Contínuo Vertical */}
      <main className={`relative flex-1 overflow-y-auto overflow-x-hidden scroll-smooth transition-colors duration-500 ${isGamificacao ? 'bg-zinc-950' : 'bg-background'}`}>
        <div className={`mx-auto h-full w-full max-w-3xl px-5 md:px-8 pt-6 md:pt-8 pb-[calc(10rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] lg:mx-0 lg:max-w-[74ch] xl:max-w-[80ch] lg:px-12 2xl:px-16 lg:pt-12 lg:pb-32 flex flex-col ${isGamificacao ? 'justify-center items-center flex-1 h-[80vh]' : 'gap-12 lg:gap-16'}`}>
          <AnimatePresence mode="wait">
            {atual && (
              <motion.div
                key={atual.id}
                initial={isGamificacao ? { opacity: 0, x: '100vw' } : { opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={isGamificacao ? { opacity: 0, x: '-100vw' } : { opacity: 0, x: -20 }}
                transition={isGamificacao ? { type: 'spring', damping: 25, stiffness: 200 } : { duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="w-full relative"
              >
                <BlocoView
                  bloco={atual}
                  resposta={respostas[atual.id]}
                  onResponder={(escolha) => responderPergunta(atual, escolha)}
                  flipped={!!flipped[atual.id]}
                  onFlip={() => { playFlipSound(); setFlipped((f) => ({ ...f, [atual.id]: !f[atual.id] })); }}
                  onAvaliarFlash={(nivel) => avaliarFlashcard(atual, nivel)}
                  conexao={conexoes[atual.id]}
                  onConexao={async (map, done) => {
                    setConexoes((c) => ({ ...c, [atual.id]: map }));
                    if (done) {
                      const pares = atual.payload?.pares || [];
                      const acertou = pares.every((_: any, idx: number) => map[idx] === idx);
                      await salvarBloco(atual, { map }, acertou);
                      if (acertou) toast.success('Todas as ligações corretas!');
                    }
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Espaço extra pro footer fixo */}
          <div className="h-8" />
        </div>
      </main>

      {/* Navegação de Rodapé Estilo eBook */}
      {!(atual?.tipo === 'pergunta' && !respostas[atual.id]) && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/5 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 py-3 pb-[calc(0.75rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSumarioOpen(true)}
            className="flex items-center justify-center h-10 w-10 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Sumário"
          >
            <List className="h-5 w-5" />
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center justify-center h-10 w-10 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Configurações"
          >
            <Settings2 className="h-5 w-5" />
          </button>
          <button
            onClick={() => setMentorOpen(true)}
            className="flex items-center justify-center h-10 w-10 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Mentor IA"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
        </div>
        
        {/* Counter Centralizado */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none pb-[calc(var(--sai-bottom,env(safe-area-inset-bottom,0px))/2)]">
          <span className="text-[13px] font-semibold tabular-nums text-neutral-400 tracking-wide">
            {idx + 1} <span className="text-neutral-600 font-medium">/ {total}</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
           <button
             onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
             disabled={idx === 0}
             className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
             aria-label="Anterior"
           >
             <ChevronLeft className="h-5 w-5" />
           </button>
           
           {idx < total - 1 ? (
             <button
                onClick={() => setCurrentIdx((i) => Math.min(total - 1, i + 1))}
                disabled={idx >= maxRevealedIdx}
                className="flex h-10 items-center justify-center gap-2 rounded-full bg-white text-black px-5 font-bold hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
             >
                Próximo <ChevronRight className="h-[18px] w-[18px]" />
             </button>
           ) : (
             <button
                onClick={concluirAula}
                disabled={idx > maxRevealedIdx || maxRevealedIdx < total - 1}
                className="flex h-10 items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-5 font-bold hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
             >
                <CheckCircle2 className="h-[18px] w-[18px]" /> Concluir
             </button>
           )}
        </div>
        </div>
      )}

      {/* Sumário */}
      <Sheet open={sumarioOpen} onOpenChange={setSumarioOpen}>
        <SheetContent side="bottom" className="h-[75vh] rounded-t-2xl p-0">
          <SheetHeader className="border-b border-border p-4">
            <SheetTitle className="text-left">Sumário da aula</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto p-3">
            {blocos.map((b, i) => {
              const Icon = iconePorTipo(b.tipo);
              const isAtual = i === idx;
              const titulo =
                b.payload?.titulo ||
                b.payload?.enunciado ||
                b.payload?.frente ||
                rotuloPorTipo(b.tipo);
              return (
                <button
                  key={b.id}
                  onClick={() => {
                    setSumarioOpen(false);
                      if (i > maxRevealedIdx) return;
                      setCurrentIdx(i);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg p-3 text-left text-sm transition-colors ${
                    i <= maxRevealedIdx ? 'hover:bg-accent/60' : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ background: 'hsl(var(--primary))' }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {i + 1}. {rotuloPorTipo(b.tipo)}
                    </p>
                    <p className="truncate font-medium text-foreground">{titulo}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* Configurações da aula (Sumário + Narração) */}
      <AulaSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        blocoKey={atual.id}
        onAbrirSumario={() => setSumarioOpen(true)}
        textoBlocoAtual={(() => {
          const p = atual.payload || {};
          const flip = !!flipped[atual.id];
          switch (atual.tipo) {
            case 'intro':
            case 'conceito':
            case 'exemplo':
            case 'conclusao':
            case 'leitura':
            case 'texto':
              return `${p.titulo ? p.titulo + '.\n\n' : ''}${p.conteudo || p.texto || ''}`;
            case 'citacao':
              return `Citação. ${p.texto || ''}${p.fonte ? `. Fonte: ${p.fonte}.` : ''}`;
            case 'artigo_lei':
              return `${p.lei || 'Artigo de lei'}${p.numero ? `, artigo ${p.numero}` : ''}.\n\n${p.texto || ''}`;
            case 'destaque':
              return `${p.titulo || 'Destaque'}. ${p.texto || ''}`;
            case 'pergunta': {
              const opcs = (p.opcoes || [])
                .map((o: any) => `Alternativa ${String(o.id).toUpperCase()}: ${o.texto}.`)
                .join(' ');
              return `Pergunta. ${p.enunciado || ''}\n\n${opcs}`;
            }
            case 'flashcard':
              return flip
                ? `Resposta. ${p.verso || ''}. ${p.explicacao || ''}. Exemplo prático: ${p.exemplo || ''}. Aplicando: ${p.aplicando || ''}.`
                : `Pergunta do flashcard. ${p.frente || ''}`;
            case 'conexao': {
              const pares = (p.pares || [])
                .map((par: any) => `${par.termo}: ${par.definicao}.`)
                .join('\n');
              return `Associe cada termo à sua definição.\n\n${pares}`;
            }
            case 'tabela':
              return `${p.titulo || 'Tabela'}. Colunas: ${(p.colunas || []).join(', ')}.`;
            case 'mapa_mental':
              return `Mapa mental. ${p.raiz || ''}. ${p.definicao_raiz || ''}. ${(p.ramos || [])
                .map((r: any) => `${r.titulo}: ${(r.itens || [])
                  .map((it: any) => typeof it === 'string' ? it : `${it.termo}, ${it.definicao}`)
                  .join(', ')}.`)
                .join(' ')}`;
            case 'fluxograma':
              return `Fluxograma. ${p.titulo || ''}. ${(p.etapas || [])
                .map((et: any) => `Etapa ${et.n}: ${et.titulo}. ${et.descricao || ''}`)
                .join(' ')}`;
            case 'mapa_conceitual':
              return `Mapa conceitual. ${(p.nos || []).map((n: any) => `${n.rotulo}${n.definicao ? ': ' + n.definicao : ''}`).join('. ')}. Relações: ${(p.arestas || []).map((a: any) => `${a.de} ${a.relacao} ${a.para}`).join('; ')}.`;
            case 'ordenacao':
              return `${p.titulo || 'Coloque em ordem'}. ${p.instrucao || ''}. Itens: ${(p.itens || []).map((it: any) => it.texto).join('; ')}.`;
            case 'cena_animada':
              return `${p.titulo || 'Cena animada'}. ${(p.cenas || []).map((c: any) => `Cena ${c.n}: ${c.titulo}. ${c.narracao}`).join(' ')}. ${p.moral ? 'Regra: ' + p.moral : ''}`;
            case 'linha_tempo':
              return `${p.titulo || 'Linha do tempo'}. ${(p.eventos || [])
                .map((e: any) => `${e.marco}, ${e.titulo}. ${e.descricao || ''}`)
                .join(' ')}`;
            case 'infografico':
              return `${p.titulo || 'Infográfico'}. ${(p.itens || [])
                .map((it: any) => `${it.numero || ''} ${it.titulo}. ${it.descricao || ''}`)
                .join(' ')}`;
            default:
              return p.titulo || p.texto || rotuloPorTipo(atual.tipo);
          }
        })()}
      />



      {/* Mentor controlado */}
      <HorusContextualSheet
        hideFab
        open={mentorOpen}
        onOpenChange={setMentorOpen}
        contexto={{
          aula_titulo: aula.titulo,
          bloco_tipo: atual.tipo,
          bloco_texto: (() => {
            const p = atual.payload || {};
            if (isBlocoTexto(atual.tipo)) return `${p.titulo || ''}\n\n${p.conteudo || ''}`;
            if (atual.tipo === 'pergunta') return `${p.enunciado || ''}\n\nOpções: ${JSON.stringify(p.opcoes || [])}`;
            if (atual.tipo === 'flashcard') return `${p.frente || ''} → ${p.verso || ''}`;
            if (atual.tipo === 'conexao') return `Pares: ${JSON.stringify(p.pares || [])}`;
            return JSON.stringify(p);
          })(),
          termos: atual.payload?.termos || [],
        }}
      />
    </div>
  );
};

/* ---------- Blocos ---------- */

function BlocoView({
  bloco, resposta, onResponder, flipped, onFlip, onAvaliarFlash, conexao, onConexao,
}: {
  bloco: Bloco;
  resposta?: { correta: boolean; escolha?: string };
  onResponder: (escolha: string) => void;
  flipped: boolean;
  onFlip: () => void;
  onAvaliarFlash: (nivel: NivelFlashcard) => void;
  conexao?: Record<number, number | null>;
  onConexao: (map: Record<number, number | null>, done: boolean) => void;
}) {
  const [selectedOpcao, setSelectedOpcao] = useState<string | null>(null);
  const [showExplicacao, setShowExplicacao] = useState(false);

  useEffect(() => {
    setSelectedOpcao(null);
    setShowExplicacao(false);
  }, [bloco.id]);

  useEffect(() => {
    if (resposta) {
      const t = setTimeout(() => setShowExplicacao(true), 400);
      return () => clearTimeout(t);
    }
  }, [resposta]);

  if (isBlocoTexto(bloco.tipo)) {
    return <LeituraBlock payload={bloco.payload || {}} />;
  }

  if (bloco.tipo === 'checkpoint') return <CheckpointBlock payload={bloco.payload || {}} />;
  if (bloco.tipo === 'recapitulacao') return <RecapBlock payload={bloco.payload || {}} />;



  if (bloco.tipo === 'citacao') {
    const { texto, autor, fonte_url } = bloco.payload || {};
    return (
      <article className="max-w-[70ch] mx-auto py-4">
        <p className="mb-4 flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary/80">
          <Quote className="h-3.5 w-3.5" /> Citação Especial
        </p>
        <blockquote className="relative pl-6 py-2">
          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full bg-gradient-to-b from-primary via-primary/50 to-transparent" />
          <p className="font-sans text-[20px] md:text-[22px] leading-[1.7] italic text-neutral-300">"{texto}"</p>
          {autor && <footer className="mt-4 text-[15px] font-medium text-neutral-500">— {autor}</footer>}
          {fonte_url && (
            <a href={fonte_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-[13px] font-semibold text-primary hover:text-primary-light underline underline-offset-4 decoration-primary/30 hover:decoration-primary/80 transition-all">
              Acessar fonte original
            </a>
          )}
        </blockquote>
      </article>
    );
  }

  if (bloco.tipo === 'artigo_lei') {
    const { lei, numero, texto } = bloco.payload || {};
    return (
      <article className="max-w-[70ch] mx-auto py-4">
        <p className="mb-4 flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary/80">
          <Scale className="h-3.5 w-3.5" /> Texto da Lei
        </p>
        <div className="relative rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.04] to-transparent p-6 shadow-xl before:absolute before:inset-0 before:bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] before:opacity-10 before:mix-blend-overlay">
          <p className="mb-4 text-sm font-bold text-white uppercase tracking-wide">
            {lei} {numero ? <span className="text-primary font-black">— Art. {numero}</span> : ''}
          </p>
          <p className="whitespace-pre-line text-[17px] md:text-[18px] leading-[1.8] text-neutral-300 relative z-10">{texto}</p>
        </div>
      </article>
    );
  }

  if (bloco.tipo === 'tabela') {
    const { titulo, colunas = [], linhas = [] } = bloco.payload || {};
    return (
      <article className="max-w-[70ch] lg:max-w-none mx-auto py-4">
        {titulo && <h3 className="mb-6 font-sans text-[20px] font-bold leading-snug text-white">{titulo}</h3>}

        {/* Mobile: cada linha vira um cartão */}
        <div className="space-y-4 sm:hidden">
          {linhas.map((row: string[], ri: number) => (
            <div key={ri} className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] shadow-lg">
              <div className="bg-white/5 px-4 py-3 font-sans text-[15px] font-bold text-white border-b border-white/5">
                {row[0]}
              </div>
              <dl className="divide-y divide-white/5">
                {row.slice(1).map((cell, ci) => (
                  <div key={ci} className="px-4 py-3">
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                      {colunas[ci + 1]}
                    </dt>
                    <dd className="text-[15px] leading-relaxed text-neutral-300">{cell}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>

        {/* Desktop: tabela normal */}
        <div className="hidden overflow-x-auto rounded-2xl border border-white/5 shadow-xl sm:block bg-white/[0.02]">
          <table className="w-full text-[15px]">
            <thead className="bg-white/5">
              <tr>
                {colunas.map((c: string, i: number) => (
                  <th key={i} className="px-4 py-4 text-left text-[14px] font-bold text-white uppercase tracking-wider">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map((row: string[], ri: number) => (
                <tr key={ri} className="border-t border-white/5 odd:bg-white/[0.01]">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-4 align-top leading-relaxed text-neutral-300">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    );
  }


  if (bloco.tipo === 'mapa_mental') {
    const { raiz, definicao_raiz, ramos = [] } = bloco.payload || {};
    return (
      <article>
        <p className="mb-3 text-xs font-semibold uppercase text-primary">Mapa mental</p>
        <div className="rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/10 to-accent/10 p-5 text-center">
          <p className="font-display text-2xl font-bold text-foreground leading-tight">{raiz}</p>
          {definicao_raiz && (
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{definicao_raiz}</p>
          )}
        </div>

        {/* tronco central saindo da raiz */}
        {ramos.length > 0 && (
          <div className="flex justify-center" aria-hidden>
            <span className="block w-0.5 h-6 bg-primary/50" />
          </div>
        )}

        {/* ramos ligados por uma espinha vertical + conectores horizontais */}
        <div className="relative pl-8">
          {ramos.length > 0 && (
            <span
              aria-hidden
              className="absolute left-3 top-0 bottom-6 w-0.5 bg-gradient-to-b from-primary/60 via-primary/40 to-transparent"
            />
          )}
          <div className="space-y-4">
            {ramos.map((r: any, i: number) => (
              <div key={i} className="relative">
                {/* conector horizontal + nó */}
                <span aria-hidden className="absolute -left-5 top-6 h-0.5 w-5 bg-primary/50" />
                <span
                  aria-hidden
                  className="absolute -left-[26px] top-[19px] h-3 w-3 rounded-full border-2 border-primary bg-background"
                />
                <div className="rounded-xl border-2 border-border bg-card p-4 shadow-sm">
                  <p className="font-display text-base font-bold text-foreground">{r.titulo}</p>
                  {r.definicao && (
                    <p className="mt-1 mb-3 text-xs text-muted-foreground italic leading-relaxed">{r.definicao}</p>
                  )}
                  <ul className="relative space-y-2 text-[14px] pl-4">
                    <span aria-hidden className="absolute left-1 top-1 bottom-1 w-px bg-border" />
                    {(r.itens || []).map((it: any, j: number) => {
                      const isObj = it && typeof it === 'object';
                      const termo = isObj ? it.termo : String(it);
                      const definicao = isObj ? it.definicao : '';
                      return (
                        <li key={j} className="relative flex gap-2 items-start">
                          <span aria-hidden className="absolute -left-3 top-[9px] h-px w-3 bg-border" />
                          <span className="mt-1.5 inline-block w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                          <span className="flex-1 leading-snug">
                            <span className="font-semibold text-foreground">{termo}</span>
                            {definicao && (
                              <span className="text-muted-foreground"> — {definicao}</span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </article>
    );
  }


  if (bloco.tipo === 'fluxograma') {
    const { titulo, etapas = [] } = bloco.payload || {};
    const stepStyle = (t?: string) => {
      switch (t) {
        case 'inicio': return { border: 'border-emerald-500/50', bg: 'bg-emerald-500/5', badge: 'bg-emerald-500 text-white', label: 'Início' };
        case 'fim': return { border: 'border-primary/50', bg: 'bg-primary/5', badge: 'bg-primary text-primary-foreground', label: 'Fim' };
        case 'decisao': return { border: 'border-yellow-500/60', bg: 'bg-yellow-500/10', badge: 'bg-yellow-500 text-black', label: 'Decisão' };
        default: return { border: 'border-border/60 hover:border-primary/40 transition-colors', bg: 'bg-card/60 backdrop-blur-sm', badge: 'bg-primary/10 text-primary font-bold', label: 'Etapa' };
      }
    };
    return (
      <article>
        <p className="mb-3 text-xs font-semibold uppercase text-primary">Fluxograma</p>
        {titulo && <h3 className="mb-4 font-display text-lg font-bold text-foreground">{titulo}</h3>}
        <ol className="space-y-2">
          {etapas.map((et: any, i: number) => {
            const s = stepStyle(et.tipo);
            const isDecisao = et.tipo === 'decisao';
            return (
              <li key={i}>
                <div className={`rounded-2xl border-2 ${s.border} ${s.bg} p-4 shadow-sm ${isDecisao ? 'transform-gpu' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-9 h-9 rounded-full ${s.badge} flex items-center justify-center font-bold text-sm`}>
                      {et.n ?? i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded ${s.badge}`}>{s.label}</span>
                      </div>
                      <p className="font-display text-base font-bold text-foreground leading-tight">{et.titulo}</p>
                      {et.descricao && (
                        <p className="mt-1 text-[14px] text-muted-foreground leading-relaxed">{et.descricao}</p>
                      )}
                    </div>
                  </div>
                </div>
                {i < etapas.length - 1 && (
                  <div className="flex justify-center py-1" aria-hidden="true">
                    <div className="w-0.5 h-4 bg-primary/30" />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </article>
    );
  }

  if (bloco.tipo === 'linha_tempo') {
    const { titulo, eventos = [] } = bloco.payload || {};
    return (
      <article>
        {titulo && <h3 className="mb-3 font-display text-lg font-bold text-foreground">{titulo}</h3>}
        <ol className="relative border-l-2 border-primary/40 pl-4 space-y-4">
          {eventos.map((ev: any, i: number) => (
            <li key={i} className="relative">
              <span className="absolute -left-[22px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary" />
              <p className="text-xs font-bold uppercase text-primary">{ev.marco}</p>
              <p className="font-semibold text-foreground">{ev.titulo}</p>
              {ev.descricao && <p className="text-sm text-muted-foreground">{ev.descricao}</p>}
            </li>
          ))}
        </ol>
      </article>
    );
  }

  if (bloco.tipo === 'destaque') {
    const { tom = 'info', titulo, texto } = bloco.payload || {};
    const style = tom === 'alerta'
      ? { bg: 'bg-red-500/10', br: 'border-red-500/40', tx: 'text-red-700 dark:text-red-300', Icon: AlertTriangle }
      : tom === 'dica'
      ? { bg: 'bg-yellow-500/10', br: 'border-yellow-500/40', tx: 'text-yellow-700 dark:text-yellow-300', Icon: Lightbulb }
      : { bg: 'bg-blue-500/10', br: 'border-blue-500/40', tx: 'text-blue-700 dark:text-blue-300', Icon: Info };
    return (
      <article>
        <div className={`rounded-xl border ${style.br} ${style.bg} p-4`}>
          <div className={`mb-2 flex items-center gap-2 text-xs font-bold uppercase ${style.tx}`}>
            <style.Icon className="h-4 w-4" />
            {titulo || (tom === 'alerta' ? 'Atenção' : tom === 'dica' ? 'Dica' : 'Importante')}
          </div>
          <p className="text-[15px] leading-relaxed text-foreground">{texto}</p>
        </div>
      </article>
    );
  }

  if (bloco.tipo === 'mapa_conceitual') return <MapaConceitualBlock payload={bloco.payload} />;
  if (bloco.tipo === 'ordenacao') return <OrdenacaoBlock payload={bloco.payload} />;
  if (bloco.tipo === 'cena_animada') return <CenaAnimadaBlock payload={bloco.payload} />;

  if (bloco.tipo === 'infografico') {
    const { titulo, itens = [] } = bloco.payload || {};
    return (
      <article>
        {titulo && <h3 className="mb-3 font-display text-lg font-bold text-foreground">{titulo}</h3>}
        <div className="grid gap-3 sm:grid-cols-2">
          {itens.map((it: any, i: number) => (
            <div key={i} className="rounded-xl border border-border bg-gradient-to-br from-primary/5 to-transparent p-4">
              {it.numero && <p className="font-display text-3xl font-bold text-primary">{it.numero}</p>}
              <p className="mt-1 font-semibold text-foreground">{it.titulo}</p>
              {it.descricao && <p className="mt-1 text-sm text-muted-foreground">{it.descricao}</p>}
            </div>
          ))}
        </div>
      </article>
    );
  }

  if (bloco.tipo === 'pergunta') {
    const { enunciado, opcoes } = bloco.payload || {};
    const correta = String(bloco.resposta_correta?.id_correto || '').toLowerCase();
    return (
      <article className="max-w-[70ch] mx-auto py-4">
        <p className="mb-4 flex items-center gap-3 text-[11px] font-extrabold uppercase tracking-[0.2em] text-red-400">
          Desafio de Fixação
        </p>
        <h2 className="mb-8 font-sans text-[21px] md:text-[23px] font-normal leading-snug text-white">{enunciado}</h2>
        <div className="space-y-3 pb-24">
          {(opcoes || []).map((op: any) => {
            const id = String(op.id).toLowerCase();
            const escolhida = resposta ? (resposta.escolha?.toLowerCase() === id) : (selectedOpcao === id);
            const acertou = resposta?.correta && (resposta.escolha?.toLowerCase() === id);
            const errou = resposta && (resposta.escolha?.toLowerCase() === id) && !resposta.correta;
            const revelaCerta = resposta && id === correta;
            return (
              <button
                key={op.id}
                disabled={!!resposta}
                onClick={() => {
                  if (!resposta) setSelectedOpcao(id);
                }}
                className={`flex w-full items-center gap-4 rounded-2xl border p-5 text-left text-[16px] md:text-[17px] leading-relaxed transition-all min-h-16 shadow-sm group ${
                  acertou || revelaCerta
                    ? 'border-emerald-500/50 bg-emerald-500/[0.12] text-white ring-1 ring-emerald-500/30'
                    : errou
                    ? 'border-red-500/50 bg-red-500/[0.12] text-white ring-1 ring-red-500/30'
                    : escolhida
                    ? 'border-neutral-500 bg-neutral-700 text-white ring-1 ring-neutral-500/50'
                    : 'border-white/10 bg-[#1A1A1A] text-neutral-300 hover:border-white/30 hover:bg-[#262626]'
                }`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-extrabold uppercase transition-colors ${
                  acertou || revelaCerta ? 'border-emerald-500/60 bg-emerald-500/25 text-emerald-400' :
                  errou ? 'border-red-500/60 bg-red-500/25 text-red-400' :
                  escolhida ? 'border-neutral-400 bg-neutral-600 text-white' :
                  'border-white/20 bg-white/5 text-neutral-400 group-hover:text-white group-hover:border-white/40'
                }`}>
                  {op.id}
                </span>
                <span className="flex-1 font-medium">{op.texto}</span>
                {(acertou || revelaCerta) && <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />}
                {errou && <XCircle className="h-6 w-6 text-red-400 shrink-0" />}
              </button>
            );
          })}
        </div>
        <AnimatePresence>
          {resposta && showExplicacao && (
            <>
              {/* Overlay Escuro */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                onClick={() => setShowExplicacao(false)}
              />
              
              {/* Bottom Sheet */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 z-[70] max-h-[85vh] rounded-t-[2rem] border-t border-white/10 bg-[#1A1A1A] p-6 pb-[calc(1.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    {resposta.correta ? (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50">
                        <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-400 ring-1 ring-red-500/50">
                        <XCircle className="h-7 w-7 text-red-400" />
                      </div>
                    )}
                    <div>
                      <h3 className={`font-display text-xl font-bold tracking-wide ${resposta.correta ? 'text-emerald-400' : 'text-red-400'}`}>
                        {resposta.correta ? 'Você acertou!' : 'Você errou'}
                      </h3>
                      <p className="text-sm text-neutral-300">
                        {resposta.correta ? 'Mandou muito bem.' : 'Não desanime, continue tentando.'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowExplicacao(false)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="overflow-y-auto pr-2 pb-6 flex-1">
                  <p className="text-[12px] font-extrabold uppercase tracking-widest text-red-400 mb-2">Comentário do Professor</p>
                  <p className="text-[16px] leading-relaxed text-neutral-200 whitespace-pre-wrap">
                    {bloco.resposta_correta?.explicacao || 'Nenhum comentário disponível para esta questão.'}
                  </p>
                </div>
                
                <div className="pt-2">
                  <button
                     onClick={() => setShowExplicacao(false)}
                     className={`w-full rounded-2xl px-6 py-4 text-[16px] font-extrabold text-white shadow-lg active:scale-[0.98] transition-all ${
                       resposta.correta ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/25' : 'bg-red-500 hover:bg-red-400 shadow-red-500/25'
                     }`}
                  >
                     Entendi
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Floating Responder Button */}
        <AnimatePresence>
          {!resposta && selectedOpcao && (
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-background/95 backdrop-blur px-4 py-4 pb-[calc(1rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] flex items-center justify-between"
            >
              <button
                onClick={() => onResponder(selectedOpcao)}
                className="w-full rounded-2xl bg-primary px-6 py-4 text-[16px] font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-light active:scale-[0.98] transition-all"
              >
                Responder
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </article>
    );
  }

  if (bloco.tipo === 'flashcard') {
    const { frente, verso, explicacao, exemplo, aplicando, dica } = bloco.payload || {};
    const versoTexto: string = explicacao || verso || '';
    const exemploTexto: string = exemplo || '';
    const aplicandoTexto: string = aplicando || '';
    const dicaTexto: string = dica || '';

    const Divider = ({ label, Icon }: { label: string; Icon?: any }) => (
      <div className="flex items-center gap-4 my-6" aria-hidden="true">
        <div className="flex-1 h-px bg-white/10" />
        <span className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-white/50">
          {Icon && <Icon className="w-3.5 h-3.5" />} {label}
        </span>
        <div className="flex-1 h-px bg-white/10" />
      </div>
    );

    return (
      <article className="max-w-[70ch] mx-auto py-4">
        <p className="mb-4 flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary/80">
          Flashcard de Retenção
        </p>

        <div className="w-full" style={{ perspective: '1200px' }}>
          <motion.div
            className="relative w-full min-h-[460px] cursor-pointer"
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformStyle: 'preserve-3d' }}
            onClick={onFlip}
          >
            {/* Frente */}
            <div
              className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-[#111] to-[#1a1a1a] border border-white/10 p-8 md:p-10 flex flex-col shadow-2xl"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="flex items-center justify-between mb-4 opacity-50">
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-white">Frente</span>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 flex items-center justify-center text-center px-4">
                <p className="font-sans text-2xl md:text-3xl font-bold leading-[1.4] text-white/90">{frente}</p>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-wider text-white/30 pt-6 border-t border-white/5">
                <RotateCw className="w-4 h-4" /> Toque para virar
              </div>
            </div>

            {/* Verso */}
            <div
              className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 p-8 md:p-10 flex flex-col shadow-2xl backdrop-blur-xl"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-primary">Verso · Resposta</span>
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 overflow-y-auto text-left pr-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <p className="font-sans text-xl font-bold leading-relaxed text-white/95">{versoTexto}</p>

                {exemploTexto && (
                  <>
                    <Divider label="Exemplo prático" Icon={Lightbulb} />
                    <p className="font-sans text-[16px] leading-relaxed text-white/80 italic">{exemploTexto}</p>
                  </>
                )}

                {aplicandoTexto && (
                  <>
                    <Divider label="Aplicando" Icon={Flag} />
                    <p className="font-sans text-[16px] leading-relaxed text-white/80">{aplicandoTexto}</p>
                  </>
                )}

                {dicaTexto && (
                  <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 px-5 py-4">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-primary mb-1">Dica de Ouro</p>
                    <p className="font-sans text-[15px] leading-relaxed text-white/90">{dicaTexto}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-wider text-white/30 pt-6 mt-4 border-t border-white/5">
                <RotateCw className="w-4 h-4" /> Toque para voltar
              </div>
            </div>
          </motion.div>
        </div>
      </article>
    );
  }


  if (bloco.tipo === 'conexao') {
    const pares = Array.isArray(bloco.payload?.pares) ? bloco.payload.pares : [];
    return (
      <ConexaoBlock
        key={bloco.id}
        pares={pares}
        onCompleto={() => onConexao({}, true)}
      />
    );
  }


  return null;
}

export default AprenderAula;
