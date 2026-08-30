import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Button } from '@/components/ui/button';
import { RotateCcw, BookOpen, Scale, Lightbulb, CheckCircle2, ChevronRight, Layers, Sparkles, ChevronLeft, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { haptic } from '@/lib/nativeHaptics';
import { getAreaVisual } from '@/lib/flashcardsAreaVisual';

type AreaItem = { area: string; a_revisar: number };
type TemaItem = { tema: string; a_revisar: number };
type CardItem = {
  id: string;
  area: string;
  tema: string | null;
  pergunta: string;
  resposta: string;
  exemplo: string | null;
  base_legal: string | null;
  dica: string | null;
};

const FlashcardsRevisar = () => {
  const navigate = useNavigate();

  // Navegação Hierárquica em 3 Níveis: 'categorias' | 'temas' | 'cards'
  const [nivel, setNivel] = useState<'categorias' | 'temas' | 'cards'>('categorias');
  const [areaSel, setAreaSel] = useState<string | null>(null);
  const [temaSel, setTemaSel] = useState<string | null>(null);

  const [areas, setAreas] = useState<AreaItem[]>([]);
  const [temas, setTemas] = useState<TemaItem[]>([]);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);

  // SEO & Título dinâmico
  useEffect(() => {
    document.title = 'Revisão Espaçada de Flashcards | Vade Mecum PRIME';
  }, []);

  // Carregar Áreas no Nível 1
  const carregarAreas = async () => {
    setLoading(true);
    const { data } = await supabase.rpc('flashcards_resumo_areas');
    if (data) {
      setAreas(
        (data as any[])
          .filter((a) => Number(a.a_revisar) > 0)
          .map((a) => ({ area: a.area, a_revisar: Number(a.a_revisar) })),
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    carregarAreas();
  }, []);

  // Selecionar Categoria (Nível 1 ➔ Nível 2)
  const selecionarArea = async (areaNome: string) => {
    haptic.selection();
    setAreaSel(areaNome);
    setLoading(true);
    setNivel('temas');

    // Buscar os temas com pendência de revisão na área escolhida
    const { data } = await supabase.rpc('flashcards_temas', { _area: areaNome });
    if (data) {
      setTemas(
        (data as any[])
          .filter((t) => Number(t.total) > 0)
          .map((t) => ({ tema: t.tema, a_revisar: Number(t.total) })),
      );
    }
    setLoading(false);
  };

  // Selecionar Matéria/Tema (Nível 2 ➔ Nível 3)
  const selecionarTema = async (temaNome: string | null) => {
    haptic.selection();
    setTemaSel(temaNome);
    setLoading(true);
    setNivel('cards');

    const { data } = await supabase.rpc('flashcards_sessao', {
      _areas: areaSel ? [areaSel] : null,
      _temas: temaNome ? [temaNome] : null,
      _modo: 'revisar',
      _deck_id: null,
      _limit: 50,
    });

    setCards((data as unknown as CardItem[]) || []);
    setLoading(false);
  };

  const voltarNivel = () => {
    haptic.selection();
    if (nivel === 'cards') {
      setNivel('temas');
      setTemaSel(null);
    } else if (nivel === 'temas') {
      setNivel('categorias');
      setAreaSel(null);
      carregarAreas();
    } else {
      navigate('/flashcards');
    }
  };

  return (
    <div className="min-h-dvh bg-background pb-28 lg:pb-12 pt-[calc(0.5rem+var(--sai-top))]">
      <div className="mx-auto w-full max-w-2xl lg:max-w-7xl 2xl:max-w-[1600px] px-3 sm:px-6 lg:px-8">
        <PageHeader
          title={
            nivel === 'categorias'
              ? 'Revisão por Categorias'
              : nivel === 'temas'
              ? areaSel || 'Matérias para Revisar'
              : temaSel || 'Flashcards Agendados'
          }
          subtitle={
            nivel === 'categorias'
              ? 'Escolha a área que possui cartões agendados'
              : nivel === 'temas'
              ? 'Selecione a matéria para revisar os conceitos'
              : 'Clique em um card para ver o Resumo Cornell via IA'
          }
          onBack={voltarNivel}
        />

        <div className="space-y-4 pt-3">
          {/* NÍVEL 1: LISTA DE CATEGORIAS / ÁREAS COM PENDÊNCIAS */}
          {nivel === 'categorias' && (
            <div className="space-y-4">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 rounded-2xl animate-pulse bg-muted/40 border border-border/60" />
                  ))}
                </div>
              ) : areas.length === 0 ? (
                <div className="rounded-3xl border border-border bg-card p-12 text-center text-muted-foreground">
                  <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
                  <p className="text-base font-extrabold text-foreground">Sua revisão está 100% em dia!</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Marque novos flashcards como "Revisar" durante suas sessões de estudo.
                  </p>
                  <Button className="mt-5 rounded-2xl font-bold" onClick={() => navigate('/flashcards/estudar')}>
                    Praticar novos flashcards
                  </Button>
                </div>
              ) : (
                <motion.div 
                  className="grid grid-cols-3 gap-2 sm:gap-3"
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: { opacity: 0 },
                    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
                  }}
                >
                  {areas.map((a) => {
                    const visual = getAreaVisual(a.area);
                    const shortName = a.area.replace(/^Direito\s+/i, '');
                    return (
                      <motion.button
                        key={a.area}
                        onClick={() => selecionarArea(a.area)}
                        variants={{
                          hidden: { opacity: 0, scale: 0.95, y: 10 },
                          show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="group flex flex-col items-center justify-center rounded-2xl border border-border/80 bg-card p-3 text-center transition-all hover:border-primary/50 hover:shadow-md focus-visible:outline-none gap-2"
                      >
                        <visual.icon className="h-6 w-6 shrink-0 transition-transform group-hover:scale-110 mb-1" strokeWidth={2.2} style={{ color: visual.color }} />
                        <p className="text-[11px] font-extrabold text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-2">
                          {shortName}
                        </p>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-black text-primary mt-0.5">
                          {a.a_revisar}
                        </span>
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </div>
          )}

          {/* NÍVEL 2: LISTA DE MATÉRIAS / TÓPICOS DA ÁREA */}
          {nivel === 'temas' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={voltarNivel} className="gap-1 font-bold text-xs">
                  <ChevronLeft className="h-4 w-4" /> Voltar para Áreas
                </Button>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-16 rounded-2xl animate-pulse bg-muted/40 border border-border/60" />
                  ))}
                </div>
              ) : temas.length === 0 ? (
                <div className="rounded-3xl border border-border bg-card p-10 text-center text-muted-foreground">
                  <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
                  <p className="text-base font-extrabold text-foreground">Nenhuma matéria pendente nesta área!</p>
                </div>
              ) : (
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 gap-3"
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: { opacity: 0 },
                    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
                  }}
                >
                  {temas.map((t) => (
                    <motion.button
                      key={t.tema}
                      onClick={() => selecionarTema(t.tema)}
                      variants={{
                        hidden: { opacity: 0, scale: 0.95, y: 10 },
                        show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
                      }}
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.98 }}
                      className="group flex items-center justify-between rounded-2xl border border-border/80 bg-card p-4 text-left transition-all hover:border-primary/50 hover:shadow-md focus-visible:outline-none"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-extrabold text-foreground group-hover:text-primary transition-colors">
                          {t.tema}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground font-medium">
                          {t.a_revisar} {t.a_revisar === 1 ? 'card para revisar' : 'cards para revisar'}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </div>
          )}

          {/* NÍVEL 3: LISTA DOS FLASHCARDS PARA REVISÃO INTELIGENTE */}
          {nivel === 'cards' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <Button variant="ghost" size="sm" onClick={voltarNivel} className="gap-1 font-bold text-xs">
                  <ChevronLeft className="h-4 w-4" /> Voltar para Matérias
                </Button>

                {cards.length > 0 && (
                  <Button
                    size="sm"
                    className="rounded-xl font-extrabold gap-1.5 bg-primary text-white shadow-sm"
                    onClick={() =>
                      navigate(
                        `/flashcards/estudar?modo=revisar${areaSel ? `&area=${encodeURIComponent(areaSel)}` : ''}${temaSel ? `&temas=${encodeURIComponent(temaSel)}` : ''}`,
                      )
                    }
                  >
                    <RotateCcw className="h-4 w-4" /> Praticar Todos em 3D
                  </Button>
                )}
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 rounded-2xl animate-pulse bg-muted/40 border border-border/60" />
                  ))}
                </div>
              ) : cards.length === 0 ? (
                <div className="rounded-3xl border border-border bg-card p-10 text-center text-muted-foreground">
                  <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
                  <p className="text-base font-extrabold text-foreground">Cards desta matéria já revisados!</p>
                </div>
              ) : (
                <motion.div 
                  className="space-y-3"
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: { opacity: 0 },
                    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
                  }}
                >
                  {cards.map((c) => (
                    <motion.button
                      key={c.id}
                      onClick={() => {
                        haptic.selection();
                        navigate(`/flashcards/cornell?cardId=${c.id}`);
                      }}
                      variants={{
                        hidden: { opacity: 0, y: 15 },
                        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
                      }}
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.98 }}
                      className="group w-full rounded-2xl border border-border/80 bg-card p-5 text-left transition-all hover:border-primary/60 hover:shadow-lg focus-visible:outline-none flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start justify-between gap-3 w-full">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-black text-primary">
                              {c.area}
                            </span>
                            {c.tema && (
                              <span className="rounded-full bg-muted/80 px-2.5 py-0.5 text-[11px] font-bold text-foreground">
                                {c.tema}
                              </span>
                            )}
                          </div>

                          <p className="text-base font-extrabold leading-snug text-foreground group-hover:text-primary transition-colors">
                            {c.pergunta}
                          </p>
                        </div>

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                          <BrainCircuit className="h-5 w-5" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60 text-xs font-bold text-primary">
                        <span className="flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5" /> Ver Resumo Cornell AI
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlashcardsRevisar;

