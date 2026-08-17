import { useEffect, useState } from 'react';
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
  { id: 'pdf', title: 'Documentos PDF', sources: ['pdf', 'documento'] },
  { id: 'youtube', title: 'Vídeo YouTube', sources: ['youtube', 'video'] },
  { id: 'audio', title: 'Áudios', sources: ['audio'] },
  { id: 'imagem', title: 'Imagens', sources: ['imagem', 'image'] },
];

export default function FlashcardsPersonalizado() {
  const navigate = useNavigate();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [offlineDecks, setOfflineDecks] = useState<Deck[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null);

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
    if (['youtube', 'video'].includes(tipo)) return <Youtube className="w-8 h-8" style={{ color: '#EF4444' }} strokeWidth={1.5} />;
    if (['imagem', 'image'].includes(tipo)) return <ImageIcon className="w-8 h-8" style={{ color: '#F97316' }} strokeWidth={1.5} />;
    if (['audio'].includes(tipo)) return <Mic className="w-8 h-8" style={{ color: '#A855F7' }} strokeWidth={1.5} />;
    return <FileText className="w-8 h-8" style={{ color: '#3B82F6' }} strokeWidth={1.5} />;
  };

  const decksFiltrados = categoriaSelecionada 
    ? offlineDecks.filter(d => {
        const cat = CATEGORIAS.find(c => c.id === categoriaSelecionada);
        return cat?.sources.includes(d.filtros?.source || 'pdf');
      })
    : [];

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
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground">Categorias</h3>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {CATEGORIAS.map((cat) => {
                  const count = offlineDecks.filter(d => cat.sources.includes(d.filtros?.source || 'pdf')).length;
                  const colors = getTypeColors(cat.id);
                  
                  return (
                    <div 
                      key={cat.id}
                      onClick={() => {
                        haptic.selection();
                        setCategoriaSelecionada(cat.id);
                      }}
                      className="relative flex flex-col items-start p-5 rounded-3xl border border-border/50 bg-card/30 backdrop-blur-xl transition-all duration-300 hover:border-border hover:bg-card/50 cursor-pointer"
                    >
                      <div className="mb-4">
                        {renderIcon(cat.id)}
                      </div>
                      <h4 className="font-bold text-foreground text-sm sm:text-base leading-tight uppercase mb-1">{cat.title}</h4>
                      <p className="text-xs text-muted-foreground font-medium">
                        {count} {count === 1 ? 'deck' : 'decks'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground">Meus Decks</h3>
                <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                  {decksFiltrados.length} encontrados
                </span>
              </div>

              {decksFiltrados.length === 0 ? (
                <div className="rounded-3xl border border-border bg-card p-10 text-center mt-6">
                  <p className="text-base font-extrabold text-foreground">Nenhum deck encontrado.</p>
                  <p className="mt-1 text-sm text-muted-foreground">Clique no botão flutuante para gerar um novo deck.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {decksFiltrados.map((deck) => {
                    const deckTipo = deck.filtros?.source || 'pdf';
                    const colors = getTypeColors(deckTipo);
                    return (
                      <div 
                        key={deck.id}
                        onClick={() => {
                          haptic.selection();
                          navigate(`/flashcards/estudar?deck=${deck.id}&cor=${encodeURIComponent(colors.hex)}`);
                        }}
                        className="group relative p-4 bg-card/60 border border-border/80 rounded-2xl hover:border-emerald-500/50 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className={`p-2 rounded-xl ${colors.iconBg}`}>
                            {renderIcon(deckTipo)}
                          </div>
                          
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
                        <h4 className="font-bold text-foreground text-base leading-tight mb-2 pr-6 line-clamp-2">{deck.nome}</h4>
                        <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5 mt-auto">
                          <Layers className="w-3.5 h-3.5" />
                          {deck.total_cards} flashcards gerados
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

      </div>

      <button
        onClick={() => { haptic.selection(); setWizardOpen(true); }}
        className="fixed bottom-[calc(2rem+env(safe-area-inset-bottom,0px))] right-6 z-50 w-14 h-14 bg-[#36AF85] hover:bg-[#2b8c6a] rounded-full flex items-center justify-center shadow-lg shadow-[#36AF85]/30 active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      <WizardFlashcardsIA open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}
