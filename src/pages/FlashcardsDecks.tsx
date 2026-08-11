import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/vademecum/PageHeader';
import FlashcardsBottomNav from '@/components/flashcards/FlashcardsBottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Play, Trash2, FolderPlus, ChevronRight, ChevronLeft, Check, Sparkles, Layers } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { haptic } from '@/lib/nativeHaptics';

type Deck = {
  id: string;
  nome: string;
  descricao: string | null;
  filtros: any;
  total_cards: number;
};

type TemaItem = { tema: string; area: string; count: number };

const FlashcardsDecks = () => {
  const navigate = useNavigate();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  
  // Estados do Wizard em 3 Etapas
  const [aberto, setAberto] = useState(false);
  const [etapa, setEtapa] = useState<1 | 2 | 3>(1);
  const [selAreas, setSelAreas] = useState<string[]>([]);
  const [temasDisponiveis, setTemasDisponiveis] = useState<TemaItem[]>([]);
  const [selTemas, setSelTemas] = useState<string[]>([]);
  const [nome, setNome] = useState('');
  const [loadingTemas, setLoadingTemas] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const carregar = async () => {
    const { data } = await supabase
      .from('flashcards_decks')
      .select('*')
      .order('created_at', { ascending: false });
    setDecks((data as unknown as Deck[]) || []);
  };

  useEffect(() => {
    carregar();
    supabase.rpc('flashcards_resumo_areas').then(({ data }) => {
      if (data) setAreas((data as any[]).map((a) => a.area));
    });
  }, []);

  const resetWizard = () => {
    setEtapa(1);
    setSelAreas([]);
    setTemasDisponiveis([]);
    setSelTemas([]);
    setNome('');
  };

  const avançarParaEtapa2 = async () => {
    if (!selAreas.length) {
      toast.error('Escolha ao menos uma área para prosseguir');
      return;
    }
    setLoadingTemas(true);
    setEtapa(2);
    
    // Buscar os temas das áreas selecionadas
    const { data } = await supabase
      .from('flashcards_cards')
      .select('tema, area')
      .in('area', selAreas)
      .not('tema', 'is', null);

    if (data) {
      const mapa = new Map<string, TemaItem>();
      data.forEach((item) => {
        if (item.tema) {
          const key = `${item.area}::${item.tema}`;
          const prev = mapa.get(key);
          if (prev) {
            prev.count++;
          } else {
            mapa.set(key, { tema: item.tema, area: item.area, count: 1 });
          }
        }
      });
      setTemasDisponiveis(Array.from(mapa.values()));
    }
    setLoadingTemas(false);
  };

  const avançarParaEtapa3 = () => {
    if (!nome.trim()) {
      setNome(`Meu Deck ${decks.length + 1}`);
    }
    setEtapa(3);
  };

  const criar = async () => {
    if (!nome.trim()) {
      toast.error('Dê um nome para o seu deck');
      return;
    }
    setSalvando(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setSalvando(false); return; }

    let query = supabase
      .from('flashcards_cards')
      .select('id', { count: 'exact', head: true })
      .in('area', selAreas);

    if (selTemas.length > 0) {
      query = query.in('tema', selTemas);
    }

    const { count } = await query;

    const { error } = await supabase.from('flashcards_decks').insert({
      user_id: auth.user.id,
      nome: nome.trim(),
      descricao: selTemas.length > 0 ? selTemas.join(' · ') : selAreas.join(' · '),
      filtros: { areas: selAreas, temas: selTemas },
      total_cards: count ?? 0,
    });

    setSalvando(false);
    if (error) { toast.error('Não foi possível criar o deck'); return; }
    toast.success('Deck criado com sucesso!');
    setAberto(false);
    resetWizard();
    carregar();
  };

  const excluir = async (id: string) => {
    const { error } = await supabase.from('flashcards_decks').delete().eq('id', id);
    if (error) { toast.error('Não foi possível excluir'); return; }
    setDecks((d) => d.filter((x) => x.id !== id));
  };

  const estudar = (d: Deck) => {
    const areasDeck: string[] = d.filtros?.areas || [];
    const temasDeck: string[] = d.filtros?.temas || [];
    
    const params = new URLSearchParams();
    if (areasDeck.length > 0) {
      params.set('areas', areasDeck.join('|'));
    }
    if (temasDeck.length > 0) {
      params.set('temas', temasDeck.join('|'));
    }
    navigate(`/flashcards/estudar?${params.toString()}`);
  };

  return (
    <div className="min-h-dvh bg-background pb-28 lg:pb-12 pt-[calc(0.5rem+var(--sai-top,env(safe-area-inset-top,0px)))]">
      <div className="mx-auto w-full max-w-2xl lg:max-w-7xl 2xl:max-w-[1600px] px-3 sm:px-6 lg:px-8">
        <PageHeader
          title="Meus Decks Customizados"
          subtitle="Monte combinações personalizadas de matérias para treinar"
          onBack={() => navigate('/flashcards')}
        />

        <div className="space-y-5 pt-3">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border/80 shadow-sm">
            <div>
              <p className="text-sm font-extrabold text-foreground">Criar Novo Deck Personalizado</p>
              <p className="text-xs text-muted-foreground">Monte seu deck em 3 etapas simples (Áreas → Matérias → Nome)</p>
            </div>

            <Dialog open={aberto} onOpenChange={(v) => { setAberto(v); if (!v) resetWizard(); }}>
              <DialogTrigger asChild>
                <Button className="rounded-xl px-5 font-extrabold gap-2 bg-primary text-white shadow-md">
                  <Plus className="h-4 w-4" /> Novo Deck
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85dvh] overflow-y-auto rounded-3xl border-border sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between text-base font-black">
                    <span>
                      {etapa === 1 && 'Etapa 1 de 3: Escolha as Áreas'}
                      {etapa === 2 && 'Etapa 2 de 3: Escolha as Matérias'}
                      {etapa === 3 && 'Etapa 3 de 3: Nome do Deck'}
                    </span>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                      {etapa}/3
                    </span>
                  </DialogTitle>
                </DialogHeader>

                {/* ETAPA 1: Selecionar Áreas */}
                {etapa === 1 && (
                  <div className="space-y-4 pt-2">
                    <p className="text-xs text-muted-foreground font-medium">
                      Selecione uma ou mais áreas jurídicas principais para compor o seu deck:
                    </p>
                    <div className="flex flex-wrap gap-2 max-h-[50dvh] overflow-y-auto pr-1">
                      {areas.map((a) => {
                        const on = selAreas.includes(a);
                        return (
                          <button
                            key={a}
                            type="button"
                            onClick={() => {
                              haptic.selection();
                              setSelAreas((s) => (on ? s.filter((x) => x !== a) : [...s, a]));
                            }}
                            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all flex items-center gap-1.5 ${
                              on
                                ? 'bg-primary text-white shadow-md scale-105 ring-2 ring-primary/30'
                                : 'border border-border/80 bg-card text-foreground hover:border-primary/40'
                            }`}
                          >
                            {on && <Check className="h-3.5 w-3.5" />}
                            <span>{a}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ETAPA 2: Selecionar Matérias/Tópicos */}
                {etapa === 2 && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground font-medium">
                        Escolha matérias específicas ou mantenha todas selecionadas:
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (selTemas.length === temasDisponiveis.length) {
                            setSelTemas([]);
                          } else {
                            setSelTemas(temasDisponiveis.map((t) => t.tema));
                          }
                        }}
                        className="text-[11px] font-black text-primary hover:underline shrink-0"
                      >
                        {selTemas.length === temasDisponiveis.length ? 'Desmarcar Todos' : 'Marcar Todos'}
                      </button>
                    </div>

                    {loadingTemas ? (
                      <div className="py-10 text-center text-xs text-muted-foreground animate-pulse">
                        Carregando matérias das áreas escolhidas…
                      </div>
                    ) : temasDisponiveis.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground">
                        Todas as matérias das áreas selecionadas serão incluídas automaticamente.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 max-h-[50dvh] overflow-y-auto pr-1">
                        {temasDisponiveis.map((t) => {
                          const on = selTemas.includes(t.tema);
                          return (
                            <button
                              key={`${t.area}::${t.tema}`}
                              type="button"
                              onClick={() => {
                                haptic.selection();
                                setSelTemas((s) => (on ? s.filter((x) => x !== t.tema) : [...s, t.tema]));
                              }}
                              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                on
                                  ? 'bg-primary/90 text-white shadow-sm font-bold'
                                  : 'border border-border/80 bg-card text-foreground hover:border-primary/40'
                              }`}
                            >
                              {on && <Check className="h-3.5 w-3.5" />}
                              <span>{t.tema}</span>
                              <span className="text-[10px] opacity-75 tabular-nums">({t.count})</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ETAPA 3: Nome do Deck & Confirmar */}
                {etapa === 3 && (
                  <div className="space-y-4 pt-2">
                    <p className="text-xs text-muted-foreground font-medium">
                      Defina um nome identificador para o seu novo deck:
                    </p>
                    <Input
                      autoFocus
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Ex: Combo Civil + Penal para Prova"
                      className="rounded-2xl h-12 text-sm font-bold"
                    />

                    <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-2">
                      <p className="text-xs font-extrabold uppercase text-muted-foreground tracking-widest">Resumo do Deck</p>
                      <p className="text-xs text-foreground font-bold">
                        Áreas: <span className="text-primary">{selAreas.join(', ')}</span>
                      </p>
                      <p className="text-xs text-foreground font-semibold">
                        Matérias: <span className="text-muted-foreground">{selTemas.length > 0 ? selTemas.join(', ') : 'Todas as matérias incluídas'}</span>
                      </p>
                    </div>
                  </div>
                )}

                <DialogFooter className="flex items-center justify-between gap-2 pt-3 border-t border-border/60">
                  {etapa > 1 ? (
                    <Button variant="outline" onClick={() => setEtapa((e) => (e - 1) as any)} className="rounded-xl font-bold gap-1">
                      <ChevronLeft className="h-4 w-4" /> Voltar
                    </Button>
                  ) : <div />}

                  {etapa === 1 && (
                    <Button onClick={avançarParaEtapa2} disabled={!selAreas.length} className="rounded-xl font-bold gap-1 bg-primary text-white">
                      Próximo: Matérias <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}

                  {etapa === 2 && (
                    <Button onClick={avançarParaEtapa3} className="rounded-xl font-bold gap-1 bg-primary text-white">
                      Próximo: Nome <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}

                  {etapa === 3 && (
                    <Button onClick={criar} disabled={salvando} className="rounded-xl font-black gap-2 bg-primary text-white shadow-md">
                      {salvando ? 'Criando…' : '🚀 Salvar Deck'}
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {!decks.length && (
            <div className="rounded-3xl border border-border bg-card p-12 text-center text-muted-foreground">
              <FolderPlus className="mx-auto mb-3 h-12 w-12 text-primary" />
              <p className="text-base font-extrabold text-foreground">Nenhum deck criado ainda.</p>
              <p className="mt-1 text-xs text-muted-foreground">Crie um deck personalizado combinando as áreas e matérias que deseja focar.</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {decks.map((d) => (
              <div key={d.id} className="group rounded-2xl border border-border/80 bg-card p-3 shadow-sm hover:border-primary/50 transition-all flex flex-col gap-2 relative">
                <div className="absolute -top-2.5 -right-2">
                  <span className="inline-flex items-center justify-center bg-primary text-white text-[9px] font-black h-5 px-2 rounded-full shadow-md">
                    {d.total_cards}
                  </span>
                </div>
                <div className="flex justify-center mb-1">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FolderPlus className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="text-center min-w-0 flex-1 flex items-center justify-center">
                  <p className="text-[11px] font-extrabold text-foreground leading-tight line-clamp-2">{d.nome}</p>
                </div>
                <div className="flex items-center gap-1 mt-auto pt-2 border-t border-border/60">
                  <Button size="sm" className="flex-1 h-7 text-[10px] rounded-lg font-bold gap-1 px-0 bg-primary text-white" onClick={() => estudar(d)}>
                    <Play className="h-3 w-3 fill-white" /> Treinar
                  </Button>
                  <Button size="icon" variant="outline" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:border-destructive/40 shrink-0" onClick={() => excluir(d.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <FlashcardsBottomNav />
    </div>
  );
};

export default FlashcardsDecks;
