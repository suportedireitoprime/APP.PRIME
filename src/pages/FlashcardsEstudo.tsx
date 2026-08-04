import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/vademecum/PageHeader';
import FlashcardsBottomNav from '@/components/flashcards/FlashcardsBottomNav';
import AreaTemasSheet from '@/components/flashcards/AreaTemasSheet';
import {
  CheckCircle2, RotateCcw, SlidersHorizontal, BookOpen, Scale, Lightbulb, ChevronRight, Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { haptic } from '@/lib/nativeHaptics';
import { playFlipSound } from '@/lib/flipSound';
import { getAreaVisual } from '@/lib/flashcardsAreaVisual';

export type Card = {
  id: string;
  area: string;
  tema: string | null;
  subtema: string | null;
  pergunta: string;
  resposta: string;
  exemplo: string | null;
  base_legal: string | null;
  dica: string | null;
  reforco_conteudo: string | null;
  artigo_numero: string | null;
  status: string | null;
};

type AreaResumo = { area: string; total_cards: number; compreendidos: number; a_revisar: number };

const MODOS = [
  { id: 'todos', label: 'Todos' },
  { id: 'novos', label: 'Novos' },
  { id: 'revisar', label: 'A revisar' },
  { id: 'compreendidos', label: 'Compreendidos' },
];

const FlashcardsEstudo = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const areaParam = params.get('area');
  const areasParam = params.get('areas');
  const temasParam = params.get('temas') || params.get('tema');
  const deckId = params.get('deck');
  const modo = params.get('modo') || 'todos';

  // Sem nenhum filtro escolhido → tela de categorias.
  const escolhendo = !areaParam && !areasParam && !deckId;

  const [cards, setCards] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [virado, setVirado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [areas, setAreas] = useState<AreaResumo[]>([]);
  const [temas, setTemas] = useState<{ tema: string; total: number }[]>([]);
  const [feitos, setFeitos] = useState(0);
  const [areaSheet, setAreaSheet] = useState<string | null>(null);
  const salvando = useRef(false);

  const carregar = useCallback(async () => {
    if (escolhendo) { setCards([]); setLoading(false); return; }
    setLoading(true);
    const listaAreas = areasParam
      ? areasParam.split('|').filter(Boolean)
      : areaParam
        ? [areaParam]
        : null;
    const { data, error } = await supabase.rpc('flashcards_sessao', {
      _areas: listaAreas,
      _temas: temasParam ? temasParam.split('|').filter(Boolean) : null,
      _modo: modo,
      _deck_id: deckId,
      _limit: 30,
    });
    if (error) toast.error('Não foi possível carregar os flashcards');
    setCards(((data as unknown as Card[]) || []));
    setIdx(0);
    setVirado(false);
    setLoading(false);
  }, [areaParam, areasParam, temasParam, modo, deckId, escolhendo]);

  useEffect(() => { carregar(); }, [carregar]);

  useEffect(() => {
    supabase.rpc('flashcards_resumo_areas').then(({ data }) => {
      if (data) setAreas((data as any[]).map((a) => ({
        area: a.area,
        total_cards: Number(a.total_cards),
        compreendidos: Number(a.compreendidos),
        a_revisar: Number(a.a_revisar),
      })));
    });
  }, []);

  useEffect(() => {
    if (!areaParam) { setTemas([]); return; }
    supabase.rpc('flashcards_temas', { _area: areaParam }).then(({ data }) => {
      if (data) setTemas((data as any[]).map((t) => ({ tema: t.tema, total: Number(t.total) })));
    });
  }, [areaParam]);

  const atual = cards[idx];
  const progresso = cards.length ? Math.round((feitos / cards.length) * 100) : 0;

  const virar = () => {
    haptic.selection();
    playFlipSound();
    setVirado((v) => !v);
  };

  const responder = async (status: 'compreendido' | 'revisar') => {
    if (!atual || salvando.current) return;
    salvando.current = true;
    haptic.light();
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) {
      const { error } = await supabase.from('flashcards_progresso').upsert(
        {
          user_id: auth.user.id,
          card_id: atual.id,
          area: atual.area,
          tema: atual.tema,
          status,
          ultima_resposta_em: new Date().toISOString(),
        },
        { onConflict: 'user_id,card_id' },
      );
      if (error) toast.error('Não foi possível salvar o progresso');
    }
    setFeitos((f) => f + 1);
    setVirado(false);
    salvando.current = false;
    if (idx + 1 >= cards.length) {
      toast.success('Sessão concluída!');
      setIdx(cards.length);
    } else {
      setIdx((i) => i + 1);
    }
  };

  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    if (k === 'area') { next.delete('tema'); next.delete('temas'); }
    setParams(next, { replace: true });
  };

  const titulo = useMemo(() => {
    if (escolhendo) return 'Estudar';
    return temasParam?.split('|')[0] || areaParam || 'Estudar';
  }, [areaParam, temasParam, escolhendo]);

  return (
    <div className={`min-h-dvh bg-background ${escolhendo ? 'pb-32' : 'pb-10'}`}>
      <div className="mx-auto w-full max-w-3xl">
        <PageHeader
          title={titulo}
          subtitle={escolhendo ? 'Escolha uma categoria' : `${cards.length} cards na sessão`}
          onBack={() => navigate('/flashcards')}
          rightAction={
            escolhendo ? undefined : (
              <Sheet>
                <SheetTrigger asChild>
                  <button className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
                    <SlidersHorizontal className="h-5 w-5 text-foreground" />
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto rounded-t-3xl">
                  <SheetHeader><SheetTitle>Filtros</SheetTitle></SheetHeader>

                  <div className="mt-4 space-y-5 pb-8">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Modo</p>
                      <div className="flex flex-wrap gap-2">
                        {MODOS.map((m) => (
                          <Chip key={m.id} active={modo === m.id} onClick={() => setParam('modo', m.id)}>
                            {m.label}
                          </Chip>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Área</p>
                      <div className="flex flex-wrap gap-2">
                        <Chip active={!areaParam} onClick={() => setParam('area', null)}>Todas</Chip>
                        {areas.map((a) => (
                          <Chip key={a.area} active={areaParam === a.area} onClick={() => setParam('area', a.area)}>
                            {a.area}
                          </Chip>
                        ))}
                      </div>
                    </div>

                    {!!temas.length && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Matéria</p>
                        <div className="flex flex-wrap gap-2">
                          <Chip active={!temasParam} onClick={() => setParam('temas', null)}>Todas</Chip>
                          {temas.slice(0, 60).map((t) => (
                            <Chip
                              key={t.tema}
                              active={temasParam === t.tema}
                              onClick={() => setParam('temas', t.tema)}
                            >
                              {t.tema} · {t.total}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            )
          }
        />

        {/* Categorias — padrão Aprender */}
        {escolhendo ? (
          <div className="space-y-2 px-4 pt-4 sm:px-6">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Categorias
            </p>
            <button
              onClick={() => { haptic.selection(); setParam('areas', areas.map((a) => a.area).join('|')); }}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-all hover:border-primary/40 active:scale-[0.995] sm:p-3.5"
            >
              <div className="aprender-icon-shine relative flex h-14 w-14 shrink-0 items-center justify-center sm:h-16 sm:w-16">
                <Layers className="h-9 w-9 text-primary sm:h-10 sm:w-10" strokeWidth={1.9} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-foreground sm:text-[16px]">Mistura geral</p>
                <p className="mt-0.5 text-[12px] text-muted-foreground sm:text-[13px]">
                  Cards de todas as categorias
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </button>

            {areas.map((a) => {
              const p = a.total_cards ? Math.round((a.compreendidos / a.total_cards) * 100) : 0;
              const { icon: Icon, color } = getAreaVisual(a.area);
              return (
                <button
                  key={a.area}
                  onClick={() => { haptic.selection(); setAreaSheet(a.area); }}
                  className="group flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-all hover:border-primary/40 active:scale-[0.995] sm:p-3.5"
                >
                  <div className="aprender-icon-shine relative flex h-14 w-14 shrink-0 items-center justify-center sm:h-16 sm:w-16">
                    <Icon className="h-9 w-9 sm:h-10 sm:w-10" strokeWidth={1.9} style={{ color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className="min-w-0 flex-1 truncate text-[15px] font-semibold text-foreground sm:text-[16px]"
                        style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}
                      >
                        {a.area}
                      </p>
                      <span
                        className={[
                          'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums',
                          p > 0
                            ? 'bg-[hsl(var(--aprender-accent)/0.18)] text-[hsl(var(--aprender-accent))]'
                            : 'bg-muted text-muted-foreground',
                        ].join(' ')}
                      >
                        {p}%
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12px] text-muted-foreground sm:text-[13px]">
                      {a.total_cards.toLocaleString('pt-BR')} cards
                    </p>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-[hsl(var(--aprender-accent))]"
                        style={{ width: `${p}%` }}
                      />
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-4">
            <Progress value={progresso} className="mb-4 h-1.5" />

            {loading && <p className="py-16 text-center text-sm text-muted-foreground">Carregando…</p>}

            {!loading && !cards.length && (
              <div className="py-16 text-center">
                <p className="text-sm text-muted-foreground">Nenhum flashcard com esses filtros.</p>
                <Button className="mt-4" onClick={() => setParam('modo', 'todos')}>Limpar modo</Button>
              </div>
            )}

            {!loading && !!cards.length && !atual && (
              <div className="py-16 text-center">
                <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-primary" />
                <p className="font-semibold text-foreground">Sessão concluída!</p>
                <p className="text-sm text-muted-foreground">{feitos} flashcards estudados.</p>
                <Button className="mt-4" onClick={() => { setFeitos(0); carregar(); }}>Nova sessão</Button>
              </div>
            )}

            {atual && (
              <>
                {/* Carta com flip 3D — altura responsiva */}
                <div className="[perspective:1600px]">
                  <button
                    onClick={virar}
                    aria-label={virado ? 'Ver pergunta' : 'Ver resposta'}
                    className="relative block h-[clamp(360px,58dvh,560px)] w-full text-left"
                  >
                    <div
                      className="relative h-full w-full transition-transform duration-[600ms] [transform-style:preserve-3d]"
                      style={{
                        transform: virado ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        transitionTimingFunction: 'cubic-bezier(.22,1,.36,1)',
                      }}
                    >
                      {/* Frente */}
                      <div
                        className="absolute inset-0 flex flex-col overflow-hidden rounded-[28px] border bg-card shadow-[0_18px_50px_-24px_rgba(0,0,0,0.65)] [backface-visibility:hidden] [-webkit-backface-visibility:hidden]"
                        style={{ borderColor: `${getAreaVisual(atual.area).color}45` }}
                      >
                        <div
                          className="h-1.5 w-full shrink-0"
                          style={{
                            background: `linear-gradient(90deg, ${getAreaVisual(atual.area).color}, ${getAreaVisual(atual.area).color}33)`,
                          }}
                        />
                        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
                          <Tags card={atual} />
                          <p
                            className="mt-auto whitespace-pre-wrap text-[19px] font-semibold leading-[1.45] tracking-[-0.01em] text-foreground sm:text-[22px]"
                            style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}
                          >
                            {atual.pergunta}
                          </p>
                          <p className="mt-5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                            <RotateCcw className="h-3.5 w-3.5" /> Toque para virar
                          </p>
                        </div>
                      </div>

                      {/* Verso */}
                      <div
                        className="absolute inset-0 flex flex-col overflow-hidden rounded-[28px] border bg-card shadow-[0_18px_50px_-24px_rgba(0,0,0,0.65)] [backface-visibility:hidden] [-webkit-backface-visibility:hidden]"
                        style={{ transform: 'rotateY(180deg)', borderColor: `${getAreaVisual(atual.area).color}45` }}
                      >
                        <div
                          className="h-1.5 w-full shrink-0"
                          style={{
                            background: `linear-gradient(90deg, ${getAreaVisual(atual.area).color}33, ${getAreaVisual(atual.area).color})`,
                          }}
                        />
                        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
                          <p
                            className="text-[10px] font-bold uppercase tracking-[0.18em]"
                            style={{ color: getAreaVisual(atual.area).color }}
                          >
                            Resposta
                          </p>
                          <p className="whitespace-pre-wrap text-[16px] leading-[1.6] text-foreground sm:text-[17px]">
                            {atual.resposta}
                          </p>
                          {atual.exemplo && <Bloco icon={BookOpen} titulo="Exemplo" texto={atual.exemplo} />}
                          {atual.base_legal && <Bloco icon={Scale} titulo="Base legal" texto={atual.base_legal} />}
                          {atual.dica && <Bloco icon={Lightbulb} titulo="Dica" texto={atual.dica} />}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-14 rounded-2xl text-[15px] font-semibold sm:h-16"
                    onClick={() => responder('revisar')}
                  >
                    <RotateCcw className="mr-2 h-[18px] w-[18px]" /> Revisar
                  </Button>
                  <Button
                    className="h-14 rounded-2xl text-[15px] font-semibold sm:h-16"
                    onClick={() => responder('compreendido')}
                  >
                    <CheckCircle2 className="mr-2 h-[18px] w-[18px]" /> Compreendi
                  </Button>
                </div>

                <p className="mt-3 text-center text-xs font-medium tabular-nums text-muted-foreground">
                  {idx + 1} de {cards.length}
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <AreaTemasSheet area={areaSheet} open={!!areaSheet} onOpenChange={(v) => !v && setAreaSheet(null)} />
      {escolhendo && <FlashcardsBottomNav />}
    </div>
  );
};

function Tags({ card }: { card: Card }) {
  const { icon: Icon, color } = getAreaVisual(card.area);
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold"
        style={{ backgroundColor: `${color}2e`, color, border: `1px solid ${color}66` }}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
        {card.area}
      </span>
      {card.tema && (
        <span className="rounded-full border border-border bg-muted/60 px-3 py-1.5 text-[12px] font-medium text-foreground/80">
          {card.tema}
        </span>
      )}
      {card.status && (
        <span className="rounded-full bg-muted px-3 py-1.5 text-[12px] text-muted-foreground">
          {card.status === 'compreendido' ? 'Compreendido' : 'A revisar'}
        </span>
      )}
    </div>
  );
}


function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

function Bloco({ icon: Icon, titulo, texto }: { icon: any; titulo: string; texto: string }) {
  return (
    <div className="rounded-2xl bg-muted/50 p-3">
      <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {titulo}
      </p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{texto}</p>
    </div>
  );
}

export default FlashcardsEstudo;
