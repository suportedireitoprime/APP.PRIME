import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/vademecum/PageHeader';
import FlashcardsBottomNav from '@/components/flashcards/FlashcardsBottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Play, Trash2, FolderPlus, ChevronRight, ChevronLeft, Check, Sparkles, Layers, CloudDownload } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { haptic } from '@/lib/nativeHaptics';
import { syncDecksOffline, Deck, saveOfflineDecks } from '@/lib/flashcardsOfflineManager';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { StepRow, SelecaoSheet } from '@/components/flashcards/FlashcardsFiltroSheet';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import FlashcardsEstudo from './FlashcardsEstudo';

type TemaItem = { tema: string; area: string; count: number };

const CORES = [
  { nome: 'Azul', hex: '#3b82f6' },
  { nome: 'Esmeralda', hex: '#10b981' },
  { nome: 'Roxo', hex: '#a855f7' },
  { nome: 'Laranja', hex: '#f97316' },
  { nome: 'Rosa', hex: '#ec4899' },
  { nome: 'Vermelho', hex: '#ef4444' },
];

const FlashcardsDecks = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isStudying = params.has('areas') || params.has('temas') || params.has('deck');

  // Redireciona para mobile se diminuir a tela com deck aberto
  useEffect(() => {
    if (!isDesktop && isStudying) {
      navigate(`/flashcards/estudar?${params.toString()}`);
    }
  }, [isDesktop, isStudying, params, navigate]);
  
  // Estados do Wizard em 3 Etapas
  const [aberto, setAberto] = useState(false);
  const [etapa, setEtapa] = useState<1 | 2 | 3>(1);
  const [selAreas, setSelAreas] = useState<string[]>([]);
  const [temasDisponiveis, setTemasDisponiveis] = useState<TemaItem[]>([]);
  const [selTemas, setSelTemas] = useState<string[]>([]);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [loadingTemas, setLoadingTemas] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const online = useOnlineStatus();
  const [syncing, setSyncing] = useState(false);

  const [passoAberto, setPassoAberto] = useState<'areas' | 'temas' | null>(null);

  const carregar = async () => {
    setSyncing(true);
    const data = await syncDecksOffline();
    setDecks(data);
    setSyncing(false);
  };

  useEffect(() => {
    carregar();
    supabase.rpc('flashcards_resumo_areas').then(({ data }) => {
      if (data) setAreas((data as any[]).map((a) => a.area).sort((a, b) => a.localeCompare(b, 'pt-BR')));
    });
  }, []);

  useEffect(() => {
    if (selAreas.length > 0) {
      setLoadingTemas(true);
      supabase
        .from('flashcards_cards')
        .select('tema, area')
        .in('area', selAreas)
        .not('tema', 'is', null)
        .then(({ data }) => {
          if (data) {
            const mapa = new Map<string, TemaItem>();
            data.forEach((item) => {
              if (item.tema) {
                const key = `${item.area}::${item.tema}`;
                const prev = mapa.get(key);
                if (prev) prev.count++;
                else mapa.set(key, { tema: item.tema, area: item.area, count: 1 });
              }
            });
            setTemasDisponiveis(Array.from(mapa.values()).sort((a, b) => a.tema.localeCompare(b.tema, 'pt-BR')));
          }
          setLoadingTemas(false);
        });
    } else {
      setTemasDisponiveis([]);
      setSelTemas([]);
    }
  }, [selAreas]);

  const resetWizard = () => {
    setSelAreas([]);
    setSelTemas([]);
    setNome('');
    setDescricao('');
    setPassoAberto(null);
  };

  const criar = async () => {
    if (!nome.trim() || !selAreas.length) {
      toast.error('Preencha o nome e selecione ao menos uma área');
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

    const corEscolhida = CORES[decks.length % CORES.length].hex;

    const novoDeck = {
      user_id: auth.user.id,
      nome: nome.trim(),
      descricao: descricao.trim() || (selTemas.length > 0 ? selTemas.join(' · ') : selAreas.join(' · ')),
      filtros: { areas: selAreas, temas: selTemas, cor: corEscolhida },
      total_cards: count ?? 0,
    };

    const { data: insertedDeck, error } = await supabase.from('flashcards_decks').insert(novoDeck).select().single();

    setSalvando(false);
    if (error) { toast.error('Não foi possível criar o deck'); return; }
    
    toast.success('Deck criado com sucesso!');
    setAberto(false);
    resetWizard();
    
    if (insertedDeck) {
      // Optimistic UI Update: Mostra instantaneamente antes do fetch completo
      setDecks([insertedDeck as any, ...decks]);
    }
    
    // Dispara a sincronização de cache offline em background
    carregar();
  };

  const excluir = async (id: string) => {
    if (!online) {
      toast.error('Você precisa de internet para excluir decks.');
      return;
    }
    const { error } = await supabase.from('flashcards_decks').delete().eq('id', id);
    if (error) { toast.error('Não foi possível excluir'); return; }
    
    const novosDecks = decks.filter((x) => x.id !== id);
    setDecks(novosDecks);
    saveOfflineDecks(novosDecks);
  };

  const estudar = (d: Deck) => {
    const areasDeck: string[] = d.filtros?.areas || [];
    const temasDeck: string[] = d.filtros?.temas || [];
    const corDeck = d.filtros?.cor || '#10b981';
    
    const nextParams = new URLSearchParams();
    if (areasDeck.length > 0) nextParams.set('areas', areasDeck.join('|'));
    if (temasDeck.length > 0) nextParams.set('temas', temasDeck.join('|'));
    nextParams.set('cor', corDeck);
    
    if (isDesktop) {
      setParams(nextParams);
    } else {
      navigate(`/flashcards/estudar?${nextParams.toString()}`);
    }
  };

  const proximoPasso = !selAreas.length ? 'areas' : 'temas';

  const contentList = (
    <div className="mx-auto w-full max-w-2xl lg:max-w-7xl 2xl:max-w-[1600px] px-3 sm:px-6 lg:px-8">
      <PageHeader
        title="Meus Decks Customizados"
          subtitle="Monte combinações personalizadas de matérias para treinar"
          onBack={() => navigate('/flashcards')}
          rightAction={
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-10 text-[11px] font-bold gap-1 rounded-full px-3 hidden sm:flex"
                onClick={() => { haptic.selection(); carregar(); }}
                disabled={syncing}
              >
                <CloudDownload className={`h-4 w-4 ${syncing ? 'animate-pulse' : ''}`} />
                {syncing ? 'Sincronizando...' : 'Disponibilizar Offline'}
              </Button>
              <button 
                onClick={() => { haptic.selection(); setAberto(true); }} 
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-md active:scale-95 transition-transform shrink-0"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          }
        />

        {/* Mobile sync button shown below header */}
        <div className="sm:hidden px-1 pt-2 pb-1">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs font-bold gap-2 rounded-xl h-10 border-border/80 bg-card text-muted-foreground"
            onClick={() => { haptic.selection(); carregar(); }}
            disabled={syncing}
          >
            <CloudDownload className={`h-4 w-4 ${syncing ? 'animate-pulse' : ''}`} />
            {syncing ? 'Baixando atualizações...' : 'Disponibilizar Decks Offline'}
          </Button>
        </div>

        <div className="space-y-5 pt-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Dialog open={aberto} onOpenChange={(v) => { setAberto(v); if (!v) resetWizard(); }}>
              <DialogContent className="max-h-[85dvh] h-full overflow-hidden p-0 rounded-3xl border-border sm:max-w-lg flex flex-col">
                <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/60">
                  <DialogTitle className="flex items-center justify-between text-base font-black">
                    <span>Criar Novo Deck</span>
                  </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                  <StepRow
                    step={1} label="Áreas"
                    hint={selAreas.length ? `${selAreas.length} selecionada(s)` : 'Escolha as áreas'}
                    active={proximoPasso === 'areas'} done={!!selAreas.length}
                    badge={selAreas.length}
                    onClick={() => setPassoAberto('areas')}
                  />
                  
                  <StepRow
                    step={2} label="Matérias (Opcional)"
                    hint={selTemas.length ? `${selTemas.length} selecionada(s)` : (loadingTemas ? 'Carregando temas...' : 'Todas as matérias das áreas')}
                    locked={!selAreas.length} active={proximoPasso === 'temas'} done={!!selTemas.length}
                    badge={selTemas.length || undefined}
                    lockedMessage="Escolha a área primeiro."
                    onClick={() => setPassoAberto('temas')}
                  />

                  <div className="pt-4 px-1 space-y-4">
                    <div>
                      <p className="text-[13px] text-foreground font-bold mb-1.5 flex items-center gap-1.5">
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-zinc-800 text-[10px] font-black tabular-nums text-zinc-300">3</span> Nome do Deck
                      </p>
                      <Input
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Ex: Combo Civil + Penal"
                        className="rounded-2xl h-12 text-sm font-bold bg-zinc-900/50 border-zinc-800/80"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1.5 px-1">
                        Descrição (opcional):
                      </p>
                      <Input
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        placeholder="Ex: Focado nos assuntos da prova X"
                        className="rounded-2xl h-11 text-xs bg-zinc-900/50 border-zinc-800/80"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="px-4 pb-5 pt-3 border-t border-border/60">
                  <Button onClick={criar} disabled={salvando || !selAreas.length || !nome.trim()} className="w-full h-12 rounded-2xl font-black gap-2 bg-[#36AF85] hover:bg-[#2C9570] text-white shadow-lg shadow-black/40 text-[15px] active:scale-[0.98] transition-all">
                    {salvando ? 'Criando…' : '🚀 Salvar Deck'}
                  </Button>
                </DialogFooter>

                {passoAberto === 'areas' && (
                  <SelecaoSheet
                    titulo="Selecionar Áreas"
                    opcoes={areas}
                    selecionado={selAreas}
                    buscavel
                    onFechar={() => setPassoAberto(null)}
                    onConfirmar={(v) => { setSelAreas(v); setPassoAberto(null); }}
                  />
                )}

                {passoAberto === 'temas' && (
                  <SelecaoSheet
                    titulo="Selecionar Matérias"
                    opcoes={temasDisponiveis.map(t => t.tema)}
                    selecionado={selTemas}
                    buscavel
                    loading={loadingTemas}
                    onFechar={() => setPassoAberto(null)}
                    onConfirmar={(v) => { setSelTemas(v); setPassoAberto(null); }}
                    renderOpcao={(opcao) => {
                      const item = temasDisponiveis.find(t => t.tema === opcao);
                      return (
                        <div className="flex flex-col text-left">
                          <span className="text-[14px] font-bold text-zinc-200 line-clamp-1">{opcao}</span>
                          {item && (
                            <span className="text-[11px] text-zinc-500">
                              {item.area} <span className="mx-1">•</span> {item.count} cards
                            </span>
                          )}
                        </div>
                      );
                    }}
                  />
                )}
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

          <motion.div 
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.05 } }
            }}
          >
            {decks.map((d) => {
              const cor = d.filtros?.cor || '#10b981';
              return (
              <motion.div 
                key={d.id} 
                style={{ borderColor: `${cor}40` }} 
                className="group rounded-2xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-2 relative"
                variants={{
                  hidden: { opacity: 0, scale: 0.95, y: 10 },
                  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
                }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="absolute -top-2.5 -right-2">
                  <span style={{ backgroundColor: cor }} className="inline-flex items-center justify-center text-white text-[10px] font-black h-5 px-2 rounded-full shadow-md">
                    {d.total_cards}
                  </span>
                </div>
                <div className="flex justify-center mb-1">
                  <div style={{ backgroundColor: `${cor}15` }} className="w-12 h-12 rounded-xl flex items-center justify-center">
                    <FolderPlus style={{ color: cor }} className="w-6 h-6 transition-transform group-hover:scale-110" />
                  </div>
                </div>
                <div className="text-center min-w-0 flex-1 flex flex-col items-center justify-center">
                  <p className="text-[12px] font-extrabold text-foreground leading-tight line-clamp-2">{d.nome}</p>
                  {d.descricao && (
                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{d.descricao}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-auto pt-3 border-t border-border/60">
                  <motion.button whileTap={{ scale: 0.9 }} size="sm" style={{ backgroundColor: cor }} className="flex-1 flex items-center justify-center h-8 text-[11px] rounded-lg font-bold gap-1.5 px-0 text-white hover:opacity-90 shadow-sm focus-visible:outline-none" onClick={() => estudar(d)}>
                    <Play className="h-3.5 w-3.5 fill-white" /> Treinar
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} size="icon" variant="outline" className="flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:border-destructive/40 shrink-0 focus-visible:outline-none bg-background border border-border" onClick={() => excluir(d.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </motion.button>
                </div>
              </motion.div>
            )})}
          </motion.div>
        </div>
      </div>
  );

  if (isDesktop) {
    return (
      <div className="flex h-dvh overflow-hidden bg-background">
        <div className="w-[360px] xl:w-[420px] flex-shrink-0 overflow-y-auto overflow-x-hidden pb-10">
          {contentList}
        </div>
        <div className="flex-1 overflow-hidden relative border-l border-border/50">
          {isStudying ? (
            <FlashcardsEstudo embedded />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground bg-card/30">
              <FolderPlus className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-bold">Pronto para treinar?</p>
              <p className="text-sm">Selecione um deck na lista para iniciar sua sessão.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh overflow-x-hidden bg-background pb-[calc(7rem+var(--sai-bottom))] lg:pb-[calc(3rem+var(--sai-bottom))]">
      {contentList}
      <FlashcardsBottomNav />
    </div>
  );
};

export default FlashcardsDecks;
