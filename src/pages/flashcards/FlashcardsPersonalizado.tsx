import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Plus, FileText, Layers, Youtube, Mic, ImageIcon } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import WizardFlashcardsIA from '@/components/flashcards/WizardFlashcardsIA';
import { getOfflineDecks, Deck } from '@/lib/flashcardsOfflineManager';

// Placeholder for custom decks until backend is ready
const MOCK_DECKS = [
  { id: '1', nome: 'Resumo PDF Penal', data: 'Hoje', cards: 45, tipo: 'pdf' },
  { id: '2', nome: 'Aula Youtube - Direitos Políticos', data: 'Ontem', cards: 112, tipo: 'youtube' },
];

export default function FlashcardsPersonalizado() {
  const navigate = useNavigate();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [offlineDecks, setOfflineDecks] = useState<Deck[]>([]);

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

  // Junta os decks reais com os mocks
  const todosDecks = [
    ...offlineDecks.map(d => ({
      id: d.id,
      nome: d.nome,
      data: 'Hoje',
      cards: d.total_cards,
      tipo: d.filtros?.source || 'youtube'
    })),
    ...MOCK_DECKS
  ];

  const getTypeColors = (tipo: string) => {
    switch (tipo) {
      case 'youtube':
      case 'video':
        return {
          bg: 'bg-red-500/5 hover:bg-red-500/10',
          border: 'border-red-500/20 hover:border-red-500/50',
          iconBg: 'bg-red-500/10 text-red-500',
        };
      case 'imagem':
      case 'image':
        return {
          bg: 'bg-orange-500/5 hover:bg-orange-500/10',
          border: 'border-orange-500/20 hover:border-orange-500/50',
          iconBg: 'bg-orange-500/10 text-orange-500',
        };
      case 'audio':
        return {
          bg: 'bg-purple-500/5 hover:bg-purple-500/10',
          border: 'border-purple-500/20 hover:border-purple-500/50',
          iconBg: 'bg-purple-500/10 text-purple-500',
        };
      case 'pdf':
      case 'documento':
      default:
        return {
          bg: 'bg-blue-500/5 hover:bg-blue-500/10',
          border: 'border-blue-500/20 hover:border-blue-500/50',
          iconBg: 'bg-blue-500/10 text-blue-500',
        };
    }
  };

  const renderIcon = (tipo: string) => {
    switch (tipo) {
      case 'youtube':
      case 'video': return <Youtube className="w-5 h-5" />;
      case 'imagem':
      case 'image': return <ImageIcon className="w-5 h-5" />;
      case 'audio': return <Mic className="w-5 h-5" />;
      case 'pdf':
      case 'documento':
      default: return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-dvh bg-background pb-[calc(5rem+env(safe-area-inset-bottom,0px))] overflow-x-hidden">
      <div className="mx-auto w-full max-w-2xl lg:max-w-7xl 2xl:max-w-[1600px] px-3 sm:px-6 lg:px-8">
        <PageHeader
          title="Decks Personalizados"
          subtitle="Gere flashcards a partir dos seus PDFs, áudios e vídeos"
          onBack={() => navigate('/flashcards')}
        />

        {/* List of Custom Decks */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground">Meus Decks</h3>
          </div>
          
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {todosDecks.map((deck) => {
              const colors = getTypeColors(deck.tipo);
              return (
                <div 
                  key={deck.id}
                  onClick={() => {
                    haptic.selection();
                    navigate(`/flashcards/estudar?deck=${deck.id}`);
                  }}
                  className={`group p-4 ${colors.bg} border ${colors.border} rounded-2xl transition-all cursor-pointer shadow-sm hover:shadow-md`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className={`p-2 rounded-xl ${colors.iconBg}`}>
                      {renderIcon(deck.tipo)}
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-background/50 px-2 py-1 rounded-md">
                      {deck.data}
                    </span>
                  </div>
                  <h4 className="font-bold text-foreground text-base leading-tight mb-1 line-clamp-2">{deck.nome}</h4>
                  <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5 mt-2">
                    <Layers className="w-3.5 h-3.5" />
                    {deck.cards} flashcards gerados
                  </p>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Botão Flutuante (FAB) */}
      <button
        onClick={() => { haptic.selection(); setWizardOpen(true); }}
        className="fixed bottom-[calc(2rem+env(safe-area-inset-bottom,0px))] right-6 z-50 w-14 h-14 bg-[#36AF85] hover:bg-[#2b8c6a] rounded-full flex items-center justify-center shadow-lg shadow-[#36AF85]/30 active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {wizardOpen && <WizardFlashcardsIA open={wizardOpen} onOpenChange={setWizardOpen} />}
    </div>
  );
}
