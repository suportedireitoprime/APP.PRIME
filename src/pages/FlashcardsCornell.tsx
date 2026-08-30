import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/vademecum/PageHeader';
import FlashcardsBottomNav from '@/components/flashcards/FlashcardsBottomNav';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2, RotateCcw, Sparkles, BookOpen, Scale, Lightbulb, ChevronRight, BrainCircuit, RefreshCw, Key, HelpCircle, FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { haptic } from '@/lib/nativeHaptics';
import { getAreaVisual } from '@/lib/flashcardsAreaVisual';

type CardDetail = {
  id: string;
  area: string;
  tema: string | null;
  subtema: string | null;
  pergunta: string;
  resposta: string;
  exemplo: string | null;
  base_legal: string | null;
  dica: string | null;
};

type CornellData = {
  pontos_chave: string[];
  notas_explicativas: string;
  exemplos_praticos: string;
  sintese_final: string;
};

const FlashcardsCornell = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const cardId = params.get('cardId');

  const [card, setCard] = useState<CardDetail | null>(null);
  const [cornell, setCornell] = useState<CornellData | null>(null);
  const [loadingCard, setLoadingCard] = useState(true);
  const [loadingAi, setLoadingAi] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // SEO & Título dinâmico
  useEffect(() => {
    document.title = 'Resumo Cornell com IA | Vade Mecum PRIME';
  }, []);

  useEffect(() => {
    if (!cardId) {
      toast.error('Card não especificado');
      navigate('/flashcards/revisar');
      return;
    }

    (async () => {
      setLoadingCard(true);
      const { data, error } = await supabase
        .from('flashcards_cards')
        .select('*')
        .eq('id', cardId)
        .single();

      if (error || !data) {
        toast.error('Flashcard não encontrado');
        navigate('/flashcards/revisar');
        return;
      }

      setCard(data as CardDetail);
      setLoadingCard(false);

      if (data.resumo_ia) {
        try {
          const parsed = JSON.parse(data.resumo_ia);
          if (parsed && typeof parsed === 'object') {
            setCornell(parsed as CornellData);
            setLoadingAi(false);
            return;
          }
        } catch (e) {
          console.error('Erro ao parsear resumo_ia salvo', e);
        }
      }

      // Gerar Resumo Cornell com Gemini AI caso não exista
      gerarCornell(data as CardDetail);
    })();
  }, [cardId]);

  const gerarCornell = async (c: CardDetail) => {
    setLoadingAi(true);
    try {
      const { data, error } = await supabase.functions.invoke('gerar-resumo-cornell-card', {
        body: {
          card_id: c.id,
          pergunta: c.pergunta,
          resposta: c.resposta,
          area: c.area,
          tema: c.tema,
        },
      });

      if (error || !data?.cornell) {
        console.warn('Fallback local para resumo Cornell', error);
        setCornell({
          pontos_chave: [c.area, c.tema || 'Doutrina Jurídica'],
          notas_explicativas: c.resposta,
          exemplos_praticos: c.exemplo || 'Aplicação prática direta em decisões judiciais.',
          sintese_final: c.resposta.slice(0, 180),
        });
      } else {
        const generated = data.cornell as CornellData;
        setCornell(generated);
        // Salvar o resumo gerado no Supabase para uso futuro
        await supabase
          .from('flashcards_cards')
          .update({ resumo_ia: JSON.stringify(generated) })
          .eq('id', c.id);
      }
    } catch (e) {
      console.error('Erro ao invocar Gemini AI:', e);
      setCornell({
        pontos_chave: [c.area, c.tema || 'Doutrina Jurídica'],
        notas_explicativas: c.resposta,
        exemplos_praticos: c.exemplo || 'Aplicação prática em concursos e advocacia.',
        sintese_final: c.resposta.slice(0, 180),
      });
    } finally {
      setLoadingAi(false);
    }
  };

  const marcarRevisado = async () => {
    if (!card || salvando) return;
    setSalvando(true);
    haptic.selection();

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setSalvando(false);
      toast.error('Faça login para salvar');
      return;
    }

    // Agendar próxima revisão para daqui a 2 dias (+48 horas)
    const proximaData = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase.from('flashcards_progresso').upsert(
      {
        user_id: auth.user.id,
        card_id: card.id,
        area: card.area,
        tema: card.tema,
        status: 'compreendido',
        proxima_revisao_em: proximaData,
        ultima_resposta_em: new Date().toISOString(),
      } as any,
      { onConflict: 'user_id,card_id' },
    );

    setSalvando(false);

    if (error) {
      toast.error('Não foi possível salvar a revisão');
      return;
    }

    toast.success('Card revisado com sucesso! Reagendado para daqui a 2 dias.');
    navigate('/flashcards/revisar');
  };

  if (loadingCard || !card) {
    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center p-6 text-center">
        <Sparkles className="h-10 w-10 text-primary animate-pulse mb-3" />
        <p className="text-base font-extrabold text-foreground">Carregando Flashcard…</p>
      </div>
    );
  }

  const visual = getAreaVisual(card.area);

  return (
    <div className="min-h-dvh bg-background pb-28 lg:pb-12 pt-[calc(0.5rem+var(--sai-top))]">
      <div className="mx-auto w-full max-w-2xl lg:max-w-4xl px-3 sm:px-6">
        <PageHeader
          title="Resumo Cornell (Gemini AI)"
          subtitle={`${card.area} ${card.tema ? `› ${card.tema}` : ''}`}
          onBack={() => navigate('/flashcards/revisar')}
        />

        <div className="pt-3 space-y-6">
          {/* Card Original da Pergunta */}
          <div
            className="rounded-3xl border bg-card/95 backdrop-blur-md p-6 shadow-xl space-y-4"
            style={{ borderColor: `${visual.color}45` }}
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black"
                style={{ backgroundColor: `${visual.color}25`, color: visual.color }}
              >
                <visual.icon className="h-3.5 w-3.5" />
                {card.area}
              </span>
              {card.tema && (
                <span className="text-xs font-extrabold text-foreground bg-muted/80 px-3 py-1 rounded-full border border-border/60">
                  {card.tema}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4 text-primary" /> Pergunta do Flashcard
              </p>
              <h2 className="text-lg sm:text-xl font-extrabold leading-snug text-foreground font-display">
                {card.pergunta}
              </h2>
            </div>

            <div className="space-y-1 pt-2 border-t border-border/60">
              <p className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                <FileText className="h-4 w-4" /> Resposta Oficial
              </p>
              <p className="text-sm sm:text-base leading-relaxed text-foreground font-medium whitespace-pre-wrap">
                {card.resposta}
              </p>
            </div>
          </div>

          {/* Seção Resumo Cornell Gerado por IA */}
          <div className="rounded-3xl border border-primary/40 bg-gradient-to-b from-card via-card to-primary/5 p-6 shadow-2xl space-y-5 relative overflow-hidden">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <BrainCircuit className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">Método Cornell com IA</h3>
                  <p className="text-xs text-muted-foreground">Sintetizado pelo Gemini AI para estudo profundo</p>
                </div>
              </div>

              {loadingAi && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary animate-pulse bg-primary/10 px-3 py-1 rounded-full">
                  <Sparkles className="h-3.5 w-3.5" /> Gerando...
                </span>
              )}
            </div>

            {loadingAi ? (
              <div className="space-y-4 py-6">
                <div className="h-10 rounded-2xl bg-muted/60 animate-pulse" />
                <div className="h-24 rounded-2xl bg-muted/40 animate-pulse" />
                <div className="h-16 rounded-2xl bg-muted/40 animate-pulse" />
              </div>
            ) : cornell ? (
              <div className="space-y-5">
                {/* 1. Pontos Chave (Cues / Keywords) */}
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-amber-500 mb-2 flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5" /> Pontos Chave & Gatilhos Mentais
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {cornell.pontos_chave.map((ponto, i) => (
                      <span
                        key={i}
                        className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-foreground"
                      >
                        {ponto}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 2. Notas Explicativas (Notes) */}
                <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-1.5">
                  <p className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" /> Anotações & Lógica Jurídica
                  </p>
                  <p className="text-sm leading-relaxed text-foreground font-medium whitespace-pre-wrap">
                    {cornell.notas_explicativas}
                  </p>
                </div>

                {/* 3. Exemplos Práticos */}
                {cornell.exemplos_praticos && (
                  <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-1.5">
                    <p className="text-xs font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1.5">
                      <Scale className="h-3.5 w-3.5" /> Aplicação Prática / Caso
                    </p>
                    <p className="text-sm leading-relaxed text-foreground font-medium whitespace-pre-wrap">
                      {cornell.exemplos_praticos}
                    </p>
                  </div>
                )}

                {/* 4. Síntese de Fixação (Summary) */}
                <div className="rounded-2xl bg-primary/10 border border-primary/30 p-4 space-y-1">
                  <p className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5" /> Regra de Ouro (Síntese)
                  </p>
                  <p className="text-sm font-extrabold leading-snug text-foreground">
                    {cornell.sintese_final}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          {/* Botão Marcar como Revisado (Agendamento para 2 dias) */}
          <div className="pt-2 pb-[calc(1.25rem+var(--safe-bottom))] space-y-2">
            <Button
              onClick={marcarRevisado}
              disabled={salvando}
              className="w-full h-15 rounded-2xl text-base font-black gap-2 bg-primary text-white hover:bg-primary/90 shadow-xl active:scale-98 transition-all"
            >
              <CheckCircle2 className="h-6 w-6" />
              <span>{salvando ? 'Salvando…' : 'Marcar como Revisado (Próxima revisão em 2 dias)'}</span>
            </Button>

            <p className="text-center text-xs font-semibold text-muted-foreground">
              Ao marcar como revisado, o algoritmo de Repetição Espaçada trará este card de volta em 2 dias.
            </p>
          </div>
        </div>
      </div>

      <FlashcardsBottomNav />
    </div>
  );
};

export default FlashcardsCornell;
