import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Plus, FileText, Layers, Youtube, Mic, ImageIcon, Trash2 } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import WizardFlashcardsIA from '@/components/flashcards/WizardFlashcardsIA';
import { getOfflineDecks, saveOfflineDecks, Deck } from '@/lib/flashcardsOfflineManager';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const CATEGORIAS = [
  { id: 'pdf', title: 'Documento PDF', sources: ['pdf', 'documento'] },
  { id: 'youtube', title: 'Vídeo YouTube', sources: ['youtube', 'video'] },
  { id: 'audio', title: 'Áudio', sources: ['audio'] },
  { id: 'imagem', title: 'Imagens', sources: ['imagem', 'image'] },
];

export default function FlashcardsPersonalizado() {
  const navigate = useNavigate();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardSource, setWizardSource] = useState<'pdf' | 'image' | 'youtube' | 'audio' | null>(null);
  const [offlineDecks, setOfflineDecks] = useState<Deck[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null);
  const [dataSelecionada, setDataSelecionada] = useState<string>('Todas');

  useEffect(() => {
    document.title = 'Personalizado | Flashcards';
    setOfflineDecks(getOfflineDecks());
  }, []);

  // Recarregar os decks quando o modal fechar
  useEffect(() => {
    if (!wizardOpen) {
      setOfflineDecks(getOfflineDecks());
    }
  }, [wizardOpen]);

  const handleDeleteDeck = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    haptic.medium();
    const newDecks = offlineDecks.filter(d => d.id !== id);
    setOfflineDecks(newDecks);
    saveOfflineDecks(newDecks);
  };

  const getTypeColors = (tipo: string) => {
    if (['youtube', 'video'].includes(tipo)) {
      return { hex: '#EF4444', iconBg: 'bg-red-500/10 text-red-500' };
    }
    if (['imagem', 'image'].includes(tipo)) {
      return { hex: '#F97316', iconBg: 'bg-orange-500/10 text-orange-500' };
    }
    if (['audio'].includes(tipo)) {
      return { hex: '#A855F7', iconBg: 'bg-purple-500/10 text-purple-500' };
    }
    return { hex: '#3B82F6', iconBg: 'bg-blue-500/10 text-blue-500' };
  };

  const renderIcon = (tipo: string) => {
    if (['youtube', 'video'].includes(tipo)) return <Youtube className="w-6 h-6" style={{ color: '#EF4444' }} strokeWidth={1.5} />;
    if (['imagem', 'image'].includes(tipo)) return <ImageIcon className="w-6 h-6" style={{ color: '#F97316' }} strokeWidth={1.5} />;
    if (['audio'].includes(tipo)) return <Mic className="w-6 h-6" style={{ color: '#A855F7' }} strokeWidth={1.5} />;
    return <FileText className="w-6 h-6" style={{ color: '#3B82F6' }} strokeWidth={1.5} />;
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Hoje';
    const date = new Date(isoString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Hoje';
    if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  // Filtragem para a view de Categoria
  const decksDaCategoria = useMemo(() => {
    return categoriaSelecionada 
      ? offlineDecks.filter(d => {
          const cat = CATEGORIAS.find(c => c.id === categoriaSelecionada);
          return cat?.sources.includes(d.filtros?.source || 'pdf');
        })
      : [];
  }, [offlineDecks, categoriaSelecionada]);

  const datasDisponiveis = useMemo(() => {
    const dates = decksDaCategoria.map(d => formatDate(d.created_at));
    return ['Todas', ...Array.from(new Set(dates))];
  }, [decksDaCategoria]);

  const decksFiltrados = useMemo(() => {
    if (dataSelecionada === 'Todas') return decksDaCategoria;
    return decksDaCategoria.filter(d => formatDate(d.created_at) === dataSelecionada);
  }, [decksDaCategoria, dataSelecionada]);

  // Lista de Recentes global
  const recentesGeral = offlineDecks.slice(0, 10);

  const renderDeckCard = (deck: Deck) => {
    const deckTipo = deck.filtros?.source || 'pdf';
    const colors = getTypeColors(deckTipo);
    return (
      <div 
        key={deck.id}
        onClick={() => {
          haptic.selection();
          navigate(`/flashcards/estudar?deck=${deck.id}&cor=${encodeURIComponent(colors.hex)}`);
        }}
        className="group relative p-4 bg-card border border-border/80 rounded-2xl hover:border-emerald-500/50 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between"
      >
        <div className="flex justify-between items-start mb-3">
          <div className={`p-2 rounded-xl ${colors.iconBg}`}>
            {renderIcon(deckTipo)}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-background/50 px-2 py-1 rounded-md border border-border/50">
              {formatDate(deck.created_at)}
            </span>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 text-muted-foreground hover:text-red-500 bg-background/50 hover:bg-red-500/10 rounded-md transition-colors"
                  aria-label="Excluir deck"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir deck?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir "{deck.nome}"? Esta ação não pode ser desfeita e os flashcards serão apagados do seu dispositivo.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={(e) => handleDeleteDeck(e, deck.id)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <h4 className="font-bold text-foreground text-base leading-tight mb-2 pr-6 line-clamp-2">{deck.nome}</h4>
        <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5 mt-auto">
          <Layers className="w-3.5 h-3.5" />
          {deck.total_cards} flashcards gerados
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-dvh bg-background pb-[calc(5rem+env(safe-area-inset-bottom,0px))] overflow-x-hidden">
      <div className="mx-auto w-full max-w-2xl lg:max-w-7xl 2xl:max-w-[1600px] px-3 sm:px-6 lg:px-8">
        
        {categoriaSelecionada ? (
          <PageHeader
            title={CATEGORIAS.find(c => c.id === categoriaSelecionada)?.title || 'Decks'}
            onBack={() => {
              haptic.selection();
              setCategoriaSelecionada(null);
            }}
          />
        ) : (
          <PageHeader
            title="Decks Personalizados"
            subtitle="Gere flashcards a partir dos seus PDFs, áudios e vídeos"
            onBack={() => navigate('/flashcards')}
          />
        )}

        <div className="mt-6">
          {!categoriaSelecionada ? (
            <>
              {/* CATEGORIAS GRID */}
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground">Categorias</h3>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
                {CATEGORIAS.map((cat) => {
                  const count = offlineDecks.filter(d => cat.sources.includes(d.filtros?.source || 'pdf')).length;
                  
                  return (
                    <div 
                      key={cat.id}
                      onClick={() => {
                        haptic.selection();
                        setCategoriaSelecionada(cat.id);
                        setDataSelecionada('Todas');
                      }}
                      className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col items-start gap-3 hover:border-[#36AF85]/50 transition-all cursor-pointer active:scale-95 relative"
                    >
                      <div className="mb-1">
                        {renderIcon(cat.id)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm sm:text-base text-foreground uppercase">{cat.title}</h4>
                        <p className="text-[11px] sm:text-xs font-medium text-muted-foreground mt-0.5">
                          {count} {count === 1 ? 'deck gerado' : 'decks gerados'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* RECENTES */}
              {recentesGeral.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground">Recentes</h3>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {recentesGeral.map(renderDeckCard)}
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              {/* FILTRO DE DATAS (HORIZONTAL SCROLL) */}
              {datasDisponiveis.length > 1 && (
                <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-6 pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
                  {datasDisponiveis.map((data) => (
                    <button
                      key={data}
                      onClick={() => {
                        haptic.selection();
                        setDataSelecionada(data);
                      }}
                      className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${
                        dataSelecionada === data 
                          ? 'bg-[#36AF85] text-white shadow-md' 
                          : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {data}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground">Decks Gerados</h3>
                <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                  {decksFiltrados.length} {decksFiltrados.length === 1 ? 'encontrado' : 'encontrados'}
                </span>
              </div>

              {decksFiltrados.length === 0 ? (
                <div className="rounded-3xl border border-border bg-card p-10 text-center mt-6">
                  <p className="text-base font-extrabold text-foreground">Nenhum deck encontrado.</p>
                  <p className="mt-1 text-sm text-muted-foreground">Clique no botão flutuante para gerar um novo deck.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {decksFiltrados.map(renderDeckCard)}
                </div>
              )}
            </>
          )}
        </div>

      </div>

      <button
        onClick={() => {
          haptic.selection();
          if (categoriaSelecionada) {
            const mapped = categoriaSelecionada === 'imagem' ? 'image' : categoriaSelecionada;
            setWizardSource(mapped as any);
          } else {
            setWizardSource(null);
          }
          setWizardOpen(true);
        }}
        className="fixed bottom-[calc(2rem+env(safe-area-inset-bottom,0px))] right-6 z-50 w-14 h-14 bg-[#36AF85] hover:bg-[#2b8c6a] rounded-full flex items-center justify-center shadow-lg shadow-[#36AF85]/30 active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      <WizardFlashcardsIA open={wizardOpen} onOpenChange={setWizardOpen} initialSource={wizardSource} />
    </div>
  );
}
